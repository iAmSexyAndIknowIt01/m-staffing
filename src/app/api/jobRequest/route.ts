import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { normalizeHttpUrl } from "@/lib/url"

export async function POST(request: Request) {
  try {
    // 1. Cookie-нээс мэдээлэл уншиж авах
    const session = await getSession()
    const userId = session?.userId

    if (!userId || session.role !== "staff") {
      return NextResponse.json(
        { error: "Анкет илгээхийн тулд ажил хайгчаар нэвтрэх шаардлагатай." },
        { status: 401 }
      )
    }

    // 2. Фронтоос зөвхөн job_id болон resume_url-ийг авна
    const body = await request.json()
    const { job_id, resume_url } = body

    if (!job_id || typeof job_id !== "string") {
      return NextResponse.json({ error: "Ажлын байрны ID дутуу байна." }, { status: 400 })
    }

    const resumeUrl = normalizeHttpUrl(resume_url)
    if (resumeUrl === undefined) {
      return NextResponse.json({ error: "CV-ийн холбоос буруу байна." }, { status: 400 })
    }

    // Хаагдсан эсвэл ноорог зарт анкет илгээхгүй
    const { data: job, error: jobError } = await supabase
      .from("mt_openjob")
      .select("id")
      .eq("id", job_id)
      .eq("status", "active")
      .maybeSingle()

    if (jobError) throw jobError
    if (!job) {
      return NextResponse.json({ error: "Ажлын байр олдсонгүй эсвэл зар хаагдсан байна." }, { status: 404 })
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
          resume_url: resumeUrl,
          status: 'pending'
        }
      ])

    // Нэг ажлын байранд давтан анкет илгээх (unique_violation)
    if (insertError?.code === "23505") {
      return NextResponse.json({ error: "Та энэ ажлын байранд анкет илгээсэн байна." }, { status: 409 })
    }

    if (insertError) throw new Error(insertError.message)

    return NextResponse.json({ message: "Анкет амжилттай илгээгдлээ." }, { status: 201 })
  } catch (error) {
    console.error("Job Request Error:", error)
    return NextResponse.json(
      { error: "Серверт алдаа гарлаа. Дахин оролдоно уу." },
      { status: 500 }
    )
  }
}