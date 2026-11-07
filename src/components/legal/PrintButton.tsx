"use client"

import { Printer } from "lucide-react"

// Баримт бичгийг хэвлэх / PDF болгон хадгалах
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 print:hidden"
    >
      <Printer className="w-4 h-4" aria-hidden="true" /> Хэвлэх
    </button>
  )
}
