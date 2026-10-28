// MStaffing-ийн «Унага» маскот — хоосон төлөв, алдааны дэлгэцүүдэд харуулна.
// walk: утсаар ярьж цүнхтэй алхаж буй (мэдээлэл бүртгэгдээгүй), search: томруулдаг шилтэй (хайлт олдсонгүй),
// folder: хоосон хавтастай (жагсаалт хоосон), error: сүлжээгүй утастай (алдаа, ачаалж чадсангүй)

export type FoalVariant = "walk" | "search" | "folder" | "error"

const COAT = "#c97a45"
const MANE = "#6b3a1f"
const LIGHT = "#f3d6bb"
const HOOF = "#7a5a45"
const PANTS = "#374151"
const SHIRT = "#ffffff"
const LINE = "#e5e7eb"
const ACCENT = "#ea580c"
const EYE = "#2b2320"

function Arm({ points, hand }: { points: [number, number][]; hand: [number, number] }) {
  const d = "M" + points.map(([x, y]) => `${x} ${y}`).join(" L")
  const [hx, hy] = hand
  return (
    <>
      <path d={d} stroke={SHIRT} strokeWidth={15} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r={8} fill={COAT} />
      <path d={`M${hx - 7} ${hy + 3} Q${hx} ${hy + 10} ${hx + 7} ${hy + 3}`} fill={HOOF} />
    </>
  )
}

function Body({ walking }: { walking?: boolean }) {
  return (
    <>
      <circle cx={88} cy={160} r={9} fill={MANE} />
      <circle cx={80} cy={172} r={8} fill={MANE} />
      <circle cx={84} cy={183} r={6.5} fill={MANE} />
      {walking ? (
        <>
          <path d="M110 168 L98 210" stroke={PANTS} strokeWidth={17} strokeLinecap="round" />
          <path d="M132 168 L146 208" stroke={PANTS} strokeWidth={17} strokeLinecap="round" />
          <ellipse cx={94} cy={216} rx={11} ry={6.5} fill={HOOF} />
          <ellipse cx={150} cy={214} rx={11} ry={6.5} fill={HOOF} />
        </>
      ) : (
        <>
          <path d="M110 168 L108 210" stroke={PANTS} strokeWidth={17} strokeLinecap="round" />
          <path d="M134 168 L136 210" stroke={PANTS} strokeWidth={17} strokeLinecap="round" />
          <ellipse cx={105} cy={216} rx={11} ry={6.5} fill={HOOF} />
          <ellipse cx={139} cy={216} rx={11} ry={6.5} fill={HOOF} />
        </>
      )}
      <path d="M96 116 Q122 106 148 116 L150 170 Q122 178 94 170 Z" fill={SHIRT} stroke={LINE} strokeWidth={1.5} />
      <path d="M94 160 Q122 168 150 160 L150 172 Q122 180 94 172 Z" fill={PANTS} />
      <path d="M110 110 L122 120 L134 110" fill="none" stroke={LINE} strokeWidth={1.5} />
      <path d="M118 118 L126 118 L124 124 L120 124 Z" fill={ACCENT} />
      <path d="M120 124 L124 124 L127 146 L122 152 L117 146 Z" fill={ACCENT} />
    </>
  )
}

function Head({ eyes = "normal", mouth = "smile", brows }: { eyes?: "normal" | "down"; mouth?: "smile" | "talk" | "wavy" | "o"; brows?: boolean }) {
  return (
    <>
      <path d="M94 46 Q86 16 110 28 Q110 40 104 50 Z" fill={COAT} />
      <path d="M97 42 Q93 25 107 32 Q106 40 103 46 Z" fill="#f9b4b4" />
      <path d="M146 42 Q154 12 170 34 Q164 44 156 50 Z" fill={COAT} />
      <path d="M150 40 Q156 22 165 35 Q161 41 156 45 Z" fill="#f9b4b4" />
      <ellipse cx={126} cy={70} rx={40} ry={35} fill={COAT} />
      <circle cx={88} cy={62} r={8.5} fill={MANE} />
      <circle cx={86} cy={76} r={7.5} fill={MANE} />
      <circle cx={114} cy={36} r={9.5} fill={MANE} />
      <circle cx={127} cy={31} r={11} fill={MANE} />
      <circle cx={140} cy={36} r={9} fill={MANE} />
      <circle cx={121} cy={42} r={6.5} fill={MANE} />
      <ellipse cx={135} cy={89} rx={23} ry={15} fill={LIGHT} />
      <ellipse cx={128} cy={86} rx={2.4} ry={1.8} fill={HOOF} />
      <ellipse cx={142} cy={86} rx={2.4} ry={1.8} fill={HOOF} />
      {eyes === "normal" ? (
        <>
          <ellipse cx={112} cy={66} rx={7.5} ry={9} fill={EYE} />
          <circle cx={114.5} cy={62.5} r={3} fill="#ffffff" />
          <circle cx={110} cy={69.5} r={1.4} fill="#ffffff" />
          <ellipse cx={141} cy={64} rx={7.5} ry={9} fill={EYE} />
          <circle cx={143.5} cy={60.5} r={3} fill="#ffffff" />
          <circle cx={139} cy={67.5} r={1.4} fill="#ffffff" />
        </>
      ) : (
        <>
          <ellipse cx={112} cy={69} rx={7.5} ry={8} fill={EYE} />
          <circle cx={114} cy={67} r={2.7} fill="#ffffff" />
          <ellipse cx={141} cy={67} rx={7.5} ry={8} fill={EYE} />
          <circle cx={143} cy={65} r={2.7} fill="#ffffff" />
        </>
      )}
      {brows && (
        <>
          <path d="M104 52 Q111 48 118 51" stroke={MANE} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M135 49 Q142 45 149 49" stroke={MANE} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </>
      )}
      <ellipse cx={100} cy={82} rx={7} ry={4.2} fill="#fb7185" opacity={0.4} />
      <ellipse cx={160} cy={80} rx={7} ry={4.2} fill="#fb7185" opacity={0.4} />
      {mouth === "smile" && <path d="M128 96 Q134 101 140 96" stroke={HOOF} strokeWidth={2} fill="none" strokeLinecap="round" />}
      {mouth === "talk" && <ellipse cx={134} cy={97} rx={4.5} ry={3.5} fill="#9f3a3a" />}
      {mouth === "o" && <ellipse cx={134} cy={97} rx={3} ry={3.5} fill="#9f3a3a" />}
      {mouth === "wavy" && <path d="M127 97 q3 -3 6 0 t6 0" stroke={HOOF} strokeWidth={2} fill="none" strokeLinecap="round" />}
    </>
  )
}

function Question({ x, y, size, opacity }: { x: number; y: number; size: number; opacity: number }) {
  return (
    <text x={x} y={y} fontFamily="inherit" fontSize={size} fontWeight={700} fill={ACCENT} opacity={opacity}>
      ?
    </text>
  )
}

const LABELS: Record<FoalVariant, string> = {
  walk: "Утсаар ярьж, цүнхтэй алхаж буй унага",
  search: "Томруулдаг шил барьсан унага",
  folder: "Хоосон хавтас барьсан унага",
  error: "Сүлжээгүй утас барьсан унага",
}

export default function FoalIllustration({
  variant = "walk",
  size = 160,
  className = "",
}: {
  variant?: FoalVariant
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      className={className}
      role="img"
      aria-label={LABELS[variant]}
    >
      {/* Газрын сүүдэр: хагас тунгалаг тул цайвар, бараан горимд хоёуланд нь зохино */}
      <ellipse cx={122} cy={222} rx={54} ry={6} fill="#0f172a" opacity={0.08} />

      {variant === "walk" && (
        <>
          <g transform="rotate(-10 40 40)">
            <rect x={26} y={20} width={28} height={36} rx={5} fill="#ffffff" stroke="#cbd5e1" strokeWidth={1.5} />
            <path d="M32 30 H48 M32 36 H48 M32 42 H42" stroke="#cbd5e1" strokeWidth={2} strokeLinecap="round" />
          </g>
          <Body walking />
          <Arm points={[[98, 120], [86, 146], [80, 160]]} hand={[80, 162]} />
          <path d="M70 172 V166 Q70 162 74 162 H86 Q90 162 90 166 V172" stroke="#374151" strokeWidth={3.5} fill="none" />
          <rect x={60} y={170} width={40} height={30} rx={7} fill="#374151" />
          <rect x={60} y={181} width={40} height={3} fill="#4b5563" />
          <rect x={77} y={178} width={7} height={8} rx={2} fill={ACCENT} />
          <Head mouth="talk" />
          <g transform="rotate(18 168 78)">
            <rect x={160} y={62} width={15} height={28} rx={4} fill="#1f2937" />
            <rect x={162.5} y={66} width={10} height={17} rx={1.5} fill={ACCENT} opacity={0.6} />
          </g>
          <Arm points={[[146, 120], [166, 130], [170, 98]]} hand={[170, 94]} />
          <path d="M186 66 Q192 74 186 82" stroke={ACCENT} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path d="M194 60 Q203 74 194 88" stroke={ACCENT} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.6} />
        </>
      )}

      {variant === "search" && (
        <>
          <Question x={30} y={56} size={28} opacity={0.85} />
          <Question x={58} y={30} size={17} opacity={0.5} />
          <Body />
          <Arm points={[[98, 120], [88, 146], [88, 160]]} hand={[88, 162]} />
          <Head mouth="o" />
          <Arm points={[[146, 122], [170, 134], [178, 118]]} hand={[178, 114]} />
          <path d="M180 110 L190 92" stroke="#4b5563" strokeWidth={7} strokeLinecap="round" />
          <circle cx={196} cy={76} r={17} fill="#e0f2fe" fillOpacity={0.45} stroke="#4b5563" strokeWidth={4.5} />
          <path d="M187 69 Q191 64 197 64" stroke="#ffffff" strokeWidth={3} fill="none" strokeLinecap="round" />
        </>
      )}

      {variant === "folder" && (
        <>
          <Question x={182} y={40} size={30} opacity={0.85} />
          <Body />
          <Head eyes="down" mouth="o" brows />
          <path d="M86 132 H106 Q109 132 111 135 L113 138 H156 Q160 138 160 142 V166 Q160 170 156 170 H90 Q86 170 86 166 Z" fill="#fdba74" />
          <path d="M82 146 Q82 143 85 143 H162 Q165 143 164 146 L159 168 Q158 172 154 172 H90 Q86 172 85 168 Z" fill={ACCENT} />
          <Arm points={[[98, 120], [90, 140], [92, 150]]} hand={[92, 152]} />
          <Arm points={[[146, 120], [156, 140], [152, 150]]} hand={[152, 152]} />
        </>
      )}

      {variant === "error" && (
        <>
          <path d="M182 34 q6 9 0 14 q-6 -5 0 -14 z" fill="#93c5fd" />
          <Body />
          <Arm points={[[98, 120], [80, 104], [86, 62]]} hand={[86, 58]} />
          <Head mouth="wavy" brows />
          <Arm points={[[146, 122], [166, 140], [160, 128]]} hand={[160, 126]} />
          <g transform="rotate(-8 168 118)">
            <rect x={156} y={98} width={24} height={40} rx={5} fill="#1f2937" />
            <rect x={159} y={103} width={18} height={28} rx={2} fill="#f3f4f6" />
            <path d="M162 124 V121 M166 124 V118 M170 124 V115 M174 124 V112" stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" />
            <path d="M162 108 L174 120 M174 108 L162 120" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
          </g>
        </>
      )}
    </svg>
  )
}
