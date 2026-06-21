import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import ApplicantsList from "./ApplicantsList"

export const dynamic = "force-dynamic"

export default async function ApplicantsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  if (!userId || userRole !== "company") {
    redirect("/dashboard")
  }

  let applicants = []
  let errorMsg = ""

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/company/jobrequest`, {
      headers: { Cookie: `user_id=${userId}; user_role=${userRole}` },
      next: { revalidate: 0 }
    })
    
    if (response.ok) {
      const result = await response.json()
      applicants = result.data || []
    } else {
      errorMsg = "Датаг ачааллахад алдаа гарлаа."
    }
  } catch (err) {
    errorMsg = "Сервертэй холбогдож чадсангүй."
  }

  return (
    // ЗАСВАР: px-4 нэмж утасны дэлгэцийн ирмэгээс наалдахаас сэргийлэв
    <div className="max-w-6xl mx-auto animate-fade-in px-4 sm:px-0 pb-6">
      <div className="mb-6 md:mb-8 pt-2">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Ирсэн анкетууд 👥</h1>
        <p className="text-gray-500 mt-1 text-xs md:text-sm">
          Танай зарласан ажлын байруудад ирүүлсэн ажил хайгчдын мэдээлэл.
        </p>
      </div>

      {errorMsg ? (
        <div className="p-6 bg-red-50 text-red-500 font-bold rounded-2xl">{errorMsg}</div>
      ) : (
        <ApplicantsList initialApplicants={applicants} />
      )}
    </div>
  )
}