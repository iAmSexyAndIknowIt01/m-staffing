-- =====================================================================
-- Нэвтрэлтийн хамгаалалт: brute force хязгаарлалт, session цуцлалт
--
-- Хоёр хүснэгт хоёулаа зөвхөн service_role-оор (API route) хандана.
-- RLS асаалттай, policy байхгүй, anon/authenticated эрхгүй.
-- =====================================================================

begin;

-- 1. Нэвтрэх оролдлогууд — /api/auth/login нь сүүлийн 15 минутын
--    амжилтгүй оролдлогыг имэйл болон IP-ээр тоолж хязгаарлана.
create table if not exists public.auth_login_attempts (
  -- Дараалсан дугаар биш, таах боломжгүй санамсаргүй UUID (v4, 122 бит)
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists auth_login_attempts_email_created_idx
  on public.auth_login_attempts (email, created_at desc);
create index if not exists auth_login_attempts_ip_created_idx
  on public.auth_login_attempts (ip, created_at desc);

-- 2. Session цуцлалт — энэ хугацаанаас өмнө үүссэн session cookie хүчингүй.
--    FK тавиагүй: хэрэглэгч устсан ч бичлэг үлдэх ёстой.
create table if not exists public.auth_session_revocations (
  user_id uuid primary key,
  revoked_before timestamptz not null default now()
);

alter table public.auth_login_attempts enable row level security;
alter table public.auth_session_revocations enable row level security;
revoke all on table public.auth_login_attempts from anon, authenticated;
revoke all on table public.auth_session_revocations from anon, authenticated;

-- 3. Хуучин оролдлогуудыг цэвэрлэх функц (cron эсвэл гараар ажиллуулна)
create or replace function public.purge_old_login_attempts()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.auth_login_attempts where created_at < now() - interval '1 day';
$$;

revoke execute on function public.purge_old_login_attempts() from anon, authenticated, public;
grant execute on function public.purge_old_login_attempts() to service_role;

commit;
