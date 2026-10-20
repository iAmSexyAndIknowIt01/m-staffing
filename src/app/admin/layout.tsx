import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Хамгаалалт: Зөвхөн ADMIN_EMAILS-д бүртгэлтэй хэрэглэгч нэвтэрнэ
  if (!session) redirect("/login")
  if (!session.isAdmin) redirect("/dashboard")

  return <>{children}</>
}
