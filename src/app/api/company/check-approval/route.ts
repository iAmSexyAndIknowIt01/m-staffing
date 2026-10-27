// app/api/company/check-approval/route.ts
import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { hasReachedJobLimit } from "@/lib/plans"

export async function GET() {
  try {
    const session = await getSession()
    const userId = session?.userId

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

    // Зар нэмэх хуудсанд урьдчилан анхааруулахын тулд багцын лимитийг хамт буцаана
    const jobLimit = await hasReachedJobLimit(userId)

    return NextResponse.json({ success: true, is_approved: company.is_approved, job_limit: jobLimit }, { status: 200 })
  } catch (error) {
    console.error("Компанийн төлөв шалгахад алдаа гарлаа:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}