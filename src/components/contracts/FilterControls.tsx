"use client"

import { useEffect, useState } from "react"

// Гэрээний жагсаалтуудын шүүлтүүрийн нийтлэг элементүүд

export const filterInputClass =
  "w-full px-4 py-2.5 bg-white border border-gray-200/80 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all text-gray-800"

export const filterSelectClass = `${filterInputClass} font-bold text-gray-700 cursor-pointer`

// Бичих бүрт URL шинэчлэхгүйн тулд 300ms хүлээгээд onCommit дуудна
export function SearchInput({ value, placeholder, onCommit }: { value: string; placeholder: string; onCommit: (value: string) => void }) {
  const [text, setText] = useState(value)

  useEffect(() => {
    if (text.trim() === value) return
    const timer = setTimeout(() => onCommit(text.trim()), 300)
    return () => clearTimeout(timer)
  }, [text, value, onCommit])

  return (
    <div className="relative w-full">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
      <input
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={`${filterInputClass} pl-10`}
      />
    </div>
  )
}

export function DateRange({
  label,
  from,
  to,
  onChange,
}: {
  label: string
  from: string
  to: string
  onChange: (changes: { from?: string; to?: string }) => void
}) {
  return (
    <div className="space-y-1">
      <span className="block text-[11px] font-bold text-gray-400 px-1">{label}</span>
      <div className="flex items-center gap-1.5">
        <input type="date" value={from} max={to || undefined} onChange={(e) => onChange({ from: e.target.value })} className={filterInputClass} aria-label={`${label} — эхлэх`} />
        <span className="text-gray-300">—</span>
        <input type="date" value={to} min={from || undefined} onChange={(e) => onChange({ to: e.target.value })} className={filterInputClass} aria-label={`${label} — дуусах`} />
      </div>
    </div>
  )
}

export function LabeledSelect({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="space-y-1 block">
      <span className="block text-[11px] font-bold text-gray-400 px-1">{label}</span>
      <select {...props} className={filterSelectClass}>
        {children}
      </select>
    </label>
  )
}

export function ResultSummary({ total, filtered, hasFilters, onClear }: { total: number; filtered: number; hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs text-gray-500 px-1">
      <span>
        {hasFilters ? `${total}-аас ${filtered} илэрц` : `Нийт ${total}`}
      </span>
      {hasFilters && (
        <button onClick={onClear} className="font-bold text-indigo-600 hover:text-indigo-700">
          ✕ Шүүлтүүр цэвэрлэх
        </button>
      )}
    </div>
  )
}
