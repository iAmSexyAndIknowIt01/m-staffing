import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

// ==========================================
// 1. СҮДЭРЛЭХ / ХАРАХ ХЭСЭГ (GET)
// ==========================================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    // Хамгаалалт: Нэвтрээгүй эсвэл компани биш бол хандалтыг таслах
    if (!userId || userRole !== "company") {
      return NextResponse.json(
        { error: "Энэ мэдээллийг үзэх эрх танд байхгүй байна." },
        { status: 403 }
      )
    }

    // mt_openjob хүснэгтээс тухайн ID болон хэрэглэгчийн өөрийнх нь ажлыг шүүж татах
    const { data: job, error } = await supabase
      .from("mt_openjob")
      .select("*") // Энд * байгаа тул шинээр нэмсэн salary_type автоматаар ирнэ
      .eq("id", id)
      .eq("user_id", userId) // Өөр компанийн зар харах эрсдэлээс сэргийлнэ
      .single() // Ганцхан дата ирэх ёстойг заана

    if (error) {
      throw error
    }

    if (!job) {
      return NextResponse.json(
        { error: "Ажлын байр олдсонгүй." },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: job }, { status: 200 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Ажлын мэдээлэл татахад алдаа гарлаа:", error)
    return NextResponse.json(
      { error: error.message || "Серверт алдаа гарлаа." },
      { status: 500 }
    )
  }
}

// ==========================================
// 2. ӨӨРЧЛӨЛТИЙГ ХАДГАЛАХ ХЭСЭГ (PUT)
// ==========================================
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    // Хамгаалалт: Эрх шалгах
    if (!userId || userRole !== "company") {
      return NextResponse.json(
        { error: "Энэ үйлдлийг хийх эрх танд байхгүй байна." },
        { status: 403 }
      )
    }

    const body = await request.json()
    // Формоос salary_type болон salaryType-ийн аль алинаар ирж болохыг тооцов
    const { title, category, salary, salaryType, salary_type, status, jobType, location, description, requirements } = body

    // Баталгаажуулалт
    if (!title || !category || !salary) {
      return NextResponse.json(
        { error: "Заавал бөглөх талбаруудыг (Гарчиг, Категори, Цалин) бөглөнө үү." },
        { status: 400 }
      )
    }

    // Баазад байгаа датаг шинэчлэх
    const { data, error } = await supabase
    .from("mt_openjob")
    .update({
        title,
        category,
        job_type: jobType,
        location,
        salary,
        salary_type: salary_type || salaryType || "monthly", // Сонгосон цалингийн төрлийг хадгалах
        description,
        requirements,
        status,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()

    if (error) {
      throw error
    }

    return NextResponse.json(
      { success: true, message: "Ажлын байр амжилттай шинэчлэгдлээ.", data },
      { status: 200 }
    )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Жоб шинэчлэхэд алдаа гарлаа:", error)
    return NextResponse.json(
      { error: error.message || "Серверт алдаа гарлаа." },
      { status: 500 }
    )
  }
}