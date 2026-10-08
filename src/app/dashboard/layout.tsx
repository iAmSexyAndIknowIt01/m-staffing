import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardShell from "./components/DashboardShell"
import DashboardFooter from "./components/DashboardFooter" // Үүсгэсэн footer-ээ импортлох
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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Хамгаалалт: Нэвтрээгүй бол шууд Login руу шиднэ
  if (!session) {
    redirect("/login")
  }

  return (
    // 'flex flex-col min-h-screen' нь footer-ийг үргэлж дэлгэцийн хамгийн доор байлгана
    <div className="flex flex-col min-h-screen">

      {/* Үндсэн shell болон хуудасны агуулга */}
      <div className="flex-1">
        <DashboardShell
          userId={session.userId}
          userRole={session.role}
          onLogout={handleLogout}
        >
          {children}
        </DashboardShell>
      </div>

      {/* Зөвхөн dashboard дотор харагдах Footer */}
      <DashboardFooter />

    </div>
  )
}
