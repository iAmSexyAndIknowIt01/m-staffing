import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { applyMissingMessage, getApplyMissing } from "@/lib/staffCompletenessServer"

// Анкет илгээхийн өмнөх профайлын шалгалт. Профайл хуудастай ижил эх сурвалжаас
// (mt_staff, mt_profile, tr_staff_skill, туршлага, боловсрол) уншина.
// /api/jobRequest мөн ижил шалгалтыг серверт давтан хийнэ.
export async function GET() {
  try {
    const session = await getSession()
    const userId = session?.userId

    if (!userId || session.role !== "staff") {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай байна." }, { status: 401 })
    }

    const missing = await getApplyMissing(userId)
    if (missing.length > 0) {
      return NextResponse.json({ isComplete: false, missing, error: applyMissingMessage(missing) })
    }

    return NextResponse.json({ isComplete: true })
  } catch (error) {
    console.error("Profile Check Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}
