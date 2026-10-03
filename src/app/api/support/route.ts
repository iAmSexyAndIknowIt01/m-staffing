import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    // 1. ХАНДАХ ЭРХ ШАЛГАХ
    const session = await getSession()
    const userId = session?.userId
    const userRole = session?.role

    // Зөвшөөрөгдсөн ролуудыг шалгах (company эсвэл staff)
    if (!userId || (userRole !== "company" && userRole !== "staff")) {
      return NextResponse.json(
        { error: "Хандах эрхгүй байна. Зөвхөн бүртгэлтэй хэрэглэгч хүсэлт илгээх боломжтой." },
        { status: 403 }
      )
    }

    // 2. ФОРМЫН ӨГӨГДӨЛ ХҮЛЭЭЖ АВАХ
    const body = await request.json()
    const { category, title, message } = body

    if (!category || !title || !message) {
      return NextResponse.json(
        { error: "Бүх талбарыг бүрэн бөглөнө үү." },
        { status: 400 }
      )
    }

    // 3. 6 ОРОНТОЙ RANDOM ID ҮҮСГЭХ (100,000 - 999,999)
    const randomId = Math.floor(100000 + Math.random() * 900000)

    // 4. ДАТАБАЗАД ХАДГАЛАХ
    const { data, error } = await supabase
      .from("mt_support")
      .insert([
        {
          id: randomId,
          user_id: userId,
          category,
          title,
          message,
          status: "pending",
          flag: userRole
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Таны хүсэлтийг хүлээн авлаа. Менежер тун удахгүй холбогдох болно.",
      data
    })

  } catch (error) {
    console.error("SUPPORT API ERROR:", error)
    return NextResponse.json(
      { error: "Серверийн алдаа гарлаа." },
      { status: 500 }
    )
  }
}