"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Briefcase, User, UserCheck } from "lucide-react"
import LoadingLayout from "@/components/common/LoadingLayout"

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
  }, [nameQuery, skillQuery, positionQuery, fieldQuery, genderFilter, minExp])

  // Анх хуудас нээгдэх үед бүтэн дэлгэцийн loader харуулна
  if (isInitialLoad) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 bg-slate-50 min-h-screen relative">
        <LoadingLayout loading={true} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 bg-slate-50 min-h-screen relative">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
            Ажилтан хайх 👨‍💻
          </h1>
          <p className="text-sm text-gray-500 mt-1">Танай байгууллагад хэрэгцээтэй чадварлаг мэргэжилтнүүдийн жагсаалт.</p>
        </div>
      </div>

      {/* Filter Grid - Optimized for mobile view */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {/* Нэрээр хайх */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Нэрээр хайх..." 
            value={nameQuery}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm transition-all"
            onChange={(e) => setNameQuery(e.target.value)}
          />
        </div>

        {/* Ур чадвараар хайх */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Ур чадвараар хайх (Жишээ: React)..." 
            value={skillQuery}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm transition-all"
            onChange={(e) => setSkillQuery(e.target.value)}
          />
        </div>

        {/* Туршлага / Албан тушаалаар хайх */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Ажиллаж байсан албан тушаал..." 
            value={positionQuery}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm transition-all"
            onChange={(e) => setPositionQuery(e.target.value)}
          />
        </div>

        {/* Боловсрол / Мэргэжлээр хайх */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Сургуулийн мэргэжил (field)..." 
            value={fieldQuery}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm transition-all"
            onChange={(e) => setFieldQuery(e.target.value)}
          />
        </div>
        
        {/* Хүйсээр шүүх */}
        <select 
          value={genderFilter}
          className="px-4 py-3 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm text-gray-600 transition-all cursor-pointer" 
          onChange={(e) => setGenderFilter(e.target.value)}
        >
          <option value="Бүгд">Бүх хүйс</option>
          <option value="Эрэгтэй">Эрэгтэй</option>
          <option value="Эмэгтэй">Эмэгтэй</option>
        </select>

        {/* Туршлагын жил шүүх */}
        <select 
          value={minExp}
          className="px-4 py-3 bg-slate-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm text-gray-600 transition-all cursor-pointer" 
          onChange={(e) => setMinExp(Number(e.target.value))}
        >
          <option value={0}>Бүх туршлага</option>
          <option value={1}>1+ жил</option>
          <option value={3}>3+ жил</option>
          <option value={5}>5+ жил</option>
        </select>
      </div>

      {/* Нийт илэрц хэсэг */}
      <div className="mb-4">
        <h2 className="font-bold text-gray-800 text-base sm:text-lg">
          Илэрсэн ажилчид <span className="text-orange-500 font-black">({staffList.length})</span>
        </h2>
      </div>

      {/* List Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden min-h-50">
        {loading ? (
          <LoadingLayout loading={true} />
        ) : staffList.length > 0 ? (
          staffList.map((staff) => (
            <div key={staff.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-3.5 sm:gap-4 w-full">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                  {staff.avatarUrl ? (
                    <img src={staff.avatarUrl} alt={staff.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base sm:text-lg font-black text-indigo-600">{staff.fullName?.charAt(0) || "?"}</span>
                  )}
                </div>

                <div className="space-y-2 w-full overflow-hidden">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate max-w-full">{staff.fullName}</h3>
                    <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 bg-amber-50 text-amber-700 rounded-full">
                      {staff.role}
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-50 text-emerald-600 rounded-full">
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
                      <span key={idx} className="text-[10px] sm:text-[11px] bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <button 
                  onClick={() => window.location.href = `/staff/profile/${staff.id}`}
                  className="w-full sm:w-auto justify-center px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck size={16} /> Профайл үзэх
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-400 text-sm">
            Хайлтд тохирох ажилтан олдсонгүй.
          </div>
        )}
      </div>
    </div>
  )
}