"use client"

import { useState, useEffect, useRef } from "react"

interface AdminInvoice {
  id: string
  invoice_number: string
  plan_type: string
  amount: number
  status: string
  created_at: string
  user_id: string
}

export default function AdminDashboard() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"home" | "invoices">("home")
  const [searchQuery, setSearchQuery] = useState("") // Хайлтын утга хадгалах төлөв
  const isFetched = useRef(false)

  useEffect(() => {
    async function fetchAdminData() {
      if (isFetched.current) return
      isFetched.current = true
      try {
        const res = await fetch("/api/admin/invoices")
        const result = await res.json()
        if (result.success) {
          setInvoices(result.invoices)
        }
      } catch (err) {
        console.error("Админ өгөгдөл татахад алдаа гарлаа:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAdminData()
  }, [])

  const handleApproveStatus = async (invoiceId: string) => {
    if (!confirm("Энэхүү төлбөрийг баталгаажуулж, компанийн багцыг ахиулахдаа итгэлтэй байна уу?")) return
    setActionLoading(invoiceId)

    try {
      const res = await fetch("/api/admin/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId, status: "paid" })
      })
      const result = await res.json()
      
      if (result.success) {
        alert("Төлбөр амжилттай баталгаажлаа!")
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: "paid" } : inv))
      } else {
        alert(result.error || "Алдаа гарлаа.")
      }
    } catch (err) {
      alert("Серверийн алдаа гарлаа.")
    } finally {
      setActionLoading(null)
    }
  }

  const pendingCount = invoices.filter(i => i.status === "pending").length
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0)

  // 🔍 Нэхэмжлэхийг гүйлгээний утга болон хэрэглэгчийн ID-аар шүүх логик
  const filteredInvoices = invoices.filter(inv => {
    const query = searchQuery.toLowerCase().trim()
    return (
      inv.invoice_number.toLowerCase().includes(query) ||
      inv.user_id.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
        Админ самбар уншиж байна...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* 1. НАВБАР */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight text-gray-900">MStaffing</span>
              <span className="bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">Admin</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab("home")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  activeTab === "home" 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-slate-100"
                }`}
              >
                🏠 Home
              </button>
              <button
                onClick={() => {
                  setActiveTab("invoices")
                  setSearchQuery("") // Таб солиход хайлтыг цэвэрлэнэ
                }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition relative ${
                  activeTab === "invoices" 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-slate-100"
                }`}
              >
                🧾 Нэхэмжлэл
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          <div className="text-gray-400 text-[11px] font-medium">
            Админ систем идэвхтэй
          </div>
        </div>
      </nav>

      {/* Үндсэн контент */}
      <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* А. HOME ТАБ */}
        {activeTab === "home" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Тавтай морил 👑</h1>
              <p className="text-gray-500 text-xs">Системийн өнөөдрийн байдал болон ерөнхий аналитик.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Хүлээгдэж буй гүйлгээ</p>
                <p className="text-2xl font-black text-amber-500 mt-1">{pendingCount} нэхэмжлэх</p>
              </div>
              <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Нийт батлагдсан орлого</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{totalRevenue.toLocaleString()} ₮</p>
              </div>
              <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-xs">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Нийт үүссэн нэхэмжлэх</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{invoices.length} ширхэг</p>
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100/60 rounded-3xl p-6">
              <h4 className="text-sm font-bold text-indigo-950">Шуурхай үйлдэл шаардлагатай</h4>
              <p className="text-indigo-700 text-xs mt-1">
                {pendingCount > 0 
                  ? `Одоогоор хүлээгдэж буй ${pendingCount} төлбөрийн хүсэлт байна. Та "Нэхэмжлэл" цэс рүү орж баталгаажуулна уу.`
                  : "Шинэ төлбөрийн хүсэлт байхгүй байна. Систем хэвийн ажиллаж байна."}
              </p>
              {pendingCount > 0 && (
                <button 
                  onClick={() => setActiveTab("invoices")}
                  className="mt-4 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
                >
                  Нэхэмжлэл рүү шилжих →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Б. НЭХЭМЖЛЭЛ ТАБ */}
        {activeTab === "invoices" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Нэхэмжлэхийн хяналт 🧾</h1>
                <p className="text-gray-500 text-xs">Компаниудаас ирүүлсэн багц идэвхжүүлэх хүсэлтүүдийн жагсаалт.</p>
              </div>

              {/* 🔍 ХАЙЛТЫН ИНПУТ ХЭСЭГ */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Гүйлгээний утга, Хэрэглэгчийн ID-аар хайх..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 pl-9 text-xs font-medium text-gray-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition shadow-xs"
                />
                <div className="absolute left-3 top-3.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            {invoices.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-400 text-xs font-medium">
                Одоогоор нэхэмжлэх үүсээгүй байна.
              </div>
            ) : filteredInvoices.length === 0 ? (
              // Хайлтаар илэрц олдоогүй үеийн төлөв
              <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center space-y-2 shadow-xs">
                <p className="text-gray-800 font-bold text-sm">Илэрц олдсонгүй</p>
                <p className="text-gray-400 text-xs">"{searchQuery}" утгад тохирох нэхэмжлэх олдсонгүй. Хайлтын утгаа шалгана уу.</p>
                <button 
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-bold text-indigo-600 underline"
                >
                  Хайлтыг цэвэрлэх
                </button>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-gray-500 uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="p-4">Огноо</th>
                      <th className="p-4">Хэрэглэгчийн ID</th>
                      <th className="p-4">Гүйлгээний утга</th>
                      <th className="p-4">Сонгосон Багц</th>
                      <th className="p-4">Төлөх дүн</th>
                      <th className="p-4 text-center">Төлөв</th>
                      <th className="p-4 text-right">Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className={`hover:bg-slate-50/60 transition ${inv.status === "pending" ? "bg-amber-50/20" : ""}`}>
                        <td className="p-4 text-gray-400">{new Date(inv.created_at).toLocaleString()}</td>
                        <td className="p-4 font-mono text-gray-400 truncate max-w-30">{inv.user_id}</td>
                        <td className="p-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                        <td className="p-4 uppercase font-bold text-indigo-600">{inv.plan_type}</td>
                        <td className="p-4 font-black text-gray-900">{inv.amount.toLocaleString()} ₮</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            inv.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600 animate-pulse"
                          }`}>
                            {inv.status === "paid" ? "Төлөгдсөн" : "Хүлээгдэж буй"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {inv.status === "pending" ? (
                            <button
                              onClick={() => handleApproveStatus(inv.id)}
                              disabled={actionLoading !== null}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl transition shadow-xs text-[11px]"
                            >
                              {actionLoading === inv.id ? "⏳" : "Баталгаажуулах ✓"}
                            </button>
                          ) : (
                            <span className="text-gray-300 text-[11px] font-bold pr-2">Шийдвэрлэсэн</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  )
}