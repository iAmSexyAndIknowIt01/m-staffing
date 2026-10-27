import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import BackLink from "@/components/common/BackLink"
import JobPostForm from "@/components/company/JobPostForm"

export default async function AddJobPage() {
  const session = await getSession()

  // Хамгаалалт: нэвтрээгүй эсвэл ажил хайгч бол буцаана
  if (!session?.userId || session.role !== "company") {
    redirect("/dashboard")
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-5 sm:space-y-6">
      <div>
        <BackLink href="/dashboard/company/post-job" label="Зарын жагсаалт" className="mb-2" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Шинэ ажлын байр зарлах</h1>
        <p className="text-sm text-gray-500 mt-1">
          Нийтэлсэн зар шууд идэвхжиж ажил хайгчдад харагдана. Бөглөж буй мэдээлэл ноорог болж автоматаар хадгалагдана.
        </p>
      </div>

      <div className="bg-white border border-gray-100 p-5 sm:p-8 rounded-2xl shadow-sm">
        <JobPostForm mode="create" />
      </div>
    </div>
  )
}
