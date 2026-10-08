// Гэрээ менежмент (tr_contract, tr_contract_event)

export type ContractStatus = "draft" | "sent" | "active" | "declined" | "cancelled" | "terminated" | "expired"

export type ContractSalaryType = "monthly" | "hourly" | "daily" | "yearly"

export type ContractAction = "send" | "revise" | "cancel" | "sign" | "decline" | "terminate"

export type ContractParty = "company" | "staff"

// Компани засах боломжтой нөхцлүүд
export interface ContractTerms {
  position: string
  salary: number
  salary_type: ContractSalaryType
  start_date: string // YYYY-MM-DD
  end_date: string | null
  work_hours: string | null
  location: string | null
  terms: string
}

export interface Contract extends ContractTerms {
  id: string
  contract_number: string
  job_request_id: string
  job_id: string
  company_id: string
  staff_id: string
  version: number
  company_name: string
  staff_name: string
  staff_email: string | null
  status: ContractStatus
  content_hash: string | null
  sent_at: string | null
  company_signed_at: string | null
  staff_signed_at: string | null
  staff_signed_name: string | null
  decline_reason: string | null
  terminated_at: string | null
  terminated_by: ContractParty | null
  termination_reason: string | null
  created_at: string
  updated_at: string
  viewed_at?: string | null // зөвхөн компанийн дэлгэрэнгүй API буцаана
}

export interface ContractEvent {
  id: string
  actor_role: ContractParty | "admin" | "system"
  action: string
  meta: Record<string, unknown> | null
  created_at: string
}
