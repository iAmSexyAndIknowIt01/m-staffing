-- =====================================================================
-- «Зар нийтлэх эрх» → M токен
--
-- Багц нь зарын тоо биш, M токен өгнө (src/lib/planCatalog.ts):
--   M багц 15,000 · Стандарт 50,000 · Премиум 100,000 · Шинэ компани 0 (админ гараар олгоно)
-- Үйлдэл бүр өөр үнэтэй (TOKEN_COSTS):
--   зар нийтлэх / дахин нээх / сунгах — 1,000 · ажилтанд хүсэлт илгээх — 1,500
--
-- Зарцуулсан токен бүр tr_job_credit_usage-д (reason, tokens) мөрөөр бүртгэгдэнэ.
-- Ашигласан токен = тухайн багцын хугацаанд tokens-ийн нийлбэр (company_token_usage функц).
-- Өмнө нь зар нийтлэхэд мөр үүсгэдэггүй, mt_openjob-ийн тоогоор тооцдог байсныг
-- одоо байгаа зар бүрт 'post' мөр нэмж нэг дүрэмд шилжүүлнэ.
-- =====================================================================

begin;

-- 1. Багцын токены хэмжээ (хуучин job_limit-ийг 1,000-аар үржүүлнэ)
alter table public.mt_company_subscriptions add column if not exists token_limit integer;
update public.mt_company_subscriptions
   set token_limit = job_limit * 1000
 where token_limit is null;
-- Шинэ компанид автоматаар токен олгохгүй (админ гараар нэмнэ)
alter table public.mt_company_subscriptions alter column token_limit set default 0;
alter table public.mt_company_subscriptions alter column token_limit set not null;
alter table public.mt_company_subscriptions drop constraint if exists mt_company_subscriptions_token_limit_check;
alter table public.mt_company_subscriptions
  add constraint mt_company_subscriptions_token_limit_check check (token_limit >= 0);

-- job_limit-ийг цаашид ашиглахгүй (хуучин кодтой зэрэгцэх үед алдаа өгөхгүйн тулд үлдээнэ)
comment on column public.mt_company_subscriptions.job_limit is 'Хуучирсан: token_limit-ийг ашиглана';

-- 2. Зарцуулсан токены хэмжээ. Өмнөх бүх мөр 1 эрх = 1,000 токен байсан.
alter table public.tr_job_credit_usage add column if not exists tokens integer;
update public.tr_job_credit_usage set tokens = 1000 where tokens is null;
alter table public.tr_job_credit_usage alter column tokens set not null;
alter table public.tr_job_credit_usage drop constraint if exists tr_job_credit_usage_tokens_check;
alter table public.tr_job_credit_usage
  add constraint tr_job_credit_usage_tokens_check check (tokens > 0);

-- 3. Одоо байгаа зар бүрт 'post' мөр (өмнө нь зарын тоогоор тооцдог байсан)
insert into public.tr_job_credit_usage (user_id, job_id, reason, tokens, created_at)
select j.user_id, j.id, 'post', 1000, coalesce(j.created_at, now())
  from public.mt_openjob j
 where exists (select 1 from auth.users u where u.id = j.user_id)
   and not exists (
     select 1 from public.tr_job_credit_usage c where c.job_id = j.id and c.reason = 'post'
   );

create index if not exists tr_job_credit_usage_job_idx on public.tr_job_credit_usage (job_id);

-- 4. Ашигласан токены нийлбэр (PostgREST-ийн 1,000 мөрийн хязгаарт хамаарахгүй)
create or replace function public.company_token_usage(p_user uuid, p_since timestamptz default null)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(tokens), 0)::bigint
    from public.tr_job_credit_usage
   where user_id = p_user
     and (p_since is null or created_at >= p_since);
$$;

revoke all on function public.company_token_usage(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.company_token_usage(uuid, timestamptz) to service_role;

-- 5. Хугацаа дууссан зарыг устгахад 'post' мөр нэмэхээ болино —
--    зар нийтлэх бүрт мөр аль хэдийн үүсдэг (дээрх 3-р алхам болон src/app/api/jobs/route.ts)
create or replace function public.purge_expired_job_posts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  ids uuid[];
begin
  select coalesce(array_agg(j.id), '{}')
    into ids
    from public.mt_openjob j
   where j.status = 'expired'
     and j.expires_at is not null
     and j.expires_at <= now() - interval '14 days'
     and not exists (select 1 from public.tr_contract c where c.job_id = j.id);

  if cardinality(ids) = 0 then
    return 0;
  end if;

  if to_regclass('public.job_bookmarks') is not null then
    execute 'delete from public.job_bookmarks where job_id = any($1)' using ids;
  end if;

  delete from public.tr_job_request where job_id = any(ids);
  -- tr_job_credit_usage.job_id нь on delete set null тул зарцуулсан токен хэвээр үлдэнэ
  delete from public.mt_openjob where id = any(ids);

  return cardinality(ids);
end;
$$;

revoke all on function public.purge_expired_job_posts() from public, anon, authenticated;

commit;
