import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import ApplicantsList from "./ApplicantsList"

// Next.js дээр кэш хийхгүй, үргэлж шинэ дата авах тохиргоо
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
    // Сервер талын fetch хийх (Баазтайгаа шууд холбож эсвэл абсолют URL ашиглана)
    // Энд Node.js орчны дагуу API дуудаж байна:
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/company/jobrequest`, {
      headers: { Cookie: `user_id=${userId}; user_role=${userRole}` }, // Хэрэгтэй бол күүки дамжуулна
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
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Ирсэн анкетууд 👥</h1>
        <p className="text-gray-500 mt-2">
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