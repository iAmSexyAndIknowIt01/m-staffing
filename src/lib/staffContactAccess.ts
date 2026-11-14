import { supabase } from "@/lib/supabase"
import { chargeCredit } from "@/lib/plans"
import { CONTACT_UNLOCK_HOURS } from "@/lib/staffContact"
import { selectInChunks } from "@/lib/chunk"

// Компани ажилтны утас, имэйлийг харах эрх.
//   - Компанийн зарт анкет илгээсэн ажилтан → үнэгүй (ажилтан өөрөө хандсан)
//   - Бусад тохиолдолд «Ажиллах хүсэлт илгээх» товчоор 1 эрх зарцуулж CONTACT_UNLOCK_HOURS цаг нээнэ
//     (tr_staff_contact_unlock, migration 20261115000000_staff_contact_unlock)

export type ContactAccess =
  | { status: "applicant" }
  | { status: "unlocked"; expiresAt: string }
  | { status: "locked" }

function isMissingTable(error: { code?: string }): boolean {
  return error.code === "42P01" || error.code === "PGRST205"
}

async function hasAppliedToCompany(companyId: string, staffId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("tr_job_request")
    .select("id, mt_openjob!inner(user_id)")
    .eq("applicant_id", staffId)
    .eq("mt_openjob.user_id", companyId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data !== null
}

// Компани энэ ажилтны профайлыг харж болох эсэх: профайлаа нээлттэй болгосон, эсвэл компанийн зарт анкет илгээсэн
export async function companyCanViewStaff(companyId: string, staffId: string): Promise<boolean> {
  const [profile, applied] = await Promise.all([
    supabase.from("mt_profile").select("agreement").eq("user_id", staffId).maybeSingle(),
    hasAppliedToCompany(companyId, staffId),
  ])
  if (profile.error) throw profile.error
  return profile.data?.agreement === true || applied
}

async function getActiveUnlock(companyId: string, staffId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("tr_staff_contact_unlock")
    .select("expires_at")
    .eq("company_id", companyId)
    .eq("staff_id", staffId)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    // Migration ажиллаагүй бол хэн ч нээгээгүй гэж үзнэ
    if (isMissingTable(error)) return null
    throw error
  }
  return data?.expires_at ?? null
}

// «Ажилтан хайх» жагсаалтад: компани ажилтан бүрт хамгийн сүүлд хүсэлт илгээсэн (нээсэн) хугацааны төгсгөл
export async function getLatestUnlocks(companyId: string, staffIds: string[]): Promise<Map<string, string>> {
  const latest = new Map<string, string>()
  try {
    const rows = await selectInChunks<{ staff_id: string; expires_at: string }>(staffIds, (ids) =>
      supabase
        .from("tr_staff_contact_unlock")
        .select("staff_id, expires_at")
        .eq("company_id", companyId)
        .in("staff_id", ids)
    )
    for (const row of rows) {
      const prev = latest.get(row.staff_id)
      if (!prev || row.expires_at > prev) latest.set(row.staff_id, row.expires_at)
    }
  } catch (error) {
    // Migration ажиллаагүй бол хүсэлт илгээгээгүй гэж үзнэ
    if (!isMissingTable(error as { code?: string })) throw error
  }
  return latest
}

export async function getContactAccess(companyId: string, staffId: string): Promise<ContactAccess> {
  const [applied, expiresAt] = await Promise.all([
    hasAppliedToCompany(companyId, staffId),
    getActiveUnlock(companyId, staffId),
  ])
  if (applied) return { status: "applicant" }
  if (expiresAt) return { status: "unlocked", expiresAt }
  return { status: "locked" }
}

// 1 эрх хасаж холбоо барих мэдээллийг нээнэ. Аль хэдийн нээлттэй бол дахин хасахгүй.
export async function unlockStaffContact(
  companyId: string,
  staffId: string
): Promise<{ error: string } | { access: Exclude<ContactAccess, { status: "locked" }>; charged: boolean }> {
  const current = await getContactAccess(companyId, staffId)
  if (current.status !== "locked") return { access: current, charged: false }

  const charge = await chargeCredit(companyId, "contact_unlock")
  if ("error" in charge) return charge

  const expiresAt = new Date(Date.now() + CONTACT_UNLOCK_HOURS * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from("tr_staff_contact_unlock").insert({
    company_id: companyId,
    staff_id: staffId,
    expires_at: expiresAt,
    credit_usage_id: charge.usageId,
  })
  if (error) {
    // Нээж чадаагүй бол хассан эрхийг буцаана
    await supabase.from("tr_job_credit_usage").delete().eq("id", charge.usageId)
    throw error
  }
  return { access: { status: "unlocked", expiresAt }, charged: true }
}
