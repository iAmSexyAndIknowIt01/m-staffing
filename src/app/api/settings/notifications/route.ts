import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { getNotificationSettings, saveNotificationSettings } from "@/lib/notifications"
import { normalizeNotificationSettings } from "@/lib/notificationCatalog"

const unauthorized = () => NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 })

// Мэдэгдэл хүрэх имэйл хаяг (тохиргооны хуудсанд харуулна)
async function getAccountEmail(userId: string, role: "staff" | "company") {
  const { data } = await supabase
    .from(role === "staff" ? "mt_staff" : "mt_company")
    .select("email")
    .eq("id", userId)
    .maybeSingle()
  return (data?.email as string | null | undefined) ?? null
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId || (session.role !== "staff" && session.role !== "company")) return unauthorized()

    const [settings, email] = await Promise.all([
      getNotificationSettings(session.userId),
      getAccountEmail(session.userId, session.role),
    ])
    return NextResponse.json({ success: true, settings, email })
  } catch (error) {
    console.error("NOTIFICATION_SETTINGS_GET_ERROR:", error)
    return NextResponse.json({ error: "Тохиргоо уншихад алдаа гарлаа." }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session?.userId || (session.role !== "staff" && session.role !== "company")) return unauthorized()

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Буруу хүсэлт." }, { status: 400 })
    }

    const settings = normalizeNotificationSettings(body)
    await saveNotificationSettings(session.userId, session.role, settings)
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error("NOTIFICATION_SETTINGS_PUT_ERROR:", error)
    return NextResponse.json({ error: "Тохиргоо хадгалахад алдаа гарлаа." }, { status: 500 })
  }
}
