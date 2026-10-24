"use client"

import { useEffect, useSyncExternalStore } from "react"
import { Moon, Sun } from "lucide-react"
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme"

const THEME_EVENT = "mstaffing-theme-change"

function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange)
  return () => window.removeEventListener(THEME_EVENT, onChange)
}

function applyTheme(theme: Theme, remember: boolean) {
  const root = document.documentElement
  // Зөвхөн товч дарсан үед өнгө зөөлөн шилжинэ
  root.classList.add("theme-transition")
  root.classList.toggle("dark", theme === "dark")
  window.setTimeout(() => root.classList.remove("theme-transition"), 300)
  if (remember) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {}
  }
  window.dispatchEvent(new Event(THEME_EVENT))
}

interface Props {
  className?: string
  // Цэс дотор текстийн хамт харуулах эсэх
  withLabel?: boolean
}

// Light / dark горим солих товч. Анх төхөөрөмжийн тохиргоог дагаж, сонгосныг санана.
export default function ThemeToggle({ className = "", withLabel = false }: Props) {
  // SSR дээр мэдэгдэхгүй тул "light" гэж үзээд hydration-ий дараа жинхэнэ утгыг уншина
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme)
  const isDark = theme === "dark"

  // Хэрэглэгч сонголт хийгээгүй бол төхөөрөмжийн горим өөрчлөгдөхөд дагана
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onSystemChange = (e: MediaQueryListEvent) => {
      let saved: string | null = null
      try {
        saved = localStorage.getItem(THEME_STORAGE_KEY)
      } catch {}
      if (!saved) applyTheme(e.matches ? "dark" : "light", false)
    }
    media.addEventListener("change", onSystemChange)
    return () => media.removeEventListener("change", onSystemChange)
  }, [])

  const label = isDark ? "Цайвар горим" : "Харанхуй горим"

  return (
    <button
      type="button"
      onClick={() => applyTheme(isDark ? "light" : "dark", true)}
      aria-label={label}
      title={label}
      className={className}
    >
      {isDark ? <Sun className="w-5 h-5" strokeWidth={2} /> : <Moon className="w-5 h-5" strokeWidth={2} />}
      {withLabel && <span>{label}</span>}
    </button>
  )
}
