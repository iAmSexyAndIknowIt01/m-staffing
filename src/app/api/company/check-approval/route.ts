// app/api/company/check-approval/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай байна." }, { status: 401 })
    }

    // mt_company хүснэгтээс тухайн хэрэглэгчийн is_approved төлөвийг шалгах
    const { data: company, error } = await supabase
      .from("mt_company")
      .select("is_approved")
      .eq("id", userId)
      .single()

    if (error || !company) {
      return NextResponse.json({ error: "Компанийн мэдээлэл олдсонгүй." }, { status: 404 })
    }

    return NextResponse.json({ success: true, is_approved: company.is_approved }, { status: 200 })
  } catch (error: any) {
    console.error("Компанийн төлөв шалгахад алдаа гарлаа:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}