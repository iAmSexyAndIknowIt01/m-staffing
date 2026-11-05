"use client"

import type { CSSProperties } from "react"

type Role = "staff" | "company"

// Нэвтрэх, бүртгүүлэх хуудасны animation-тэй хэсгүүд (globals.css: .auth-*, .dash-in, .animate-word-in)

export const stagger = (ms: number) => ({ "--d": ms }) as CSSProperties

// Ар дэвсгэр: аажим гулсах тор, хөвөх гэрэлтэлтүүд
export function AuthBackdrop() {
  return (
    <>
      <div className="absolute inset-0 bg-linear-to-b from-white via-[#fffaf6] to-white" />
      <div className="absolute top-[10%] left-[10%] w-175 h-175 rounded-full bg-orange-300/10 blur-[180px] animate-orb" aria-hidden="true" />
      <div
        className="hidden md:block absolute -bottom-40 -right-20 w-140 h-140 rounded-full bg-amber-300/15 blur-[160px] animate-orb [animation-delay:-7s] [animation-duration:18s]"
        aria-hidden="true"
      />
      <div
        className="auth-grid absolute inset-0 opacity-[0.5] bg-[linear-gradient(to_right,rgba(255,140,0,.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,140,0,.35)_1px,transparent_1px)] bg-size-[70px_70px]"
        aria-hidden="true"
      />
    </>
  )
}

// Гарчгийн үг бүр blur-оос тодорч, дараалан гарна. key-ээр солигдоход дахин тоглоно.
export function AnimatedHeadline({ lines, startMs = 250 }: { lines: string[]; startMs?: number }) {
  let index = 0
  return (
    <>
      {lines.map((line, li) => (
        <span key={li} className="block [perspective:600px]">
          {line.split(" ").map((word, wi) => {
            const d = startMs + index++ * 90
            return (
              <span key={wi} className="inline-block animate-word-in mr-[0.25em]" style={{ animationDelay: `${d}ms` }}>
                {word}
              </span>
            )
          })}
        </span>
      ))}
    </>
  )
}

// Ажил хайгч / ажил олгогч сонгох — улбар шар товч нь сонгосон тал руу гулсана
export function RoleToggle({ role, onChange }: { role: Role; onChange: (role: Role) => void }) {
  return (
    <div role="radiogroup" aria-label="Хэрэглэгчийн төрөл" className="relative grid grid-cols-2 bg-orange-50 rounded-full p-2">
      <span
        aria-hidden="true"
        className={`absolute top-2 bottom-2 left-2 w-[calc(50%-0.5rem)] rounded-full bg-linear-to-r from-orange-500 to-orange-400 shadow-lg shadow-orange-500/30 transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${
          role === "company" ? "translate-x-full" : "translate-x-0"
        }`}
      />
      {(
        [
          ["staff", "Ажил Хайгч"],
          ["company", "Ажил Олгогч"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={role === value}
          onClick={() => onChange(value)}
          className={`relative z-10 rounded-full py-3 font-medium transition-colors duration-300 cursor-pointer ${
            role === value ? "text-white" : "text-gray-600 hover:text-orange-600"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
