import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const companyId = cookieStore.get("user_id")?.value

    if (!companyId) {
      return NextResponse.json({ success: false, error: "Нэвтрээгүй байна." }, { status: 401 })
    }

    // Фронтоос staffId-ийн оронд илгээж буй applicationId-ийг уншина
    const { staffId: applicationId } = await request.json()

    if (!applicationId) {
      return NextResponse.json({ success: false, error: "Анкетын ID (applicationId) дутуу байна." }, { status: 400 })
    }

    // 1. tr_job_request хүснэгтээс ажил горилогчийн applicant_id-г олж авах
    const { data: jobRequest, error: fetchError } = await supabase
      .from("tr_job_request")
      .select("applicant_id")
      .eq("id", applicationId)
      .single()

    if (fetchError || !jobRequest) {
      console.error("Job request not found:", fetchError)
      return NextResponse.json({ success: false, error: "Харгалзах анкетын мэдээлэл олдсонгүй." }, { status: 404 })
    }

    const applicantId = jobRequest.applicant_id

    if (!applicantId) {
      return NextResponse.json({ success: false, error: "Ажил горилогчийн ID тодорхойгүй байна." }, { status: 400 })
    }

    // 2. tr_cv_views хүснэгтэд олдсон applicant_id-г staff_id болгон бүртгэх
    const { error: insertError } = await supabase
      .from("tr_cv_views")
      .insert([
        {
          company_id: companyId,
          staff_id: applicantId, // Олдсон жинхэнэ ажилтны ID
          created_at: new Date().toISOString()
        }
      ])

    if (insertError) throw insertError

    return NextResponse.json({ success: true, message: "Үзэлтийг амжилттай бүртгэлээ." })

  } catch (error: any) {
    console.error("CV View Insert Error:", error)
    return NextResponse.json({ success: false, error: "Серверийн алдаа гарлаа." }, { status: 500 })
  }
}