import type {
  ContractAction,
  ContractParty,
  ContractSalaryType,
  ContractStatus,
  ContractTerms,
} from "@/types/contract"

// Гэрээний төлөвийн шилжилт, оролтын шалгалт, hash — DB-гүй цэвэр логик.
// API route-ууд энд тодорхойлсон дүрмээр л төлөв өөрчилнө.

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Ноорог",
  sent: "Гарын үсэг хүлээж буй",
  active: "Хүчинтэй",
  declined: "Татгалзсан",
  cancelled: "Цуцалсан",
  terminated: "Цуцлагдсан",
  expired: "Хугацаа дууссан",
}

export const SALARY_TYPE_LABELS: Record<ContractSalaryType, string> = {
  monthly: "Сарын",
  hourly: "Цагийн",
  daily: "Өдрийн",
  yearly: "Жилийн",
}

// Ажилтанд харагдах төлөвүүд (ноорог болон илгээгдээгүй цуцалсан гэрээ харагдахгүй)
export const STAFF_VISIBLE_STATUSES: ContractStatus[] = ["sent", "active", "declined", "terminated", "expired"]

const TRANSITIONS: Record<ContractAction, { from: ContractStatus[]; to: ContractStatus; parties: ContractParty[] }> = {
  send:      { from: ["draft"],         to: "sent",       parties: ["company"] },
  revise:    { from: ["sent"],          to: "draft",      parties: ["company"] },
  cancel:    { from: ["draft", "sent"], to: "cancelled",  parties: ["company"] },
  sign:      { from: ["sent"],          to: "active",     parties: ["staff"] },
  decline:   { from: ["sent"],          to: "declined",   parties: ["staff"] },
  terminate: { from: ["active"],        to: "terminated", parties: ["company", "staff"] },
}

export function isContractAction(value: unknown): value is ContractAction {
  return typeof value === "string" && Object.hasOwn(TRANSITIONS, value)
}

// Тухайн тал энэ үйлдлийг хийж болох бол шинэ төлөвийг, болохгүй бол null буцаана
export function nextStatus(action: ContractAction, from: ContractStatus, party: ContractParty): ContractStatus | null {
  const rule = TRANSITIONS[action]
  if (!rule.parties.includes(party) || !rule.from.includes(from)) return null
  return rule.to
}

// Тухайн талд одоогийн төлөвт боломжтой үйлдлүүд (UI товч харуулахад)
export function allowedActions(status: ContractStatus, party: ContractParty): ContractAction[] {
  return (Object.keys(TRANSITIONS) as ContractAction[]).filter((a) => nextStatus(a, status, party) !== null)
}

// Монголын цагаар өнөөдрийн огноо (YYYY-MM-DD)
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar" }).format(now)
}

// Хүчинтэй гэрээний дуусах огноо өнгөрсөн бол "expired" гэж тооцно
export function effectiveStatus(
  contract: { status: ContractStatus; end_date: string | null },
  today: string = todayISO()
): ContractStatus {
  if (contract.status === "active" && contract.end_date && contract.end_date < today) return "expired"
  return contract.status
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value)
}

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null) return null
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed.length > max) return undefined
  return trimmed || null
}

export type ValidationResult = { ok: true; data: ContractTerms } | { ok: false; error: string }

// Компанийн илгээсэн нөхцлийг шалгаж, цэвэрлэсэн хувилбарыг буцаана
export function validateContractTerms(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") return { ok: false, error: "Мэдээлэл дутуу байна." }
  const body = input as Record<string, unknown>

  const position = typeof body.position === "string" ? body.position.trim() : ""
  if (!position || position.length > 200) return { ok: false, error: "Албан тушаалыг зөв оруулна уу." }

  const salary = typeof body.salary === "string" ? Number(body.salary) : body.salary
  if (typeof salary !== "number" || !Number.isFinite(salary) || salary < 0 || salary > 1e12) {
    return { ok: false, error: "Цалингийн дүн буруу байна." }
  }

  if (typeof body.salary_type !== "string" || !Object.hasOwn(SALARY_TYPE_LABELS, body.salary_type)) {
    return { ok: false, error: "Цалингийн төрөл буруу байна." }
  }

  const startDate = typeof body.start_date === "string" ? body.start_date : ""
  if (!isValidDate(startDate)) return { ok: false, error: "Эхлэх огноо буруу байна." }

  let endDate: string | null = null
  if (body.end_date !== undefined && body.end_date !== null && body.end_date !== "") {
    if (typeof body.end_date !== "string" || !isValidDate(body.end_date)) {
      return { ok: false, error: "Дуусах огноо буруу байна." }
    }
    if (body.end_date < startDate) return { ok: false, error: "Дуусах огноо эхлэх огнооноос өмнө байж болохгүй." }
    endDate = body.end_date
  }

  const workHours = optionalText(body.work_hours, 200)
  if (workHours === undefined) return { ok: false, error: "Ажлын цагийн мэдээлэл хэт урт байна." }

  const location = optionalText(body.location, 200)
  if (location === undefined) return { ok: false, error: "Ажлын байршил хэт урт байна." }

  const terms = typeof body.terms === "string" ? body.terms.trim() : ""
  if (terms.length > 20000) return { ok: false, error: "Гэрээний нөхцөл хэт урт байна." }

  return {
    ok: true,
    data: {
      position,
      salary: Math.round(salary * 100) / 100,
      salary_type: body.salary_type as ContractSalaryType,
      start_date: startDate,
      end_date: endDate,
      work_hours: workHours,
      location,
      terms,
    },
  }
}

// Илгээхийн өмнөх нэмэлт шаардлага (ноорог хадгалахад шаардахгүй)
export function readyToSendError(terms: ContractTerms): string | null {
  if (terms.salary <= 0) return "Цалингийн дүнг оруулна уу."
  if (terms.terms.length < 20) return "Гэрээний нөхцлийг дэлгэрэнгүй бичнэ үү."
  return null
}

// Гэрээний нөхцөл + хувилбарын SHA-256. Ажилтан яг харсан хувилбартаа гарын үсэг зурсныг баталгаажуулна.
export async function contentHash(terms: ContractTerms, version: number): Promise<string> {
  const canonical = JSON.stringify([
    version,
    terms.position,
    Number(terms.salary).toFixed(2),
    terms.salary_type,
    terms.start_date,
    terms.end_date ?? "",
    terms.work_hours ?? "",
    terms.location ?? "",
    terms.terms,
  ])
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")
}

// mt_openjob.salary нь текст ("1,500,000₮" г.м.) тул тоон хэсгийг нь авна
export function parseSalary(value: string | null | undefined): number {
  if (!value) return 0
  const digits = value.replace(/[^\d.]/g, "")
  const n = Number(digits)
  return Number.isFinite(n) ? n : 0
}

export function toContractSalaryType(value: string | null | undefined): ContractSalaryType {
  return value && Object.hasOwn(SALARY_TYPE_LABELS, value) ? (value as ContractSalaryType) : "monthly"
}

export const DEFAULT_CONTRACT_TERMS = `1. Ажил олгогч нь ажилтныг дээр дурдсан албан тушаалд томилж, гэрээнд заасан цалин хөлсийг сар бүр олгоно.
2. Ажилтан нь хөдөлмөрийн дотоод журам, хөдөлмөрийн аюулгүй байдлын шаардлагыг мөрдөнө.
3. Талууд Монгол Улсын Хөдөлмөрийн тухай хуулийн дагуу эрх, үүргээ хэрэгжүүлнэ.
4. Гэрээг цуцлах тохиолдолд аль нэг тал нөгөө талдаа урьдчилан мэдэгдэнэ.`
