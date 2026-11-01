import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

// Нийтийн хуудсууд (landing) нэвтэрсэн эсэх, бүртгэлийн төрлийг мэдэхэд ашиглана — хувийн мэдээлэл буцаахгүй
export async function GET() {
  const session = await getSession()
  return NextResponse.json(
    { role: session?.role === "staff" || session?.role === "company" ? session.role : null },
    { headers: { "Cache-Control": "private, no-store" } }
  )
}
