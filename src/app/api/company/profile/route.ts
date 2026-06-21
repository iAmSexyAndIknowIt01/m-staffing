import { NextResponse, NextRequest } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

// 1. Компанийн профайл мэдээллийг авах (GET)
export async function GET() {
  try {
    const cookieStore = await cookies()
    const companyId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    if (!companyId || userRole !== "company") {
      return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })
    }

    // logo_url-ийг select хэсэгт нэмж оруулсан
    const { data, error } = await supabase
      .from("mt_company")
      .select("company_name, email, phone, website, tagline, description, industry, company_size, facebook_url, linkedin_url, logo_url")
      .eq("id", companyId)
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("GET Company Profile Error:", error)
    return NextResponse.json({ error: "Датаг ачааллахад алдаа гарлаа." }, { status: 500 })
  }
}

// 2. Компанийн профайл мэдээллийг шинэчлэх (PUT)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const companyId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    if (!companyId || userRole !== "company") {
      return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })
    }

    const body = await request.json()
    
    // Фронтоос ирж буй logo_url-ийг хүлээж авах
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
      logo_url // Логоны линк
    } = body

    if (!company_name || !company_name.trim()) {
      return NextResponse.json({ error: "Компанийн нэрийг заавал бөглөнө үү." }, { status: 400 })
    }

    // Бааз руу update хийх хэсэгт logo_url-ийг нэмсэн
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
        logo_url: logo_url ? logo_url.trim() : null // Хэрэв лого байхгүй бол null хадгална
      })
      .eq("id", companyId)

    if (error) throw new Error(error.message)

    return NextResponse.json({ message: "Амжилттай шинэчлэгдлээ" })
  } catch (error: any) {
    console.error("PUT Company Profile Error:", error)
    return NextResponse.json({ error: error.message || "Серверт алдаа гарлаа." }, { status: 500 })
  }
}