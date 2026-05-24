interface CompanyViewProps {
  userId: string
}

export default function CompanyView({ userId }: CompanyViewProps) {
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