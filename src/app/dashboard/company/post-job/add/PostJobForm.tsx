"use client"

import { useState } from "react"

interface PostJobFormProps {
  userId: string
}

export default function PostJobForm({ userId }: PostJobFormProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [jobType, setJobType] = useState("fulltime")
  const [location, setLocation] = useState("Улаанбаатар")
  const [salary, setSalary] = useState("")
  const [description, setDescription] = useState("")
  const [requirements, setRequirements] = useState("")

    async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!title || !category || !description || !requirements) {
        alert("Заавал бөглөх талбаруудыг бөглөнө үү!")
        return
    }

    try {
        setLoading(true)
        
        // Манай шинээр үүсгэсэн API рүү хүсэлт илгээх
        const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            title,
            category,
            jobType,
            location,
            salary,
            description,
            requirements,
        }),
        })

        const result = await response.json()

        if (!response.ok) {
        throw new Error(result.error || "Алдаа гарлаа")
        }
        
        alert("Ажлын байр амжилттай зарлагдаж, mt_openJob баазад хадгалагдлаа! 🚀")
        window.location.href = "/dashboard"
        
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        alert(error.message || "Зарыг нийтлэх үед алдаа гарлаа.")
    } finally {
        setLoading(false)
    }
    }

  return (
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
            className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4 outline-none focus:border-orange-400 focus:bg-white transition appearance-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
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
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Ажлын тодорхойлолт */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Ажлын үүрэг, тодорхойлолт <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={5}
          placeholder="Гүйцэтгэх үндсэн үүрэг болон ажлын орчны талаар бичнэ үү..."
          className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4 outline-none focus:border-orange-400 focus:bg-white transition resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      {/* 5. Тавигдах шаардлага */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Тавигдах шаардлага <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={5}
          placeholder="Шаардлагатай ажлын туршлага, боловсрол, ур чадваруудыг жагсаан бичнэ үү..."
          className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4 outline-none focus:border-orange-400 focus:bg-white transition resize-none"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          required
        />
      </div>

      {/* Илгээх товчлуур */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-6 py-4 rounded-2xl transition shadow-lg shadow-orange-500/10 text-center"
        >
          {loading ? "Түр хүлээнэ үү..." : "Ажлын байрны зарыг нийтлэх 🚀"}
        </button>
      </div>

    </form>
  )
}