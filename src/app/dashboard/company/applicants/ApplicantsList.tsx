"use client"

import Link from "next/link"
import { useState, useMemo } from "react"

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

  const uniqueJobs = useMemo(() => {
    const jobs = applicants.map((app) => app.job_title)
    return ["all", ...Array.from(new Set(jobs))]
  }, [applicants])

  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const currentStatus = app.status ? app.status.toLowerCase() : "";
      let matchesStatus = false;

      if (statusFilter === "all") {
        matchesStatus = true;
      } else if (statusFilter === "new") {
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

  return (
    <div className="space-y-6">
      
      {/* ХАЙЛТ БОЛОН ШҮҮЛТҮҮРИЙН ХЭСЭГ (Mobile friendly) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/50 p-3 md:p-4 border border-gray-100 rounded-2xl md:rounded-3xl">
        <div className="relative flex-1 w-full">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm md:text-base">🔍</span>
          <input
            type="text"
            placeholder="Нэр, имэйл, утасны дугаараар хайх..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-white border border-gray-200/80 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all text-gray-800"
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={selectedJobFilter}
            onChange={(e) => setSelectedJobFilter(e.target.value)}
            className="w-full px-4 py-2.5 md:py-3 bg-white border border-gray-200/80 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all cursor-pointer"
          >
            <option value="all">Бүх ажлын байр</option>
            {uniqueJobs.filter(job => job !== "all").map((job) => (
              <option key={job} value={job}>{job}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ТАБ ШҮҮЛТҮҮР (Mobile friendly - Скроллтой эсвэл уян хатан) */}
      <div className="flex flex-nowrap md:flex-wrap gap-1.5 p-1.5 bg-gray-100/80 w-full md:w-fit rounded-xl md:rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: "all", label: `Бүгд (${applicants.length})` },
          { 
            id: "new", 
            label: `Шинэ (${applicants.filter(a => ["new", "pending", ""].includes(a.status ? a.status.toLowerCase() : "")).length})` 
          },
          { id: "interview", label: `Ярилцлага (${applicants.filter(a => (a.status ? a.status.toLowerCase() : "") === "interview").length})` },
          { id: "rejected", label: `Татгалзсан (${applicants.filter(a => (a.status ? a.status.toLowerCase() : "") === "rejected").length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-200 whitespace-nowrap ${
              statusFilter === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* АНКЕТУУДЫН ИЛЭРЦ ГҮЙЦЭТГЭХ ХЭСЭГ */}
      {filteredApplicants.length === 0 ? (
        <div className="p-12 md:p-16 bg-white border border-gray-100 rounded-3xl md:rounded-4xl text-center text-gray-400 shadow-sm">
          <span className="text-3xl md:text-4xl block mb-3">📁</span>
          <div className="font-bold text-gray-700 mb-1 text-sm md:text-base">Илэрц олдсонгүй</div>
          <p className="text-xs md:text-sm text-gray-400">Таны сонгосон шүүлтүүрт тохирох анкет байхгүй байна.</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* 🖥️ КОМПЬЮТЕР ДЭЭР ХАРАГДАХ СТАНДАРТ ХҮСНЭГТ */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-4xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-8 py-5">Ажил хайгч & Илгээсэн ажлын байр</th>
                    <th className="px-6 py-5">Холбоо барих</th>
                    <th className="px-6 py-5">Ирүүлсэн огноо</th>
                    <th className="px-6 py-5">Төлөв</th>
                    <th className="px-8 py-5 text-right">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {filteredApplicants.map((app) => {
                    const currentStatus = app.status ? app.status.toLowerCase() : "";
                    return (
                      <tr key={app.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-8 py-5 max-w-xs">
                          <div className="font-bold text-gray-900 text-base mb-1.5">{app.user_name}</div>
                          <div className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-violet-100/50等">
                            <span className="text-sm">💼</span> {app.job_title}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-gray-700 font-medium">{app.phone}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{app.email}</div>
                        </td>
                        <td className="px-6 py-5 text-gray-500 font-medium" suppressHydrationWarning>
                          {new Date(app.created_at).toLocaleDateString("mn-MN")}
                        </td>
                        <td className="px-6 py-5">
                          {["new", "pending", ""].includes(currentStatus) && <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600">Шинэ</span>}
                          {currentStatus === "interview" && <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600">Ярилцлага</span>}
                          {currentStatus === "rejected" && <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600">Татгалзсан</span>}
                        </td>
                        <td className="px-8 py-5 text-right space-x-2 whitespace-nowrap">
                          <Link href={`/dashboard/company/applicants/profile?id=${app.id}`} className="text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition inline-block">
                            Дэлгэрэнгүй
                          </Link>
                          {["new", "pending", ""].includes(currentStatus) && (
                            <>
                              <button disabled={updatingId === app.id} onClick={() => handleStatusChange(app.id, "interview")} className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition disabled:opacity-50">Урих</button>
                              <button disabled={updatingId === app.id} onClick={() => handleStatusChange(app.id, "rejected")} className="text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl transition disabled:opacity-50">Татгалзах</button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 📱 УТАСНЫ ДЭЛГЭЦЭНД ЗОРИУЛСАН КАРТЫН ЖАГСААЛТ (Mobile Layout) */}
          <div className="block md:hidden space-y-3">
            {filteredApplicants.map((app) => {
              const currentStatus = app.status ? app.status.toLowerCase() : "";
              return (
                <div key={app.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
                  {/* Дээд хэсэг: Нэр болон Төлөв */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-bold text-gray-900 text-base">{app.user_name}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5" suppressHydrationWarning>
                        📅 {new Date(app.created_at).toLocaleDateString("mn-MN")}
                      </div>
                    </div>
                    <div>
                      {["new", "pending", ""].includes(currentStatus) && <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-600">Шинэ</span>}
                      {currentStatus === "interview" && <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600">Ярилцлага</span>}
                      {currentStatus === "rejected" && <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600">Татгалзсан</span>}
                    </div>
                  </div>

                  {/* Дунд хэсэг: Ажлын байр */}
                  <div className="bg-slate-50 border border-gray-100 p-2.5 rounded-xl">
                    <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                      <span>💼</span> {app.job_title}
                    </div>
                  </div>

                  {/* Холбоо барих мэдээлэл */}
                  <div className="text-xs space-y-1 text-gray-600 font-medium pt-1 border-t border-gray-50">
                    <div>📞 {app.phone}</div>
                    <div className="text-gray-400 break-all">✉️ {app.email}</div>
                  </div>

                  {/* Үйлдэл хийх товчнууд (Том утас дээр ч дарахад амархан) */}
                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    <Link 
                      href={`/dashboard/company/applicants/profile?id=${app.id}`} 
                      className="flex-1 text-center text-xs font-bold bg-gray-950 hover:bg-gray-800 text-white py-2.5 rounded-xl transition"
                    >
                      Дэлгэрэнгүй
                    </Link>
                    
                    {["new", "pending", ""].includes(currentStatus) && (
                      <>
                        <button 
                          disabled={updatingId === app.id} 
                          onClick={() => handleStatusChange(app.id, "interview")} 
                          className="flex-1 text-xs font-bold bg-emerald-500 text-white py-2.5 rounded-xl transition disabled:opacity-50"
                        >
                          Урих
                        </button>
                        <button 
                          disabled={updatingId === app.id} 
                          onClick={() => handleStatusChange(app.id, "rejected")} 
                          className="px-3 text-xs font-bold bg-rose-50 text-rose-600 py-2.5 rounded-xl transition disabled:opacity-50"
                        >
                          ❌
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