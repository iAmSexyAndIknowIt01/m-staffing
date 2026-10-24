"use client"

import { useEffect, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, CheckCircle2, HelpCircle, Info, X, type LucideIcon } from "lucide-react"
import { useIsClient } from "@/lib/useIsClient"

// Браузерын alert()/confirm()-ийн оронд системийн загвартай цонх.
// Хаанаас ч дуудна: showAlert("...") эсвэл `if (!(await showConfirm("..."))) return`.
// AppDialogHost-ийг root layout-д нэг удаа байрлуулсан.

type Tone = "info" | "success" | "error" | "warning" | "question"

interface DialogRequest {
  kind: "alert" | "confirm"
  title: string
  message: string
  tone: Tone
  confirmLabel: string
  cancelLabel: string
  danger: boolean
  icon?: LucideIcon
  subject?: DialogSubject
  resolve: (ok: boolean) => void
}

// Үйлдэл хэнд/юунд хамаарахыг тодруулж харуулах карт (жишээ нь ажил горилогч)
export interface DialogSubject {
  name: string
  details?: string[]
}

let current: DialogRequest | null = null
const queue: DialogRequest[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function open(req: DialogRequest) {
  if (current) queue.push(req)
  else current = req
  emit()
}

function close(ok: boolean) {
  if (!current) return
  const done = current
  current = queue.shift() ?? null
  emit()
  done.resolve(ok)
}

const DEFAULT_TITLES: Record<Tone, string> = {
  info: "Мэдэгдэл",
  success: "Амжилттай",
  error: "Алдаа гарлаа",
  warning: "Анхааруулга",
  question: "Баталгаажуулах",
}

export function showAlert(
  message: string,
  options: { title?: string; tone?: Exclude<Tone, "question"> } = {}
): Promise<void> {
  const tone = options.tone ?? "info"
  return new Promise((resolve) =>
    open({
      kind: "alert",
      title: options.title ?? DEFAULT_TITLES[tone],
      message,
      tone,
      confirmLabel: "Ойлголоо",
      cancelLabel: "",
      danger: false,
      resolve: () => resolve(),
    })
  )
}

export function showConfirm(
  message: string,
  options: {
    title?: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    icon?: LucideIcon
    subject?: DialogSubject
  } = {}
): Promise<boolean> {
  return new Promise((resolve) =>
    open({
      kind: "confirm",
      title: options.title ?? "Баталгаажуулах",
      message,
      tone: options.danger ? "error" : "question",
      confirmLabel: options.confirmLabel ?? "Тийм",
      cancelLabel: options.cancelLabel ?? "Болих",
      danger: options.danger ?? false,
      icon: options.icon,
      subject: options.subject,
      resolve,
    })
  )
}

const TONE_STYLES: Record<Tone, { icon: typeof Info; wrap: string }> = {
  info: { icon: Info, wrap: "bg-orange-50 text-orange-600" },
  success: { icon: CheckCircle2, wrap: "bg-emerald-50 text-emerald-600" },
  error: { icon: AlertTriangle, wrap: "bg-rose-50 text-rose-600" },
  warning: { icon: AlertTriangle, wrap: "bg-amber-50 text-amber-600" },
  question: { icon: HelpCircle, wrap: "bg-orange-50 text-orange-600" },
}

export default function AppDialogHost() {
  const dialog = useSyncExternalStore(subscribe, () => current, () => null)
  const mounted = useIsClient()

  useEffect(() => {
    if (!dialog) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [dialog])

  if (!dialog || !mounted) return null

  const { icon: ToneIcon, wrap } = TONE_STYLES[dialog.tone]
  const Icon = dialog.icon ?? ToneIcon
  const confirmClass = dialog.danger
    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
    : "bg-orange-600 hover:bg-orange-700 shadow-orange-600/20"
  const initials = dialog.subject?.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

  return createPortal(
    <div
      className="fixed inset-0 z-100001 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={() => close(false)}
    >
      <div
        role={dialog.kind === "confirm" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-message"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => close(false)}
          aria-label="Хаах"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 pb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${wrap}`}>
            <Icon className="w-6 h-6" strokeWidth={1.8} />
          </div>
          <h3 id="app-dialog-title" className="mt-4 pr-8 text-lg font-semibold text-gray-900">{dialog.title}</h3>
          <p id="app-dialog-message" className="mt-1.5 text-sm text-gray-500 leading-relaxed whitespace-pre-line">
            {dialog.message}
          </p>

          {dialog.subject && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3.5">
              <div className="w-11 h-11 shrink-0 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-semibold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{dialog.subject.name}</p>
                {dialog.subject.details && dialog.subject.details.length > 0 && (
                  <p className="mt-0.5 text-xs text-gray-500 truncate">{dialog.subject.details.join(" · ")}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          {dialog.kind === "confirm" && (
            <button
              type="button"
              onClick={() => close(false)}
              className="h-10 px-4 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition"
            >
              {dialog.cancelLabel}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => close(true)}
            className={`h-10 px-5 rounded-xl text-sm font-semibold text-white shadow-md transition inline-flex items-center justify-center gap-2 ${confirmClass}`}
          >
            {dialog.kind === "confirm" && dialog.icon && <dialog.icon className="w-4 h-4" />}
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
