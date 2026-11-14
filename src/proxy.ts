import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session"
import { CONTRACTS_ENABLED } from "@/lib/features"
import { loginPathFor } from "@/lib/redirect"

const CONTRACT_PATH = /^\/dashboard\/(company|staff)\/contracts(\/|$)/
// Ажил хайгч / ажил олгогчийн тусдаа хэсгүүд
const ROLE_PATH = /^\/dashboard\/(company|staff)(\/|$)/

// Нэвтрээгүй хэрэглэгчийг dashboard, admin хуудас руу оруулахгүй.
// Эрхийн нарийн шалгалтыг API болон layout тус бүр өөрөө хийнэ.
export async function proxy(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)

  if (!session) {
    // Нэвтэрсний дараа анх очих гэсэн хуудас руугаа буцна
    const { pathname, search } = request.nextUrl
    return NextResponse.redirect(new URL(loginPathFor(pathname + search), request.url))
  }

  if (request.nextUrl.pathname.startsWith("/admin") && !session.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Өөр төрлийн бүртгэлийн хэсэгт (ж: ажил олгогч «Ажил хайх») орвол өөрийн самбар руу шилжүүлж,
  // яагаад шилжсэнийг тайлбарлах мэдэгдэл харуулна (dashboard-ын RoleNotice)
  const rolePath = request.nextUrl.pathname.match(ROLE_PATH)
  if (rolePath && rolePath[1] !== session.role) {
    const url = new URL("/dashboard", request.url)
    url.searchParams.set("notice", rolePath[1] === "staff" ? "staff-only" : "company-only")
    return NextResponse.redirect(url)
  }

  // Гэрээний функц түр нуугдсан үед хуудсанд шууд хандахыг хаана.
  if (!CONTRACTS_ENABLED && CONTRACT_PATH.test(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
