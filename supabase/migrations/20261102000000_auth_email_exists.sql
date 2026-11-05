-- =====================================================================
-- Бүртгүүлэх үед код илгээхээс өмнө имэйл аль хэдийн бүртгэлтэй эсэхийг шалгах
--
-- mt_staff / mt_company-д мөргүй ч auth.users-д үлдсэн имэйл (дутуу бүртгэл г.м.) байвал
-- код илгээсний дараа createUser «email_exists» алдаа өгч байсан. auth схем PostgREST-ээр
-- ил биш тул service_role-д зориулсан security definer функцээр шалгана.
-- =====================================================================

create or replace function public.auth_email_exists(p_email text)
returns boolean
language sql
stable
security definer
set search_path = auth, public
as $$
  select exists (select 1 from auth.users where lower(email) = lower(trim(p_email)));
$$;

revoke all on function public.auth_email_exists(text) from public, anon, authenticated;
grant execute on function public.auth_email_exists(text) to service_role;
