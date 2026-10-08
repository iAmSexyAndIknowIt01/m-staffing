import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { getContractCandidates } from "@/lib/contractServer"

export const revalidate = 0

// Гэрээ хуудасны табуудад харуулах тоо:
// awaiting — ажилтны гарын үсэг хүлээж буй, drafts — илгээгээгүй ноорог, candidates — гэрээ үүсгэх боломжтой анкет
export async function GET() {
  try {
    const session = await getSession()
    const companyId = session?.userId
    if (!companyId || session?.role !== "company") {
      return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })
    }

    const count = (status: string) =>
      supabase
        .from("tr_contract")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", status)

    const [awaiting, drafts, candidates] = await Promise.all([count("sent"), count("draft"), getContractCandidates(companyId)])

    if (awaiting.error) throw awaiting.error
    if (drafts.error) throw drafts.error

    return NextResponse.json({
      success: true,
      data: { awaiting: awaiting.count ?? 0, drafts: drafts.count ?? 0, candidates: candidates.length },
    })
  } catch (error) {
    console.error("Contract Summary Fetch Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}
