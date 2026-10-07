import { supabase } from "@/lib/supabase"
import { MAIL_FROM, noticeEmailHtml, transporter } from "@/lib/mailer"
import { effectiveStatus, todayISO } from "@/lib/contracts"
import { getAppOrigin } from "@/lib/url"
import type { Contract, ContractParty } from "@/types/contract"

// Гэрээний API route-уудын хуваалцдаг DB / мэйл туслахууд

export const CONTRACT_COLUMNS = `
  id, contract_number, job_request_id, job_id, company_id, staff_id, version,
  company_name, staff_name, staff_email,
  position, salary, salary_type, start_date, end_date, work_hours, location, terms,
  status, content_hash, sent_at, company_signed_at, staff_signed_at, staff_signed_name,
  decline_reason, terminated_at, terminated_by, termination_reason, created_at, updated_at
`

export const CONTRACT_LIST_COLUMNS = `
  id, contract_number, company_name, staff_name, position, salary, salary_type,
  start_date, end_date, status, created_at, updated_at
`

// numeric багана string-ээр ирж болох тул тоо болгож, хугацаа дууссаныг тооцно
export function normalizeContract<T extends { status: Contract["status"]; end_date: string | null; salary?: unknown }>(row: T): T {
  return {
    ...row,
    ...(row.salary !== undefined ? { salary: Number(row.salary) } : {}),
    status: effectiveStatus(row),
  }
}

// Дуусах огноо өнгөрсөн хүчинтэй гэрээнүүдийг DB дээр "expired" болгоно (жагсаалт татахын өмнө)
export async function expireContracts(owner: { column: "company_id" | "staff_id"; id: string }) {
  const { error } = await supabase
    .from("tr_contract")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq(owner.column, owner.id)
    .eq("status", "active")
    .lt("end_date", todayISO())
  if (error) console.error("CONTRACT_EXPIRE_ERROR:", error)
}

export async function logContractEvent(
  contractId: string,
  actorRole: ContractParty,
  actorId: string,
  action: string,
  meta?: Record<string, unknown>
) {
  const { error } = await supabase.from("tr_contract_event").insert({
    contract_id: contractId,
    actor_id: actorId,
    actor_role: actorRole,
    action,
    meta: meta ?? null,
  })
  // Түүх бичигдээгүй ч үндсэн үйлдлийг буцаахгүй
  if (error) console.error("CONTRACT_EVENT_LOG_ERROR:", error)
}

// Мэйл дэх "Гэрээг харах" линк. APP_URL тохируулаагүй production орчинд линкгүй явна.
export function contractLink(req: Request, path: string): { href: string; label: string } | undefined {
  const origin = getAppOrigin(req)
  return origin ? { href: `${origin}${path}`, label: "Гэрээг харах" } : undefined
}

// Мэдэгдлийн мэйл. Илгээж чадаагүй ч гэрээний үйлдэл амжилттай хэвээр.
export async function sendContractMail(to: string | null | undefined, subject: string, lines: string[], link?: { href: string; label: string }) {
  if (!to) return
  try {
    await transporter.sendMail({ from: MAIL_FROM, to, subject, html: noticeEmailHtml(subject, lines, link) })
  } catch (err) {
    console.error("CONTRACT_MAIL_ERROR:", err)
  }
}

export async function getCompanyEmail(companyId: string): Promise<string | null> {
  const { data } = await supabase.from("mt_company").select("email").eq("id", companyId).maybeSingle()
  return data?.email ?? null
}
