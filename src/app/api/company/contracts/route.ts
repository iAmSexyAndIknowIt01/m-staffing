import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { one } from "@/lib/relation"
import { DEFAULT_CONTRACT_TERMS, parseSalary, toContractSalaryType, todayISO } from "@/lib/contracts"
import { CONTRACT_LIST_COLUMNS, logContractEvent, normalizeContract, refreshContractDeadlines } from "@/lib/contractServer"

export const revalidate = 0

const unauthorized = () => NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })

// 1. Компанийн бүх гэрээ
export async function GET(request: Request) {
  try {
    const session = await getSession()
    const companyId = session?.userId
    if (!companyId || session?.role !== "company") return unauthorized()

    await refreshContractDeadlines({ column: "company_id", id: companyId }, request)

    const { data, error } = await supabase
      .from("tr_contract")
      .select(CONTRACT_LIST_COLUMNS)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: (data || []).map(normalizeContract) })
  } catch (error) {
    console.error("Company Contracts Fetch Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}

// 2. Тэнцсэн анкетаас гэрээний ноорог үүсгэх. Амьд гэрээ байгаа бол түүнийг буцаана.
export async function POST(request: Request) {
  try {
    const session = await getSession()
    const companyId = session?.userId
    if (!companyId || session?.role !== "company") return unauthorized()

    const { job_request_id: jobRequestId } = await request.json()
    if (!jobRequestId || typeof jobRequestId !== "string") {
      return NextResponse.json({ error: "Мэдээлэл дутуу байна." }, { status: 400 })
    }

    // Зөвхөн өөрийн компанийн зарт ирсэн, тэнцсэн анкет
    const { data: jobRequest } = await supabase
      .from("tr_job_request")
      .select(`
        id, status, applicant_id, applicant_name, applicant_email,
        mt_openjob!inner ( id, title, salary, salary_type, location, user_id, mt_company ( company_name ) )
      `)
      .eq("id", jobRequestId)
      .eq("mt_openjob.user_id", companyId)
      .maybeSingle()

    if (!jobRequest) {
      return NextResponse.json({ error: "Анкет олдсонгүй эсвэл хандах эрхгүй байна." }, { status: 404 })
    }
    if (jobRequest.status !== "approved") {
      return NextResponse.json({ error: "Зөвхөн тэнцсэн анкетаас гэрээ байгуулна." }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from("tr_contract")
      .select("id")
      .eq("job_request_id", jobRequestId)
      .in("status", ["draft", "sent", "active"])
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, data: { id: existing.id }, existing: true })
    }

    const job = one(jobRequest.mt_openjob)
    if (!job) return NextResponse.json({ error: "Ажлын байр олдсонгүй." }, { status: 404 })

    const { data: created, error } = await supabase
      .from("tr_contract")
      .insert({
        job_request_id: jobRequest.id,
        job_id: job.id,
        company_id: companyId,
        staff_id: jobRequest.applicant_id,
        company_name: one(job.mt_company)?.company_name || "Ажил олгогч",
        staff_name: jobRequest.applicant_name || "Ажилтан",
        staff_email: jobRequest.applicant_email,
        position: job.title || "Ажилтан",
        salary: parseSalary(job.salary),
        salary_type: toContractSalaryType(job.salary_type),
        start_date: todayISO(),
        location: job.location || null,
        terms: DEFAULT_CONTRACT_TERMS,
      })
      .select("id")
      .single()

    if (error) {
      // Зэрэг хоёр хүсэлт ирж unique index-д баригдсан
      if (error.code === "23505") {
        return NextResponse.json({ error: "Энэ анкетад гэрээ аль хэдийн үүссэн байна." }, { status: 409 })
      }
      throw error
    }

    await logContractEvent(created.id, "company", companyId, "create")

    return NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 })
  } catch (error) {
    console.error("Company Contract Create Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}
