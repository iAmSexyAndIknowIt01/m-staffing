import { NextResponse, NextRequest } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase" // Supabase client импортлох

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // URL-аас ирж буй dynamic id-г (job_id) авах
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

    // Нэмэлтээр .eq("job_id", jobId) шүүлтүүрийг оруулж өгөв
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
      .eq("job_id", jobId)                 // ТАНЫ ХҮССЭНЭЭР: URL-аар ирсэн job_id-аар шүүнэ
      .eq("mt_openjob.user_id", companyId) // Зөвхөн тухайн компанийн зарласан ажлын байрнууд
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    // Ирсэн датаг ЖоbApplicantsList компонентын хүлээж авах хэлбэрт хөрвүүлэх (Map)
    const formattedData = requests?.map((req: any) => ({
      id: req.id,
      user_name: req.applicant_name || "Нэргүй ажил горилогч",
      job_title: req.mt_openjob?.title || "Тодорхойгүй ажлын байр",
      email: req.applicant_email || "Хоосон",
      phone: req.applicant_phone || "Хоосон",
      created_at: req.created_at,
      status: req.status || "new",
    })) || []

    return NextResponse.json({ data: formattedData })
  } catch (error: any) {
    console.error("Get Applicants By Job ID Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}