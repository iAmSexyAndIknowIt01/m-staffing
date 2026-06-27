import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// 1. БҮХ НЭХЭМЖЛЭХИЙГ ТАТАХ (GET)
export async function GET() {
  try {
    const { data: invoices, error } = await supabase
      .from("mt_company_invoices")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, invoices })
  } catch (error: any) {
    console.error("Admin Fetch Invoices Error:", error)
    return NextResponse.json({ success: false, error: "Өгөгдөл татахад алдаа гарлаа." }, { status: 500 })
  }
}

// 2. ТӨЛБӨРИЙН ТӨЛӨВ ӨӨРЧЛӨХ (PUT) - Баталгаажуулах эсвэл Цуцлах хоёуланг нь шийднэ
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { invoice_id, status } = body // status нь "paid" эсвэл "decline" байна

    if (!invoice_id || (status !== "paid" && status !== "decline")) {
      return NextResponse.json({ success: false, error: "Буруу хүсэлт." }, { status: 400 })
    }

    // А. Нэхэмжлэхийг олох
    const { data: invoice, error: findError } = await supabase
      .from("mt_company_invoices")
      .select("*")
      .eq("id", invoice_id)
      .single()

    if (findError || !invoice) {
      return NextResponse.json({ success: false, error: "Нэхэмжлэх олдсонгүй." }, { status: 404 })
    }

    // Хэрэв аль хэдийн шийдэгдсэн бол дахин ажиллуулахгүй
    if (invoice.status === "paid" || invoice.status === "decline") {
      return NextResponse.json({ success: false, error: "Энэ нэхэмжлэх аль хэдийн шийдвэрлэгдсэн байна." }, { status: 400 })
    }

    // Б. Төлөвийг шинэчлэх (paid эсвэл decline)
    const { error: updateInvoiceError } = await supabase
      .from("mt_company_invoices")
      .update({ status: status })
      .eq("id", invoice_id)

    if (updateInvoiceError) throw updateInvoiceError

    // В. Хэрэв АДМИН ТӨЛБӨРИЙГ БАТАЛГААЖУУЛСАН БОЛ (`paid`) Багцыг нь сунгана
    if (status === "paid") {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const jobLimit = invoice.plan_type === "premium" ? 999 : 50
      const planName = invoice.plan_type === "premium" ? "premium" : "standard"

      const { error: subError } = await supabase
        .from("mt_company_subscriptions")
        .update({
          plan_type: planName,
          status: "active",
          job_limit: jobLimit,
          expires_at: expiresAt.toISOString()
        })
        .eq("user_id", invoice.user_id)

      if (subError) {
        console.error("Subscription update error:", subError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: status === "paid" ? "Төлбөр баталгаажиж, багц идэвхжлээ." : "Нэхэмжлэхийг цуцаллаа." 
    })

  } catch (error: any) {
    console.error("Admin Update Invoice Error:", error)
    return NextResponse.json({ success: false, error: "Серверийн алдаа гарлаа." }, { status: 500 })
  }
}

// ❌ Устгах үйлдэл (DELETE)-ийг бүрмөсөн устгав.