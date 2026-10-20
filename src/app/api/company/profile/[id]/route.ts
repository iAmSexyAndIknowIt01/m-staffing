import { NextResponse, NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { parseCompanyProfile } from "@/lib/companyProfile"

interface RouteParams {
  params: Promise<{ id: string }>
}

// 1. Компанийн профайл мэдээллийг авах (GET)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params // URL-аас компанийн ID-г уншиж авна
    
    const session = await getSession()
    const currentUserId = session?.userId
    const userRole = session?.role

    // Компанийн мэдээллийг ID-аар нь баазаас хайна (Энд эрх шаардахгүй, хэн ч үзэж болно)
    const { data, error } = await supabase
      .from("mt_company")
      .select("id, company_name, email, phone, website, tagline, description, industry, company_size, facebook_url, linkedin_url, logo_url")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("Supabase Error:", error.message)
      return NextResponse.json({ error: "Байгууллага олдсонгүй." }, { status: 404 })
    }

    // Хэрэв үзэж буй хэрэглэгч нь энэ компанийн эзэн мөн бол фронтод засах эрхийг (isOwner) олгоно
    const isOwner = currentUserId === id && userRole === "company"

    return NextResponse.json({ data, isOwner })
  } catch (error) {
    console.error("GET Company Profile Error:", error)
    return NextResponse.json({ error: "Датаг ачааллахад алдаа гарлаа." }, { status: 500 })
  }
}

// 2. Компанийн профайл мэдээллийг шинэчлэх (PUT)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params // URL-аас засах гэж буй компанийн ID-г авна
    
    const session = await getSession()
    const currentUserId = session?.userId
    const userRole = session?.role

    // АЮУЛГҮЙ БАЙДЛЫН ШАЛГАЛТ: Өөрийн компани мөн эсэхийг шалгана
    if (!currentUserId || currentUserId !== id || userRole !== "company") {
      return NextResponse.json({ error: "Танд энэ профайлыг өөрчлөх эрх байхгүй байна." }, { status: 403 })
    }

    const parsed = parseCompanyProfile(await request.json())
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    // Бааз руу өөрчлөлтийг хадгалах
    const { error } = await supabase
      .from("mt_company")
      .update(parsed.data)
      .eq("id", id)

    if (error) throw new Error(error.message)

    return NextResponse.json({ message: "Амжилттай шинэчлэгдлээ" })
  } catch (error) {
    console.error("PUT Company Profile Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}