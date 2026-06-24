import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    const userRole = cookieStore.get("user_role")?.value

    // 1. КОМПАНИ ЭРХТЭЙ ЭСЭХИЙГ ШАЛГАХ
    if (!userId || userRole !== "company") {
      return NextResponse.json(
        { error: "Хандах эрхгүй байна. Зөвхөн компани эрхтэй хэрэглэгч харах боломжтой." },
        { status: 403 }
      )
    }

    // 2. URL-ААС JOB APPLICATION ID-Г АВАХ
    const { searchParams } = new URL(request.url)
    const jobID = searchParams.get("id")

    if (!jobID) {
      return NextResponse.json(
        { error: "Анкетын ID заавал шаардлагатай." },
        { status: 400 }
      )
    }

    // 3. АНКЕТЫН ID-ААР СУУРЬ АЖИЛТНЫ STAFF_ID-Г ОЛОХ
    const { data: applicationData, error: appError } = await supabase
      .from("tr_job_request")
      .select("applicant_id, job_id")
      .eq("id", jobID)
      .maybeSingle()

    if (appError) {
      throw appError
    }

    if (!applicationData || !applicationData.applicant_id) {
      return NextResponse.json(
        { error: "Энэ анкеттай холбоотой ажилтан олдсонгүй." },
        { status: 444 }
      )
    }

    const realStaffId = applicationData.applicant_id

    // 4. STAFF NAME
    const { data: staffData, error: staffError } = await supabase
      .from("mt_staff")
      .select("first_name, last_name")
      .eq("id", realStaffId)
      .maybeSingle()

    if (staffError) {
      throw staffError
    }

    // 5. PROFILE DATA (photo_url-ийг унших)
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
      .eq("user_id", realStaffId)
      .maybeSingle()

    if (profileError && profileError.code !== "PGRST116") {
      throw profileError
    }

    // 6. SKILLS DATA
    const { data: skillData, error: skillError } = await supabase
      .from("tr_staff_skill")
      .select(`
        skill_id,
        mt_skill (
          skill_name,
          skill_type
        )
      `)
      .eq("staff_id", realStaffId)

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

    // 7. EXPERIENCE DATA
    const { data: expData, error: expError } = await supabase
      .from("tr_staff_experience")
      .select("company, position, start_date, end_date, description")
      .eq("staff_id", realStaffId)
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

    // 8. EDUCATION DATA
    const { data: eduData, error: eduError } = await supabase
      .from("tr_staff_education")
      .select("school, degree, field, graduation_year, is_current")
      .eq("staff_id", realStaffId)
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

    // ТАНЫ АЖИЛТНЫ API-ТАЙ ЯГ ИЖИЛХЭН БҮТЭЦТЭЙ БОЛГОЖ НЭГТГЭХ (avatar_url болгов)
    const profile = {
      full_name: staffData 
        ? `${staffData.last_name || ""} ${staffData.first_name || ""}`.trim()
        : "Ажил горилогч (Нэр бөглөөгүй)",
      email: profileData?.email || "",
      phone: profileData?.phone || "",
      bio: profileData?.bio || "",
      avatar_url: profileData?.photo_url || "", // Баазад байгаа бүтэн URL-ийг шууд онооно
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
    console.error("COMPANY GET STAFF PROFILE ERROR:", error)
    return NextResponse.json(
      { error: error.message || "Серверийн алдаа" },
      { status: 500 }
    )
  }
}