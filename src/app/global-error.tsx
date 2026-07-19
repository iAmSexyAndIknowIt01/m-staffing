"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="mn">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center justify-center max-w-md w-full">
          
          {/* Дүрслэл хэсэг - NotFound-тай ижил стиль */}
          <div className="relative mb-8">
            <div className="text-[150px] font-black text-indigo-100 select-none">500</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-24 h-24 text-indigo-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Текст хэсэг */}
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Системийн алдаа гарлаа</h1>
            <p className="text-slate-500 leading-relaxed">
              Уучлаарай, системд түр зуурын саатал гарлаа. M-Staffing-ийн баг үүнийг аль хэдийн шалгаж байна.
            </p>
            {error.digest && (
              <p className="text-xs text-slate-400 font-mono">Error ID: {error.digest}</p>
            )}
          </div>

          {/* Товчлуурууд */}
          <div className="mt-10 flex flex-col w-full gap-3">
            <button
              onClick={() => reset()}
              className="w-full px-8 py-3 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
            >
              Дахин оролдох
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-8 py-3 bg-white text-slate-700 font-semibold rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              Нүүр хуудас
            </button>
          </div>

          {/* Development log - Илүү цэвэрхэн */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 text-left w-full bg-white p-4 rounded-2xl border border-red-100 shadow-sm">
              <span className="font-bold text-xs text-red-500 block mb-1">Development Details:</span>
              <pre className="text-[10px] text-slate-600 font-mono overflow-x-auto">{error.message}</pre>
            </div>
          )}
        </div>
      </body>
    </html>
  )
}