import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { one } from "@/lib/relation"
import { TOKEN_COSTS } from "@/lib/planCatalog"
import { parsePaging } from "@/lib/paging"

// Компанийн M токен зарцуулалтын түүх.
//   ?reason=post|reopen|extend|contact_unlock — төрлөөр шүүх
//   ?limit=10&offset=0 — хуудаслалт (billing хуудас 10, дэлгэрэнгүй хуудас 20-оор)
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.userId || session.role !== "company") {
      return NextResponse.json({ error: "Компанийн эрхээр нэвтэрнэ үү." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const { limit, offset } = parsePaging(searchParams)
    const reason = searchParams.get("reason") ?? ""

    let query = supabase
      .from("tr_job_credit_usage")
      .select("id, reason, tokens, created_at, job_id, mt_openjob (title)", { count: "exact" })
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
    if (Object.hasOwn(TOKEN_COSTS, reason)) query = query.eq("reason", reason)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      total: count ?? 0,
      usage: (data ?? []).map((row) => ({
        id: row.id,
        reason: row.reason,
        tokens: row.tokens,
        createdAt: row.created_at,
        // Зар устгагдсан бол гарчиг байхгүй
        jobTitle: one(row.mt_openjob as { title: string } | { title: string }[] | null)?.title ?? null,
      })),
    })
  } catch (error) {
    console.error("TOKEN_HISTORY_ERROR:", error)
    return NextResponse.json({ error: "Серверийн алдаа гарлаа." }, { status: 500 })
  }
}
