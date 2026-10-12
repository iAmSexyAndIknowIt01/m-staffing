import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session"
import { CONTRACTS_ENABLED } from "@/lib/features"

const CONTRACT_PATH = /^\/dashboard\/(company|staff)\/contracts(\/|$)/

// Нэвтрээгүй хэрэглэгчийг dashboard, admin хуудас руу оруулахгүй.
// Эрхийн нарийн шалгалтыг API болон layout тус бүр өөрөө хийнэ.
export async function proxy(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (request.nextUrl.pathname.startsWith("/admin") && !session.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
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
