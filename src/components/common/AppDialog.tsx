"use client"

import { useEffect, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, CheckCircle2, HelpCircle, Info } from "lucide-react"
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
  resolve: (ok: boolean) => void
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
  options: { title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean } = {}
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

  const { icon: Icon, wrap } = TONE_STYLES[dialog.tone]
  const confirmClass = dialog.danger
    ? "bg-rose-600 hover:bg-rose-700"
    : "bg-orange-600 hover:bg-orange-700"

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
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${wrap}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 id="app-dialog-title" className="text-base font-bold text-gray-900">{dialog.title}</h3>
            <p id="app-dialog-message" className="mt-1 text-sm text-gray-500 leading-relaxed whitespace-pre-line">
              {dialog.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          {dialog.kind === "confirm" && (
            <button
              type="button"
              onClick={() => close(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
            >
              {dialog.cancelLabel}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => close(true)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition ${confirmClass}`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
