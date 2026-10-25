"use client"

import { Code2, Languages, Loader2, Plus, Search, X, type LucideIcon } from "lucide-react"
import { useEffect, useId, useState } from "react"

type Skills = {
  technical: string[]
  languages: string[]
}

type Props = {
  open: boolean
  value: Skills
  onSave: (value: Skills) => void
  onClose: () => void
}

type SkillType = "technical" | "languages"

// Сервер зөвхөн mt_skill-д бүртгэлтэй ур чадварыг хадгалдаг тул жагсаалтаас сонгуулна
async function fetchSkills(type: SkillType, q: string): Promise<string[]> {
  try {
    const response = await fetch(`/api/skills?q=${encodeURIComponent(q)}&type=${type}`)
    const data = await response.json()
    return Array.isArray(data) ? data.map((item: { skill_name: string }) => item.skill_name) : []
  } catch {
    return []
  }
}

const TONES = {
  orange: {
    icon: "bg-orange-50 text-orange-600",
    chip: "bg-orange-50 text-orange-700 border-orange-200",
    chipX: "hover:bg-orange-100",
    active: "bg-orange-50 text-orange-700",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    chipX: "hover:bg-emerald-100",
    active: "bg-emerald-50 text-emerald-700",
  },
}

function SkillPicker({
  type,
  title,
  hint,
  placeholder,
  icon: Icon,
  tone,
  selected,
  onChange,
}: {
  type: SkillType
  title: string
  hint: string
  placeholder: string
  icon: LucideIcon
  tone: keyof typeof TONES
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const styles = TONES[tone]
  const listId = useId()
  const [input, setInput] = useState("")
  const [results, setResults] = useState<string[]>([])
  const [popular, setPopular] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const query = input.trim()

  // Хайлтгүй үед харуулах санал болгох ур чадварууд
  useEffect(() => {
    let active = true
    fetchSkills(type, "").then((list) => active && setPopular(list))
    return () => {
      active = false
    }
  }, [type])

  useEffect(() => {
    if (!query) return
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      const list = await fetchSkills(type, query)
      if (!active) return
      setResults(list)
      setHighlight(0)
      setLoading(false)
    }, 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, type])

  const suggestions = query ? results.filter((s) => !selected.includes(s)) : []
  const quickPicks = popular.filter((s) => !selected.includes(s)).slice(0, 8)
  const showDropdown = open && !!query

  const add = (skill: string) => {
    if (!selected.includes(skill)) onChange([...selected, skill])
    setInput("")
    setResults([])
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, Math.max(suggestions.length - 1, 0)))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const pick = suggestions[highlight]
      if (pick) add(pick)
    } else if (e.key === "Escape" && showDropdown) {
      // Модалыг хаахгүйгээр зөвхөн жагсаалтыг хаана (модалын сонсогч defaultPrevented-ийг алгасна)
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${styles.icon}`}>
          <Icon className="w-4.5 h-4.5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900">
            {title} <span className="text-gray-400 font-normal">({selected.length})</span>
          </h3>
          <p className="text-xs text-gray-500">{hint}</p>
        </div>
      </div>

      {/* ХАЙЛТ */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-orange-500 transition"
        />
        {loading && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}

        {showDropdown && !loading && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-10 left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1"
          >
            {suggestions.length > 0 ? (
              suggestions.map((skill, i) => (
                <li key={skill} role="option" aria-selected={i === highlight}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(skill)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${
                      i === highlight ? styles.active : "text-gray-700"
                    }`}
                  >
                    <span className="truncate">{skill}</span>
                    <Plus className="w-4 h-4 shrink-0 opacity-60" />
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-sm text-gray-500">
                «{query}» олдсонгүй. Өөр үгээр хайж үзнэ үү.
              </li>
            )}
          </ul>
        )}
      </div>

      {/* СОНГОСОН */}
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((skill) => (
            <span key={skill} className={`inline-flex items-center gap-1 pl-3 pr-1 h-9 rounded-full border text-sm font-medium ${styles.chip}`}>
              {skill}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s !== skill))}
                aria-label={`${skill} хасах`}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition ${styles.chipX}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400">
          Одоогоор сонгоогүй байна.
        </p>
      )}

      {/* ШУУД НЭМЭХ */}
      {quickPicks.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Санал болгох</p>
          <div className="flex flex-wrap gap-2">
            {quickPicks.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => add(skill)}
                className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-dashed border-gray-300 text-sm text-gray-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition"
              >
                <Plus className="w-3.5 h-3.5" /> {skill}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function SkillsModalContent({ value, onSave, onClose }: Props) {
  const [technical, setTechnical] = useState<string[]>(value.technical || [])
  const [languages, setLanguages] = useState<string[]>(value.languages || [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  const total = technical.length + languages.length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="skills-modal-title"
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        {/* ТОЛГОЙ */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 id="skills-modal-title" className="text-xl font-bold text-gray-900">Ур чадвар удирдах</h2>
            <p className="text-xs text-gray-400 mt-0.5">Нийт {total} ур чадвар сонгосон байна</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-100 flex items-center justify-center text-gray-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* БӨДӨН */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <SkillPicker
            type="technical"
            title="Ур чадвар"
            hint="Хайгаад жагсаалтаас сонгоно уу."
            placeholder="Жишээ нь: Excel, Касс, Жолоо..."
            icon={Code2}
            tone="orange"
            selected={technical}
            onChange={setTechnical}
          />
          <SkillPicker
            type="languages"
            title="Хэлний мэдлэг"
            hint="Эзэмшсэн гадаад хэлээ сонгоно уу."
            placeholder="Жишээ нь: Англи, Япон..."
            icon={Languages}
            tone="emerald"
            selected={languages}
            onChange={setLanguages}
          />
        </div>

        {/* ХӨЛ */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
          >
            Хаах
          </button>
          <button
            type="button"
            disabled={total === 0}
            onClick={() => {
              onSave({ technical, languages })
              onClose()
            }}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            <span className="sm:hidden">Хадгалах</span>
            <span className="hidden sm:inline">Өөрчлөлтийг баталгаажуулж хадгалах</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Модал нээгдэх бүрд дотоод state-ийг props-оос шинээр эхлүүлэхийн тулд зөвхөн нээлттэй үед mount хийнэ
export default function SkillsModal(props: Props) {
  if (!props.open) return null
  return <SkillsModalContent {...props} />
}
