import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getTokenLots } from "@/lib/plans"

// Сүүлийн 180 хоногт дууссан багцыг ч (саарал) харуулна
const EXPIRED_HISTORY_DAYS = 180

// Компанийн M токены багцууд: худалдан авалт бүрийн үлдэгдэл, дуусах огноо (billing хуудас)
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId || session.role !== "company") {
      return NextResponse.json({ error: "Компанийн эрхээр нэвтэрнэ үү." }, { status: 403 })
    }
    const since = new Date(Date.now() - EXPIRED_HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const lots = await getTokenLots(session.userId, since)
    return NextResponse.json({ success: true, lots })
  } catch (error) {
    console.error("TOKEN_LOTS_ERROR:", error)
    return NextResponse.json({ error: "Серверийн алдаа гарлаа." }, { status: 500 })
  }
}
