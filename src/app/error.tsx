"use client"

import { useEffect } from "react"
import Link from "next/link"
import FoalIllustration from "@/components/common/FoalIllustration"

// Хуудас ажиллах үед гарсан алдааг Next.js-ийн англи анхдагч дэлгэцийн оронд манай загвараар харуулна.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("PAGE_ERROR:", error)
  }, [error])

  return (
    <div role="alert" className="stagger-in flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
      <div className="mb-6 flex flex-col items-center">
        <FoalIllustration variant="error" size={220} />
      </div>

      <div className="space-y-3 max-w-md">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Алдаа гарлаа</h1>
        <p className="text-slate-500 leading-relaxed">
          Уучлаарай, хуудсыг ачаалах үед алдаа гарлаа. Дахин оролдох эсвэл нүүр хуудас руу буцна уу.
        </p>
        {error.digest && <p className="text-xs text-slate-400 font-mono">Код: {error.digest}</p>}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200"
        >
          Дахин оролдох
        </button>
        <Link
          href="/"
          className="px-8 py-3 bg-white text-slate-700 font-semibold rounded-2xl border border-slate-200 hover:border-slate-300 transition-all"
        >
          Нүүр хуудас
        </Link>
      </div>
    </div>
  )
}
