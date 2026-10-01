import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"

// GET PROFILE
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    const session = await getSession()
    const userRole = session?.role

    // Хэрэв URL-д id байхгүй эсвэл хандаж буй хэрэглэгч эрхгүй бол
    if (!userId) {
      return NextResponse.json(
        { error: "Ажилтны ID олдсонгүй." },
        { status: 400 }
      )
    }

    // Компани, админ эсвэл ажилтан өөрийн профайлаа л харна.
    // Ажилтан бусад ажилтны утас, имэйлийг харах ёсгүй.
    const canView =
      session?.isAdmin ||
      userRole === "company" ||
      (userRole === "staff" && session?.userId === userId)

    if (!canView) {
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

    // 2. PROFILE DATA
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
        ?.filter((row: any) => row.mt_skill?.skill_type === "technical")
        .map((row: any) => row.mt_skill.skill_name) || []

    const languageSkills =
      skillData
        ?.filter((row: any) => row.mt_skill?.skill_type === "languages")
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

    // 5. EDUCATION DATA
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

    // MERGE DATA
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
  } catch (error: any) {
    console.error("GET PROFILE ERROR:", error)
    return NextResponse.json(
      { error: error.message || "Серверийн алдаа" },
      { status: 500 }
    )
  }
}
