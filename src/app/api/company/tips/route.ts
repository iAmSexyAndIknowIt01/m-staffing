import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase" // Таны төслийн supabase client холболт

export async function GET() {
  try {
    // 1. КОМПАНИ ЭРХТЭЙ ЭСЭХИЙГ ШАЛГАХ
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    if (!userId || userRole !== "company") {
      return NextResponse.json(
        { error: "Хандах эрхгүй байна. Зөвхөн компани эрхтэй хэрэглэгч харах боломжтой." },
        { status: 403 }
      )
    }

    // 2. SUPABASE-ЭЭС FLAG = 'COMPANY' БӨГӨӨД ИДЭВХТЭЙ ДАТАГ ТАТАХ
    const { data: tips, error } = await supabase
      .from("mt_tips")
      .select("id, title, icon, content, detail_url, views_count, created_at")
      .eq("flag", "company")
      .eq("is_active", true)
      .order("created_at", { ascending: false }) // Хамгийн сүүлийнхийг дээр нь гаргах

    if (error) {
      throw error
    }

    // 3. АМЖИЛТТАЙ БОЛ ДАТАГ БУЦААХ
    return NextResponse.json({ 
      success: true, 
      data: tips || [] 
    })

  } catch (error: any) {
    console.error("COMPANY GET TIPS ERROR:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Зөвлөгөөний мэдээллийг татаж чадсангүй." },
      { status: 500 }
    )
  }
}