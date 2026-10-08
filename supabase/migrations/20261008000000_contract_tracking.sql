-- =====================================================================
-- Гэрээ: ажилтан нээж үзсэн огноо, хугацаа дуусах сануулга илгээсэн огноо
--
-- viewed_at          — ажилтан "Гарын үсэг хүлээж буй" гэрээг анх нээсэн хугацаа
--                      (компани шинэ хувилбар илгээхэд null болно)
-- expiry_reminded_at — дуусахаас 30 хоногийн өмнөх сануулга илгээсэн хугацаа (нэг л удаа)
--
-- Код нь эдгээр багана байхгүй үед ч ажилладаг (тэмдэглэгээ, сануулгагүйгээр) тул
-- энэ migration-ыг deploy-ийн өмнө ч, дараа ч ажиллуулж болно.
-- =====================================================================

begin;

alter table public.tr_contract add column if not exists viewed_at timestamptz;
alter table public.tr_contract add column if not exists expiry_reminded_at timestamptz;

-- Хугацаа дуусах дөхсөн хүчинтэй гэрээг хайхад
create index if not exists tr_contract_active_end_date_idx
  on public.tr_contract (end_date)
  where status = 'active';

commit;
