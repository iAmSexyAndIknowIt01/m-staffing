import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

// Системээс гарах үйлдэл
async function handleLogout() {
  "use server"
  const cookieStore = await cookies()
  cookieStore.delete("user_id")
  cookieStore.delete("user_role")
  redirect("/login")
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  // Хэрэв нэвтрээгүй бол шууд буцаана
  if (!userId) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* ДЭЭД НАВИГЕЙШН ЦЭС (Аль алинд нь харагдана) */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <span className="text-xl font-black tracking-[4px] text-orange-500">
              MSTAFFING
            </span>
            <div className="hidden md:flex items-center gap-6 text-gray-600 font-medium">
              <Link href="/dashboard" className="text-orange-500">Хянах самбар</Link>
              {userRole === "staff" ? (
                <>
                  <Link href="/dashboard/jobs" className="hover:text-orange-500 transition">Ажлын байрууд</Link>
                  <Link href="/dashboard/profile" className="hover:text-orange-500 transition">Миний CV</Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard/post-job" className="hover:text-orange-500 transition">Ажлын байр зарлах</Link>
                  <Link href="/dashboard/applicants" className="hover:text-orange-500 transition">Ирсэн анкетууд</Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-800">
                {userRole === "staff" ? "Ажил Хайгч" : "Ажил Олгогч"}
              </p>
              <p className="text-xs text-gray-400 font-mono">ID: {userId.slice(0, 8)}...</p>
            </div>
            
            <form action={handleLogout}>
              <button 
                type="submit"
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-100 text-red-500 bg-red-50/30 hover:bg-red-50 transition"
              >
                Гарах
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* РОЛИОС ХАМААРЧ КОНТЕНТЫГ СОЛИХ ХЭСЭГ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {userRole === "staff" ? (
          <StaffView userId={userId} />
        ) : (
          <CompanyView userId={userId} />
        )}
      </main>
    </div>
  )
}

/* ==========================================================================
   1. АЖИЛ ХАЙГЧИЙН ХАРАГДАЦ (STAFF VIEW)
   ========================================================================== */
function StaffView({ userId }: { userId: string }) {
  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900">Сайн байна уу? 👋</h1>
        <p className="text-gray-500 mt-2">Өнөөдрийн байдлаар танд тохирох шинэ ажлын саналууд бэлэн байна.</p>
      </div>

      {/* Статистик */}
      <div className="grid sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm">
          <p className="text-sm font-medium text-gray-400">Илгээсэн хүсэлт</p>
          <h3 className="text-3xl font-black text-gray-800 mt-2">12</h3>
        </div>
        <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm">
          <p className="text-sm font-medium text-gray-400">Үзсэн компаниуд</p>
          <h3 className="text-3xl font-black text-gray-800 mt-2">45</h3>
        </div>
        <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm">
          <p className="text-sm font-medium text-gray-400">CV хандалт</p>
          <h3 className="text-3xl font-black text-gray-800 mt-2">89%</h3>
        </div>
      </div>

      {/* Гол контент */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Санал болгож буй ажлын байрууд</h2>
          <div className="bg-white border border-orange-100 p-6 rounded-[24px] shadow-sm">
            <h4 className="font-bold text-lg text-gray-800">Senior Frontend Developer</h4>
            <p className="text-sm text-gray-500 mt-1">Голомт Банк • Бүтэн цагийн</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm h-fit">
          <h3 className="font-bold text-gray-800 mb-2">Миний Профайл</h3>
          <p className="text-xs text-gray-400">Таны систем дэх бүртгэл баталгаажсан байна.</p>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   2. АЖИЛ ОЛГОГЧИЙН ХАРАГДАЦ (COMPANY VIEW)
   ========================================================================== */
function CompanyView({ userId }: { userId: string }) {
  return (
    <div className="animate-fade-in">
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900">Компанийн удирдлага 🏢</h1>
          <p className="text-gray-500 mt-2">Шинэ шилдэг боловсон хүчнүүдийг эндээс удирдаарай.</p>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-2xl transition shadow-md shadow-orange-500/10">
          + Ажлын байр нэмэх
        </button>
      </div>

      {/* Компанийн Статистик */}
      <div className="grid sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm">
          <p className="text-sm font-medium text-gray-400">Нээлттэй ажлын байр</p>
          <h3 className="text-3xl font-black text-gray-800 mt-2">4</h3>
        </div>
        <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm">
          <p className="text-sm font-medium text-gray-400">Ирсэн нийт анкет</p>
          <h3 className="text-3xl font-black text-emerald-600 mt-2">128</h3>
        </div>
        <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm">
          <p className="text-sm font-medium text-gray-400">Ярилцлагад урьсан</p>
          <h3 className="text-3xl font-black text-blue-600 mt-2">8</h3>
        </div>
      </div>

      {/* Гол контент */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Танай идэвхтэй зарласан ажлууд</h2>
          
          <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm flex justify-between items-center">
            <div>
              <h4 className="font-bold text-lg text-gray-800">UI/UX Designer</h4>
              <p className="text-sm text-gray-400 mt-1">Нийт 42 ажил хайгч анкет ирүүлсэн</p>
            </div>
            <button className="text-sm font-bold text-orange-500 hover:underline">
              Анкетуудыг үзэх →
            </button>
          </div>

          <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm flex justify-between items-center">
            <div>
              <h4 className="font-bold text-lg text-gray-800">Full-Stack Engineer</h4>
              <p className="text-sm text-gray-400 mt-1">Нийт 86 ажил хайгч анкет ирүүлсэн</p>
            </div>
            <button className="text-sm font-bold text-orange-500 hover:underline">
              Анкетуудыг үзэх →
            </button>
          </div>
        </div>

        {/* Туслах баруун тал */}
        <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm h-fit">
          <h3 className="font-bold text-gray-800 mb-3">Компанийн төлөв</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Хандалт:</span>
              <span className="font-bold text-green-500">Идэвхтэй</span>
            </div>
            <div className="flex justify-between">
              <span>Багц:</span>
              <span className="font-bold text-orange-500">Premium</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}