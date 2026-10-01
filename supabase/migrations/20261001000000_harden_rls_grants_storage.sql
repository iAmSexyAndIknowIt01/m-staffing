-- =====================================================================
-- Аюулгүй байдлын бэхжүүлэлт: RLS, эрхүүд, storage, функцүүд
--
-- Апп нь бүх DB/storage хандалтыг Next.js API route-аар, SUPABASE_SERVICE_ROLE_KEY-ээр
-- хийдэг болсон. service_role нь RLS-ийг тойрдог тул доорх өөрчлөлтүүд аппыг эвдэхгүй,
-- харин browser-т ил байдаг anon key-ээр PostgREST/Storage руу шууд хандахыг бүрэн хаана.
--
-- ⚠️ Энэ migration-ыг кодын өөрчлөлт (service role key) deploy хийгдсэний ДАРАА ажиллуулна.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Ажиллахгүй байсан хуучин бодлогуудыг устгах
--    (auth.uid() сервер талд үргэлж null байсан тул утгагүй, mt_ads нь бүгдэд нээлттэй байсан)
-- ---------------------------------------------------------------------
drop policy if exists "Users can delete their own bookmarks" on public.job_bookmarks;
drop policy if exists "Users can insert their own bookmarks" on public.job_bookmarks;
drop policy if exists "Users can view their own bookmarks"   on public.job_bookmarks;
drop policy if exists "Public can view ads"                  on public.mt_ads;
drop policy if exists "Users can delete their own experience" on public.tr_staff_experience;
drop policy if exists "Users can insert their own experience" on public.tr_staff_experience;
drop policy if exists "Users can update their own experience" on public.tr_staff_experience;
drop policy if exists "Users can view their own experience"   on public.tr_staff_experience;

-- ---------------------------------------------------------------------
-- 2. public схемийн бүх хүснэгт дээр RLS асааж, anon/authenticated эрхийг хураах.
--    Бодлого (policy) үүсгэхгүй = зөвхөн service_role хандана.
-- ---------------------------------------------------------------------
do $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format('alter table public.%I enable row level security', t.relname);
    execute format('revoke all on table public.%I from anon, authenticated', t.relname);
  end loop;
end $$;

revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from anon, authenticated, public;

-- Цаашид үүсгэх хүснэгт/sequence/функцэд anon, authenticated автоматаар эрх авахгүй
alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated, public;

-- ---------------------------------------------------------------------
-- 3. Storage: anon-д бичих/устгах эрх өгч байсан бодлогуудыг устгах.
--    Bucket-ууд public тул зураг public URL-аар уншигдсаар байна;
--    хуулах нь зөвхөн /api/upload (service_role) -оор явна.
-- ---------------------------------------------------------------------
drop policy if exists "initial 1oj01fe_0" on storage.objects;
drop policy if exists "initial 1oj01fe_1" on storage.objects;
drop policy if exists "initial 1oj01fe_2" on storage.objects;
drop policy if exists "initial 1oj01fe_3" on storage.objects;
drop policy if exists "initial 1y3lpeg_0" on storage.objects;
drop policy if exists "initial 1y3lpeg_1" on storage.objects;
drop policy if exists "initial 1y3lpeg_2" on storage.objects;
drop policy if exists "initial 1y3lpeg_3" on storage.objects;

-- Хэмжээ болон MIME төрлийг bucket түвшинд хязгаарлах (SVG/HTML хуулахаас сэргийлнэ).
-- Зарим Supabase хувилбар bucket-ийг SQL-ээр өөрчлөхийг хориглодог тул алдаа гарвал
-- migration-ыг зогсоохгүй — тэр тохиолдолд Dashboard → Storage дээр гараар тохируулна.
do $$
begin
  update storage.buckets
     set file_size_limit = 2097152,
         allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
   where id in ('avatars', 'company-logos');
exception when others then
  raise notice 'storage.buckets шинэчилж чадсангүй (%). Dashboard дээр гараар тохируулна уу.', sqlerrm;
end $$;

-- ---------------------------------------------------------------------
-- 4. Trigger функцүүдийн search_path-ыг тогтоох (advisor: function_search_path_mutable)
-- ---------------------------------------------------------------------
alter function public.update_subscription_updated_at() set search_path = '';
alter function public.update_mt_profile_updated_at()   set search_path = '';
alter function public.update_modified_column()         set search_path = '';
alter function public.update_updated_at_column()       set search_path = '';

-- ---------------------------------------------------------------------
-- 5. Имэйл баталгаажуулалт: буруу оролдлогын тоо, баталгаажсан хугацаа
-- ---------------------------------------------------------------------
alter table public.register_auth add column if not exists attempts    integer not null default 0;
alter table public.register_auth add column if not exists verified_at timestamptz;
create index if not exists register_auth_mail_idx on public.register_auth (mail);

-- ---------------------------------------------------------------------
-- 6. Нэхэмжлэхийн дугаар давхцахгүй байх
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mt_company_invoices_invoice_number_key'
  ) then
    alter table public.mt_company_invoices
      add constraint mt_company_invoices_invoice_number_key unique (invoice_number);
  end if;
end $$;

commit;
