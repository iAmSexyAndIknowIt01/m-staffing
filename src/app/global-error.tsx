"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="flex items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="max-w-md w-full space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900">Алдаа гарлаа</h1>
            <p className="text-slate-500">
              Уучлаарай, системд ноцтой асуудал үүссэн тул үргэлжлүүлэх боломжгүй байна.
            </p>
            {/* Хөгжүүлэгчид зориулсан алдааны мэдээлэл (Production үед харагдахгүй) */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{error.message}</p>
            )}
          </div>
          
          <button
            onClick={() => reset()}
            className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Дахин оролдох
          </button>
        </div>
      </body>
    </html>
  )
}