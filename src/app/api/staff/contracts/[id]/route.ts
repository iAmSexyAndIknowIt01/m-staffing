import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { CONTRACT_STATUS_LABELS, STAFF_VISIBLE_STATUSES, effectiveStatus, isContractAction, nextStatus } from "@/lib/contracts"
import {
  CONTRACT_COLUMNS,
  getClientIp,
  getCompanyEmail,
  logContractEvent,
  normalizeContract,
  sendContractMail,
} from "@/lib/contractServer"
import type { Contract } from "@/types/contract"

export const revalidate = 0

interface RouteParams {
  params: Promise<{ id: string }>
}

const forbidden = () => NextResponse.json({ error: "Хандах эрхгүй байна." }, { status: 403 })
const notFound = () => NextResponse.json({ error: "Гэрээ олдсонгүй." }, { status: 404 })

async function getStaffContract(id: string, staffId: string) {
  const { data, error } = await supabase
    .from("tr_contract")
    .select(CONTRACT_COLUMNS)
    .eq("id", id)
    .eq("staff_id", staffId)
    .in("status", STAFF_VISIBLE_STATUSES)
    .maybeSingle()
  if (error) throw error
  return data ? normalizeContract(data as unknown as Contract) : null
}

// 1. Гэрээний дэлгэрэнгүй
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    const userId = session?.userId
    if (!userId || session?.role !== "staff") return forbidden()

    const contract = await getStaffContract(id, userId)
    if (!contract) return notFound()

    return NextResponse.json({ success: true, data: contract })
  } catch (error) {
    console.error("Staff Contract Fetch Error:", error)
    return NextResponse.json({ error: "Серверийн алдаа гарлаа." }, { status: 500 })
  }
}

// 2. Гарын үсэг зурах / татгалзах / цуцлах
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    const userId = session?.userId
    if (!userId || session?.role !== "staff") return forbidden()

    const body = await request.json()
    const action = body?.action
    if (!isContractAction(action)) {
      return NextResponse.json({ error: "Үйлдэл буруу байна." }, { status: 400 })
    }

    const contract = await getStaffContract(id, userId)
    if (!contract) return notFound()

    const to = nextStatus(action, effectiveStatus(contract), "staff")
    if (!to) {
      return NextResponse.json(
        { error: `"${CONTRACT_STATUS_LABELS[contract.status]}" төлөвтэй гэрээнд энэ үйлдлийг хийх боломжгүй.` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const patch: Record<string, unknown> = { status: to, updated_at: now }
    let reason: string | null = null

    if (action === "sign") {
      const signedName = typeof body.signed_name === "string" ? body.signed_name.trim() : ""
      if (body.agree !== true) {
        return NextResponse.json({ error: "Гэрээний нөхцлийг зөвшөөрч байгаагаа баталгаажуулна уу." }, { status: 400 })
      }
      if (signedName.length < 2 || signedName.length > 200) {
        return NextResponse.json({ error: "Гарын үсгийн оронд бүтэн нэрээ бичнэ үү." }, { status: 400 })
      }
      // Ажилтны харсан хувилбар одоогийнхтой таарах ёстой
      if (typeof body.content_hash !== "string" || body.content_hash !== contract.content_hash) {
        return NextResponse.json({ error: "Гэрээ өөрчлөгдсөн байна. Хуудсаа шинэчлээд дахин уншина уу." }, { status: 409 })
      }
      patch.staff_signed_at = now
      patch.staff_signed_name = signedName
      patch.staff_signed_ip = getClientIp(request)
      patch.staff_signed_ua = request.headers.get("user-agent")?.slice(0, 500) || null
    } else if (action === "decline") {
      reason = typeof body.reason === "string" ? String(body.reason).trim().slice(0, 2000) : ""
      patch.decline_reason = reason || null
    } else if (action === "terminate") {
      reason = typeof body.reason === "string" ? String(body.reason).trim() : ""
      if (reason.length < 5 || reason.length > 2000) {
        return NextResponse.json({ error: "Цуцлах шалтгааныг бичнэ үү." }, { status: 400 })
      }
      patch.terminated_at = now
      patch.terminated_by = "staff"
      patch.termination_reason = reason
    }

    let query = supabase
      .from("tr_contract")
      .update(patch)
      .eq("id", id)
      .eq("staff_id", userId)
      .eq("status", contract.status)
    if (action === "sign") query = query.eq("content_hash", contract.content_hash as string)

    const { data, error } = await query.select(CONTRACT_COLUMNS).maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: "Гэрээний төлөв өөрчлөгдсөн байна. Хуудсаа шинэчилнэ үү." }, { status: 409 })
    }

    await logContractEvent(id, "staff", userId, action, reason ? { reason } : undefined)

    const companyEmail = await getCompanyEmail(contract.company_id)
    const link = { href: `${new URL(request.url).origin}/dashboard/company/contracts/${id}`, label: "Гэрээг харах" }
    const subjects = {
      sign: "Ажилтан гэрээнд гарын үсэг зурлаа",
      decline: "Ажилтан гэрээнээс татгалзлаа",
      terminate: "Ажилтан гэрээг цуцаллаа",
    } as const
    if (action === "sign" || action === "decline" || action === "terminate") {
      await sendContractMail(companyEmail, subjects[action], [
        `${contract.staff_name} — ${contract.contract_number} (${contract.position})`,
        ...(reason ? [`Шалтгаан: ${reason}`] : []),
      ], link)
    }

    return NextResponse.json({ success: true, data: normalizeContract(data as unknown as Contract) })
  } catch (error) {
    console.error("Staff Contract Action Error:", error)
    return NextResponse.json({ error: "Серверийн алдаа гарлаа." }, { status: 500 })
  }
}
