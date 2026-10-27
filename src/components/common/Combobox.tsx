"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"

export interface ComboboxOption {
  value: string
  label: string
  hint?: string
}

interface ComboboxProps {
  id?: string
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  invalid?: boolean
  describedBy?: string
}

// Хайлттай dropdown: товч дээр дарахад жагсаалт нээгдэж, дээр нь хайх талбартай.
// Гараар: ↑/↓ шилжинэ, Enter сонгоно, Esc хаана.
export default function Combobox({
  id,
  options,
  value,
  onChange,
  onBlur,
  placeholder = "Сонгох...",
  searchPlaceholder = "Хайх...",
  emptyText = "Илэрц олдсонгүй",
  className = "",
  invalid,
  describedBy,
}: ComboboxProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = options.find((o) => o.value === value)
  const q = query.trim().toLowerCase()
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q)) : options

  const close = (returnFocus = true) => {
    setOpen(false)
    setQuery("")
    onBlur?.()
    if (returnFocus) rootRef.current?.querySelector<HTMLButtonElement>("button")?.focus()
  }

  const openList = () => {
    setOpen(true)
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
  }

  // Гадна дарахад хаана
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  })

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  // Идэвхтэй мөрийг харагдах хэсэгт байлгана
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [open, active])

  const choose = (option: ComboboxOption) => {
    onChange(option.value)
    close()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filtered[active]) choose(filtered[active])
    } else if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      close()
    } else if (e.key === "Tab") {
      close(false)
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            openList()
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-describedby={describedBy}
        className={`w-full h-12 flex items-center justify-between gap-2 rounded-xl border bg-gray-50 px-4 text-left text-sm outline-none transition focus:bg-white focus:ring-2 ${
          invalid
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
            : open
              ? "border-orange-500 bg-white ring-2 ring-orange-500/15"
              : "border-gray-200 focus:border-orange-500 focus:ring-orange-500/15"
        }`}
      >
        <span className={`truncate ${selected ? "text-gray-900" : "text-gray-400"}`}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined}
                aria-autocomplete="list"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/15"
              />
            </div>
          </div>
          <ul ref={listRef} id={listId} role="listbox" className="max-h-64 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-gray-400">{emptyText}</li>
            ) : (
              filtered.map((option, i) => {
                const isSelected = option.value === value
                return (
                  <li
                    key={option.value}
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(option)}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm cursor-pointer ${
                      i === active ? "bg-orange-50 text-orange-700" : "text-gray-700"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className={`block truncate ${isSelected ? "font-semibold" : ""}`}>{option.label}</span>
                      {option.hint && <span className="block text-xs text-gray-400 truncate">{option.hint}</span>}
                    </span>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-orange-600" aria-hidden="true" />}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
