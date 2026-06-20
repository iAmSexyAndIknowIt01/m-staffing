import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"
// Өөрийн Supabase эсвэл DB санг энд импортлоно
// import { supabase } from "@/lib/supabase" 

export async function POST(request: Request) {
  try {
    // 1. Cookie-нээс мэдээлэл уншиж авах
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value // Шаардлагатай бол ашиглана

    // Хэрэглэгч нэвтрээгүй байвал хандалтыг хориглоно
    if (!userId) {
      return NextResponse.json(
        { error: "Анкет илгээхийн тулд нэвтрэх шаардлагатай." },
        { status: 401 }
      )
    }

    // 2. Фронтоос ирсэн бусад мэдээллийг хүлээж авах
    const body = await request.json()
    const { job_id, applicant_name, applicant_email, applicant_phone, resume_url } = body

    // Талбаруудын шалгалт
    if (!job_id || !applicant_name || !applicant_email || !applicant_phone) {
      return NextResponse.json(
        { error: "Шаардлагатай талбаруудыг бүрэн бөглөнө үү." },
        { status: 400 }
      );
    }

    // 3. Supabase / DB-рүү insert хийх жишээ query:
    const { data, error } = await supabase
      .from('tr_job_request')
      .insert([
        { 
          job_id, 
          applicant_id: userId, // Күүкинээс авсан ID
          applicant_name, 
          applicant_email, 
          applicant_phone, 
          resume_url: resume_url || null,
          status: 'pending'
        }
      ])

    return NextResponse.json(
      { message: "Анкет амжилттай илгээгдлээ." },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Job Request Error:", error)
    return NextResponse.json(
      { error: "Серверт алдаа гарлаа. Дахин оролдоно уу." },
      { status: 500 }
    )
  }
}