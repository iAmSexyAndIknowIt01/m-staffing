"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, Check, Loader2, Mail, RotateCw } from "lucide-react"
import BackLink from "@/components/common/BackLink"
import LoadingLayout from "@/components/common/LoadingLayout"
import { JOB_CATEGORIES } from "@/lib/jobPost"
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_OPTIONS,
  type NotificationKey,
  type NotificationRole,
  type NotificationSettings,
} from "@/lib/notificationCatalog"

type SaveState = "idle" | "saving" | "saved" | "error"

function Switch({ checked, onChange, labelledBy, describedBy }: { checked: boolean; onChange: (v: boolean) => void; labelledBy: string; describedBy: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
        checked ? "bg-orange-500" : "bg-gray-300"
      }`}
    >
      <span style={{ backgroundColor: "#ffffff" }} className={`inline-block h-5 w-5 rounded-full shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  )
}

// Ажил хайгч / ажил олгогчийн «Тохиргоо» хуудас — одоогоор «Имэйлийн тохиргоо» хэсэгтэй.
// Сэлгэх бүрт шууд хадгална; алдаа гарвал өмнөх утга руу буцааж мэдэгдэнэ.
export default function SettingsPage({ role }: { role: NotificationRole }) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [reloadKey, setReloadKey] = useState(0)
  const savedRef = useRef<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS)
  const requestRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    fetch("/api/settings/notifications", { cache: "no-store" })
      .then(async (res) => {
        const result = await res.json()
        if (!res.ok || !result.success) throw new Error(result.error || "Тохиргоо уншихад алдаа гарлаа.")
        return result
      })
      .then((result) => {
        if (cancelled) return
        savedRef.current = result.settings
        setSettings(result.settings)
        setEmail(result.email)
        setLoadError(null)
      })
      .catch((err) => !cancelled && setLoadError(err instanceof Error ? err.message : "Сүлжээний алдаа гарлаа."))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const save = async (next: NotificationSettings) => {
    setSettings(next)
    setSaveState("saving")
    const requestId = ++requestRef.current
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error)
      savedRef.current = result.settings
      if (requestId === requestRef.current) setSaveState("saved")
    } catch {
      // Зөвхөн хамгийн сүүлийн хүсэлт амжилтгүй болсон үед хадгалагдсан утга руу буцаана
      if (requestId === requestRef.current) {
        setSettings(savedRef.current)
        setSaveState("error")
      }
    }
  }

  const toggle = (key: NotificationKey, value: boolean) => save({ ...settings, [key]: value })

  const toggleCategory = (value: string | null) => {
    const current = settings.job_offer_categories
    const next = value === null ? [] : current.includes(value) ? current.filter((c) => c !== value) : [...current, value]
    save({ ...settings, job_offer_categories: next })
  }

  if (loading) return <LoadingLayout loading />

  const options = NOTIFICATION_OPTIONS[role]
  const allCategories = settings.job_offer_categories.length === 0

  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8 p-1">
      <div className="space-y-2">
        <BackLink href="/dashboard" label="Хянах самбар" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Тохиргоо</h1>
        <p className="text-gray-500 text-sm">Бүртгэлийнхээ тохиргоог эндээс удирдана.</p>
      </div>

      <section aria-labelledby="mail-settings-title" className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-5 border-b border-gray-100">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 id="mail-settings-title" className="font-semibold text-gray-900">Имэйлийн тохиргоо</h2>
              <p className="text-sm text-gray-500">
                Аль үйл явдлын үед имэйл хүлээж авахаа сонгоно уу.
                {email && (
                  <>
                    {" "}Мэдэгдэл <span className="font-medium text-gray-700 break-all">{email}</span> хаяг руу очно.
                  </>
                )}
              </p>
            </div>
          </div>
          <p aria-live="polite" className="shrink-0 text-xs font-medium min-h-4">
            {saveState === "saving" && (
              <span className="inline-flex items-center gap-1.5 text-gray-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Хадгалж байна…</span>
            )}
            {saveState === "saved" && (
              <span className="inline-flex items-center gap-1.5 text-emerald-600"><Check className="w-3.5 h-3.5" /> Хадгалагдлаа</span>
            )}
            {saveState === "error" && (
              <span className="inline-flex items-center gap-1.5 text-red-600"><AlertCircle className="w-3.5 h-3.5" /> Хадгалж чадсангүй, дахин оролдоно уу</span>
            )}
          </p>
        </header>

        {loadError ? (
          <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-5 text-sm text-red-700 bg-red-50">
            <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> {loadError}</span>
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                setReloadKey((k) => k + 1)
              }}
              className="self-start inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-red-200 bg-white font-semibold hover:bg-red-50"
            >
              <RotateCw className="w-4 h-4" /> Дахин ачаалах
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {options.map(({ key, title, description }) => (
              <li key={key} className="px-5 sm:px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p id={`n-${key}-title`} className="font-medium text-gray-900">{title}</p>
                    <p id={`n-${key}-desc`} className="mt-0.5 text-sm text-gray-500">{description}</p>
                  </div>
                  <Switch checked={settings[key]} onChange={(v) => toggle(key, v)} labelledBy={`n-${key}-title`} describedBy={`n-${key}-desc`} />
                </div>

                {key === "job_offer" && settings.job_offer && (
                  <fieldset className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 p-4">
                    <legend className="sr-only">Ажлын саналын ангилал</legend>
                    <p className="text-sm font-medium text-gray-700">Ямар ангиллын ажлын санал авах вэ?</p>
                    <p className="mt-0.5 text-xs text-gray-500">Нэг ч ангилал сонгоогүй бол бүх ангиллын шинэ зарын мэдэгдэл очно.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[{ value: null, label: "Бүх ангилал" }, ...JOB_CATEGORIES.map((c) => ({ value: c.value as string | null, label: c.label }))].map(
                        ({ value, label }) => {
                          const selected = value === null ? allCategories : settings.job_offer_categories.includes(value)
                          return (
                            <button
                              key={value ?? "all"}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => toggleCategory(value)}
                              className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium border transition ${
                                selected
                                  ? "bg-orange-600 border-orange-600 text-white"
                                  : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                              }`}
                            >
                              {selected && <Check className="w-3.5 h-3.5" />}
                              {label}
                            </button>
                          )
                        }
                      )}
                    </div>
                  </fieldset>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
