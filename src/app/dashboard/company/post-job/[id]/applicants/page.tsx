import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import JobApplicantsList from "./JobApplicantsList"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function JobApplicantsPage({ params }: PageProps) {
  const { id: jobId } = await params
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  if (!userId || userRole !== "company") {
    redirect("/dashboard")
  }

  let applicants = []
  let jobTitle = "Ажлын байр"
  let errorMsg = ""

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    
    // ЗАСВАР: API-ийн [id] dynamic route руу jobId-г шууд замаар нь дамжуулна
    const response = await fetch(`${baseUrl}/api/company/jobrequest/${jobId}`, {
      headers: { Cookie: `user_id=${userId}; user_role=${userRole}` },
      next: { revalidate: 0 }
    })
    
    if (response.ok) {
      const result = await response.json()
      applicants = result.data || []
      
      // Хэрэв дата байгаа бол хамгийн эхний анкетнаас ажлын байрны нэрийг авна
      if (applicants.length > 0) {
        jobTitle = applicants[0].job_title
      }
    } else {
      errorMsg = "Анкетын мэдээллийг ачааллахад алдаа гарлаа."
    }
  } catch (err) {
    errorMsg = "Сервертэй холбогдож чадсангүй."
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in px-4 sm:px-0 pb-6 space-y-6">
      {/* ТОЛГОЙ ХЭСЭГ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6 pt-2">
        <div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-indigo-600 font-bold mb-1">
            <Link href="/dashboard/company/post-job" className="hover:underline">💼 Ажлын байрны жагсаалт</Link>
            <span>/</span>
            <span className="text-gray-400">Ирсэн хүсэлтүүд</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            {jobTitle}-д ирсэн анкетууд 👥
          </h1>
        </div>
        
        <Link
          href="/dashboard/company/post-job"
          className="text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition"
        >
          ← Буцах
        </Link>
      </div>

      {errorMsg ? (
        <div className="p-6 bg-red-50 text-red-500 font-bold rounded-2xl">{errorMsg}</div>
      ) : (
        <JobApplicantsList initialApplicants={applicants} />
      )}
    </div>
  )
}