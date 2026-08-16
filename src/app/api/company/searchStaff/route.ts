import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

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
    const genderFilter = searchParams.get("gender") || "Бүгд"
    const minExp = Number(searchParams.get("minExp")) || 0

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

    if (genderFilter && genderFilter !== "Бүгд") {
      query = query.eq("gender", genderFilter)
    }

    const { data: profileList, error: profileError } = await query

    if (profileError) throw profileError

    if (!profileList || profileList.length === 0) {
      return NextResponse.json({ success: true, staff: [] })
    }

    const staffIds = profileList.map((p) => p.user_id)

    // 2. Туршлага (tr_staff_experience) болон Боловсролын (tr_staff_education) мэдээллийг татах
    const [expRes, eduRes] = await Promise.all([
      supabase.from("tr_staff_experience").select("staff_id, position, start_date, end_date").in("staff_id", staffIds),
      supabase.from("tr_staff_education").select("staff_id, field").in("staff_id", staffIds),
    ])

    if (expRes.error) throw expRes.error
    if (eduRes.error) throw eduRes.error

    const expData = expRes.data || []
    const eduData = eduRes.data || []

    // 3. Өгөгдлийг нэгтгэн боловсруулах
    const formattedStaffList = profileList.map((profile: any) => {
      const staffExp = expData.filter((e) => e.staff_id === profile.user_id)
      const staffEdu = eduData.filter((e) => e.staff_id === profile.user_id)
      
      let totalExperienceYears = 0
      staffExp.forEach((exp: any) => {
        const start = new Date(exp.start_date).getFullYear()
        const end = exp.end_date ? new Date(exp.end_date).getFullYear() : new Date().getFullYear()
        if (!isNaN(start)) {
          totalExperienceYears += Math.max(0, end - start)
        }
      })

      const firstName = profile.mt_staff?.first_name || ""
      const lastName = profile.mt_staff?.last_name || ""
      const fullName = `${lastName} ${firstName}`.trim()
      
      const technicalSkills = profile.skills?.technical || []
      const role = technicalSkills[0] || "Мэргэжилтэй ажилтан"

      const positions = staffExp.map((e) => e.position || "")
      const fields = staffEdu.map((e) => e.field || "")

      return {
        id: profile.user_id,
        fullName,
        email: profile.email,
        phone: profile.phone,
        bio: profile.bio,
        gender: profile.gender,
        agreement: profile.agreement,
        avatarUrl: profile.photo_url || "",
        role,
        experienceYears: totalExperienceYears,
        skills: profile.skills || { technical: [], languages: [] },
        positions,
        fields,
        location: "Улаанбаатар",
      }
    })

    // 4. Тус тусын талбараар шүүх логик
    const filteredStaff = formattedStaffList.filter((staff) => {
      if (staff.experienceYears < minExp) return false

      // Нэрээр хайх
      if (nameSearch && !staff.fullName.toLowerCase().includes(nameSearch)) {
        return false
      }
      // Ур чадвараар хайх
      if (skillSearch && !(staff.skills?.technical?.some((s: string) => s.toLowerCase().includes(skillSearch)))) {
        return false
      }
      // Туршлагын албан тушаалаар хайх (position)
      if (positionSearch && !(staff.positions.some((p: string) => p.toLowerCase().includes(positionSearch)))) {
        return false
      }
      // Боловсролын чиглэлээр хайх (field)
      if (fieldSearch && !(staff.fields.some((f: string) => f.toLowerCase().includes(fieldSearch)))) {
        return false
      }

      return true
    })

    return NextResponse.json({
      success: true,
      staff: filteredStaff,
    })
  } catch (error: any) {
    console.error("SEARCH STAFF API ERROR:", error)
    return NextResponse.json(
      { error: error.message || "Серверийн алдаа гарлаа" },
      { status: 500 }
    )
  }
}