import Link from "next/link"

interface StaffViewProps {
  userId: string
}

interface Job {
  id: string
  title: string
  company: string
  type: string
  location: string
  salary: string
  category: string
}

interface Application {
  id: string
  title: string
  company: string
  date: string
  status: string
  statusColor: string
}

interface DashboardData {
  stats: {
    appliedCount: number
    appliedThisWeek: string
    viewedCompaniesCount: number
    cvViewRate: string
  }
  profileProgress: number
  recommendedJobs: Job[]
  recentApplications: Application[]
}

async function getDashboardData(userId: string): Promise<DashboardData> {
  const baseUrl = process.env.NODE_ENV === "production" 
    ? "https://m-staffing.mn" 
    : "http://localhost:3000"

  // Таны үндсэн API зам руу хүсэлт илгээнэ
  const res = await fetch(`${baseUrl}/api/staff/dashboard?userId=${userId}`, {
    cache: "no-store", 
  })

  if (!res.ok) {
    throw new Error("Dashboard-ын өгөгдлийг татаж чадсангүй.")
  }

  return res.json()
}

export default async function StaffView({ userId }: StaffViewProps) {
  const data = await getDashboardData(userId)
  const { stats, profileProgress, recommendedJobs, recentApplications } = data

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* МЭНДЧИЛГЭЭНИЙ ХЭСЭГ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 rounded-4xl text-white shadow-xl shadow-indigo-950/10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Сайн байна уу? 👋</h1>
          <p className="text-indigo-200/90 text-sm md:text-base mt-2 font-medium">
            Өнөөдрийн байдлаар танд тохирох шинэ ажлын саналууд бэлэн байна.
          </p>
        </div>
        <Link 
          href="/dashboard/staff/jobs" 
          className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/10 backdrop-blur-sm transition-all"
        >
          Ажил хайх 🔍
        </Link>
      </div>

      {/* СТАТИСТИК КАРТУУД */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm flex items-center justify-between group hover:border-indigo-100 hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Илгээсэн хүсэлт</p>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{stats.appliedCount}</h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
              {stats.appliedThisWeek}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
            ✉️
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm flex items-center justify-between group hover:border-indigo-100 hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Үзсэн компаниуд</p>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{stats.viewedCompaniesCount}</h3>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">Идэвхтэй хандалт</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            🏢
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm flex items-center justify-between group hover:border-indigo-100 hover:shadow-md transition-all">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">CV хандалт</p>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{stats.cvViewRate}</h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">Маш сайн 🚀</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            📊
          </div>
        </div>
      </div>

      {/* ГОЛ КОНТЕНТ СЕКЦ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ЗҮҮН ТАЛ */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* САНАЛ БОЛГОХ АЖЛУУД */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-black text-gray-900">Санал болгож буй ажлын байрууд</h2>
              <Link href="/dashboard/staff/jobs" className="text-xs font-bold text-indigo-600 hover:underline">
                Бүгдийг үзэх ({recommendedJobs.length}) →
              </Link>
            </div>

            <div className="space-y-3">
              {/* ⚠️ .slice(0, 2) ашиглаж зөвхөн эхний 2 ажлыг дэлгэц дээр харуулна */}
              {recommendedJobs.slice(0, 2).map((job) => (
                <Link
                  key={job.id}
                  href={`/staff/jobs?id=${job.id}`}
                  className="block bg-white border border-gray-100 hover:border-indigo-100 p-6 rounded-4xl shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-600 rounded-lg uppercase">
                          {job.category}
                        </span>
                        <span className="px-2.5 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-lg">
                          {job.type}
                        </span>
                      </div>
                      <h4 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {job.title}
                      </h4>
                      <p className="text-sm font-semibold text-gray-500">{job.company}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-400 font-medium pt-1">
                        <span className="flex items-center gap-1">📍 {job.location}</span>
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">💰 {job.salary}</span>
                      </div>
                    </div>
                    <div className="flex justify-end sm:block">
                      <span className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-sm font-bold transition-all shadow-sm">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              {recommendedJobs.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Одоогоор санал болгох ажил алга.</p>
              )}
            </div>
          </div>

          {/* МИНИЙ ХҮСЭЛТҮҮДИЙН ТӨЛӨВ */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-black text-gray-900">Илгээсэн анкетын төлөв</h2>
              <Link href="/dashboard/staff/applications" className="text-xs font-bold text-indigo-600 hover:underline">
                Түүх үзэх ({recentApplications.length}) →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ⚠️ .slice(0, 2) ашиглаж зөвхөн сүүлийн 2 анкетыг дэлгэц дээр харуулна */}
              {recentApplications.slice(0, 2).map((app) => (
                <div 
                  key={app.id}
                  className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between gap-4 hover:border-gray-200 transition-all"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900 text-base line-clamp-1">{app.title}</h4>
                    <p className="text-sm text-gray-500 font-medium">{app.company}</p>
                    <p className="text-[11px] text-gray-400 font-medium pt-0.5">📅 {app.date}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <span className="text-xs text-gray-400">Статус:</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-xl border ${app.statusColor}`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentApplications.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4 col-span-full">Та хараахан анкет илгээгээгүй байна.</p>
              )}
            </div>
          </div>

        </div>

        {/* БАРУУН ТАЛ */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm space-y-6">
            <div>
              <h3 className="font-black text-lg text-gray-900">Миний Профайл</h3>
              <p className="text-xs text-gray-400 mt-1">Таны систем дэх бүртгэл баталгаажсан байна.</p>
            </div>

            <div className="space-y-2 bg-gray-50 p-4 rounded-2xl">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-500">Профайл бөглөлт</span>
                <span className="text-indigo-600">{profileProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${profileProgress}%` }} 
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link 
                href="/staff/profile" 
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm text-center rounded-2xl transition shadow-md shadow-indigo-600/10"
              >
                Профайл засах ✏️
              </Link>
              <Link 
                href="/staff/cv" 
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm text-center rounded-2xl transition border border-gray-100"
              >
                Миний CV татах 📄
              </Link>
            </div>
          </div>

          <div className="bg-linear-to-br from-orange-50 via-amber-50/40 to-white border border-orange-100/70 p-6 rounded-4xl shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💡</span>
              <h4 className="font-black text-base text-gray-900">Амжилтын зөвлөгөө</h4>
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-sm text-gray-800 leading-snug">
                CV-гээ хэрхэн ажил олгогчдын анхаарлыг татахуйц бэлдэх вэ?
              </h5>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                Технологийн компаниуд анкет шалгахдаа хамгийн түрүүнд хийсэн төслүүд болон ашигласан технологиудын жагсаалтыг хардаг. Түүнчлэн үр дүнгээ тоогоор илэрхийлэх нь давуу тал болно.
              </p>
            </div>
            <Link 
              href="/staff/blog/tips" 
              className="inline-flex items-center text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors pt-1"
            >
              Үргэлжлүүлж унших →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}