"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import AlertModal from "@/components/staff/jobs/AlertModal"
import Pagination from "@/components/staff/jobs/Pagination"
import LoadingLayout from "@/components/staff/common/LoadingLayout"
import JobFilterBar from "@/components/staff/jobs/JobFilterBar"
import JobCard from "@/components/staff/jobs/JobCard"
import AdCard from "@/components/staff/jobs/AdCard"
import AdDetailModal from "@/components/staff/jobs/AdDetailModal"
import ShareModal from "@/components/staff/jobs/ShareModal"
import { useSearchParams } from "next/navigation"
import { getErrorMessage } from "@/lib/errors"

interface Company {
  id?: string
  company_id?: string 
  name: string
  logo_url: string | null
}

interface Job {
  id: string
  title: string
  category: string
  job_type: string
  salary_type: string
  location: string
  salary: string
  description: string
  requirements: string
  created_at: string
  is_applied: boolean
  mt_company?: Company
}

interface Ad {
  id: string
  title: string
  description: string
  image_url?: string
  link_url?: string
  created_at: string
  color_from: string
  color_to: string
  badge: string
}

export default function StaffJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false) 
  const [error, setError] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  
  // URL-аас page утгыг авах, байхгүй бол 1 гэж үзэх
  const pageParam = searchParams.get("page")
  const initialPage = pageParam ? parseInt(pageParam, 10) : 1
  
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "")
  const [selectedJobType, setSelectedJobType] = useState(searchParams.get("type") || "")
  const [filterApplied, setFilterApplied] = useState(searchParams.get("applied") || "all")
  
  const [selectedShareJob, setSelectedShareJob] = useState<Job | null>(null)
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; title: string }>({
    show: false,
    message: "",
    title: "Мэдэгдэл"
  })

  const jobsPerPage = 10
  const jobsTopRef = useRef<HTMLDivElement>(null)

  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<string[]>([])

  const handleShare = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation()
    setSelectedShareJob(job)
  }

  // Шүүлтүүр эсвэл хуудас өөрчлөгдөх бүрт URL-ийг шинэчлэх
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // Page
    if (currentPage === 1) {
      params.delete("page")
    } else {
      params.set("page", currentPage.toString())
    }

    // Search query
    if (searchQuery.trim() === "") {
      params.delete("search")
    } else {
      params.set("search", searchQuery)
    }

    // Category
    if (selectedCategory === "") {
      params.delete("category")
    } else {
      params.set("category", selectedCategory)
    }

    // Job Type
    if (selectedJobType === "") {
      params.delete("type")
    } else {
      params.set("type", selectedJobType)
    }

    // Filter Applied
    if (filterApplied === "all") {
      params.delete("applied")
    } else {
      params.set("applied", filterApplied)
    }
    
    const queryStr = params.toString()
    const newUrl = queryStr ? `?${queryStr}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
  }, [currentPage, searchQuery, selectedCategory, selectedJobType, filterApplied, router])


  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const res = await fetch("/api/staff/bookmarks")
        const data = await res.json()
        if (res.ok) {
          setBookmarkedJobIds(data.bookmarks || [])
        }
      } catch (err) {
        console.error("Bookmark татахад алдаа гарлаа", err)
      }
    }
    fetchBookmarks()
  }, [])

  const handleToggleBookmark = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation()

    setBookmarkedJobIds((prev) => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    )

    try {
      const res = await fetch("/api/staff/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      })

      if (!res.ok) {
        const data = await res.json()
        console.error(data.error)
      }
    } catch (err) {
      console.error("Bookmark хадгалахад алдаа гарлаа", err)
    }
  }

  useEffect(() => {
    if (selectedAd || selectedShareJob || alertModal.show) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [selectedAd, selectedShareJob, alertModal.show])

  const showAlert = (message: string, title: string = "Анхааруулга") => {
    setAlertModal({ show: true, message, title })
  }

  const formatSalary = (salaryStr: string | null | undefined) => {
    if (!salaryStr) return "Тохиролцоно"
    const numericSalary = parseInt(salaryStr.replace(/\D/g, ""), 10)
    if (isNaN(numericSalary)) return salaryStr
    return `${numericSalary.toLocaleString()} ₮`
  }

  const getCompanyLogoUrl = (logoUrl: string | null | undefined) => {
    if (!logoUrl) return null
    if (logoUrl.startsWith("http")) return logoUrl
    
    const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project-id.supabase.co" 
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/company-logos/${logoUrl}`
  }

  const handleCompanyClick = (e: React.MouseEvent, company: Company | undefined) => {
    e.preventDefault()
    e.stopPropagation() 
    
    if (!company) return
    const actualCompanyId = company.id || company.company_id

    if (actualCompanyId) {
      // 1. Одоо байгаа бүх параметрүүдийг авах
      const params = new URLSearchParams(searchParams.toString())
      
      // 2. Хуудасны дугаарыг шинэчлэх (шаардлагатай бол)
      params.set("page", currentPage.toString())

      // 3. Бүх параметрийг string болгон хувиргаад URL-д залгах
      router.push(`/dashboard/company/profile/${actualCompanyId}?${params.toString()}`)
    } else {
      console.warn("Компанийн ID олдсонгүй:", company)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [jobsRes, adsRes] = await Promise.all([
          fetch("/api/staff/jobs"),
          fetch("/api/staff/ads") 
        ]);
        const jobsData = await jobsRes.json();
        if (!jobsRes.ok) throw new Error(jobsData.error || "Ажлын зар татахад алдаа гарлаа.");
        setJobs(jobsData.jobs || []);

        // Сурталчилгаа татагдаагүй ч ажлын зарыг харуулна
        const adsData = adsRes.ok ? await adsRes.json() : {};
        setAds(adsData.ads || []);
      } catch (err) {
        setError(getErrorMessage(err, "Өгөгдөл татахад алдаа гарлаа. Хуудсаа дахин ачаална уу."));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [])

  const categories = useMemo(() => {
    const lowerCategories = jobs
      .map((j) => j.category?.trim().toLowerCase())
      .filter(Boolean)

    const uniqueLower = Array.from(new Set(lowerCategories))

    return uniqueLower.map((cat) => {
      if (cat === "it") return "IT" 
      return cat.charAt(0).toUpperCase() + cat.slice(1) 
    })
  }, [jobs])

  const getJobTypeText = (type: string) => {
    switch (type) {
      case "fulltime": return "Бүтэн цаг";
      case "parttime": return "Хагас цаг";
      case "intern" : return "Дадлагажигч";
      case "remote": return "Зайнаас (Remote)";
      default: return type
    }
  }

  const getSalaryTypeText = (type: string) => {
    switch (type) {
      case "monthly": return "Сарын"
      case "hourly": return "Цагийн"
      case "yearly": return "Жилийн"
      case "negotiable": return "Тохиролцоно"
      default: return type || ""
    }
  }

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const isJobApplied = job.is_applied

      if (filterApplied === "applied" && !isJobApplied) return false
      if (filterApplied === "not_applied" && isJobApplied) return false

      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.mt_company?.name && job.mt_company.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = selectedCategory === "" || 
        (job.category && job.category.toLowerCase() === selectedCategory.toLowerCase())

      const matchesType = selectedJobType === "" || job.job_type === selectedJobType

      return matchesSearch && matchesCategory && matchesType
    })
  }, [jobs, searchQuery, selectedCategory, selectedJobType, filterApplied])

  // Шүүлт/хуудас солигдох үед богино хугацаанд skeleton харуулна
  const [filteringFlash, setFilteringFlash] = useState<{ ms: number } | null>(null)
  useEffect(() => {
    if (!filteringFlash) return
    const timer = setTimeout(() => setIsFiltering(false), filteringFlash.ms)
    return () => clearTimeout(timer)
  }, [filteringFlash])

  const flashFiltering = (ms: number) => {
    setIsFiltering(true)
    setFilteringFlash({ ms }) // шинэ объект тул дараалсан дуудалт бүр таймерыг дахин эхлүүлнэ
  }

  // Шүүлтүүр өөрчлөгдөхөд эхний хуудас руу буцна.
  // Анх ачаалахад дуудагдахгүй тул URL дээрх page параметр хадгалагдана.
  const withPageReset = (setter: (val: string) => void) => (val: string) => {
    setter(val)
    setCurrentPage(1)
    flashFiltering(350)
  }

  const changePage = (page: number) => {
    setCurrentPage(page)
    flashFiltering(300)
    jobsTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  const totalPages = useMemo(
    () => Math.ceil(filteredJobs.length / jobsPerPage),
    [filteredJobs.length]
  )

  const visiblePages = useMemo(() => {
    const maxVisible = 5
    let startPage = Math.max(currentPage - Math.floor(maxVisible / 2), 1)
    let endPage = startPage + maxVisible - 1

    if (endPage > totalPages) {
      endPage = totalPages
      startPage = Math.max(totalPages - maxVisible + 1, 1)
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
  }, [currentPage, totalPages])

  const paginatedJobs = useMemo(
    () => filteredJobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage),
    [filteredJobs, currentPage]
  )

  if (loading) {
    return <LoadingLayout loading={loading} />
  }

  return (
    <div ref={jobsTopRef} className="space-y-8 min-h-screen pb-12">
      
      {/* ТОЛГОЙ ХЭСЭГ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Нээлттэй ажлын байрууд</h1>
          <p className="text-sm text-gray-400 mt-1">
            Танд тохирох {filteredJobs.length} ажлын санал байна
            {" • "}
            Хуудас {currentPage} / {totalPages || 1}
          </p>
        </div>
      </div>

      {/* ШҮҮЛТҮҮРИЙН КОМПОНЕНТ */}
      <JobFilterBar
        searchQuery={searchQuery}
        setSearchQuery={withPageReset(setSearchQuery)}
        selectedCategory={selectedCategory}
        setSelectedCategory={withPageReset(setSelectedCategory)}
        selectedJobType={selectedJobType}
        setSelectedJobType={withPageReset(setSelectedJobType)}
        filterApplied={filterApplied}
        setFilterApplied={withPageReset(setFilterApplied)}
        categories={categories}
      />

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-center">
          ⚠️ Алдаа гарлаа: {error}
        </div>
      )}

      {/* ЖАГСААЛТЫН ТӨЛӨВҮҮД */}
      {isFiltering ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-24 text-center shadow-sm flex flex-col items-center justify-center min-h-87.5 animate-fade-in">
          <div className="relative flex items-center justify-center h-20 w-20">
            <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-lg animate-pulse" />
            <div className="absolute inset-0 border border-dashed border-indigo-200 rounded-full animate-[spin_6s_linear_infinite]" />
            <div className="absolute inset-1.5 border-t border-b border-indigo-600 rounded-full animate-spin" />
            <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
              <span className="text-[9px] font-black tracking-wider text-indigo-950 uppercase animate-pulse">
                mstaffing
              </span>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mt-4 animate-pulse">
            Жагсаалтыг шинэчилж байна...
          </p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center text-gray-400 shadow-sm flex flex-col items-center">
          <span className="text-5xl mb-3">🔍</span>
          <p className="font-semibold text-gray-600">Илэрц олдсонгүй</p>
          <p className="text-xs text-gray-400 mt-1">Хайлтын үг эсвэл шүүлтүүрээ өөрчилж үзнэ үү.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedJobs.map((job, index) => {
            const isJobApplied = job.is_applied;
            const globalIndex = (currentPage - 1) * jobsPerPage + index;
            const adIndex = Math.floor(globalIndex / 5) % ads.length;
            const adToShow = ads.length > 0 && (globalIndex + 1) % 5 === 0 ? ads[adIndex] : null;
            return (
              <React.Fragment key={job.id}>
                <JobCard
                  job={job}
                  isJobApplied={isJobApplied}
                  isBookmarked={bookmarkedJobIds.includes(job.id)}
                  onToggleBookmark={(e) => handleToggleBookmark(e, job.id)}
                  onShare={handleShare}
                  onClick={() => router.push(`/dashboard/staff/jobs/${job.id}`)}      
                  onCompanyClick={handleCompanyClick}
                  getCompanyLogoUrl={getCompanyLogoUrl}
                  getJobTypeText={getJobTypeText}
                  getSalaryTypeText={getSalaryTypeText}
                  formatSalary={formatSalary}
                />

                {adToShow && <AdCard ad={adToShow} onOpenModal={(ad) => setSelectedAd(ad as Ad)} />}
              </React.Fragment>
            )
          })}
        </div>
      )}

      {/* ХУУДАСЛАЛТ */}
      <Pagination
        filteredJobsCount={filteredJobs.length}
        totalPages={totalPages}
        isFiltering={isFiltering}
        currentPage={currentPage}
        visiblePages={visiblePages}
        setCurrentPage={changePage}
      />

      {/* МОДАЛ ЦОНХНУУД */}
      {/* Share Modal */}
      <ShareModal
        show={!!selectedShareJob}
        onClose={() => setSelectedShareJob(null)}
        job={selectedShareJob}
        formatSalary={formatSalary}
        showAlert={showAlert}
      />
      
      {selectedAd && (
        <AdDetailModal 
          selectedAd={selectedAd} 
          onClose={() => setSelectedAd(null)} 
        />
      )}

      <AlertModal
        alertModal={alertModal}
        onClose={() => setAlertModal((prev) => ({ ...prev, show: false }))}
      />
    </div>
  )
}