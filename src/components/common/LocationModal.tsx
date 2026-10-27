"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronLeft, ChevronRight, Loader2, MapPin, RotateCw, Search, X } from "lucide-react"
import { useIsClient } from "@/lib/useIsClient"

type Location = { id: number; name: string; parent_id: number | null }

// Байршлын жагсаалт ховор өөрчлөгддөг тул нээх бүрт дахин татахгүй
let cachedLocations: Location[] | null = null

const SEPARATOR = " / "

// Улаанбаатар эхэнд, бусад нь цагаан толгойн дарааллаар
function sortLocations(list: Location[]) {
  return [...list].sort((a, b) => {
    if (a.name === "Улаанбаатар") return -1
    if (b.name === "Улаанбаатар") return 1
    return a.name.localeCompare(b.name, "mn")
  })
}

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  // "Аймаг/Хот" эсвэл "Аймаг/Хот / Сум/Дүүрэг" хэлбэрийн нэр
  onSelect: (name: string) => void
  // Одоо сонгогдсон утга (тэмдэглэж харуулна)
  value?: string
}

export default function LocationModal({ isOpen, onClose, onSelect, value = "" }: LocationModalProps) {
  if (!isOpen) return null
  // Нээх бүрт хайлт, алхам шинэчлэгдэхийн тулд дотоод компонентыг тусад нь mount хийнэ
  return <LocationPicker onClose={onClose} onSelect={onSelect} value={value} />
}

function LocationPicker({ onClose, onSelect, value }: Omit<LocationModalProps, "isOpen"> & { value: string }) {
  const isClient = useIsClient()
  const [locations, setLocations] = useState<Location[]>(cachedLocations ?? [])
  const [status, setStatus] = useState<"loading" | "ready" | "error">(cachedLocations ? "ready" : "loading")
  const [reloadKey, setReloadKey] = useState(0)
  const [query, setQuery] = useState("")
  // Одоо сонгогдсон аймаг/хотын доторх сум/дүүрэг рүү шууд орно
  const [parentId, setParentId] = useState<number | null>(null)
  const [initialized, setInitialized] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const [selectedParentName, selectedChildName] = value.split(SEPARATOR)

  useEffect(() => {
    if (cachedLocations) return
    let cancelled = false
    fetch("/api/locations")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return
        cachedLocations = (data.data ?? []) as Location[]
        setLocations(cachedLocations)
        setStatus("ready")
      })
      .catch(() => {
        if (!cancelled) setStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  useEffect(() => {
    // Mobile дээр гар гарч ирээд жагсаалтыг хаахгүйн тулд зөвхөн том дэлгэцэнд автоматаар фокуслана
    if (window.matchMedia("(min-width: 640px)").matches) searchRef.current?.focus()
  }, [])

  const parents = useMemo(() => sortLocations(locations.filter((l) => l.parent_id === null)), [locations])
  const childrenOf = useMemo(() => {
    const map = new Map<number, Location[]>()
    for (const l of locations) {
      if (l.parent_id === null) continue
      map.set(l.parent_id, [...(map.get(l.parent_id) ?? []), l])
    }
    for (const [k, v] of map) map.set(k, sortLocations(v))
    return map
  }, [locations])

  // Өмнө сонгосон аймаг/хот байвал түүний дотор нээнэ (өгөгдөл ачаалагдсаны дараа нэг удаа)
  if (status === "ready" && !initialized) {
    setInitialized(true)
    const parent = parents.find((p) => p.name === selectedParentName)
    if (parent && childrenOf.has(parent.id) && selectedChildName) setParentId(parent.id)
  }

  const currentParent = parentId !== null ? locations.find((l) => l.id === parentId) ?? null : null
  const q = query.trim().toLowerCase()

  // Хайлт: аймаг/хот болон сум/дүүрэг хоёуланд нь
  const searchResults = useMemo(() => {
    if (!q) return []
    const byId = new Map(locations.map((l) => [l.id, l]))
    return sortLocations(locations.filter((l) => l.name.toLowerCase().includes(q)))
      .map((l) => ({ loc: l, parent: l.parent_id !== null ? byId.get(l.parent_id) ?? null : null }))
      .slice(0, 50)
  }, [q, locations])

  const pick = (loc: Location, parent: Location | null) => {
    onSelect(parent ? `${parent.name}${SEPARATOR}${loc.name}` : loc.name)
  }

  const isSelected = (loc: Location, parent: Location | null) =>
    parent ? selectedParentName === parent.name && selectedChildName === loc.name : selectedParentName === loc.name && !selectedChildName

  const row = (loc: Location, parent: Location | null, opts: { drill?: boolean; sub?: string } = {}) => {
    const selected = isSelected(loc, parent)
    const containsSelection = !parent && opts.drill && selectedParentName === loc.name
    return (
      <li key={`${parent?.id ?? "p"}-${loc.id}`}>
        <button
          type="button"
          onClick={() => (opts.drill ? (setParentId(loc.id), setQuery("")) : pick(loc, parent))}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition ${
            selected ? "bg-orange-50 text-orange-700" : "hover:bg-gray-50 text-gray-800"
          }`}
        >
          <span
            className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${
              selected || containsSelection ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
            }`}
          >
            <MapPin className="w-4 h-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-sm ${selected ? "font-semibold" : "font-medium"}`}>{loc.name}</span>
            {opts.sub && <span className="block truncate text-xs text-gray-400">{opts.sub}</span>}
          </span>
          {selected ? (
            <Check className="w-4 h-4 shrink-0 text-orange-600" aria-label="Сонгосон" />
          ) : opts.drill ? (
            <ChevronRight className="w-4 h-4 shrink-0 text-gray-300" aria-hidden="true" />
          ) : null}
        </button>
      </li>
    )
  }

  let body: React.ReactNode
  if (status === "loading") {
    body = (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" /> Байршлын жагсаалтыг ачаалж байна...
      </div>
    )
  } else if (status === "error") {
    body = (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-gray-500">
        Жагсаалтыг ачаалж чадсангүй.
        <button
          type="button"
          onClick={() => {
            setStatus("loading")
            setReloadKey((k) => k + 1)
          }}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-orange-50 text-orange-700 font-semibold hover:bg-orange-100"
        >
          <RotateCw className="w-4 h-4" /> Дахин оролдох
        </button>
      </div>
    )
  } else if (q) {
    body =
      searchResults.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">«{query.trim()}» нэртэй байршил олдсонгүй</p>
      ) : (
        <ul className="space-y-0.5">
          {searchResults.map(({ loc, parent }) =>
            row(loc, parent, {
              drill: !parent && childrenOf.has(loc.id),
              sub: parent ? parent.name : childrenOf.has(loc.id) ? `${childrenOf.get(loc.id)!.length} сум/дүүрэг` : undefined,
            })
          )}
        </ul>
      )
  } else if (currentParent) {
    body = (
      <ul className="space-y-0.5">
        {row(currentParent, null, { sub: "Бүх сум/дүүрэг" })}
        <li aria-hidden="true" className="my-1 border-t border-gray-100" />
        {(childrenOf.get(currentParent.id) ?? []).map((child) => row(child, currentParent))}
      </ul>
    )
  } else {
    body = (
      <ul className="space-y-0.5">
        {parents.map((p) =>
          row(p, null, {
            drill: childrenOf.has(p.id),
            sub: childrenOf.has(p.id) ? `${childrenOf.get(p.id)!.length} сум/дүүрэг` : undefined,
          })
        )}
      </ul>
    )
  }

  if (!isClient) return null

  return createPortal(
    <div
      className="fixed inset-0 z-100000 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
        className="relative w-full sm:max-w-md h-[85dvh] sm:h-[min(640px,85dvh)] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" aria-hidden="true" />

        {/* Толгой */}
        <div className="px-5 pt-4 sm:pt-5 pb-3 flex items-center gap-2">
          {currentParent && !q ? (
            <button
              type="button"
              onClick={() => setParentId(null)}
              aria-label="Аймаг, хот руу буцах"
              className="w-9 h-9 -ml-2 shrink-0 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600">
              <MapPin className="w-5 h-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 id="location-modal-title" className="text-base font-semibold text-gray-900 truncate">
              {currentParent && !q ? currentParent.name : "Ажиллах байршил"}
            </h3>
            <p className="text-xs text-gray-400 truncate">
              {currentParent && !q ? "Сум/дүүргээ сонгоно уу" : "Аймаг, хот эсвэл сум, дүүргээ сонгоно уу"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Хайлт */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Хайх (жишээ: Сүхбаатар, Дархан)"
              aria-label="Байршил хайх"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
            />
          </div>
          {value && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 truncate">
              <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" /> Сонгосон: <span className="font-semibold text-gray-700 truncate">{value}</span>
            </p>
          )}
        </div>

        {/* Жагсаалт */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 border-t border-gray-100 pt-2">{body}</div>
      </div>
    </div>,
    document.body
  )
}
