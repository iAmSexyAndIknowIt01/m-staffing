import { NextResponse, after } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { hasReachedJobLimit } from "@/lib/plans"
import { jobFormErrors, jobPostError } from "@/lib/jobPost"
import { JOB_POST_DAYS } from "@/lib/jobLifecycle"
import { notifyJobOffer } from "@/lib/notifications"

// ==========================================
// 1. ШИНЭ АЖИЛ НЭМЭХ (POST)
// ==========================================
export async function POST(request: Request) {
  try {
    const session = await getSession()
    const userId = session?.userId
    const userRole = session?.role

    // 1. Хамгаалалт: Нэвтрээгүй эсвэл компани биш бол хандалтыг таслах
    if (!userId || userRole !== "company") {
      return NextResponse.json(
        { error: "Энэ үйлдлийг хийх эрх танд байхгүй байна." },
        { status: 403 }
      )
    }

    // 2. Формоос ирсэн датаг хүлээн авах (salaryType нэмэгдсэн)
    const body = await request.json()
    const { title, category, jobType, location, salary, salaryType, description, requirements } = body

    // 3. Талбаруудыг формтой ижил дүрмээр шалгана (заавал, урт, цалин, байршил)
    const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "")
    const fieldErrors = jobFormErrors({
      title: str(title), category: str(category), jobType: str(jobType), location: str(location),
      salary: str(salary), salaryType: str(salaryType), description: str(description), requirements: str(requirements),
    })
    const firstError = Object.values(fieldErrors)[0]
    if (firstError) {
      return NextResponse.json({ error: firstError, fieldErrors }, { status: 400 })
    }

    const inputError = jobPostError({ title, category, jobType, location, salary, salaryType, description, requirements })
    if (inputError) {
      return NextResponse.json({ error: inputError }, { status: 400 })
    }

    // 4. Зар нийтлэх эрх шалгах (нийтлэх бүрт 1 эрх хасагдана)
    const { reached, limit, expired } = await hasReachedJobLimit(userId)
    if (reached) {
      return NextResponse.json(
        {
          error: expired
            ? "Таны багцын хугацаа дууссан байна. Шинэ зар нийтлэхийн тулд багц худалдаж авна уу."
            : `Таны зар нийтлэх эрх (${limit}) дууссан байна. Шинэ багц худалдаж авна уу.`,
        },
        { status: 403 }
      )
    }

    // 5. ДАТАБЕЙС РҮҮ ХАДГАЛАХ ХЭСЭГ
    const { data, error } = await supabase
      .from("mt_openjob")
      .insert([
        {
          user_id: userId,
          title: title.trim(),
          category: category.trim(),
          job_type: jobType,
          location: location.trim(),
          salary,                    // Жишээ нь: "2500000" эсвэл "Тохиролцоно"
          salary_type: salaryType || "monthly", // 'monthly' эсвэл 'hourly'
          description: description.trim(),
          requirements: requirements.trim(),
          status: "active",
          // Нийтэлснээс хойш JOB_POST_DAYS хоног идэвхтэй (pg_cron дараа нь expired болгоно)
          expires_at: new Date(Date.now() + JOB_POST_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        }
      ])
      .select()

    if (error) {
      throw error
    }

    // Энэ ангиллын «Шинэ ажлын санал» авахаар тохируулсан ажил хайгчдад хариуны дараа имэйлээр мэдэгдэнэ
    const created = data?.[0]
    if (created) {
      after(() =>
        notifyJobOffer(request, {
          id: String(created.id),
          title: created.title,
          category: created.category,
          location: created.location,
          companyId: userId,
        })
      )
    }

    return NextResponse.json(
      { success: true, message: "Ажлын байр амжилттай зарлагдлаа.", data },
      { status: 201 }
    )

  } catch (error) {
    console.error("Жоб үүсгэхэд алдаа гарлаа:", error)
    return NextResponse.json(
      { error: "Серверт алдаа гарлаа. Дараа дахин оролдоно уу." },
      { status: 500 }
    )
  }
}

// ==========================================
// 2. АЖЛЫН ЖАГСААЛТ ТАТАХ (GET)
// ==========================================
export async function GET() {
  try {
    const session = await getSession()
    const userId = session?.userId
    const userRole = session?.role

    // Хамгаалалт: Эрхгүй бол буцаах
    if (!userId || userRole !== "company") {
      return NextResponse.json(
        { error: "Энэ мэдээллийг үзэх эрх танд байхгүй байна." },
        { status: 403 }
      )
    }

    // mt_openjob хүснэгтээс датагаа татах (Шинэ багана автоматаар * -оор орж ирнэ)
    const { data: jobs, error } = await supabase
      .from("mt_openjob")
      .select(`
        *,
        tr_job_request(count)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Ирсэн датаг форматлах
     
    const formattedJobs = jobs?.map((job) => ({
      ...job,
      applicants_count: job.tr_job_request?.[0]?.count || 0
    }))

    return NextResponse.json({ success: true, data: formattedJobs }, { status: 200 })

  } catch (error) {
    console.error("Жагсаалт татахад алдаа гарлаа:", error)
    return NextResponse.json(
      { error: "Серверт алдаа гарлаа." },
      { status: 500 }
    )
  }
}