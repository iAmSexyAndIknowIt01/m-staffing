import { NextResponse, NextRequest } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

interface RouteParams {
  params: Promise<{ id: string }>
}

// 1. Компанийн профайл мэдээллийг авах (GET)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params // URL-аас компанийн ID-г уншиж авна
    
    const cookieStore = await cookies()
    const currentUserId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

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
  } catch (error: any) {
    console.error("GET Company Profile Error:", error)
    return NextResponse.json({ error: "Датаг ачааллахад алдаа гарлаа." }, { status: 500 })
  }
}

// 2. Компанийн профайл мэдээллийг шинэчлэх (PUT)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params // URL-аас засах гэж буй компанийн ID-г авна
    
    const cookieStore = await cookies()
    const currentUserId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    // АЮУЛГҮЙ БАЙДЛЫН ШАЛГАЛТ: Өөрийн компани мөн эсэхийг шалгана
    if (!currentUserId || currentUserId !== id || userRole !== "company") {
      return NextResponse.json({ error: "Танд энэ профайлыг өөрчлөх эрх байхгүй байна." }, { status: 403 })
    }

    const body = await request.json()
    const { 
      company_name, 
      phone, 
      website,
      tagline,
      description,
      industry,
      company_size,
      facebook_url,
      linkedin_url,
      logo_url 
    } = body

    if (!company_name || !company_name.trim()) {
      return NextResponse.json({ error: "Компанийн нэрийг заавал бөглөнө үү." }, { status: 400 })
    }

    // Бааз руу өөрчлөлтийг хадгалах
    const { error } = await supabase
      .from("mt_company")
      .update({ 
        company_name: company_name.trim(), 
        phone: phone ? phone.trim() : null, 
        website: website ? website.trim() : null,
        tagline: tagline ? tagline.trim() : null,
        description: description ? description.trim() : null,
        industry: industry || null,
        company_size: company_size || null,
        facebook_url: facebook_url ? facebook_url.trim() : null,
        linkedin_url: linkedin_url ? linkedin_url.trim() : null,
        logo_url: logo_url ? logo_url.trim() : null 
      })
      .eq("id", id)

    if (error) throw new Error(error.message)

    return NextResponse.json({ message: "Амжилттай шинэчлэгдлээ" })
  } catch (error: any) {
    console.error("PUT Company Profile Error:", error)
    return NextResponse.json({ error: error.message || "Серверт алдаа гарлаа." }, { status: 500 })
  }
}