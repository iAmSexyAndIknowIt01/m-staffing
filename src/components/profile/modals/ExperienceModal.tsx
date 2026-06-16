"use client"

import { useState } from "react"

type Experience = {
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
}

type Props = {
  open: boolean
  value: Experience
  onSave: (data: Experience) => void
  onClose: () => void
}

export default function ExperienceModal({
  open,
  value,
  onSave,
  onClose,
}: Props) {

  const [form, setForm] =
    useState(value)

  if (!open) return null

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-3xl rounded-3xl">

        <div className="p-6 border-b flex justify-between">

          <h2 className="text-3xl font-bold">
            💼 Туршлага
          </h2>

          <button onClick={onClose}>
            ✕
          </button>

        </div>

        <div className="p-6 space-y-4">

          <input
            placeholder="Компани"
            value={form.company}
            onChange={(e) =>
              setForm({
                ...form,
                company:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl p-3"
          />

          <input
            placeholder="Албан тушаал"
            value={form.position}
            onChange={(e) =>
              setForm({
                ...form,
                position:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl p-3"
          />

          <div className="grid grid-cols-2 gap-4">

            <input
              type="month"
              value={form.startDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  startDate:
                    e.target.value,
                })
              }
              className="border rounded-xl p-3"
            />

            <input
              type="month"
              value={form.endDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  endDate:
                    e.target.value,
                })
              }
              className="border rounded-xl p-3"
            />

          </div>

          <textarea
            rows={6}
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description:
                  e.target.value,
              })
            }
            className="
              w-full
              border
              rounded-xl
              p-3
            "
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