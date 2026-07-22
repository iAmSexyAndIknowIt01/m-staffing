import Link from "next/link"

export default function DashboardFooter() {
  return (
    // mt-auto ажиллахын тулд гадна талын <main> таг flex flex-col классгүй бол өөрийгөө доош нь шахаж чаддаггүй.
    // Энд bottom-0 болон w-full-ийг бататгаж, нэмэлт margin-оос сэргийлсэн стилийг орууллаа.
    <footer className="w-full bg-slate-50/50 border-t border-slate-200/60 py-5 mt-auto relative bottom-0 left-0 right-0 z-40 shrink-0">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Зүүн тал: Зохиогчийн эрх болон Хурдан холбоосууд */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center sm:text-left">
          <span className="text-xs font-semibold text-slate-500 tracking-wide">
            © {new Date().getFullYear()} M-Staffing.
          </span>
          
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <span className="hidden sm:inline text-slate-200">•</span>
            <Link 
              href="/dashboard/support" 
              className="text-slate-500 hover:text-indigo-600 hover:underline underline-offset-4 transition-all duration-200"
            >
              Тусламж авах
            </Link>
            <span className="text-slate-200">•</span>
            <Link 
              href="/dashboard/terms" 
              className="text-slate-500 hover:text-indigo-600 hover:underline underline-offset-4 transition-all duration-200"
            >
              Үйлчилгээний нөхцөл
            </Link>
            <span className="text-slate-200">•</span>
            <Link 
              href="/dashboard/privacy" 
              className="text-slate-500 hover:text-indigo-600 hover:underline underline-offset-4 transition-all duration-200"
            >
              Нууцлалын бодлого
            </Link>
          </div>
        </div>

        {/* Баруун тал: Системийн хувилбарын мэдээлэл (Badge хэлбэрээр) */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Платформ төлөв
          </span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200/60 text-slate-600 text-[10px] font-bold border border-slate-300/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            v1.0.0
          </div>
        </div>

      </div>
    </footer>
  )
}