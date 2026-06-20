import { NextRequest, NextResponse }
  from "next/server"

import { supabase }
  from "@/lib/supabase"

export async function GET(
  request: NextRequest
) {

  const search =
    request.nextUrl.searchParams.get("q") || ""

  const type =
    request.nextUrl.searchParams.get("type")

  let query =
    supabase
      .from("mt_skill")
      .select(`
        skill_name,
        skill_type
      `)

  if (search) {
    query = query.ilike(
      "skill_name",
      `%${search}%`
    )
  }

  if (type) {
    query = query.eq(
      "skill_type",
      type
    )
  }

  const { data, error } =
    await query
      .order("skill_name")
      .limit(20)

  if (error) {
    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    )
  }

  return NextResponse.json(data)
}