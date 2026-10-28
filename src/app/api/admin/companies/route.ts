import { NextResponse, after } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSession } from "@/lib/session"
import { appLink, sendNotice } from "@/lib/notifications"

const forbidden = () =>
  NextResponse.json({ success: false, error: "Хандах эрхгүй байна." }, { status: 403 })

// Баталгаажуулалт хүлээж буй (is_approved ≠ "approved") байгууллагууд
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.isAdmin) return forbidden()

    const { data, error } = await supabase
      .from("mt_company")
      .select("id, company_name, email, phone, is_approved")
      .or("is_approved.is.null,is_approved.neq.approved")
      .limit(500)

    if (error) throw error
    return NextResponse.json({ success: true, companies: data ?? [] })
  } catch (error) {
    console.error("ADMIN_COMPANIES_GET_ERROR:", error)
    return NextResponse.json({ success: false, error: "Өгөгдөл татахад алдаа гарлаа." }, { status: 500 })
  }
}

// Байгууллагыг баталгаажуулж, имэйлээр мэдэгдэнэ
export async function PUT(req: Request) {
  try {
    const session = await getSession()
    if (!session?.isAdmin) return forbidden()

    const { company_id } = (await req.json().catch(() => ({}))) as { company_id?: unknown }
    if (typeof company_id !== "string" || !company_id) {
      return NextResponse.json({ success: false, error: "Буруу хүсэлт." }, { status: 400 })
    }

    // Аль хэдийн баталгаажсан бол дахин мэйл явуулахгүй (хоёр админ зэрэг дарах)
    const { data: updated, error } = await supabase
      .from("mt_company")
      .update({ is_approved: "approved" })
      .eq("id", company_id)
      .or("is_approved.is.null,is_approved.neq.approved")
      .select("id, company_name, email")
      .maybeSingle()

    if (error) throw error
    if (!updated) {
      return NextResponse.json({ success: false, error: "Байгууллага олдсонгүй эсвэл аль хэдийн баталгаажсан байна." }, { status: 409 })
    }

    after(() =>
      sendNotice({
        req,
        userId: String(updated.id),
        role: "company",
        type: "company_approval",
        to: updated.email,
        subject: "Танай байгууллага баталгаажлаа",
        lines: [
          `${updated.company_name || "Танай байгууллага"} MStaffing-д баталгаажлаа.`,
          "Одоо ажлын зар нийтэлж, ажил хайгчдаас анкет хүлээн авах боломжтой.",
        ],
        link: appLink(req, "/dashboard/company/post-job/add", "Зар нийтлэх"),
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("ADMIN_COMPANIES_PUT_ERROR:", error)
    return NextResponse.json({ success: false, error: "Серверийн алдаа гарлаа." }, { status: 500 })
  }
}
