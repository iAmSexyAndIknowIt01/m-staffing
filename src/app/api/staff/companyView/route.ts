import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    // 1. Cookie-нээс user_id болон user_role-ийг унших
    const session = await getSession()
    const userId = session?.userId
    const userRole = session?.role

    // 2. Эрхийн шалгалт хийх (Профайл дээрхтэй ижил)
    if (!userId || userRole !== "staff") {
      return NextResponse.json(
        { error: "Хандах эрхгүй байна." },
        { status: 403 }
      )
    }

    // 3. Request body-оос company_id-ийг авах
    const body = await request.json()
    const { company_id } = body

    if (!company_id) {
      return NextResponse.json({ error: "company_id олдсонгүй" }, { status: 400 })
    }

    // 4. tr_company_views table рүү үзэлтийг insert хийх
    const { error: insertError } = await supabase
      .from("tr_company_views")
      .insert({
        viewer_id: userId, // Күүкинээс авсан userId-ийг онооно
        company_id: company_id
      })

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({ success: true, message: "Үзэлт амжилттай бүртгэгдлээ" }, { status: 200 })

  } catch (error) {
    console.error("Company view log error:", error)
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 })
  }
}