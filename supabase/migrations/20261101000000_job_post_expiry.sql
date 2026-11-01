-- =====================================================================
-- Ажлын зарын хугацаа (30 хоног) — pg_cron-оор автоматаар хаах
--
-- Төлөвүүд (src/lib/jobLifecycle.ts):
--   active  — нийтлэгдсэн; expires_at хүртэл ажил хайгчдад харагдана
--   draft   — харагдахгүй, хугацаа тоологдохгүй (үлдсэн хугацаа paused_remaining_seconds-д)
--   closed  — ажил олгогч өөрөө хаасан
--   expired — хугацаа дуусч энэ файлын cron автоматаар хаасан
--
-- closed/expired зарыг дахин нээх, «Сунгах» нь 1 нийтлэх эрх хасна → tr_job_credit_usage
-- (src/lib/plans.ts ашигласан эрхийг тоолохдоо үүнийг нэмж тооцно).
-- =====================================================================

begin;

-- 1. Хугацааны баганууд
alter table public.mt_openjob add column if not exists expires_at timestamptz;
alter table public.mt_openjob add column if not exists paused_remaining_seconds integer;

-- Одоо идэвхтэй байгаа заруудад өнөөдрөөс 30 хоног өгнө (шууд хаагдахаас сэргийлж created_at-аас тоолохгүй)
update public.mt_openjob
   set expires_at = now() + interval '30 days'
 where status = 'active' and expires_at is null;

-- Хаагдсан заруудыг дахин нээхэд эрх хасагдахаар тэмдэглэнэ
update public.mt_openjob
   set expires_at = coalesce(created_at, now())
 where status = 'closed' and expires_at is null;

create index if not exists mt_openjob_active_expires_idx
  on public.mt_openjob (expires_at)
  where status = 'active';

-- 2. Төлөвийн жагсаалтад 'expired' нэмнэ (хуучин мөрүүдийг шалгахгүй — NOT VALID)
alter table public.mt_openjob drop constraint if exists mt_openjob_status_check;
alter table public.mt_openjob
  add constraint mt_openjob_status_check
  check (status in ('active', 'draft', 'closed', 'expired')) not valid;

-- 3. Дахин нээх / сунгахад хасагдсан эрхийн бүртгэл
create table if not exists public.tr_job_credit_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid references public.mt_openjob (id) on delete set null,
  reason text not null check (reason in ('reopen', 'extend')),
  created_at timestamptz not null default now()
);

create index if not exists tr_job_credit_usage_user_created_idx
  on public.tr_job_credit_usage (user_id, created_at desc);

alter table public.tr_job_credit_usage enable row level security;
revoke all on table public.tr_job_credit_usage from anon, authenticated;

-- 4. Хугацаа дууссан заруудыг хаах функц (хаасан зарын тоог буцаана)
create or replace function public.expire_job_posts()
returns integer
language sql
security definer
set search_path = public
as $$
  with expired as (
    update public.mt_openjob
       set status = 'expired'
     where status = 'active'
       and expires_at is not null
       and expires_at <= now()
    returning 1
  )
  select count(*)::integer from expired;
$$;

revoke all on function public.expire_job_posts() from public, anon, authenticated;

commit;

-- 5. pg_cron: цаг тутам (минут 5-д) ажиллуулна.
--    Supabase дээр pg_cron-г Database → Extensions-оос асаасан байх, эсвэл доорх мөр ажиллана.
create extension if not exists pg_cron with schema pg_catalog;

select cron.unschedule(jobid) from cron.job where jobname = 'expire-job-posts';
select cron.schedule('expire-job-posts', '5 * * * *', $$select public.expire_job_posts()$$);
