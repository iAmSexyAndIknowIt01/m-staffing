-- =====================================================================
-- M токеныг худалдан авалт бүрээр («багц», lot) нь тусад нь хадгалах
--
-- Өмнө нь: шинэ багц авахад бүх үлдэгдлийн хугацаа шинэ багцаар 1 жил сунгагддаг байв.
-- Одоо:    худалдан авалт бүр tr_token_lot-д өөрийн дуусах огноотой мөр болно.
--          Зарцуулахдаа хамгийн түрүүнд дуусах багцаас эхэлж хасна (FIFO).
--          Хугацаа нь дууссан багцын үлдэгдэл хүчингүй.
--
-- Үлдэгдэл = хугацаа дуусаагүй багцуудын remaining-ийн нийлбэр.
-- Зарцуулалт бүр tr_job_credit_usage (түүх) + tr_token_usage_lot (аль багцаас хэд хассан) мөрөөр бүртгэгдэнэ.
-- Хасалт, буцаалт, олголтыг доорх функцуудаар (нэг транзакц, мөрийн түгжээтэй) хийнэ — апп өөрөө тооцохгүй.
--
-- Админ гараар токен олгох (SQL Editor):
--   select public.grant_tokens('<company user_id>', 15000);          -- 365 хоног хүчинтэй
--   select public.grant_tokens('<company user_id>', 15000, null);    -- хугацаагүй
-- =====================================================================

begin;

-- 1. Токены багц (худалдан авалт / админы олголт / шилжүүлэлт бүр нэг мөр)
create table if not exists public.tr_token_lot (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tokens integer not null check (tokens > 0),
  remaining integer not null check (remaining >= 0),
  source text not null check (source in ('purchase', 'admin', 'migration')),
  plan_type text,
  invoice_id uuid references public.mt_company_invoices (id) on delete set null,
  created_at timestamptz not null default now(),
  -- null — хугацаагүй
  expires_at timestamptz,
  -- remaining-ийн багана дээрх check нь tr_token_lot_remaining_check нэртэй тул өөр нэр өгнө
  constraint tr_token_lot_remaining_le_tokens check (remaining <= tokens)
);

create index if not exists tr_token_lot_user_expires_idx on public.tr_token_lot (user_id, expires_at);
create unique index if not exists tr_token_lot_invoice_uidx on public.tr_token_lot (invoice_id) where invoice_id is not null;

alter table public.tr_token_lot enable row level security;
revoke all on table public.tr_token_lot from anon, authenticated;

-- 2. Зарцуулалт аль багцаас хэдэн токен хассан (буцаахад ашиглана)
create table if not exists public.tr_token_usage_lot (
  usage_id uuid not null references public.tr_job_credit_usage (id) on delete cascade,
  lot_id uuid not null references public.tr_token_lot (id) on delete cascade,
  tokens integer not null check (tokens > 0),
  primary key (usage_id, lot_id)
);

alter table public.tr_token_usage_lot enable row level security;
revoke all on table public.tr_token_usage_lot from anon, authenticated;

-- 3. Одоогийн үлдэгдлийг нэг багц болгон шилжүүлэх (хуучин дуусах огноотой нь; туршилтын эрх — хугацаагүй)
insert into public.tr_token_lot (user_id, tokens, remaining, source, plan_type, expires_at)
select b.user_id, b.balance, b.balance, 'migration', b.plan_type, b.expires_at
  from (
    select s.user_id,
           s.plan_type,
           case when s.plan_type = 'free' then null else s.expires_at end as expires_at,
           greatest(
             s.token_limit - coalesce((
               select sum(c.tokens)
                 from public.tr_job_credit_usage c
                where c.user_id = s.user_id
                  and (s.plan_type = 'free' or s.expires_at is null or c.created_at >= s.expires_at - interval '365 days')
             ), 0),
             0
           ) as balance
      from public.mt_company_subscriptions s
     where s.status = 'active'
       and (s.plan_type = 'free' or s.expires_at is null or s.expires_at > now())
  ) b
 where b.balance > 0
   and exists (select 1 from auth.users u where u.id = b.user_id)
   and not exists (select 1 from public.tr_token_lot l where l.user_id = b.user_id and l.source = 'migration');

-- token_limit-ийг цаашид ашиглахгүй (үлдэгдэл tr_token_lot-оос)
comment on column public.mt_company_subscriptions.token_limit is 'Хуучирсан: үлдэгдлийг tr_token_lot-оос тооцно';

-- 4. Токен олгох (худалдан авалт баталгаажих, админы гараар олголт). p_days null бол хугацаагүй.
create or replace function public.grant_tokens(
  p_user uuid,
  p_tokens integer,
  p_days integer default 365,
  p_source text default 'admin',
  p_plan text default null,
  p_invoice uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lot uuid;
begin
  if p_tokens is null or p_tokens <= 0 then
    raise exception 'INVALID_TOKENS';
  end if;

  insert into public.tr_token_lot (user_id, tokens, remaining, source, plan_type, invoice_id, expires_at)
  values (
    p_user, p_tokens, p_tokens, p_source, p_plan, p_invoice,
    case when p_days is null then null else now() + make_interval(days => p_days) end
  )
  returning id into v_lot;

  return v_lot;
end;
$$;

-- 5. Токен зарцуулах: хамгийн түрүүнд дуусах багцаас эхэлж хасна (хэд хэдэн багцад хуваагдаж болно).
--    Хүрэлцэхгүй бол 'INSUFFICIENT_TOKENS' алдаа шиднэ. Зарцуулалтын (tr_job_credit_usage) id буцаана.
create or replace function public.spend_tokens(
  p_user uuid,
  p_reason text,
  p_tokens integer,
  p_job uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage uuid;
  v_need integer := p_tokens;
  v_take integer;
  v_available bigint;
  r record;
begin
  if p_tokens is null or p_tokens <= 0 then
    raise exception 'INVALID_TOKENS';
  end if;

  -- Тухайн компанийн хүчинтэй багцуудыг түгжинэ — зэрэг ирсэн хүсэлт давхар зарцуулахгүй
  perform 1
     from public.tr_token_lot
    where user_id = p_user and remaining > 0 and (expires_at is null or expires_at > now())
    for update;

  select coalesce(sum(remaining), 0) into v_available
    from public.tr_token_lot
   where user_id = p_user and remaining > 0 and (expires_at is null or expires_at > now());

  if v_available < p_tokens then
    raise exception 'INSUFFICIENT_TOKENS';
  end if;

  insert into public.tr_job_credit_usage (user_id, job_id, reason, tokens)
  values (p_user, p_job, p_reason, p_tokens)
  returning id into v_usage;

  for r in
    select id, remaining
      from public.tr_token_lot
     where user_id = p_user and remaining > 0 and (expires_at is null or expires_at > now())
     order by expires_at asc nulls last, created_at asc
  loop
    exit when v_need = 0;
    v_take := least(r.remaining, v_need);
    update public.tr_token_lot set remaining = remaining - v_take where id = r.id;
    insert into public.tr_token_usage_lot (usage_id, lot_id, tokens) values (v_usage, r.id, v_take);
    v_need := v_need - v_take;
  end loop;

  return v_usage;
end;
$$;

-- 6. Зарцуулалтыг буцаах (үйлдэл амжилтгүй болсон үед): хассан багцуудад нь буцааж нэмнэ
create or replace function public.refund_token_usage(p_usage uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tr_token_lot l
     set remaining = l.remaining + a.tokens
    from public.tr_token_usage_lot a
   where a.usage_id = p_usage and a.lot_id = l.id;

  delete from public.tr_job_credit_usage where id = p_usage;
end;
$$;

revoke all on function public.grant_tokens(uuid, integer, integer, text, text, uuid) from public, anon, authenticated;
revoke all on function public.spend_tokens(uuid, text, integer, uuid) from public, anon, authenticated;
revoke all on function public.refund_token_usage(uuid) from public, anon, authenticated;
grant execute on function public.grant_tokens(uuid, integer, integer, text, text, uuid) to service_role;
grant execute on function public.spend_tokens(uuid, text, integer, uuid) to service_role;
grant execute on function public.refund_token_usage(uuid) to service_role;

commit;
