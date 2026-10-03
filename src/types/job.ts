// Ажил хайгч талын ажлын байрны дэлгэрэнгүй (JobDetailModal, JobDetailView)

export interface JobCompany {
  id?: string
  company_id?: string
  name: string
  logo_url: string | null
}

export interface JobDetail {
  id: string
  title: string
  category: string
  job_type: string
  salary_type: string
  location: string
  salary: string
  description: string
  requirements: string
  created_at: string
  is_applied: boolean
  mt_company?: JobCompany
}

// Дэлгэрэнгүй харагдацад дамжуулдаг туслах функцууд
export interface JobDetailHelpers {
  appliedJobIds: string[]
  submitting: boolean
  checkingProfile: boolean
  getCompanyLogoUrl: (logoUrl: string | null | undefined) => string | null
  getJobTypeText: (type: string) => string
  getSalaryTypeText: (type: string) => string
  formatSalary: (salaryStr: string | null | undefined) => string
  handleCompanyClick: (e: React.MouseEvent, company: JobCompany | undefined) => void
  triggerApplyConfirmation: (jobId: string) => Promise<void>
}
