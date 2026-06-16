import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

// GET PROFILE
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
    // 1. STAFF NAME
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
    // 2. PROFILE DATA
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
          education,
          availability
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

    const {
      data: skillData,
      error: skillError,
    } = await supabase
      .from("tr_staff_skill")
      .select(`
        skill_id,
        mt_skill (
          skill_name,
          skill_type
        )
      `)
      .eq(
        "staff_id",
        userId
      )
    if (skillError) {
      throw skillError
    }
    const technicalSkills =
      skillData
        ?.filter(
          (row: any) =>
            row.mt_skill?.skill_type ===
            "technical"
        )
        .map(
          (row: any) =>
            row.mt_skill.skill_name
        ) || []
    const languageSkills =
      skillData
        ?.filter(
          (row: any) =>
            row.mt_skill?.skill_type ===
            "language"
        )
        .map(
          (row: any) =>
            row.mt_skill.skill_name
        ) || []
    // MERGE DATA
    const profile = {
      full_name:
        `${staffData?.last_name || ""} ${staffData?.first_name || ""}`.trim(),
      email:
        profileData?.email || "",
      phone:
        profileData?.phone || "",
      bio:
        profileData?.bio || "",
      skills: {
        technical:
          technicalSkills,
        languages:
          languageSkills,
      },
      experience:
        profileData?.experience || "",
      education:
        profileData?.education || "",
      availability:
        profileData?.availability || {},
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
      availability,
    } =
      body
        // VALIDATION
        if (!fullName?.trim()) {
          return NextResponse.json(
            {
              error:
                "Бүтэн нэр заавал бөглөнө.",
            },
            {
              status: 400,
            }
          )
        }
        if (fullName.length > 100) {
          return NextResponse.json(
            {
              error:
                "Нэр хамгийн ихдээ 100 тэмдэгт байна.",
            },
            {
              status: 400,
            }
          )
        }
        if (!email?.trim()) {
          return NextResponse.json(
            {
              error:
                "Имэйл заавал бөглөнө.",
            },
            {
              status: 400,
            }
          )

        }
        const emailRegex =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          return NextResponse.json(
            {
              error:
                "Имэйл формат буруу байна.",
            },
            {
              status: 400,
            }
          )
        }
        if (!phone?.trim()) {
          return NextResponse.json(
            {
              error:
                "Утасны дугаар заавал бөглөнө.",
            },
            {
              status: 400,
            }
          )
        }
        if (!bio?.trim()) {
          return NextResponse.json(
            {
              error:
                "Bio бөглөнө үү.",
            },
            {
              status: 400,
            }
          )
        }
        if (bio.length > 1000) {
          return NextResponse.json(
            {
              error:
                "Bio хамгийн ихдээ 1000 тэмдэгт байна.",
            },
            {
              status: 400,
            }
          )
        }
        if (
          !skills ||
          (
            skills.technical?.length === 0 &&
            skills.languages?.length === 0
          )
        ) {
          return NextResponse.json(
            {
              error: "Ур чадвараа оруулна уу."
            },
            {
              status: 400
            }
          )
        }
        if (!experience?.trim()) {
          return NextResponse.json(
            {
              error:
                "Туршлагаа оруулна уу.",
            },
            {
              status: 400,
            }
          )
        }
        if (experience.length > 3000) {
          return NextResponse.json(
            {
              error:
                "Туршлага хэт урт байна.",
            },
            {
              status: 400,
            }
          )
        }
        if (!education?.trim()) {
          return NextResponse.json(
            {
              error:
                "Боловсролоо оруулна уу.",
            },
            {
              status: 400,
            }
          )
        }
        if (education.length > 2000) {
          return NextResponse.json(
            {
              error:
                "Боловсролын мэдээлэл хэт урт байна.",
            },
            {
              status: 400,
            }
          )
        }
        // AVAILABILITY VALIDATION
        const enabledDays =
          Object.entries(
            availability || {}
          ).filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ([, value]: any) =>
              value.enabled
          )
        if (
          enabledDays.length === 0
        ) {
          return NextResponse.json(
            {
              error:
                "Дор хаяж нэг ажиллах өдөр сонгоно уу.",
            },
            {
              status: 400,
            }
          )
        }
        for (
          const [dayName, day]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          of enabledDays as any[]
        ) {
          if (
            !day.from ||
            !day.to
          ) {
            return NextResponse.json(
              {
                error:
                  `${dayName} гарагийн ажиллах цаг дутуу байна.`,
              },
              {
                status: 400,
              }
            )
          }
          if (
            day.from >= day.to
          ) {
            return NextResponse.json(
              {
                error:
                  `${dayName} гарагийн эхлэх цаг дуусах цагаас бага байх ёстой.`,
              },
              {
                status: 400,
              }
            )
          }
        }
    // UPDATE STAFF NAME
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
          availability,
          updated_at:
            new Date()
              .toISOString(),
        })
        .eq("user_id", userId)
        .select()
    if (error) {
      throw error
    }

    const selectedSkills = [
      ...(skills.technical || []),
      ...(skills.languages || []),
    ]

    const {
      data: skillMaster,
      error: skillError,
    } = await supabase
      .from("mt_skill")
      .select(`
        id,
        skill_name
      `)
      .in(
        "skill_name",
        selectedSkills
      )
    if (skillError) {
      throw skillError
    }

    const {
      error: deleteError,
    } = await supabase
      .from("tr_staff_skill")
      .delete()
      .eq(
        "staff_id",
        userId
      )

    if (deleteError) {
      throw deleteError
    }

    if (
      skillMaster &&
      skillMaster.length > 0
    ) {

      const insertRows =
        skillMaster.map(skill => ({
          staff_id: userId,
          skill_id: skill.id,
        }))

      const {
        error: insertError,
      } = await supabase
        .from("tr_staff_skill")
        .insert(insertRows)

      if (insertError) {
        throw insertError
      }
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