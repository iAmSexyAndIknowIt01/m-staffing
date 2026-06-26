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
    // mt_openjob-оор дамжуулж user_id-аар шүүнэ
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

    // --- 4. Танай идэвхтэй зарласан ажлуудын жагсаалт (+ анкетын тоо хамт) ---
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

    // Ирсэн өгөгдлийг фронтэндэд тохирох хэлбэрт хөрвүүлнэ
    const activeJobs = (jobsData || []).map((job: any) => ({
      id: job.id,
      title: job.title,
      totalApplicants: job.tr_job_request ? job.tr_job_request.length : 0,
      newApplicants: 0, // Шаардлагатай бол status-аар нь шүүж тоолж болно
      status: "Идэвхтэй",
      views: job.views || 0
    }))

    // --- 5. Сүүлд ирсэн 3 анкетын мэдээлэл (Нэмэлт UX) ---
    const { data: recentData, error: recentError } = await supabase
      .from("tr_job_request")
      .select(`
        id,
        created_at,
        mt_openjob!inner(title, user_id)
      `)
      .eq("mt_openjob.user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3)

    // Сүүлд ирсэн анкетуудын жишээ бүтэц (Хэрэв хэрэглэгчийн нэр өөр table-д байгаа бол mock дата хэрэглэж болно)
    const recentApplicants = (recentData || []).map((app: any, idx: number) => {
      const mockNames = ["Б. Төгөлдөр", "А. Анужин", "Т. Тэмүүлэн"]
      const mockAvatars = ["🧑‍💻", "👩‍💻", "👨‍💻"]
      return {
        id: app.id,
        name: mockNames[idx] || "Ажил горилогч",
        role: app.mt_openjob?.title || "Ажилтан",
        experience: "Харах",
        time: new Date(app.created_at).toLocaleDateString("mn-MN") + " ирсэн",
        avatar: mockAvatars[idx] || "🧑‍💻"
      }
    })

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