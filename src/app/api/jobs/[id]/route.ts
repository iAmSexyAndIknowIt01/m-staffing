import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { chargeJobCredit, getEffectiveSubscription } from "@/lib/plans"
import { jobFormErrors, jobPostError } from "@/lib/jobPost"
import { isJobStatus, planStatusChange } from "@/lib/jobLifecycle"

// ==========================================
// 1. СҮДЭРЛЭХ / ХАРАХ ХЭСЭГ (GET)
// ==========================================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    const userId = session?.userId
    const userRole = session?.role

    // Хамгаалалт: Нэвтрээгүй эсвэл компани биш бол хандалтыг таслах
    if (!userId || userRole !== "company") {
      return NextResponse.json(
        { error: "Энэ мэдээллийг үзэх эрх танд байхгүй байна." },
        { status: 403 }
      )
    }

    // mt_openjob хүснэгтээс тухайн ID болон хэрэглэгчийн өөрийнх нь ажлыг шүүж татах
    const { data: job, error } = await supabase
      .from("mt_openjob")
      .select("*") // Энд * байгаа тул шинээр нэмсэн salary_type автоматаар ирнэ
      .eq("id", id)
      .eq("user_id", userId) // Өөр компанийн зар харах эрсдэлээс сэргийлнэ
      .single() // Ганцхан дата ирэх ёстойг заана

    if (error) {
      throw error
    }

    if (!job) {
      return NextResponse.json(
        { error: "Ажлын байр олдсонгүй." },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: job }, { status: 200 })

   
  } catch (error) {
    console.error("Ажлын мэдээлэл татахад алдаа гарлаа:", error)
    return NextResponse.json(
      { error: "Серверт алдаа гарлаа." },
      { status: 500 }
    )
  }
}

// ==========================================
// 2. ӨӨРЧЛӨЛТИЙГ ХАДГАЛАХ ХЭСЭГ (PUT)
// ==========================================
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    const userId = session?.userId
    const userRole = session?.role

    // Хамгаалалт: Эрх шалгах
    if (!userId || userRole !== "company") {
      return NextResponse.json(
        { error: "Энэ үйлдлийг хийх эрх танд байхгүй байна." },
        { status: 403 }
      )
    }

    const body = await request.json()
    // Формоос salary_type болон salaryType-ийн аль алинаар ирж болохыг тооцов
    const { title, category, salary, salaryType, salary_type, status, jobType, location, description, requirements, confirmCredit } = body

    // Баталгаажуулалт — шинэ зар нэмэхтэй ижил дүрэм (хуучин зарын ангиллыг хэвээр зөвшөөрнө)
    const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "")
    const fieldErrors = jobFormErrors({
      title: str(title), category: str(category), jobType: str(jobType), location: str(location),
      salary: str(salary), salaryType: str(salary_type || salaryType), description: str(description), requirements: str(requirements),
    })
    const firstError = Object.values(fieldErrors)[0]
    if (firstError) {
      return NextResponse.json({ error: firstError, fieldErrors }, { status: 400 })
    }

    if (status !== undefined && !isJobStatus(status)) {
      return NextResponse.json({ error: "Төлөв буруу байна." }, { status: 400 })
    }

    const inputError = jobPostError({
      title, category, jobType, location, salary, description, requirements,
      salaryType: salary_type || salaryType || undefined,
    })
    if (inputError) {
      return NextResponse.json({ error: inputError }, { status: 400 })
    }

    const { data: current, error: currentError } = await supabase
      .from("mt_openjob")
      .select("status, expires_at, paused_remaining_seconds")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle()

    if (currentError) throw currentError
    if (!current) {
      return NextResponse.json({ error: "Ажлын байр олдсонгүй." }, { status: 404 })
    }

    // Төлөвийн шилжилт: хугацааг тооцож, хаагдсан/хугацаа дууссан зарыг дахин нээхэд 1 эрх хасна
    const plan = planStatusChange(current, status ?? current.status)
    if ("error" in plan) {
      return NextResponse.json({ error: plan.error }, { status: 400 })
    }

    if (plan.chargesCredit) {
      // Хэрэглэгч эрх хасагдахыг зөвшөөрөөгүй бол хадгалахгүй — клиент баталгаажуулах цонх харуулна
      if (confirmCredit !== true) {
        const sub = await getEffectiveSubscription(userId)
        return NextResponse.json(
          {
            error: "Зарыг дахин нээхэд 1 нийтлэх эрх хасагдана.",
            requiresCredit: true,
            remaining: sub.status === "expired" ? 0 : sub.remaining,
          },
          { status: 409 }
        )
      }
      const creditError = await chargeJobCredit(userId, id, "reopen")
      if (creditError) return NextResponse.json({ error: creditError }, { status: 403 })
    } else if (plan.update.status === "active" && current.status !== "active") {
      // Түр ноорог болгосон зарыг үргэлжлүүлэхэд эрх хасагдахгүй, гэхдээ багц хүчинтэй байх ёстой
      const sub = await getEffectiveSubscription(userId)
      if (sub.status === "expired") {
        return NextResponse.json(
          { error: "Таны багцын хугацаа дууссан байна. Зарыг идэвхжүүлэхийн тулд багц худалдаж авна уу." },
          { status: 403 }
        )
      }
    }

    // Баазад байгаа датаг шинэчлэх
    const { data, error } = await supabase
      .from("mt_openjob")
      .update({
        title,
        category,
        job_type: jobType,
        location,
        salary,
        salary_type: salary_type || salaryType || "monthly", // Сонгосон цалингийн төрлийг хадгалах
        description,
        requirements,
        ...plan.update,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json(
      { success: true, message: "Ажлын байр амжилттай шинэчлэгдлээ.", data },
      { status: 200 }
    )

   
  } catch (error) {
    console.error("Жоб шинэчлэхэд алдаа гарлаа:", error)
    return NextResponse.json(
      { error: "Серверт алдаа гарлаа." },
      { status: 500 }
    )
  }
}