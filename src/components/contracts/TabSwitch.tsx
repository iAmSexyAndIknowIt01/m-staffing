"use client"

import { useRef } from "react"

// Гэрээний хуудсуудын таб. Сумтай товч (←/→, Home/End)-оор шилжинэ, badge-д тоо харуулна.

export interface TabItem<K extends string> {
  key: K
  label: string
  badge?: number
}

interface TabSwitchProps<K extends string> {
  tabs: TabItem<K>[]
  value: K
  onChange: (key: K) => void
  ariaLabel: string
  idPrefix: string
}

export function tabPanelProps(idPrefix: string, key: string) {
  return { role: "tabpanel", id: `${idPrefix}-panel-${key}`, "aria-labelledby": `${idPrefix}-tab-${key}` } as const
}

export default function TabSwitch<K extends string>({ tabs, value, onChange, ariaLabel, idPrefix }: TabSwitchProps<K>) {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([])

  const focusTab = (index: number) => {
    const next = (index + tabs.length) % tabs.length
    buttonsRef.current[next]?.focus()
    onChange(tabs[next].key)
  }

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") focusTab(index + 1)
    else if (e.key === "ArrowLeft") focusTab(index - 1)
    else if (e.key === "Home") focusTab(0)
    else if (e.key === "End") focusTab(tabs.length - 1)
    else return
    e.preventDefault()
  }

  return (
    <div role="tablist" aria-label={ariaLabel} className="inline-flex w-full sm:w-auto bg-gray-100/80 p-1 rounded-2xl">
      {tabs.map((t, index) => {
        const selected = t.key === value
        return (
          <button
            key={t.key}
            ref={(el) => {
              buttonsRef.current[index] = el
            }}
            id={`${idPrefix}-tab-${t.key}`}
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${t.key}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.key)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
              selected ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
            {!!t.badge && (
              <span
                className={`min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-black ${
                  selected ? "bg-indigo-600 text-white" : "bg-gray-300 text-gray-700"
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
