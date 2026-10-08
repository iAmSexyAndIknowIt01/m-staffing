import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getContractCandidates } from "@/lib/contractServer"

export const revalidate = 0

// Гэрээ байгуулах боломжтой анкетууд: тэнцсэн (approved) бөгөөд амьд (draft/sent/active) гэрээгүй
export async function GET() {
  try {
    const session = await getSession()
    const companyId = session?.userId
    if (!companyId || session?.role !== "company") {
      return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })
    }

    const data = await getContractCandidates(companyId)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Contract Candidates Fetch Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}
