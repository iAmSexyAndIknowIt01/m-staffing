import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { one } from "@/lib/relation"
import { selectInChunks } from "@/lib/chunk"
import { isStaffProfileComplete } from "@/lib/staffProfileCompleteness"
import { getLatestUnlocks } from "@/lib/staffContactAccess"
import { calcAge } from "@/lib/birthDate"
import type { AvailabilityDay } from "@/types/profile"

const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export async function GET(request: Request) {
  try {
    const session = await getSession()
    const userId = session?.userId
    const userRole = session?.role

    if (!userId || userRole !== "company") {
      return NextResponse.json(
        { error: "Хандах эрхгүй байна. Компанийн эрхээр нэвтэрнэ үү." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const nameSearch = searchParams.get("name")?.trim().toLowerCase() || ""
    const skillSearch = searchParams.get("skill")?.trim().toLowerCase() || ""
    const positionSearch = searchParams.get("position")?.trim().toLowerCase() || ""
    const fieldSearch = searchParams.get("field")?.trim().toLowerCase() || ""
    // DB-д "male" / "female" хэлбэрээр хадгалагдана
    const genderParam = searchParams.get("gender") || ""
    const genderFilter = genderParam === "male" || genderParam === "female" ? genderParam : ""
    const minExp = Number(searchParams.get("minExp")) || 0

    // Өдөр болон цагийн шүүлтүүр
    const dayFilter = searchParams.get("day") || ""     // Жишээ: "monday", "friday"
    const timeFilter = searchParams.get("time") || ""   // Жишээ: "14:00"

    // 1. Профайлаа нээлттэй болгосон ажилчдын үндсэн мэдээллийг татах
    let query = supabase
      .from("mt_profile")
      .select(`
        user_id,
        phone,
        bio,
        availability,
        photo_url,
        gender,
        agreement,
        mt_staff!inner (
          first_name,
          last_name,
          birth_date
        )
      `)
      .eq("agreement", true)

    if (genderFilter) {
      query = query.eq("gender", genderFilter)
    }

    const { data: profileList, error: profileError } = await query

    if (profileError) throw profileError

    // 2. Профайлын түвшний шүүлтүүрүүдийг (нэр, ажиллах цаг) эхэлж хэрэглэнэ —
    //    ингэснээр ур чадвар, туршлага, боловсролыг зөвхөн үлдсэн ажилтнуудад татна
    const candidates = (profileList || [])
      .map((profile) => {
        const firstName = one(profile.mt_staff)?.first_name || ""
        const lastName = one(profile.mt_staff)?.last_name || ""
        const availability = (profile.availability || {}) as Record<string, AvailabilityDay | undefined>
        return { profile, fullName: `${lastName} ${firstName}`.trim(), availability }
      })
      .filter(({ fullName, availability }) => {
        if (nameSearch && !fullName.toLowerCase().includes(nameSearch)) return false

        if (dayFilter) {
          // "constructor" г.м. prototype-ийн түлхүүрийг өдөр гэж тооцохгүй
          const dayAvailability = Object.hasOwn(availability, dayFilter) ? availability[dayFilter] : undefined

          // Хэрэв сонгосон өдөр нь байхгүй эсвэл enabled нь false байвал буцаана
          if (!dayAvailability || !dayAvailability.enabled) return false

          // Сонгосон цаг нь ажилтны боломжит цагийн завсарт (from <= time <= to) багтаж байгаа эсэх
          if (timeFilter && (!dayAvailability.from || !dayAvailability.to ||
            timeFilter < dayAvailability.from || timeFilter > dayAvailability.to)) {
            return false
          }
        }

        return true
      })

    if (candidates.length === 0) {
      return NextResponse.json({ success: true, staff: [] })
    }

    const staffIds = candidates.map(({ profile }) => profile.user_id)

    // 3. Ур чадвар, туршлага, боловсролыг хэсэгчлэн татах (олон ID-г нэг URL-д багтаахгүй).
    //    Ур чадварыг профайл хуудастай адил tr_staff_skill хүснэгтээс уншина
    //    (mt_profile.skills нь текст хуулбар тул найдвартай биш).
    type SkillRow = { staff_id: string; mt_skill: { skill_name: string; skill_type: string } | { skill_name: string; skill_type: string }[] | null }
    const [skillData, expData, eduData, latestUnlocks] = await Promise.all([
      selectInChunks<SkillRow>(
        staffIds,
        (ids) => supabase.from("tr_staff_skill").select("staff_id, mt_skill (skill_name, skill_type)").in("staff_id", ids)
      ),
      selectInChunks<{ staff_id: string; position: string | null; company: string | null; start_date: string; end_date: string | null }>(
        staffIds,
        (ids) => supabase.from("tr_staff_experience").select("staff_id, position, company, start_date, end_date").in("staff_id", ids)
      ),
      selectInChunks<{ staff_id: string; field: string | null }>(
        staffIds,
        (ids) => supabase.from("tr_staff_education").select("staff_id, field").in("staff_id", ids)
      ),
      // Энэ компани хүсэлт илгээсэн ажилтнууд (жагсаалтад ялгаж харуулна)
      getLatestUnlocks(userId, staffIds),
    ])
    const nowIso = new Date().toISOString()

    const skillsByStaff = new Map<string, { technical: string[]; languages: string[] }>()
    for (const row of skillData) {
      const skill = one(row.mt_skill)
      if (!skill?.skill_name) continue
      const entry = skillsByStaff.get(row.staff_id) ?? { technical: [], languages: [] }
      if (skill.skill_type === "technical") entry.technical.push(skill.skill_name)
      else if (skill.skill_type === "languages") entry.languages.push(skill.skill_name)
      skillsByStaff.set(row.staff_id, entry)
    }
    const expByStaff = Map.groupBy(expData, (e) => e.staff_id)
    const eduByStaff = Map.groupBy(eduData, (e) => e.staff_id)
    const currentYear = new Date().getFullYear()

    // 4. Өгөгдлийг нэгтгэж, туршлага/боловсролын шүүлтүүрийг хэрэглэнэ
    const filteredStaff = candidates
      .map(({ profile, fullName, availability }) => {
        const skills = skillsByStaff.get(profile.user_id) ?? { technical: [], languages: [] }
        const staffExp = expByStaff.get(profile.user_id) || []
        const staffEdu = eduByStaff.get(profile.user_id) || []

        let totalExperienceYears = 0
        staffExp.forEach((exp) => {
          const start = new Date(exp.start_date).getFullYear()
          const end = exp.end_date ? new Date(exp.end_date).getFullYear() : currentYear
          if (!isNaN(start)) {
            totalExperienceYears += Math.max(0, end - start)
          }
        })

        // Хамгийн сүүлийн (эсвэл одоо ажиллаж буй) туршлага — картын гарчигт харуулна
        const latestExp = [...staffExp]
          .filter((e) => e.position?.trim())
          .sort((a, b) => (b.end_date ? 0 : 1) - (a.end_date ? 0 : 1) || String(b.start_date).localeCompare(String(a.start_date)))[0]

        // Ажиллах боломжтой өдрүүд (Даваа → Ням дарааллаар)
        const availableDays = WEEK_DAYS.filter((day) => Object.hasOwn(availability, day) && availability[day]?.enabled)

        // Профайл хуудасны 100%-ийн шалгууртай ижил дүрмээр бүрэн бөглөгдсөн эсэхийг тооцно
        const isComplete = isStaffProfileComplete({
          fullName,
          phone: profile.phone || "",
          bio: profile.bio || "",
          avatarUrl: profile.photo_url || "",
          gender: profile.gender || "",
          birthDate: one(profile.mt_staff)?.birth_date || "",
          skills,
          experienceCount: staffExp.length,
          educationCount: staffEdu.length,
          enabledDays: availableDays.length,
        })

        // Зөвхөн профайлаа бүрэн бөглөсөн ажилтныг харуулна
        if (!isComplete) return null

        const requestExpiresAt = latestUnlocks.get(profile.user_id) ?? null

        return {
          id: profile.user_id,
          fullName,
          // null — хүсэлт илгээгээгүй; active — утас, имэйл одоо нээлттэй
          request: requestExpiresAt ? { expiresAt: requestExpiresAt, active: requestExpiresAt > nowIso } : null,
          // Утас, имэйлийг жагсаалтад өгөхгүй — профайл дээр эрх нээж харна
          bio: profile.bio,
          gender: profile.gender === "male" || profile.gender === "female" ? profile.gender : null,
          // Төрсөн огнооноос тооцсон нас (оруулаагүй бол null)
          age: calcAge(one(profile.mt_staff)?.birth_date || ""),
          agreement: profile.agreement,
          avatarUrl: profile.photo_url || "",
          headline: latestExp?.position?.trim() || null,
          headlineCompany: latestExp?.company?.trim() || null,
          isCurrent: !!latestExp && !latestExp.end_date,
          experienceYears: totalExperienceYears,
          hasExperience: staffExp.length > 0,
          availableDays,
          skills,
          availability,
          positions: staffExp.map((e) => e.position || ""),
          fields: staffEdu.map((e) => e.field || ""),
        }
      })
      .filter((staff): staff is NonNullable<typeof staff> => {
        if (!staff) return false
        if (staff.experienceYears < minExp) return false
        // Ур чадвараар хайх
        if (skillSearch && !staff.skills.technical.some((s) => s.toLowerCase().includes(skillSearch))) return false
        // Туршлагын албан тушаалаар хайх (position)
        if (positionSearch && !staff.positions.some((p) => p.toLowerCase().includes(positionSearch))) return false
        // Боловсролын чиглэлээр хайх (field)
        if (fieldSearch && !staff.fields.some((f) => f.toLowerCase().includes(fieldSearch))) return false
        return true
      })

    return NextResponse.json({
      success: true,
      staff: filteredStaff,
    })
  } catch (error) {
    console.error("SEARCH STAFF API ERROR:", error)
    return NextResponse.json(
      { error: "Серверийн алдаа гарлаа" },
      { status: 500 }
    )
  }
}
