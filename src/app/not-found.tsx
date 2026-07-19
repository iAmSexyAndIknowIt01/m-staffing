import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
      {/* Дүрслэл хэсэг */}
      <div className="relative mb-8">
        <div className="text-[150px] font-black text-indigo-100 select-none">404</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-24 h-24 text-indigo-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Текст хэсэг */}
      <div className="space-y-3 max-w-md">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Хуудас олдсонгүй</h1>
        <p className="text-slate-500 leading-relaxed">
          Уучлаарай, бидний хайж буй хуудас байхгүй эсвэл хаяг нь солигдсон байна. M-Staffing-ийн бусад хэсгүүдийг үзэх үү?
        </p>
      </div>

      {/* Товчлуурууд */}
      <div className="mt-10 flex gap-4">
        <Link 
          href="/dashboard" 
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          Дашбоард руу очих
        </Link>
        <Link 
          href="/" 
          className="px-8 py-3 bg-white text-slate-700 font-semibold rounded-2xl border border-slate-200 hover:border-slate-300 transition-all"
        >
          Нүүр хуудас
        </Link>
      </div>
    </div>
  )
}