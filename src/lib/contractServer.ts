import { supabase } from "@/lib/supabase"
import { MAIL_FROM, noticeEmailHtml, transporter } from "@/lib/mailer"
import { EXPIRY_REMINDER_DAYS, LIVE_STATUSES, addDaysISO, daysUntil, effectiveStatus, todayISO } from "@/lib/contracts"
import { getAppOrigin } from "@/lib/url"
import { one } from "@/lib/relation"
import type { Contract, ContractParty, ContractStatus } from "@/types/contract"

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

type ContractOwner = { column: "company_id" | "staff_id"; id: string }

// Мэдэгдэл явуулахад хэрэгтэй багана
const NOTICE_COLUMNS = "id, contract_number, position, staff_name, staff_email, company_id, end_date"

interface NoticeRow {
  id: string
  contract_number: string
  position: string
  staff_name: string
  staff_email: string | null
  company_id: string
  end_date: string | null
}

// Хоёр талд ижил мэдэгдэл (ажилтан, компани тус бүр өөрийн хуудасны линктэй)
async function notifyBothParties(req: Request | undefined, row: NoticeRow, subject: string, lines: string[]) {
  const companyEmail = await getCompanyEmail(row.company_id)
  const link = (party: ContractParty) => (req ? contractLink(req, `/dashboard/${party}/contracts/${row.id}`) : undefined)
  await Promise.all([
    sendContractMail(row.staff_email, subject, lines, link("staff")),
    sendContractMail(companyEmail, subject, lines, link("company")),
  ])
}

// Дуусах огноо өнгөрсөн хүчинтэй гэрээнүүдийг DB дээр "expired" болгоно (жагсаалт татахын өмнө).
// Энэ дуудалтаар төлөв нь өөрчлөгдсөн гэрээнүүдэд л түүх бичиж, хоёр талд мэдэгдэнэ (давхардахгүй).
export async function expireContracts(owner: ContractOwner, req?: Request) {
  const { data, error } = await supabase
    .from("tr_contract")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq(owner.column, owner.id)
    .eq("status", "active")
    .lt("end_date", todayISO())
    .select(NOTICE_COLUMNS)
  if (error) {
    console.error("CONTRACT_EXPIRE_ERROR:", error)
    return
  }

  for (const row of (data || []) as NoticeRow[]) {
    await logContractEvent(row.id, "system", null, "expire")
    await notifyBothParties(req, row, "Гэрээний хугацаа дууслаа", [
      `${row.contract_number} дугаартай "${row.position}" (${row.staff_name}) гэрээний хугацаа ${row.end_date}-нд дууслаа.`,
      "Үргэлжлүүлэн хамтран ажиллах бол шинэ гэрээ байгуулна уу.",
    ])
  }
}

// Дуусахад EXPIRY_REMINDER_DAYS хоног үлдсэн хүчинтэй гэрээнд хоёр талд нэг удаа сануулна.
// expiry_reminded_at багана (20261008000000 migration) байхгүй бол юу ч хийхгүй.
let reminderColumnErrorLogged = false

export async function remindExpiringContracts(owner: ContractOwner, req?: Request) {
  const today = todayISO()
  const { data, error } = await supabase
    .from("tr_contract")
    .update({ expiry_reminded_at: new Date().toISOString() })
    .eq(owner.column, owner.id)
    .eq("status", "active")
    .gte("end_date", today)
    .lte("end_date", addDaysISO(today, EXPIRY_REMINDER_DAYS))
    .is("expiry_reminded_at", null)
    .select(NOTICE_COLUMNS)

  if (error) {
    if (!reminderColumnErrorLogged) {
      reminderColumnErrorLogged = true
      console.error("CONTRACT_EXPIRY_REMINDER_ERROR (20261008000000 migration ажилласан эсэхийг шалгана уу):", error)
    }
    return
  }

  for (const row of (data || []) as NoticeRow[]) {
    await logContractEvent(row.id, "system", null, "expiry_reminder")
    await notifyBothParties(req, row, "Гэрээний хугацаа дуусах дөхлөө", [
      `${row.contract_number} дугаартай "${row.position}" (${row.staff_name}) гэрээ ${row.end_date}-нд дуусна (${daysUntil(row.end_date!, today)} хоног үлдлээ).`,
      "Сунгах бол хугацаа дуусахаас өмнө шинэ гэрээ байгуулна уу.",
    ])
  }
}

// Жагсаалт татахын өмнө: хугацаа дууссаныг шинэчилж, дуусах дөхсөнд сануулна
export async function refreshContractDeadlines(owner: ContractOwner, req?: Request) {
  await expireContracts(owner, req)
  await remindExpiringContracts(owner, req)
}

// Компанийн "Шинээр үүсгэх" жагсаалт: тэнцсэн (approved) бөгөөд амьд (draft/sent/active) гэрээгүй анкетууд.
// previous_status — энэ анкетаас өмнө үүсгэж байгаад дууссан (татгалзсан, цуцалсан г.м.) хамгийн сүүлийн гэрээний төлөв.
export async function getContractCandidates(companyId: string) {
  const [requests, contracts] = await Promise.all([
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
      .select("job_request_id, status, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
  ])

  if (requests.error) throw requests.error
  if (contracts.error) throw contracts.error

  const taken = new Set<string>()
  const previous = new Map<string, ContractStatus>()
  for (const c of contracts.data || []) {
    if (LIVE_STATUSES.includes(c.status)) taken.add(c.job_request_id)
    else if (!previous.has(c.job_request_id)) previous.set(c.job_request_id, c.status)
  }

  return (requests.data || [])
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
      previous_status: previous.get(req.id) ?? null,
    }))
}

export async function logContractEvent(
  contractId: string,
  actorRole: ContractParty | "system",
  actorId: string | null,
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
