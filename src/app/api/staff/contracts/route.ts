import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { STAFF_VISIBLE_STATUSES } from "@/lib/contracts"
import { CONTRACT_LIST_COLUMNS, expireContracts, normalizeContract } from "@/lib/contractServer"

export const revalidate = 0

// Ажилтанд ирсэн гэрээнүүд (ноорог болон илгээгдэхээс өмнө цуцалсан гэрээ харагдахгүй)
export async function GET() {
  try {
    const session = await getSession()
    const userId = session?.userId
    if (!userId || session?.role !== "staff") {
      return NextResponse.json({ error: "Хандах эрхгүй байна." }, { status: 403 })
    }

    await expireContracts({ column: "staff_id", id: userId })

    const { data, error } = await supabase
      .from("tr_contract")
      .select(`${CONTRACT_LIST_COLUMNS}, sent_at`)
      .eq("staff_id", userId)
      .in("status", STAFF_VISIBLE_STATUSES)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: (data || []).map(normalizeContract) })
  } catch (error) {
    console.error("Staff Contracts Fetch Error:", error)
    return NextResponse.json({ error: "Серверийн алдаа гарлаа." }, { status: 500 })
  }
}
