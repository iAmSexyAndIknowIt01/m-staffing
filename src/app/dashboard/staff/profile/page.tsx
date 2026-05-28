"use client"

import { useEffect, useState } from "react"

export default function StaffProfilePage() {

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [message, setMessage] =
    useState<string | null>(null)

  // ========================================
  // FORM STATE
  // ========================================

  const [fullName, setFullName] =
    useState("")

  const [email, setEmail] =
    useState("")

  const [phone, setPhone] =
    useState("")

  const [bio, setBio] =
    useState("")

  const [skills, setSkills] =
    useState("")

  const [experience, setExperience] =
    useState("")

  const [education, setEducation] =
    useState("")

  // ========================================
  // FETCH PROFILE
  // ========================================

  async function fetchProfile() {

    try {

      setLoading(true)

      const response =
        await fetch(
          "/api/staff/profile"
        )

      const result =
        await response.json()

      if (!response.ok) {

        throw new Error(
          result.error
        )

      }

      if (result.profile) {

        setFullName(
          result.profile.full_name || ""
        )

        setEmail(
          result.profile.email || ""
        )

        setPhone(
          result.profile.phone || ""
        )

        setBio(
          result.profile.bio || ""
        )

        setSkills(
          result.profile.skills || ""
        )

        setExperience(
          result.profile.experience || ""
        )

        setEducation(
          result.profile.education || ""
        )

      }

    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (err: any) {

      setError(
        err.message
      )

    }
    finally {

      setLoading(false)

    }

  }

  // ========================================
  // FIRST LOAD
  // ========================================

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile()

  }, [])

  // ========================================
  // SAVE PROFILE
  // ========================================

  async function handleSave(
    e: React.FormEvent
  ) {

    e.preventDefault()

    try {

      setSaving(true)

      setError(null)

      setMessage(null)

      const response =
        await fetch(
          "/api/staff/profile",
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              email,

              phone,

              bio,

              skills,

              experience,

              education,

            }),

          }
        )

      const result =
        await response.json()

      if (!response.ok) {

        throw new Error(
          result.error
        )

      }

      // ========================================
      // RELOAD PROFILE AFTER SAVE
      // ========================================

      await fetchProfile()

      setMessage(
        "Профайл амжилттай хадгалагдлаа 🎉"
      )

      setTimeout(() => {

        setMessage(null)

      }, 4000)

    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (err: any) {

      setError(
        err.message
      )

    }
    finally {

      setSaving(false)

    }

  }

  // ========================================
  // LOADING
  // ========================================

  if (loading) {

    return (

      <div
        className="
          flex
          items-center
          justify-center
          min-h-[400px]
        "
      >

        <div
          className="
            h-10
            w-10
            border-b-2
            border-indigo-600
            rounded-full
            animate-spin
          "
        />

      </div>

    )

  }

  // ========================================
  // UI
  // ========================================

  return (

    <div
      className="
        max-w-5xl
        mx-auto
        space-y-8
        pb-12
      "
    >

      {/* HEADER */}

      <div>

        <h1
          className="
            text-3xl
            font-black
            text-gray-900
          "
        >
          Миний CV / Профайл
        </h1>

        <p
          className="
            text-sm
            text-gray-400
            mt-1
          "
        >
          Ажил олгогчдод харагдах таны мэдээлэл
        </p>

      </div>

      {/* ALERT */}

      {message && (

        <div
          className="
            bg-emerald-50
            border
            border-emerald-100
            text-emerald-700
            p-4
            rounded-2xl
            text-sm
          "
        >
          {message}
        </div>

      )}

      {error && (

        <div
          className="
            bg-red-50
            border
            border-red-100
            text-red-600
            p-4
            rounded-2xl
            text-sm
          "
        >
          ⚠️ {error}
        </div>

      )}

      {/* FORM */}

      <form
        onSubmit={handleSave}
        className="
          grid
          grid-cols-1
          lg:grid-cols-3
          gap-8
        "
      >

        {/* LEFT */}

        <div
          className="
            lg:col-span-1
            bg-white
            p-6
            rounded-3xl
            border
            border-gray-100
            shadow-sm
            space-y-6
          "
        >

          <div
            className="
              flex
              flex-col
              items-center
              text-center
              pb-4
              border-b
              border-gray-50
            "
          >

            <div
              className="
                w-20
                h-20
                bg-indigo-50
                text-indigo-600
                rounded-2xl
                flex
                items-center
                justify-center
                text-3xl
                font-black
                mb-3
              "
            >
              {fullName
                ? fullName.charAt(0)
                : "👤"}
            </div>

            <h3
              className="
                font-bold
                text-gray-800
                text-lg
              "
            >
              {fullName || "Таны нэр"}
            </h3>

            <p
              className="
                text-xs
                text-gray-400
              "
            >
              Ажил хайгч ажилтан
            </p>

          </div>

          {/* FULL NAME */}

          <div>

            <label
              className="
                text-xs
                font-bold
                text-gray-400
                uppercase
                block
                mb-1
              "
            >
              Бүтэн нэр
            </label>

            <input
              type="text"
              value={fullName}
              disabled
              className="
                w-full
                px-4
                py-3
                bg-gray-100
                rounded-2xl
                text-sm
                outline-none
              "
            />

          </div>

          {/* PHONE */}

          <div>

            <label
              className="
                text-xs
                font-bold
                text-gray-400
                uppercase
                block
                mb-1
              "
            >
              Утас
            </label>

            <input
              type="text"
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                )
              }
              className="
                w-full
                px-4
                py-3
                bg-gray-50
                rounded-2xl
                text-sm
              "
            />

          </div>

          {/* EMAIL */}

          <div>

            <label
              className="
                text-xs
                font-bold
                text-gray-400
                uppercase
                block
                mb-1
              "
            >
              Имэйл
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="
                w-full
                px-4
                py-3
                bg-gray-50
                rounded-2xl
                text-sm
              "
            />

          </div>

        </div>

        {/* RIGHT */}

        <div
          className="
            lg:col-span-2
            bg-white
            p-6
            rounded-3xl
            border
            border-gray-100
            shadow-sm
            space-y-6
          "
        >

          {/* BIO */}

          <div>

            <label className="text-sm font-bold">
              🚀 Bio
            </label>

            <textarea
              rows={3}
              value={bio}
              onChange={(e) =>
                setBio(
                  e.target.value
                )
              }
              className="
                mt-2
                w-full
                px-4
                py-3
                bg-gray-50
                rounded-2xl
                text-sm
              "
            />

          </div>

          {/* SKILLS */}

          <div>

            <label className="text-sm font-bold">
              🛠️ Ур чадвар
            </label>

            <input
              type="text"
              value={skills}
              onChange={(e) =>
                setSkills(
                  e.target.value
                )
              }
              className="
                mt-2
                w-full
                px-4
                py-3
                bg-gray-50
                rounded-2xl
                text-sm
              "
            />

          </div>

          {/* EXPERIENCE */}

          <div>

            <label className="text-sm font-bold">
              💼 Туршлага
            </label>

            <textarea
              rows={4}
              value={experience}
              onChange={(e) =>
                setExperience(
                  e.target.value
                )
              }
              className="
                mt-2
                w-full
                px-4
                py-3
                bg-gray-50
                rounded-2xl
                text-sm
              "
            />

          </div>

          {/* EDUCATION */}

          <div>

            <label className="text-sm font-bold">
              🎓 Боловсрол
            </label>

            <textarea
              rows={3}
              value={education}
              onChange={(e) =>
                setEducation(
                  e.target.value
                )
              }
              className="
                mt-2
                w-full
                px-4
                py-3
                bg-gray-50
                rounded-2xl
                text-sm
              "
            />

          </div>

          {/* SAVE BUTTON */}

          <div
            className="
              flex
              justify-end
              pt-4
              border-t
              border-gray-100
            "
          >

            <button
              type="submit"
              disabled={saving}
              className="
                px-8
                py-3
                bg-indigo-600
                hover:bg-indigo-700
                disabled:bg-indigo-400
                text-white
                rounded-2xl
                text-sm
                font-bold
                transition
              "
            >
              {
                saving
                  ? "Хадгалж байна..."
                  : "Профайл хадгалах ✨"
              }
            </button>

          </div>

        </div>

      </form>

    </div>

  )

}