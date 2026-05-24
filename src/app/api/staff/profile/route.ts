import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

// 1. Профайлын мэдээллийг баазаас татах (GET)
export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    if (!userId || userRole !== "staff") {
      return NextResponse.json({ error: "Хандах эрхгүй байна." }, { status: 403 })
    }

    const { data: profile, error } = await supabase
      .from("mt_staff_profile")
      .select("*")
      .eq("user_id", userId)
      .single() // Нэг мөр өгөгдөл авна

    // Хэрэв анх удаа орж байгаа бол профайл байхгүй байж болно, алдаа биш
    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json({ success: true, profile: profile || null }, { status: 200 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Профайл татахад алдаа гарлаа:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}

// 2. Профайлын мэдээллийг хадгалах / шинэчлэх (POST)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    if (!userId || userRole !== "staff") {
      return NextResponse.json({ error: "Хандах эрхгүй байна." }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, email, phone, bio, skills, experience, education } = body

    if (!full_name) {
      return NextResponse.json({ error: "Бүтэн нэрийг заавал бөглөнө үү." }, { status: 400 })
    }

    // upsert нь тухайн user_id байвал UPDATE хийнэ, байхгүй бол INSERT хийнэ
    const { data, error } = await supabase
      .from("mt_staff_profile")
      .upsert({
        user_id: userId,
        full_name,
        email,
        phone,
        bio,
        skills,
        experience,
        education,
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, message: "Профайл амжилттай хадгалагдлаа.", data }, { status: 200 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Профайл хадгалахад алдаа гарлаа:", error)
    return NextResponse.json({ error: error.message || "Серверт алдаа гарлаа." }, { status: 500 })
  }
}