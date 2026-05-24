"use client"

import { useState } from "react"

interface Applicant {
  id: string
  name: string
  jobTitle: string
  email: string
  phone: string
  appliedDate: string
  status: string
}

interface ApplicantsListProps {
  initialApplicants: Applicant[]
}

export default function ApplicantsList({ initialApplicants }: ApplicantsListProps) {
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants)
  const [filter, setFilter] = useState<string>("all") // all, new, interview, rejected

  // Шүүлтүүр хийх функц
  const filteredApplicants = applicants.filter((app) => {
    if (filter === "all") return true
    return app.status === filter
  })

  // Төлөв өөрчлөх функц (Жишээгээр)
  const handleStatusChange = (id: string, newStatus: string) => {
    setApplicants(
      applicants.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    )
  }

  return (
    <div className="space-y-6">
      
      {/* ТАБ ШҮҮЛТҮҮР (Зурган дээрх шиг бөөрөнхий гоё дизайнтай) */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100/80 w-fit rounded-2xl">
        {[
          { id: "all", label: "Бүгд" },
          { id: "new", label: "Шинэ хүсэлт" },
          { id: "interview", label: "Ярилцлага" },
          { id: "rejected", label: "Татгалзсан" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              filter === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* АНКЕТУУДЫН ЖАГСААЛТ */}
      <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
        {filteredApplicants.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <span className="text-4xl block mb-2">📁</span>
            Энэ ангилалд анкет байхгүй байна.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-8 py-5">Ажил хайгч</th>
                  <th className="px-6 py-5">Горилсон албан тушаал</th>
                  <th className="px-6 py-5">Ирүүлсэн огноо</th>
                  <th className="px-6 py-5">Төлөв</th>
                  <th className="px-8 py-5 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredApplicants.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition">
                    {/* Хэрэглэгчийн нэр, мэдээлэл */}
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-800 text-base">{app.name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{app.email} · {app.phone}</div>
                    </td>
                    
                    {/* Албан тушаал */}
                    <td className="px-6 py-5">
                      <span className="font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl text-xs">
                        {app.jobTitle}
                      </span>
                    </td>
                    
                    {/* Огноо */}
                    <td className="px-6 py-5 text-gray-500 font-medium">
                      {app.appliedDate}
                    </td>
                    
                    {/* Төлөв (Badge) */}
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

                    {/* Үйлдэл хийх товчлуур үүд */}
                    <td className="px-8 py-5 text-right space-x-2">
                      <button className="text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition">
                        CV үзэх
                      </button>
                      
                      {app.status === "new" && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(app.id, "interview")}
                            className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition"
                          >
                            Урих
                          </button>
                          <button 
                            onClick={() => handleStatusChange(app.id, "rejected")}
                            className="text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl transition"
                          >
                            Татгалзах
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