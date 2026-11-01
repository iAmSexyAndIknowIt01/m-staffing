import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { chargeJobCredit } from "@/lib/plans"
import { planRenewal } from "@/lib/jobLifecycle"

// «Сунгах» (идэвхтэй зар +30 хоног) эсвэл «Дахин нээх» (хаагдсан/хугацаа дууссан зар).
// Аль аль нь 1 нийтлэх эрх хасна — клиент үүнийг хэрэглэгчээр баталгаажуулсны дараа дуудна.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    const userId = session?.userId
    if (!userId || session.role !== "company") {
      return NextResponse.json({ error: "Энэ үйлдлийг хийх эрх танд байхгүй байна." }, { status: 403 })
    }

    const { data: job, error: jobError } = await supabase
      .from("mt_openjob")
      .select("status, expires_at, paused_remaining_seconds")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle()

    if (jobError) throw jobError
    if (!job) return NextResponse.json({ error: "Ажлын байр олдсонгүй." }, { status: 404 })

    const plan = planRenewal(job)
    if ("error" in plan) return NextResponse.json({ error: plan.error }, { status: 400 })

    const creditError = await chargeJobCredit(userId, id, job.status === "active" ? "extend" : "reopen")
    if (creditError) return NextResponse.json({ error: creditError }, { status: 403 })

    const { data, error } = await supabase
      .from("mt_openjob")
      .update(plan.update)
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, status, expires_at")
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("JOB_RENEW_ERROR:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}
