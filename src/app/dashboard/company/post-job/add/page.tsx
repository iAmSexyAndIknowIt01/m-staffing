import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import PostJobForm from "./PostJobForm" // Таны кодын харьцангуй замаас хамаарч байршлыг тааруулна уу

export default async function AddJobPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  // Хамгаалалт: Хэрэв нэвтрээгүй эсвэл Ажил хайгч (staff) энэ хуудас руу орвол буцаана
  if (!userId || userRole !== "company") {
    redirect("/dashboard")
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
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Шинэ ажлын байр зарлах 💼</h1>
        <p className="text-gray-500 mt-2 text-sm md:text-base leading-relaxed">
          Та өөрийн багт хэрэгцээтэй байгаа боловсон хүчний мэдээллийг үнэн зөв бөглөнө үү. 
          Таны оруулсан зар шууд <span className="text-orange-500 font-semibold">mt_openjob</span> баазад хадгалагдаж идэвхжих болно.
        </p>
      </div>

      {/* ФОРМ БАЙРЛАХ КАРТ */}
      <div className="bg-white border border-gray-100 p-8 md:p-10 rounded-[2.5rem] shadow-sm">
        {/* Таны client компонент форм */}
        <PostJobForm userId={userId} />
      </div>

    </div>
  )
}