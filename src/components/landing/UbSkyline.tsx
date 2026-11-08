// Улаанбаатарын шугаман skyline — зүүн тийш тасралтгүй гүйнэ.
// Нэг tile-ийн баруун, зүүн зах таарч нийлдэг тул 4 хуулбарыг эгнүүлээд
// нэг tile-ийн өргөнөөр (-25%) шилжүүлэхэд үсрэлт мэдэгдэхгүй.

function SkylineTile() {
  return (
    <svg
      viewBox="0 0 1200 140"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
      strokeLinecap="round"
      className="h-full w-auto shrink-0"
      aria-hidden="true"
    >
      {/* Богд уулын нуруу */}
      <path
        d="M0 78 Q60 62 120 70 T260 58 Q330 40 400 55 T560 48 Q640 30 720 50 T880 56 Q960 42 1040 60 T1200 78"
        className="text-white/15"
        strokeWidth={1.2}
      />
      {/* Сар */}
      <path d="M1062 30 a10 10 0 1 0 12 12 a8 8 0 1 1 -12 -12z" className="text-orange-400" />
      {/* Газар */}
      <path d="M0 130 H1200" />
      {/* Орон сууц */}
      <path d="M10 130 V96 H34 V130 M34 130 V84 H56 V130" />
      <path d="M16 104 h12 M16 114 h12 M40 92 h10 M40 102 h10 M40 112 h10" />
      {/* Blue Sky цамхаг */}
      <path d="M78 130 V30 Q112 50 126 130 Z" className="text-orange-400" />
      <path d="M86 130 V52 Q108 66 116 130" className="text-orange-400" strokeWidth={1} />
      {/* Намхан барилгууд */}
      <path d="M140 130 V100 H164 V90 H186 V106 H210 V94 H236 V130" />
      <path d="M146 110 h10 M170 98 h10 M170 108 h10 M216 102 h12 M216 112 h12" />
      {/* Багануудтай барилга */}
      <path d="M258 130 V60 H284 V130 M264 70 v52 M271 70 v52 M278 70 v52" />
      {/* Телевизийн цамхаг */}
      <path d="M300 130 V40 M296 70 h8 M293 86 h14 M300 40 V24" />
      {/* Төрийн ордон */}
      <path d="M330 130 V104 H360 V96 H378 V86 L392 76 L406 86 V96 H424 V104 H454 V130" />
      <path d="M392 76 V60 M392 60 l10 4 l-10 4" />
      <path d="M342 130 v-18 M352 130 v-18 M386 130 v-26 M398 130 v-26 M434 130 v-18 M444 130 v-18" />
      <path d="M378 96 H406" />
      {/* Зайсангийн толгой, цагираг */}
      <path d="M470 130 Q512 92 554 130" />
      <circle cx={512} cy={96} r={11} className="text-orange-400" />
      <path d="M512 107 v6" />
      {/* Гандан хийд */}
      <path d="M580 130 V112 H640 V130 M572 112 Q610 104 648 112 M584 104 V94 H636 V104 M576 94 Q610 84 644 94 M592 86 V78 H628 V86 M586 78 Q610 68 634 78 M610 68 V60" />
      <path d="M600 130 v-10 h20 v10" />
      {/* Гэрүүд */}
      <path d="M676 130 V114 Q700 96 724 114 V130 M694 130 v-10 h12 v10 M700 99 v-4" />
      <path d="M738 130 V118 Q756 104 774 118 V130 M751 130 v-8 h10 v8" />
      {/* Орон сууцны блокууд */}
      <path d="M800 130 V76 H850 V130 M806 86 h38 M806 96 h38 M806 106 h38 M806 116 h38" />
      <path d="M862 130 V92 H906 V130 M868 100 h32 M868 110 h32 M868 120 h32" />
      {/* Шилэн цамхаг */}
      <path d="M926 130 V46 L946 34 L966 46 V130 M946 34 V18 M934 60 h24 M934 74 h24 M934 88 h24 M934 102 h24 M934 116 h24" />
      <path d="M986 130 V88 H1020 V100 H1046 V130" />
      <path d="M992 98 h20 M992 110 h20 M1026 110 h12 M1026 120 h12" />
      {/* Намхан барилга, гэр */}
      <path d="M1070 130 V108 H1100 V98 H1130 V130 M1144 130 V112 Q1162 98 1180 112 V130 M1156 130 v-8 h12 v8" />
    </svg>
  )
}

export default function UbSkyline({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Улаанбаатар хотын дүрс"
      className={`skyline-mask relative h-24 md:h-32 overflow-hidden text-white/35 ${className}`}
    >
      <div className="animate-skyline flex h-full w-max transform-gpu">
        {[0, 1, 2, 3].map((i) => (
          <SkylineTile key={i} />
        ))}
      </div>
    </div>
  )
}
