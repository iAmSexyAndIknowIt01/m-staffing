import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

// 1. Хэрэглэгчийн хадгалсан бүх ажлын ID-г авах (GET)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    if (!userId || userRole !== "staff") {
      return NextResponse.json(
        { error: "Хандах эрхгүй байна." },
        { status: 403 }
      )
    }

    // job_bookmarks хүснэгтээс тухайн хэрэглэгчийн хадгалсан job_id-уудыг татах
    const { data, error } = await supabase
      .from("job_bookmarks")
      .select("job_id")
      .eq("user_id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bookmarks: data.map((b) => b.job_id) })
  } catch (err: any) {
    console.error("GET BOOKMARKS ERROR:", err)
    return NextResponse.json(
      { error: "Серверийн алдаа гарлаа." },
      { status: 500 }
    )
  }
}

// 2. Bookmark нэмэх эсвэл хасах (POST) -> job_bookmarks рүү insert/delete хийх
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    if (!userId || userRole !== "staff") {
      return NextResponse.json(
        { error: "Хандах эрхгүй байна." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { job_id } = body

    if (!job_id) {
      return NextResponse.json({ error: "Job ID шаардлагатай" }, { status: 400 })
    }

    // Аль хэдийн хадгалсан эсэхийг шалгах
    const { data: existing, error: findError } = await supabase
      .from("job_bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("job_id", job_id)
      .maybeSingle()

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    if (existing) {
      // Хэрэв байвал устгах (Unbookmark / Remove)
      const { error: deleteError } = await supabase
        .from("job_bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("job_id", job_id)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }
      return NextResponse.json({ status: "removed" })
    } else {
      // Байхгүй бол insert хийх (Bookmark Add)
      const { error: insertError } = await supabase
        .from("job_bookmarks")
        .insert({ user_id: userId, job_id })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      return NextResponse.json({ status: "added" })
    }
  } catch (err: any) {
    console.error("POST BOOKMARKS ERROR:", err)
    return NextResponse.json(
      { error: "Серверийн алдаа гарлаа." },
      { status: 500 }
    )
  }
}