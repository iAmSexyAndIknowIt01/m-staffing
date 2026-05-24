import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import DashboardShell from "./components/DashboardShell"
import StaffView from "./components/StaffView"
import CompanyView from "./components/CompanyView"

async function handleLogout() {
  "use server"
  const cookieStore = await cookies()
  cookieStore.delete("user_id")
  cookieStore.delete("user_role")
  redirect("/login")
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  if (!userId) {
    redirect("/login")
  }

  return (
    <DashboardShell 
      userId={userId} 
      userRole={userRole || "staff"} 
      onLogout={handleLogout}
    >
      {userRole === "staff" ? (
        <StaffView userId={userId} />
      ) : (
        <CompanyView userId={userId} />
      )}
    </DashboardShell>
  )
}