"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LocationModal from "@/components/LocationModal"

interface EditJobFormProps {
  jobId: string
  initialData: {
    title: string
    category: string
    jobType?: string
    job_type?: string
    location: string
    salary: string
    salaryType?: "monthly" | "hourly"
    salary_type?: "monthly" | "hourly"
    description: string
    requirements: string
    status: string
  }
}

interface ModalState {
  isOpen: boolean
  type: "success" | "error" | "warning"
  message: string
}

export default function EditJobForm({ jobId, initialData }: EditJobFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Модалын төлөв
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "success",
    message: ""
  })

  // Сэрвэрээс ирсэн цалингийн төрөл болон бусад датаг оноох
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    category: initialData.category || "",
    jobType: initialData.jobType || initialData.job_type || "fulltime",
    location: initialData.location || "Улаанбаатар",
    salary: initialData.salary || "",
    salaryType: initialData.salaryType || initialData.salary_type || "monthly",
    description: initialData.description || "",
    requirements: initialData.requirements || "",
    status: initialData.status || "active",
  })

  // Модал хаах болон хуудас шилжих ложик
  const handleModalClose = () => {
    setModal((prev) => ({ ...prev, isOpen: false }))
    if (modal.type === "success") {
      router.push("/dashboard/company/post-job")
      router.refresh()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.category || !formData.description || !formData.requirements || !formData.salary) {
      setModal({
        isOpen: true,
        type: "warning",
        message: "Заавал бөглөх талбаруудыг бөглөнө үү!"
      })
      return
    }

    try {
      setIsSaving(true)

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          salary_type: formData.salaryType 
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Хадгалж чадсангүй")

      setModal({
        isOpen: true,
        type: "success",
        message: "Ажлын байрны өөрчлөлт амжилттай хадгалагдлаа! ✏️"
      })
    } catch (err: any) {
      setModal({
        isOpen: true,
        type: "error",
        message: err.message || "Серверт алдаа гарлаа. Дараа дахин оролдоно уу."
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* 1. БАЙРШИЛ СОНГОХ МОДАЛ */}
      <LocationModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={(selectedLocation) => {
          setFormData({ ...formData, location: selectedLocation });
        }}
      />


      {/* МЭДЭГДЭЛ ХАРУУЛАХ MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl border border-gray-50">
            
            {/* Төлөвөөс хамаарсан Icon */}
            <div className="flex justify-center mb-5">
              {modal.type === "success" && (
                <div className="flex items-center justify-center h-16 w-16 bg-green-50 rounded-full text-green-500 text-2xl animate-bounce">
                  ✓
                </div>
              )}
              {modal.type === "error" && (
                <div className="flex items-center justify-center h-16 w-16 bg-red-50 rounded-full text-red-500 text-2xl font-bold">
                  ✕
                </div>
              )}
              {modal.type === "warning" && (
                <div className="flex items-center justify-center h-16 w-16 bg-amber-50 rounded-full text-amber-500 text-2xl font-bold">
                  !
                </div>
              )}
            </div>

            {/* Гарчиг */}
            <h3 className="text-lg font-black text-gray-900 mb-2">
              {modal.type === "success" && "Амжилттай"}
              {modal.type === "error" && "Алдаа гарлаа"}
              {modal.type === "warning" && "Анхааруулга"}
            </h3>

            {/* Мэдээлэл */}
            <p className="text-sm font-medium text-gray-500 leading-relaxed mb-6">
              {modal.message}
            </p>

            {/* Үйлдэл хийх товчлуур */}
            <button
              onClick={handleModalClose}
              className={`w-full py-3.5 px-6 font-bold rounded-2xl transition shadow-md ${
                modal.type === "success" 
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/10" 
                  : modal.type === "error"
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/10"
                  : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10"
              }`}
            >
              {modal.type === "success" ? "Үргэлжлүүлэх" : "Хаах"}
            </button>
          </div>
        </div>
      )}

      {/* API-ТАЙ ХОЛБОГДОЖ БАЙХАД ХАРАГДАХ ДЭЛГЭЦ ДҮҮРЭН LOADER */}
      {isSaving && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
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
            Өөрчлөлтийг хадгалж байна, түр хүлээнэ үү...
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Ажлын байрны нэр */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Ажлын байрны нэр <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Жишээ нь: Ахлах график дизайнер"
            className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4 outline-none focus:border-orange-400 focus:bg-white transition"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        {/* 2. Чиглэл болон Ажлын төрөл */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Мэргэжлийн чиглэл <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4 outline-none focus:border-orange-400 focus:bg-white transition"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Сонгох...</option>
              <option value="it">Мэдээллийн технологи (IT)</option>
              <option value="finance">Санхүү, Нягтлан бодох</option>
              <option value="marketing">Маркетинг, Борлуулалт</option>
              <option value="hr">Хүний нөөц, Удирдлага</option>
              <option value="design">Дизайн, Креатив</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Ажлын цагийн төрөл
            </label>
            <select
              className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4 outline-none focus:border-orange-400 focus:bg-white transition"
              value={formData.jobType}
              onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
            >
              <option value="fulltime">Бүтэн цагийн (Full-time)</option>
              <option value="parttime">Хагас цагийн (Part-time)</option>
              <option value="contract">Гэрээт ажилтан</option>
              <option value="intern">Дадлагажигч</option>
              <option value="remote">Зайнаас / Цахимаар</option>
            </select>
          </div>
        </div>

        {/* 3. Байршил болон Цалингийн хэсэг */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Ажиллах байршил <span className="text-red-500">*</span>
            </label>
            <div 
              onClick={() => setIsLocationModalOpen(true)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4 cursor-pointer hover:border-orange-400 transition flex justify-between items-center"
            >
              <span className={formData.location ? "text-gray-900 font-semibold" : "text-gray-400"}>
                {formData.location || "Байршил сонгох..."}
              </span>
              <span className="text-orange-500 text-xs font-bold">Өөрчлөх</span>
          </div>
        </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Цалингийн нөхцөл болон хэмжээ <span className="text-red-500">*</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1 flex p-1 bg-gray-50 border border-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, salaryType: "monthly" })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    formData.salaryType === "monthly"
                      ? "bg-white text-orange-500 shadow-xs border border-gray-100"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Сараар
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, salaryType: "hourly" })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    formData.salaryType === "hourly"
                      ? "bg-white text-orange-500 shadow-xs border border-gray-100"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Цагаар
                </button>
              </div>

              <div className="sm:col-span-2 relative">
                <input
                  type="number"
                  placeholder={formData.salaryType === "monthly" ? "Жишээ нь: 2500000" : "Жишээ нь: 15000"}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-3.5 outline-none focus:border-orange-400 focus:bg-white transition pr-16 text-sm font-semibold"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                  {formData.salaryType === "monthly" ? "₮ / сар" : "₮ / цаг"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Зарын төлөв */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Зарын төлөв (Статус)
          </label>
          <select
            className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4 outline-none focus:border-orange-400 focus:bg-white transition"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="active">Идэвхтэй (Шууд харагдана)</option>
            <option value="draft">Ноорог (Түр хадгалах)</option>
            <option value="closed">Хаагдсан (Хүн авахгүй)</option>
          </select>
        </div>

        {/* 5. Ажлын тодорхойлолт */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Ажлын үүрэг, тодорхойлолт <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={5}
            placeholder="Гүйцэтгэх үндсэн үүрэг болон ажлын орчны талаар бичнэ үү..."
            className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4 outline-none focus:border-orange-400 focus:bg-white transition resize-none"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        {/* 6. Тавигдах шаардлага */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Тавигдах шаардлага <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={5}
            placeholder="Шаардлагатай ажлын туршлага, боловсрол, ур чадваруудыг жагсаан бичнэ үү..."
            className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4 outline-none focus:border-orange-400 focus:bg-white transition resize-none"
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            required
          />
        </div>

        {/* Товчлуурууд */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-50">
          <Link
            href="/dashboard/company/post-job"
            className="flex-1 py-4 text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition text-center order-2 sm:order-1"
          >
            Цуцлах
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-4 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl transition disabled:opacity-50 shadow-lg shadow-orange-500/10 order-1 sm:order-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving ? "Түр хүлээнэ үү..." : "Өөрчлөлтийг хадгалах 💾"}
          </button>
        </div>
      </form>
    </>
  )
}