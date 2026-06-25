"use client"

import { useEffect, useState } from "react"

type Props = {
  open: boolean
  value: string
  onSave: (value: string) => void
  onClose: () => void
}

export default function BioModal({
  open,
  value,
  onSave,
  onClose,
}: Props) {
  // Bio-ийн бичвэрийг удирдах state
  const [text, setText] = useState("")

  // Модал нээгдэх бүрд гаднаас ирсэн анхны утгыг онооно
  useEffect(() => {
    if (open) {
      setText(value || "")
    }
  }, [open, value])

  if (!open) return null

  // Текст хоосон эсвэл зөвхөн хоосон зайнууд байвал идэвхгүй болгох нөхцөл
  const isDisabled = !text.trim()

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl">

        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            🚀 Bio засах
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Өөрийн тухай товч танилцуулга бичнэ үү..."
            className="
              w-full
              border
              border-gray-200
              rounded-2xl
              p-4
              text-sm
              text-gray-800
              outline-none
              focus:border-indigo-500
              resize-none
            "
          />
        </div>

        <div className="border-t p-6 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border bg-white border-gray-300 text-gray-700 rounded-xl text-sm font-semibold transition hover:bg-gray-50"
          >
            Цуцлах
          </button>

          <button
            type="button"
            onClick={() => onSave(text)}
            disabled={isDisabled} // 👈 Текст хоосон үед идэвхгүй болно
            className="
              px-5
              py-2.5
              bg-indigo-600
              hover:bg-indigo-700
              disabled:bg-indigo-400
              disabled:opacity-50
              disabled:cursor-not-allowed
              text-white
              font-bold
              rounded-xl
              text-sm
              transition-all
            "
          >
            Хадгалах ✨
          </button>
        </div>

      </div>

    </div>
  )
}