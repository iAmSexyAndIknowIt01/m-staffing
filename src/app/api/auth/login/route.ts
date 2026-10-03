import { NextResponse } from "next/server"
import { createAuthClient, supabase } from "@/lib/supabase"
import {
  SESSION_COOKIE,
  createSessionToken,
  isAdminEmail,
  sessionCookieOptions,
} from "@/lib/session"

// Brute force хамгаалалт: 15 минутад нэг имэйл рүү 5, нэг IP-ээс 20 амжилтгүй оролдлого
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS_PER_EMAIL = 5
const MAX_FAILS_PER_IP = 20

function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for")
  return forwarded?.split(",")[0].trim() || req.headers.get("x-real-ip") || null
}

async function isRateLimited(email: string, ip: string | null): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  const countFails = (column: "email" | "ip", value: string) =>
    supabase
      .from("auth_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq(column, value)
      .gte("created_at", since)

  const [byEmail, byIp] = await Promise.all([
    countFails("email", email),
    ip ? countFails("ip", ip) : Promise.resolve({ count: 0, error: null }),
  ])

  if (byEmail.error || byIp.error) {
    // Хязгаарлалтын хүснэгт ажиллахгүй бол нэвтрэлтийг бүхэлд нь хаахгүй
    console.error("LOGIN_RATE_LIMIT_ERROR:", byEmail.error || byIp.error)
    return false
  }

  return (byEmail.count ?? 0) >= MAX_FAILS_PER_EMAIL || (byIp.count ?? 0) >= MAX_FAILS_PER_IP
}

async function recordFailure(email: string, ip: string | null) {
  const { error } = await supabase.from("auth_login_attempts").insert({ email, ip })
  if (error) console.error("LOGIN_ATTEMPT_RECORD_ERROR:", error)

  // Хүснэгт хязгааргүй томрохгүйн тулд хааяа 1 хоногоос хуучин бичлэгүүдийг цэвэрлэнэ
  if (Math.random() < 0.02) {
    const { error: purgeError } = await supabase.rpc("purge_old_login_attempts")
    if (purgeError) console.error("LOGIN_ATTEMPT_PURGE_ERROR:", purgeError)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { password, role } = body
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

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

    const ip = getClientIp(req)
    if (await isRateLimited(email, ip)) {
      return NextResponse.json(
        { message: "Хэт олон удаа буруу оролдлоо. 15 минутын дараа дахин оролдоно уу." },
        { status: 429 }
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
      await recordFailure(email, ip)
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

    // Амжилттай нэвтэрсэн тул тухайн имэйлийн амжилтгүй оролдлогуудыг тэглэнэ
    await supabase.from("auth_login_attempts").delete().eq("email", email)

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
