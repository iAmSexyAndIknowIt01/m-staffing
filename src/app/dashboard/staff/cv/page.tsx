"use client"

import { ArrowLeft, Check, Download, Loader2, Mail, Phone, User } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import LoadingLayout from "@/components/common/LoadingLayout"
import EmptyState from "@/components/common/EmptyState"
import type { AvailabilityDay } from "@/types/profile"
import { getErrorMessage } from "@/lib/errors"
import { showAlert } from "@/components/common/AppDialog"

interface ProfileData {
  full_name: string
  email: string
  phone: string
  bio: string
  avatar_url: string
  gender: string // <-- ШИНЭЭР НЭМЭВ
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
  availability: Record<string, AvailabilityDay | null> | null
}

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

export default function StaffCVPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const cvTemplateRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  // A4 (210mm ≈ 794px) хуудсыг дэлгэцийн өргөнд багтаан жижигрүүлэх харьцаа
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / A4_WIDTH_PX))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [profile])

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
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    fetchProfileData()
  }, [])

  // Хүйс хөрвүүлэх функц
  const getGenderText = (gender: string) => {
    switch (gender) {
      case "male": return "Хүйс: Эрэгтэй"
      case "female": return "Хүйс: Эмэгтэй"
      case "other": return "Хүйс: Бусад"
      default: return gender ? `Хүйс: ${gender}` : ""
    }
  }

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
      showAlert("PDF татахад алдаа гарлаа. Дахин оролдоно уу.", { tone: "error" })
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return <LoadingLayout loading />
  }

  if (error) {
    return (
      <EmptyState
        illustration="error"
        title="CV-г ачаалж чадсангүй"
        description={error}
        action={{ label: "Профайл руу очих", href: "/dashboard/staff/profile" }}
        className="max-w-lg mx-auto mt-10"
      />
    )
  }

  if (!profile) return null

  return (
    <div className="max-w-[210mm] mx-auto w-full space-y-5">
      {/* ТОЛГОЙ */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard/staff/profile"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-600 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Миний профайл
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Миний CV</h1>
          <p className="text-sm text-gray-500 mt-1">Профайлын мэдээллээс автоматаар үүссэн CV. Өөрчлөхийн тулд профайлаа засна уу.</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isExporting ? "Бэлдэж байна..." : "PDF татах"}
        </button>
      </div>

      {/* А4 ХЭМЖЭЭТЭЙ CV: дэлгэцэнд багтаан жижигрүүлж харуулна (PDF нь бүтэн хэмжээгээр гарна) */}
      <div ref={previewRef} className="w-full">
        <div
          className="mx-auto bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
          style={{ width: A4_WIDTH_PX * scale, height: A4_HEIGHT_PX * scale }}
        >
          <div style={{ width: A4_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <div 
          ref={cvTemplateRef} 
          style={{ 
            boxSizing: "border-box", 
            width: "210mm",
            minWidth: "210mm", 
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
            
            {/* ТОЛГОЙ ХЭСЭГ */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#ea580c", color: "#ffffff", padding: "40px 50px" }}>
              <div style={{ width: "75%" }}>
                <h1 style={{ fontSize: "32px", fontWeight: "800", margin: "0 0 8px 0", letterSpacing: "-0.03em" }}>{profile.full_name}</h1>
                <p style={{ fontSize: "12px", color: "#ffedd5", lineHeight: "1.6", margin: "0 0 16px 0", whiteSpace: "pre-line", maxWidth: "90%" }}>{profile.bio}</p>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px", fontSize: "12px", color: "#fff7ed" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Mail size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> {profile.email}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Phone size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> {profile.phone}</div>
                  {/* ХҮЙСНИЙ МЭДЭЭЛЭЛ */}
                  {profile.gender && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><User size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> {getGenderText(profile.gender)}</div>
                  )}
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
                    <h3 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#c2410c", borderLeft: "3px solid #ea580c", paddingLeft: "8px", margin: "0 0 14px 0" }}>Ур чадварууд</h3>
                    <div style={{ fontSize: "12px", color: "#334155", lineHeight: "1.8", fontWeight: "500" }}>
                      {profile.skills.technical.join(", ")}
                    </div>
                  </div>
                )}

                {profile.skills.languages && profile.skills.languages.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#c2410c", borderLeft: "3px solid #ea580c", paddingLeft: "8px", margin: "0 0 14px 0" }}>Гадаад хэл</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {profile.skills.languages.map((lang, index) => (
                        <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                          <Check size={12} color="#ea580c" strokeWidth={3} aria-hidden="true" /> {lang}
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
                    <h3 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#ea580c", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", margin: "0 0 16px 0" }}>Ажлын туршлага</h3>
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
                    <h3 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#ea580c", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", margin: "0 0 16px 0" }}>Боловсрол</h3>
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
            <span style={{ fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", color: "#ea580c" }}>mstaffing</span>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}