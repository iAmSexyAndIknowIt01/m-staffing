import { NextResponse } from "next/server"
import { cookies } from "next/headers"
// Supabase клентийг идэвхжүүлэв
import { supabase } from "@/lib/supabase" 

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

    // 2. Формоос ирсэн датаг хүлээн авах
    const body = await request.json()
    const { title, category, jobType, location, salary, description, requirements } = body

    // 3. Шаардлагатай талбарууд бүрэн эсэхийг шалгах
    if (!title || !category || !description || !requirements) {
      return NextResponse.json(
        { error: "Заавал бөглөх талбаруудыг бөглөнө үү." },
        { status: 400 }
      )
    }

    // 4. ДАТАБЕЙС РҮҮ ХАДГАЛАХ ХЭСЭГ (ИДЭВХТЭЙ)
    const { data, error } = await supabase
      .from("mt_openjob")
      .insert([
        {
          user_id: userId, // Хэрэглэгчийн ID-г күүкинээс шууд авч байна (Аюулгүй)
          title,
          category,
          job_type: jobType,
          location,
          salary,
          description,
          requirements,
          status: "active" // Өгөгдмөл төлөв
        }
      ])
      .select() // Оруулсан өгөгдлийг буцааж авах (баталгаажуулах зорилгоор)

    // Хэрэв Supabase талд ямар нэг алдаа гарвал catch хэсэг рүү шиднэ
    if (error) {
      throw error
    }
    
    // Хөгжүүлэлтийн явцад терминал дээр харах консол:
    console.log("Supabase баазад амжилттай хадгалагдлаа:", data)

    return NextResponse.json(
      { success: true, message: "Ажлын байр амжилттай зарлагдлаа.", data },
      { status: 201 }
    )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Жоб үүсгэхэд алдаа гарлаа:", error)
    
    // Supabase-ээс ирж буй алдааны мессежийг хэрэглэгчид илүү тодорхой харуулах
    return NextResponse.json(
      { error: error.message || "Серверт алдаа гарлаа. Дараа дахин оролдоно уу." },
      { status: 500 }
    )
  }
}


// Дээрх таны POST кодтой цуг нэг файл дотор байрлана
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

    // mt_openjob хүснэгтээс датагаа татах
    const { data: jobs, error } = await supabase
      .from("mt_openjob")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: jobs }, { status: 200 })

  } catch (error: any) {
    console.error("Жагсаалт татахад алдаа гарлаа:", error)
    return NextResponse.json(
      { error: error.message || "Серверт алдаа гарлаа." },
      { status: 500 }
    )
  }
}