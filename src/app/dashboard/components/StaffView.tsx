import Link from "next/link"

interface StaffViewProps {
  userId: string
}

export default function StaffView({ userId }: StaffViewProps) {
  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900">Сайн байна уу? 👋</h1>
        <p className="text-gray-500 mt-2">Өнөөдрийн байдлаар танд тохирох шинэ ажлын саналууд бэлэн байна.</p>
      </div>

      {/* Статистик */}
      <div className="grid sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
          <p className="text-sm font-medium text-gray-400">Илгээсэн хүсэлт</p>
          <h3 className="text-3xl font-black text-gray-800 mt-2">12</h3>
        </div>
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
          <p className="text-sm font-medium text-gray-400">Үзсэн компаниуд</p>
          <h3 className="text-3xl font-black text-gray-800 mt-2">45</h3>
        </div>
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
          <p className="text-sm font-medium text-gray-400">CV хандалт</p>
          <h3 className="text-3xl font-black text-gray-800 mt-2">89%</h3>
        </div>
      </div>

      {/* Гол контент */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Санал болгож буй ажлын байрууд</h2>
          <div className="bg-white border border-orange-100 p-6 rounded-3xl shadow-sm">
            <h4 className="font-bold text-lg text-gray-800">Senior Frontend Developer</h4>
            <p className="text-sm text-gray-500 mt-1">Голомт Банк • Бүтэн цагийн</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm h-fit">
          <h3 className="font-bold text-gray-800 mb-2">Миний Профайл</h3>
          <p className="text-xs text-gray-400">Таны систем дэх бүртгэл баталгаажсан байна.</p>
        </div>
      </div>
    </div>
  )
}