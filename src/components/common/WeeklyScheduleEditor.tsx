"use client"

import { WEEK_DAYS, type ScheduleDay, type WeekDay, type WeeklySchedule } from "@/lib/weeklySchedule"

function Switch({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 shrink-0 rounded-full transition cursor-pointer ${checked ? "bg-orange-600" : "bg-gray-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  )
}

interface WeeklyScheduleEditorProps {
  value: WeeklySchedule
  onChange: (next: WeeklySchedule) => void
  // Сонгоогүй өдрийн текст («Амарна», «Ажилгүй» г.м.)
  offLabel?: string
  invalid?: boolean
}

// Долоо хоногийн өдөр бүрийг асааж, эхлэх/дуусах цагийг оруулна (ажилтны профайлын «Ажиллах боломжтой цаг»-тай ижил)
export default function WeeklyScheduleEditor({ value, onChange, offLabel = "Амарна", invalid }: WeeklyScheduleEditorProps) {
  const updateDay = (key: WeekDay, patch: Partial<ScheduleDay>) => {
    const current = value[key]
    const next = { ...current, ...patch }
    // Шинээр асаасан өдөрт өмнөх асаалттай өдрийн цагийг санал болгоно (өдөр бүр дахин бичихгүй)
    if (patch.enabled && !current.from && !current.to) {
      const previous = WEEK_DAYS.map(([k]) => value[k]).find((d) => d.enabled && d.from && d.to)
      if (previous) Object.assign(next, { from: previous.from, to: previous.to })
    }
    onChange({ ...value, [key]: next })
  }

  return (
    <div
      className={`divide-y divide-gray-100 rounded-2xl border overflow-hidden ${invalid ? "border-red-300" : "border-gray-100"}`}
    >
      {WEEK_DAYS.map(([key, label]) => {
        const day = value[key]
        return (
          <div key={key} className={`p-3 sm:p-4 transition ${day.enabled ? "bg-orange-50/40" : "bg-white"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center justify-between sm:w-40 sm:shrink-0">
                <span className="font-medium text-gray-800">{label}</span>
                <Switch checked={day.enabled} label={`${label} гариг`} onChange={(checked) => updateDay(key, { enabled: checked })} />
              </div>
              {day.enabled ? (
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:gap-3">
                  <input
                    type="time"
                    aria-label={`${label} эхлэх цаг`}
                    value={day.from}
                    onChange={(e) => updateDay(key, { from: e.target.value })}
                    className="w-full sm:w-36 h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-orange-500 outline-none"
                  />
                  <span className="text-gray-400 text-sm">—</span>
                  <input
                    type="time"
                    aria-label={`${label} дуусах цаг`}
                    value={day.to}
                    onChange={(e) => updateDay(key, { to: e.target.value })}
                    className="w-full sm:w-36 h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-orange-500 outline-none"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400">{offLabel}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
