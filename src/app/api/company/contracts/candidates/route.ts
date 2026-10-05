import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { one } from "@/lib/relation"

export const revalidate = 0

// Гэрээ байгуулах боломжтой анкетууд: тэнцсэн (approved) бөгөөд амьд (draft/sent/active) гэрээгүй
export async function GET() {
  try {
    const session = await getSession()
    const companyId = session?.userId
    if (!companyId || session?.role !== "company") {
      return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })
    }

    const [requests, liveContracts] = await Promise.all([
      supabase
        .from("tr_job_request")
        .select(`
          id, created_at, applicant_name, applicant_email, applicant_phone,
          mt_openjob!inner ( id, title, job_type, location, user_id )
        `)
        .eq("mt_openjob.user_id", companyId)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
      supabase
        .from("tr_contract")
        .select("job_request_id")
        .eq("company_id", companyId)
        .in("status", ["draft", "sent", "active"]),
    ])

    if (requests.error) throw requests.error
    if (liveContracts.error) throw liveContracts.error

    const taken = new Set((liveContracts.data || []).map((c) => c.job_request_id))

    const data = (requests.data || [])
      .filter((req) => !taken.has(req.id))
      .map((req) => ({
        id: req.id,
        user_name: req.applicant_name || "Нэргүй ажил горилогч",
        job_title: one(req.mt_openjob)?.title || "Тодорхойгүй ажлын байр",
        job_type: one(req.mt_openjob)?.job_type || "",
        location: one(req.mt_openjob)?.location || "",
        email: req.applicant_email || "",
        phone: req.applicant_phone || "",
        created_at: req.created_at,
      }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Contract Candidates Fetch Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}
