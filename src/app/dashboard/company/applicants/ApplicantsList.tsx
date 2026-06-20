"use client"

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

  // Баазаас ирсэн дата дундаас давхардахгүйгээр ажлын зарын нэрсийг ялгаж авах (Унадаг цэсэнд зориулж)
  const uniqueJobs = useMemo(() => {
    const jobs = applicants.map((app) => app.job_title)
    return ["all", ...Array.from(new Set(jobs))]
  }, [applicants])

  // Олон төрлийн шүүлтүүр (Хайлт + Статус + Ажлын байр) хамтран ажиллах хэсэг
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      // 1. Статус шүүлтүүр
      const matchesStatus = statusFilter === "all" || app.status === statusFilter

      // 2. Ажлын байрны шүүлтүүр
      const matchesJob = selectedJobFilter === "all" || app.job_title === selectedJobFilter

      // 3. Текст хайлт (Нэр, Имэйл, Утас, Ажлын байр)
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
      
      {/* ХАЙЛТ БОЛОН ШҮҮЛТҮҮРИЙН ХЭСЭГ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 p-4 border border-gray-100 rounded-3xl">
        
        {/* Текст Хайлт */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
          <input
            type="text"
            placeholder="Нэр, имэйл, утасны дугаараар хайх..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200/80 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all text-gray-800"
          />
        </div>

        {/* Ажлын байраар шүүх унадаг цэс */}
        <div className="w-full md:w-64">
          <select
            value={selectedJobFilter}
            onChange={(e) => setSelectedJobFilter(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200/80 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;bs64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSIjNEM1NTY0IiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgZD0iTTE5IDlsLTcgN0w1IDkiLz48L3N2Zz4=')] bg-size-[1.25rem] bg-position-[right_1rem_center] bg-no-repeat"
          >
            <option value="all">Бүх ажлын байр</option>
            {uniqueJobs.filter(job => job !== "all").map((job) => (
              <option key={job} value={job}>{job}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ТАБ ШҮҮЛТҮҮР (СТАТУС) */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100/80 w-fit rounded-2xl">
        {[
          { id: "all", label: `Бүгд (${applicants.length})` },
          { id: "new", label: `Шинэ хүсэлт (${applicants.filter(a => a.status === "new").length})` },
          { id: "interview", label: `Ярилцлага (${applicants.filter(a => a.status === "interview").length})` },
          { id: "rejected", label: `Татгалзсан (${applicants.filter(a => a.status === "rejected").length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              statusFilter === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* АНКЕТУУДЫН ЖАГSААЛТ */}
      <div className="bg-white border border-gray-100 rounded-4xl overflow-hidden shadow-sm">
        {filteredApplicants.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <span className="text-4xl block mb-3">📁</span>
            <div className="font-bold text-gray-700 mb-1">Илэрц олдсонгүй</div>
            <p className="text-sm text-gray-400">Таны сонгосон шүүлтүүрт тохирох анкет байхгүй байна.</p>
          </div>
        ) : (
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
                {filteredApplicants.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition">
                    
                    {/* Нэр болон ажлын байр */}
                    <td className="px-8 py-5 max-w-xs">
                      <div className="font-bold text-gray-900 text-base mb-1.5">{app.user_name}</div>
                      <div className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-violet-100/50">
                        <span className="text-sm">💼</span> {app.job_title}
                      </div>
                    </td>

                    {/* Холбоо барих */}
                    <td className="px-6 py-5">
                      <div className="text-gray-700 font-medium">{app.phone}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{app.email}</div>
                    </td>
                    
                    {/* Огноо */}
                    <td className="px-6 py-5 text-gray-500 font-medium">
                      {new Date(app.created_at).toLocaleDateString("mn-MN")}
                    </td>
                    
                    {/* Төлөв */}
                    <td className="px-6 py-5">
                      {app.status === "new" && (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600">Шинэ</span>
                      )}
                      {app.status === "interview" && (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600">Ярилцлага</span>
                      )}
                      {app.status === "rejected" && (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600">Татгалзсан</span>
                      )}
                    </td>

                    {/* Үйлдэл */}
                    <td className="px-8 py-5 text-right space-x-2 whitespace-nowrap">
                      <button className="text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition">
                        CV үзэх
                      </button>
                      
                      {app.status === "new" && (
                        <>
                          <button 
                            disabled={updatingId === app.id}
                            onClick={() => handleStatusChange(app.id, "interview")}
                            className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition disabled:opacity-50"
                          >
                            Урих
                          </button>
                          <button 
                            disabled={updatingId === app.id}
                            onClick={() => handleStatusChange(app.id, "rejected")}
                            className="text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl transition disabled:opacity-50"
                          >
                            Tатгалзах
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}