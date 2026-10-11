import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { TEMPLATE_COLUMNS, normalizeTemplate } from "@/lib/contractTemplates"
import type { ContractTemplate } from "@/types/contract"

// Гэрээний загварын API route-уудын хуваалцдаг DB туслахууд

// mt_contract_template (20261011000000 migration) хараахан үүсээгүй
export function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205"
}

export const missingTableResponse = () =>
  NextResponse.json({ error: "Гэрээний загвар хараахан идэвхжээгүй байна. Админд хандана уу." }, { status: 503 })

export const duplicateNameResponse = () =>
  NextResponse.json({ error: "Ижил нэртэй загвар байна. Өөр нэр өгнө үү." }, { status: 409 })

export async function getCompanyTemplate(id: string, companyId: string): Promise<ContractTemplate | null> {
  const { data, error } = await supabase
    .from("mt_contract_template")
    .select(TEMPLATE_COLUMNS)
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle()
  if (error) throw error
  return data ? (normalizeTemplate(data) as unknown as ContractTemplate) : null
}

// Шинэ гэрээнд хэрэглэх үндсэн загвар. Хүснэгт байхгүй / алдаа гарвал загваргүйгээр үргэлжилнэ.
export async function getDefaultTemplate(companyId: string): Promise<ContractTemplate | null> {
  const { data, error } = await supabase
    .from("mt_contract_template")
    .select(TEMPLATE_COLUMNS)
    .eq("company_id", companyId)
    .eq("is_default", true)
    .maybeSingle()
  if (error) {
    if (!isMissingTable(error)) console.error("CONTRACT_DEFAULT_TEMPLATE_ERROR:", error)
    return null
  }
  return data ? (normalizeTemplate(data) as unknown as ContractTemplate) : null
}

// Өөр загварыг үндсэн болгохын өмнө одоогийн үндсэнийг болиулна (компанид нэг л үндсэн загвар)
export async function clearDefaultTemplate(companyId: string, exceptId?: string) {
  let query = supabase
    .from("mt_contract_template")
    .update({ is_default: false })
    .eq("company_id", companyId)
    .eq("is_default", true)
  if (exceptId) query = query.neq("id", exceptId)
  const { error } = await query
  if (error) throw error
}
