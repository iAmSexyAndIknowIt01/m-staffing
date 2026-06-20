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
    job_type?: string // Баазын баганын нэрнээс хамаарч аль нэгийг нь авна
    location: string
    salary: string
    description: string
    requirements: string
    status: string
  }
}

export default function EditJobForm({ jobId, initialData }: EditJobFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Сэрвэрээс ирсэн бүх анхны датаг state-д онооно
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    category: initialData.category || "",
    jobType: initialData.jobType || initialData.job_type || "fulltime",
    location: initialData.location || "Улаанбаатар",
    salary: initialData.salary || "",
    description: initialData.description || "",
    requirements: initialData.requirements || "",
    status: initialData.status || "active",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.category || !formData.description || !formData.requirements) {
      setError("Заавал бөглөх талбаруудыг бөглөнө үү!")
      return
    }

    try {
      setIsSaving(true)
      setError("")

      // Манай шинээр үүсгэсэн /api/jobs/[id] API-ийн PUT хэсгийг дуудна
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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

      {/* 2. Чиглэл болон Ажлын төрөл (Хоёр багана) */}
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

      {/* 3. Байршил болон Цалин */}
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
            Цалингийн хэмжээ (Сард)
          </label>
          <input
            type="text"
            placeholder="Жишээ нь: 2.5 - 3.5 сая ₮, эсвэл Тохиролцоно"
            className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4 outline-none focus:border-orange-400 focus:bg-white transition"
            value={formData.salary}
            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
          />
        </div>
      </div>

      {/* 4. Зарын төлөв (Нэмэлтээр оруулсан) */}
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