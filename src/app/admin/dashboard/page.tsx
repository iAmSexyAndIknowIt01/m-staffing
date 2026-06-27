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

  // 🔥 НЭГДСЭН ФУНКЦ: Төлөвийг "paid" эсвэл "decline" болгож өөрчлөх
  const handleUpdateStatus = async (invoiceId: string, targetStatus: "paid" | "decline") => {
    const confirmMsg = targetStatus === "paid" 
      ? "Энэхүү төлбөрийг баталгаажуулж, компанийн багцыг ахиулахдаа итгэлтэй байна уу?"
      : "Энэ нэхэмжлэхийг цуцлахдаа итгэлтэй байна уу?";

    if (!confirm(confirmMsg)) return
    setActionLoading(invoiceId)

    try {
      const res = await fetch("/api/admin/invoices", {
        method: "PUT", // Одоо устгах биш үргэлж PUT ашиглана
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId, status: targetStatus })
      })
      const result = await res.json()
      
      if (result.success) {
        alert(targetStatus === "paid" ? "Төлбөр амжилттай баталгаажлаа!" : "Нэхэмжлэх цуцлагдлаа.")
        // Жагсаалт дахь төлөвийг устгахгүйгээр шууд шинэчлэх
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: targetStatus } : inv))
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
        Админ самбар уншиж байна...
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Толгой хэсэг */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">MStaffing Админ Самбар 👑</h1>
        <p className="text-gray-500 text-xs">Төлбөрийн хүсэлтүүдийг хянах, багц сунгалт баталгаажуулах хэсэг.</p>
      </div>

      {/* Статистик */}
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

      {/* Хүснэгт */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-gray-900 px-1">Төлбөрийн хүсэлтүүд</h3>
        
        {invoices.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-400 text-xs font-medium">
            Одоогоор нэхэмжлэх үүсээгүй байна.
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
                {invoices.map((inv) => (
                  <tr key={inv.id} className={`hover:bg-slate-50/60 transition ${inv.status === "pending" ? "bg-amber-50/20" : ""}`}>
                    <td className="p-4 text-gray-400">{new Date(inv.created_at).toLocaleString()}</td>
                    <td className="p-4 font-mono text-gray-400 truncate max-w-30">{inv.user_id}</td>
                    <td className="p-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="p-4 uppercase font-bold text-indigo-600">{inv.plan_type}</td>
                    <td className="p-4 font-black text-gray-900">{inv.amount.toLocaleString()} ₮</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        inv.status === "paid" ? "bg-emerald-50 text-emerald-600" :
                        inv.status === "decline" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600 animate-pulse"
                      }`}>
                        {inv.status === "paid" ? "Төлөгдсөн" : inv.status === "decline" ? "Цуцлагдсан" : "Хүлээгдэж буй"}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {inv.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(inv.id, "paid")}
                            disabled={actionLoading !== null}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition shadow-xs text-[11px]"
                          >
                            {actionLoading === inv.id ? "⏳" : "Баталгаажуулах ✓"}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(inv.id, "decline")}
                            disabled={actionLoading !== null}
                            className="bg-red-50 text-red-600 hover:bg-red-200/60 font-bold px-3 py-1.5 rounded-xl transition text-[11px]"
                          >
                            Цуцлах
                          </button>
                        </>
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
    </div>
  )
}