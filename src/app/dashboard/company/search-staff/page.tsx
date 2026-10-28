"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Briefcase, CalendarDays, ChevronRight, Loader2, RotateCw, Search, SlidersHorizontal, User, X } from "lucide-react"
import Link from "next/link"
import LoadingLayout from "@/components/common/LoadingLayout"
import EmptyState from "@/components/common/EmptyState"
import Select from "@/components/common/Select"

interface Staff {
  id: string
  fullName: string
  gender: "male" | "female" | null
  experienceYears: number
  hasExperience: boolean
  headline: string | null
  headlineCompany: string | null
  isCurrent: boolean
  availableDays: string[]
  skills?: {
    technical?: string[]
    languages?: string[]
  }
  avatarUrl: string
}

const GENDER_LABELS: Record<string, string> = { male: "Эрэгтэй", female: "Эмэгтэй" }
const MAX_SKILLS = 4

// Долоо хоногийн өдрүүд (API рүү англи нэрээр нь явуулна)
const DAYS_OF_WEEK = [
  { label: "Даваа", short: "Да", value: "monday" },
  { label: "Мягмар", short: "Мя", value: "tuesday" },
  { label: "Лхагва", short: "Лх", value: "wednesday" },
  { label: "Пүрэв", short: "Пү", value: "thursday" },
  { label: "Баасан", short: "Ба", value: "friday" },
  { label: "Бямба", short: "Бя", value: "saturday" },
  { label: "Ням", short: "Ня", value: "sunday" },
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0]?.slice(0, 2) || "?").toUpperCase()
}

function experienceLabel(staff: Staff) {
  if (staff.experienceYears > 0) return `${staff.experienceYears} жил туршлага`
  return staff.hasExperience ? "1 жилээс бага туршлага" : null
}

function StaffCard({ staff }: { staff: Staff }) {
  const technical = staff.skills?.technical?.filter(Boolean) ?? []
  const experience = experienceLabel(staff)
  const gender = staff.gender ? GENDER_LABELS[staff.gender] : null
  const available = new Set(staff.availableDays)
  const isSparse = !staff.headline && !gender && !experience && technical.length === 0 && available.size === 0

  return (
    <Link
      href={`/dashboard/company/search-staff/profile?id=${staff.id}`}
      className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 hover:border-orange-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden">
          {staff.avatarUrl ? (
            <img src={staff.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          ) : (
            <span className="text-base font-bold text-orange-600">{initials(staff.fullName)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate group-hover:text-orange-700 transition-colors">
            {staff.fullName || "Нэргүй"}
          </h3>
          {staff.headline && (
            <p className="mt-0.5 text-sm text-gray-600 truncate">
              {staff.headline}
              {staff.headlineCompany && <span className="text-gray-400"> · {staff.headlineCompany}</span>}
              {staff.isCurrent && <span className="ml-1.5 text-xs font-semibold text-emerald-600">Одоо</span>}
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 shrink-0 text-gray-300 group-hover:text-orange-500 transition-colors" aria-hidden="true" />
      </div>

      {isSparse && <p className="mt-3 text-sm text-gray-400">Профайлын дэлгэрэнгүй мэдээллээ оруулаагүй байна.</p>}

      {(gender || experience) && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600">
          {gender && (
            <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
              <User className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" /> {gender}
            </span>
          )}
          {experience && (
            <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
              <Briefcase className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" /> {experience}
            </span>
          )}
        </div>
      )}

      {technical.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Ур чадвар">
          {technical.slice(0, MAX_SKILLS).map((tech) => (
            <li key={tech} className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md font-medium">{tech}</li>
          ))}
          {technical.length > MAX_SKILLS && (
            <li className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-md font-medium">+{technical.length - MAX_SKILLS}</li>
          )}
        </ul>
      )}

      {available.size > 0 && (
        <div className="mt-auto pt-4 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 shrink-0 text-gray-400" aria-hidden="true" />
          <span className="sr-only">Ажиллах боломжтой өдөр: {DAYS_OF_WEEK.filter((d) => available.has(d.value)).map((d) => d.label).join(", ")}</span>
          <div className="flex gap-1" aria-hidden="true">
            {DAYS_OF_WEEK.map((d) => (
              <span
                key={d.value}
                className={`w-7 h-6 rounded-md text-[11px] font-semibold flex items-center justify-center ${
                  available.has(d.value) ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-300"
                }`}
              >
                {d.short}
              </span>
            ))}
          </div>
        </div>
      )}
    </Link>
  )
}

// Ажиллах цагийн сонголт (06:00–22:00); API "HH:MM" хэлбэрээр хүлээж авна
const HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 6).padStart(2, "0")}:00`)

const inputClass =
  "w-full h-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15 transition"

export default function SearchStaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  
  // Хайлтын төлөвүүд
  const [nameQuery, setNameQuery] = useState("")
  const [skillQuery, setSkillQuery] = useState("")
  const [positionQuery, setPositionQuery] = useState("")
  const [fieldQuery, setFieldQuery] = useState("")
  const [genderFilter, setGenderFilter] = useState("")
  const [minExp, setMinExp] = useState(0)

  // Шинэ: Цаг болон өдрийн шүүлтүүр
  const [selectedDay, setSelectedDay] = useState("")
  const [filterTime, setFilterTime] = useState("") // Жишээ нь: "10:00"
  const [showFilters, setShowFilters] = useState(false)

  const activeFilterCount = [skillQuery, positionQuery, fieldQuery, selectedDay, filterTime].filter(Boolean).length +
    (genderFilter ? 1 : 0) + (minExp > 0 ? 1 : 0)

  const resetFilters = () => {
    setSkillQuery("")
    setPositionQuery("")
    setFieldQuery("")
    setGenderFilter("")
    setMinExp(0)
    setSelectedDay("")
    setFilterTime("")
  }

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    if (nameQuery) params.append("name", nameQuery)
    if (skillQuery) params.append("skill", skillQuery)
    if (positionQuery) params.append("position", positionQuery)
    if (fieldQuery) params.append("field", fieldQuery)
    if (genderFilter) params.append("gender", genderFilter)
    if (minExp > 0) params.append("minExp", minExp.toString())
    if (selectedDay) params.append("day", selectedDay)
    if (filterTime) params.append("time", filterTime)

    // Бичих бүрт биш, 300ms зогссоны дараа хайна. Өмнөх үр дүнг хайлтын үеэр харуулсаар байна.
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/company/searchStaff?${params.toString()}`)
        const data = await res.json()
        if (cancelled) return
        if (!res.ok || !data.success) throw new Error(data.error || "Мэдээлэл авахад алдаа гарлаа.")
        setStaffList(data.staff || [])
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Сүлжээний алдаа гарлаа.")
      } finally {
        if (!cancelled) {
          setLoading(false)
          setIsInitialLoad(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [nameQuery, skillQuery, positionQuery, fieldQuery, genderFilter, minExp, selectedDay, filterTime, reloadKey])

  if (isInitialLoad) {
    return (
      <div className="max-w-6xl mx-auto w-full">
        <LoadingLayout loading={true} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto w-full">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            Ажилтан хайх
          </h1>
          <p className="text-sm text-gray-500 mt-1">Танай байгууллагад хэрэгцээтэй чадварлаг мэргэжилтнүүдийн жагсаалт.</p>
        </div>
      </div>

      {/* ШҮҮЛТҮҮР: нэрийн хайлт үргэлж харагдана, бусад нь mobile дээр нугалагдана */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Нэрээр хайх..."
              value={nameQuery}
              aria-label="Нэрээр хайх"
              className={`${inputClass} pl-10`}
              onChange={(e) => setNameQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="staff-filters"
            className="lg:hidden shrink-0 inline-flex items-center gap-2 h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-orange-300 transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Шүүлтүүр
            {activeFilterCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-orange-600 text-white text-xs font-bold inline-flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div id="staff-filters" className={`${showFilters ? "grid" : "hidden"} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}>
          <input
            type="text"
            placeholder="Ур чадвар (жишээ: React)"
            value={skillQuery}
            aria-label="Ур чадвараар хайх"
            className={`${inputClass} px-4`}
            onChange={(e) => setSkillQuery(e.target.value)}
          />
          <input
            type="text"
            placeholder="Ажиллаж байсан албан тушаал"
            value={positionQuery}
            aria-label="Албан тушаалаар хайх"
            className={`${inputClass} px-4`}
            onChange={(e) => setPositionQuery(e.target.value)}
          />
          <input
            type="text"
            placeholder="Сургуулийн мэргэжил"
            value={fieldQuery}
            aria-label="Мэргэжлээр хайх"
            className={`${inputClass} px-4`}
            onChange={(e) => setFieldQuery(e.target.value)}
          />
          <Select value={genderFilter} aria-label="Хүйс" onChange={(e) => setGenderFilter(e.target.value)}>
            <option value="">Бүх хүйс</option>
            <option value="male">Эрэгтэй</option>
            <option value="female">Эмэгтэй</option>
          </Select>
          <Select value={minExp} aria-label="Туршлага" onChange={(e) => setMinExp(Number(e.target.value))}>
            <option value={0}>Бүх туршлага</option>
            <option value={1}>1+ жил</option>
            <option value={3}>3+ жил</option>
            <option value={5}>5+ жил</option>
          </Select>
          <Select value={selectedDay} aria-label="Ажиллах өдөр" onChange={(e) => setSelectedDay(e.target.value)}>
            <option value="">Ажиллах өдөр: бүгд</option>
            {DAYS_OF_WEEK.map((d) => (
              <option key={d.value} value={d.value}>{d.label} гариг</option>
            ))}
          </Select>
          <Select value={filterTime} aria-label="Ажиллах цаг" onChange={(e) => setFilterTime(e.target.value)}>
            <option value="">Ажиллах цаг: бүгд</option>
            {HOURS.map((h) => (
              <option key={h} value={h}>{h}-д ажиллах боломжтой</option>
            ))}
          </Select>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="h-11 inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition"
            >
              <X className="w-4 h-4" /> Шүүлтүүр цэвэрлэх
            </button>
          )}
        </div>
      </div>

      {/* Нийт илэрц хэсэг */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-bold text-gray-800 text-base sm:text-lg" aria-live="polite">
          Илэрсэн ажилчид {!error && <span className="text-orange-500 font-bold">({staffList.length})</span>}
        </h2>
        {loading && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Хайж байна…
          </span>
        )}
      </div>

      {error ? (
        <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">
          <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</span>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="self-start inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-red-200 bg-white font-semibold hover:bg-red-50"
          >
            <RotateCw className="w-4 h-4" /> Дахин оролдох
          </button>
        </div>
      ) : staffList.length > 0 ? (
        <ul className={`grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {staffList.map((staff) => (
            <li key={staff.id}>
              <StaffCard staff={staff} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState
            illustration="search"
            title="Хайлтад тохирох ажилтан олдсонгүй"
            description={activeFilterCount > 0 || nameQuery ? "Шүүлтүүрээ өөрчилж эсвэл хайлтын үгээ товчилж дахин оролдоно уу." : "Профайлаа нээлттэй болгосон ажил хайгч одоогоор алга."}
            className="border-0"
          />
          {activeFilterCount > 0 && (
            <div className="flex justify-center pb-8 -mt-2">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold"
              >
                <X className="w-4 h-4" /> Шүүлтүүр цэвэрлэх
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}