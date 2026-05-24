import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json()

    if (!email || !password || !role) {
      return NextResponse.json(
        { message: "Мэдээлэл дутуу байна" },
        { status: 400 }
      )
    }

    // 1. Supabase Auth Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      return NextResponse.json(
        { message: "Имэйл эсвэл нууц үг буруу байна" },
        { status: 401 }
      )
    }

    const userId = data.user.id

    // 2. ROLE CHECK
    if (role === "staff") {
      const { data: staff, error: staffError } = await supabase
        .from("mt_staff")
        .select("id")
        .eq("id", userId)
        .maybeSingle()

      if (staffError || !staff) {
        await supabase.auth.signOut()
        return NextResponse.json(
          { message: "Ажил хайгч бүртгэл олдсонгүй" },
          { status: 403 }
        )
      }
    }

    if (role === "company") {
      const { data: company, error: companyError } = await supabase
        .from("mt_company")
        .select("id")
        .eq("id", userId)
        .maybeSingle()

      if (companyError || !company) {
        await supabase.auth.signOut()
        return NextResponse.json(
          { message: "Ажил олгогч бүртгэл олдсонгүй" },
          { status: 403 }
        )
      }
    }

    // 3. SUCCESS & SET COOKIE
    const redirectUrl = role === "staff" ? "/dashboard" : "/dashboard"
    const response = NextResponse.json({
      success: true,
      user: { id: userId, email: data.user.email, role },
      redirect: redirectUrl,
    })

    // Cookie-д хэрэглэгчийн мэдээллийг аюулгүй хадгалах
    // Тэмдэглэл: Бодит амьдрал дээр Supabase Access Token-ийг мөн ингэж хадгалдаг
    response.cookies.set("user_id", userId, {
      path: "/",
      httpOnly: false, // Dashboard (Client side) дээр унших шаардлагатай бол false, зөвхөн API/Server-д бол true
      secure: process.env.NODE_ENV === "production", // Зөвхөн HTTPS дээр ажиллана (Production-д)
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 хоног хадгална
    })

    response.cookies.set("user_role", role, {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
    })

    return response

  } catch {
    return NextResponse.json(
      { message: "Системийн алдаа" },
      { status: 500 }
    )
  }
}