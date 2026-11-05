-- =====================================================================
-- Хагас цагийн зарын долоо хоногийн ажлын цаг
--
-- mt_profile.availability-тай ижил бүтэц (зөвхөн сонгосон өдрүүд):
--   {"monday": {"enabled": true, "from": "09:00", "to": "13:00"}, ...}
-- job_type = 'parttime' үед апп заавал бөглүүлнэ, бусад төрөлд null.
-- =====================================================================

alter table public.mt_openjob add column if not exists work_schedule jsonb;

alter table public.mt_openjob drop constraint if exists mt_openjob_work_schedule_check;
alter table public.mt_openjob
  add constraint mt_openjob_work_schedule_check
  check (work_schedule is null or jsonb_typeof(work_schedule) = 'object');
