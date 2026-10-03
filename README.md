# MSTAFFING

Ажил хайгч (staff) болон ажил олгогч (company)-ыг холбох платформ.
Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage).

## Эхлүүлэх

```bash
npm install
cp .env.example .env.local   # утгуудыг бөглөнө
npm run dev                  # http://localhost:3000
```

## Скриптүүд

| Команд | Үүрэг |
| --- | --- |
| `npm run dev` | Хөгжүүлэлтийн сервер |
| `npm run build` / `npm start` | Production build / ажиллуулах |
| `npm run typecheck` | TypeScript шалгалт |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit тест |

Pull request бүр дээр GitHub Actions (`.github/workflows/ci.yml`) дээрх 4 шалгалт болон build-ийг ажиллуулна.

## Орчны хувьсагч

Бүрэн жагсаалт `.env.example`-д бий.

| Хувьсагч | Тайлбар |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase төсөл. Anon key зөвхөн нэвтрэлтэд ашиглагдана |
| `SUPABASE_SERVICE_ROLE_KEY` | Сервер талын бүх DB/Storage хандалт. **Клиент рүү хэзээ ч гаргахгүй** |
| `SESSION_SECRET` | Session cookie-н HMAC түлхүүр, 32+ тэмдэгт |
| `ADMIN_EMAILS` | Админ имэйлүүд (таслалаар). Жагсаалтаас хасахад тухайн админы session шууд хүчингүй болно |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Бүртгэлийн баталгаажуулах код илгээх |
| `BILLING_BANK_NAME`, `BILLING_ACCOUNT_NUMBER`, `BILLING_ACCOUNT_NAME` | Багц ахиулах үед харуулах данс. Тохируулаагүй бол төлбөрийн цонх 503 буцаана |

## Архитектур

- **Auth**: Supabase Auth-аар нууц үг шалгаад, өөрсдийн HMAC гарын үсэгтэй `session` cookie (`src/lib/session.ts`) олгоно. `src/proxy.ts` нь `/dashboard`, `/admin`-ыг хамгаална; API бүр `getSession()`-оор эрхээ шалгана.
- **DB хандалт**: Бүх хүснэгт RLS асаалттай, anon/authenticated эрхгүй. Зөвхөн API route-ууд `service_role` клиентээр (`src/lib/supabase.ts`) хандана.
- **Багц**: Үнэ, лимит `src/lib/plans.ts`-д (Free 10 / Standard 50 / Premium 100 идэвхтэй зар). Хугацаа дууссан төлбөртэй багц Free лимиттэй болно.
- **Зураг хуулах**: Зөвхөн `/api/upload` (төрөл, хэмжээ, magic byte шалгана).

## Migration

`supabase/migrations/` доторх файлуудыг дарааллаар нь ажиллуулна:

```bash
npx supabase db push
```

## Хэрэглэгчийг албадан гаргах

Тухайн хэрэглэгчийн одоо байгаа бүх session-ийг хүчингүй болгох:

```sql
insert into auth_session_revocations (user_id, revoked_before)
values ('<user-uuid>', now())
on conflict (user_id) do update set revoked_before = now();
```
