"use client"

import Link from "next/link"
import { useState, useMemo, useEffect } from "react"

interface Applicant {
  id: string
  user_name: string 
  job_title: string 
  email: string
  phone: string
  created_at: string
  status: string
}

interface ApplicantsListProps {
  initialApplicants: Applicant[]
}

export default function ApplicantsList({ initialApplicants }: ApplicantsListProps) {
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)

  useEffect(() => {
    if (initialApplicants) {
      setIsInitialLoading(false)
    }
  }, [initialApplicants])

  const uniqueJobs = useMemo(() => {
    const jobs = applicants.map((app) => app.job_title)
    return ["all", ...Array.from(new Set(jobs))]
  }, [applicants])

  const statusCounts = useMemo(() => {
    return {
      all: applicants.length,
      pending: applicants.filter(a => ["new", "pending", ""].includes(a.status ? a.status.toLowerCase() : "")).length,
      interview: applicants.filter(a => (a.status ? a.status.toLowerCase() : "") === "interview").length,
      accepted: applicants.filter(a => (a.status ? a.status.toLowerCase() : "") === "accepted").length,
      rejected: applicants.filter(a => (a.status ? a.status.toLowerCase() : "") === "rejected").length,
    }
  }, [applicants])

  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const currentStatus = app.status ? app.status.toLowerCase() : "";
      let matchesStatus = false;

      if (statusFilter === "all") {
        matchesStatus = true;
      } else if (statusFilter === "pending") {
        matchesStatus = ["new", "pending", ""].includes(currentStatus);
      } else {
        matchesStatus = currentStatus === statusFilter;
      }

      const matchesJob = selectedJobFilter === "all" || app.job_title === selectedJobFilter

      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = 
        !query ||
        app.user_name.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.phone.includes(query) ||
        app.job_title.toLowerCase().includes(query)

      return matchesStatus && matchesJob && matchesSearch
    })
  }, [applicants, statusFilter, selectedJobFilter, searchQuery])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id)
      const response = await fetch("/api/company/jobrequest", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (!response.ok) throw new Error("Амжилтгүй боллоо")

      setApplicants(
        applicants.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      )
    } catch (err) {
      alert("Алдаа гарлаа. Дахин оролдоно уу.")
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const currentStatus = status ? status.toLowerCase() : ""
    
    switch (currentStatus) {
      case "pending":
      case "new":
      case "":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200/50">Хүлээгдэж буй</span>
      case "interview":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200/50">Ярилцлага</span>
      case "accepted":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200/50">Баталгаажсан</span>
      case "approved":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/50">Тэнцсэн</span>
      case "rejected":
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200/50">Татгалзсан</span>
      default:
        return <span className="inline-block whitespace-nowrap px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200/50">Тодорхойгүй</span>
    }
  }

  const showLoader = isInitialLoading || updatingId !== null;

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* 🔄 LOADER ДЭЛГЭЦ */}
      {showLoader && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/85 backdrop-blur-xs px-4">
          <div className="relative flex items-center justify-center h-28 w-28 sm:h-32 sm:w-32">
            <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
            <div className="absolute inset-0 border-2 border-dashed border-indigo-200 rounded-full animate-[spin_8s_linear_infinite]" />
            <div className="absolute inset-2 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin" />
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center border border-gray-50 shadow-xs">
              <span className="text-[10px] sm:text-xs font-black tracking-widest text-indigo-950 uppercase animate-[pulse_1.5s_ease-in-out_infinite]">
                mstaffing
              </span>
            </div>
          </div>
          <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mt-6 animate-pulse text-center">
            {isInitialLoading ? "Анкетуудыг ачаалж байна..." : "Төлөв шинэчилж байна..."}
          </p>
        </div>
      )}
      
      {/* ХАЙЛТ БОЛОН ШҮҮЛТҮҮРИЙН ХЭСЭГ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/50 p-3 sm:p-4 border border-gray-100 rounded-2xl sm:rounded-3xl">
        <div className="relative w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Нэр, имэйл, утас..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200/80 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all text-gray-800"
          />
        </div>

        <div className="w-full">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 sm:py-3 bg-white border border-gray-200/80 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all cursor-pointer"
          >
            <option value="all">Бүх төлөв ({statusCounts.all})</option>
            <option value="pending">Хүлээгдэж буй ({statusCounts.pending})</option>
            <option value="interview">Ярилцлага ({statusCounts.interview})</option>
            <option value="accepted">Баталгаажсан ({statusCounts.accepted})</option>
            <option value="rejected">Татгалзсан ({statusCounts.rejected})</option>
          </select>
        </div>

        <div className="w-full">
          <select
            value={selectedJobFilter}
            onChange={(e) => setSelectedJobFilter(e.target.value)}
            className="w-full px-4 py-2.5 sm:py-3 bg-white border border-gray-200/80 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all cursor-pointer"
          >
            <option value="all">Бүх ажлын байр</option>
            {uniqueJobs.filter(job => job !== "all").map((job) => (
              <option key={job} value={job}>{job}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ИЛЭРЦҮҮД */}
      {filteredApplicants.length === 0 ? (
        <div className="p-10 sm:p-16 bg-white border border-gray-100 rounded-3xl sm:rounded-4xl text-center text-gray-400 shadow-sm">
          <span className="text-3xl sm:text-4xl block mb-3">📁</span>
          <div className="font-bold text-gray-700 mb-1 text-sm sm:text-base">Илэрц олдсонгүй</div>
          <p className="text-xs sm:text-sm text-gray-400">Таны сонгосон шүүлтүүрт тохирох анкет байхгүй байна.</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* 🖥️ КОМПЬЮТЕР ДЭЭРХ ХҮСНЭГТ */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-4xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-225">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-5">Ажил хайгч & Илгээсэн ажлын байр</th>
                    <th className="px-5 py-5">Холбоо барих</th>
                    <th className="px-5 py-5">Ирүүлсэн огноо</th>
                    <th className="px-5 py-5">Төлөв</th>
                    <th className="px-6 py-5 text-right">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {filteredApplicants.map((app) => {
                    const currentStatus = app.status ? app.status.toLowerCase() : "";
                    const isPending = ["new", "pending", ""].includes(currentStatus);

                    return (
                      <tr key={app.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-5 max-w-xs">
                          <div className="font-bold text-gray-900 text-base mb-1.5">{app.user_name}</div>
                          <div className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-violet-100/50">
                            <span className="text-sm">💼</span> {app.job_title}
                          </div>
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap">
                          <div className="text-gray-700 font-medium">{app.phone}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{app.email}</div>
                        </td>
                        <td className="px-5 py-5 text-gray-500 font-medium whitespace-nowrap" suppressHydrationWarning>
                          {new Date(app.created_at).toLocaleDateString("mn-MN")}
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap">
                          {getStatusBadge(app.status)}
                        </td>
                        <td className="px-6 py-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/dashboard/company/applicants/profile?id=${app.id}`} className="text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-xl transition inline-block">
                              Дэлгэрэнгүй
                            </Link>
                            {isPending && (
                              <>
                                <button disabled={showLoader} onClick={() => handleStatusChange(app.id, "interview")} className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl transition disabled:opacity-50">Урих</button>
                                <button disabled={showLoader} onClick={() => handleStatusChange(app.id, "rejected")} className="text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-2 rounded-xl transition disabled:opacity-50">Татгалзах</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 📱 УТАСНЫ ДЭЛГЭЦЭНД ЗОРИУЛСАН КАРТЫН ЖАГСААЛТ */}
          <div className="block md:hidden space-y-3">
            {filteredApplicants.map((app) => {
              const currentStatus = app.status ? app.status.toLowerCase() : "";
              const isPending = ["new", "pending", ""].includes(currentStatus);

              return (
                <div key={app.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 text-sm sm:text-base truncate">{app.user_name}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5" suppressHydrationWarning>
                        📅 {new Date(app.created_at).toLocaleDateString("mn-MN")}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(app.status)}
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-gray-100 px-3 py-2 rounded-xl">
                    <div className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 truncate">
                      <span className="shrink-0">💼</span> <span className="truncate">{app.job_title}</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 text-gray-600 font-medium pt-1 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">📞</span> <a href={`tel:${app.phone}`} className="hover:underline">{app.phone}</a>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-gray-400">✉️</span> <span className="text-gray-500 truncate">{app.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                    <Link 
                      href={`/dashboard/company/applicants/profile?id=${app.id}`} 
                      className="flex-1 text-center text-xs font-bold bg-gray-950 hover:bg-gray-800 text-white py-2.5 rounded-xl transition"
                    >
                      Дэлгэрэнгүй
                    </Link>
                    
                    {isPending && (
                      <>
                        <button 
                          disabled={showLoader} 
                          onClick={() => handleStatusChange(app.id, "interview")} 
                          className="flex-1 text-xs font-bold bg-emerald-500 text-white py-2.5 rounded-xl transition disabled:opacity-50"
                        >
                          Урих
                        </button>
                        <button 
                          disabled={showLoader} 
                          onClick={() => handleStatusChange(app.id, "rejected")} 
                          className="px-3.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-xl transition disabled:opacity-50"
                          title="Татгалзах"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      )}
    </div>
  )
}