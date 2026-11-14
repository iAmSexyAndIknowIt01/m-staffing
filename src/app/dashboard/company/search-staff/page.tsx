"use client"

import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle, Briefcase, Cake, CalendarDays, ChevronDown, ChevronRight, Loader2, RotateCw, Search, Send, SlidersHorizontal, User, X } from "lucide-react"
import Link from "next/link"
import LoadingLayout from "@/components/common/LoadingLayout"
import EmptyState from "@/components/common/EmptyState"
import Select from "@/components/common/Select"
import Pagination from "@/components/staff/jobs/Pagination"
import PageHelp from "@/components/common/PageHelp"
import { formatRemaining } from "@/lib/staffContact"

interface Staff {
  id: string
  fullName: string
  gender: "male" | "female" | null
  age: number | null
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
  // Энэ компани хүсэлт илгээсэн эсэх (active — утас, имэйл одоо нээлттэй)
  request: { expiresAt: string; active: boolean } | null
}

const GENDER_LABELS: Record<string, string> = { male: "Эрэгтэй", female: "Эмэгтэй" }

const PAGE_SIZE = 10
const MIN_EXP_OPTIONS = [0, 1, 3, 5]

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

type SkillChip = { name: string; kind: "technical" | "language" }

const SKILL_GAP = 6 // gap-1.5
const skillChipClass = (kind: SkillChip["kind"]) =>
  `whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium ${
    kind === "technical" ? "bg-orange-50 text-orange-700" : "bg-sky-50 text-sky-700"
  }`

// Ур чадварыг яг нэг мөрөнд багтаана: багтах тоог хэмжиж, үлдсэнийг «+N» болгоно.
// Бүтэн жагсаалтыг профайл хуудаснаас харна.
function SkillsLine({ skills }: { skills: SkillChip[] }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLUListElement>(null)
  const [visibleCount, setVisibleCount] = useState(skills.length)

  useLayoutEffect(() => {
    const box = boxRef.current
    const measure = measureRef.current
    if (!box || !measure) return

    const calc = () => {
      const available = box.clientWidth
      const items = Array.from(measure.children) as HTMLElement[]
      const moreWidth = items[items.length - 1]?.offsetWidth ?? 0 // хэмжилтийн «+99» шошго
      const widths = items.slice(0, -1).map((el) => el.offsetWidth)
      let used = 0
      let count = 0
      for (let i = 0; i < widths.length; i++) {
        const next = used + (i > 0 ? SKILL_GAP : 0) + widths[i]
        const needed = i < widths.length - 1 ? next + SKILL_GAP + moreWidth : next
        if (needed > available) break
        used = next
        count = i + 1
      }
      // Нэг ч багтахгүй бол эхнийхийг тайрч харуулна
      setVisibleCount(Math.max(count, 1))
    }

    calc()
    const observer = new ResizeObserver(calc)
    observer.observe(box)
    return () => observer.disconnect()
  }, [skills])

  const shown = skills.slice(0, visibleCount)
  const hidden = skills.length - shown.length

  return (
    <div ref={boxRef} className="relative overflow-hidden">
      {/* Өргөн хэмжих далд хуулбар */}
      <ul ref={measureRef} aria-hidden="true" className="invisible absolute left-0 top-0 flex w-max gap-1.5 pointer-events-none">
        {skills.map((skill) => (
          <li key={`${skill.kind}-${skill.name}`} className={skillChipClass(skill.kind)}>{skill.name}</li>
        ))}
        <li className="whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-semibold">+99</li>
      </ul>

      <ul className="flex flex-nowrap gap-1.5" aria-label={`Ур чадвар: ${skills.map((s) => s.name).join(", ")}`}>
        {shown.map((skill) => (
          <li key={`${skill.kind}-${skill.name}`} className={`min-w-0 truncate ${skillChipClass(skill.kind)}`}>
            {skill.name}
          </li>
        ))}
        {hidden > 0 && (
          <li
            className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500"
            title={skills.slice(visibleCount).map((s) => s.name).join(", ")}
          >
            +{hidden}
          </li>
        )}
      </ul>
    </div>
  )
}

function isRequestActive(request: NonNullable<Staff["request"]>, now: number) {
  return request.active && new Date(request.expiresAt).getTime() > now
}

// Хүсэлт илгээсэн ажилтныг жагсаалтад ялгах тэмдэг (нэрийн хажууд)
function RequestBadge({ request, now }: { request: NonNullable<Staff["request"]>; now: number }) {
  return isRequestActive(request, now) ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
      <Send className="w-3 h-3" aria-hidden="true" /> Хүсэлт илгээсэн · {formatRemaining(request.expiresAt, now)}
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
      <Send className="w-3 h-3" aria-hidden="true" /> Хүсэлт илгээсэн · хугацаа дууссан
    </span>
  )
}

function StaffRow({ staff, backQuery, now }: { staff: Staff; backQuery: string; now: number }) {
  // Техник ур чадварыг эхэнд, дараа нь хэлний мэдлэгийг харуулна
  const allSkills = useMemo<SkillChip[]>(
    () => [
      ...(staff.skills?.technical?.filter(Boolean) ?? []).map((name) => ({ name, kind: "technical" as const })),
      ...(staff.skills?.languages?.filter(Boolean) ?? []).map((name) => ({ name, kind: "language" as const })),
    ],
    [staff.skills]
  )
  const experience = experienceLabel(staff)
  const gender = staff.gender ? GENDER_LABELS[staff.gender] : null
  const available = new Set(staff.availableDays)

  return (
    <Link
      href={`/dashboard/company/search-staff/profile?${new URLSearchParams({ id: staff.id, ...(backQuery ? { back: backQuery } : {}) })}`}
      className="group flex items-start gap-3.5 sm:gap-4 px-4 sm:px-5 py-4 sm:py-5 hover:bg-orange-50/40 focus-visible:outline-none focus-visible:bg-orange-50/60 transition-colors"
    >
      <div className="relative shrink-0 group/avatar">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden">
          {staff.avatarUrl ? (
            <img src={staff.avatarUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          ) : (
            <span className="text-base sm:text-lg font-bold text-orange-600">{initials(staff.fullName)}</span>
          )}
        </div>
        {/* Зурган дээр хулгана аваачихад томорсон зураг гарна (хулганатай төхөөрөмж дээр) */}
        {staff.avatarUrl && (
          <span
            aria-hidden="true"
            className="pointer-events-none invisible absolute left-0 top-0 z-30 w-44 h-44 origin-top-left scale-[0.32] opacity-0 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl ring-1 ring-black/5 transition-[opacity,transform,visibility] duration-200 ease-out group-hover/avatar:visible group-hover/avatar:scale-100 group-hover/avatar:opacity-100 motion-reduce:transition-none"
          >
            <img src={staff.avatarUrl} alt="" decoding="async" className="w-full h-full object-cover" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {/* 1-р мөр: нэр, албан тушаал | (desktop) ажиллах өдрүүд */}
        <div className="md:flex md:items-start md:justify-between md:gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="min-w-0 font-bold text-base text-gray-900 truncate group-hover:text-orange-700 transition-colors">
                {staff.fullName || "Нэргүй"}
              </h3>
              {staff.request && <RequestBadge request={staff.request} now={now} />}
            </div>
            {staff.headline ? (
              <p className="mt-0.5 text-sm text-gray-600 truncate">
                {staff.headline}
                {staff.headlineCompany && <span className="text-gray-400"> · {staff.headlineCompany}</span>}
                {staff.isCurrent && <span className="ml-1.5 text-xs font-semibold text-emerald-600">Одоо ажиллаж байгаа</span>}
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-gray-400">Ажил хайгч</p>
            )}
          </div>

          {available.size > 0 && (
            <div className="mt-2.5 md:mt-0.5 shrink-0 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 shrink-0 text-gray-400 md:hidden" aria-hidden="true" />
              <span className="sr-only">Ажиллах боломжтой өдөр: {DAYS_OF_WEEK.filter((d) => available.has(d.value)).map((d) => d.label).join(", ")}</span>
              <div className="flex gap-1" aria-hidden="true">
                {DAYS_OF_WEEK.map((d) => (
                  <span
                    key={d.value}
                    className={`w-7 h-6 rounded-md text-xs font-semibold flex items-center justify-center ${
                      available.has(d.value) ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-300"
                    }`}
                  >
                    {d.short}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2-р мөр: хүйс, туршлага */}
        {(gender || staff.age !== null || experience) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            {gender && (
              <span className="inline-flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" aria-hidden="true" /> {gender}
              </span>
            )}
            {staff.age !== null && (
              <span className="inline-flex items-center gap-1.5">
                <Cake className="w-4 h-4 text-gray-400" aria-hidden="true" /> {staff.age} нас
              </span>
            )}
            {experience && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-gray-400" aria-hidden="true" /> {experience}
              </span>
            )}
          </div>
        )}

        {/* Хамгийн доод мөр: ур чадвар */}
        <div className="mt-3">
          {allSkills.length > 0 ? (
            <SkillsLine skills={allSkills} />
          ) : (
            <p className="text-xs text-gray-400">Ур чадвар оруулаагүй</p>
          )}
        </div>
      </div>

      <ChevronRight className="w-5 h-5 shrink-0 self-center text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-orange-500" aria-hidden="true" />
    </Link>
  )
}

// Гарчгийн хажуугийн «?» товчны заавар
const SEARCH_STAFF_HELP: React.ReactNode[] = [
  <>Энд зөвхөн профайлаа <b className="font-semibold text-gray-800">100% бөглөж</b>, ажил олгогчдод харуулахыг зөвшөөрсөн ажилтнууд харагдана.</>,
  <>Ажилтныг <b className="font-semibold text-gray-800">нэрээр</b> хайна. Ур чадвар, албан тушаал, мэргэжил, хүйс, туршлага, ажиллах өдөр, цагаар нарийвчлахдаа <b className="font-semibold text-gray-800">«Шүүлтүүр»</b> товчийг дарна.</>,
  <>Ажиллах өдөр, цагийг хамт сонговол тухайн өдөр тэр цагт ажиллах боломжтой хүмүүс гарна. Ногоон өдрүүд нь ажилтны ажиллах боломжтой өдрүүд.</>,
  <>Ажилтан дээр дарж туршлага, боловсрол, бүх ур чадвар зэрэг бүтэн профайлыг нь харна.</>,
  <>Утас, имэйл нууцлагдсан байна. Профайл дээрх <b className="font-semibold text-gray-800">«Ажиллах хүсэлт илгээх»</b> товчийг дарахад <b className="font-semibold text-gray-800">1 зар нийтлэх эрх хасагдаж</b>, утас, имэйлийг 10 цагийн турш харна.</>,
  <>Хүсэлт илгээсэн ажилтны нэрийн хажууд <b className="font-semibold text-gray-800">«Хүсэлт илгээсэн»</b> тэмдэг, утас, имэйл харагдах үлдсэн хугацаа гарна. «Шүүлтүүр» дотроос зөвхөн хүсэлт илгээсэн ажилтнуудаа харж болно.</>,
  <>Хайх, профайл үзэхэд эрх хасагдахгүй. Танай зарт анкет илгээсэн ажилтны утас, имэйл үнэгүй харагдана.</>,
]

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
  
  // Шүүлтүүр, хуудсыг URL-д хадгална — профайл руу ороод буцахад (эсвэл хуудсаа шинэчлэхэд) хэвээр үлдэнэ
  const searchParams = useSearchParams()
  const param = (key: string) => searchParams.get(key) ?? ""

  const [nameQuery, setNameQuery] = useState(() => param("name"))
  const [skillQuery, setSkillQuery] = useState(() => param("skill"))
  const [positionQuery, setPositionQuery] = useState(() => param("position"))
  const [fieldQuery, setFieldQuery] = useState(() => param("field"))
  const [genderFilter, setGenderFilter] = useState(() => (["male", "female"].includes(param("gender")) ? param("gender") : ""))
  const [minExp, setMinExp] = useState(() => (MIN_EXP_OPTIONS.includes(Number(param("minExp"))) ? Number(param("minExp")) : 0))
  const [selectedDay, setSelectedDay] = useState(() => (DAYS_OF_WEEK.some((d) => d.value === param("day")) ? param("day") : ""))
  const [filterTime, setFilterTime] = useState(() => (HOURS.includes(param("time")) ? param("time") : ""))
  // Хүсэлт илгээсэн эсэхээр (клиент талд) шүүнэ
  const [requestFilter, setRequestFilter] = useState(() => (["sent", "none"].includes(param("request")) ? param("request") : ""))
  // Хүсэлтийн үлдсэн хугацааг тооцох цаг (жагсаалт татах бүрт шинэчилнэ)
  const [now, setNow] = useState(() => Date.now())
  const [page, setPage] = useState(() => Math.max(1, Math.floor(Number(param("page"))) || 1))
  const [showFilters, setShowFilters] = useState(false)
  const listTopRef = useRef<HTMLDivElement>(null)
  const filtersRef = useRef<HTMLDivElement>(null)

  // Шүүлтүүрийн dropdown-ийг гадна дарах эсвэл Escape дарахад хаана
  useEffect(() => {
    if (!showFilters) return
    const onPointer = (e: PointerEvent) => {
      if (!filtersRef.current?.contains(e.target as Node)) setShowFilters(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowFilters(false)
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [showFilters])

  // Шүүлтүүр өөрчлөгдөхөд эхний хуудас руу буцна
  const withPageReset = <T,>(set: (value: T) => void) => (value: T) => {
    set(value)
    setPage(1)
  }

  // Хайлтын доор харуулах идэвхтэй шүүлтүүрийн шошгууд
  const activeChips = [
    skillQuery && { key: "skill", label: `Ур чадвар: ${skillQuery}`, clear: () => setSkillQuery("") },
    positionQuery && { key: "position", label: `Албан тушаал: ${positionQuery}`, clear: () => setPositionQuery("") },
    fieldQuery && { key: "field", label: `Мэргэжил: ${fieldQuery}`, clear: () => setFieldQuery("") },
    genderFilter && { key: "gender", label: GENDER_LABELS[genderFilter], clear: () => setGenderFilter("") },
    minExp > 0 && { key: "exp", label: `${minExp}+ жил туршлага`, clear: () => setMinExp(0) },
    selectedDay && {
      key: "day",
      label: `${DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.label ?? ""} гариг`,
      clear: () => setSelectedDay(""),
    },
    filterTime && { key: "time", label: `${filterTime}-д ажиллах`, clear: () => setFilterTime("") },
    requestFilter && {
      key: "request",
      label: requestFilter === "sent" ? "Хүсэлт илгээсэн" : "Хүсэлт илгээгээгүй",
      clear: () => setRequestFilter(""),
    },
  ].filter((chip): chip is { key: string; label: string; clear: () => void } => Boolean(chip))
  const activeFilterCount = activeChips.length

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (nameQuery) params.set("name", nameQuery)
    if (skillQuery) params.set("skill", skillQuery)
    if (positionQuery) params.set("position", positionQuery)
    if (fieldQuery) params.set("field", fieldQuery)
    if (genderFilter) params.set("gender", genderFilter)
    if (minExp > 0) params.set("minExp", String(minExp))
    if (selectedDay) params.set("day", selectedDay)
    if (filterTime) params.set("time", filterTime)
    if (requestFilter) params.set("request", requestFilter)
    if (page > 1) params.set("page", String(page))
    return params.toString()
  }, [nameQuery, skillQuery, positionQuery, fieldQuery, genderFilter, minExp, selectedDay, filterTime, requestFilter, page])

  // router.replace нь шүүлтүүр солих бүрт серверээс хуудсыг дахин татдаг тул зөвхөн URL-ийг шинэчилнэ
  useEffect(() => {
    if (queryString === window.location.search.replace(/^\?/, "")) return
    window.history.replaceState(null, "", queryString ? `?${queryString}` : window.location.pathname)
  }, [queryString])

  const resetFilters = () => {
    setPage(1)
    setSkillQuery("")
    setPositionQuery("")
    setFieldQuery("")
    setGenderFilter("")
    setMinExp(0)
    setSelectedDay("")
    setFilterTime("")
    setRequestFilter("")
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
        setNow(Date.now())
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

  const visibleStaff = useMemo(
    () =>
      requestFilter === "sent"
        ? staffList.filter((s) => s.request)
        : requestFilter === "none"
          ? staffList.filter((s) => !s.request)
          : staffList,
    [staffList, requestFilter]
  )

  const totalPages = Math.max(1, Math.ceil(visibleStaff.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pagedStaff = visibleStaff.slice(pageStart, pageStart + PAGE_SIZE)
  const visiblePages = (() => {
    const maxVisible = 5
    let start = Math.max(currentPage - Math.floor(maxVisible / 2), 1)
    const end = Math.min(start + maxVisible - 1, totalPages)
    start = Math.max(end - maxVisible + 1, 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })()

  // Pagination өмнөх/дараах товч функц (prev => prev ± 1) дамжуулдаг
  const changePage = (next: number | ((prev: number) => number)) => {
    setPage((prev) => (typeof next === "function" ? next(Math.min(prev, totalPages)) : next))
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // Профайлаас буцахад сэргээх хайлт (хуудасны дугаар бодит хуудсаар)
  const backQuery = (() => {
    const params = new URLSearchParams(queryString)
    if (currentPage > 1) params.set("page", String(currentPage))
    else params.delete("page")
    return params.toString()
  })()

  if (isInitialLoad) {
    return (
      <div className="max-w-6xl mx-auto w-full">
        <LoadingLayout loading={true} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto w-full">
      
      {/* relative z-30: dashIn хөдөлгөөн хэсэг бүрийг тусдаа давхарга болгодог тул «?» цонх доорх хайлт, жагсаалтын дээр гарахын тулд */}
      <div className="relative z-30 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Ажилтан хайх</h1>
            <PageHelp title="Ажилтан хайх хуудас" items={SEARCH_STAFF_HELP} />
          </div>
          <p className="text-sm text-gray-500 mt-1">Танай байгууллагад хэрэгцээтэй чадварлаг мэргэжилтнүүдийн жагсаалт.</p>
        </div>
      </div>

      {/* ХАЙЛТ: нэрээр хайх нь үндсэн, бусад шүүлтүүр «Шүүлтүүр» товчны dropdown дотор */}
      <div ref={filtersRef} className="relative z-20 bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Нэрээр хайх..."
              value={nameQuery}
              aria-label="Нэрээр хайх"
              className={`${inputClass} pl-10`}
              onChange={(e) => withPageReset(setNameQuery)(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="staff-filters"
            aria-label={activeFilterCount > 0 ? `Шүүлтүүр (${activeFilterCount} идэвхтэй)` : "Шүүлтүүр"}
            className={`shrink-0 inline-flex items-center gap-2 h-11 px-3.5 rounded-xl border text-sm font-semibold transition ${
              showFilters || activeFilterCount > 0
                ? "border-orange-300 bg-orange-50 text-orange-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Шүүлтүүр</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} aria-hidden="true" />
            {activeFilterCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-orange-600 text-white text-xs font-bold inline-flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Идэвхтэй шүүлтүүрүүд: шошго бүрийн «×»-ээр тус тусад нь цуцална */}
        {activeChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {activeChips.map((chip) => (
              <span key={chip.key} className="inline-flex items-center gap-1 rounded-lg bg-orange-50 py-1 pl-2.5 pr-1 text-xs font-medium text-orange-700">
                {chip.label}
                <button
                  type="button"
                  onClick={() => { chip.clear(); setPage(1) }}
                  aria-label={`${chip.label} шүүлтүүрийг цуцлах`}
                  className="p-0.5 rounded-md hover:bg-orange-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={resetFilters}
              className="ml-1 text-xs font-semibold text-gray-500 hover:text-orange-600"
            >
              Бүгдийг цэвэрлэх
            </button>
          </div>
        )}

        {showFilters && (
        <div
          id="staff-filters"
          role="region"
          aria-label="Шүүлтүүр"
          className="animate-fade-in absolute right-0 top-full z-40 mt-2 w-full sm:w-[34rem] rounded-2xl border border-gray-100 bg-white p-4 shadow-xl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Ур чадвар (жишээ: React)"
            value={skillQuery}
            aria-label="Ур чадвараар хайх"
            className={`${inputClass} px-4`}
            onChange={(e) => withPageReset(setSkillQuery)(e.target.value)}
          />
          <input
            type="text"
            placeholder="Ажиллаж байсан албан тушаал"
            value={positionQuery}
            aria-label="Албан тушаалаар хайх"
            className={`${inputClass} px-4`}
            onChange={(e) => withPageReset(setPositionQuery)(e.target.value)}
          />
          <input
            type="text"
            placeholder="Сургуулийн мэргэжил"
            value={fieldQuery}
            aria-label="Мэргэжлээр хайх"
            className={`${inputClass} px-4`}
            onChange={(e) => withPageReset(setFieldQuery)(e.target.value)}
          />
          <Select value={genderFilter} aria-label="Хүйс" onChange={(e) => withPageReset(setGenderFilter)(e.target.value)}>
            <option value="">Бүх хүйс</option>
            <option value="male">Эрэгтэй</option>
            <option value="female">Эмэгтэй</option>
          </Select>
          <Select value={minExp} aria-label="Туршлага" onChange={(e) => withPageReset(setMinExp)(Number(e.target.value))}>
            <option value={0}>Бүх туршлага</option>
            <option value={1}>1+ жил</option>
            <option value={3}>3+ жил</option>
            <option value={5}>5+ жил</option>
          </Select>
          <Select value={selectedDay} aria-label="Ажиллах өдөр" onChange={(e) => withPageReset(setSelectedDay)(e.target.value)}>
            <option value="">Ажиллах өдөр: бүгд</option>
            {DAYS_OF_WEEK.map((d) => (
              <option key={d.value} value={d.value}>{d.label} гариг</option>
            ))}
          </Select>
          <Select value={filterTime} aria-label="Ажиллах цаг" onChange={(e) => withPageReset(setFilterTime)(e.target.value)}>
            <option value="">Ажиллах цаг: бүгд</option>
            {HOURS.map((h) => (
              <option key={h} value={h}>{h}-д ажиллах боломжтой</option>
            ))}
          </Select>
          <Select value={requestFilter} aria-label="Хүсэлт" onChange={(e) => withPageReset(setRequestFilter)(e.target.value)}>
            <option value="">Хүсэлт: бүгд</option>
            <option value="sent">Хүсэлт илгээсэн</option>
            <option value="none">Хүсэлт илгээгээгүй</option>
          </Select>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
              className="h-10 px-3 inline-flex items-center gap-1.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition"
            >
              <X className="w-4 h-4" /> Цэвэрлэх
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="h-10 px-4 rounded-xl bg-orange-600 text-sm font-semibold text-white hover:bg-orange-700 transition"
            >
              {loading ? "Хайж байна…" : `${visibleStaff.length} илэрц харах`}
            </button>
          </div>
        </div>
        )}
      </div>

      {/* Нийт илэрц хэсэг */}
      <div ref={listTopRef} className="mb-4 flex items-center justify-between gap-3 scroll-mt-24">
        <h2 className="font-bold text-gray-800 text-base sm:text-lg" aria-live="polite">
          Илэрсэн ажилчид {!error && <span className="text-orange-500 font-bold">({visibleStaff.length})</span>}
          {!error && totalPages > 1 && (
            <span className="ml-2 text-sm font-medium text-gray-400">
              {pageStart + 1}–{pageStart + pagedStaff.length} харуулж байна
            </span>
          )}
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
      ) : visibleStaff.length > 0 ? (
        <ul className={`stagger-in bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 [&>li:first-child>a]:rounded-t-2xl [&>li:last-child>a]:rounded-b-2xl transition-opacity ${loading ? "opacity-60" : ""}`}>
          {pagedStaff.map((staff) => (
            <li key={staff.id} className="relative hover:z-10">
              <StaffRow staff={staff} backQuery={backQuery} now={now} />
            </li>
          ))}
        </ul>
      ) : null}

      {!error && (visibleStaff.length > 0 ? (
        <Pagination
          filteredJobsCount={visibleStaff.length}
          totalPages={totalPages}
          isFiltering={false}
          currentPage={currentPage}
          visiblePages={visiblePages}
          setCurrentPage={changePage}
        />
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
      ))}
    </div>
  )
}