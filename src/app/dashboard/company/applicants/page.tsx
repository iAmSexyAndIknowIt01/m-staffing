import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabase } from "@/lib/supabase" // Supabase-ийг шууд импортлов
import ApplicantsList from "./ApplicantsList"

export const dynamic = "force-dynamic"

export default async function ApplicantsPage() {
  const cookieStore = await cookies()
  const companyId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  if (!companyId || userRole !== "company") {
    redirect("/dashboard")
  }

  let applicants: { id: any; user_name: any; job_title: any; email: any; phone: any; created_at: any; status: any }[] = []
  let errorMsg = ""

  try {
    // API-руу fetch хийхийн оронд Supabase-ээс шууд датагаа татна
    const { data: requests, error } = await supabase
      .from("tr_job_request")
      .select(`
        id,
        status,
        created_at,
        applicant_name,
        applicant_email,
        applicant_phone,
        mt_openjob!inner (
          id,
          title,
          user_id
        )
      `)
      .eq("mt_openjob.user_id", companyId)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    // Ирсэн датаг ApplicantsList-д зориулж хөрвүүлэх (Map)
    applicants = requests?.map((req: any) => ({
      id: req.id,
      user_name: req.applicant_name || "Нэргүй ажил горилогч",
      job_title: req.mt_openjob?.title || "Тодорхойгүй ажлын байр",
      email: req.applicant_email || "Хоосон",
      phone: req.applicant_phone || "Хоосон",
      created_at: req.created_at,
      status: req.status || "new",
    })) || []

  } catch (err: any) {
    console.error("Fetch applicants error:", err)
    errorMsg = "Анкетын мэдээллийг ачааллахад алдаа гарлаа."
  }

  return (
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