import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value

    // Хамгаалалт: Зөвхөн нэвтэрсэн хэрэглэгч харах боломжтой
    if (!userId) {
      return NextResponse.json(
        { error: "Нэвтрэх шаардлагатай байна." },
        { status: 401 }
      )
    }

    // Идэвхтэй ажлуудыг татахдаа тухайн хэрэглэгчийн илгээсэн анкетыг давхар татна
    const { data: jobsData, error } = await supabase
      .from("mt_openjob")
      .select(`
        *,
        tr_job_request(id)
      `)
      .eq("status", "active")
      .eq("tr_job_request.applicant_id", userId) // Зөвхөн энэ хэрэглэгчийн хүсэлтийг шүүнэ
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    // Датаг фронт талд ашиглахад хялбар болгож форматлана
    const formattedJobs = (jobsData || []).map((job: any) => {
      // tr_job_request дотор дата байвал өмнө нь анкет илгээсэн гэсэн үг
      const isApplied = job.tr_job_request && job.tr_job_request.length > 0
      
      // Шаардлагагүй болсон хүснэгтийн relation датаг устгах
      const { tr_job_request, ...cleanedJob } = job

      return {
        ...cleanedJob,
        is_applied: isApplied
      }
    })

    return NextResponse.json({ success: true, jobs: formattedJobs }, { status: 200 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Ажлын зарууд татахад алдаа гарлаа:", error)
    return NextResponse.json(
      { error: error.message || "Серверт алдаа гарлаа." },
      { status: 500 }
    )
  }
}