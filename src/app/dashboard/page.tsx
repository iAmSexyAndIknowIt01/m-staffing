import { cookies } from "next/headers"
import StaffView from "./components/StaffView"
import CompanyView from "./components/CompanyView"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  if (!userId) return null

  // Зөвхөн үндсэн нүүрний контентийг буцаана, Sidemenu-г layout өөрөө шийднэ
  return userRole === "staff" ? (
    <StaffView userId={userId} />
  ) : (
    <CompanyView userId={userId} />
  )
}