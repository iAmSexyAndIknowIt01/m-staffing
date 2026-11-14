// Сервер талд л (supabase service_role). @/lib/supabase өөрөө клиентээс импортлохыг хориглоно.
import { cache } from "react"
import { supabase } from "./supabase"
import { getJobCategoryLabel, getJobTypeLabel } from "./jobPost"
import { companyLogoUrl, publicSalaryText } from "./publicJobFormat"

// Нэвтрэлтгүй үзэх зарын мэдээлэл — зөвхөн зар дээр олон нийтэд харагдах талбарууд
export type PublicJob = {
  id: string
  title: string
  categoryLabel: string
  jobTypeLabel: string
  salaryText: string
  location: string
  description: string
  requirements: string
  createdAt: string
  companyName: string
  companyLogoUrl: string | null
}

// URL-аас ирсэн id-г DB рүү явуулахаас өмнө хэлбэрийг нь шалгана
const VALID_ID = /^[A-Za-z0-9-]{1,64}$/

// Идэвхтэй (status = active) зарыг л буцаана. Хуудас ба OG зураг нэг хүсэлтэд дахин татахгүйн тул cache.
export const getPublicJob = cache(async (id: string): Promise<PublicJob | null> => {
  if (!VALID_ID.test(id)) return null

  const { data: job, error } = await supabase
    .from("mt_openjob")
    .select("id, title, category, job_type, salary, salary_type, location, description, requirements, created_at, user_id")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle()

  if (error || !job) return null

  let companyName = "Байгууллагын нэр нууцалсан"
  let logo: string | null = null
  if (job.user_id) {
    const { data: company } = await supabase
      .from("mt_company")
      .select("company_name, logo_url")
      .eq("id", job.user_id)
      .maybeSingle()
    if (company) {
      companyName = company.company_name || companyName
      logo = companyLogoUrl(company.logo_url)
    }
  }

  return {
    id: job.id,
    title: job.title,
    categoryLabel: getJobCategoryLabel(job.category),
    jobTypeLabel: getJobTypeLabel(job.job_type),
    salaryText: publicSalaryText(job.salary, job.salary_type),
    location: job.location ?? "",
    description: job.description ?? "",
    requirements: job.requirements ?? "",
    createdAt: job.created_at,
    companyName,
    companyLogoUrl: logo,
  }
})
