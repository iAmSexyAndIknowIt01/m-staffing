import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSession } from "@/lib/session"
import { PAID_PLAN_DAYS, PLANS, type PlanType } from "@/lib/plans"

const forbidden = () =>
  NextResponse.json({ success: false, error: "Хандах эрхгүй байна." }, { status: 403 })

// 1. БҮХ НЭХЭМЖЛЭХИЙГ ТАТАХ (GET)
export async function GET() {
  try {
    // Зөвхөн админ хандана
    const session = await getSession()
    if (!session?.isAdmin) return forbidden()

    const { data: invoices, error } = await supabase
      .from("mt_company_invoices")
      .select("id, user_id, invoice_number, plan_type, amount, status, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, invoices })
  } catch (error) {
    console.error("Admin Fetch Invoices Error:", error)
    return NextResponse.json({ success: false, error: "Өгөгдөл татахад алдаа гарлаа." }, { status: 500 })
  }
}

// 2. ТӨЛБӨРИЙН ТӨЛӨВ ӨӨРЧЛӨХ (PUT) - Баталгаажуулах эсвэл Цуцлах хоёуланг нь шийднэ
export async function PUT(req: Request) {
  try {
    // Зөвхөн админ хандана
    const session = await getSession()
    if (!session?.isAdmin) return forbidden()

    const body = await req.json()
    const { invoice_id, status } = body // status нь "paid" эсвэл "decline" байна

    if (!invoice_id || (status !== "paid" && status !== "decline")) {
      return NextResponse.json({ success: false, error: "Буруу хүсэлт." }, { status: 400 })
    }

    // А. Нэхэмжлэхийг олох
    const { data: invoice, error: findError } = await supabase
      .from("mt_company_invoices")
      .select("id, user_id, plan_type, status")
      .eq("id", invoice_id)
      .single()

    if (findError || !invoice) {
      return NextResponse.json({ success: false, error: "Нэхэмжлэх олдсонгүй." }, { status: 404 })
    }

    // Хэрэв аль хэдийн шийдэгдсэн бол дахин ажиллуулахгүй
    if (invoice.status === "paid" || invoice.status === "decline") {
      return NextResponse.json({ success: false, error: "Энэ нэхэмжлэх аль хэдийн шийдвэрлэгдсэн байна." }, { status: 400 })
    }

    // Б. Төлөвийг шинэчлэх (paid эсвэл decline).
    // .eq("status", "pending") — хоёр админ зэрэг дарвал зөвхөн нэг нь амжилттай болно.
    const { data: updated, error: updateInvoiceError } = await supabase
      .from("mt_company_invoices")
      .update({ status: status })
      .eq("id", invoice_id)
      .eq("status", "pending")
      .select("id")

    if (updateInvoiceError) throw updateInvoiceError
    if (!updated || updated.length === 0) {
      return NextResponse.json({ success: false, error: "Энэ нэхэмжлэх аль хэдийн шийдвэрлэгдсэн байна." }, { status: 409 })
    }

    // В. Хэрэв АДМИН ТӨЛБӨРИЙГ БАТАЛГААЖУУЛСАН БОЛ (`paid`) Багцыг нь сунгана
    if (status === "paid") {
      const planType: PlanType = invoice.plan_type === "premium" ? "premium" : "standard"
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + PAID_PLAN_DAYS)

      // Багцын мөр байхгүй байсан ч үүсгэнэ (user_id нь unique)
      const { error: subError } = await supabase
        .from("mt_company_subscriptions")
        .upsert(
          {
            user_id: invoice.user_id,
            plan_type: planType,
            status: "active",
            job_limit: PLANS[planType].jobLimit,
            expires_at: expiresAt.toISOString(),
          },
          { onConflict: "user_id" }
        )

      if (subError) {
        // Багц идэвхжээгүй бол нэхэмжлэхийг "paid" болгож үлдээхгүй — дахин оролдох боломжтой болгоно
        console.error("Subscription update error:", subError)
        await supabase.from("mt_company_invoices").update({ status: "pending" }).eq("id", invoice_id)
        return NextResponse.json(
          { success: false, error: "Багц идэвхжүүлэхэд алдаа гарлаа. Дахин оролдоно уу." },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: status === "paid" ? "Төлбөр баталгаажиж, багц идэвхжлээ." : "Нэхэмжлэхийг цуцаллаа." 
    })

  } catch (error) {
    console.error("Admin Update Invoice Error:", error)
    return NextResponse.json({ success: false, error: "Серверийн алдаа гарлаа." }, { status: 500 })
  }
}

// ❌ Устгах үйлдэл (DELETE)-ийг бүрмөсөн устгав.