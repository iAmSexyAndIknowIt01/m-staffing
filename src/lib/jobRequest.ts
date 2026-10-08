// Анкетын (tr_job_request) төлөвийн шилжилт — DB-гүй цэвэр логик.
//   pending/new → interview (урих) | rejected (татгалзах)
//   interview   → accepted (ажилтан урилгыг хүлээж авна) | rejected (компани цуцална)
//   accepted    → approved (тэнцсэн) | not-approved (тэнцээгүй)
// approved, not-approved, rejected нь эцсийн төлөв.

export type JobRequestStatus = "new" | "pending" | "interview" | "accepted" | "approved" | "not-approved" | "rejected"

const COMPANY_TRANSITIONS: Partial<Record<JobRequestStatus, JobRequestStatus[]>> = {
  new: ["interview", "rejected"],
  pending: ["interview", "rejected"],
  interview: ["rejected"],
  accepted: ["approved", "not-approved"],
}

export function canCompanySetStatus(from: string | null | undefined, to: unknown): to is JobRequestStatus {
  const allowed = COMPANY_TRANSITIONS[(from || "pending") as JobRequestStatus]
  return typeof to === "string" && !!allowed?.includes(to as JobRequestStatus)
}
