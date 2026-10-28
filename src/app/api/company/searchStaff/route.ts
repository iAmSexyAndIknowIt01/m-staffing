import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { one } from "@/lib/relation"
import { selectInChunks } from "@/lib/chunk"
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
        email,
        phone,
        bio,
        skills,
        availability,
        photo_url,
        gender,
        agreement,
        mt_staff!inner (
          first_name,
          last_name
        )
      `)
      .eq("agreement", true)

    if (genderFilter) {
      query = query.eq("gender", genderFilter)
    }

    const { data: profileList, error: profileError } = await query

    if (profileError) throw profileError

    // 2. Профайлын түвшний шүүлтүүрүүдийг (нэр, ур чадвар, ажиллах цаг) эхэлж хэрэглэнэ —
    //    ингэснээр туршлага, боловсролыг зөвхөн үлдсэн ажилтнуудад татна
    const candidates = (profileList || [])
      .map((profile) => {
        const firstName = one(profile.mt_staff)?.first_name || ""
        const lastName = one(profile.mt_staff)?.last_name || ""
        const skills = profile.skills || { technical: [], languages: [] }
        const availability = (profile.availability || {}) as Record<string, AvailabilityDay | undefined>
        return { profile, fullName: `${lastName} ${firstName}`.trim(), skills, availability }
      })
      .filter(({ fullName, skills, availability }) => {
        if (nameSearch && !fullName.toLowerCase().includes(nameSearch)) return false

        if (skillSearch && !(skills.technical?.some((s: string) => s.toLowerCase().includes(skillSearch)))) {
          return false
        }

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

    // 3. Туршлага, боловсролыг хэсэгчлэн татах (олон ID-г нэг URL-д багтаахгүй)
    const [expData, eduData] = await Promise.all([
      selectInChunks<{ staff_id: string; position: string | null; company: string | null; start_date: string; end_date: string | null }>(
        staffIds,
        (ids) => supabase.from("tr_staff_experience").select("staff_id, position, company, start_date, end_date").in("staff_id", ids)
      ),
      selectInChunks<{ staff_id: string; field: string | null }>(
        staffIds,
        (ids) => supabase.from("tr_staff_education").select("staff_id, field").in("staff_id", ids)
      ),
    ])

    const expByStaff = Map.groupBy(expData, (e) => e.staff_id)
    const eduByStaff = Map.groupBy(eduData, (e) => e.staff_id)
    const currentYear = new Date().getFullYear()

    // 4. Өгөгдлийг нэгтгэж, туршлага/боловсролын шүүлтүүрийг хэрэглэнэ
    const filteredStaff = candidates
      .map(({ profile, fullName, skills, availability }) => {
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

        return {
          id: profile.user_id,
          fullName,
          email: profile.email,
          phone: profile.phone,
          bio: profile.bio,
          gender: profile.gender === "male" || profile.gender === "female" ? profile.gender : null,
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
      .filter((staff) => {
        if (staff.experienceYears < minExp) return false
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
