-- =====================================================================
-- Ажилтны холбоо барих мэдээлэл (утас, имэйл) нээх
--
-- Компани «Ажилтан хайх» → ажилтны профайл дээрх «Ажиллах хүсэлт илгээх» товчийг дарж
-- 1 зар нийтлэх эрх зарцуулбал тухайн ажилтны утас, имэйлийг 10 цагийн турш харна
-- (src/lib/staffContactAccess.ts, CONTACT_UNLOCK_HOURS = src/lib/staffContact.ts).
-- Зарцуулсан эрх tr_job_credit_usage-д reason = 'contact_unlock' гэж бүртгэгдэж,
-- src/lib/plans.ts-ийн ашигласан эрхийн тоололд автоматаар орно.
-- =====================================================================

begin;

-- 1. Эрх зарцуулсан шалтгаанд 'contact_unlock' нэмнэ
--    ('post' — 20261104000000_purge_expired_jobs: устгасан зарын эрхийг хадгалах мөр)
alter table public.tr_job_credit_usage drop constraint if exists tr_job_credit_usage_reason_check;
alter table public.tr_job_credit_usage
  add constraint tr_job_credit_usage_reason_check
  check (reason in ('reopen', 'extend', 'post', 'contact_unlock'));

-- 2. Нээсэн бүртгэл
create table if not exists public.tr_staff_contact_unlock (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references auth.users (id) on delete cascade,
  staff_id uuid not null references auth.users (id) on delete cascade,
  credit_usage_id uuid references public.tr_job_credit_usage (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists tr_staff_contact_unlock_lookup_idx
  on public.tr_staff_contact_unlock (company_id, staff_id, expires_at desc);

-- Зөвхөн сервер (service_role) хандана
alter table public.tr_staff_contact_unlock enable row level security;
revoke all on table public.tr_staff_contact_unlock from anon, authenticated;

commit;
