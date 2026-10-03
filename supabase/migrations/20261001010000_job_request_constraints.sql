-- =====================================================================
-- Анкет (tr_job_request): давхардал, төлөв, мэйл мэдэгдлийн хамгаалалт
-- =====================================================================

begin;

-- 1. Нэг ажилтан нэг ажлын байранд нэг л анкет илгээнэ
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tr_job_request_job_applicant_key'
  ) then
    alter table public.tr_job_request
      add constraint tr_job_request_job_applicant_key unique (job_id, applicant_id);
  end if;
end $$;

-- 2. Зөвхөн аппын ашигладаг төлөвүүдийг зөвшөөрнө
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tr_job_request_status_check'
  ) then
    alter table public.tr_job_request
      add constraint tr_job_request_status_check
      check (status in ('new', 'pending', 'interview', 'accepted', 'approved', 'not-approved', 'rejected'));
  end if;
end $$;

-- 3. Компани руу явуулах мэйлийг анкет бүрт нэг удаа л илгээх тэмдэглэгээ.
--    Хуучин анкетууд дээр дахин мэйл явуулахгүйн тулд created_at-аар бөглөнө.
alter table public.tr_job_request add column if not exists notified_at timestamptz;
update public.tr_job_request set notified_at = coalesce(created_at, now()) where notified_at is null;

commit;
