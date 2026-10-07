import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { one } from "@/lib/relation"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    const userId = session?.userId
    const userRole = session?.role

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
      .select(`
        applicant_id, job_id, status, created_at,
        mt_openjob!inner(user_id, title, category, job_type, salary, salary_type, location, description, requirements)
      `)
      .eq("id", jobID)
      .eq("mt_openjob.user_id", userId) // Зөвхөн өөрийн зарласан ажлын байранд ирсэн анкет
      .maybeSingle()

    if (appError) {
      throw appError
    }

    if (!applicationData || !applicationData.applicant_id) {
      return NextResponse.json(
        { error: "Энэ анкеттай холбоотой ажилтан олдсонгүй." },
        { status: 404 }
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
        ?.filter((row) => one(row.mt_skill)?.skill_type === "technical")
        .map((row) => one(row.mt_skill)!.skill_name) || []

    const languageSkills =
      skillData
        ?.filter((row) => one(row.mt_skill)?.skill_type === "languages")
        .map((row) => one(row.mt_skill)!.skill_name) || []

    // 7. EXPERIENCE DATA
    const { data: expData, error: expError } = await supabase
      .from("tr_staff_experience")
      .select("company, position, start_date, end_date, description")
      .eq("staff_id", realStaffId)
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

    // 8. EDUCATION DATA
    const { data: eduData, error: eduError } = await supabase
      .from("tr_staff_education")
      .select("school, degree, field, graduation_year, is_current")
      .eq("staff_id", realStaffId)
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

    // Тухайн анкетаар горилж буй ажлын байр (Гэрээ хуудасны дэлгэрэнгүй цонхонд)
    const job = one(applicationData.mt_openjob)
    const application = {
      status: applicationData.status,
      created_at: applicationData.created_at,
      job: job
        ? {
            title: job.title,
            category: job.category,
            job_type: job.job_type,
            salary: job.salary,
            salary_type: job.salary_type,
            location: job.location,
            description: job.description,
            requirements: job.requirements,
          }
        : null,
    }

    return NextResponse.json({
      success: true,
      profile,
      application,
    })

  } catch (error) {
    console.error("COMPANY GET STAFF PROFILE ERROR:", error)
    return NextResponse.json(
      { error: "Серверийн алдаа" },
      { status: 500 }
    )
  }
}