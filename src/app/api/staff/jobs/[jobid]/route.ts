import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobid: string }> }
) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json(
        { error: "Нэвтрэх шаардлагатай байна." },
        { status: 401 }
      )
    }

    // Next.js динамик параметрийг хүлээж авах
    const { jobid } = await params

    if (!jobid) {
      return NextResponse.json(
        { error: "Ажлын байрны ID олдсонгүй." },
        { status: 400 }
      )
    }

    // 1. Тухайн jobid-тай ажлын байр болон хэрэглэгчийн хүсэлт илгээсэн эсэхийг шалгах
    const { data: jobData, error: jobError } = await supabase
      .from("mt_openjob")
      .select(`
        *,
        tr_job_request(id)
      `)
      .eq("id", jobid)
      .eq("status", "active")
      .single()

    if (jobError || !jobData) {
      return NextResponse.json(
        { error: "Ажлын байр олдсонгүй эсвэл идэвхгүй байна." },
        { status: 404 }
      )
    }

    // 2. Компанийн мэдээллийг татах (Хэрэв jobData дээр user_id байгаа бол)
    let companyInfo = {
      id: null,
      name: "Байгууллагын нэр нууцалсан",
      logo_url: null,
    }

    if (jobData.user_id) {
      const { data: companyData, error: companyError } = await supabase
        .from("mt_company")
        .select("id, company_name, logo_url")
        .eq("id", jobData.user_id)
        .single()

      if (!companyError && companyData) {
        companyInfo = {
          id: companyData.id,
          name: companyData.company_name,
          logo_url: companyData.logo_url,
        }
      }
    }

    // 3. Өгөгдлийг жагсаалтын API-тай яг ижил загвараар форматлах
    const isApplied = jobData.tr_job_request && jobData.tr_job_request.length > 0
    const { tr_job_request, ...cleanedJob } = jobData

    const formattedJob = {
      ...cleanedJob,
      is_applied: isApplied,
      mt_company: companyInfo,
    }

    return NextResponse.json({ success: true, job: formattedJob }, { status: 200 })

  } catch (error: any) {
    console.error("Ажлын байрны дэлгэрэнгүй татахад алдаа гарлаа:", error)
    return NextResponse.json(
      { error: error.message || "Серверт алдаа гарлаа." },
      { status: 500 }
    )
  }
}