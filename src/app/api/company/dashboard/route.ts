import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: "Нэвтрээгүй байна." }, { status: 401 })
    }

    // --- 1. Нээлттэй ажлын байрны тоо ---
    const { count: openJobsCount, error: openJobsError } = await supabase
      .from("mt_openjob")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (openJobsError) throw openJobsError

    // --- 2. Ирсэн нийт анкетын тоо ---
    const { count: totalApplicantsCount, error: applicantsError } = await supabase
      .from("tr_job_request")
      .select("*, mt_openjob!inner(user_id)", { count: "exact", head: true })
      .eq("mt_openjob.user_id", userId)

    if (applicantsError) throw applicantsError

    // --- 3. Ярилцлагад урьсан анкетын тоо ---
    const { count: interviewCount, error: interviewError } = await supabase
      .from("tr_job_request")
      .select("*, mt_openjob!inner(user_id)", { count: "exact", head: true })
      .eq("status", "interview")
      .eq("mt_openjob.user_id", userId)

    if (interviewError) throw interviewError

    // --- 4. Танай идэвхтэй зарласан ажлуудын жагсаалт ---
    const { data: jobsData, error: jobsError } = await supabase
      .from("mt_openjob")
      .select(`
        id,
        title,
        tr_job_request (id)
      `)
      .eq("user_id", userId)
      .order("id", { ascending: false })

    if (jobsError) throw jobsError

    const activeJobs = (jobsData || []).map((job: any) => ({
      id: job.id,
      title: job.title,
      totalApplicants: job.tr_job_request ? job.tr_job_request.length : 0,
      newApplicants: 0,
      status: "Идэвхтэй",
      views: job.views || 0
    }))

    // --- 5. Сүүлд ирсэн 3 анкетын мэдээлэл ---
    const { data: recentRequests, error: recentError } = await supabase
      .from("tr_job_request")
      .select(`
        id,
        created_at,
        applicant_id,
        mt_openjob!inner(title, user_id)
      `)
      .eq("mt_openjob.user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3)

    if (recentError) throw recentError

    let recentApplicants: {
      id: any 
      name: string 
      role: any 
      experience: string; time: string; avatar: string | null 
    }[] = []

    if (recentRequests && recentRequests.length > 0) {
      const applicantIds = recentRequests.map((r: any) => r.applicant_id).filter(Boolean)

      // mt_staff хүснэгтээс 'id'-аар, mt_profile хүснэгтээс 'user_id'-аар шүүж авна
      const [staffResult, profileResult] = await Promise.all([
        supabase.from("mt_staff").select("id, last_name, first_name").in("id", applicantIds),
        supabase.from("mt_profile").select("user_id, photo_url").in("user_id", applicantIds)
      ])

      if (staffResult.error) throw staffResult.error
      if (profileResult.error) throw profileResult.error

      const staffData = staffResult.data || []
      const profileData = profileResult.data || []

      recentApplicants = recentRequests.map((app: any) => {
        // s.id баганыг app.applicant_id-тай тулгаж олно
        const staff = staffData.find((s: any) => s.id === app.applicant_id)
        const profile = profileData.find((p: any) => p.user_id === app.applicant_id)

        // Овог нэрийг залгах логик
        const lastName = staff?.last_name ? `${staff.last_name} ` : ""
        const firstName = staff?.first_name || ""
        const fullName = `${lastName}${firstName}`.trim()

        // Storage avatars bucket-аас нийтийн URL үүсгэх логик
        let finalAvatarUrl = null
        if (profile?.photo_url) {
          if (profile.photo_url.startsWith("http")) {
            finalAvatarUrl = profile.photo_url
          } else {
            const { data } = supabase.storage
              .from("avatars")
              .getPublicUrl(profile.photo_url)
            finalAvatarUrl = data.publicUrl
          }
        }

        return {
          id: app.id, 
          name: fullName || "Ажил горилогч", 
          role: app.mt_openjob?.title || "Тодорхойгүй ажлын байр", 
          experience: "Харах",
          time: new Date(app.created_at).toLocaleDateString("mn-MN") + " ирсэн",
          avatar: finalAvatarUrl
        }
      })
    }

    return NextResponse.json({
      success: true,
      stats: {
        openJobsCount: openJobsCount || 0,
        totalApplicantsCount: totalApplicantsCount || 0,
        interviewCount: interviewCount || 0
      },
      activeJobs,
      recentApplicants
    })

  } catch (error: any) {
    console.error("Dashboard API Error:", error)
    return NextResponse.json({ success: false, error: "Серверийн алдаа гарлаа." }, { status: 500 })
  }
}