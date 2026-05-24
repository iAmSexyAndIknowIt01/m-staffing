import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardShell from "./components/DashboardShell"

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
    <DashboardShell
      userId={userId}
      userRole={userRole || "staff"}
      onLogout={handleLogout}
    >
      {children}
    </DashboardShell>
  )
}