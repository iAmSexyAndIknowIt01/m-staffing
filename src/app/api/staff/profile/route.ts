import { NextResponse } from "next/server"
import type { AvailabilityDay } from "@/types/profile"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { one } from "@/lib/relation"
import { normalizeHttpUrl } from "@/lib/url"
import {
  type EducationRow,
  type ExperienceRow,
  parseEducation,
  parseExperience,
  parseSkillNames,
} from "@/lib/staffProfile"

// GET PROFILE
export async function GET() {
  try {
    const session = await getSession()
    const userId = session?.userId
    const userRole = session?.role

    if (!userId || userRole !== "staff") {
      return NextResponse.json(
        { error: "Хандах эрхгүй байна." },
        { status: 403 }
      )
    }

    // 1. STAFF NAME
    const { data: staffData, error: staffError } = await supabase
      .from("mt_staff")
      .select(`
        first_name,
        last_name
      `)
      .eq("id", userId)
      .single()

    if (staffError) {
      throw staffError
    }

    // 2. PROFILE DATA (gender болон agreement талбаруудыг нэмэв)
    const { data: profileData, error: profileError } = await supabase
      .from("mt_profile")
      .select(`
        user_id,
        email,
        phone,
        bio,
        skills,
        availability,
        photo_url,
        gender,
        agreement
      `)
      .eq("user_id", userId)
      .maybeSingle()

    if (profileError && profileError.code !== "PGRST116") {
      throw profileError
    }

    // 3. SKILLS DATA
    const { data: skillData, error: skillError } = await supabase
      .from("tr_staff_skill")
      .select(`
        skill_id,
        mt_skill (
          skill_name,
          skill_type
        )
      `)
      .eq("staff_id", userId)

    if (skillError) {
      throw skillError
    }

    const technicalSkills =
      skillData
        ?.filter((row) => one(row.mt_skill)?.skill_type === "technical")
        .map((row) => one(row.mt_skill)!.skill_name) || []

    const languageSkills =
      skillData
        ?.filter((row) => one(row.mt_skill)?.skill_type === "languages")
        .map((row) => one(row.mt_skill)!.skill_name) || []

    // 4. EXPERIENCE DATA
    const { data: expData, error: expError } = await supabase
      .from("tr_staff_experience")
      .select("company, position, start_date, end_date, description")
      .eq("staff_id", userId)
      .order("start_date", { ascending: false })

    if (expError) {
      throw expError
    }

    const formattedExperience = expData?.map((exp) => ({
      company: exp.company,
      position: exp.position,
      startDate: exp.start_date,
      endDate: exp.end_date || "",
      description: exp.description || "",
    })) || []

    // 5. EDUCATION DATA
    const { data: eduData, error: eduError } = await supabase
      .from("tr_staff_education")
      .select("school, degree, field, graduation_year, is_current")
      .eq("staff_id", userId)
      .order("graduation_year", { ascending: false })

    if (eduError) {
      throw eduError
    }

    const formattedEducation = eduData?.map((edu) => ({
      school: edu.school,
      degree: edu.degree,
      field: edu.field || "",
      graduationYear: edu.graduation_year || "",
      isCurrent: edu.is_current,
    })) || []

    // MERGE DATA (gender болон agreement-ийг буцаах объект руу нэмэв)
    const profile = {
      full_name: `${staffData?.last_name || ""} ${staffData?.first_name || ""}`.trim(),
      email: profileData?.email || "",
      phone: profileData?.phone || "",
      bio: profileData?.bio || "",
      avatar_url: profileData?.photo_url || "",
      gender: profileData?.gender || "",
      agreement: profileData?.agreement || false,
      skills: {
        technical: technicalSkills,
        languages: languageSkills,
      },
      experience: formattedExperience,
      education: formattedEducation,
      availability: profileData?.availability || {},
    }

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error("GET PROFILE ERROR:", error)
    return NextResponse.json(
      { error: "Серверийн алдаа" },
      { status: 500 }
    )
  }
}

// ========================================
// SAVE PROFILE
// ========================================
export async function POST(request: Request) {
  try {
    const session = await getSession()
    const userId = session?.userId
    const userRole = session?.role

    if (!userId || userRole !== "staff") {
      return NextResponse.json(
        { error: "Хандах эрхгүй байна." },
        { status: 403 }
      )
    }

    const body = await request.json()

    // VALIDATION — DB-д юу ч бичихээс өмнө бүх оролтыг шалгана (POST: бүх хэсэг заавал)
    const result = validateProfileFields(body, ALL_FIELDS)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const data = await applyProfileUpdate(userId, result.values)

    return NextResponse.json({
      success: true,
      message: "Профайл амжилттай хадгалагдлаа.",
      data,
    })
  } catch (error) {
    console.error("POST PROFILE ERROR:", error)
    return NextResponse.json(
      { error: "Серверийн алдаа" },
      { status: 500 }
    )
  }
}

// ========================================
// SAVE ONE SECTION (профайлын карт тус бүрээс)
// ========================================
// Зөвхөн илгээсэн талбаруудыг POST-той ижил дүрмээр шалгаж хадгална.
// Ингэснээр бусад хэсэг дутуу байсан ч тухайн картаа хадгалах боломжтой.
export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    const userId = session?.userId

    if (!userId || session?.role !== "staff") {
      return NextResponse.json({ error: "Хандах эрхгүй байна." }, { status: 403 })
    }

    const body = await request.json()
    const isObject = !!body && typeof body === "object" && !Array.isArray(body)
    const fields = isObject ? ALL_FIELDS.filter((key) => key !== "email" && key in body) : []
    if (fields.length === 0) {
      return NextResponse.json({ error: "Хадгалах мэдээлэл алга." }, { status: 400 })
    }

    const result = validateProfileFields(body, fields)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const data = await applyProfileUpdate(userId, result.values)

    return NextResponse.json({ success: true, message: "Амжилттай хадгалагдлаа.", data })
  } catch (error) {
    console.error("PATCH PROFILE ERROR:", error)
    return NextResponse.json({ error: "Серверийн алдаа" }, { status: 500 })
  }
}

const ALL_FIELDS = [
  "fullName",
  "email",
  "phone",
  "bio",
  "avatarUrl",
  "gender",
  "agreement",
  "skills",
  "experience",
  "education",
  "availability",
] as const

type ProfileField = (typeof ALL_FIELDS)[number]

type ProfileValues = {
  fullName?: string
  email?: string
  phone?: string
  bio?: string
  photoUrl?: string | null
  gender?: string | null
  agreement?: boolean
  skills?: unknown
  skillNames?: string[]
  experienceRows?: ExperienceRow[]
  educationRows?: EducationRow[]
  availability?: unknown
}

type ValidationResult = { ok: true; values: ProfileValues } | { ok: false; error: string }

// Талбар бүрийн шалгалт POST/PATCH-д нэг дор. fields-д байгаа талбарууд л шалгагдаж values-д орно.
function validateProfileFields(body: Record<string, unknown>, fields: readonly ProfileField[]): ValidationResult {
  const has = (key: ProfileField) => fields.includes(key)
  const fail = (error: string): ValidationResult => ({ ok: false, error })
  const values: ProfileValues = {}

  if (has("fullName")) {
    const fullName = body.fullName
    if (typeof fullName !== "string" || !fullName.trim()) return fail("Бүтэн нэр заавал бөглөнө.")
    if (fullName.length > 100) return fail("Нэр хамгийн ихдээ 100 тэмдэгт байна.")
    values.fullName = fullName
  }

  if (has("email")) {
    const email = body.email
    if (typeof email !== "string" || !email.trim()) return fail("Имэйл заавал бөглөнө.")
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email) || email.length > 254) return fail("Имэйл формат буруу байна.")
    values.email = email.trim()
  }

  if (has("phone")) {
    const phone = body.phone
    if (typeof phone !== "string" || !phone.trim()) return fail("Утасны дугаар заавал бөглөнө.")
    if (phone.length > 30) return fail("Утасны дугаар хэт урт байна.")
    values.phone = phone.trim()
  }

  if (has("bio")) {
    const bio = body.bio
    if (typeof bio !== "string" || !bio.trim()) return fail("Bio бөглөнө үү.")
    if (bio.length > 1000) return fail("Bio хамгийн ихдээ 1000 тэмдэгт байна.")
    values.bio = bio
  }

  if (has("gender")) {
    const gender = body.gender
    if (gender !== undefined && gender !== null && (typeof gender !== "string" || gender.length > 20)) {
      return fail("Хүйсийн утга буруу байна.")
    }
    values.gender = (gender as string) || null
  }

  if (has("agreement")) {
    values.agreement = body.agreement === true
  }

  if (has("skills")) {
    const selectedSkills = parseSkillNames(body.skills)
    if (!selectedSkills) return fail("Ур чадварын мэдээлэл буруу байна.")
    if (selectedSkills.length === 0) return fail("Ур чадвараа оруулна уу.")
    values.skills = body.skills
    values.skillNames = selectedSkills
  }

  if (has("avatarUrl")) {
    const photoUrl = normalizeHttpUrl(body.avatarUrl)
    if (photoUrl === undefined) return fail("Профайл зургийн холбоос буруу байна.")
    values.photoUrl = photoUrl
  }

  if (has("experience")) {
    const experienceResult = parseExperience(body.experience)
    if (!experienceResult.ok) return fail(experienceResult.error)
    values.experienceRows = experienceResult.rows
  }

  if (has("education")) {
    const educationResult = parseEducation(body.education)
    if (!educationResult.ok) return fail(educationResult.error)
    values.educationRows = educationResult.rows
  }

  if (has("availability")) {
    const availability = body.availability
    if (availability !== undefined && availability !== null && typeof availability !== "object") {
      return fail("Ажиллах цагийн мэдээлэл буруу байна.")
    }
    const enabledDays = (Object.entries(availability || {}) as [string, AvailabilityDay | null][]).filter(
      ([, value]) => value?.enabled
    )
    if (enabledDays.length === 0) return fail("Дор хаяж нэг ажиллах өдөр сонгоно уу.")
    for (const [dayName, day] of enabledDays) {
      if (!day?.from || !day?.to) return fail(`${dayName} гарагийн ажиллах цаг дутуу байна.`)
      if (day.from >= day.to) return fail(`${dayName} гарагийн эхлэх цаг дуусах цагаас бага байх ёстой.`)
    }
    values.availability = availability
  }

  return { ok: true, values }
}

// Шалгагдсан утгуудыг DB-д бичнэ. values-д байхгүй талбарт хүрэхгүй.
async function applyProfileUpdate(userId: string, values: ProfileValues) {
  if (values.fullName !== undefined) {
    // UPDATE STAFF NAME
    const splittedName = values.fullName.trim().split(/\s+/)
    const { error: staffUpdateError } = await supabase
      .from("mt_staff")
      .update({
        first_name: splittedName.slice(1).join(" "),
        last_name: splittedName[0] || "",
      })
      .eq("id", userId)
    if (staffUpdateError) throw staffUpdateError
  }

  // UPDATE PROFILE DATA
  const profileUpdate: Record<string, unknown> = {}
  if (values.email !== undefined) profileUpdate.email = values.email
  if (values.phone !== undefined) profileUpdate.phone = values.phone
  if (values.bio !== undefined) profileUpdate.bio = values.bio
  if (values.skills !== undefined) profileUpdate.skills = values.skills
  if (values.availability !== undefined) profileUpdate.availability = values.availability
  if (values.gender !== undefined) profileUpdate.gender = values.gender
  if (values.agreement !== undefined) profileUpdate.agreement = values.agreement
  if (values.photoUrl !== undefined) profileUpdate.photo_url = values.photoUrl

  let data = null
  if (Object.keys(profileUpdate).length > 0) {
    const result = await supabase
      .from("mt_profile")
      .update({ ...profileUpdate, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select()
    if (result.error) throw result.error
    data = result.data
  }

  // Жагсаалтуудыг "эхлээд шинийг нэмж, дараа нь хуучныг устгах" дарааллаар шинэчилнэ.
  // Нэмэх үед алдаа гарвал хуучин мэдээлэл хэвээр үлдэнэ (өмнө нь устгаад нэмдэг байсан тул алга болдог байсан).
  if (values.skillNames !== undefined) await replaceSkills(userId, values.skillNames)
  if (values.experienceRows !== undefined) await replaceRows("tr_staff_experience", userId, values.experienceRows)
  if (values.educationRows !== undefined) await replaceRows("tr_staff_education", userId, values.educationRows)

  return data
}

// Ур чадвар: зөвхөн нэмэгдсэнийг нэмж, хасагдсаныг устгана (staff_id, skill_id нь unique)
async function replaceSkills(userId: string, skillNames: string[]) {
  const [{ data: skillMaster, error: skillError }, { data: current, error: currentError }] = await Promise.all([
    supabase.from("mt_skill").select("id").in("skill_name", skillNames),
    supabase.from("tr_staff_skill").select("skill_id").eq("staff_id", userId),
  ])
  if (skillError) throw skillError
  if (currentError) throw currentError

  const desired = new Set((skillMaster || []).map((s) => s.id))
  const existing = new Set((current || []).map((s) => s.skill_id))

  const toInsert = [...desired].filter((id) => !existing.has(id))
  if (toInsert.length > 0) {
    const { error } = await supabase
      .from("tr_staff_skill")
      .insert(toInsert.map((skillId) => ({ staff_id: userId, skill_id: skillId })))
    if (error) throw error
  }

  const toDelete = [...existing].filter((id) => !desired.has(id))
  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("tr_staff_skill")
      .delete()
      .eq("staff_id", userId)
      .in("skill_id", toDelete)
    if (error) throw error
  }
}

// Туршлага / боловсрол: шинэ мөрүүдийг нэмсний дараа хуучин мөрүүдийг id-аар нь устгана
async function replaceRows(
  table: "tr_staff_experience" | "tr_staff_education",
  userId: string,
  rows: (ExperienceRow | EducationRow)[]
) {
  const { data: oldRows, error: oldError } = await supabase.from(table).select("id").eq("staff_id", userId)
  if (oldError) throw oldError

  const { error: insertError } = await supabase.from(table).insert(rows.map((row) => ({ ...row, staff_id: userId })))
  if (insertError) throw insertError

  const oldIds = (oldRows || []).map((row) => row.id)
  if (oldIds.length > 0) {
    const { error: deleteError } = await supabase.from(table).delete().eq("staff_id", userId).in("id", oldIds)
    if (deleteError) throw deleteError
  }
}
