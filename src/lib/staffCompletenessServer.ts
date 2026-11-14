import { supabase } from "@/lib/supabase"
import { one } from "@/lib/relation"
import { getStaffCompleteness } from "@/lib/staffProfileCompleteness"

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

// Анкет илгээхэд заавал бөглөсөн байх хэсгүүд (getStaffCompleteness-ийн шошготой ижил).
// Зураг, хүйс, ажиллах цаг нь «Ажилтан хайх»-д харагдахад л шаардлагатай.
export const APPLY_REQUIRED = ["нэр", "утас", "төрсөн огноо", "танилцуулга", "ур чадвар", "ажлын туршлага", "боловсрол"]

// Анкет илгээхийн өмнө дутуу байгаа хэсгүүд (хоосон бол илгээж болно)
export async function getApplyMissing(userId: string): Promise<string[]> {
  const { missing } = await loadStaffCompleteness(userId)
  return missing.filter((label) => APPLY_REQUIRED.includes(label))
}

export function applyMissingMessage(missing: string[]): string {
  return `Анкет илгээхийн тулд профайлдаа дараах мэдээллийг бөглөнө үү: ${missing.join(", ")}.`
}

// Нэг ажилтны профайлын бүрэн байдлыг DB-ээс уншиж, профайл хуудастай ижил дүрмээр тооцно
// (хяналтын самбар ашиглана).
export async function loadStaffCompleteness(userId: string) {
  const [staff, profile, skills, experience, education] = await Promise.all([
    supabase.from("mt_staff").select("first_name, last_name, birth_date").eq("id", userId).maybeSingle(),
    supabase.from("mt_profile").select("phone, bio, photo_url, gender, availability").eq("user_id", userId).maybeSingle(),
    supabase.from("tr_staff_skill").select("mt_skill (skill_type)").eq("staff_id", userId),
    supabase.from("tr_staff_experience").select("id", { count: "exact", head: true }).eq("staff_id", userId),
    supabase.from("tr_staff_education").select("id", { count: "exact", head: true }).eq("staff_id", userId),
  ])
  for (const r of [staff, profile, skills, experience, education]) if (r.error) throw r.error

  const skillTypes = (skills.data || []).map((row) => one(row.mt_skill)?.skill_type)
  const availability = (profile.data?.availability || {}) as Record<string, { enabled?: boolean } | undefined>

  return getStaffCompleteness({
    fullName: `${staff.data?.last_name || ""} ${staff.data?.first_name || ""}`,
    phone: profile.data?.phone || "",
    bio: profile.data?.bio || "",
    avatarUrl: profile.data?.photo_url || "",
    gender: profile.data?.gender || "",
    birthDate: staff.data?.birth_date || "",
    skills: {
      technical: skillTypes.filter((t) => t === "technical") as string[],
      languages: skillTypes.filter((t) => t === "languages") as string[],
    },
    experienceCount: experience.count ?? 0,
    educationCount: education.count ?? 0,
    enabledDays: WEEK_DAYS.filter((day) => Object.hasOwn(availability, day) && availability[day]?.enabled).length,
  })
}
