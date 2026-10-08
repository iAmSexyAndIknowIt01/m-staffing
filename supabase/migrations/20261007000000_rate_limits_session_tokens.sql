-- =====================================================================
-- Имэйл код илгээх IP хязгаарлалт, гарах үед token хүчингүй болгох,
-- бүртгэлийн баталгаажуулах кодыг hash-аар хадгалах
--
-- Шинэ хүснэгтүүд зөвхөн service_role-оор (API route) хандана.
-- RLS асаалттай, policy байхгүй, anon/authenticated эрхгүй.
--
-- ⚠️ Кодын өөрчлөлтийг deploy хийхээс ӨМНӨ ажиллуулна: register_auth.code-д
-- 64 тэмдэгттэй hash хадгалах тул varchar(6) хэвээр байвал бүртгэл ажиллахгүй.
-- Өөрчлөлтүүд хуучин кодтой нийцтэй (хуучин код text багантай ч ажиллана).
-- =====================================================================

begin;

-- 0. Бүртгэлийн кодыг DB-д ил хадгалахгүй — SHA-256 hash (64 тэмдэгт) багтаана
alter table public.register_auth alter column code type text;

-- 1. Үйлдлийн хязгаарлалт — /api/auth/register/mailAuth, /api/auth/password-reset нь
--    нэг IP-ээс цагт илгээх кодын тоог энэ хүснэгтээр тоолно (Gmail-ээр spam явуулахаас сэргийлнэ).
create table if not exists public.auth_rate_limits (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists auth_rate_limits_action_key_created_idx
  on public.auth_rate_limits (action, key, created_at desc);

-- 2. Гарсан session-ууд — cookie-ийн jti энд байвал хүчингүй.
--    expires_at нь cookie-ийн хугацаа; түүнээс хойш бичлэг хэрэггүй тул цэвэрлэнэ.
create table if not exists public.auth_revoked_sessions (
  jti uuid primary key,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.auth_rate_limits enable row level security;
alter table public.auth_revoked_sessions enable row level security;
revoke all on table public.auth_rate_limits from anon, authenticated;
revoke all on table public.auth_revoked_sessions from anon, authenticated;

-- 3. Цэвэрлэх функцийг шинэ хүснэгтүүдийг хамруулахаар өргөтгөнө
create or replace function public.purge_old_login_attempts()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.auth_login_attempts where created_at < now() - interval '1 day';
  delete from public.auth_rate_limits where created_at < now() - interval '1 day';
  delete from public.auth_revoked_sessions where expires_at < now();
$$;

revoke execute on function public.purge_old_login_attempts() from anon, authenticated, public;
grant execute on function public.purge_old_login_attempts() to service_role;

commit;
