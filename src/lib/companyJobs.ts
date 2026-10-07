import { supabase } from "@/lib/supabase"
import { one } from "@/lib/relation"

// Компанийн зар, ирсэн анкетыг унших — API route болон Server Component хуваалцана.
// Server Component өөрийн API-г HTTP-ээр (localhost:3000 г.м.) дуудах шаардлагагүй болно.

// Зөвхөн тухайн компанийн өөрийн зар
export async function getCompanyJob(jobId: string, companyId: string) {
  const { data, error } = await supabase
    .from("mt_openjob")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", companyId)
    .maybeSingle()

  if (error) throw error
  return data
}

export interface JobApplicant {
  id: string
  user_name: string
  job_title: string
  email: string
  phone: string
  created_at: string
  status: string
}

// Тухайн зарт ирсэн анкетууд (зар нь энэ компанийнх байх ёстой)
export async function getJobApplicants(jobId: string, companyId: string): Promise<{ data: JobApplicant[]; jobTitle: string }> {
  // Анкет ирээгүй байсан ч ажлын нэрийг харуулахын тулд зарын мэдээллийг авна
  const { data: jobData } = await supabase
    .from("mt_openjob")
    .select("title")
    .eq("id", jobId)
    .eq("user_id", companyId)
    .maybeSingle()

  const jobTitle = jobData?.title || "Ажлын байр"

  const { data: requests, error } = await supabase
    .from("tr_job_request")
    .select(`
      id,
      status,
      created_at,
      applicant_name,
      applicant_email,
      applicant_phone,
      mt_openjob!inner (
        id,
        title,
        user_id
      )
    `)
    .eq("job_id", jobId)
    .eq("mt_openjob.user_id", companyId)
    .order("created_at", { ascending: false })

  if (error) throw error

  const data = (requests || []).map((req) => ({
    id: req.id,
    user_name: req.applicant_name || "Нэргүй ажил горилогч",
    job_title: one(req.mt_openjob)?.title || jobTitle,
    email: req.applicant_email || "Хоосон",
    phone: req.applicant_phone || "Хоосон",
    created_at: req.created_at,
    status: req.status || "new",
  }))

  return { data, jobTitle }
}
