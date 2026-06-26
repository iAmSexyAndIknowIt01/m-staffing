"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface ProfileData {
  full_name: string
  email: string
  phone: string
  bio: string
  avatar_url: string
  skills: {
    technical: string[]
    languages: string[]
  }
  experience: Array<{
    company: string
    position: string
    startDate: string
    endDate: string
    description: string
  }>
  education: Array<{
    school: string
    degree: string
    field: string
    graduationYear: string
    isCurrent: boolean
  }>
  availability: any
}

export default function StaffCVPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const cvTemplateRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchProfileData() {
      try {
        const res = await fetch("/api/staff/profile", { cache: "no-store" })
        if (!res.ok) throw new Error("Профайл мэдээллийг татаж чадсангүй.")
        
        const result = await res.json()
        if (result.success && result.profile) {
          setProfile(result.profile)
        } else {
          throw new Error(result.error || "Өгөгдөл олдсонгүй.")
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfileData()
  }, [])

  const handleDownloadPDF = async () => {
    if (!profile || isExporting || !cvTemplateRef.current) return
    setIsExporting(true)

    try {
      const html2pdf = (await import("html2pdf.js")).default
      
      const opt = {
        margin: 0, // Хоосон хуудас үүсэхээс сэргийлж 0 болгов
        filename: `CV_${profile.full_name.replace(/\s+/g, "_")}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          logging: false,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const }, // Хэмжээг A4 болгож засав
        pagebreak: { mode: ["avoid-all", "css"] }
      }

      await html2pdf().set(opt).from(cvTemplateRef.current).save()
    } catch (err) {
      console.error("PDF үүсгэхэд алдаа гарлаа:", err)
      alert("PDF татахад алдаа гарлаа.")
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-sm font-bold text-gray-500">Миний CV хуудсыг бэлдэж байна...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center py-12 px-4">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button 
          onClick={() => router.back()} 
          className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold"
        >
          ← Буцах
        </button>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 flex flex-col items-center">
      
      {/* УДИРДЛАГЫН ЦЭС */}
      <div className="w-[210mm] flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition border border-gray-200 flex items-center gap-1"
        >
          ← Буцах
        </button>
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">CV Урьдчилан харах хэлбэр</h2>
        <button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
          style={{ backgroundColor: "#4f46e5" }}
        >
          {isExporting ? "Бэлдэж байна..." : "PDF болгож татах 📥"}
        </button>
      </div>

      {/* А4 ХЭМЖЭЭТЭЙ CV ХЭВЛЭХ ХЭСЭГ */}
      <div 
        ref={cvTemplateRef} 
        style={{ 
          boxSizing: "border-box", 
          width: "210mm",
          minHeight: "297mm",
          padding: "40px 50px 40px 50px", // Цэвэрхэн харагдуулах захын зай
          backgroundColor: "#ffffff", 
          color: "#1f2937",
          fontFamily: "Arial, sans-serif",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div style={{ flexGrow: 1 }}>
          
          {/* ТОЛГОЙ ХЭСЭГ */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #1e1b4b", paddingBottom: "24px", marginBottom: "32px" }}>
            <div style={{ width: "70%" }}>
              <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#111827", margin: "0 0 12px 0", letterSpacing: "-0.05em" }}>{profile.full_name}</h1>
              <p style={{ fontSize: "12px", color: "#4b5563", lineHeight: "1.6", margin: "0 0 16px 0", whiteSpace: "pre-line" }}>{profile.bio}</p>
              
              <div style={{ display: "flex", gap: "24px", fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>
                <div>✉️ {profile.email}</div>
                <div>📞 {profile.phone}</div>
              </div>
            </div>
            
            {profile.avatar_url && (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name} 
                style={{ width: "112px", height: "128px", objectFit: "cover", borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}
              />
            )}
          </div>

          {/* КОНТЕНТЫН ҮНДЭСЭН ХЭСЭГ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px" }}>
            
            {/* ЗҮҮН БАГАНА: УР ЧАДВАРУУД */}
            <div style={{ borderRight: "1px solid #f3f4f6", paddingRight: "16px" }}>
              {profile.skills.technical && profile.skills.technical.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "11px", fontWeight: "900", textTransform: "uppercase", tracking: "0.1em", color: "#1e1b4b", borderBottom: "1px solid #e0e7ff", paddingBottom: "4px", margin: "0 0 12px 0" }}>Мэргэжлийн чадвар</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {profile.skills.technical.map((skill, index) => (
                      <span 
                        key={index} 
                        style={{ padding: "4px 8px", fontSize: "10px", fontWeight: "700", borderRadius: "6px", backgroundColor: "#f9fafb", color: "#374151", border: "1px solid #f3f4f6" }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.skills.languages && profile.skills.languages.length > 0 && (
                <div>
                  <h3 style={{ fontSize: "11px", fontWeight: "900", textTransform: "uppercase", tracking: "0.1em", color: "#1e1b4b", borderBottom: "1px solid #e0e7ff", paddingBottom: "4px", margin: "0 0 12px 0" }}>Гадаад хэл</h3>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {profile.skills.languages.map((lang, index) => (
                      <li key={index} style={{ fontSize: "12px", fontWeight: "700", color: "#4b5563", marginBottom: "4px" }}>
                        ▪️ {lang}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* БАРУУН БАГАНА: ТУРШЛАГА БА БОЛОВСРОЛ */}
            <div>
              {profile.experience && profile.experience.length > 0 && (
                <div style={{ marginBottom: "32px" }}>
                  <h3 style={{ fontSize: "11px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em", color: "#1e1b4b", borderBottom: "1px solid #e0e7ff", paddingBottom: "4px", margin: "0 0 16px 0" }}>Ажлын туршлага</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {profile.experience.map((exp, index) => (
                      <div key={index} style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "900", color: "#111827", margin: 0, width: "65%" }}>{exp.position}</h4>
                          <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", color: "#4f46e5", backgroundColor: "#e0e7ff", whiteSpace: "nowrap" }}>
                            {exp.startDate} - {exp.endDate || "Одоог хүртэл"}
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", margin: "0 0 6px 0" }}>🏢 {exp.company}</p>
                        {exp.description && (
                          <p style={{ fontSize: "12px", color: "#4b5563", lineHeight: "1.5", margin: 0, whiteSpace: "pre-line" }}>
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.education && profile.education.length > 0 && (
                <div>
                  <h3 style={{ fontSize: "11px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em", color: "#1e1b4b", borderBottom: "1px solid #e0e7ff", paddingBottom: "4px", margin: "0 0 16px 0" }}>Боловсрол</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {profile.education.map((edu, index) => (
                      <div key={index} style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "900", color: "#111827", margin: 0 }}>{edu.school}</h4>
                          <span style={{ fontSize: "10px", fontWeight: "700", color: "#9ca3af", whiteSpace: "nowrap" }}>
                            {edu.isCurrent ? "Суралцаж буй" : `${edu.graduationYear} он`}
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", fontWeight: "700", color: "#4f46e5", margin: 0 }}>
                          {edu.degree} {edu.field && `• ${edu.field}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ХҮҮДЭСНИЙ ДООД ХЭСЭГ (Layout-д эвдрэл үүсгэхгүй кирил фонтоор хэвлэгдэнэ) */}
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "16px", marginTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "#9ca3af", fontWeight: "500", pageBreakInside: "avoid", breakInside: "avoid" }}>
          <span>Мэдээллийн үнэн зөв байдлыг системээр баталгаажуулсан болно.</span>
          <span style={{ fontWeight: "900", textTransform: "uppercase", tracking: "0.1em", color: "#1e1b4b" }}>mstaffing</span>
        </div>
      </div>

    </div>
  )
}