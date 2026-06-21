import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase" 

// ==========================================
// 1. ШИНЭ АЖИЛ НЭМЭХ (POST)
// ==========================================
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    // 1. Хамгаалалт: Нэвтрээгүй эсвэл компани биш бол хандалтыг таслах
    if (!userId || userRole !== "company") {
      return NextResponse.json(
        { error: "Энэ үйлдлийг хийх эрх танд байхгүй байна." },
        { status: 403 }
      )
    }

    // 2. Формоос ирсэн датаг хүлээн авах (salaryType нэмэгдсэн)
    const body = await request.json()
    const { title, category, jobType, location, salary, salaryType, description, requirements } = body

    // 3. Шаардлагатай талбарууд бүрэн эсэхийг шалгах
    if (!title || !category || !description || !requirements || !salary) {
      return NextResponse.json(
        { error: "Заавал бөглөх талбаруудыг бөглөнө үү." },
        { status: 400 }
      )
    }

    // 4. ДАТАБЕЙС РҮҮ ХАДГАЛАХ ХЭСЭГ
    const { data, error } = await supabase
      .from("mt_openjob")
      .insert([
        {
          user_id: userId,
          title,
          category,
          job_type: jobType,
          location,
          salary,                    // Жишээ нь: "2500000"
          salary_type: salaryType || "monthly", // 'monthly' эсвэл 'hourly'
          description,
          requirements,
          status: "active"
        }
      ])
      .select()

    if (error) {
      throw error
    }
    
    console.log("Supabase баазад амжилттай хадгалагдлаа:", data)

    return NextResponse.json(
      { success: true, message: "Ажлын байр амжилттай зарлагдлаа.", data },
      { status: 201 }
    )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Жоб үүсгэхэд алдаа гарлаа:", error)
    return NextResponse.json(
      { error: error.message || "Серверт алдаа гарлаа. Дараа дахин оролдоно уу." },
      { status: 500 }
    )
  }
}

// ==========================================
// 2. АЖЛЫН ЖАГСААЛТ ТАТАХ (GET)
// ==========================================
export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    // Хамгаалалт: Эрхгүй бол буцаах
    if (!userId || userRole !== "company") {
      return NextResponse.json(
        { error: "Энэ мэдээллийг үзэх эрх танд байхгүй байна." },
        { status: 403 }
      )
    }

    // mt_openjob хүснэгтээс датагаа татах (Шинэ багана автоматаар * -оор орж ирнэ)
    const { data: jobs, error } = await supabase
      .from("mt_openjob")
      .select(`
        *,
        tr_job_request(count)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Ирсэн датаг форматлах
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedJobs = jobs?.map((job: any) => ({
      ...job,
      applicants_count: job.tr_job_request?.[0]?.count || 0
    }))

    return NextResponse.json({ success: true, data: formattedJobs }, { status: 200 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Жагсаалт татахад алдаа гарлаа:", error)
    return NextResponse.json(
      { error: error.message || "Серверт алдаа гарлаа." },
      { status: 500 }
    )
  }
}