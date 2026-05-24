import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json()

    const {

      role,

      firstName,

      lastName,

      companyName,

      email,

      password,

    } =
      body

    if (
      !role ||
      !email ||
      !password
    ) {

      return NextResponse.json(
        {
          message:
            "Мэдээлэл дутуу байна",
        },
        {
          status: 400,
        }
      )

    }

    if (
      role === "staff" &&
      (
        !firstName ||
        !lastName
      )
    ) {

      return NextResponse.json(
        {
          message:
            "Овог нэр шаардлагатай",
        },
        {
          status: 400,
        }
      )

    }

    if (
      role === "company" &&
      !companyName
    ) {

      return NextResponse.json(
        {
          message:
            "Компанийн нэр шаардлагатай",
        },
        {
          status: 400,
        }
      )

    }

    const {
      data,
      error,
    } =
      await supabase
        .auth
        .signUp({

          email,

          password,

          options: {

            data: {

              role,

              first_name:
                firstName,

              last_name:
                lastName,

              company_name:
                companyName,

            },

          },

        })

    if (
      error
    ) {

      return NextResponse.json(
        {
          message:
            error.message,
        },
        {
          status: 400,
        }
      )

    }

    const user =
      data.user

    if (
      !user
    ) {

      return NextResponse.json(
        {
          message:
            "Хэрэглэгч үүссэнгүй",
        },
        {
          status: 500,
        }
      )

    }

    if (
      role === "staff"
    ) {

      const {
        error:
          insertError,
      } =
        await supabase
          .from(
            "mt_staff"
          )
          .insert({

            id:
              user.id,

            first_name:
              firstName,

            last_name:
              lastName,

            email,

          })

      if (
        insertError
      ) {

        return NextResponse.json(
          {
            message:
              insertError.message,
          },
          {
            status: 500,
          }
        )

      }

    }

    if (
      role === "company"
    ) {

      const {
        error:
          insertError,
      } =
        await supabase
          .from(
            "mt_company"
          )
          .insert({

            id:
              user.id,

            company_name:
              companyName,

            email,

          })

      if (
        insertError
      ) {

        return NextResponse.json(
          {
            message:
              insertError.message,
          },
          {
            status: 500,
          }
        )

      }

    }

    return NextResponse.json({

      success:
        true,

      redirect:
        "/login",

    })

  }

  catch (
    err
  ) {

    console.log(
      err
    )

    return NextResponse.json(
      {
        message:
          "Системийн алдаа",
      },
      {
        status: 500,
      }
    )

  }

}