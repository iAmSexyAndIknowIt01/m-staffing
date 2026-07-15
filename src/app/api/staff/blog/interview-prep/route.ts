import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // 1. Супабэйс рүү хүсэлт илгээж mt_tips хүснэгтээс датаг шүүнэ
    const { data, error } = await supabase
      .from("mt_tips")
      .select(`
        id,
        title,
        icon,
        content,
        detail_url,
        created_at
      `)
      .in("detail_url", ["dashboard/staff/blog/interview-prep"])
      .order("created_at", { ascending: false })

    // 2. Алдаа гарвал буцаах хэсэг
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // 3. Амжилттай бол өгөгдлийг буцаана
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json(
      { error: "Серверийн алдаа гарлаа." },
      { status: 500 }
    )
  }
}