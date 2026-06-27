"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"

interface CompanyViewProps {
  userId: string
}

interface DashboardData {
  stats: {
    openJobsCount: number
    totalApplicantsCount: number
    interviewCount: number
  }
  // 🔥 ШИНЭЧЛЭГДСЭН: Багцын мэдээллийн бүтэц
  subscription: {
    planName: string
    status: string
    jobLimit: number
    expiresAt: string
  }
  activeJobs: Array<{
    id: string
    title: string
    totalApplicants: number
    newApplicants: number
    status: string
    views: number
  }>
  recentApplicants: Array<{
    id: string
    name: string
    role: string
    experience: string
    time: string
    avatar: string | null
  }>
}

export default function CompanyView({ userId }: CompanyViewProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isFetched = useRef(false)

  useEffect(() => {
    async function fetchDashboardData() {
      if (isFetched.current) return
      isFetched.current = true

      try {
        setLoading(true)
        const res = await fetch("/api/company/dashboard")
        if (!res.ok) throw new Error("Удирдлагын мэдээллийг татаж чадсангүй.")
        const result = await res.json()
        
        if (result.success) {
          setData(result)
        } else {
          throw new Error(result.error || "Алдаа гарлаа.")
        }
      } catch (err: any) {
        setError(err.message)
        isFetched.current = false 
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 py-24 w-full">
        <div className="relative flex items-center justify-center h-32 w-32">
          <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
          <div className="absolute inset-0 border-2 border-dashed border-indigo-200 rounded-full animate-[spin_8s_linear_infinite]" />
          <div className="absolute inset-2 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center border border-gray-50 shadow-xs">
            <span className="text-xs font-black tracking-widest text-indigo-950 uppercase animate-[pulse_1.5s_ease-in-out_infinite]">
              mstaffing
            </span>
          </div>
        </div>
        <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mt-6 animate-pulse">
          Түр хүлээнэ үү...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-red-50 text-red-500 rounded-3xl font-bold">
        {error}
      </div>
    )
  }

  if (!data) return null

  const { stats, activeJobs, recentApplicants, subscription } = data
  const displayedJobs = activeJobs.slice(0, 2)

  // Ажлын байрны лимит дүүрсэн эсэхийг шалгах
  const isLimitReached = stats.openJobsCount >= subscription.jobLimit

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* ТОЛГОЙ ХЭСЭГ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 rounded-4xl text-white shadow-xl shadow-slate-950/15">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Компанийн удирдлага 🏢</h1>
          <p className="text-slate-300 text-sm md:text-base mt-2 font-medium">
            Шинэ шилдэг боловсон хүчнүүдийг эндээс хялбархан удирдаарай.
          </p>
        </div>
        {/* 🔥 ШИНЭЧЛЭЛТ: Лимит хэтэрсэн үед хамгаалалттай товч харуулах */}
        {isLimitReached ? (
          <button
            onClick={() => alert(`Таны ажлын байрны лимит (${subscription.jobLimit}) дүүрсэн байна. Шинэ зар оруулахын тулд багцаа ахиулна уу.`)}
            className="px-6 py-3.5 bg-gray-600 text-gray-300 font-bold text-sm rounded-2xl cursor-not-allowed shadow-lg flex items-center gap-2"
          >
            <span>🔒</span> Лимит дүүрсэн
          </button>
        ) : (
          <Link
            href="/dashboard/company/post-job"
            className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-2xl transition shadow-lg shadow-orange-500/25 flex items-center gap-2"
          >
            <span>+</span> Ажлын байр нэмэх
          </Link>
        )}
      </div>

      {/* СТАТИСТИК КАРТУУД */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm flex items-center justify-between group hover:border-orange-100 hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Нээлттэй ажлын байр</p>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{stats.openJobsCount}</h3>
            <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">Зарлагдсан</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl font-bold">💼</div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm flex items-center justify-between group hover:border-emerald-100 hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ирсэн нийт анкет</p>
            <h3 className="text-3xl font-black text-emerald-600 tracking-tight">{stats.totalApplicantsCount}</h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">Идэвхтэй</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">📥</div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm flex items-center justify-between group hover:border-blue-100 hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ярилцлагад урьсан</p>
            <h3 className="text-3xl font-black text-blue-600 tracking-tight">{stats.interviewCount}</h3>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">Шүүгдсэн</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">🗓️</div>
        </div>
      </div>

      {/* ГОЛ КОНТЕНТ СЕКЦ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          
          {/* ИДЭВХТЭЙ ЗАРЛАСАН АЖЛУУД */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-black text-gray-900">Танай идэвхтэй зарласан ажлууд</h2>
              {activeJobs.length > 2 && (
                <Link 
                  href="/dashboard/company/post-job" 
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition underline underline-offset-4"
                >
                  Бүгдийг харах ({activeJobs.length}) →
                </Link>
              )}
            </div>
            
            <div className="space-y-3">
              {displayedJobs.length === 0 ? (
                <div className="text-center p-8 bg-white border border-gray-100 text-gray-400 font-medium rounded-4xl">
                  Одоогоор идэвхтэй ажлын байр байхгүй байна.
                </div>
              ) : (
                displayedJobs.map((job) => (
                  <div 
                    key={job.id}
                    className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg text-gray-900">{job.title}</h4>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                          {job.status}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-400 font-medium">
                        <span>📊 Үзсэн: <b>{job.views}</b></span>
                        <span>📩 Нийт анкет: <b>{job.totalApplicants}</b></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      {job.newApplicants > 0 && (
                        <span className="px-2.5 py-1 text-xs font-bold bg-orange-50 text-orange-600 rounded-xl animate-pulse">
                          🔥 {job.newApplicants} шинэ
                        </span>
                      )}
                      {/* 🔄 ШИНЭЧЛЭГДСЭН ХЭСЭГ: Динамик ID дамжуулах зам */}
                      <Link 
                        href={`/dashboard/company/post-job/${job.id}/applicants`}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-4 py-2.5 rounded-xl transition"
                      >
                        Анкетуудыг үзэх →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* СҮҮЛД ИРСЭН АНКЕТУУД */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-black text-gray-900">Сүүлд ирсэн анкетууд</h2>
              <Link href="/dashboard/company/applicants" className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition">
                Бүгдийг харах
              </Link>
            </div>

            <div className="bg-white border border-gray-100 rounded-4xl overflow-hidden shadow-sm divide-y divide-gray-50">
              {recentApplicants.length === 0 ? (
                <div className="text-center p-8 text-gray-400 font-medium">Ирсэн анкет байхгүй байна.</div>
              ) : (
                recentApplicants.map((applicant) => (
                  <div key={applicant.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200/60 overflow-hidden flex items-center justify-center text-xl shadow-inner relative">
                        {applicant.avatar ? (
                          <img 
                            src={applicant.avatar} 
                            alt={applicant.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) parent.innerHTML = '🧑‍💻';
                            }}
                          />
                        ) : (
                          "🧑‍💻"
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900 text-sm sm:text-base">{applicant.name}</h5>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                          <span className="text-indigo-600 font-semibold">{applicant.role}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400 font-medium mb-1">{applicant.time}</p>
                      <Link 
                        href={`/dashboard/company/applicants/profile/?id=${applicant.id}`}
                        className="text-xs font-bold text-gray-700 border border-gray-200 hover:bg-white hover:border-gray-300 px-3 py-1.5 rounded-xl transition inline-block bg-gray-50 shadow-sm"
                      >
                        Дэлгэрэнгүй 🔍
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* 🔥 БАРУУН ТАЛ: ДИНАМИК КОМПАНИЙН ТӨЛӨВ ХЭСЭГ */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm space-y-5">
            <div>
              <h3 className="font-black text-lg text-gray-900">Компанийн төлөв</h3>
              <p className="text-xs text-gray-400 mt-1">Танай байгууллагын системийн идэвхжилт.</p>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-400">Хандалт систем:</span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${subscription.status === "Идэвхтэй" ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"}`}>
                  {subscription.status}
                </span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-400">Одоогийн Багц:</span>
                <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                  {subscription.planName}
                </span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-400">Дуусах огноо:</span>
                <span className="font-bold text-gray-600">{subscription.expiresAt}</span>
              </div>
            </div>

            {/* Прогресс бар: Зарласан ажлын байр / Нийт лимит */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-500">Ажлын байрны лимит</span>
                <span className="text-slate-700">{stats.openJobsCount} / {subscription.jobLimit} зар</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isLimitReached ? 'bg-red-500' : 'bg-slate-800'}`} 
                  style={{ width: `${Math.min((stats.openJobsCount / subscription.jobLimit) * 100, 100)}%` }} 
                />
              </div>
            </div>

            <Link 
              href="/dashboard/company/billing"
              className="block w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center rounded-2xl transition shadow-md shadow-slate-950/10"
            >
              Багц сунгах / Шинэчлэх ⚡
            </Link>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-4xl shadow-sm space-y-3">
            <h4 className="font-black text-sm text-gray-900">Асуух зүйл байна уу? 🙋‍♂️</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Зар тавихад алдаа гарах, эсвэл тохирох ажилтан олдохгүй бол манай тусламжийн менежертэй шудут холбогдоорой.
            </p>
            <Link href="/support" className="inline-block text-xs font-bold text-indigo-600 hover:underline pt-1">
              Чатлах →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}