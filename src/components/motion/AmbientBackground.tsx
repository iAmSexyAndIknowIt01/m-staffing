// Login хуудасны арын дэвсгэр (улбар шар тор + аажмаар анивчих гэрэл)-ийг
// бусад хуудсанд ашиглах хувилбар. Контент уншихад саад болохгүйн тулд арай бүдэг.
// Дэлгэцэнд fixed байрлах тул скролл хийхэд хөдлөхгүй, ард нь (-z-10) харагдана.
export default function AmbientBackground({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}>
      {/* GRID — дээд талд тод, доошоо уусна */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,140,0,.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,140,0,.14)_1px,transparent_1px)] bg-size-[70px_70px] mask-[radial-gradient(ellipse_at_top,black_15%,transparent_70%)]" />

      {/* ORANGE GLOW — аажмаар анивчина */}
      <div className="absolute top-[5%] left-[15%] w-130 h-130 rounded-full bg-orange-300/30 blur-[140px] motion-safe:animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute -bottom-37.5 -right-25 w-125 h-125 rounded-full bg-orange-200/40 blur-[180px] motion-safe:animate-[pulse_8s_ease-in-out_infinite] [animation-delay:-3s]" />
    </div>
  )
}
