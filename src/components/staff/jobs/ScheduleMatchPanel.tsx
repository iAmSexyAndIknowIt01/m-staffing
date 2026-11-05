"use client"

import { useState } from "react"
import { CalendarClock, ChevronDown, Loader2, RotateCcw, Save } from "lucide-react"
import WeeklyScheduleEditor from "@/components/common/WeeklyScheduleEditor"
import { enabledDays, type WeeklySchedule } from "@/lib/weeklySchedule"

export const MATCH_LEVELS = [
  { value: 100, label: "Бүрэн" },
  { value: 75, label: "75%+" },
  { value: 50, label: "50%+" },
] as const

interface ScheduleMatchPanelProps {
  schedule: WeeklySchedule
  // Профайлын «Ажиллах боломжтой цаг»-аар хайж байгаа эсэх (өөрчлөөгүй)
  usingProfile: boolean
  hasProfile: boolean
  minMatch: number
  matchCount: number
  onChange: (next: WeeklySchedule) => void
  onMinMatch: (value: number) => void
  onUseProfile: () => void
  onSaveToProfile: () => Promise<void>
}

// «Миний цагт тохирох» шүүлтүүрийн самбар: өдөр бүрийн цагаа энэ хайлтад зориулж өөрчилж, нийцлийн доод хувийг сонгоно
export default function ScheduleMatchPanel({
  schedule,
  usingProfile,
  hasProfile,
  minMatch,
  matchCount,
  onChange,
  onMinMatch,
  onUseProfile,
  onSaveToProfile,
}: ScheduleMatchPanelProps) {
  const days = enabledDays(schedule)
  const [open, setOpen] = useState(days.length === 0)
  const [saving, setSaving] = useState(false)
  const expanded = open || days.length === 0

  const save = async () => {
    setSaving(true)
    try {
      await onSaveToProfile()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-label="Миний ажиллах цаг" className="rounded-2xl border border-orange-100 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <CalendarClock className="w-4 h-4 text-orange-600" aria-hidden="true" /> Миний ажиллах цаг
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {usingProfile
              ? "Профайлын «Ажиллах боломжтой цаг»-аар хайж байна. Энэ хайлтад зориулж өөрчилж болно."
              : "Энэ хайлтад зориулж өөрчилсөн цаг. Профайл тань өөрчлөгдөөгүй."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-gray-500">Нийцэл</span>
          <div role="radiogroup" aria-label="Нийцлийн доод хувь" className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {MATCH_LEVELS.map((level) => {
              const active = minMatch === level.value
              return (
                <button
                  key={level.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onMinMatch(level.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    active ? "bg-white text-orange-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {level.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Сонгосон өдрүүдийн товч */}
      {days.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {days.map(([key, label, day]) => (
            <span key={key} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-medium text-gray-800">
              {label}
              <span className="font-semibold tabular-nums text-orange-700">
                {day.from || "--:--"}–{day.to || "--:--"}
              </span>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            {expanded ? "Хураах" : "Өдөр, цагаа засах"}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        </div>
      )}

      {expanded && (
        <div className="mt-4">
          {days.length === 0 && (
            <p className="mb-3 text-xs text-gray-500">Ажиллаж болох өдрөө асааж, хэдээс хэдэн цаг хүртэл болохоо оруулна уу.</p>
          )}
          <WeeklyScheduleEditor value={schedule} onChange={onChange} />
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            {!usingProfile && hasProfile && (
              <button
                type="button"
                onClick={onUseProfile}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Профайлын цагийг ашиглах
              </button>
            )}
            {!usingProfile && days.length > 0 && (
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-orange-600 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60 cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Save className="w-3.5 h-3.5" aria-hidden="true" />}
                Профайлд хадгалах
              </button>
            )}
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500" aria-live="polite">
        {days.length === 0
          ? "Цагаа оруулмагц тохирох хагас цагийн ажлууд шүүгдэнэ."
          : `${matchCount} хагас цагийн ажил таны цагтай ${minMatch === 100 ? "бүрэн" : `${minMatch}%-аас дээш`} нийцэж байна. Хамгийн их нийцсэнээр нь эрэмбэлэв.`}
      </p>
    </section>
  )
}
