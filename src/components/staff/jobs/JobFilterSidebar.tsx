"use client"

import { useMemo, useState } from "react"
import { CalendarClock, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react"
import { JOB_TYPE_OPTIONS, getJobCategoryLabel } from "@/lib/jobPost"

interface FilterableJob {
  job_type: string
  category: string
  is_applied: boolean
}

interface JobFilterSidebarProps {
  jobs: FilterableJob[]
  searchQuery: string
  setSearchQuery: (val: string) => void
  selectedCategory: string
  setSelectedCategory: (val: string) => void
  selectedJobType: string
  setSelectedJobType: (val: string) => void
  filterApplied: string
  setFilterApplied: (val: string) => void
  categories: string[]
  fitSchedule: boolean
  fitCount: number
  onToggleFit: () => void
  onClearFit: () => void
}

const CATEGORY_PREVIEW = 6

const APPLIED_OPTIONS = [
  { value: "all", label: "Бүгд" },
  { value: "not_applied", label: "Илгээгээгүй" },
  { value: "applied", label: "Илгээсэн" },
]

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="px-5 py-4 border-t border-gray-100 first:border-t-0">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function OptionRow({
  label,
  count,
  selected,
  onClick,
}: {
  label: string
  count: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition cursor-pointer ${
        selected ? "bg-orange-50 text-orange-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
            selected ? "border-orange-600" : "border-gray-300"
          }`}
          aria-hidden="true"
        >
          {selected && <span className="h-2 w-2 rounded-full bg-orange-600" />}
        </span>
        <span className="truncate">{label}</span>
      </span>
      <span className={`shrink-0 text-xs tabular-nums ${selected ? "text-orange-600" : "text-gray-400"}`}>{count}</span>
    </button>
  )
}

// Том дэлгэцэд ажлын жагсаалтын зүүн талд байрлах шүүлтүүр (утсан дээр JobFilterBar)
export default function JobFilterSidebar({
  jobs,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedJobType,
  setSelectedJobType,
  filterApplied,
  setFilterApplied,
  categories,
  fitSchedule,
  fitCount,
  onToggleFit,
  onClearFit,
}: JobFilterSidebarProps) {
  const [showAllCategories, setShowAllCategories] = useState(false)

  const counts = useMemo(() => {
    const type: Record<string, number> = {}
    const category: Record<string, number> = {}
    let applied = 0
    let inType = 0
    for (const job of jobs) {
      type[job.job_type] = (type[job.job_type] ?? 0) + 1
      if (job.is_applied) applied++
      // Ангиллын тоо зөвхөн сонгосон ажлын төрлийн зараас
      if (selectedJobType && job.job_type !== selectedJobType) continue
      inType++
      const key = job.category?.trim().toLowerCase()
      if (key) category[key] = (category[key] ?? 0) + 1
    }
    return { type, category, inType, applied: { all: jobs.length, applied, not_applied: jobs.length - applied } as Record<string, number> }
  }, [jobs, selectedJobType])

  // Зар байгаа төрлүүд (сонгосон нь 0 байсан ч харагдана)
  const jobTypes = JOB_TYPE_OPTIONS.filter((t) => counts.type[t.value] || selectedJobType === t.value)

  // Олон зартай ангилал эхэнд; сонгосон ангилал нуугдахгүй
  const sortedCategories = [...categories].sort((a, b) => (counts.category[b] ?? 0) - (counts.category[a] ?? 0))
  const selectedIndex = sortedCategories.findIndex((c) => c === selectedCategory.toLowerCase())
  const visibleCategories =
    showAllCategories || selectedIndex >= CATEGORY_PREVIEW ? sortedCategories : sortedCategories.slice(0, CATEGORY_PREVIEW)

  const activeCount =
    (searchQuery.trim() ? 1 : 0) + (selectedCategory ? 1 : 0) + (selectedJobType ? 1 : 0) + (filterApplied !== "all" ? 1 : 0) + (fitSchedule ? 1 : 0)

  const clearAll = () => {
    setSearchQuery("")
    setSelectedCategory("")
    setSelectedJobType("")
    setFilterApplied("all")
    onClearFit()
  }

  return (
    <aside aria-label="Шүүлтүүр" className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <SlidersHorizontal className="w-4 h-4 text-orange-600" aria-hidden="true" /> Шүүлтүүр
          {activeCount > 0 && (
            <span className="rounded-full bg-orange-600 px-1.5 py-0.5 text-xs font-bold leading-none text-white tabular-nums">{activeCount}</span>
          )}
        </h2>
        {activeCount > 0 && (
          <button type="button" onClick={clearAll} className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer">
            Бүгдийг цэвэрлэх
          </button>
        )}
      </div>

      {/* Хайлт */}
      <div className="px-5 pb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            aria-label="Ажил хайх"
            placeholder="Нэр, компани, байршил..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Хайлтыг арилгах"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Цагаар хайх */}
      <div className="px-5 pb-4">
        <button
          type="button"
          role="switch"
          aria-checked={fitSchedule}
          onClick={onToggleFit}
          className={`w-full flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition cursor-pointer ${
            fitSchedule ? "border-orange-300 bg-orange-50" : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/40"
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <CalendarClock className="w-4.5 h-4.5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-gray-900">Цагаар хайх</span>
            <span className="block text-xs text-gray-500">
              {fitSchedule && fitCount > 0 ? `${fitCount} хагас цагийн ажил тохирно` : "Хагас цагийн ажлыг өдөр, цагаар"}
            </span>
          </span>
          <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${fitSchedule ? "bg-orange-600" : "bg-gray-300"}`} aria-hidden="true">
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${fitSchedule ? "translate-x-4" : ""}`} />
          </span>
        </button>
      </div>

      <div>
        <Section title="Анкет">
          <div role="radiogroup" aria-label="Анкет илгээсэн эсэх" className="grid grid-cols-3 gap-1 rounded-xl bg-gray-50 p-1">
            {APPLIED_OPTIONS.map((opt) => {
              const active = filterApplied === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setFilterApplied(opt.value)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    active ? "bg-white text-orange-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {opt.label}
                  <span className="block text-xs font-medium text-gray-400 tabular-nums">{counts.applied[opt.value]}</span>
                </button>
              )
            })}
          </div>
        </Section>
      </div>

      {jobTypes.length > 0 && (
        <Section title="Ажлын төрөл">
          <div role="radiogroup" aria-label="Ажлын төрөл" className="space-y-0.5">
            <OptionRow label="Бүх төрөл" count={jobs.length} selected={!selectedJobType} onClick={() => setSelectedJobType("")} />
            {jobTypes.map((t) => (
              <OptionRow
                key={t.value}
                label={t.label}
                count={counts.type[t.value] ?? 0}
                selected={selectedJobType === t.value}
                onClick={() => setSelectedJobType(selectedJobType === t.value ? "" : t.value)}
              />
            ))}
          </div>
        </Section>
      )}

      {sortedCategories.length > 0 && (
        <Section title={selectedJobType ? `Ангилал · ${JOB_TYPE_OPTIONS.find((t) => t.value === selectedJobType)?.label ?? ""}` : "Ангилал"}>
          <div role="radiogroup" aria-label="Ангилал" className="space-y-0.5">
            <OptionRow label="Бүх ангилал" count={counts.inType} selected={!selectedCategory} onClick={() => setSelectedCategory("")} />
            {visibleCategories.map((cat) => {
              const selected = selectedCategory.toLowerCase() === cat
              return (
                <OptionRow
                  key={cat}
                  label={getJobCategoryLabel(cat)}
                  count={counts.category[cat] ?? 0}
                  selected={selected}
                  onClick={() => setSelectedCategory(selected ? "" : cat)}
                />
              )
            })}
          </div>
          {sortedCategories.length > CATEGORY_PREVIEW && visibleCategories.length !== sortedCategories.length && (
            <button
              type="button"
              onClick={() => setShowAllCategories(true)}
              className="mt-1.5 inline-flex items-center gap-1 px-3 text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              Бүгдийг харах (+{sortedCategories.length - visibleCategories.length})
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </Section>
      )}
    </aside>
  )
}
