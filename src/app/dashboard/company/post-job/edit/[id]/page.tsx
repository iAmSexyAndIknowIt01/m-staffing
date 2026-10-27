import { getSession } from "@/lib/session"
import { getCompanyJob } from "@/lib/companyJobs"
import { redirect, notFound } from "next/navigation"
import JobPostForm from "@/components/company/JobPostForm"
import BackLink from "@/components/common/BackLink"

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  const userId = session?.userId
  const userRole = session?.role

  // Хамгаалалт: Хэрэв нэвтрээгүй эсвэл Ажил хайгч (staff) энэ хуудас руу орвол буцаана
  if (!userId || userRole !== "company") {
    redirect("/dashboard")
  }

  // Сэрвэр тал дээр засах гэж буй ажлын анхны өгөгдлийг DB-ээс шууд татах
  // (өөрийн API-г HTTP-ээр дуудахгүй — production дээр localhost руу хандаж алдаа өгдөг байсан)
  let initialData = null
  try {
    initialData = await getCompanyJob(id, userId)
  } catch (error) {
    console.error("Дата татахад алдаа гарлаа:", error)
  }

  // Хэрэв зар олдохгүй эсвэл эрх хүрэхгүй бол 404 хуудас руу шилжүүлнэ
  if (!initialData) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-5 sm:space-y-6">
      <div>
        <BackLink href="/dashboard/company/post-job" label="Зарын жагсаалт" className="mb-2" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Ажлын байрны зар засах</h1>
        <p className="text-sm text-gray-500 mt-1">Хадгалсан өөрчлөлт ажил хайгчдад шууд харагдана.</p>
      </div>

      <div className="bg-white border border-gray-100 p-5 sm:p-8 rounded-2xl shadow-sm">
        <JobPostForm mode="edit" jobId={id} initial={initialData} />
      </div>
    </div>
  )
}
