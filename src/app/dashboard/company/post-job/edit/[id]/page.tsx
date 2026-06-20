import { cookies, headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import EditJobForm from "./EditJobForm"

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  // Хамгаалалт: Хэрэв нэвтрээгүй эсвэл Ажил хайгч (staff) энэ хуудас руу орвол буцаана
  if (!userId || userRole !== "company") {
    redirect("/dashboard")
  }

  // Сэрвэр тал дээр засах гэж буй ажлын анхны өгөгдлийг татах
  let initialData = null
  try {
    const requestHeaders = await headers()
    
    // Таны шинээр үүсгэсэн /api/jobs/[id] РҮҮ ХАНДАНА
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/jobs/${id}`, {
      cache: 'no-store',
      headers: {
        // Сэрвэр талын fetch учраас нэвтрэлтийн күүкиг гараар дамжуулна
        cookie: requestHeaders.get('cookie') || '',
      }
    })
    
    const result = await response.json()
    if (response.ok && result.data) {
      initialData = result.data
    }
  } catch (error) {
    console.error("Дата татахад алдаа гарлаа:", error)
  }

  // Хэрэв зар олдохгүй эсвэл эрх хүрэхгүй бол 404 хуудас руу шилжүүлнэ
  if (!initialData) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      
      {/* БУЦАХ ХОЛБООС */}
      <div>
        <Link 
          href="/dashboard/company/post-job" 
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-slate-800 transition"
        >
          ← Зарын жагсаалт руу буцах
        </Link>
      </div>

      {/* ТОЛГОЙ ХЭСЭГ */}
      <div className="border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ажлын байрны зар засах ✏️</h1>
        <p className="text-gray-500 mt-2 text-sm md:text-base leading-relaxed">
          Та өөрийн зарласан ажлын байрны мэдээллийг шинэчлэн үнэн зөв бөглөнө үү. 
          Таны оруулсан өөрчлөлт шууд <span className="text-orange-500 font-semibold">mt_openjob</span> баазад шинэчлэгдэн хадгалагдах болно.
        </p>
      </div>

      {/* ФОРМ БАЙРЛАХ КАРТ */}
      <div className="bg-white border border-gray-100 p-8 md:p-10 rounded-[2.5rem] shadow-sm">
        <EditJobForm jobId={id} initialData={initialData} />
      </div>

    </div>
  )
}