"use client"

import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, CheckCircle2, Lightbulb, Receipt, X, Loader2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { showAlert } from "@/components/common/AppDialog"
import LoadingLayout from "@/components/common/LoadingLayout"
import { PAID_PLAN_DAYS, PAID_PLAN_TYPES, PLANS, isPlanType, pricePerPost, type PaidPlanType } from "@/lib/planCatalog"

// Багцын нэрийг каталогоос (хуучин нэхэмжлэхийн төрөл ч орно)
const planName = (type: string) => (isPlanType(type) ? PLANS[type].name : type)

// Бүх төлбөртэй багцад нийтлэг боломжууд
const PLAN_FEATURES = [
  `Худалдаж авснаас хойш ${PAID_PLAN_DAYS / 365} жил хүчинтэй`,
  "Ирсэн анкетуудыг шүүж удирдах",
  "Ажил хайгчдын профайл, CV үзэх",
  "Зарын хандалт, статистик",
]
interface SubscriptionInfo {
  plan_type: string
  status: string
  job_limit: number
  used: number
  remaining: number
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
  const [invoiceDetails, setInvoiceDetails] = useState<{ invoiceNumber: string; amount: number; bankName: string; accountNumber: string; accountName: string } | null>(null)
  const [isSwiped, setIsSwiped] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // 🔥 ШИНЭ ТӨЛӨВ: Түүхээс сонгож харах Дэлгэрэнгүй Модал
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null)

  // 🔥 ШИНЭ ТӨЛӨВ: Төлбөр төлөлтийн санамж Dropdown нээгдэж хаагдах төлөв
  const [isNoticeOpen, setIsNoticeOpen] = useState(false)
  
  const sliderRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const isFetched = useRef(false)
  // BillingPage дотор
  const [paymentStage, setPaymentStage] = useState<'initial' | 'confirm'>('initial');

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
            plan_type: resultSub.subscription.planType || "free",
            status: resultSub.subscription.status === "Идэвхтэй" ? "active" : "expired",
            job_limit: resultSub.subscription.jobLimit,
            used: resultSub.subscription.used ?? 0,
            remaining: resultSub.subscription.remaining ?? 0,
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
    setPaymentStage('initial');
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

  // 3. Төлбөр шилжүүлсэн баталгаажуулах үйлдэл (Товч эсвэл Слайдаар дуудагдана)
  const confirmInvoiceCreation = async () => {
    if (!selectedPlan) return
    setUpdatingPlan(selectedPlan.id)

    try {
      const res = await fetch("/api/company/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Модал дээр харуулсан гүйлгээний утгыг хадгална (шинээр үүсгэвэл хэрэглэгчийн шилжүүлсэн утгатай таарахгүй)
        body: JSON.stringify({ plan_type: selectedPlan.id, invoice_number: invoiceDetails?.invoiceNumber })
      })
      const result = await res.json()
      if (result.success) {
        setIsModalOpen(false)
        window.location.reload()
      } else {
        showAlert(result.error || "Алдаа гарлаа.", { tone: "error" })
        resetSwipe()
      }
    } catch {
      showAlert("Серверийн алдаа гарлаа.", { tone: "error" })
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
    return <LoadingLayout loading />
  }

  const plans = PAID_PLAN_TYPES.map((id: PaidPlanType) => ({
    id,
    name: PLANS[id].name,
    credits: PLANS[id].jobLimit,
    price: `${PLANS[id].price.toLocaleString()} ₮`,
    perPost: pricePerPost(id),
  }))
  const basePerPost = pricePerPost("starter")
  const expired = sub?.status === "expired"
  const usedPercent = sub && sub.job_limit > 0 ? Math.min(100, Math.round((sub.used / sub.job_limit) * 100)) : 0

  return (
    <div className="animate-fade-in space-y-8 p-1 relative">
      {/* Толгой хэсэг */}
      <div className="space-y-2">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-600 transition">
          <ArrowLeft className="w-4 h-4" /> Хянах самбар
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Багц болон Төлбөр тооцоо</h1>
        <p className="text-gray-500 text-sm">Танай байгууллагын систем ашиглах эрх болон багцын мэдээлэл.</p>
      </div>

      {/* Төлбөр төлөлт болон буцаалтын тухай санамж (Dropdown) */}
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-3xl overflow-hidden transition-all duration-200">
        <button
          onClick={() => setIsNoticeOpen(!isNoticeOpen)}
          aria-expanded={isNoticeOpen}
          className="w-full p-4 flex items-center justify-between text-left font-bold text-xs text-amber-900 hover:bg-amber-100/50 transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-base"><Lightbulb size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /></span>
            <span>Багц хэрхэн ажилладаг вэ? (Анхаарах зүйлс)</span>
          </div>
          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 text-amber-700 ${isNoticeOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        {isNoticeOpen && (
          <div className="px-5 pb-5 pt-1 text-xs text-amber-950 space-y-2.5 border-t border-amber-200/50 leading-relaxed font-medium animate-fade-in">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <p>Багц бүр нь тодорхой тооны зар нийтлэх эрх юм. Шинэ зар нийтлэх бүрт 1 эрх хасагдана.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <p>Зараа хаасан ч ашигласан эрх буцаж ирэхгүй. Хаасан зараа дахин идэвхжүүлэхэд эрх хасагдахгүй.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <p>Багц худалдаж авснаас хойш 365 хоног хүчинтэй. Хугацаа дуусахад ашиглаагүй эрх хүчингүй болно.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <p>Хүчинтэй багцтай үед шинэ багц авбал үлдсэн эрх шинэ багц дээр нэмэгдэж, хугацаа шинэ багцаас эхэлж тоологдоно.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <p>Төлбөр шилжүүлэхдээ дансны дугаар, гүйлгээний утгыг сайтар шалгана уу. Баталгаажсан төлбөрийг буцаах боломжгүй.</p>
            </div>
          </div>
        )}
      </div>

      {/* ОДООГИЙН ТӨЛӨВ */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Одоогийн багц</p>
            <h2 className="text-2xl font-extrabold text-orange-400">{planName(sub?.plan_type || "free")}</h2>
            <p className="text-xs text-slate-300">
              Дуусах хугацаа: <b className="text-white">{sub?.expires_at || "Хугацаагүй"}</b>
            </p>
          </div>
          <span
            className={`text-sm font-bold px-3 py-1 rounded-lg ${
              expired ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-400"
            }`}
          >
            {expired ? "Хугацаа дууссан" : "Идэвхтэй"}
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-2xl">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Үлдсэн нийтлэх эрх</p>
              <p className="mt-1 text-3xl font-extrabold text-white tabular-nums">
                {sub?.remaining ?? 0}
                <span className="text-base font-semibold text-slate-400"> / {sub?.job_limit ?? 0} зар</span>
              </p>
            </div>
            <p className="text-xs text-slate-400 text-right">Ашигласан: <b className="text-slate-200">{sub?.used ?? 0}</b></p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-700 overflow-hidden" aria-hidden="true">
            <div
              className={`h-full rounded-full ${usedPercent >= 90 || expired ? "bg-red-400" : "bg-orange-400"}`}
              style={{ width: `${expired ? 100 : usedPercent}%` }}
            />
          </div>
          {(expired || (sub && sub.remaining <= 0)) && (
            <p className="mt-3 text-xs text-red-300">
              {expired ? "Багцын хугацаа дууссан тул шинэ зар нийтлэх боломжгүй." : "Нийтлэх эрх дууссан."} Доорх багцаас сонгоно уу.
            </p>
          )}
        </div>
      </div>

      {/* БАГЦУУДЫН СОНГОЛТ */}
      <div className="space-y-4">
        <div className="px-1">
          <h3 className="text-xl font-bold text-gray-900">Зар нийтлэх багц</h3>
          <p className="text-sm text-gray-500 mt-1">
            Шинэ компани {PLANS.free.jobLimit} зар үнэгүй нийтлэх туршилтын эрхтэй. Илүү олон зар нийтлэхэд доорх багцаас сонгоно уу.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const popular = plan.id === "standard"
            const saving = Math.round((1 - plan.perPost / basePerPost) * 100)
            return (
              <div
                key={plan.id}
                className={`relative bg-white border p-6 rounded-3xl flex flex-col justify-between transition ${
                  popular ? "border-orange-300 shadow-lg ring-1 ring-orange-200" : "border-gray-200 shadow-sm"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-6 text-xs font-bold text-white bg-orange-500 px-3 py-1 rounded-full shadow">
                    Түгээмэл сонголт
                  </span>
                )}
                <div className="space-y-5">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-lg text-gray-900">{plan.name}</h4>
                    {sub?.plan_type === plan.id && !expired && (
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">Ашиглаж буй</span>
                    )}
                  </div>
                  <div>
                    <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
                      {plan.credits}
                      <span className="text-base font-semibold text-gray-500"> зар</span>
                    </p>
                    <p className="mt-1 text-2xl font-bold text-orange-600">{plan.price}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Нэг зар ≈ {plan.perPost.toLocaleString()} ₮
                      {saving > 0 && <span className="ml-1.5 font-semibold text-emerald-600">{saving}% хэмнэлт</span>}
                    </p>
                  </div>
                  <hr className="border-gray-100" />
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5 text-sm text-gray-700 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{plan.credits} ажлын байрны зар нийтлэх эрх</span>
                    </li>
                    {PLAN_FEATURES.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleOpenUpgradeModal({ id: plan.id, name: plan.name, price: plan.price })}
                  className={`mt-8 w-full h-12 rounded-xl font-semibold text-sm transition ${
                    popular ? "bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-600/20" : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  Худалдаж авах
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ТӨЛБӨРИЙН ТҮҮХ ХЭСЭГ */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 px-1">Төлбөр төлөлтийн түүх</h3>
        {invoices.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-4xl p-6 text-center text-gray-400 font-medium text-xs">
            <Receipt size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> Одоогоор төлбөрийн түүх байхгүй байна.
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-4xl overflow-x-auto shadow-sm">
            <table className="w-full min-w-140 text-left text-xs">
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
                    <td className="p-4">{planName(inv.plan_type)}</td>
                    <td className="p-4 font-bold">{inv.amount.toLocaleString()} ₮</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        inv.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600 animate-pulse"
                      }`}>
                        {inv.status === "paid" ? "Төлөгдсөн" : "Хүлээгдэж буй"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleOpenDetailModal(inv)}
                        className="text-xs font-bold text-orange-600 bg-orange-50/60 hover:bg-orange-600 hover:text-white px-3 py-1.5 rounded-xl transition duration-150"
                      >
                        Дэлгэрэнгүй
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SWIPE-TO-CONFIRM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-4xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Нэхэмжлэх үүсгэх</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg"><X size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /></button>
            </div>

            <div className="bg-slate-50 p-4 rounded-3xl space-y-2.5 border border-slate-100 text-xs">
              <div className="flex justify-between"><span className="text-gray-400 font-bold">Сонгосон багц:</span><span className="font-bold text-slate-900">{selectedPlan?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-bold">Төлбөрийн дүн:</span><span className="font-bold text-orange-600 text-sm">{selectedPlan?.price}</span></div>
              <hr className="border-slate-200/60 my-1" />
              
              {invoiceDetails ? (
                <>
                  <div className="flex justify-between"><span className="text-gray-400 font-bold">Хүлээн авагч банк:</span><span className="font-bold text-gray-800">{invoiceDetails.bankName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-bold">Дансны дугаар:</span><span className="font-bold text-slate-900 tracking-wider bg-white px-2 py-0.5 rounded border border-gray-100">{invoiceDetails.accountNumber}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-bold">Дансны нэр:</span><span className="font-bold text-gray-800">{invoiceDetails.accountName}</span></div>
                  <div className="flex justify-between items-center bg-orange-50 p-2.5 rounded-2xl border border-orange-100/60 mt-2">
                    <span className="text-orange-800 font-bold">Гүйлгээний утга:</span>
                    <span className="font-mono font-bold text-orange-950 bg-white px-3 py-1 rounded-xl shadow-xs border border-orange-200">{invoiceDetails.invoiceNumber}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-400 font-bold animate-pulse">Дансны мэдээлэл уншиж байна...</div>
              )}
            </div>

            <div className="bg-amber-50/70 border border-amber-100 text-amber-800 p-3.5 rounded-2xl text-xs leading-relaxed font-medium">
              <AlertTriangle size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> <b>Анхаар:</b> Та шилжүүлэг хийхдээ <b>Гүйлгээний утга</b>-ыг огт алдалгүй <span className="font-bold text-red-600">том үсгээр</span>, яг дээрх хэлбэрээр бичнэ үү. Утга буруу орсон тохиолдолд багц автоматаар идэвхжих боломжгүй болно.
            </div>

            {/* 🔥 ШИНЭ НЭМСЭН ТОВЧ болон Слайд хэсэг */}
            {/* DYNAMIC CONTENT */}
                  {paymentStage === 'initial' ? (
                    <div className="space-y-4">
                      <button
                        onClick={() => setPaymentStage('confirm')} // Дараагийн шат руу шилжих
                        className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-2xl transition"
                      >
                        Төлбөр амжилттай шилжүүлсэн
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="text-center space-y-2 py-4">
                        <div className="text-4xl"><CheckCircle2 size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /></div>
                        <p className="text-sm font-bold text-gray-800">Шилжүүлгээ хийсэн бол баруун тийш гүйлгэж эцсийн баталгаажуулалт хийнэ үү.</p>
                      </div>
                      
                      {/* Slider хэсэг */}
                      <div 
                        ref={sliderRef}
                        className="relative h-16 bg-slate-100 border-2 border-dashed border-orange-200 rounded-2xl select-none overflow-hidden p-1 flex items-center justify-center"
                        onMouseMove={(e) => handleMove(e.clientX)}
                        onMouseUp={handleEnd}
                        // ... бусад event handlers
                      >
                        <div 
                          className={`absolute left-1 top-1 bottom-1 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold cursor-grab shadow-lg transition-all`}
                          style={{ width: '56px', transform: `translateX(${swipeX}px)` }}
                          onMouseDown={(e) => handleStart(e.clientX)}
                        >
                          {updatingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-bold text-orange-400 tracking-widest uppercase pointer-events-none">
                          Гүйлгэж баталгаажуул
                        </span>
                      </div>

                      <button onClick={() => setPaymentStage('initial')} className="w-full text-xs font-bold text-gray-400 hover:text-gray-600">
                        <ArrowLeft className="inline-block w-3.5 h-3.5 mr-1 align-[-0.15em]" />Буцах
                      </button>
                    </div>
                  )}

          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-4xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-5">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">Гүйлгээний дэлгэрэнгүй</h3>
                <p className="text-xs text-gray-400 mt-0.5">Огноо: {new Date(selectedInvoice.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg"><X size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /></button>
            </div>

            <div className="bg-slate-50 p-4 rounded-3xl space-y-3 border border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Сонгосон багц:</span>
                <span className="font-bold text-slate-900">{planName(selectedInvoice.plan_type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Төлөх дүн:</span>
                <span className="font-bold text-orange-600 text-sm">{selectedInvoice.amount.toLocaleString()} ₮</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold">Төлбөрийн төлөв:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedInvoice.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600 animate-pulse"
                }`}>
                  {selectedInvoice.status === "paid" ? "Төлөгдсөн" : "Хүлээгдэж буй"}
                </span>
              </div>

              <hr className="border-slate-200/60 my-1" />

              <div className="flex justify-between"><span className="text-gray-400 font-bold">Хүлээн авагч банк:</span><span className="font-bold text-gray-800">Хаан Банк</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-bold">Дансны дугаар:</span><span className="font-bold text-slate-900 tracking-wider bg-white px-2 py-0.5 rounded border border-gray-100">5011XXXXXX</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-bold">Дансны нэр:</span><span className="font-bold text-gray-800">Эм СТАФФИНГ ХХК</span></div>
              
              <div className="flex justify-between items-center bg-orange-50 p-2.5 rounded-2xl border border-orange-100/60 mt-2">
                <span className="text-orange-800 font-bold">Гүйлгээний утга:</span>
                <span className="font-mono font-bold text-orange-950 bg-white px-3 py-1 rounded-xl shadow-xs border border-orange-200">
                  {selectedInvoice.invoice_number}
                </span>
              </div>
            </div>

            {selectedInvoice.status !== "paid" && (
              <div className="bg-amber-50/70 border border-amber-100 text-amber-800 p-3.5 rounded-2xl text-xs leading-relaxed font-medium">
                ℹ️ <b>Мэдэгдэл:</b> Та төлбөрөө дээрх данс руу шилжүүлсний дараа админ таны гүйлгээний утгыг шалгаж 5-15 минутын дотор багцыг идэвхжүүлэх болно.
              </div>
            )}

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