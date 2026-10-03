import { cache } from "react"
import { cookies } from "next/headers"
import type { UserRole } from "@/types/auth"

// Гарын үсэгтэй (HMAC-SHA256) session cookie.
// Cookie-г клиент талаас өөрчилбөл гарын үсэг таарахгүй тул хүчингүй болно.
// Web Crypto ашигласан тул proxy.ts болон Node runtime аль алинд ажиллана.

export const SESSION_COOKIE = "session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 хоног

export interface Session {
  userId: string
  role: UserRole
  email: string
  isAdmin: boolean
  iat?: number // unix seconds — хуучин cookie-д байхгүй байж болно
  exp: number // unix seconds
}

const encoder = new TextEncoder()

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET орчны хувьсагч тохируулаагүй эсвэл хэт богино байна (32+ тэмдэгт)")
  }
  return secret
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return admins.includes(email.toLowerCase())
}

export async function createSessionToken(data: Omit<Session, "iat" | "exp">): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const session: Session = { ...data, iat: now, exp: now + SESSION_MAX_AGE }
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)))
  const signature = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(payload))
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return null

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      fromBase64Url(signature) as BufferSource,
      encoder.encode(payload)
    )
    if (!valid) return null

    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as Session
    if (!session.userId || !session.role || session.exp < Math.floor(Date.now() / 1000)) return null
    return session
  } catch {
    return null
  }
}

// Гарын үсэг зөв ч session одоо хүчинтэй хэвээр эсэхийг DB-ээс шалгана:
// - админ эрх ADMIN_EMAILS-ээс хасагдсан бол хүчингүй
// - staff/company бүртгэл устсан бол хүчингүй
// - auth_session_revocations-д бүртгэгдсэнээс өмнө үүссэн бол хүчингүй (албадан гаргах)
async function isSessionStillValid(session: Session): Promise<boolean> {
  // proxy.ts энэ модулийг импортлодог тул supabase-г зөвхөн хэрэгтэй үед ачаална
  const { supabase } = await import("@/lib/supabase")

  const issuedAt = session.iat ?? session.exp - SESSION_MAX_AGE
  const accountTable = session.role === "staff" ? "mt_staff" : "mt_company"

  const [revocation, account] = await Promise.all([
    supabase
      .from("auth_session_revocations")
      .select("revoked_before")
      .eq("user_id", session.userId)
      .maybeSingle(),
    session.isAdmin
      ? Promise.resolve({ data: { id: session.userId }, error: null })
      : supabase.from(accountTable).select("id").eq("id", session.userId).maybeSingle(),
  ])

  if (session.isAdmin && !isAdminEmail(session.email)) return false

  if (account.error) throw account.error
  if (!account.data) return false

  // Хүснэгт хараахан үүсээгүй (migration ажиллаагүй) үед нэвтрэлтийг хаахгүй
  if (revocation.error) {
    console.error("SESSION_REVOCATION_CHECK_ERROR:", revocation.error)
    return true
  }
  if (revocation.data) {
    const revokedBefore = Math.floor(new Date(revocation.data.revoked_before).getTime() / 1000)
    if (issuedAt < revokedBefore) return false
  }

  return true
}

// Server Component / Route Handler дотроос одоогийн хэрэглэгчийг авах.
// cache() — нэг render дотор олон дуудагдсан ч DB-г нэг л удаа шалгана.
export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies()
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)
  if (!session) return null

  try {
    return (await isSessionStillValid(session)) ? session : null
  } catch (err) {
    console.error("SESSION_VALIDATION_ERROR:", err)
    return null
  }
})

export const sessionCookieOptions = {
  path: "/",
  httpOnly: true, // JavaScript-ээс унших боломжгүй
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: SESSION_MAX_AGE,
}
