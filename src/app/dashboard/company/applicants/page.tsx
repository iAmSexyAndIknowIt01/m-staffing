import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import ApplicantsList from "./ApplicantsList"

export default async function ApplicantsPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  // Хамгаалалт: Зөвхөн ажил олгогч нэвтрэх эрхтэй
  if (!userId || userRole !== "company") {
    redirect("/dashboard")
  }

  // Жишээ дата (Фронтенд харагдацыг бэлдэхийн тулд)
  const mockApplicants = [
    {
      id: "app-1",
      name: "Бат-Эрдэнэ Болд",
      jobTitle: "UI/UX Designer",
      email: "baterdene@gmail.com",
      phone: "99112233",
      appliedDate: "2026-05-24",
      status: "new", // new, interview, rejected
    },
    {
      id: "app-2",
      name: "Сувд-Эрдэнэ Төмөр",
      jobTitle: "Senior Frontend Developer",
      email: "suvdaa.t@gmail.com",
      phone: "88998899",
      appliedDate: "2026-05-23",
      status: "interview",
    },
    {
      id: "app-3",
      name: "Гантулга Наран",
      jobTitle: "UI/UX Designer",
      email: "gantulga.n@gmail.com",
      phone: "95159515",
      appliedDate: "2026-05-20",
      status: "rejected",
    },
  ]

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Толгой хэсэг */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Ирсэн анкетууд 👥</h1>
        <p className="text-gray-500 mt-2">
          Танай зарласан ажлын байруудад ирүүлсэн ажил хайгчдын мэдээлэл болон CV.
        </p>
      </div>

      {/* Интерактив Жагсаалт компонент */}
      <ApplicantsList initialApplicants={mockApplicants} />
    </div>
  )
}