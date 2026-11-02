-- =====================================================================
-- Хугацаа дууссан (expired) зарыг 14 хоногийн дараа бүрмөсөн устгах
--
--   * expired_at — зар expired болсон мөч (expire_job_posts тэмдэглэнэ)
--   * purge_expired_job_posts() — expired_at-аас хойш 14 хоног болсон зарыг
--     анкет (tr_job_request), хадгалсан зар (job_bookmarks)-тай нь хамт устгана
--   * pg_cron: өдөр бүр ажиллана
--
-- Анхаарах:
--   * Гэрээ (tr_contract) байгуулсан зарыг устгахгүй — гэрээ нь хуулийн баримт
--   * Устгасан зар багцын ашигласан эрхээс хасагдахгүй: зар бүрт tr_job_credit_usage-д
--     reason = 'post', created_at = зарын created_at мөр үлдээнэ (src/lib/plans.ts тоолно)
-- =====================================================================

begin;

-- 1. Expired болсон мөч
alter table public.mt_openjob add column if not exists expired_at timestamptz;

-- Одоо expired байгаа зарууд — 14 хоногийг өнөөдрөөс тоолно (шууд устгагдахаас сэргийлнэ)
update public.mt_openjob
   set expired_at = now()
 where status = 'expired' and expired_at is null;

create index if not exists mt_openjob_expired_at_idx
  on public.mt_openjob (expired_at)
  where status = 'expired';

-- 2. expire_job_posts: expired болгохдоо мөчийг нь тэмдэглэнэ
create or replace function public.expire_job_posts()
returns integer
language sql
security definer
set search_path = public
as $$
  with expired as (
    update public.mt_openjob
       set status = 'expired',
           expired_at = now()
     where status = 'active'
       and expires_at is not null
       and expires_at <= now()
    returning 1
  )
  select count(*)::integer from expired;
$$;

revoke all on function public.expire_job_posts() from public, anon, authenticated;

-- 3. Устгасан зарын эрхийг хадгалах шалтгаан
alter table public.tr_job_credit_usage drop constraint if exists tr_job_credit_usage_reason_check;
alter table public.tr_job_credit_usage
  add constraint tr_job_credit_usage_reason_check
  check (reason in ('reopen', 'extend', 'post'));

-- 4. Устгах функц (устгасан зарын тоог буцаана)
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
     and j.expired_at is not null
     and j.expired_at <= now() - interval '14 days'
     and not exists (select 1 from public.tr_contract c where c.job_id = j.id);

  if cardinality(ids) = 0 then
    return 0;
  end if;

  -- Ашигласан эрх буцаж нэмэгдэхээс сэргийлнэ (зар үүсгэсэн огноогоор)
  insert into public.tr_job_credit_usage (user_id, job_id, reason, created_at)
  select j.user_id, null, 'post', coalesce(j.created_at, now())
    from public.mt_openjob j
   where j.id = any(ids)
     and exists (select 1 from auth.users u where u.id = j.user_id);

  if to_regclass('public.job_bookmarks') is not null then
    execute 'delete from public.job_bookmarks where job_id = any($1)' using ids;
  end if;

  delete from public.tr_job_request where job_id = any(ids);
  delete from public.mt_openjob where id = any(ids);

  return cardinality(ids);
end;
$$;

revoke all on function public.purge_expired_job_posts() from public, anon, authenticated;

commit;

-- 5. pg_cron: өдөр бүр 03:20 UTC (Улаанбаатарын 11:20)
select cron.unschedule(jobid) from cron.job where jobname = 'purge-expired-job-posts';
select cron.schedule('purge-expired-job-posts', '20 3 * * *', $$select public.purge_expired_job_posts()$$);
