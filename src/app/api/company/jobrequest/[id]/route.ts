import { NextResponse, NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { getJobApplicants } from "@/lib/companyJobs"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: jobId } = await params

    if (!jobId) {
      return NextResponse.json({ error: "Ажлын байрны ID олдсонгүй" }, { status: 400 })
    }

    const session = await getSession()
    const companyId = session?.userId
    const userRole = session?.role

    if (!companyId || userRole !== "company") {
      return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 401 })
    }

    const { data, jobTitle } = await getJobApplicants(jobId, companyId)

    return NextResponse.json({ data, jobTitle })
  } catch (error) {
    console.error("Get Applicants Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}
