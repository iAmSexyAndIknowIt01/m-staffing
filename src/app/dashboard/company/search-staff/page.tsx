"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Briefcase, User, UserCheck, SlidersHorizontal, X } from "lucide-react"
import Link from "next/link"
import LoadingLayout from "@/components/common/LoadingLayout"
import EmptyState from "@/components/common/EmptyState"
import Select from "@/components/common/Select"

interface Staff {
  id: string
  fullName: string
  gender: string
  experienceYears: number
  role: string
  location: string
  skills?: {
    technical?: string[]
    languages?: string[]
  }
  avatarUrl: string
  agreement: boolean
}

// Долоо хоногийн өдрүүд (API рүү англи нэрээр нь явуулна)
const DAYS_OF_WEEK = [
  { label: "Даваа", value: "monday" },
  { label: "Мягмар", value: "tuesday" },
  { label: "Лхагва", value: "wednesday" },
  { label: "Пүрэв", value: "thursday" },
  { label: "Баасан", value: "friday" },
  { label: "Бямба", value: "saturday" },
  { label: "Ням", value: "sunday" },
]

// Ажиллах цагийн сонголт (06:00–22:00); API "HH:MM" хэлбэрээр хүлээж авна
const HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 6).padStart(2, "0")}:00`)

const inputClass =
  "w-full h-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15 transition"

export default function SearchStaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Хайлтын төлөвүүд
  const [nameQuery, setNameQuery] = useState("")
  const [skillQuery, setSkillQuery] = useState("")
  const [positionQuery, setPositionQuery] = useState("")
  const [fieldQuery, setFieldQuery] = useState("")
  const [genderFilter, setGenderFilter] = useState("Бүгд")
  const [minExp, setMinExp] = useState(0)

  // Шинэ: Цаг болон өдрийн шүүлтүүр
  const [selectedDay, setSelectedDay] = useState("")
  const [filterTime, setFilterTime] = useState("") // Жишээ нь: "10:00"
  const [showFilters, setShowFilters] = useState(false)

  const activeFilterCount = [skillQuery, positionQuery, fieldQuery, selectedDay, filterTime].filter(Boolean).length +
    (genderFilter !== "Бүгд" ? 1 : 0) + (minExp > 0 ? 1 : 0)

  const resetFilters = () => {
    setSkillQuery("")
    setPositionQuery("")
    setFieldQuery("")
    setGenderFilter("Бүгд")
    setMinExp(0)
    setSelectedDay("")
    setFilterTime("")
  }

  useEffect(() => {
    async function fetchStaffs() {
      try {
        setLoading(true)
        
        const params = new URLSearchParams()
        if (nameQuery) params.append("name", nameQuery)
        if (skillQuery) params.append("skill", skillQuery)
        if (positionQuery) params.append("position", positionQuery)
        if (fieldQuery) params.append("field", fieldQuery)
        if (genderFilter !== "Бүгд") params.append("gender", genderFilter)
        if (minExp > 0) params.append("minExp", minExp.toString())
        
        // Шинэ параметрүүдийг нэмэх
        if (selectedDay) params.append("day", selectedDay)
        if (filterTime) params.append("time", filterTime)

        const res = await fetch(`/api/company/searchStaff?${params.toString()}`)
        const data = await res.json()

        if (data.success) {
          setStaffList(data.staff || [])
        } else {
          console.error("Мэдээлэл авахад алдаа гарлаа:", data.error)
          setStaffList([])
        }
      } catch (err) {
        console.error("API дуудахад алдаа гарлаа:", err)
        setStaffList([])
      } finally {
        setLoading(false)
        setIsInitialLoad(false)
      }
    }

    const timer = setTimeout(() => {
      fetchStaffs()
    }, 300)

    return () => clearTimeout(timer)
  }, [nameQuery, skillQuery, positionQuery, fieldQuery, genderFilter, minExp, selectedDay, filterTime])

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
            <option value="Бүгд">Бүх хүйс</option>
            <option value="Эрэгтэй">Эрэгтэй</option>
            <option value="Эмэгтэй">Эмэгтэй</option>
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
      <div className="mb-4">
        <h2 className="font-bold text-gray-800 text-base sm:text-lg">
          Илэрсэн ажилчид <span className="text-orange-500 font-bold">({staffList.length})</span>
        </h2>
      </div>

      {/* List Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden min-h-50">
        {loading ? (
          <LoadingLayout loading={true} />
        ) : staffList.length > 0 ? (
          staffList.map((staff) => (
            <div key={staff.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-3.5 sm:gap-4 w-full">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-50 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                  {staff.avatarUrl ? (
                    <img src={staff.avatarUrl} alt={staff.fullName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base sm:text-lg font-bold text-orange-600">{staff.fullName?.charAt(0) || "?"}</span>
                  )}
                </div>

                <div className="space-y-2 w-full overflow-hidden">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate max-w-full">{staff.fullName}</h3>
                    <span className="text-xs sm:text-xs font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 bg-amber-50 text-amber-700 rounded-full">
                      {staff.role}
                    </span>
                    <span className="text-xs sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-50 text-emerald-600 rounded-full">
                      Идэвхтэй
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap pt-0.5">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-gray-100">
                      <MapPin size={14} className="text-gray-400 shrink-0" /> 
                      <span className="truncate">{staff.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-gray-100">
                      <User size={14} className="text-gray-400 shrink-0" /> 
                      <span>{staff.gender}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-gray-100">
                      <Briefcase size={14} className="text-gray-400 shrink-0" /> 
                      <span>{staff.experienceYears} жил</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {staff.skills?.technical?.map((tech, idx) => (
                      <span key={idx} className="text-xs sm:text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <Link 
                  href={`/dashboard/company/search-staff/profile?id=${staff.id}`}
                  className="w-full sm:w-auto justify-center px-5 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck size={16} /> Профайл үзэх
                </Link>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            illustration="search"
            title="Хайлтад тохирох ажилтан олдсонгүй"
            description="Шүүлтүүрээ өөрчилж эсвэл хайлтын үгээ товчилж дахин оролдоно уу."
            className="border-0"
          />
        )}
      </div>
    </div>
  )
}