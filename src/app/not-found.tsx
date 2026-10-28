import Link from 'next/link'
import FoalIllustration from "@/components/common/FoalIllustration"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
      {/* Дүрслэл хэсэг */}
      <div className="mb-6 flex flex-col items-center">
        <FoalIllustration variant="search" size={220} />
        <span className="mt-1 text-sm font-bold tracking-[0.3em] text-orange-500">404</span>
      </div>

      {/* Текст хэсэг */}
      <div className="space-y-3 max-w-md">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Хуудас олдсонгүй</h1>
        <p className="text-slate-500 leading-relaxed">
          Уучлаарай, таны хайж буй хуудас байхгүй эсвэл хаяг нь солигдсон байна. MStaffing-ийн бусад хэсгүүдийг үзэх үү?
        </p>
      </div>

      {/* Товчлуурууд */}
      <div className="mt-10 flex gap-4">
        <Link 
          href="/dashboard" 
          className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200"
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