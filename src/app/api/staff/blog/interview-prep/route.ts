import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
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
      .eq("is_active", true) // Идэвхгүй болгосон зөвлөгөөг харуулахгүй
      .order("created_at", { ascending: false })

    // 2. Алдаа гарвал буцаах хэсэг
    if (error) {
      return NextResponse.json(
        { error: "Серверийн алдаа гарлаа." },
        { status: 500 }
      )
    }

    // 3. Амжилттай бол өгөгдлийг буцаана
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Серверийн алдаа гарлаа." },
      { status: 500 }
    )
  }
}