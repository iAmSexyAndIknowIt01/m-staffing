-- =====================================================================
-- Хугацаа дууссан (expired) зарыг expires_at + 14 хоногийн дараа бүрмөсөн устгах
-- Аппын кодонд өөрчлөлт шаардахгүй — зөвхөн DB функц + pg_cron.
--
--   * Зарын анкет (tr_job_request), хадгалсан зар (job_bookmarks)-ыг хамт устгана
--   * Гэрээ (tr_contract) байгуулсан зарыг устгахгүй — гэрээ нь хуулийн баримт
--   * Нийтлэх эрх буцаж нэмэгдэхгүй: src/lib/plans.ts нь (үүсгэсэн зар + tr_job_credit_usage)
--     мөрийг тоолдог тул устгасан зар бүрт reason = 'post', created_at = зарын created_at
--     мөр үлдээнэ — тоо яг хэвээр үлдэнэ
-- =====================================================================

begin;

-- 1. Устгасан зарын эрхийг хадгалах шалтгаан
alter table public.tr_job_credit_usage drop constraint if exists tr_job_credit_usage_reason_check;
alter table public.tr_job_credit_usage
  add constraint tr_job_credit_usage_reason_check
  check (reason in ('reopen', 'extend', 'post'));

-- 2. Устгах функц (устгасан зарын тоог буцаана)
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

-- 3. pg_cron: өдөр бүр 03:20 UTC (Улаанбаатарын 11:20)
select cron.unschedule(jobid) from cron.job where jobname = 'purge-expired-job-posts';
select cron.schedule('purge-expired-job-posts', '20 3 * * *', $$select public.purge_expired_job_posts()$$);
