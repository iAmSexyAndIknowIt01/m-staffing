import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value

    // Хамгаалалт: Зөвхөн нэвтэрсэн хэрэглэгч харах боломжтой
    if (!userId) {
      return NextResponse.json(
        { error: "Нэвтрэх шаардлагатай байна." },
        { status: 401 }
      )
    }

    // Зөвхөн идэвхтэй (нээлттэй) ажлын байруудыг хамгийн сүүлийнхээс нь эхэлж татах
    const { data: jobs, error } = await supabase
      .from("mt_openjob")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, jobs }, { status: 200 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Ажлын зарууд татахад алдаа гарлаа:", error)
    return NextResponse.json(
      { error: error.message || "Серверт алдаа гарлаа." },
      { status: 500 }
    )
  }
}