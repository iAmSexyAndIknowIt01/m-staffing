import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase" // Supabase client импортлох
import { one } from "@/lib/relation"

export async function GET() {
  try {
    const session = await getSession()
    const companyId = session?.userId
    const userRole = session?.role

    if (!companyId || userRole !== "company") {
      return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })
    }

    // Supabase дээр tr_job_request болон mt_openjob хүснэгтийг INNER JOIN хийж байна.
    // mt_openjob хүснэгтийн user_id нь нэвтэрсэн компанийн ID-тай адил байх ёстой.
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
      .eq("mt_openjob.user_id", companyId) // Зөвхөн тухайн компанийн зарласан ажлын байрнууд
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    // Ирсэн датаг ApplicantsList компонентын хүлээж авах хэлбэрт хөрвүүлэх (Map)
    const formattedData = requests?.map((req) => ({
      id: req.id,
      user_name: req.applicant_name || "Нэргүй ажил горилогч",
      job_title: one(req.mt_openjob)?.title || "Тодорхойгүй ажлын байр",
      email: req.applicant_email || "Хоосон",
      phone: req.applicant_phone || "Хоосон",
      created_at: req.created_at,
      status: req.status || "new",
    })) || []

    return NextResponse.json({ data: formattedData })
  } catch (error) {
    console.error("Get Applicants Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}

const COMPANY_STATUSES = ["interview", "rejected", "approved", "not-approved"]

// Статус шинэчлэх (Урих, Татгалзах) үед ашиглах PUT request
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    const companyId = session?.userId
    const userRole = session?.role

    if (!companyId || userRole !== "company") {
      return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })
    }

    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: "Мэдээлэл дутуу байна." }, { status: 400 })
    }

    // Компани зөвхөн эдгээр төлөвийг тогтооно ("accepted"-ийг ажилтан өөрөө тогтооно)
    if (!COMPANY_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Төлөв буруу байна." }, { status: 400 })
    }

    // Аюулгүй байдлын үүднээс зөвхөн өөрийн компанийн зарт ирсэн хүсэлт мөн эсэхийг 
    // шалгаж байж статусыг шинэчилнэ.
    const { data: checkData } = await supabase
      .from("tr_job_request")
      .select("id, mt_openjob!inner(user_id)")
      .eq("id", id)
      .eq("mt_openjob.user_id", companyId)
      .single()

    if (!checkData) {
      return NextResponse.json({ error: "Энэ анкетыг засах эрхгүй байна эсвэл олдсонгүй." }, { status: 403 })
    }

    // Төлөв шинэчлэх
    const { error: updateError } = await supabase
      .from("tr_job_request")
      .update({ status: status })
      .eq("id", id)

    if (updateError) throw new Error(updateError.message)

    return NextResponse.json({ success: true, message: "Төлөв амжилттай шинэчлэгдлээ" })
  } catch (error) {
    console.error("Update Status Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}