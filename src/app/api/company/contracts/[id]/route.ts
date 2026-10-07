import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import {
  CONTRACT_STATUS_LABELS,
  contentHash,
  effectiveStatus,
  isContractAction,
  nextStatus,
  readyToSendError,
  validateContractTerms,
} from "@/lib/contracts"
import { CONTRACT_COLUMNS, contractLink, logContractEvent, normalizeContract, sendContractMail } from "@/lib/contractServer"
import type { Contract } from "@/types/contract"

export const revalidate = 0

interface RouteParams {
  params: Promise<{ id: string }>
}

const unauthorized = () => NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })
const notFound = () => NextResponse.json({ error: "Гэрээ олдсонгүй." }, { status: 404 })
const conflict = () =>
  NextResponse.json({ error: "Гэрээний төлөв өөрчлөгдсөн байна. Хуудсаа шинэчилнэ үү." }, { status: 409 })

async function getCompanyContract(id: string, companyId: string) {
  const { data, error } = await supabase
    .from("tr_contract")
    .select(CONTRACT_COLUMNS)
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle()
  if (error) throw error
  return data ? normalizeContract(data as unknown as Contract) : null
}

// 1. Гэрээний дэлгэрэнгүй + үйлдлийн түүх
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    const companyId = session?.userId
    if (!companyId || session?.role !== "company") return unauthorized()

    const contract = await getCompanyContract(id, companyId)
    if (!contract) return notFound()

    const { data: events } = await supabase
      .from("tr_contract_event")
      .select("id, actor_role, action, meta, created_at")
      .eq("contract_id", id)
      .order("created_at", { ascending: true })

    return NextResponse.json({ success: true, data: contract, events: events || [] })
  } catch (error) {
    console.error("Company Contract Fetch Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}

// 2. Ноорог гэрээний нөхцлийг засах
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    const companyId = session?.userId
    if (!companyId || session?.role !== "company") return unauthorized()

    const validation = validateContractTerms(await request.json())
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

    const { data, error } = await supabase
      .from("tr_contract")
      .update({ ...validation.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("status", "draft") // Зөвхөн ноорог засагдана
      .select(CONTRACT_COLUMNS)
      .maybeSingle()

    if (error) throw error
    if (!data) return conflict()

    await logContractEvent(id, "company", companyId, "edit")

    return NextResponse.json({ success: true, data: normalizeContract(data as unknown as Contract) })
  } catch (error) {
    console.error("Company Contract Update Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}

// 3. Төлөв өөрчлөх: send / revise / cancel / terminate
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    const companyId = session?.userId
    if (!companyId || session?.role !== "company") return unauthorized()

    const body = await request.json()
    const action = body?.action
    if (!isContractAction(action)) {
      return NextResponse.json({ error: "Үйлдэл буруу байна." }, { status: 400 })
    }

    const contract = await getCompanyContract(id, companyId)
    if (!contract) return notFound()

    const to = nextStatus(action, effectiveStatus(contract), "company")
    if (!to) {
      return NextResponse.json(
        { error: `"${CONTRACT_STATUS_LABELS[contract.status]}" төлөвтэй гэрээнд энэ үйлдлийг хийх боломжгүй.` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const patch: Record<string, unknown> = { status: to, updated_at: now }
    let reason: string | null = null

    if (action === "send") {
      const validation = validateContractTerms(contract)
      if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })
      const notReady = readyToSendError(validation.data)
      if (notReady) return NextResponse.json({ error: notReady }, { status: 400 })

      patch.content_hash = await contentHash(validation.data, contract.version)
      patch.sent_at = now
      patch.company_signed_at = now // Илгээснээр компани гарын үсэг зурсанд тооцно
    } else if (action === "revise") {
      // Шинэ хувилбар — ажилтны өмнө харсан hash хүчингүй болно
      patch.version = contract.version + 1
      patch.content_hash = null
      patch.sent_at = null
      patch.company_signed_at = null
    } else if (action === "terminate") {
      reason = typeof body.reason === "string" ? String(body.reason).trim() : ""
      if (reason.length < 5 || reason.length > 2000) {
        return NextResponse.json({ error: "Цуцлах шалтгааныг бичнэ үү." }, { status: 400 })
      }
      patch.terminated_at = now
      patch.terminated_by = "company"
      patch.termination_reason = reason
    }

    // Хооронд нь ажилтан гарын үсэг зурсан г.м. бол update хийгдэхгүй
    const { data, error } = await supabase
      .from("tr_contract")
      .update(patch)
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("status", contract.status)
      .select(CONTRACT_COLUMNS)
      .maybeSingle()

    if (error) throw error
    if (!data) return conflict()

    await logContractEvent(id, "company", companyId, action, reason ? { reason } : undefined)

    const link = contractLink(request, `/dashboard/staff/contracts/${id}`)
    if (action === "send") {
      await sendContractMail(contract.staff_email, "Танд гэрээ ирлээ", [
        `${contract.company_name} танд "${contract.position}" албан тушаалын хөдөлмөрийн гэрээ илгээлээ.`,
        `Гэрээний дугаар: ${contract.contract_number}`,
        "MSTAFFING-д нэвтэрч гэрээг уншаад гарын үсэг зурна уу.",
      ], link)
    } else if (action === "terminate") {
      await sendContractMail(contract.staff_email, "Гэрээ цуцлагдлаа", [
        `${contract.company_name} ${contract.contract_number} дугаартай гэрээг цуцаллаа.`,
        `Шалтгаан: ${reason}`,
      ], link)
    }

    return NextResponse.json({ success: true, data: normalizeContract(data as unknown as Contract) })
  } catch (error) {
    console.error("Company Contract Action Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}
