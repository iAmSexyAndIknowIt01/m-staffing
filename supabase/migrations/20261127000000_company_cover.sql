-- =====================================================================
-- Компанийн профайлын cover загвар
--
-- Зураг хадгалахгүй — загварын нэрийг (src/lib/companyCovers.ts) хадгалж, апп SVG/CSS-ээр зурна.
-- Утгыг аппын код шалгана (шинэ загвар нэмэхэд migration шаардахгүй).
-- =====================================================================

alter table public.mt_company add column if not exists cover_style text not null default 'classic';

alter table public.mt_company drop constraint if exists mt_company_cover_style_check;
alter table public.mt_company
  add constraint mt_company_cover_style_check check (char_length(cover_style) between 1 and 30);
