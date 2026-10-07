import { NextResponse } from "next/server"
import { createAuthClient, supabase } from "@/lib/supabase"
import {
  SESSION_COOKIE,
  createSessionToken,
  isAdminEmail,
  sessionCookieOptions,
} from "@/lib/session"
import {
  LOCK_UNAVAILABLE,
  LOCK_WINDOW_MS,
  MAX_FAILS_PER_EMAIL_IP,
  type LockReason,
  type LockStatus,
  computeLock,
  minutesUntil,
} from "@/lib/loginLock"
import { getClientIp } from "@/lib/clientIp"

async function getLockStatus(email: string, ip: string | null): Promise<LockStatus> {
  const since = new Date(Date.now() - LOCK_WINDOW_MS).toISOString()
  const attempts = () => supabase.from("auth_login_attempts")

  // IP тодорхойгүй бол (локал орчин г.м.) IP-гүй оролдлогуудыг нэг бүлэг гэж үзнэ
  const byEmailIpQuery = attempts()
    .select("created_at")
    .eq("email", email)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_FAILS_PER_EMAIL_IP)

  const [byEmailIp, byEmail, byIp] = await Promise.all([
    ip ? byEmailIpQuery.eq("ip", ip) : byEmailIpQuery.is("ip", null),
    attempts().select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since),
    ip
      ? attempts().select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", since)
      : Promise.resolve({ count: 0, error: null }),
  ])

  const error = byEmailIp.error || byEmail.error || byIp.error
  if (error) {
    // Хязгаарлалтын хүснэгт ажиллахгүй бол нэвтрэлтийг бүхэлд нь хаахгүй
    console.error("LOGIN_RATE_LIMIT_ERROR:", error)
    return LOCK_UNAVAILABLE
  }

  return computeLock({
    emailIpFailTimes: (byEmailIp.data ?? []).map((r) => r.created_at),
    emailFails: byEmail.count ?? 0,
    ipFails: byIp.count ?? 0,
  })
}

function lockedResponse(unlockAt: Date | null, reason: LockReason | null) {
  const minutes = minutesUntil(unlockAt)
  const cause = reason === "email_ip"
    ? `Нууц үгээ ${MAX_FAILS_PER_EMAIL_IP} удаа буруу оруулсан тул бүртгэл түр түгжигдлээ.`
    : "Хэт олон удаа буруу оролдлого хийгдсэн тул нэвтрэлт түр хаагдлаа."
  return NextResponse.json(
    {
      message: `${cause} ${minutes} минутын дараа дахин оролдох, эсвэл «Нууц үгээ мартсан уу?» холбоосоор нууц үгээ сэргээнэ үү.`,
      locked: true,
      unlockAt: unlockAt?.toISOString() ?? null,
    },
    { status: 429, headers: { "Retry-After": String(minutes * 60) } }
  )
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
    const lock = await getLockStatus(email, ip)
    if (lock.locked) {
      return lockedResponse(lock.unlockAt, lock.reason)
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

      // Түгжээний хүснэгт ажиллахгүй бол үлдсэн оролдлогын тоог (буруу) харуулахгүй
      if (!lock.available) {
        return NextResponse.json({ message: "Имэйл эсвэл нууц үг буруу байна" }, { status: 401 })
      }

      // Энэ оролдлогоор түгжигдсэн бол шууд мэдэгдэнэ
      const remaining = MAX_FAILS_PER_EMAIL_IP - (lock.failsByEmailIp + 1)
      if (remaining <= 0) {
        return lockedResponse(new Date(Date.now() + LOCK_WINDOW_MS), "email_ip")
      }

      // Бүртгэлгүй имэйлд ч адилхан тоолж хариулдаг тул имэйл бүртгэлтэй эсэх ил гарахгүй
      return NextResponse.json(
        {
          message: `Имэйл эсвэл нууц үг буруу байна. ${remaining} оролдлого үлдлээ.`,
          remainingAttempts: remaining,
        },
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
