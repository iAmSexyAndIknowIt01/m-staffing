import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    // 1. Cookie-нээс мэдээлэл уншиж авах
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json(
        { error: "Анкет илгээхийн тулд нэвтрэх шаардлагатай." },
        { status: 401 }
      )
    }

    // 2. Фронтоос зөвхөн job_id болон resume_url-ийг авна
    const body = await request.json()
    const { job_id, resume_url } = body

    if (!job_id) {
      return NextResponse.json({ error: "Ажлын байрны ID дутуу байна." }, { status: 400 })
    }

    // 3. ЖИНХЭНЭ МЭДЭЭЛЛИЙГ ТАТАХ: Нэвтэрсэн хэрэглэгчийн мэдээллийг хэрэглэгчийн хүснэгтээс уншина
    const { data: userProfile, error: userError } = await supabase
      .from("mt_profile") // Таны хэрэглэгчийн мэдээлэл хадгалдаг хүснэгтийн нэр
      .select("email, phone")
      .eq("user_id", userId)
      .single()

    const { data: staffInfo, error: staffError } = await supabase
      .from("mt_staff") // Таны хэрэглэгчийн мэдээлэл хадгалдаг хүснэгтийн нэр
      .select("first_name, last_name")
      .eq("id", userId)
      .single()

    if (userError || !userProfile || staffError || !staffInfo) {
      return NextResponse.json({ error: "Хэрэглэгчийн мэдээлэл олдсонгүй." }, { status: 404 })
    }

    // 4. Supabase / DB-рүү жинхэнэ мэдээллийг insert хийх
    const { error: insertError } = await supabase
      .from('tr_job_request')
      .insert([
        { 
          job_id, 
          applicant_id: userId,
          applicant_name: `${staffInfo.first_name} ${staffInfo.last_name}`,      // Баазаас авсан жинхэнэ нэр
          applicant_email: userProfile.email,    // Баазаас авсан жинхэнэ имэйл
          applicant_phone: userProfile.phone,    // Баазаас авсан жинхэнэ утас
          resume_url: resume_url || null,
          status: 'pending'
        }
      ])

    if (insertError) throw new Error(insertError.message)

    return NextResponse.json({ message: "Анкет амжилттай илгээгдлээ." }, { status: 201 })
  } catch (error: any) {
    console.error("Job Request Error:", error)
    return NextResponse.json(
      { error: "Серверт алдаа гарлаа. Дахин оролдоно уу." },
      { status: 500 }
    )
  }
}