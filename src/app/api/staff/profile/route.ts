import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

// GET PROFILE
export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

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

    // 2. PROFILE DATA (photo_url баганыг нэмж уншив)
    const { data: profileData, error: profileError } = await supabase
      .from("mt_profile")
      .select(`
        user_id,
        email,
        phone,
        bio,
        skills,
        availability,
        photo_url
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
        ?.filter((row: any) => row.mt_skill?.skill_type === "technical")
        .map((row: any) => row.mt_skill.skill_name) || []

    const languageSkills =
      skillData
        ?.filter((row: any) => row.mt_skill?.skill_type === "language")
        .map((row: any) => row.mt_skill.skill_name) || []

    // 4. EXPERIENCE DATA
    const { data: expData, error: expError } = await supabase
      .from("tr_staff_experience")
      .select("company, position, start_date, end_date, description")
      .eq("staff_id", userId)
      .order("start_date", { ascending: false })

    if (expError) {
      throw expError
    }

    const formattedExperience = expData?.map((exp: any) => ({
      company: exp.company,
      position: exp.position,
      startDate: exp.start_date,
      endDate: exp.end_date || "",
      description: exp.description || "",
    })) || []

    // 5. EDUCATION DATA FROM TR_STAFF_EDUCATION
    const { data: eduData, error: eduError } = await supabase
      .from("tr_staff_education")
      .select("school, degree, field, graduation_year, is_current")
      .eq("staff_id", userId)
      .order("graduation_year", { ascending: false })

    if (eduError) {
      throw eduError
    }

    const formattedEducation = eduData?.map((edu: any) => ({
      school: edu.school,
      degree: edu.degree,
      field: edu.field || "",
      graduationYear: edu.graduation_year || "",
      isCurrent: edu.is_current,
    })) || []

    // MERGE DATA (avatar_url талбарт photo_url утгыг оноов)
    const profile = {
      full_name: `${staffData?.last_name || ""} ${staffData?.first_name || ""}`.trim(),
      email: profileData?.email || "",
      phone: profileData?.phone || "",
      bio: profileData?.bio || "",
      avatar_url: profileData?.photo_url || "", // Фронтендэд аватар нэрээр буцна
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
  } catch (error: any) {
    console.error("GET PROFILE ERROR:", error)
    return NextResponse.json(
      { error: error.message || "Серверийн алдаа" },
      { status: 500 }
    )
  }
}

// ========================================
// SAVE PROFILE
// ========================================
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

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
      avatarUrl, // Фронтендээс ирэх зургийн URL-ийг хүлээн авна
      skills,
      experience,
      education,
      availability,
    } = body

    // VALIDATION
    if (!fullName?.trim()) {
      return NextResponse.json({ error: "Бүтэн нэр заавал бөглөнө." }, { status: 400 })
    }
    if (fullName.length > 100) {
      return NextResponse.json({ error: "Нэр хамгийн ихдээ 100 тэмдэгт байна." }, { status: 400 })
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Имэйл заавал бөглөнө." }, { status: 400 })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Имэйл формат буруу байна." }, { status: 400 })
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: "Утасны дугаар заавал бөглөнө." }, { status: 400 })
    }
    if (!bio?.trim()) {
      return NextResponse.json({ error: "Bio бөглөнө үү." }, { status: 400 })
    }
    if (bio.length > 1000) {
      return NextResponse.json({ error: "Bio хамгийн ихдээ 1000 тэмдэгт байна." }, { status: 400 })
    }
    if (!skills || (skills.technical?.length === 0 && skills.languages?.length === 0)) {
      return NextResponse.json({ error: "Ур чадвараа оруулна уу." }, { status: 400 })
    }
    
    // EXPERIENCE VALIDATION
    if (!Array.isArray(experience) || experience.length === 0) {
      return NextResponse.json({ error: "Ажлын туршлагаа оруулна уу." }, { status: 400 })
    }

    // EDUCATION VALIDATION
    if (!Array.isArray(education) || education.length === 0) {
      return NextResponse.json({ error: "Боловсролын мэдээллээ оруулна уу." }, { status: 400 })
    }

    // AVAILABILITY VALIDATION
    const enabledDays = Object.entries(availability || {}).filter(
      ([, value]: any) => value.enabled
    )
    if (enabledDays.length === 0) {
      return NextResponse.json({ error: "Дор хаяж нэг ажиллах өдөр сонгоно уу." }, { status: 400 })
    }
    for (const [dayName, day] of enabledDays as any[]) {
      if (!day.from || !day.to) {
        return NextResponse.json(
          { error: `${dayName} garaгийн ажиллах цаг дутуу байна.` },
          { status: 400 }
        )
      }
      if (day.from >= day.to) {
        return NextResponse.json(
          { error: `${dayName} garaгийн эхлэх цаг дуусах цагаас бага байх ёстой.` },
          { status: 400 }
        )
      }
    }

    // UPDATE STAFF NAME
    const splittedName = fullName?.trim().split(" ") || []
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

    // UPDATE PROFILE DATA (photo_url баганыг нэмж хадгалав)
    const { data, error } = await supabase
      .from("mt_profile")
      .update({
        email,
        phone,
        bio,
        skills,
        availability,
        photo_url: avatarUrl ? avatarUrl.trim() : null, // photo_url-ийг бааз руу шинэчлэх хэсэг
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()

    if (error) {
      throw error
    }

    // UPDATE SKILLS (DELETE & INSERT)
    const selectedSkills = [
      ...(skills.technical || []),
      ...(skills.languages || []),
    ]

    const { data: skillMaster, error: skillError } = await supabase
      .from("mt_skill")
      .select("id, skill_name")
      .in("skill_name", selectedSkills)

    if (skillError) {
      throw skillError
    }

    const { error: deleteSkillError } = await supabase
      .from("tr_staff_skill")
      .delete()
      .eq("staff_id", userId)

    if (deleteSkillError) {
      throw deleteSkillError
    }

    if (skillMaster && skillMaster.length > 0) {
      const insertSkillRows = skillMaster.map((skill) => ({
        staff_id: userId,
        skill_id: skill.id,
      }))

      const { error: insertSkillError } = await supabase
        .from("tr_staff_skill")
        .insert(insertSkillRows)

      if (insertSkillError) {
        throw insertSkillError
      }
    }

    // UPDATE EXPERIENCE (DELETE & INSERT)
    const { error: deleteExpError } = await supabase
      .from("tr_staff_experience")
      .delete()
      .eq("staff_id", userId)

    if (deleteExpError) {
      throw deleteExpError
    }

    if (experience && experience.length > 0) {
      const insertExpRows = experience.map((exp: any) => ({
        staff_id: userId,
        company: exp.company,
        position: exp.position,
        start_date: exp.startDate,
        end_date: exp.endDate || null,
        description: exp.description || "",
      }))

      const { error: insertExpError } = await supabase
        .from("tr_staff_experience")
        .insert(insertExpRows)

      if (insertExpError) {
        throw insertExpError
      }
    }

    // UPDATE EDUCATION (DELETE & INSERT)
    const { error: deleteEduError } = await supabase
      .from("tr_staff_education")
      .delete()
      .eq("staff_id", userId)

    if (deleteEduError) {
      throw deleteEduError
    }

    if (education && education.length > 0) {
      const insertEduRows = education.map((edu: any) => ({
        staff_id: userId,
        school: edu.school,
        degree: edu.degree,
        field: edu.field || "",
        graduation_year: edu.graduationYear || null,
        is_current: edu.isCurrent || false,
      }))

      const { error: insertEduError } = await supabase
        .from("tr_staff_education")
        .insert(insertEduRows)

      if (insertEduError) {
        throw insertEduError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Профайл амжилттай хадгалагдлаа.",
      data,
    })
  } catch (error: any) {
    console.error("POST PROFILE ERROR:", error)
    return NextResponse.json(
      { error: error.message || "Серверийн алдаа" },
      { status: 500 }
    )
  }
}