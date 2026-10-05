-- =====================================================================
-- Гэрээ менежмент: tr_contract (гэрээ), tr_contract_event (үйлдлийн түүх)
--
-- Гэрээ зөвхөн "approved" (тэнцсэн) анкетаас үүснэ.
-- Төлөв: draft → sent → active → (terminated | expired)
--               sent → declined, draft/sent → cancelled, sent → draft (засварлах)
-- Шилжилтийн дүрмийг src/lib/contracts.ts хянана.
--
-- Зөвхөн service_role (API route) хандана: RLS асаалттай, policy байхгүй.
-- =====================================================================

begin;

create sequence if not exists public.tr_contract_number_seq;

create table if not exists public.tr_contract (
  id                 uuid primary key default gen_random_uuid(),
  contract_number    text not null unique
    default ('MS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.tr_contract_number_seq')::text, 6, '0')),
  job_request_id     uuid not null references public.tr_job_request(id),
  job_id             uuid not null references public.mt_openjob(id),
  company_id         uuid not null references public.mt_company(id),
  staff_id           uuid not null references public.mt_staff(id),
  version            integer not null default 1,

  -- Талуудын нэрийг үүсгэх үед хуулж хадгална (профайл өөрчлөгдсөн ч гэрээ хэвээр)
  company_name       text not null,
  staff_name         text not null,
  staff_email        text,

  -- Гэрээний нөхцөл
  position           text not null,
  salary             numeric(14, 2) not null default 0 check (salary >= 0),
  salary_type        text not null default 'monthly'
    check (salary_type in ('monthly', 'hourly', 'daily', 'yearly')),
  start_date         date not null,
  end_date           date,                         -- null = хугацаагүй
  work_hours         text,
  location           text,
  terms              text not null default '',

  status             text not null default 'draft'
    check (status in ('draft', 'sent', 'active', 'declined', 'cancelled', 'terminated', 'expired')),
  content_hash       text,                         -- илгээх үеийн нөхцлийн SHA-256
  sent_at            timestamptz,
  company_signed_at  timestamptz,
  staff_signed_at    timestamptz,
  staff_signed_name  text,
  staff_signed_ip    text,
  staff_signed_ua    text,
  decline_reason     text,
  terminated_at      timestamptz,
  terminated_by      text check (terminated_by in ('company', 'staff')),
  termination_reason text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint tr_contract_dates_check check (end_date is null or end_date >= start_date)
);

-- Нэг анкетад нэг л "амьд" (draft/sent/active) гэрээ байна
create unique index if not exists tr_contract_one_live_per_request
  on public.tr_contract (job_request_id)
  where status in ('draft', 'sent', 'active');

create index if not exists tr_contract_company_idx on public.tr_contract (company_id, created_at desc);
create index if not exists tr_contract_staff_idx   on public.tr_contract (staff_id, created_at desc);

create table if not exists public.tr_contract_event (
  id          uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.tr_contract(id) on delete cascade,
  actor_id    uuid,
  actor_role  text not null check (actor_role in ('company', 'staff', 'admin', 'system')),
  action      text not null,
  meta        jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists tr_contract_event_contract_idx on public.tr_contract_event (contract_id, created_at);

alter table public.tr_contract       enable row level security;
alter table public.tr_contract_event enable row level security;

revoke all on public.tr_contract, public.tr_contract_event from anon, authenticated;
revoke all on sequence public.tr_contract_number_seq from anon, authenticated;

commit;
