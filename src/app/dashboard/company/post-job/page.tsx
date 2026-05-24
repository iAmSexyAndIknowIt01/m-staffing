import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import PostJobForm from "./PostJobForm" // Доор үүсгэх Форм компонент

export default async function PostJobPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  // Хамгаалалт: Хэрэв нэвтрээгүй эсвэл Ажил хайгч (staff) энэ хуудас руу орвол буцаана
  if (!userId || userRole !== "company") {
    redirect("/dashboard") // Эрхгүй бол үндсэн dashboard руу шилжүүлнэ
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Толгой хэсэг */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Шинэ ажлын байр зарлах 💼</h1>
        <p className="text-gray-500 mt-2">
          Та өөрийн багт хэрэгцээтэй байгаа боловсон хүчний мэдээллийг үнэн зөв бөглөнө үү.
        </p>
      </div>

      {/* Форм карт */}
      <div className="bg-white border border-gray-100 p-8 md:p-10 rounded-[32px] shadow-sm">
        <PostJobForm userId={userId} />
      </div>
    </div>
  )
}