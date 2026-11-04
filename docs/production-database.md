# Production Supabase бааз гаргах

Dev баазын тохиргоог шинэ production баазруу хуулах заавар.

> **Яагаад migration-уудыг ажиллуулахгүй вэ?** `supabase/migrations/` нь зөвхөн 2026-10-01-ээс
> хойшх өөрчлөлтүүдийг агуулдаг. `mt_openjob`, `tr_job_request`, `mt_staff` гэх мэт үндсэн
> хүснэгтүүдийг Dashboard дээр гараар үүсгэсэн. Тиймээс бодит бүтцийг dev баазаас шууд dump хийж хуулна.

## 1. Production project үүсгэх

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
   - Нэр: `mstaffing-prod`
   - **Region:** dev-тэй ижил (Vercel-ийн region-д ойр).
   - **Database password:** хүчтэй нууц үг үүсгээд password manager-т хадгална.
   - Production-д **Pro** багц санал болгоно: өдөр бүр backup авч, 7 хоног идэвхгүй байвал pause болохгүй.
2. **Database → Extensions** дээр `pg_cron`-г асаана. Dev дээр өөр extension асаасан бол тэдгээрийг ч асаана.

## 2. Схем, тохиргоог хуулах

Шаардлага: [Supabase CLI](https://supabase.com/docs/guides/cli), Docker (ажиллаж байх), `psql`, `jq`.

Холболтын мөрийг project бүрийн **Connect → Session pooler** (port 5432) хэсгээс авна.

```bash
export DEV_DB_URL='postgresql://postgres.<dev-ref>:<pass>@aws-0-<region>.pooler.supabase.com:5432/postgres'
export PROD_DB_URL='postgresql://postgres.<prod-ref>:<pass>@aws-0-<region>.pooler.supabase.com:5432/postgres'

# Auth тохиргоог ч хуулах бол (заавал биш). Token: Account → Access Tokens
export SUPABASE_ACCESS_TOKEN=sbp_... DEV_REF=<dev-ref> PROD_REF=<prod-ref> PROD_SITE_URL=https://<production-домэйн>

scripts/supabase/clone-dev-to-prod.sh dump    # supabase/.clone/ руу файл гаргана, prod-д хүрэхгүй
# supabase/.clone/*.sql-ийг нүдээр шалгана
scripts/supabase/clone-dev-to-prod.sh apply   # prod-д хэрэгжүүлнэ ('yes' гэж баталгаажуулна)
```

**Хуулагдах зүйлс**

| Файл | Агуулга |
|---|---|
| `01_roles.sql` | Нэмэлт DB role |
| `02_schema.sql` | `public` схем: хүснэгт, index, constraint, RLS policy, функц (`expire_job_posts`, `auth_email_exists`, …), trigger, grant |
| `03_ref_data.sql` | Лавлах өгөгдөл: `mt_address`, `mt_skill`, `mt_terms`, `mt_privacy`, `mt_tips`, `mt_ads`. Өөрчлөх бол `REF_TABLES` тохируулна. |
| `04_storage.sql` | `avatars`, `company-logos` bucket (хэмжээ, MIME хязгаартай) болон policy |
| `05_cron.sql` | pg_cron job-ууд (`expire-job-posts` г.м.) |
| `06_auth_config.json` | Auth тохиргоо. Нууц утга, site URL, redirect URL-ийг хассан. |

**Хуулагдахгүй зүйлс:** dev-ийн хэрэглэгч, компани, зар, анкет, гэрээ, төлбөр зэрэг тест өгөгдөл болон storage дахь файлууд. Production цэвэр эхэлнэ.

Хамгаалалт: `apply` нь prod-ийн `public` схемд хүснэгт байвал зогсоно. Ингэснээр андуурч dev эсвэл ашиглаж буй бааз руу бичихээс сэргийлнэ.

Төгсгөлд dev болон prod-ийн хүснэгт, policy, функц, bucket-ийн тоог харьцуулж хэвлэнэ. Тоонууд таарах ёстой.

## 3. Dashboard дээр гараар шалгах

- **Authentication → URL Configuration:** Site URL болон Redirect URLs-д production домэйнийг оруулна.
- **Authentication → Sign In / Providers:** dev-тэй ижил эсэхийг шалгана (жишээ нь Email provider асаалттай).
- **Authentication → Emails → SMTP:** Supabase-ийн үндсэн мэйл үйлчилгээ цагт цөөн мэйл л илгээдэг. Аппын мэйл Gmail SMTP-ээр (`GMAIL_*`) явдаг ч Supabase Auth мэйл илгээх шаардлагатай бол энд SMTP тохируулна.
- **Integrations → Cron:** `expire-job-posts` болон бусад job харагдаж байгаа эсэх.
- **Advisors → Security / Performance:** анхааруулга байхгүй эсэх.
- **Storage:** bucket-ууд public/private тохиргоо dev-тэй ижил эсэх.

## 4. Vercel environment variable (Production)

Vercel → Project → Settings → Environment Variables → **Production** хэсэгт тохируулна. Preview/Development нь dev баазаа ашигласаар үлдэнэ.

| Хувьсагч | Утга |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | prod project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod anon (publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | prod service_role (secret) key. Зөвхөн Production-д. |
| `SESSION_SECRET` | **шинэ** санамсаргүй утга: `openssl rand -base64 48` |
| `APP_URL` | production домэйн. Байхгүй бол `VERCEL_PROJECT_PRODUCTION_URL` ашиглагдана. |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | илгээх мэйл хаяг |
| `ADMIN_EMAILS` | админ мэйлүүд |
| `BILLING_BANK_NAME`, `BILLING_ACCOUNT_NAME`, `BILLING_ACCOUNT_NUMBER` | төлбөр хүлээн авах данс |

Хувьсагчдыг өөрчилсний дараа **Redeploy** хийнэ.

## 5. Launch-ийн дараах шалгалт

1. Production сайт дээр шинэ ажил хайгч болон компани бүртгүүлнэ. Мэйл код ирж, нэвтэрч чадаж байгаа эсэхийг шалгана.
2. Админ эрхээр компанийг баталгаажуулна. Компани зар нийтэлнэ, ажил хайгч анкет илгээнэ.
3. Avatar болон лого upload ажиллаж байгааг шалгана.
4. Нэг цагийн дараа cron ажилласан эсэхийг шалгана:
   `select * from cron.job_run_details order by start_time desc limit 5;`

## Цаашид: схемийн өөрчлөлт

Шинэ migration-ийг (`supabase/migrations/*.sql`) **эхлээд dev**, дараа нь **prod** дээр SQL Editor-оор ажиллуулна. Dev, prod хоёр ижил байх ёстой.

Хоёрын зөрүүг шалгахдаа хоёулангийнх нь схемийг dump хийгээд `diff`-ээр харьцуулна:

```bash
supabase db dump --db-url "$DEV_DB_URL"  -f /tmp/dev.sql
supabase db dump --db-url "$PROD_DB_URL" -f /tmp/prod.sql
diff /tmp/dev.sql /tmp/prod.sql
```
