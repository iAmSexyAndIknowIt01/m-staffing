-- =====================================================================
-- Нууц үг сэргээх код
--
-- /api/auth/password-reset имэйлээр 6 оронтой код илгээж, кодыг SHA-256 hash
-- хэлбэрээр энд хадгална (DB алдагдсан ч код ил гарахгүй).
-- Зөвхөн service_role (API route) хандана: RLS асаалттай, policy байхгүй.
-- =====================================================================

begin;

create table if not exists public.password_reset_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  code_hash text not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_codes_email_created_idx
  on public.password_reset_codes (email, created_at desc);

alter table public.password_reset_codes enable row level security;
revoke all on table public.password_reset_codes from anon, authenticated;

commit;
