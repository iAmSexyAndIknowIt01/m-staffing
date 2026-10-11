-- =====================================================================
-- Гэрээний загвар: mt_contract_template
--
-- Компани ижил агуулгатай гэрээг олон дахин байгуулахад нөхцөл, ажлын цаг,
-- хугацаа зэргийг загвар болгон хадгална. Загварын null талбар "ажлын зараас /
-- одоогийн утгаас авна" гэсэн утгатай (хэрэглэх дүрэм: src/lib/contractTemplates.ts).
--
-- is_default = true загварыг тэнцсэн анкетаас шинэ гэрээ үүсгэхэд автоматаар хэрэглэнэ
-- (компанид нэг л үндсэн загвар).
--
-- Зөвхөн service_role (API route) хандана: RLS асаалттай, policy байхгүй.
-- Код нь энэ хүснэгт байхгүй үед ч гэрээ үүсгэнэ (загваргүйгээр), тиймээс
-- deploy-ийн өмнө ч, дараа ч ажиллуулж болно.
-- =====================================================================

begin;

create table if not exists public.mt_contract_template (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.mt_company(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 100),
  is_default      boolean not null default false,

  -- null = загвар энэ талбарыг өөрчлөхгүй
  position        text check (char_length(position) <= 200),
  salary          numeric(14, 2) check (salary >= 0),
  salary_type     text not null default 'monthly'
    check (salary_type in ('monthly', 'hourly', 'daily', 'yearly')),
  duration_months integer check (duration_months between 1 and 120), -- дуусах огноог эхлэх огнооноос тооцно
  work_hours      text check (char_length(work_hours) <= 200),
  location        text check (char_length(location) <= 200),
  terms           text not null check (char_length(terms) <= 20000),

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Нэг компанид ижил нэртэй загвар давхардахгүй (том жижиг үсэг ялгахгүй)
create unique index if not exists mt_contract_template_company_name_key
  on public.mt_contract_template (company_id, lower(name));

-- Нэг компанид нэг л үндсэн загвар
create unique index if not exists mt_contract_template_one_default
  on public.mt_contract_template (company_id)
  where is_default;

create index if not exists mt_contract_template_company_idx
  on public.mt_contract_template (company_id, updated_at desc);

alter table public.mt_contract_template enable row level security;
revoke all on public.mt_contract_template from anon, authenticated;

commit;
