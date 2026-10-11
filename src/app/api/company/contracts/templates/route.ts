import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { MAX_TEMPLATES_PER_COMPANY, TEMPLATE_COLUMNS, normalizeTemplate, validateTemplate } from "@/lib/contractTemplates"
import { clearDefaultTemplate, duplicateNameResponse, isMissingTable, missingTableResponse } from "@/lib/contractTemplateServer"

export const revalidate = 0

const unauthorized = () => NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })

// 1. Компанийн гэрээний загварууд (үндсэн загвар эхэндээ)
export async function GET() {
  try {
    const session = await getSession()
    const companyId = session?.userId
    if (!companyId || session?.role !== "company") return unauthorized()

    const { data, error } = await supabase
      .from("mt_contract_template")
      .select(TEMPLATE_COLUMNS)
      .eq("company_id", companyId)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false })

    if (error) {
      if (isMissingTable(error)) return missingTableResponse()
      throw error
    }

    return NextResponse.json({ success: true, data: (data || []).map(normalizeTemplate) })
  } catch (error) {
    console.error("Contract Templates Fetch Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}

// 2. Шинэ загвар
export async function POST(request: Request) {
  try {
    const session = await getSession()
    const companyId = session?.userId
    if (!companyId || session?.role !== "company") return unauthorized()

    const validation = validateTemplate(await request.json())
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

    const { count, error: countError } = await supabase
      .from("mt_contract_template")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
    if (countError) {
      if (isMissingTable(countError)) return missingTableResponse()
      throw countError
    }
    if ((count ?? 0) >= MAX_TEMPLATES_PER_COMPANY) {
      return NextResponse.json(
        { error: `Нэг компани ${MAX_TEMPLATES_PER_COMPANY} хүртэл загвар хадгална. Хэрэггүй загвараа устгана уу.` },
        { status: 400 }
      )
    }

    if (validation.data.is_default) await clearDefaultTemplate(companyId)

    const { data, error } = await supabase
      .from("mt_contract_template")
      .insert({ ...validation.data, company_id: companyId })
      .select(TEMPLATE_COLUMNS)
      .single()

    if (error) {
      if (error.code === "23505") return duplicateNameResponse()
      throw error
    }

    return NextResponse.json({ success: true, data: normalizeTemplate(data) }, { status: 201 })
  } catch (error) {
    console.error("Contract Template Create Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}
