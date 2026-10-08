import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { randomInt } from "crypto"

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

    if (
      typeof category !== "string" || typeof title !== "string" || typeof message !== "string" ||
      !category.trim() || !title.trim() || !message.trim()
    ) {
      return NextResponse.json(
        { error: "Бүх талбарыг бүрэн бөглөнө үү." },
        { status: 400 }
      )
    }

    if (category.length > 100 || title.length > 200 || message.length > 5000) {
      return NextResponse.json(
        { error: "Оруулсан мэдээлэл хэт урт байна." },
        { status: 400 }
      )
    }

    // 3-4. 6 ОРОНТОЙ RANDOM ID ҮҮСГЭЖ ХАДГАЛАХ (100,000 - 999,999).
    // ID давхцвал (unique_violation) шинэ ID-аар дахин оролдоно.
    let data = null
    for (let attempt = 0; attempt < 5 && !data; attempt++) {
      const result = await supabase
        .from("mt_support")
        .insert([
          {
            id: randomInt(100000, 1000000),
            user_id: userId,
            category: category.trim(),
            title: title.trim(),
            message: message.trim(),
            status: "pending",
            flag: userRole
          }
        ])
        .select()

      if (result.error?.code === "23505") continue
      if (result.error) throw result.error
      data = result.data
    }

    if (!data) throw new Error("SUPPORT_ID_COLLISION")

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