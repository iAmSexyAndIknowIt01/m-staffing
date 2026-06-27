"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

interface SubscriptionInfo {
  plan_type: string
  status: string
  job_limit: number
  expires_at: string | null
}

interface InvoiceInfo {
  id: string
  invoice_number: string
  plan_type: string
  amount: number
  status: string
  created_at: string
}

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null)
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null)
  
  // 1. Нэхэмжлэх шинээр үүсгэх Swipe Modal-ийн төлөвүүд
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: string } | null>(null)
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null)
  const [isSwiped, setIsSwiped] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // 🔥 ШИНЭ ТӨЛӨВ: Түүхээс сонгож харах Дэлгэрэнгүй Модал
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null)
  
  const sliderRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const isFetched = useRef(false)

  // 1. Өгөгдөл татах (Багц болон Төлбөрийн түүх)
  useEffect(() => {
    async function fetchData() {
      if (isFetched.current) return
      isFetched.current = true

      try {
        const resSub = await fetch("/api/company/dashboard")
        const resultSub = await resSub.json()
        if (resultSub.success && resultSub.subscription) {
          setSub({
            plan_type: resultSub.subscription.planName === "Premium Plan" ? "premium" : resultSub.subscription.planName === "Standard Plan" ? "standard" : "free",
            status: resultSub.subscription.status === "Идэвхтэй" ? "active" : "expired",
            job_limit: resultSub.subscription.jobLimit,
            expires_at: resultSub.subscription.expiresAt === "Хугацаагүй" ? null : resultSub.subscription.expiresAt
          })
        }

        const resInv = await fetch("/api/company/billing/upgrade")
        const resultInv = await resInv.json()
        if (resultInv.success) {
          setInvoices(resultInv.invoices)
        }
      } catch (err) {
        console.error("Дата татахад алдаа гарлаа:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // 2. Багц сонгох үед Түр зуурын нэхэмжлэх үүсгэх (Данс харуулахын тулд бэкенд дуудна)
  const handleOpenUpgradeModal = async (plan: { id: string; name: string; price: string }) => {
    setSelectedPlan(plan)
    setInvoiceDetails(null)
    setIsSwiped(false)
    setSwipeX(0)
    setIsModalOpen(true)

    try {
      const res = await fetch("/api/company/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_type: plan.id, init_only: true })
      })
      const result = await res.json()
      if (result.success) {
        setInvoiceDetails(result.invoice)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 🔥 ШИНЭ ФУНКЦ: Түүхэн дээрээс "Дэлгэрэнгүй" товч дарах үед ажиллана
  const handleOpenDetailModal = (invoice: InvoiceInfo) => {
    setSelectedInvoice(invoice)
    setIsDetailModalOpen(true)
  }

  // 3. Слайд амжилттай чирэгдэж дуусахад Бэкенд рүү хадгалах
  const confirmInvoiceCreation = async () => {
    if (!selectedPlan) return
    setUpdatingPlan(selectedPlan.id)

    try {
      const res = await fetch("/api/company/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_type: selectedPlan.id })
      })
      const result = await res.json()
      if (result.success) {
        setIsModalOpen(false)
        window.location.reload()
      } else {
        alert(result.error || "Алдаа гарлаа.")
        resetSwipe()
      }
    } catch (err) {
      alert("Серверийн алдаа гарлаа.")
      resetSwipe()
    } finally {
      setUpdatingPlan(null)
    }
  }

  // --- SWIPE LOGIC ---
  const handleStart = (clientX: number) => {
    if (isSwiped || !invoiceDetails) return
    setIsDragging(true)
    startX.current = clientX
  }

  const handleMove = (clientX: number) => {
    if (!isDragging || !sliderRef.current) return
    const width = sliderRef.current.clientWidth - 56
    let moveX = clientX - startX.current
    if (moveX < 0) moveX = 0
    if (moveX > width) moveX = width
    setSwipeX(moveX)

    if (moveX >= width) {
      setIsDragging(false)
      setIsSwiped(true)
      confirmInvoiceCreation()
    }
  }

  const handleEnd = () => {
    if (isSwiped) return
    setIsDragging(false)
    resetSwipe()
  }

  const resetSwipe = () => {
    setSwipeX(0)
    setIsSwiped(false)
  }

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

  const plans = [
    {
      id: "free",
      name: "Үнэгүй багц",
      price: "0 ₮",
      period: "насан туршдаа",
      features: ["Идэвхтэй 10 ажлын байр зарлах", "Үндсэн анкет хүлээн авах", "Статистик хянах хянах хавтан", "Имэйл тусламж"],
      buttonText: "Үнэгүй багц",
      color: "border-gray-200"
    },
    {
      id: "standard",
      name: "Standard Plan",
      price: "150,000 ₮",
      period: "сарын",
      features: ["Идэвхтэй 50 ажлын байр зарлах", "Шүүлтүүртэй анкет удирдах", "Зарласан ажлын хандалт үзэх", "24/7 Чат тусламж"],
      buttonText: "Багц ахиулах ⚡",
      color: "border-indigo-100 shadow-md"
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: "350,000 ₮",
      period: "сарын",
      features: ["Хязгааргүй ажлын байр зарлах", "Мэргэжлийн HR зөвлөгөө", "Зарууд хайлтын эхэнд байрших", "VIP Менежер тусламж", "Ажил горилогчдыг шууд урих эрх"],
      buttonText: "Багц ахиулах 🔥",
      color: "border-orange-200 shadow-xl"
    }
  ]

  return (
    <div className="animate-fade-in space-y-8 p-1 relative">
      {/* Толгой хэсэг */}
      <div className="space-y-2">
        <Link href="/dashboard" className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition flex items-center gap-1">
          ← Удирдах самбар руу буцах
        </Link>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Багц болон Төлбөр тооцоо 💳</h1>
        <p className="text-gray-500 text-sm">Танай байгууллагын систем ашиглах эрх болон багцын мэдээлэл.</p>
      </div>

      {/* ОДООГИЙН ТӨЛӨВ */}
      <div className="bg-slate-900 text-white p-6 rounded-4xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
        <div className="space-y-1">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Одоогийн идэвхтэй багц</p>
          <h2 className="text-2xl font-black text-orange-400">
            {sub?.plan_type === "premium" ? "Premium Plan 🔥" : sub?.plan_type === "standard" ? "Standard Plan ⚡" : "Үнэгүй багц"}
          </h2>
          <p className="text-xs text-slate-300">
            Дуусах хугацаа: <b className="text-white">{sub?.expires_at || "Хугацаагүй"}</b>
          </p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-2xl flex gap-6 text-center">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Зарлах лимит</p>
            <p className="text-lg font-black text-white">{sub?.job_limit === 999 ? "Хязгааргүй" : `${sub?.job_limit} зар`}</p>
          </div>
          <div className="w-px bg-slate-700 my-1" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Системийн төлөв</p>
            <p className="text-sm font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg mt-0.5">Идэвхтэй</p>
          </div>
        </div>
      </div>

      {/* БАГЦУУДЫН СОНГОЛТ */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-gray-900 px-1">Боломжит багцууд</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = sub?.plan_type === plan.id;
            return (
              <div key={plan.id} className={`bg-white border p-6 rounded-4xl flex flex-col justify-between transition-all hover:scale-[1.01] ${plan.color} ${isCurrent ? 'ring-2 ring-slate-900' : ''}`}>
                <div className="space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-lg text-gray-900">{plan.name}</h4>
                      {isCurrent && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-1 inline-block">Ашиглаж буй</span>}
                    </div>
                    {plan.id === "premium" && <span className="text-[10px] font-bold text-white bg-orange-500 px-2.5 py-1 rounded-full uppercase tracking-wider">Best Choice</span>}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-gray-900 tracking-tight">{plan.price}</span>
                    <span className="text-xs text-gray-400 font-medium">/ {plan.period}</span>
                  </div>
                  <hr className="border-gray-100" />
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-600 font-medium">
                        <span className="text-emerald-500 font-bold">✓</span><span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => !isCurrent && handleOpenUpgradeModal(plan)}
                  disabled={isCurrent}
                  className={`mt-8 w-full py-3.5 rounded-2xl font-bold text-xs transition duration-200 ${
                    isCurrent ? "bg-gray-100 text-gray-400 cursor-not-allowed" : plan.id === "premium" ? "bg-orange-500 text-white hover:bg-orange-600 shadow-md" : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ТӨЛБӨРИЙН ТҮҮХ ХЭСЭГ */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-gray-900 px-1">Төлбөр төлөлтийн түүх</h3>
        {invoices.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-4xl p-6 text-center text-gray-400 font-medium text-xs">
            🧾 Одоогоор төлбөрийн түүх байхгүй байна.
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-4xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-gray-500 uppercase font-bold border-b border-gray-100">
                <tr>
                  <th className="p-4">Огноо</th>
                  <th className="p-4">Гүйлгээний утга</th>
                  <th className="p-4">Багц</th>
                  <th className="p-4">Төлөх дүн</th>
                  <th className="p-4 text-center">Төлөв</th>
                  <th className="p-4 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="p-4 uppercase">{inv.plan_type}</td>
                    <td className="p-4 font-black">{inv.amount.toLocaleString()} ₮</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        inv.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600 animate-pulse"
                      }`}>
                        {inv.status === "paid" ? "Төлөгдсөн" : "Хүлээгдэж буй"}
                      </span>
                    </td>
                    {/* 🔥 ШИНЭЭР НЭМЭГДСЭН: Дэлгэрэнгүй харах товч */}
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleOpenDetailModal(inv)}
                        className="text-[11px] font-bold text-indigo-600 bg-indigo-50/60 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-xl transition duration-150"
                      >
                        Дэлгэрэнгүй 📄
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🔥 SWIPE-TO-CONFIRM MODAL (Нэхэмжлэх шинээр үүсгэх) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-4xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900">Нэхэмжлэх үүсгэх 🧾</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <div className="bg-slate-50 p-4 rounded-3xl space-y-2.5 border border-slate-100 text-xs">
              <div className="flex justify-between"><span className="text-gray-400 font-bold">Сонгосон багц:</span><span className="font-black text-slate-900">{selectedPlan?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-bold">Төлбөрийн дүн:</span><span className="font-black text-indigo-600 text-sm">{selectedPlan?.price}</span></div>
              <hr className="border-slate-200/60 my-1" />
              
              {invoiceDetails ? (
                <>
                  <div className="flex justify-between"><span className="text-gray-400 font-bold">Хүлээн авагч банк:</span><span className="font-bold text-gray-800">{invoiceDetails.bankName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-bold">Дансны дугаар:</span><span className="font-black text-slate-900 tracking-wider bg-white px-2 py-0.5 rounded border border-gray-100">{invoiceDetails.accountNumber}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-bold">Дансны нэр:</span><span className="font-bold text-gray-800">{invoiceDetails.accountName}</span></div>
                  <div className="flex justify-between items-center bg-orange-50 p-2.5 rounded-2xl border border-orange-100/60 mt-2">
                    <span className="text-orange-800 font-bold">Гүйлгээний утга:</span>
                    <span className="font-mono font-black text-orange-950 bg-white px-3 py-1 rounded-xl shadow-xs border border-orange-200">{invoiceDetails.invoiceNumber}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-400 font-bold animate-pulse">Дансны мэдээлэл уншиж байна...</div>
              )}
            </div>

            <div className="bg-amber-50/70 border border-amber-100 text-amber-800 p-3.5 rounded-2xl text-[11px] leading-relaxed font-medium">
              ⚠️ <b>Анхаар:</b> Та шилжүүлэг хийхдээ <b>Гүйлгээний утга</b>-ыг огт алдалгүй, яг дээрх хэлбэрээр бичнэ үү. Утга буруу орсон тохиолдолд багц автоматаар идэвхжих боломжгүй болно.
            </div>

            <div 
              ref={sliderRef}
              className="relative h-14 bg-slate-100 border border-slate-200/60 rounded-2xl select-none overflow-hidden p-1 flex items-center justify-center"
              onMouseMove={(e) => handleMove(e.clientX)}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchMove={(e) => handleMove(e.touches[0].clientX)}
              onTouchEnd={handleEnd}
            >
              <div 
                className={`absolute left-1 top-1 bottom-1 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold cursor-grab active:cursor-grabbing shadow-md transition-all ${isDragging ? '' : 'transition-all duration-300'}`}
                style={{ width: '50px', transform: `translateX(${swipeX}px)` }}
                onMouseDown={(e) => handleStart(e.clientX)}
                onTouchStart={(e) => handleStart(e.touches[0].clientX)}
              >
                {updatingPlan ? "⏳" : "→"}
              </div>
              <span className="text-[11px] font-black text-slate-400 tracking-wider uppercase pointer-events-none animate-pulse">
                {updatingPlan ? "Нэхэмжлэх үүсгэж байна..." : "Баруун тийш гүйлгэж баталгаажуул"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 ШИНЭЭР НЭМЭГДСЭН: DETAIL MODAL (Төлбөрийн мэдээллийн дэлгэрэнгүй) */}
      {isDetailModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-4xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-5">
            
            {/* Толгойн хэсэг */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-gray-900">Гүйлгээний дэлгэрэнгүй 📄</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Огноо: {new Date(selectedInvoice.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            {/* Мэдээллийн блок */}
            <div className="bg-slate-50 p-4 rounded-3xl space-y-3 border border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Сонгосон багц:</span>
                <span className="font-black text-slate-900 uppercase">{selectedInvoice.plan_type} PLAN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Төлөх дүн:</span>
                <span className="font-black text-indigo-600 text-sm">{selectedInvoice.amount.toLocaleString()} ₮</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold">Төлбөрийн төлөв:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedInvoice.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600 animate-pulse"
                }`}>
                  {selectedInvoice.status === "paid" ? "Төлөгдсөн" : "Хүлээгдэж буй"}
                </span>
              </div>

              <hr className="border-slate-200/60 my-1" />

              {/* Шилжүүлэг хийх банкны зааварчилгаа (Төлөгдөөгүй үед дахин харах боломжтой) */}
              <div className="flex justify-between"><span className="text-gray-400 font-bold">Хүлээн авагч банк:</span><span className="font-bold text-gray-800">Хаан Банк</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-bold">Дансны дугаар:</span><span className="font-black text-slate-900 tracking-wider bg-white px-2 py-0.5 rounded border border-gray-100">5011XXXXXX</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-bold">Дансны нэр:</span><span className="font-bold text-gray-800">Эм СТАФФИНГ ХХК</span></div>
              
              <div className="flex justify-between items-center bg-orange-50 p-2.5 rounded-2xl border border-orange-100/60 mt-2">
                <span className="text-orange-800 font-bold">Гүйлгээний утга:</span>
                <span className="font-mono font-black text-orange-950 bg-white px-3 py-1 rounded-xl shadow-xs border border-orange-200">
                  {selectedInvoice.invoice_number}
                </span>
              </div>
            </div>

            {/* Анхааруулга (Хүлээгдэж буй үед л харуулна) */}
            {selectedInvoice.status !== "paid" && (
              <div className="bg-amber-50/70 border border-amber-100 text-amber-800 p-3.5 rounded-2xl text-[11px] leading-relaxed font-medium">
                ℹ️ <b>Мэдэгдэл:</b> Та төлбөрөө дээрх данс руу шилжүүлсний дараа админ таны гүйлгээний утгыг шалгаж 5-15 минутын дотор багцыг идэвхжүүлэх болно.
              </div>
            )}

            {/* Хаах товч */}
            <button 
              onClick={() => setIsDetailModalOpen(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition duration-150"
            >
              Хаах
            </button>
          </div>
        </div>
      )}
    </div>
  )
}