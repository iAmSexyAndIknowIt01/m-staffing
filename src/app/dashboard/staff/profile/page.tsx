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

  const [isEditMode, setIsEditMode] =
    useState(false)

  const [validationErrors, setValidationErrors] =
    useState<Record<string, string>>({})

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
  
  const [availability, setAvailability] =
    useState({
      monday: { enabled: false, from: "", to: "" },
      tuesday: { enabled: false, from: "", to: "" },
      wednesday: { enabled: false, from: "", to: "" },
      thursday: { enabled: false, from: "", to: "" },
      friday: { enabled: false, from: "", to: "" },
      saturday: { enabled: false, from: "", to: "" },
      sunday: { enabled: false, from: "", to: "" },
    })

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

        setAvailability(
          result.profile.availability || {
            monday: { enabled: false, from: "", to: "" },
            tuesday: { enabled: false, from: "", to: "" },
            wednesday: { enabled: false, from: "", to: "" },
            thursday: { enabled: false, from: "", to: "" },
            friday: { enabled: false, from: "", to: "" },
            saturday: { enabled: false, from: "", to: "" },
            sunday: { enabled: false, from: "", to: "" },
          }
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

  function validateForm() {

    const errors: Record<string, string> = {}

    if (!fullName.trim()) {
      errors.fullName =
        "Бүтэн нэрээ оруулна уу"
    }

    if (!email.trim()) {

      errors.email =
        "Имэйлээ оруулна уу"

    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {

      errors.email =
        "Имэйл хаяг буруу байна"

    }

    if (!phone.trim()) {
      errors.phone =
        "Утасны дугаараа оруулна уу"
    }

    if (!bio.trim()) {
      errors.bio =
        "Bio бөглөнө үү"
    }

    if (!skills.trim()) {
      errors.skills =
        "Ур чадвараа оруулна уу"
    }

    if (!experience.trim()) {
      errors.experience =
        "Туршлагаа оруулна уу"
    }

    if (!education.trim()) {
      errors.education =
        "Боловсролоо оруулна уу"
    }

    const enabledDays =
      Object.values(
        availability
      ).filter(
        (day) => day.enabled
      )

    if (
      enabledDays.length === 0
    ) {

      errors.availability =
        "Дор хаяж нэг ажиллах өдөр сонгоно уу"

    }

    enabledDays.forEach(
      (day) => {

        if (
          !day.from ||
          !day.to
        ) {

          errors.availability =
            "Ажиллах цагийг бүрэн оруулна уу"

        }

        if (
          day.from &&
          day.to &&
          day.from >= day.to
        ) {

          errors.availability =
            "Эхлэх цаг дуусах цагаас бага байх ёстой"

        }

      }
    )

    setValidationErrors(
      errors
    )

    return (
      Object.keys(errors)
        .length === 0
    )

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

    setError(null)

    if (!validateForm()) {

      setError(
        "Улаанаар тэмдэглэгдсэн мэдээллүүдийг шалгана уу."
      )

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })

      return

    }

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

              fullName,
              
              email,

              phone,

              bio,

              skills,

              experience,

              education,

              availability,

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

      setIsEditMode(false)

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

      <div
        className="
          flex
          items-start
          justify-between
        "
      >

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

        <button
          type="button"
          onClick={async () => {

            if (isEditMode) {

              // Edit -> View
              await fetchProfile()

              setValidationErrors({})
              setError(null)

              setIsEditMode(false)

            } else {

              // View -> Edit
              setIsEditMode(true)

            }

          }}
          className="
            px-5
            py-2
            rounded-2xl
            text-sm
            font-bold
            border
            border-indigo-200
            text-indigo-600
            hover:bg-indigo-50
          "
        >
          {
            isEditMode
              ? "Харах горим"
              : "Засах"
          }
        </button>

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
              disabled={!isEditMode}
              onChange={(e) => {

                setFullName(
                  e.target.value
                )

                setValidationErrors(
                  (prev) => ({
                    ...prev,
                    fullName: "",
                  })
                )

              }}
              className={`
                w-full
                px-4
                py-3
                bg-gray-50
                rounded-2xl
                text-sm
                outline-none
                ${
                  validationErrors.fullName
                    ? "border border-red-500 bg-red-50"
                    : "border border-gray-200"
                }
              `}
            />
            {
              validationErrors.fullName && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.fullName}
                </p>
              )
            }

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
              disabled={!isEditMode}
              onChange={(e) => {

                setPhone(
                  e.target.value
                )

                setValidationErrors(
                  (prev) => ({
                    ...prev,
                    phone: "",
                  })
                )

              }}
              className={`
                w-full
                px-4
                py-3
                bg-gray-50
                rounded-2xl
                text-sm
                ${
                  validationErrors.phone
                    ? "border border-red-500 bg-red-50"
                    : "border border-gray-200"
                }
              `}
            />
            {
              validationErrors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.phone}
                </p>
              )
            }

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
              disabled={!isEditMode}
              onChange={(e) => {

                setEmail(
                  e.target.value
                )

                setValidationErrors(
                  (prev) => ({
                    ...prev,
                    email: "",
                  })
                )

              }}
              className={`
                w-full
                px-4
                py-3
                bg-gray-50
                rounded-2xl
                text-sm
                ${
                  validationErrors.email
                    ? "border border-red-500 bg-red-50"
                    : "border border-gray-200"
                }
              `}
            />
            {
              validationErrors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.email}
                </p>
              )
            }

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
              disabled={!isEditMode}
              onChange={(e) => {

                setBio(
                  e.target.value
                )

                setValidationErrors(
                  (prev) => ({
                    ...prev,
                    bio: "",
                  })
                )

              }}
              className={`
                mt-2
                w-full
                px-4
                py-3
                bg-gray-50
                rounded-2xl
                text-sm
                ${
                  validationErrors.bio
                    ? "border border-red-500 bg-red-50"
                    : "border border-gray-200"
                }
              `}
            />
            {
              validationErrors.bio && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.bio}
                </p>
              )
            }
          </div>

          {/* SKILLS */}

          <div>

            <label className="text-sm font-bold">
              🛠️ Ур чадвар
            </label>

            <input
              type="text"
              value={skills}
              disabled={!isEditMode}
              onChange={(e) => {

                setSkills(
                  e.target.value
                )

                setValidationErrors(
                  (prev) => ({
                    ...prev,
                    skills: "",
                  })
                )

              }}
              className={`
                mt-2
                w-full
                px-4
                py-3
                bg-gray-50
                rounded-2xl
                text-sm
                ${
                  validationErrors.skills
                    ? "border border-red-500 bg-red-50"
                    : "border border-gray-200"
                }
              `}
            />
            {
              validationErrors.skills && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.skills}
                </p>
              )
            }

          </div>

          {/* EXPERIENCE */}

          <div>

            <label className="text-sm font-bold">
              💼 Туршлага
            </label>

            <textarea
              rows={4}
              value={experience}
              disabled={!isEditMode}
              onChange={(e) => {

                setExperience(
                  e.target.value
                )

                setValidationErrors(
                  (prev) => ({
                    ...prev,
                    experience: "",
                  })
                )

              }}
              className={`
                mt-2
                w-full
                px-4
                py-3
                bg-gray-50
                rounded-2xl
                text-sm
                ${
                  validationErrors.experience
                    ? "border border-red-500 bg-red-50"
                    : "border border-gray-200"
                }
              `}
            />
            {
              validationErrors.experience && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.experience}
                </p>
              )
            }

          </div>

          {/* EDUCATION */}

          <div>

            <label className="text-sm font-bold">
              🎓 Боловсрол
            </label>

            <textarea
              rows={3}
              value={education}
              disabled={!isEditMode}
              onChange={(e) => {

                setEducation(
                  e.target.value
                )

                setValidationErrors(
                  (prev) => ({
                    ...prev,
                    education: "",
                  })
                )

              }}
              className={`
                mt-2
                w-full
                px-4
                py-3
                bg-gray-50
                rounded-2xl
                text-sm
                ${
                  validationErrors.education
                    ? "border border-red-500 bg-red-50"
                    : "border border-gray-200"
                }
              `}
            />
            {
              validationErrors.education && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.education}
                </p>
              )
            }

          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-sm font-bold">
                  🕒 Ажиллах боломжтой цаг
                </label>

                <p className="text-xs text-gray-400 mt-1">
                  Аль өдөр хэдээс хэдэн цагийн хооронд ажиллах боломжтой вэ?
                </p>
              </div>
            </div>

            <div className="space-y-3">

              {[
                ["monday", "Даваа"],
                ["tuesday", "Мягмар"],
                ["wednesday", "Лхагва"],
                ["thursday", "Пүрэв"],
                ["friday", "Баасан"],
                ["saturday", "Бямба"],
                ["sunday", "Ням"],
              ].map(([key, label]) => {

                const day =
                  availability[
                    key as keyof typeof availability
                  ]

                return (

                  <div
                    key={key}
                    className={`
                      border
                      rounded-2xl
                      p-4
                      transition
                      ${
                        day.enabled
                          ? "border-indigo-200 bg-indigo-50/50"
                          : "border-gray-100 bg-gray-50"
                      }
                    `}
                  >

                    <div className="flex flex-col md:flex-row md:items-center gap-4">

                      {/* LEFT */}

                      <div className="flex items-center justify-between md:w-48">

                        <span className="font-semibold text-gray-800">
                          {label}
                        </span>

                        <label className="relative inline-flex items-center cursor-pointer">

                          <input
                            type="checkbox"
                            className="sr-only peer"
                            disabled={!isEditMode}
                            checked={day.enabled}
                            onChange={(e) => {
                              setAvailability({
                                ...availability,
                                [key]: {
                                  ...day,
                                  enabled:
                                    e.target.checked,
                                },
                              })
                              setValidationErrors(
                                (prev) => ({
                                  ...prev,
                                  availability: "",
                                })
                              )
                            }}
                          />

                          <div
                            className="
                              w-11
                              h-6
                              bg-gray-300
                              rounded-full
                              peer
                              peer-checked:bg-indigo-600
                              transition
                            "
                          />

                        </label>

                      </div>

                      {/* RIGHT */}

                      {day.enabled ? (

                        <div className="flex items-center gap-3 flex-wrap">

                          <input
                            type="time"
                            disabled={!isEditMode}
                            value={day.from}
                            onChange={(e) =>{
                              setAvailability({
                                ...availability,
                                [key]: {
                                  ...day,
                                  from:
                                    e.target.value,
                                },
                              })
                              setValidationErrors(
                                (prev) => ({
                                  ...prev,
                                  availability: "",
                                })
                              )
                            }}
                            className="
                              px-4
                              py-2
                              bg-white
                              border
                              border-gray-200
                              rounded-xl
                            "
                          />

                          <span className="text-gray-400">
                            →
                          </span>

                          <input
                            type="time"
                            disabled={!isEditMode}
                            value={day.to}
                            onChange={(e) =>
                              setAvailability({
                                ...availability,
                                [key]: {
                                  ...day,
                                  to:
                                    e.target.value,
                                },
                              })
                            }
                            className="
                              px-4
                              py-2
                              bg-white
                              border
                              border-gray-200
                              rounded-xl
                            "
                          />

                        </div>

                      ) : (

                        <span
                          className="
                            text-xs
                            font-medium
                            px-3
                            py-1
                            rounded-full
                            bg-gray-200
                            text-gray-500
                          "
                        >
                          Амарна
                        </span>

                      )}

                    </div>

                  </div>

                )

              })}

            </div>
          </div>
          {
            validationErrors.availability && (

              <div
                className="
                  mt-3
                  p-3
                  rounded-xl
                  bg-red-50
                  border
                  border-red-200
                  text-red-600
                  text-sm
                "
              >
                {validationErrors.availability}
              </div>

            )
          }

          {/* SAVE BUTTON */}
          {isEditMode && (


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
          )}

        </div>

      </form>

    </div>

  )

}