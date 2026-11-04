#!/usr/bin/env bash
# =====================================================================
# Dev Supabase баазын тохиргоог шинэ production баазруу хуулах
#
# Хуулна:   roles, public схем (хүснэгт, index, RLS policy, функц, trigger, grant),
#           storage bucket + policy, pg_cron job-ууд, лавлах өгөгдөл (REF_TABLES),
#           Auth тохиргоо (SUPABASE_ACCESS_TOKEN өгсөн бол, нууц утгуудаас бусад)
# Хуулахгүй: хэрэглэгч, компани, зар, анкет зэрэг dev-ийн тест өгөгдөл, storage файлууд
#
# Шаардлага: Supabase CLI (`supabase db dump` нь Docker ажиллаж байхыг шаардана), psql, jq, curl
#
# Ашиглах:
#   export DEV_DB_URL='postgresql://postgres.<dev-ref>:<pass>@aws-0-<region>.pooler.supabase.com:5432/postgres'
#   export PROD_DB_URL='postgresql://postgres.<prod-ref>:<pass>@aws-0-<region>.pooler.supabase.com:5432/postgres'
#   # Auth тохиргоог хуулах бол (заавал биш):
#   export SUPABASE_ACCESS_TOKEN=sbp_...  DEV_REF=<dev-ref>  PROD_REF=<prod-ref>  PROD_SITE_URL=https://mstaffing.mn
#
#   scripts/supabase/clone-dev-to-prod.sh dump    # 1. dev-ээс файлууд гаргана (prod-д хүрэхгүй)
#   scripts/supabase/clone-dev-to-prod.sh apply   # 2. файлуудыг шалгасны дараа prod-д хэрэгжүүлнэ
#
# Холболтын мөрийг Dashboard → Connect → Session pooler (5432)-оос авна.
# =====================================================================
set -euo pipefail

OUT_DIR="${OUT_DIR:-supabase/.clone}"
# Production-д хуулах лавлах (контент) хүснэгтүүд
REF_TABLES="${REF_TABLES:-mt_address mt_skill mt_terms mt_privacy mt_tips mt_ads}"

die() { echo "Алдаа: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "$1 суулгаагүй байна"; }
q() { psql "$1" -X -q -At -v ON_ERROR_STOP=1 -c "$2"; }

dump() {
  need supabase; need psql
  [[ -n "${DEV_DB_URL:-}" ]] || die "DEV_DB_URL тохируулаагүй"
  mkdir -p "$OUT_DIR"
  echo "→ $OUT_DIR руу dev баазаас гаргаж байна"

  supabase db dump --db-url "$DEV_DB_URL" --role-only -f "$OUT_DIR/01_roles.sql"
  supabase db dump --db-url "$DEV_DB_URL" -f "$OUT_DIR/02_schema.sql"

  # Лавлах өгөгдөл: public-ийн бусад бүх хүснэгтийг хасаж dump хийнэ
  local all excludes=()
  all=$(q "$DEV_DB_URL" "select tablename from pg_tables where schemaname = 'public' order by 1")
  for t in $all; do
    [[ " $REF_TABLES " == *" $t "* ]] || excludes+=(-x "public.$t")
  done
  supabase db dump --db-url "$DEV_DB_URL" --data-only --use-copy -s public "${excludes[@]}" -f "$OUT_DIR/03_ref_data.sql"

  # Storage bucket + storage.objects policy
  {
    echo "-- storage bucket-ууд (dev-ээс)"
    q "$DEV_DB_URL" "
      select format(
        'insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (%L, %L, %L, %L, %L) '
        'on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;',
        id, name, public, file_size_limit, allowed_mime_types)
      from storage.buckets order by id"
    echo
    echo "-- storage.objects policy-ууд (dev-ээс)"
    q "$DEV_DB_URL" "
      select format('drop policy if exists %I on storage.objects;', policyname) || chr(10) ||
             format('create policy %I on storage.objects as %s for %s to %s', policyname, permissive, cmd, array_to_string(roles, ', '))
             || coalesce(' using (' || qual || ')', '')
             || coalesce(' with check (' || with_check || ')', '') || ';'
      from pg_policies where schemaname = 'storage' and tablename = 'objects' order by policyname"
  } > "$OUT_DIR/04_storage.sql"

  # pg_cron job-ууд
  {
    echo "create extension if not exists pg_cron with schema pg_catalog;"
    q "$DEV_DB_URL" "
      select format('select cron.unschedule(jobid) from cron.job where jobname = %L;', jobname) || chr(10) ||
             format('select cron.schedule(%L, %L, %L);', jobname, schedule, command)
      from cron.job where jobname is not null order by jobname" 2>/dev/null \
      || echo "-- dev дээр pg_cron асаагүй байна"
  } > "$OUT_DIR/05_cron.sql"

  # Auth тохиргоо (заавал биш) — нууц утгуудыг хасна
  if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" && -n "${DEV_REF:-}" ]]; then
    need curl; need jq
    curl -fsS -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
      "https://api.supabase.com/v1/projects/$DEV_REF/config/auth" \
      | jq 'with_entries(select(.value != null))
            | with_entries(select(.key | test("secret|pass|_key$|token|^uri_allow_list$|^site_url$") | not))' \
      > "$OUT_DIR/06_auth_config.json"
    echo "  Auth тохиргоо: $OUT_DIR/06_auth_config.json (site_url, redirect URL, нууц утгуудыг хассан)"
  else
    echo "  Auth тохиргоог алгаслаа (SUPABASE_ACCESS_TOKEN, DEV_REF тохируулаагүй)"
  fi

  echo
  echo "✓ Бэлэн. Файлуудыг шалгаад дараа нь: $0 apply"
  echo "  $OUT_DIR-г git-д оруулахгүй (.gitignore-д бий)."
}

apply() {
  need psql
  [[ -n "${PROD_DB_URL:-}" ]] || die "PROD_DB_URL тохируулаагүй"
  [[ -f "$OUT_DIR/02_schema.sql" ]] || die "Эхлээд '$0 dump' ажиллуулна уу"
  [[ "${PROD_DB_URL}" != "${DEV_DB_URL:-}" ]] || die "PROD_DB_URL нь DEV_DB_URL-тэй ижил байна"

  # Хоосон биш бааз руу андуурч хуулахаас сэргийлнэ
  local existing
  existing=$(q "$PROD_DB_URL" "select count(*) from pg_tables where schemaname = 'public'")
  [[ "$existing" == "0" ]] || die "Production-ийн public схемд $existing хүснэгт байна. Зөвхөн шинэ, хоосон бааз руу хуулна."

  local host
  host=$(sed -E 's#^.*@([^/?]+).*$#\1#' <<<"$PROD_DB_URL")
  read -r -p "Production бааз ($host) руу хуулах уу? 'yes' гэж бичнэ үү: " ok
  [[ "$ok" == "yes" ]] || die "Цуцаллаа"

  echo "→ Схем, лавлах өгөгдөл (нэг transaction)"
  psql "$PROD_DB_URL" -X --single-transaction -v ON_ERROR_STOP=1 \
    -f "$OUT_DIR/01_roles.sql" \
    -f "$OUT_DIR/02_schema.sql" \
    -c "set session_replication_role = replica" \
    -f "$OUT_DIR/03_ref_data.sql"

  echo "→ Storage bucket, policy"
  psql "$PROD_DB_URL" -X --single-transaction -v ON_ERROR_STOP=1 -f "$OUT_DIR/04_storage.sql"

  echo "→ pg_cron job-ууд"
  psql "$PROD_DB_URL" -X --single-transaction -v ON_ERROR_STOP=1 -f "$OUT_DIR/05_cron.sql"

  if [[ -f "$OUT_DIR/06_auth_config.json" && -n "${SUPABASE_ACCESS_TOKEN:-}" && -n "${PROD_REF:-}" ]]; then
    need curl; need jq
    echo "→ Auth тохиргоо"
    jq --arg site "${PROD_SITE_URL:-}" 'if $site != "" then . + {site_url: $site} else . end' "$OUT_DIR/06_auth_config.json" \
      | curl -fsS -X PATCH -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
          --data @- "https://api.supabase.com/v1/projects/$PROD_REF/config/auth" >/dev/null
  fi

  echo
  echo "→ Шалгалт (dev ба prod-ийн тоо таарах ёстой):"
  local check="select
    (select count(*) from pg_tables where schemaname = 'public') as tables,
    (select count(*) from pg_policies where schemaname in ('public', 'storage')) as policies,
    (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public') as functions,
    (select count(*) from storage.buckets) as buckets"
  [[ -n "${DEV_DB_URL:-}" ]] && echo "  dev : $(q "$DEV_DB_URL" "$check")"
  echo "  prod: $(q "$PROD_DB_URL" "$check")"
  echo "  cron: $(q "$PROD_DB_URL" "select string_agg(jobname || ' (' || schedule || ')', ', ') from cron.job")"
}

case "${1:-}" in
  dump) dump ;;
  apply) apply ;;
  *) echo "Ашиглах: $0 dump | apply"; exit 1 ;;
esac
