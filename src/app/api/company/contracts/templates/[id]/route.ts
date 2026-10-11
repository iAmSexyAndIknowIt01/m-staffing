import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { TEMPLATE_COLUMNS, normalizeTemplate, validateTemplate } from "@/lib/contractTemplates"
import {
  clearDefaultTemplate,
  duplicateNameResponse,
  getCompanyTemplate,
  isMissingTable,
  missingTableResponse,
} from "@/lib/contractTemplateServer"

export const revalidate = 0

interface RouteParams {
  params: Promise<{ id: string }>
}

const unauthorized = () => NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })
const notFound = () => NextResponse.json({ error: "Загвар олдсонгүй." }, { status: 404 })

// 1. Загвар засах (үндсэн болгох / болиулах орно)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    const companyId = session?.userId
    if (!companyId || session?.role !== "company") return unauthorized()

    const validation = validateTemplate(await request.json())
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

    // Өөр компанийн / устгагдсан загвар бол үндсэн загварт хүрэхээс өмнө зогсооно
    const existing = await getCompanyTemplate(id, companyId).catch((err) => {
      if (isMissingTable(err)) return "missing" as const
      throw err
    })
    if (existing === "missing") return missingTableResponse()
    if (!existing) return notFound()

    if (validation.data.is_default) await clearDefaultTemplate(companyId, id)

    const { data, error } = await supabase
      .from("mt_contract_template")
      .update({ ...validation.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", companyId)
      .select(TEMPLATE_COLUMNS)
      .maybeSingle()

    if (error) {
      if (isMissingTable(error)) return missingTableResponse()
      if (error.code === "23505") return duplicateNameResponse()
      throw error
    }
    if (!data) return notFound()

    return NextResponse.json({ success: true, data: normalizeTemplate(data) })
  } catch (error) {
    console.error("Contract Template Update Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}

// 2. Загвар устгах. Үүсгэсэн гэрээнүүд нөхцлөө хуулж авсан тул нөлөөлөхгүй.
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getSession()
    const companyId = session?.userId
    if (!companyId || session?.role !== "company") return unauthorized()

    const { data, error } = await supabase
      .from("mt_contract_template")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId)
      .select("id")
      .maybeSingle()

    if (error) {
      if (isMissingTable(error)) return missingTableResponse()
      throw error
    }
    if (!data) return notFound()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contract Template Delete Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}
