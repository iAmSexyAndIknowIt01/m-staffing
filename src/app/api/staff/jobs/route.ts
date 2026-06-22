import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json(
        { error: "Нэвтрэх шаардлагатай байна." },
        { status: 401 }
      )
    }

    // 1. Эхлээд зөвхөн ажлын байрууд болон хүсэлтүүдийг татна (Алдаа гаргадаг холбоосыг хассан)
    const { data: jobsData, error: jobsError } = await supabase
      .from("mt_openjob")
      .select(`
        *,
        tr_job_request(id)
      `)
      .eq("status", "active")
      .eq("tr_job_request.applicant_id", userId)
      .order("created_at", { ascending: false })

    if (jobsError) throw jobsError

    const rawJobs = jobsData || []

    // 2. Олдсон ажлын байруудаас компаниудын ID-г (user_id) ялгаж авна
    const companyIds = Array.from(new Set(rawJobs.map((j: any) => j.user_id).filter(Boolean)))

    let companiesMap: Record<string, { name: string; logo_url: string | null }> = {}

    // 3. Хэрэв ажлын байрууд олдсон бол харгалзах компаниудын мэдээллийг тусад нь нэг хүсэлтээр татна
    if (companyIds.length > 0) {
      const { data: companiesData, error: companiesError } = await supabase
        .from("mt_company")
        .select("id, company_name, logo_url")
        .in("id", companyIds)

      if (companiesError) throw companiesError

      // Компаниудыг ID-аар нь хурдан хайхын тулд Map (Object) болгоно
      if (companiesData) {
        companiesMap = companiesData.reduce((acc: any, company: any) => {
          acc[company.id] = { name: company.company_name, logo_url: company.logo_url }
          return acc
        }, {})
      }
    }

    // 4. Ажлын байр бүрт өөрийнх нь компанийн мэдээллийг гараар нэгтгэж (Merge) форматлана
    const formattedJobs = rawJobs.map((job: any) => {
      const isApplied = job.tr_job_request && job.tr_job_request.length > 0
      const { tr_job_request, ...cleanedJob } = job

      // Харгалзах компанийн мэдээллийг Map-аас авна
      const companyInfo = companiesMap[job.user_id] || { company_name: ["Байгууллагын нэр нууцалсан"], logo_url: null }

      return {
        ...cleanedJob,
        is_applied: isApplied,
        mt_company: companyInfo // Фронт талын кодонд яг ижил бүтэцтэй очно
      }
    })

    return NextResponse.json({ success: true, jobs: formattedJobs }, { status: 200 })

  } catch (error: any) {
    console.error("Ажлын зарууд татахад алдаа гарлаа:", error)
    return NextResponse.json(
      { error: error.message || "Серверт алдаа гарлаа." },
      { status: 500 }
    )
  }
}