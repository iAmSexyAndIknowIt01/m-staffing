"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
    salary_type?: "monthly" | "hourly" // Баазын багана болон ирж буй датаны аль алийг нь тооцно
    description: string
    requirements: string
    status: string
  }
}

export default function EditJobForm({ jobId, initialData }: EditJobFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Сэрвэрээс ирсэн цалингийн төрөл болон бусад датаг оноох
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    category: initialData.category || "",
    jobType: initialData.jobType || initialData.job_type || "fulltime",
    location: initialData.location || "Улаанбаатар",
    salary: initialData.salary || "",
    salaryType: initialData.salaryType || initialData.salary_type || "monthly", // Өгөгдмөл нь 'monthly'
    description: initialData.description || "",
    requirements: initialData.requirements || "",
    status: initialData.status || "active",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.category || !formData.description || !formData.requirements || !formData.salary) {
      setError("Заавал бөглөх талбаруудыг бөглөнө үү!")
      return
    }

    try {
      setIsSaving(true)
      setError("")

      // API руу PUT хүсэлтээр шинэчлэгдсэн formData (salaryType-тай цуг) илгээнэ
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          // Хэрэв API тал дээр snake_case (salary_type) хүлээж авдаг бол:
          salary_type: formData.salaryType 
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Хадгалж чадсангүй")

      alert("Ажлын байрны өөрчлөлт амжилттай хадгалагдлаа! ✏️")
      router.push("/dashboard/company/post-job")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Серверт алдаа гарлаа. Дараа дахин оролдоно уу.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold">
          ❌ Алдаа: {error}
        </div>
      )}

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
            <option value="design">Дизайн, Кリエитив</option>
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

      {/* 3. Байршил болон Цалингийн хэсэг (Шинэчлэгдсэн) */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Ажиллах байршил
          </label>
          <input
            type="text"
            placeholder="Жишээ нь: Улаанбаатар, Сүхбаатар дүүрэг"
            className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4 outline-none focus:border-orange-400 focus:bg-white transition"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Цалингийн нөхцөл болон хэмжээ <span className="text-red-500">*</span>
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Сарын / Цагийн сонголт (хуучин утга нь идэвхжсэн байна) */}
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

            {/* Хэмжээ оруулах талбар */}
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
  )
}