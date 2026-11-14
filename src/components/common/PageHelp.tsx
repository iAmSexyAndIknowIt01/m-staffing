"use client"

import { useEffect, useId, useRef, useState } from "react"
import { CircleHelp, X } from "lucide-react"

interface PageHelpProps {
  // Цонхны гарчиг (жишээ: «Ажилтан хайх хуудас»)
  title: string
  // Зааврын мөрүүд — хуудас бүр өөрийн текстээ дамжуулна
  items: React.ReactNode[]
}

// Хуудасны гарчгийн хажууд байрлах «?» товч. Дарахад тухайн хуудсыг хэрхэн ашиглах заавар гарна.
// Гадна дарах эсвэл Escape дарахад хаагдана.
export default function PageHelp({ title, items }: PageHelpProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Энэ хуудасны заавар"
        title="Заавар"
        className={`w-9 h-9 rounded-full inline-flex items-center justify-center transition ${
          open ? "bg-orange-100 text-orange-600" : "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
        }`}
      >
        <CircleHelp className="w-5 h-5" />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={title}
          className="animate-fade-in absolute left-1/2 sm:left-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 sm:translate-x-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold text-gray-900">{title}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Хаах"
              className="-mt-1 -mr-1 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="mt-2.5 space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm font-normal leading-relaxed text-gray-600">
                <span className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
