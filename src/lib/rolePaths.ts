// Ажил хайгч / ажил олгогчийн тусдаа хэсгүүд (proxy.ts ашиглана)
const ROLE_PATH = /^\/dashboard\/(company|staff)(\/|$)/

// Хоёр төрлийн хэрэглэгч хоёулаа үзэх ёстой хуудсууд:
// компанийн нийтэд харагдах профайл (/dashboard/company/profile/<id>) — ажил хайгч зар дээрээс ордог.
// Засах эрхийг хуудас, API өөрөө шалгадаг (isOwner).
const SHARED_PATHS = [/^\/dashboard\/company\/profile\/[^/]+\/?$/]

// Өөр төрлийн бүртгэлийн хэсэг бол тухайн хэсгийн role-ийг ("company" | "staff"), үгүй бол null буцаана
export function foreignRoleSection(pathname: string, role: string | undefined): "company" | "staff" | null {
  const match = pathname.match(ROLE_PATH)
  if (!match || match[1] === role) return null
  if (SHARED_PATHS.some((re) => re.test(pathname))) return null
  return match[1] as "company" | "staff"
}
