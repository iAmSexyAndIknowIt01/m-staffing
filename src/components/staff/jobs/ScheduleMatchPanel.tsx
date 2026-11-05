"use client"

import Link from "next/link"
import { CalendarClock, Eraser, PencilLine } from "lucide-react"
import WeeklyScheduleEditor from "@/components/common/WeeklyScheduleEditor"
import { emptySchedule, enabledDays, type WeeklySchedule } from "@/lib/weeklySchedule"

export const MATCH_LEVELS = [
  { value: 100, label: "Бүрэн" },
  { value: 75, label: "75%+" },
  { value: 50, label: "50%+" },
] as const

// profile — профайлын «Ажиллах боломжтой цаг»-аар (зөвхөн уншина)
// custom  — энэ хайлтад зориулж нэг удаа сонгосон өдөр, цаг (хадгалагдахгүй)
export type ScheduleSearchMode = "profile" | "custom"

export const SCHEDULE_MODES: { value: ScheduleSearchMode; label: string }[] = [
  { value: "profile", label: "Миний цагт тохирох" },
  { value: "custom", label: "Өдөр, цаг сонгох" },
]

interface ScheduleMatchPanelProps {
  mode: ScheduleSearchMode
  onMode: (mode: ScheduleSearchMode) => void
  profileSchedule: WeeklySchedule
  customSchedule: WeeklySchedule
  onCustomChange: (next: WeeklySchedule) => void
  minMatch: number
  onMinMatch: (value: number) => void
  matchCount: number
}

function DaySummary({ schedule }: { schedule: WeeklySchedule }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {enabledDays(schedule).map(([key, label, day]) => (
        <span key={key} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-medium text-gray-800">
          {label}
          <span className="font-semibold tabular-nums text-orange-700">
            {day.from || "--:--"}–{day.to || "--:--"}
          </span>
        </span>
      ))}
    </div>
  )
}

// Ажлын зарыг өдөр, цагаар шүүх самбар
export default function ScheduleMatchPanel({
  mode,
  onMode,
  profileSchedule,
  customSchedule,
  onCustomChange,
  minMatch,
  onMinMatch,
  matchCount,
}: ScheduleMatchPanelProps) {
  const hasProfile = enabledDays(profileSchedule).length > 0
  const schedule = mode === "profile" ? profileSchedule : customSchedule
  const hasDays = enabledDays(schedule).length > 0

  return (
    <section aria-label="Цагаар хайх" className="rounded-2xl border border-orange-100 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Хайх арга */}
        <div role="radiogroup" aria-label="Цагаар хайх арга" className="inline-flex self-start rounded-xl border border-gray-200 bg-gray-50 p-1">
          {SCHEDULE_MODES.map((m) => {
            const active = mode === m.value
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onMode(m.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  active ? "bg-white text-orange-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {m.value === "profile" ? <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" /> : <PencilLine className="w-3.5 h-3.5" aria-hidden="true" />}
                {m.label}
              </button>
            )
          })}
        </div>

        {/* Нийцлийн доод хувь */}
        <div className="flex items-center gap-2">
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

      <div className="mt-4">
        {mode === "profile" ? (
          hasProfile ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <DaySummary schedule={profileSchedule} />
              <Link href="/dashboard/staff/profile" className="shrink-0 text-xs font-semibold text-orange-600 hover:text-orange-700">
                Профайл дээр засах
              </Link>
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Профайлдаа ажиллах боломжтой цагаа оруулаагүй байна.{" "}
              <Link href="/dashboard/staff/profile" className="font-semibold text-orange-600 hover:text-orange-700">
                Профайлд оруулах
              </Link>{" "}
              эсвэл{" "}
              <button type="button" onClick={() => onMode("custom")} className="font-semibold text-orange-600 hover:text-orange-700 cursor-pointer">
                өдөр, цагаа сонгоод хайна уу
              </button>
              .
            </div>
          )
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">Энэ хайлтад л ашиглана — профайл тань өөрчлөгдөхгүй.</p>
              {hasDays && (
                <button
                  type="button"
                  onClick={() => onCustomChange(emptySchedule())}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" aria-hidden="true" /> Цэвэрлэх
                </button>
              )}
            </div>
            <WeeklyScheduleEditor value={customSchedule} onChange={onCustomChange} offLabel="Сонгоогүй" />
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-500" aria-live="polite">
        {!hasDays
          ? mode === "custom"
            ? "Өдөр, цагаа сонгомогц тохирох хагас цагийн ажлууд шүүгдэнэ."
            : ""
          : `${matchCount} хагас цагийн ажлын дор хаяж нэг ажлын өдөр ${minMatch === 100 ? "бүрэн" : `${minMatch}%-аас дээш`} нийцэж байна. Олон өдөр таарсан нь эхэнд.`}
      </p>
    </section>
  )
}
