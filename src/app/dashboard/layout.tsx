import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardShell from "./components/DashboardShell"
import DashboardFooter from "./components/DashboardFooter" // Үүсгэсэн footer-ээ импортлох

async function handleLogout() {
  "use server"
  const cookieStore = await cookies()
  cookieStore.delete("user_id")
  cookieStore.delete("user_role")
  redirect("/login")
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  // Хамгаалалт: Нэвтрээгүй бол шууд Login руу шиднэ
  if (!userId) {
    redirect("/login")
  }

  return (
    // 'flex flex-col min-h-screen' нь footer-ийг үргэлж дэлгэцийн хамгийн доор байлгана
    <div className="flex flex-col min-h-screen">
      
      {/* Үндсэн shell болон хуудасны агуулга */}
      <div className="flex-1">
        <DashboardShell
          userId={userId}
          userRole={userRole || "staff"}
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