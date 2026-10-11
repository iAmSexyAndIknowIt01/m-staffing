"use client"

import { Copy } from "lucide-react"
import {
  DEFAULT_END,
  DEFAULT_START,
  WEEKDAYS,
  formatDuration,
  formatWorkSchedule,
  isOvernight,
  parseWorkSchedule,
  slotError,
  weeklyMinutes,
  type DaySlot,
  type WorkHoursDraft,
  type WorkHoursMode,
  type WorkSchedule,
} from "@/lib/workSchedule"

// Гэрээний ажлын цаг: долоо хоногийн өдөр бүрт цаг сонгох эсвэл чөлөөт бичвэр (ээлжийн ажил г.м.)

interface WorkScheduleInputProps {
  value: WorkHoursDraft
  onChange: (value: WorkHoursDraft) => void
}

const MODES: { key: WorkHoursMode; label: string }[] = [
  { key: "schedule", label: "📅 Өдрөөр сонгох" },
  { key: "text", label: "✏️ Чөлөөт бичих" },
]

const timeInputClass =
  "w-[7.5rem] px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:opacity-50"

const chipClass = "px-3 py-1.5 rounded-lg text-xs font-bold transition bg-white border border-gray-200 text-gray-600"
const presetClass = `${chipClass} hover:border-indigo-200 hover:text-indigo-600`

// Шинээр сонгосон өдөрт ойрын өмнөх (байхгүй бол дараах) сонгосон өдрийн цагийг санал болгоно
function templateFor(schedule: WorkSchedule, index: number): Pick<DaySlot, "start" | "end"> | null {
  const before = schedule.slice(0, index).reverse().find((s) => s.enabled)
  return before ?? schedule.slice(index + 1).find((s) => s.enabled) ?? null
}

export default function WorkScheduleInput({ value, onChange }: WorkScheduleInputProps) {
  const { mode, schedule } = value
  const enabledCount = schedule.filter((s) => s.enabled).length
  const summary = formatWorkSchedule(schedule)
  const minutes = weeklyMinutes(schedule)

  const setSchedule = (next: WorkSchedule) => onChange({ ...value, schedule: next })
  const updateSlot = (index: number, patch: Partial<DaySlot>) =>
    setSchedule(schedule.map((s, i) => (i === index ? { ...s, ...patch } : s)))

  // Горим солиход агуулгыг боломжтой бол хадгална: хуваарь → бичвэр болгож, таарах бичвэрийг хуваарь болгоно
  function switchMode(next: WorkHoursMode) {
    if (next === mode) return
    if (next === "text") onChange({ ...value, mode: next, text: summary || value.text })
    else onChange({ ...value, mode: next, schedule: parseWorkSchedule(value.text) ?? schedule })
  }

  function toggleDay(index: number) {
    const slot = schedule[index]
    if (slot.enabled) return updateSlot(index, { enabled: false })
    const template = templateFor(schedule, index)
    updateSlot(index, { enabled: true, ...(template ? { start: template.start, end: template.end } : {}) })
  }

  const copyToOthers = (index: number) => {
    const { start, end } = schedule[index]
    setSchedule(schedule.map((s) => (s.enabled ? { ...s, start, end } : s)))
  }

  const presetWeekdays = () =>
    setSchedule(schedule.map((_, i) => ({ enabled: i < 5, start: DEFAULT_START, end: DEFAULT_END })))

  const presetAllDays = () => {
    const template = schedule.find((s) => s.enabled) ?? { start: DEFAULT_START, end: DEFAULT_END }
    setSchedule(schedule.map((s) => (s.enabled ? s : { enabled: true, start: template.start, end: template.end })))
  }

  const clearAll = () => setSchedule(schedule.map((s) => ({ ...s, enabled: false })))

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="radiogroup" aria-label="Ажлын цаг оруулах хэлбэр" className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={mode === m.key}
              onClick={() => switchMode(m.key)}
              className={`px-3 py-1.5 rounded-lg transition ${mode === m.key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mode === "schedule" && (
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={presetWeekdays} className={presetClass}>Да–Ба 09:00–18:00</button>
            <button type="button" onClick={presetAllDays} className={presetClass}>Бүх өдөр</button>
            {enabledCount > 0 && (
              <button type="button" onClick={clearAll} className={`${chipClass} hover:border-rose-200 hover:text-rose-600`}>Цэвэрлэх</button>
            )}
          </div>
        )}
      </div>

      {mode === "schedule" ? (
        <>
          <ul className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100">
            {schedule.map((slot, i) => {
              const day = WEEKDAYS[i]
              const error = slotError(slot)
              return (
                <li key={day} className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 ${slot.enabled ? "" : "bg-gray-50/50"}`}>
                  <label className="order-1 flex items-center gap-2.5 w-24 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={slot.enabled}
                      onChange={() => toggleDay(i)}
                      className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                    />
                    <span className={`text-sm font-bold ${slot.enabled ? "text-gray-900" : "text-gray-400"}`}>{day}</span>
                  </label>

                  {/* Гар утсанд: 1-р мөрөнд өдөр + хуулах товч, 2-р мөрөнд цаг. sm-ээс дээш нэг мөрөнд */}
                  {slot.enabled ? (
                    <>
                      <div className="order-3 sm:order-2 w-full sm:w-auto flex items-center gap-2 pl-[1.625rem] sm:pl-0">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateSlot(i, { start: e.target.value })}
                          aria-label={`${day} эхлэх цаг`}
                          aria-invalid={Boolean(error)}
                          className={timeInputClass}
                        />
                        <span className="text-gray-400">–</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateSlot(i, { end: e.target.value })}
                          aria-label={`${day} дуусах цаг`}
                          aria-invalid={Boolean(error)}
                          className={timeInputClass}
                        />
                        {!error && isOvernight(slot) && (
                          <span className="text-[11px] font-semibold text-indigo-500 whitespace-nowrap">🌙 дараа өдөр</span>
                        )}
                      </div>
                      {enabledCount > 1 && (
                        <button
                          type="button"
                          onClick={() => copyToOthers(i)}
                          title="Энэ цагийг бусад сонгосон өдөрт хуулах"
                          className="order-2 sm:order-3 ml-auto inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <Copy className="w-3.5 h-3.5" aria-hidden />
                          Бусдад хуулах
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="order-2 text-xs text-gray-400">Амралтын өдөр</span>
                  )}

                  {error && <p role="alert" className="order-4 w-full text-[11px] font-semibold text-rose-600">⚠️ {error}</p>}
                </li>
              )
            })}
          </ul>

          {summary ? (
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <span className="font-bold text-gray-700">{enabledCount} өдөр</span> · 7 хоногт нийт {formatDuration(minutes)}
              </p>
              <p>
                Гэрээнд: <span className="font-semibold text-gray-700">{summary}</span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Ажлын өдөр сонгоогүй — гэрээнд «—» гэж харагдана.</p>
          )}
        </>
      ) : (
        <div className="space-y-1.5">
          <textarea
            value={value.text}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
            rows={2}
            maxLength={200}
            placeholder="Жишээ: 2 өдөр ажиллаж 2 өдөр амрах ээлжийн хуваарь, 08:00–20:00"
            aria-label="Ажлын цаг"
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-gray-800"
          />
          <p className="text-[11px] text-gray-400">Ээлжийн, уян хатан цагийн ажил г.м. долоо хоногийн тогтмол хуваарьгүй үед ашиглана.</p>
        </div>
      )}
    </div>
  )
}
