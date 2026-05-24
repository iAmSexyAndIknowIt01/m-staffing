"use client"

import { useEffect, useState } from "react"

export default function StaffProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Формын талбарууд
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [skills, setSkills] = useState("")
  const [experience, setExperience] = useState("")
  const [education, setEducation] = useState("")

  // Анх хуудас ачаалагдахад баазаас дата татах
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/staff/profile")
        const result = await response.json()

        if (!response.ok) throw new Error(result.error)

        if (result.profile) {
          setFullName(result.profile.full_name || "")
          setEmail(result.profile.email || "")
          setPhone(result.profile.phone || "")
          setBio(result.profile.bio || "")
          setSkills(result.profile.skills || "")
          setExperience(result.profile.experience || "")
          setEducation(result.profile.education || "")
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // Профайл хадгалах функц
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch("/api/staff/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          bio,
          skills,
          experience,
          education,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      setMessage("Таны CV болон хувийн мэдээлэл амжилттай хадгалагдлаа! 🎉")
      setTimeout(() => setMessage(null), 4000) // 4 сек дараа мэдэгдлийг нууна
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-pulse">
        <div className="h-10 w-10 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-400 font-medium">Таны профайлыг уншиж байна...</span>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Гарчиг хэсэг */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Миний CV / Профайл</h1>
          <p className="text-sm text-gray-400 mt-1">Ажил олгогчдод харагдах таны мэргэжлийн карт</p>
        </div>
      </div>

      {/* Амжилттай эсвэл Алдаа гарсан үеийн Alert */}
      {message && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl text-sm font-semibold shadow-sm animate-bounce">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium">
          ⚠️ Алдаа: {error}
        </div>
      )}

      {/* Үндсэн Форм */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ЗҮҮН ТАЛ: Үндсэн хувийн мэдээлэл */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 h-fit">
          <div className="flex flex-col items-center text-center pb-4 border-b border-gray-50">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-black mb-3">
              {fullName ? fullName.charAt(0).toUpperCase() : "👤"}
            </div>
            <h3 className="font-bold text-gray-800 text-lg">{fullName || "Таны нэр"}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Ажил хайгч ажилтан</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Бүтэн Нэр *</label>
              <input
                type="text"
                required
                placeholder="Ганболд Болд"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 focus:bg-white border border-transparent focus:border-indigo-500 rounded-2xl text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Утасны дугаар</label>
              <input
                type="text"
                placeholder="9911XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 focus:bg-white border border-transparent focus:border-indigo-500 rounded-2xl text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Имэйл хаяг</label>
              <input
                type="email"
                placeholder="bold@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 focus:bg-white border border-transparent focus:border-indigo-500 rounded-2xl text-sm outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* БАРУУН ТАЛ: Мэргэжлийн туршлага, Ур чадвар */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          
          {/* Өөрийн тухай */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">🚀 Товч танилцуулга (Bio)</label>
            <textarea
              rows={3}
              placeholder="Өөрийгөө ажил олгогчдод цөөн үгээр илэрхийлж бичээрэй..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 focus:bg-white border border-transparent focus:border-indigo-500 rounded-2xl text-sm outline-none transition resize-none leading-relaxed"
            />
          </div>

          {/* Ур чадварууд */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">🛠️ Ур чадварууд</label>
            <input
              type="text"
              placeholder="Figma, React, Программчлал, Англи хэл гэх мэт (Таслалаар тусгаарлаж болно)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 focus:bg-white border border-transparent focus:border-indigo-500 rounded-2xl text-sm outline-none transition"
            />
          </div>

          {/* Ажлын туршлага */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">💼 Ажлын туршлага</label>
            <textarea
              rows={4}
              placeholder="Өмнө нь ажиллаж байсан компани, албан тушаал, хийж гүйцэтгэж байсан ажлууд..."
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 focus:bg-white border border-transparent focus:border-indigo-500 rounded-2xl text-sm outline-none transition leading-relaxed"
            />
          </div>

          {/* Боловсрол */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">🎓 Боловсрол</label>
            <textarea
              rows={3}
              placeholder="Төгссөн сургууль, мэргэжил, зэрэг цол..."
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 focus:bg-white border border-transparent focus:border-indigo-500 rounded-2xl text-sm outline-none transition leading-relaxed"
            />
          </div>

          {/* Хадгалах товч */}
          <div className="flex justify-end pt-4 border-t border-gray-50">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-2xl transition shadow-lg shadow-indigo-600/10 flex items-center gap-2 min-w-[140px] justify-center"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-b-white rounded-full animate-spin" />
                  Хадгалж байна...
                </>
              ) : (
                "Профайл хадгалах ✨"
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}