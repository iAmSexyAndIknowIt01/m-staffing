import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { LayoutDashboard, LogOut } from "lucide-react"
import { SESSION_COOKIE, getSession, revokeSessionToken } from "@/lib/session"

async function handleLogout() {
  "use server"
  const cookieStore = await cookies()
  await revokeSessionToken(cookieStore.get(SESSION_COOKIE)?.value)
  cookieStore.delete(SESSION_COOKIE)
  cookieStore.delete("user_id")
  cookieStore.delete("user_role")
  redirect("/login")
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Хамгаалалт: Зөвхөн ADMIN_EMAILS-д бүртгэлтэй хэрэглэгч нэвтэрнэ
  if (!session) redirect("/login")
  if (!session.isAdmin) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-orange-600 text-white font-bold flex items-center justify-center">M</span>
            <span className="text-base font-bold text-gray-900">MStaffing</span>
            <span className="text-xs font-semibold text-white bg-slate-900 px-1.5 py-0.5 rounded-md">Админ</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <LayoutDashboard className="w-4 h-4" /> Хэрэглэгчийн самбар
            </Link>
            <form action={handleLogout}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Гарах</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
