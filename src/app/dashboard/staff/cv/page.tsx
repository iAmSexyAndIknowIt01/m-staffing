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
        margin: 0,
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
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        pagebreak: { mode: ["avoid-all"] }
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
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
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
          className="px-5 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold"
        >
          ← Буцах
        </button>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center">
      
      {/* УДИРДЛАГЫН ЦЭС */}
      <div className="w-[210mm] flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <button 
          onClick={() => router.back()} 
          className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition border border-gray-200 flex items-center gap-1"
        >
          ← Буцах
        </button>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Premium CV хэлбэр</h2>
        <button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="px-5 py-2.5 text-white font-bold text-xs rounded-lg transition flex items-center gap-2"
          style={{ backgroundColor: "#ea580c" }} // Улбар шар товчлуур
        >
          {isExporting ? "Бэлдэж байна..." : "PDF-ээр татах 📥"}
        </button>
      </div>

      {/* А4 ХЭМЖЭЭТЭЙ CV ХЭВЛЭХ ХЭСЭГ */}
      <div 
        ref={cvTemplateRef} 
        style={{ 
          boxSizing: "border-box", 
          width: "210mm",
          height: "297mm",
          minHeight: "297mm",
          overflow: "hidden",
          backgroundColor: "#ffffff", 
          color: "#334155",
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          
          {/* ТОЛГОЙ ХЭСЭГ (МЭДЭЭЛЭЛ + ЗУРАГ) - Улбар шар өнгөтэй болгов */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#ea580c", color: "#ffffff", padding: "40px 50px" }}>
            <div style={{ width: "75%" }}>
              <h1 style={{ fontSize: "32px", fontWeight: "800", margin: "0 0 8px 0", letterSpacing: "-0.03em" }}>{profile.full_name}</h1>
              <p style={{ fontSize: "12px", color: "#ffedd5", lineHeight: "1.6", margin: "0 0 16px 0", whiteSpace: "pre-line", maxWidth: "90%" }}>{profile.bio}</p>
              
              <div style={{ display: "flex", gap: "24px", fontSize: "12px", color: "#fff7ed" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>📧 {profile.email}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>📞 {profile.phone}</div>
              </div>
            </div>
            
            {profile.avatar_url && (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name} 
                style={{ width: "100px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "2px solid #ffedd5" }}
              />
            )}
          </div>

          {/* КОНТЕНТЫН ҮНДЭСЭН ХЭСЭГ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", flexGrow: 1 }}>
            
            {/* ЗҮҮН БАГАНА: УР ЧАДВАР + ХЭЛ */}
            <div style={{ backgroundColor: "#f8fafc", padding: "35px 35px 35px 50px", borderRight: "1px solid #e2e8f0" }}>
              {profile.skills.technical && profile.skills.technical.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                  <h3 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", tracking: "0.05em", color: "#c2410c", borderLeft: "3px solid #ea580c", paddingLeft: "8px", margin: "0 0 14px 0" }}>Ур чадварууд</h3>
                  <div style={{ fontSize: "12px", color: "#334155", lineHeight: "1.8", fontWeight: "500" }}>
                    {profile.skills.technical.join(", ")}
                  </div>
                </div>
              )}

              {profile.skills.languages && profile.skills.languages.length > 0 && (
                <div>
                  <h3 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", tracking: "0.05em", color: "#c2410c", borderLeft: "3px solid #ea580c", paddingLeft: "8px", margin: "0 0 14px 0" }}>Гадаад хэл</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {profile.skills.languages.map((lang, index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                        <span style={{ color: "#ea580c" }}>✓</span> {lang}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* БАРУУН БАГАНА: ТУРШЛАГА БА БОЛОВСРОЛ */}
            <div style={{ padding: "35px 50px 35px 35px" }}>
              {profile.experience && profile.experience.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                  <h3 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", tracking: "0.05em", color: "#ea580c", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", margin: "0 0 16px 0" }}>Ажлын туршлага</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {profile.experience.map((exp, index) => (
                      <div key={index}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: 0 }}>{exp.position}</h4>
                          <span style={{ fontSize: "10px", fontWeight: "600", color: "#ea580c", whiteSpace: "nowrap" }}>
                            {exp.startDate} — {exp.endDate || "Одоо"}
                          </span>
                        </div>
                        <p style={{ fontSize: "11px", fontWeight: "600", color: "#ea580c", margin: "0 0 6px 0" }}>{exp.company}</p>
                        {exp.description && (
                          <p style={{ fontSize: "11px", color: "#475569", lineHeight: "1.5", margin: 0, whiteSpace: "pre-line" }}>
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
                  <h3 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", tracking: "0.05em", color: "#ea580c", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", margin: "0 0 16px 0" }}>Боловсрол</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {profile.education.map((edu, index) => (
                      <div key={index}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: 0 }}>{edu.school}</h4>
                          <span style={{ fontSize: "10px", fontWeight: "600", color: "#64748b", whiteSpace: "nowrap" }}>
                            {edu.isCurrent ? "Суралцаж буй" : `${edu.graduationYear} он`}
                          </span>
                        </div>
                        <p style={{ fontSize: "11px", fontWeight: "600", color: "#475569", margin: 0 }}>
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

        {/* ХҮҮДЭСНИЙ ДООД ХЭСЭГ */}
        <div style={{ borderTop: "1px solid #e2e8f0", padding: "16px 50px 24px 50px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "#94a3b8", fontWeight: "500", backgroundColor: "#ffffff" }}>
          <span></span>
          <span style={{ fontWeight: "800", textTransform: "uppercase", tracking: "0.05em", color: "#ea580c" }}>mstaffing</span>
        </div>
      </div>

    </div>
  )
}