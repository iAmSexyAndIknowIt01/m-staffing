"use client"

import { useState } from "react"

type Education = {
  school: string
  degree: string
  field: string
  graduationYear: string
}

type Props = {
  open: boolean
  value: Education
  onSave: (data: Education) => void
  onClose: () => void
}

export default function EducationModal({
  open,
  value,
  onSave,
  onClose,
}: Props) {

    if (!open) return null

  const [form, setForm] =
    useState(value)

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-3xl rounded-3xl">

        <div className="p-6 border-b flex justify-between">

          <h2 className="text-3xl font-bold">
            🎓 Боловсрол
          </h2>

          <button onClick={onClose}>
            ✕
          </button>

        </div>

        <div className="p-6 space-y-4">

          <input
            placeholder="Сургууль"
            value={form.school}
            onChange={(e) =>
              setForm({
                ...form,
                school:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl p-3"
          />

          <input
            placeholder="Зэрэг"
            value={form.degree}
            onChange={(e) =>
              setForm({
                ...form,
                degree:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl p-3"
          />

          <input
            placeholder="Мэргэжил"
            value={form.field}
            onChange={(e) =>
              setForm({
                ...form,
                field:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl p-3"
          />

          <input
            placeholder="Төгссөн он"
            value={form.graduationYear}
            onChange={(e) =>
              setForm({
                ...form,
                graduationYear:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl p-3"
          />

        </div>

        <div className="border-t p-6 flex justify-end">

          <button
            onClick={() =>
              onSave(form)
            }
            className="
              px-5
              py-3
              bg-indigo-600
              text-white
              rounded-xl
            "
          >
            Хадгалах
          </button>

        </div>

      </div>

    </div>

  )
}