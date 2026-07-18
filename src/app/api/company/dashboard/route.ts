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

    // 1. Компанийн багцын мэдээллийг авах
    let { data: subData, error: subError } = await supabase
      .from("mt_company_subscriptions")
      .select("plan_type, status, job_limit, expires_at")
      .eq("user_id", userId)
      .single()

    if (subError && subError.code === "PGRST116") {
      subData = { plan_type: "free", status: "active", job_limit: 3, expires_at: null }
    } else if (subError) {
      throw subError
    }

    const subscriptionData = subData ?? { plan_type: "free", status: "active", job_limit: 3, expires_at: null }

    // 2. Нээлттэй ажлын байрны тоо
    const { count: openJobsCount, error: openJobsError } = await supabase
      .from("mt_openjob")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (openJobsError) throw openJobsError

    // 3. Ирсэн нийт анкетын тоо
    const { count: totalApplicantsCount, error: applicantsError } = await supabase
      .from("tr_job_request")
      .select("*, mt_openjob!inner(user_id)", { count: "exact", head: true })
      .eq("mt_openjob.user_id", userId)

    if (applicantsError) throw applicantsError

    // 4. Ярилцлагад урьсан анкетын тоо
    const { count: interviewCount, error: interviewError } = await supabase
      .from("tr_job_request")
      .select("*, mt_openjob!inner(user_id)", { count: "exact", head: true })
      .eq("status", "interview")
      .eq("mt_openjob.user_id", userId)

    if (interviewError) throw interviewError

    // 5. Танай идэвхтэй зарласан ажлуудын жагсаалт
    const { data: jobsData, error: jobsError } = await supabase
      .from("mt_openjob")
      .select(`id, title, tr_job_request (id)`)
      .eq("user_id", userId)
      .order("id", { ascending: false })

    if (jobsError) throw jobsError

    let activeJobs = (jobsData || []).map((job: any) => ({
      id: job.id,
      title: job.title,
      totalApplicants: job.tr_job_request ? job.tr_job_request.length : 0,
      newApplicants: 0,
      status: "Идэвхтэй",
      views: job.views || 0
    }))

    activeJobs.sort((a, b) => {
      if (a.totalApplicants > 0 && b.totalApplicants === 0) return -1
      if (a.totalApplicants === 0 && b.totalApplicants > 0) return 1
      return 0
    })

    // 6. Сүүлд ирсэн 3 анкетын мэдээлэл
    const { data: recentRequests, error: recentError } = await supabase
      .from("tr_job_request")
      .select(`id, created_at, applicant_id, mt_openjob!inner(title, user_id)`)
      .eq("mt_openjob.user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3)

    if (recentError) throw recentError

    let recentApplicants: any[] = []

    if (recentRequests && recentRequests.length > 0) {
      const applicantIds = recentRequests.map((r: any) => r.applicant_id).filter(Boolean)

      const [staffResult, profileResult] = await Promise.all([
        supabase.from("mt_staff").select("id, last_name, first_name").in("id", applicantIds),
        supabase.from("mt_profile").select("user_id, photo_url").in("user_id", applicantIds)
      ])

      const staffData = staffResult.data || []
      const profileData = profileResult.data || []

      recentApplicants = recentRequests.map((app: any) => {
        const staff = staffData.find((s: any) => s.id === app.applicant_id)
          const profile = profileData.find((p: any) => p.user_id === app.applicant_id)

          const fullName = `${staff?.last_name ? staff.last_name + " " : ""}${staff?.first_name || ""}`.trim()
          let finalAvatarUrl = profile?.photo_url?.startsWith("http") 
            ? profile.photo_url 
            : profile?.photo_url 
              ? supabase.storage.from("avatars").getPublicUrl(profile.photo_url).data.publicUrl 
              : null

          return {
            id: app.id, 
            name: fullName || "Ажил горилогч", 
            role: app.mt_openjob?.title || "Тодорхойгүй ажлын байр", 
            time: new Date(app.created_at).toLocaleDateString("mn-MN") + " ирсэн",
            avatar: finalAvatarUrl
          }
      })
    }

    // 🔥 ШИНЭЧЛЭЛТ: mt_tips-ээс компанид хамааралтай зөвлөгөөнүүдийг авах логик
    const { data: tipsData, error: tipsError } = await supabase
      .from("mt_tips")
      .select("id, title, icon, content, detail_url")
      .eq("flag", "company") // зөвхөн ажил олгогчийн зөвлөгөөнүүд
      .eq("is_active", true) // идэвхтэй байгаа зөвлөгөө
      .order("id", { ascending: false })
      .limit(5)

    if (tipsError) console.error("Tips Fetch Error:", tipsError) // Алдаа гарвал консолд хэвлээд цааш ажиллана

    const planNames: Record<string, string> = {
      free: "Үнэгүй багц",
      standard: "Standard Plan",
      premium: "Premium Plan"
    }

    return NextResponse.json({
      success: true,
      stats: {
        openJobsCount: openJobsCount || 0,
        totalApplicantsCount: totalApplicantsCount || 0,
        interviewCount: interviewCount || 0
      },
      subscription: {
        planName: planNames[subscriptionData.plan_type] || "Тодорхойгүй багц",
        status: subscriptionData.status === "active" ? "Идэвхтэй" : "Идэвхгүй",
        jobLimit: subscriptionData.job_limit,
        expiresAt: subscriptionData.expires_at ? new Date(subscriptionData.expires_at).toLocaleDateString("mn-MN") : "Хугацаагүй"
      },
      activeJobs,
      recentApplicants,
      // 🔥 ШИНЭЧЛЭЛТ: Зөвлөгөөнүүдийг хариултанд нэмж өгөх
      tips: tipsData || []
    })

  } catch (error: any) {
    console.error("Dashboard API Error:", error)
    return NextResponse.json({ success: false, error: "Серверийн алдаа гарлаа." }, { status: 500 })
  }
}