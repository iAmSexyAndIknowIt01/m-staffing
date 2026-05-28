import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

// ========================================
// GET PROFILE
// ========================================

export async function GET() {

  try {

    const cookieStore =
      await cookies()

    const userId =
      cookieStore
        .get("user_id")
        ?.value

    const userRole =
      cookieStore
        .get("user_role")
        ?.value

    if (
      !userId ||
      userRole !== "staff"
    ) {

      return NextResponse.json(
        {
          error:
            "Хандах эрхгүй байна.",
        },
        {
          status: 403,
        }
      )

    }

    // ========================================
    // 1. STAFF NAME
    // ========================================

    const {
      data: staffData,
      error: staffError,
    } =
      await supabase
        .from("mt_staff")
        .select(`
          first_name,
          last_name
        `)
        .eq(
          "id",
          userId
        )
        .single()

    if (staffError) {

      throw staffError

    }

    // ========================================
    // 2. PROFILE DATA
    // ========================================

    const {
      data: profileData,
      error: profileError,
    } =
      await supabase
        .from("mt_profile")
        .select(`
          user_id,
          email,
          phone,
          bio,
          skills,
          experience,
          education
        `)
        .eq(
          "user_id",
          userId
        )
        .maybeSingle()

    if (
      profileError &&
      profileError.code !== "PGRST116"
    ) {

      throw profileError

    }

    // ========================================
    // MERGE DATA
    // ========================================

    const profile = {

      full_name:
        `${staffData?.last_name || ""} ${staffData?.first_name || ""}`.trim(),

      email:
        profileData?.email || "",

      phone:
        profileData?.phone || "",

      bio:
        profileData?.bio || "",

      skills:
        profileData?.skills || "",

      experience:
        profileData?.experience || "",

      education:
        profileData?.education || "",

    }

    return NextResponse.json(
      {
        success: true,
        profile,
      }
    )

  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {

    console.error(
      "GET PROFILE ERROR:",
      error
    )

    return NextResponse.json(
      {
        error:
          error.message ||
          "Серверийн алдаа",
      },
      {
        status: 500,
      }
    )

  }

}

// ========================================
// SAVE PROFILE
// ========================================

export async function POST(
  request: Request
) {

  try {

    const cookieStore =
      await cookies()

    const userId =
      cookieStore
        .get("user_id")
        ?.value

    const userRole =
      cookieStore
        .get("user_role")
        ?.value

    if (
      !userId ||
      userRole !== "staff"
    ) {

      return NextResponse.json(
        {
          error:
            "Хандах эрхгүй байна.",
        },
        {
          status: 403,
        }
      )

    }

    const body =
      await request.json()

    const {

      fullName,

      email,

      phone,

      bio,

      skills,

      experience,

      education,

    } =
      body

    // ========================================
    // UPDATE STAFF NAME
    // ========================================

    const splittedName =
      fullName
        ?.trim()
        .split(" ") || []

    const first_name =
      splittedName.slice(1).join(" ")

    const last_name =
      splittedName[0] || ""

    const {
      error: staffUpdateError,
    } =
      await supabase
        .from("mt_staff")
        .update({

          first_name,

          last_name,

        })
        .eq(
          "id",
          userId
        )

    if (staffUpdateError) {

      throw staffUpdateError

    }
    
    
      const {
      data,
      error,
    } =
      await supabase
        .from("mt_profile")
        .update({

          email,

          phone,

          bio,

          skills,

          experience,

          education,

          updated_at:
            new Date()
              .toISOString(),

        })
        .eq("user_id", userId)
        .select()

    if (error) {

      throw error

    }

    return NextResponse.json({

      success: true,

      message:
        "Профайл хадгалагдлаа.",

      data,

    })

  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {

    console.error(
      "SAVE PROFILE ERROR:",
      error
    )

    return NextResponse.json(
      {
        error:
          error.message ||
          "Серверийн алдаа",
      },
      {
        status: 500,
      }
    )

  }

}