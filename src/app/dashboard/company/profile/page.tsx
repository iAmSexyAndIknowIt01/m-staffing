"use client"

import { useState, useEffect } from "react"

interface CompanyProfileData {
  company_name: string
  email: string
  phone: string
  website: string
}

export default function CompanyProfilePage() {
  const [formData, setFormData] = useState<CompanyProfileData>({
    company_name: "",
    email: "",
    phone: "",
    website: "",
  })
  const [pageLoading, setPageLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Хуудас ачаалагдах үед API-аас дата татах
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/company/profile")
        if (!response.ok) throw new Error("Профайл мэдээллийг авч чадсангүй.")
        
        const result = await response.json()
        if (result.data) {
          setFormData({
            company_name: result.data.company_name || "",
            email: result.data.email || "",
            phone: result.data.phone || "",
            website: result.data.website || "",
          })
        }
      } catch (err: any) {
        setMessage({ type: "error", text: err.message })
      } finally {
        setPageLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // Форм хадгалах үед API-руу PUT хүсэлт илгээх
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/company/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: formData.company_name,
          phone: formData.phone,
          website: formData.website,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Шинэчлэхэд алдаа гарлаа.")

      setMessage({ type: "success", text: "Профайл мэдээлэл амжилттай шинэчлэгдлээ! 🎉" })
    } catch (err: any) {
      setMessage({ type: "error", text: err.message })
    } finally {
      setActionLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center text-gray-400 font-medium">
        Мэдээллийг ачааллаж байна...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in px-4 sm:px-0 pb-12">
      {/* ТОЛГОЙ ХЭСЭГ */}
      <div className="mb-8 border-b border-gray-100 pb-6 pt-2">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">🏢 Компани Профайл</h1>
        <p className="text-gray-500 mt-1 text-xs md:text-sm">
          Байгууллагынхаа үндсэн мэдээллийг эндээс засаж, шинэчлэх боломжтой.
        </p>
      </div>

      {/* ФОРМ ХЭСЭГ */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        {message && (
          <div className={`p-4 rounded-xl font-bold text-sm ${
            message.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {/* Компанийн нэр */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Компанийн нэр *
            </label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
              placeholder="Жишээ: Мэргэжилтэн ХХК"
            />
          </div>

          {/* Имэйл хаяг (Засах боломжгүй - Түгжигдсэн) */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Бүртгэлтэй имэйл хаяг (Өөрчлөх боломжгүй)
            </label>
            <input
              type="email"
              disabled
              value={formData.email}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm font-medium cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Холбоо барих утас */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Холбоо барих утас
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                placeholder="Жишээ: 9911****"
              />
            </div>

            {/* Вэбсайт */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Вэбсайт линк
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-indigo-500 transition"
                placeholder="Жишээ: https://company.mn"
              />
            </div>
          </div>
        </div>

        {/* ХАДГАЛАХ ТОВЧ */}
        <div className="pt-4 border-t border-gray-50 flex justify-end">
          <button
            type="submit"
            disabled={actionLoading}
            className="w-full sm:w-auto px-6 py-3 bg-gray-950 hover:bg-gray-900 text-white font-bold text-sm rounded-xl transition shadow-sm disabled:opacity-50"
          >
            {actionLoading ? "Түр хүлээнэ үү..." : "Өөрчлөлтийг хадгалах 💾"}
          </button>
        </div>
      </form>
    </div>
  )
}