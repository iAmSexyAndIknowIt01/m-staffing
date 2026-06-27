import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

// 1. ТӨЛБӨРИЙН ТҮҮХ ТАТАХ (GET)
export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: "Нэвтрээгүй байна." }, { status: 401 })
    }

    const { data: invoices, error } = await supabase
      .from("mt_company_invoices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }) // Шинэ нь дээрээ харагдана

    if (error) throw error

    return NextResponse.json({ success: true, invoices })
  } catch (error: any) {
    console.error("Fetch Invoices Error:", error)
    return NextResponse.json({ success: false, error: "Түүх татахад алдаа гарлаа." }, { status: 500 })
  }
}

// 2. НЭХЭМЖЛЭХ ҮҮСГЭХ / ХАДГАЛАХ (POST)
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: "Нэвтрээгүй байна." }, { status: 401 })
    }

    const body = await req.json()
    const { plan_type, init_only } = body

    if (!plan_type || !["standard", "premium"].includes(plan_type)) {
      return NextResponse.json({ success: false, error: "Багцын төрөл буруу байна." }, { status: 400 })
    }

    const planDetails: Record<string, { price: number }> = {
      standard: { price: 150000 },
      premium: { price: 350000 }
    }

    const selectedPlan = planDetails[plan_type]

    // Санамсаргүй 4 оронтой тоотой гүйлгээний утга үүсгэх
    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    const invoiceNumber = `MSTAFF-${randomDigits}`

    const invoicePayload = {
      invoiceNumber: invoiceNumber,
      amount: selectedPlan.price,
      bankName: "Хаан Банк",
      accountNumber: "5011XXXXXX", // Өөрийн дансаар солиорой
      accountName: "Эм СТАФФИНГ ХХК"
    }

    // Хэрэв зөвхөн анх модал нээхэд данс харах гэж байгаа бол Insert хийхгүй
    if (init_only) {
      return NextResponse.json({ success: true, invoice: invoicePayload })
    }

    // Слайдерыг гүйлгэж дууссан тул Өгөгдлийн сан руу бодитоор хадгална
    const { error: invoiceError } = await supabase
      .from("mt_company_invoices")
      .insert({
        user_id: userId,
        invoice_number: invoiceNumber,
        plan_type: plan_type,
        amount: selectedPlan.price,
        status: "pending"
      })

    if (invoiceError) throw invoiceError

    return NextResponse.json({ success: true, message: "Амжилттай хадгалагдлаа." })

  } catch (error: any) {
    console.error("Billing Upgrade API Error:", error)
    return NextResponse.json({ success: false, error: "Серверийн алдаа гарлаа." }, { status: 500 })
  }
}