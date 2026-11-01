-- =====================================================================
-- Хуучин идэвхтэй заруудын хугацааг үүсгэсэн өдрөөс нь (created_at + 30 хоног) тооцно
--
-- 20261101000000_job_post_expiry нь хуучин идэвхтэй заруудад «migration ажилласан өдөр + 30 хоног»
-- өгсөн. Шийдвэрээр үүсгэснээс 30 хоног өнгөрсөн зарыг шууд expired болгоно — шаардлагатай зарыг
-- ажил олгогч «Дахин нээх»-ээр (1 эрх) сэргээнэ.
--
-- Зөвхөн хэзээ ч ноорог болгож түр зогсоогоогүй (paused_remaining_seconds хоосон),
-- «Сунгах»/«Дахин нээх» хийгээгүй (tr_job_credit_usage-д бүртгэлгүй) зарыг өөрчилнө.
-- =====================================================================

begin;

update public.mt_openjob j
   set expires_at = j.created_at + interval '30 days'
 where j.status = 'active'
   and j.created_at is not null
   and j.paused_remaining_seconds is null
   and not exists (select 1 from public.tr_job_credit_usage u where u.job_id = j.id);

commit;

-- Хугацаа нь дууссан заруудыг cron-ыг хүлээлгүй одоо хаана (хаагдсан зарын тоог буцаана)
select public.expire_job_posts() as expired_count;
