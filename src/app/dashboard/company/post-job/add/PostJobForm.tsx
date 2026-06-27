"use client"

import { useState } from "react"

interface PostJobFormProps {
  userId: string
}

interface ModalState {
  isOpen: boolean
  type: "success" | "error" | "warning"
  message: string
}

export default function PostJobForm({ userId }: PostJobFormProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [jobType, setJobType] = useState("fulltime")
  const [location, setLocation] = useState("Улаанбаатар")
  
  // Цалингийн шинэ төлөвүүд (State)
  const [salaryType, setSalaryType] = useState<"monthly" | "hourly">("monthly")
  const [salary, setSalary] = useState("")
  
  const [description, setDescription] = useState("")
  const [requirements, setRequirements] = useState("")

  // Модалын төлөв
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "success",
    message: ""
  })

  // Модал хаах болон хуудас шилжих ложик
  const handleModalClose = () => {
    setModal((prev) => ({ ...prev, isOpen: false }))
    if (modal.type === "success") {
      window.location.href = "/dashboard"
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!title || !category || !description || !requirements || !salary) {
        setModal({
          isOpen: true,
          type: "warning",
          message: "Заавал бөглөх талбаруудыг бөглөнө үү!"
        })
        return
    }

    try {
        setLoading(true)
        
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
              salaryType,
              description,
              requirements,
              userId,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Алдаа гарлаа")
        }
        
        setModal({
          isOpen: true,
          type: "success",
          message: "Ажлын байр амжилттай зарлагдаж, баазад хадгалагдлаа! 🚀"
        })
        
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        setModal({
          isOpen: true,
          type: "error",
          message: error.message || "Зарыг нийтлэх үед алдаа гарлаа."
        })
    } finally {
        setLoading(false)
    }
  }

  return (
    <>
      {/* МЭДЭГДЭЛ ХАРУУЛАХ MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl border border-gray-50 transform scale-100 transition-all">
            
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
      {loading && (
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
            Зарыг нийтэлж байна, түр хүлээнэ үү...
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* 2. Чиглэл болон Ажлын төрөл */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Мэгэжлийн чиглэл <span className="text-red-500">*</span>
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
              <option value="design">Дизайн, Креатив</option>
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

        {/* 3. Байршил болон Цалингийн хэсэг */}
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
              Цалингийн нөхцөл болон хэмжээ <span className="text-red-500">*</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1 flex p-1 bg-gray-50 border border-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSalaryType("monthly")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    salaryType === "monthly"
                      ? "bg-white text-orange-500 shadow-xs border border-gray-100"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Сараар
                </button>
                <button
                  type="button"
                  onClick={() => setSalaryType("hourly")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    salaryType === "hourly"
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
                  placeholder={salaryType === "monthly" ? "Жишээ нь: 2500000" : "Жишээ нь: 15000"}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-3.5 outline-none focus:border-orange-400 focus:bg-white transition pr-16 text-sm font-semibold"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                  {salaryType === "monthly" ? "₮ / сар" : "₮ / цаг"}
                </div>
              </div>
            </div>
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
    </>
  )
}