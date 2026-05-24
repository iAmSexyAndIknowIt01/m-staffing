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

      setLoading(
        true
      )

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

      setLoading(
        false
      )

    }

  }

  return (

    <main className="min-h-screen flex items-center justify-center px-6">

      <Link
        href="/login"
        className="
          fixed
          top-8
          left-8
          glass
          rounded-full
          px-6
          py-3
        "
      >
        ← Нэвтрэх
      </Link>

      <div
        className="
          max-w-[1200px]
          w-full
          grid
          lg:grid-cols-2
          gap-10
          items-center
        "
      >

        {/* LEFT */}

        <div className="py-20">

          <p className="orange-text font-bold tracking-[6px]">
            MSTAFFING
          </p>

          <h1 className="mt-6 text-5xl md:text-7xl font-black">

            {
              role === "staff"
                ? "Шинэ боломж."
                : "Шинэ ажилтан."
            }

          </h1>

          <p className="mt-8 text-gray-500 text-xl">

            {
              role === "staff"
                ? "Хэдхэн алхмаар бүртгүүлээд ажил хайж эхлээрэй."
                : "Компаниа бүртгүүлээд ажилтан хайж эхлээрэй."
            }

          </p>

        </div>

        {/* RIGHT */}

        <div className="glass rounded-[40px] p-10">

          <div className="bg-orange-50 rounded-full p-2 flex">

            <button
              type="button"
              onClick={() =>
                setRole(
                  "staff"
                )
              }
              className={`flex-1 rounded-full py-3 ${
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
                setRole(
                  "company"
                )
              }
              className={`flex-1 rounded-full py-3 ${
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

            role ===
            "staff"

            ? (

              <>

                <div className="mt-8 grid grid-cols-2 gap-4">

                  <div>

                    <label>
                      Овог
                    </label>

                    <input
                      value={
                        lastName
                      }
                      onChange={
                        (
                          e
                        ) =>
                          setLastName(
                            e.target.value
                          )
                      }
                      className="mt-3 w-full rounded-2xl border border-orange-100 px-5 py-4"
                    />

                  </div>

                  <div>

                    <label>
                      Нэр
                    </label>

                    <input
                      value={
                        firstName
                      }
                      onChange={
                        (
                          e
                        ) =>
                          setFirstName(
                            e.target.value
                          )
                      }
                      className="mt-3 w-full rounded-2xl border border-orange-100 px-5 py-4"
                    />

                  </div>

                </div>

              </>

            )

            :

            (

              <div className="mt-8">

                <label>
                  Компанийн нэр
                </label>

                <input
                  value={
                    companyName
                  }
                  onChange={
                    (
                      e
                    ) =>
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

            <label>
              Имэйл
            </label>

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
            onClick={
              register
            }
            disabled={
              loading
            }
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