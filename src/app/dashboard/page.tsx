import { getSession } from "@/lib/session"
import StaffView from "./components/StaffView"
import CompanyView from "./components/CompanyView"

export default async function DashboardPage() {
  const session = await getSession()
  const userId = session?.userId
  const userRole = session?.role

  if (!userId) return null

  // Зөвхөн үндсэн нүүрний контентийг буцаана, Sidemenu-г layout өөрөө шийднэ
  return userRole === "staff" ? (
    <StaffView userId={userId} />
  ) : (
    <CompanyView userId={userId} />
  )
}