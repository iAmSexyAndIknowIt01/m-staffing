-- =====================================================================
-- Имэйл мэдэгдлийн тохиргоо
--
-- Хэрэглэгч бүр (ажил хайгч / ажил олгогч) аль үйл явдлын үед имэйл
-- хүлээж авахаа /dashboard/{staff,company}/settings хуудсаас тохируулна.
-- Мөр байхгүй бол src/lib/notificationCatalog.ts-ийн анхдагч утга үйлчилнэ.
--
--   application_status   — (ажил хайгч) анкетын төлөв өөрчлөгдөх
--   job_offer            — (ажил хайгч) сонгосон ангилалд шинэ ажлын санал нэмэгдэх
--   job_offer_categories — job_offer-ийн ангилал (хоосон = бүх ангилал)
--   new_application      — (ажил олгогч) шинэ анкет ирэх
--   company_approval     — (ажил олгогч) байгууллага баталгаажих
--   payment              — (ажил олгогч) төлбөр баталгаажих / цуцлагдах
--
-- Зөвхөн service_role (API route) хандана: RLS асаалттай, policy байхгүй.
-- =====================================================================

begin;

create table if not exists public.mt_notification_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('staff', 'company')),
  application_status boolean not null default true,
  job_offer boolean not null default false,
  job_offer_categories text[] not null default '{}',
  new_application boolean not null default true,
  company_approval boolean not null default true,
  payment boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Шинэ зар нийтлэгдэхэд ажлын санал авахыг зөвшөөрсөн ажил хайгчдыг хурдан олно
create index if not exists mt_notification_settings_job_offer_idx
  on public.mt_notification_settings (role)
  where job_offer;

alter table public.mt_notification_settings enable row level security;
revoke all on table public.mt_notification_settings from anon, authenticated;

commit;
