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
    const {
      fullName,
      email,
      phone,
      bio,
      avatarUrl,
      gender,
      agreement,
      skills,
      experience,
      education,
      availability,
    } = body

    // VALIDATION — DB-д юу ч бичихээс өмнө бүх оролтыг шалгана
    if (typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ error: "Бүтэн нэр заавал бөглөнө." }, { status: 400 })
    }
    if (fullName.length > 100) {
      return NextResponse.json({ error: "Нэр хамгийн ихдээ 100 тэмдэгт байна." }, { status: 400 })
    }
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Имэйл заавал бөглөнө." }, { status: 400 })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Имэйл формат буруу байна." }, { status: 400 })
    }
    if (typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json({ error: "Утасны дугаар заавал бөглөнө." }, { status: 400 })
    }
    if (phone.length > 30) {
      return NextResponse.json({ error: "Утасны дугаар хэт урт байна." }, { status: 400 })
    }
    if (typeof bio !== "string" || !bio.trim()) {
      return NextResponse.json({ error: "Bio бөглөнө үү." }, { status: 400 })
    }
    if (bio.length > 1000) {
      return NextResponse.json({ error: "Bio хамгийн ихдээ 1000 тэмдэгт байна." }, { status: 400 })
    }
    if (gender !== undefined && gender !== null && (typeof gender !== "string" || gender.length > 20)) {
      return NextResponse.json({ error: "Хүйсийн утга буруу байна." }, { status: 400 })
    }

    const selectedSkills = parseSkillNames(skills)
    if (!selectedSkills) {
      return NextResponse.json({ error: "Ур чадварын мэдээлэл буруу байна." }, { status: 400 })
    }
    if (selectedSkills.length === 0) {
      return NextResponse.json({ error: "Ур чадвараа оруулна уу." }, { status: 400 })
    }

    const photoUrl = normalizeHttpUrl(avatarUrl)
    if (photoUrl === undefined) {
      return NextResponse.json({ error: "Профайл зургийн холбоос буруу байна." }, { status: 400 })
    }

    // EXPERIENCE / EDUCATION VALIDATION
    const experienceResult = parseExperience(experience)
    if (!experienceResult.ok) {
      return NextResponse.json({ error: experienceResult.error }, { status: 400 })
    }
    const educationResult = parseEducation(education)
    if (!educationResult.ok) {
      return NextResponse.json({ error: educationResult.error }, { status: 400 })
    }

    // AVAILABILITY VALIDATION
    if (availability !== undefined && availability !== null && typeof availability !== "object") {
      return NextResponse.json({ error: "Ажиллах цагийн мэдээлэл буруу байна." }, { status: 400 })
    }
    const enabledDays = (Object.entries(availability || {}) as [string, AvailabilityDay | null][]).filter(
      ([, value]) => value?.enabled
    )
    if (enabledDays.length === 0) {
      return NextResponse.json({ error: "Дор хаяж нэг ажиллах өдөр сонгоно уу." }, { status: 400 })
    }
    for (const [dayName, day] of enabledDays) {
      if (!day?.from || !day?.to) {
        return NextResponse.json(
          { error: `${dayName} гарагийн ажиллах цаг дутуу байна.` },
          { status: 400 }
        )
      }
      if (day.from >= day.to) {
        return NextResponse.json(
          { error: `${dayName} гарагийн эхлэх цаг дуусах цагаас бага байх ёстой.` },
          { status: 400 }
        )
      }
    }

    // UPDATE STAFF NAME
    const splittedName = fullName.trim().split(/\s+/)
    const first_name = splittedName.slice(1).join(" ")
    const last_name = splittedName[0] || ""

    const { error: staffUpdateError } = await supabase
      .from("mt_staff")
      .update({
        first_name,
        last_name,
      })
      .eq("id", userId)

    if (staffUpdateError) {
      throw staffUpdateError
    }

    // UPDATE PROFILE DATA
    const { data, error } = await supabase
      .from("mt_profile")
      .update({
        email: email.trim(),
        phone: phone.trim(),
        bio,
        skills,
        availability,
        gender: gender || null,
        agreement: agreement === true,
        photo_url: photoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()

    if (error) {
      throw error
    }

    // Жагсаалтуудыг "эхлээд шинийг нэмж, дараа нь хуучныг устгах" дарааллаар шинэчилнэ.
    // Нэмэх үед алдаа гарвал хуучин мэдээлэл хэвээр үлдэнэ (өмнө нь устгаад нэмдэг байсан тул алга болдог байсан).
    await replaceSkills(userId, selectedSkills)
    await replaceRows("tr_staff_experience", userId, experienceResult.rows)
    await replaceRows("tr_staff_education", userId, educationResult.rows)

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
