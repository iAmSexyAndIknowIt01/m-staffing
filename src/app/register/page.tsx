"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function RegisterPage() {

  const router =
    useRouter()

  const [role, setRole] =
    useState<"staff" | "company">(
      "staff"
    )

  const [firstName, setFirstName] =
    useState("")

  const [lastName, setLastName] =
    useState("")

  const [companyName, setCompanyName] =
    useState("")

  const [email, setEmail] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  async function register() {

    if (
      !email ||
      !password
    ) {
      alert(
        "Бүх талбарыг бөглөнө үү"
      )
      return
    }

    if (
      role === "staff" &&
      (
        !firstName ||
        !lastName
      )
    ) {
      alert(
        "Овог нэрээ оруулна уу"
      )
      return
    }

    if (
      role === "company" &&
      !companyName
    ) {
      alert(
        "Компанийн нэр оруулна уу"
      )
      return
    }

    try {

      setLoading(true)

      const res =
        await fetch(
          "/api/auth/register",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({

                role,

                firstName,

                lastName,

                companyName,

                email,

                password,

              }),

          }
        )

      const data =
        await res.json()

      if (
        !res.ok
      ) {

        alert(
          data.message
        )

        return

      }

      alert(
        "Бүртгэл амжилттай"
      )

      router.push(
        "/login"
      )

    } catch {

      alert(
        "Алдаа гарлаа"
      )

    } finally {

      setLoading(false)

    }

  }

  return (

    <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">

      {/* BG */}

      <div
        className="
          absolute
          inset-0

          bg-gradient-to-b
          from-white
          via-[#fffaf6]
          to-white
        "
      />

      {/* GLOW */}

      <div
        className="
          absolute
          top-[10%]
          left-[10%]

          w-[700px]
          h-[700px]

          rounded-full

          bg-orange-300/10

          blur-[180px]
        "
      />

      {/* GRID */}

      <div
        className="
          absolute
          inset-0

          opacity-[0.5]

          bg-[linear-gradient(to_right,rgba(255,140,0,.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,140,0,.35)_1px,transparent_1px)]

          bg-[size:70px_70px]
        "
      />

      <Link
        href="/login"
        className="
          fixed
          top-8
          left-8

          z-20

          glass

          rounded-full

          px-6
          py-3

          transition

          hover:-translate-y-1
        "
      >
        ← Нэвтрэх
      </Link>

      <div
        className="
          relative
          z-10

          max-w-[1200px]
          w-full

          grid
          lg:grid-cols-2

          gap-10

          items-center
        "
      >

        {/* LEFT */}

        <div
          className="
            relative

            overflow-hidden

            rounded-[40px]

            min-h-[620px]

            flex
            flex-col
            justify-center

            p-14
          "
        >

          {/* GRID */}

          <div
            className="
              absolute
              inset-0

              opacity-[0.08]

              bg-[linear-gradient(to_right,rgba(255,140,0,.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,.06)_1px,transparent_1px)]

              bg-[size:56px_56px]
            "
          />

          {/* GLOW */}

          <div
            className="
              absolute

              -left-32
              top-1/2

              -translate-y-1/2

              w-[450px]
              h-[450px]

              rounded-full

              bg-orange-300/20

              blur-[140px]
            "
          />

          <div className="relative z-10">

            <p className="orange-text font-bold tracking-[6px]">
              MSTAFFING
            </p>

            <h1 className="mt-6 text-5xl md:text-7xl font-black leading-[1.05]">

              {
                role === "staff"
                  ? "Шинэ боломж."
                  : "Шинэ ажилтан."
              }

            </h1>

            <p className="mt-8 text-gray-500 text-xl leading-9">

              {
                role === "staff"
                  ? "Хэдхэн алхмаар бүртгүүлээд ажил хайж эхлээрэй."
                  : "Компаниа бүртгүүлээд ажилтан хайж эхлээрэй."
              }

            </p>

          </div>

        </div>

        {/* RIGHT */}

        <div className="glass rounded-[40px] p-10">

          <div className="bg-orange-50 rounded-full p-2 flex">

            <button
              type="button"
              onClick={() =>
                setRole("staff")
              }
              className={`flex-1 rounded-full py-3 transition ${
                role === "staff"
                  ? "bg-orange-500 text-white"
                  : ""
              }`}
            >
              Ажил Хайгч
            </button>

            <button
              type="button"
              onClick={() =>
                setRole("company")
              }
              className={`flex-1 rounded-full py-3 transition ${
                role === "company"
                  ? "bg-orange-500 text-white"
                  : ""
              }`}
            >
              Ажил Олгогч
            </button>

          </div>

          <h2 className="text-3xl font-black mt-10">
            Бүртгүүлэх
          </h2>

          {
            role === "staff"

            ? (

              <div className="mt-8 grid grid-cols-2 gap-4">

                <div>

                  <label>Овог</label>

                  <input
                    value={lastName}
                    onChange={(e)=>
                      setLastName(
                        e.target.value
                      )
                    }
                    className="mt-3 w-full rounded-2xl border border-orange-100 px-5 py-4"
                  />

                </div>

                <div>

                  <label>Нэр</label>

                  <input
                    value={firstName}
                    onChange={(e)=>
                      setFirstName(
                        e.target.value
                      )
                    }
                    className="mt-3 w-full rounded-2xl border border-orange-100 px-5 py-4"
                  />

                </div>

              </div>

            )

            :

            (

              <div className="mt-8">

                <label>
                  Компанийн нэр
                </label>

                <input
                  value={companyName}
                  onChange={(e)=>
                    setCompanyName(
                      e.target.value
                    )
                  }
                  className="mt-3 w-full rounded-2xl border border-orange-100 px-5 py-4"
                />

              </div>

            )
          }

          <div className="mt-6">

            <label>Имэйл</label>

            <input
              type="email"
              value={email}
              onChange={(e)=>
                setEmail(
                  e.target.value
                )
              }
              className="mt-3 w-full rounded-2xl border border-orange-100 px-5 py-4"
            />

          </div>

          <div className="mt-6">

            <label>
              Нууц үг
            </label>

            <input
              type="password"
              value={password}
              onChange={(e)=>
                setPassword(
                  e.target.value
                )
              }
              className="mt-3 w-full rounded-2xl border border-orange-100 px-5 py-4"
            />

          </div>

          <button
            onClick={register}
            disabled={loading}
            className="
              orange-btn
              w-full
              mt-10
            "
          >

            {
              loading
                ? "Түр хүлээнэ үү..."
                : "Бүртгүүлэх"
            }

          </button>

          <p className="mt-8 text-center text-gray-500">

            Бүртгэлтэй юу?

            <Link
              href="/login"
              className="orange-text ml-2"
            >
              Нэвтрэх
            </Link>

          </p>

        </div>

      </div>

    </main>

  )

}