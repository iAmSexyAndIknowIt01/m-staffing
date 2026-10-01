import { NextResponse } from "next/server"
import { createAuthClient, supabase } from "@/lib/supabase"
import {
  SESSION_COOKIE,
  createSessionToken,
  isAdminEmail,
  sessionCookieOptions,
} from "@/lib/session"

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json()

    if (!email || !password || !role) {
      return NextResponse.json(
        { message: "Мэдээлэл дутуу байна" },
        { status: 400 }
      )
    }

    if (role !== "staff" && role !== "company") {
      return NextResponse.json(
        { message: "Хэрэглэгчийн төрөл буруу байна" },
        { status: 400 }
      )
    }

    // Хүсэлт бүрт тусдаа клиент — session нь бусад хэрэглэгчтэй холилдохгүй
    const authClient = createAuthClient()

    // 1. Supabase Auth Login
    const { data, error } = await authClient.auth.signInWithPassword({
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
    const userEmail = data.user.email || email
    const isAdmin = isAdminEmail(userEmail)

    // 2. ROLE CHECK (админ бол staff/company бүртгэлгүй байж болно)
    if (!isAdmin) {
      const table = role === "staff" ? "mt_staff" : "mt_company"
      const { data: account, error: accountError } = await supabase
        .from(table)
        .select("id")
        .eq("id", userId)
        .maybeSingle()

      if (accountError || !account) {
        await authClient.auth.signOut()
        return NextResponse.json(
          {
            message: role === "staff"
              ? "Ажил хайгч бүртгэл олдсонгүй"
              : "Ажил олгогч бүртгэл олдсонгүй",
          },
          { status: 403 }
        )
      }
    }

    // 3. SUCCESS & SET SIGNED SESSION COOKIE
    const response = NextResponse.json({
      success: true,
      user: { id: userId, email: userEmail, role },
      redirect: isAdmin ? "/admin/dashboard" : "/dashboard",
    })

    const token = await createSessionToken({ userId, role, email: userEmail, isAdmin })
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions)

    // Хуучин гарын үсэггүй cookie-г устгана
    response.cookies.delete("user_id")
    response.cookies.delete("user_role")

    return response

  } catch (err) {
    console.error("LOGIN_ERROR:", err)
    return NextResponse.json(
      { message: "Системийн алдаа" },
      { status: 500 }
    )
  }
}
