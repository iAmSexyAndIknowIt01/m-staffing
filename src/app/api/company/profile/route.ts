import { NextResponse, NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { parseCompanyProfile } from "@/lib/companyProfile"

// 1. Компанийн профайл мэдээллийг авах (GET)
export async function GET() {
  try {
    const session = await getSession()
    const companyId = session?.userId
    const userRole = session?.role

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
  } catch (error) {
    console.error("GET Company Profile Error:", error)
    return NextResponse.json({ error: "Датаг ачааллахад алдаа гарлаа." }, { status: 500 })
  }
}

// 2. Компанийн профайл мэдээллийг шинэчлэх (PUT)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    const companyId = session?.userId
    const userRole = session?.role

    if (!companyId || userRole !== "company") {
      return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })
    }

    const parsed = parseCompanyProfile(await request.json())
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { error } = await supabase
      .from("mt_company")
      .update(parsed.data)
      .eq("id", companyId)

    if (error) throw new Error(error.message)

    return NextResponse.json({ message: "Амжилттай шинэчлэгдлээ" })
  } catch (error) {
    console.error("PUT Company Profile Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}