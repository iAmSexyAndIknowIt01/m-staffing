import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { companyCanViewStaff, unlockStaffContact } from "@/lib/staffContactAccess"
import { getEffectiveSubscription } from "@/lib/plans"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// «Ажиллах хүсэлт илгээх»: 1 зар нийтлэх эрх хасаж ажилтны утас, имэйлийг 10 цаг нээнэ.
// Аль хэдийн нээлттэй (эсвэл анкет илгээсэн ажилтан) бол эрх хасахгүй.
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.userId || session.role !== "company") {
      return NextResponse.json({ error: "Компанийн эрхээр нэвтэрнэ үү." }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const staffId = typeof body?.staffId === "string" ? body.staffId : ""
    if (!UUID_RE.test(staffId)) {
      return NextResponse.json({ error: "Ажилтны ID буруу байна." }, { status: 400 })
    }

    if (!(await companyCanViewStaff(session.userId, staffId))) {
      return NextResponse.json({ error: "Энэ ажилтан профайлаа нээлттэй болгоогүй байна." }, { status: 403 })
    }

    const result = await unlockStaffContact(session.userId, staffId)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 402 })
    }

    const [{ data: profile, error }, subscription] = await Promise.all([
      supabase.from("mt_profile").select("email, phone").eq("user_id", staffId).maybeSingle(),
      getEffectiveSubscription(session.userId),
    ])
    if (error) throw error

    return NextResponse.json({
      success: true,
      charged: result.charged,
      contactAccess: result.access,
      email: profile?.email || "",
      phone: profile?.phone || "",
      remainingCredits: subscription.remaining,
    })
  } catch (error) {
    console.error("STAFF CONTACT UNLOCK ERROR:", error)
    return NextResponse.json({ error: "Серверийн алдаа гарлаа. Дахин оролдоно уу." }, { status: 500 })
  }
}

// Товч дээр харуулах үлдсэн эрх
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId || session.role !== "company") {
      return NextResponse.json({ error: "Компанийн эрхээр нэвтэрнэ үү." }, { status: 403 })
    }
    const subscription = await getEffectiveSubscription(session.userId)
    return NextResponse.json({
      success: true,
      remainingCredits: subscription.remaining,
      expired: subscription.status === "expired",
    })
  } catch (error) {
    console.error("STAFF CONTACT CREDITS ERROR:", error)
    return NextResponse.json({ error: "Серверийн алдаа гарлаа." }, { status: 500 })
  }
}
