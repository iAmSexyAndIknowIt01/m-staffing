import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase" // Supabase client импортлох

export async function GET() {
  try {
    const cookieStore = await cookies()
    const companyId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

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
    console.error("Get Applicants Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}

// Статус шинэчлэх (Урих, Татгалзах) үед ашиглах PUT request
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const companyId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    if (!companyId || userRole !== "company") {
      return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })
    }

    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: "Мэдээлэл дутуу байна." }, { status: 400 })
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
  } catch (error: any) {
    console.error("Update Status Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}