import { NextResponse, NextRequest } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: jobId } = await params

    if (!jobId) {
      return NextResponse.json({ error: "Ажлын байрны ID олдсонгүй" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const companyId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    if (!companyId || userRole !== "company") {
      return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })
    }

    // 1. Анкет ирээгүй байсан ч ажлын нэрийг харуулахын тулд зарын мэдээллийг авах
    let jobTitle = "Ажлын байр"
    const { data: jobData } = await supabase
      .from("mt_openjob")
      .select("title")
      .eq("id", jobId)
      .eq("user_id", companyId)
      .single()

    if (jobData) {
      jobTitle = jobData.title
    }

    // 2. Ирсэн хүсэлтүүдийг татах
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
      .eq("job_id", jobId)
      .eq("mt_openjob.user_id", companyId)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    const formattedData = requests?.map((req: any) => ({
      id: req.id,
      user_name: req.applicant_name || "Нэргүй ажил горилогч",
      job_title: req.mt_openjob?.title || jobTitle,
      email: req.applicant_email || "Хоосон",
      phone: req.applicant_phone || "Хоосон",
      created_at: req.created_at,
      status: req.status || "new",
    })) || []

    // Хэрэгцээт бүх датаг нэгтгэн буцаана
    return NextResponse.json({ 
      data: formattedData,
      jobTitle: jobTitle 
    })

  } catch (error: any) {
    console.error("Get Applicants Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}