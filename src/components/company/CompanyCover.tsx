import type { ReactNode } from "react"
import { useId } from "react"
import { toCompanyCover, type CompanyCoverId } from "@/lib/companyCovers"
import { CITY_THEMES, CityArt, isCityTheme } from "./CityCover"

// Компанийн профайлын cover: монгол хээ, сэдэвтэй, улбар шар өнгөтэй, «M-Staffing» бичигтэй загварууд
// (SVG — зураг файл ачаалахгүй). className-ээр өндрийг өгнө; жижиг хувилбарыг загвар сонгох товчинд ашиглана.
// SVG нь 1200×300 талбайд зурагдаж доод хэсгээрээ тулгуурлан "slice"-аар тайрагдана (өргөн толгойд дээд хэсэг нь л тайрагдана).

type Tone = "dark" | "orange" | "light"

function Wordmark({ tone, small }: { tone: Tone; small: boolean }) {
  // dark: бараан дэвсгэр, orange: улбар шар дэвсгэр, light: цайвар дэвсгэр
  const badge = tone === "orange" ? "bg-[#fff] text-[#ea580c]" : "bg-[#f97316] text-[#fff]"
  const text = tone === "light" ? "text-[#c2410c]" : "text-[#fff]"
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 flex select-none items-center font-extrabold tracking-tight drop-shadow-sm ${text} ${
        small ? "right-1.5 top-1.5 gap-0.5 text-[0.5rem]" : "right-4 top-3 gap-1.5 text-sm sm:right-6 sm:top-4 sm:text-base"
      }`}
    >
      <span
        className={`grid place-items-center font-black ${badge} ${
          small ? "h-2.5 w-2.5 rounded-[3px] text-[0.4rem]" : "h-5 w-5 rounded-md text-[0.7rem] sm:h-6 sm:w-6 sm:text-xs"
        }`}
      >
        M
      </span>
      M-Staffing
    </span>
  )
}

function Art({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 h-full w-full"
    >
      {children}
    </svg>
  )
}

// ── Монгол хээ ──────────────────────────────────────────────

// Алхан хээ (давтагдах дэгээ хээ) — 40×40 нүд, scale-ээр өндрийг тохируулна
function AlkhanPattern({ id, color, scale = 1 }: { id: string; color: string; scale?: number }) {
  return (
    <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse" patternTransform={`scale(${scale})`}>
      <path
        d="M0 36 H40 M36 36 V4 H8 V28 H28 V12 H16 V20"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="square"
      />
    </pattern>
  )
}

// Өлзий хээ — (x, y) төвтэй, s нь хэмжээ (1 ≈ 60px)
function Ulzii({ x, y, s, color, width = 3, opacity = 1 }: { x: number; y: number; s: number; color: string; width?: number; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(45)`} fill="none" stroke={color} strokeWidth={width} opacity={opacity} strokeLinecap="round">
      <rect x="-15" y="-15" width="30" height="30" />
      <path d="M-15 -5 H15 M-15 5 H15 M-5 -15 V15 M5 -15 V15" />
      <path d="M-15 -5 C-28 -5 -5 -28 -5 -15 M5 -15 C5 -28 28 -5 15 -5 M15 5 C28 5 5 28 5 15 M-5 15 C-5 28 -28 5 -15 5" />
    </g>
  )
}

// Угалз (эвэр хээ) — 80×60 нүдэнд хос эргэлдэх угалз
function UgalzPattern({ id, color, opacity }: { id: string; color: string; opacity: number }) {
  const horn = "M40 56 C40 30 26 14 13 20 C3 25 6 40 16 38 C23 37 23 28 17 28"
  return (
    <pattern id={id} width="80" height="60" patternUnits="userSpaceOnUse">
      <g fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" opacity={opacity}>
        <path d={horn} />
        <path d={horn} transform="matrix(-1 0 0 1 80 0)" />
        <path d="M40 4 L45 10 L40 16 L35 10 Z" />
      </g>
    </pattern>
  )
}

// Гэр — (x, газрын y) дээр, s=1 үед 100px өргөн
function Ger({ x, y, s, body, door }: { x: number; y: number; s: number; body: string; door: string }) {
  return (
    <g transform={`translate(${x} ${y - 100 * s}) scale(${s})`}>
      <path d="M0 100 V60 L6 54 Q50 22 94 54 L100 60 V100 Z" fill={body} />
      <path d="M44 38 V31 H56 V38 Z" fill={body} />
      <path d="M0 66 H100" stroke={door} strokeWidth="2" opacity="0.35" />
      <path d="M42 100 V72 H58 V100 Z" fill={door} />
    </g>
  )
}

// Тэмээ — (x, газрын y) дээр, s=1 үед ~60px өргөн
function Camel({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return (
    <path
      transform={`translate(${x} ${y - 40 * s}) scale(${s})`}
      fill={color}
      d="M8 40 L9 26 C6 24 6 18 12 17 C15 9 20 9 23 16 C26 8 32 8 34 16 C38 16 41 19 42 22 L49 13 C51 10 55 10 56 13 L57 15 L53 16 L46 26 C45 28 44 29 43 30 L44 40 H41 L40 31 H37 L38 40 H35 L34 31 H16 L15 40 H12 L12 31 L11 40 Z"
    />
  )
}

const STARS: [number, number, number][] = [
  [80, 40, 1.6], [190, 90, 1.2], [300, 30, 2], [420, 70, 1.3], [520, 25, 1.6], [610, 95, 1.1], [720, 45, 1.8],
  [830, 110, 1.2], [960, 35, 1.5], [1060, 90, 1.2], [1150, 30, 1.8], [40, 130, 1.1], [360, 140, 1.2], [680, 150, 1],
]

export default function CompanyCover({
  cover,
  className = "h-32 sm:h-44",
  small = false,
}: {
  cover?: string | null
  className?: string
  // Загвар сонгох жижиг урьдчилсан харагдац
  small?: boolean
}) {
  const id: CompanyCoverId = toCompanyCover(cover)
  const u = useId().replace(/:/g, "")
  const base = `relative overflow-hidden ${className}`

  if (isCityTheme(id)) {
    return (
      <div className={base}>
        <CityArt theme={id} uid={u} />
        <Wordmark tone={CITY_THEMES[id].tone} small={small} />
      </div>
    )
  }

  switch (id) {
    // Тал нутаг — нар жаргах үеийн тал, уул, гэрүүд
    case "sunset":
      return (
        <div className={`${base} bg-orange-500`}>
          <Art>
            <defs>
              <linearGradient id={`tn-sky-${u}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#c2410c" />
                <stop offset="0.55" stopColor="#f97316" />
                <stop offset="1" stopColor="#fed7aa" />
              </linearGradient>
              <radialGradient id={`tn-sun-${u}`}>
                <stop offset="0" stopColor="#fff7ed" />
                <stop offset="0.6" stopColor="#fed7aa" />
                <stop offset="1" stopColor="#fed7aa" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1200" height="300" fill={`url(#tn-sky-${u})`} />
            <circle cx="330" cy="200" r="150" fill={`url(#tn-sun-${u})`} />
            <g fill="none" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" opacity="0.6" transform="translate(0 55)">
              <path d="M560 70 q8 -8 16 0 q8 -8 16 0" />
              <path d="M610 50 q6 -6 12 0 q6 -6 12 0" />
              <path d="M520 95 q5 -5 10 0 q5 -5 10 0" />
            </g>
            <path
              d="M0 300 V200 L110 150 L210 190 L330 130 L450 200 L560 160 L700 205 L830 150 L960 200 L1080 160 L1200 190 V300 Z"
              fill="#9a3412"
              opacity="0.5"
            />
            <path d="M0 300 V245 C200 215 400 250 600 230 S1000 215 1200 240 V300 Z" fill="#7c2d12" />
            <Ger x={690} y={238} s={0.55} body="#431407" door="#fb923c" />
            <Ger x={765} y={242} s={0.4} body="#431407" door="#fb923c" />
            <Ger x={835} y={236} s={0.48} body="#431407" door="#fb923c" />
            <path d="M0 300 V262 C250 250 500 272 760 258 S1080 252 1200 262 V300 Z" fill="#431407" />
          </Art>
          <Wordmark tone="orange" small={small} />
        </div>
      )

    // Өлзий хээ — давтагдах өлзий, доод талд алхан хээ
    case "dots":
      return (
        <div className={`${base} bg-orange-500`}>
          <Art>
            <defs>
              <linearGradient id={`uz-bg-${u}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f97316" />
                <stop offset="1" stopColor="#c2410c" />
              </linearGradient>
              <pattern id={`uz-p-${u}`} width="110" height="110" patternUnits="userSpaceOnUse">
                <Ulzii x={55} y={55} s={0.9} color="#fff7ed" width={3} opacity={0.22} />
                <circle cx="0" cy="0" r="3" fill="#fff7ed" opacity="0.25" />
                <circle cx="110" cy="0" r="3" fill="#fff7ed" opacity="0.25" />
                <circle cx="0" cy="110" r="3" fill="#fff7ed" opacity="0.25" />
                <circle cx="110" cy="110" r="3" fill="#fff7ed" opacity="0.25" />
              </pattern>
              <AlkhanPattern id={`uz-a-${u}`} color="#fed7aa" scale={0.6} />
            </defs>
            <rect width="1200" height="300" fill={`url(#uz-bg-${u})`} />
            <rect width="1200" height="300" fill={`url(#uz-p-${u})`} />
            <rect y="270" width="1200" height="30" fill="#9a3412" />
            <rect y="273" width="1200" height="24" fill={`url(#uz-a-${u})`} opacity="0.8" />
          </Art>
          <Wordmark tone="orange" small={small} />
        </div>
      )

    // Угалз — эвэр хээ
    case "waves":
      return (
        <div className={`${base} bg-orange-800`}>
          <Art>
            <defs>
              <linearGradient id={`ug-bg-${u}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#7c2d12" />
                <stop offset="1" stopColor="#c2410c" />
              </linearGradient>
              <UgalzPattern id={`ug-p-${u}`} color="#fdba74" opacity={0.35} />
              <radialGradient id={`ug-glow-${u}`} cx="0.8" cy="0.2" r="0.6">
                <stop offset="0" stopColor="#fb923c" stopOpacity="0.5" />
                <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1200" height="300" fill={`url(#ug-bg-${u})`} />
            <rect width="1200" height="300" fill={`url(#ug-p-${u})`} />
            <rect width="1200" height="300" fill={`url(#ug-glow-${u})`} />
            <rect y="0" width="1200" height="5" fill="#fdba74" opacity="0.7" />
            <rect y="295" width="1200" height="5" fill="#fdba74" opacity="0.7" />
          </Art>
          <Wordmark tone="dark" small={small} />
        </div>
      )

    // Говь — манхан, тэмээн жин
    case "skyline":
      return (
        <div className={`${base} bg-orange-300`}>
          <Art>
            <defs>
              <linearGradient id={`gv-sky-${u}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ea580c" />
                <stop offset="0.6" stopColor="#fb923c" />
                <stop offset="1" stopColor="#fed7aa" />
              </linearGradient>
            </defs>
            <rect width="1200" height="300" fill={`url(#gv-sky-${u})`} />
            <circle cx="870" cy="150" r="70" fill="#fff7ed" opacity="0.85" />
            <circle cx="870" cy="150" r="105" fill="#fff7ed" opacity="0.15" />
            <path d="M0 300 V200 C150 160 300 175 450 200 S750 150 900 185 S1100 170 1200 190 V300 Z" fill="#fdba74" />
            <path d="M0 300 V225 C200 190 380 215 560 230 S880 200 1200 235 V300 Z" fill="#f97316" />
            {[
              [250, 0.85], [310, 0.8], [370, 0.85], [430, 0.75],
            ].map(([x, s]) => (
              <Camel key={x} x={x} y={207 + (x - 250) * 0.045} s={s} color="#7c2d12" />
            ))}
            <path d="M0 300 V258 C220 240 420 270 640 255 S1000 240 1200 262 V300 Z" fill="#c2410c" />
          </Art>
          <Wordmark tone="orange" small={small} />
        </div>
      )

    // Хаалганы хээ — будсан монгол хаалганы чимэглэл
    case "stripes":
      return (
        <div className={`${base} bg-orange-600`}>
          <Art>
            <defs>
              <AlkhanPattern id={`hg-a-${u}`} color="#fdba74" scale={0.6} />
              <UgalzPattern id={`hg-u-${u}`} color="#fed7aa" opacity={0.3} />
            </defs>
            <rect width="1200" height="300" fill="#ea580c" />
            <rect width="1200" height="300" fill={`url(#hg-u-${u})`} />
            <rect y="0" width="1200" height="28" fill="#9a3412" />
            <rect y="2" width="1200" height="24" fill={`url(#hg-a-${u})`} />
            <rect y="272" width="1200" height="28" fill="#9a3412" />
            <rect y="274" width="1200" height="24" fill={`url(#hg-a-${u})`} />
            <rect x="430" y="100" width="340" height="160" rx="10" fill="#c2410c" stroke="#fdba74" strokeWidth="4" />
            <rect x="444" y="114" width="312" height="132" rx="6" fill="none" stroke="#fdba74" strokeWidth="2" opacity="0.6" />
            <Ulzii x={600} y={180} s={1.6} color="#fff7ed" width={3} />
            <Ulzii x={300} y={180} s={1} color="#fed7aa" width={3} opacity={0.6} />
            <Ulzii x={900} y={180} s={1} color="#fed7aa" width={3} opacity={0.6} />
          </Art>
          <Wordmark tone="orange" small={small} />
        </div>
      )

    // Оддын шөнө — одтой тэнгэр, уул, гэрэлтэй гэр
    case "glow":
      return (
        <div className={`${base} bg-slate-950`}>
          <Art>
            <defs>
              <linearGradient id={`sh-sky-${u}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#0f172a" />
                <stop offset="0.6" stopColor="#1e1b4b" />
                <stop offset="1" stopColor="#9a3412" />
              </linearGradient>
              <radialGradient id={`sh-door-${u}`}>
                <stop offset="0" stopColor="#fb923c" stopOpacity="0.6" />
                <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
              </radialGradient>
              <mask id={`sh-moon-${u}`}>
                <rect width="1200" height="300" fill="white" />
                <circle cx="573" cy="112" r="26" fill="black" />
              </mask>
            </defs>
            <rect width="1200" height="300" fill={`url(#sh-sky-${u})`} />
            {STARS.map(([x, y, r]) => (
              <circle key={`${x}-${y}`} cx={x} cy={95 + y * 0.35} r={r} fill="#fff" opacity="0.7" />
            ))}
            <circle cx="560" cy="122" r="27" fill="#fed7aa" mask={`url(#sh-moon-${u})`} />
            <path
              d="M0 300 V210 L140 140 L260 200 L400 120 L520 190 L640 150 L780 205 L920 135 L1060 195 L1200 160 V300 Z"
              fill="#1c1917"
            />
            <path d="M0 300 V250 C300 235 600 260 900 245 S1150 240 1200 248 V300 Z" fill="#0c0a09" />
            <circle cx="790" cy="245" r="70" fill={`url(#sh-door-${u})`} />
            <path d="M790 196 c-6 -14 10 -20 2 -36 c-6 -12 6 -18 2 -28" fill="none" stroke="#fed7aa" strokeWidth="2" opacity="0.3" />
            <Ger x={740} y={252} s={1} body="#292524" door="#fb923c" />
            <Ger x={870} y={254} s={0.6} body="#292524" door="#f97316" />
          </Art>
          <Wordmark tone="dark" small={small} />
        </div>
      )

    // M хээ — «M» тамга давтагдсан хээ
    case "pattern":
      return (
        <div className={`${base} bg-orange-50`}>
          <Art>
            <defs>
              <pattern id={`mp-${u}`} width="70" height="70" patternUnits="userSpaceOnUse" patternTransform="rotate(-14)">
                <rect x="12" y="12" width="46" height="46" rx="12" fill="#f97316" opacity="0.08" />
                <path d="M24 46 V24 L35 36 L46 24 V46" fill="none" stroke="#f97316" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
              </pattern>
              <linearGradient id={`mp-fade-${u}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff7ed" stopOpacity="0.9" />
                <stop offset="0.5" stopColor="#fff7ed" stopOpacity="0" />
                <stop offset="1" stopColor="#fb923c" stopOpacity="0.35" />
              </linearGradient>
              <AlkhanPattern id={`mp-a-${u}`} color="#f97316" scale={0.5} />
            </defs>
            <rect width="1200" height="300" fill="#fff7ed" />
            <rect width="1200" height="300" fill={`url(#mp-${u})`} />
            <rect width="1200" height="300" fill={`url(#mp-fade-${u})`} />
            <rect y="280" width="1200" height="20" fill={`url(#mp-a-${u})`} />
          </Art>
          <Wordmark tone="light" small={small} />
        </div>
      )

    // Алхан хээ — бараан дэвсгэр, том өлзий, алхан хээтэй хүрээ
    case "classic":
    default:
      return (
        <div className={`${base} bg-slate-900`}>
          <Art>
            <defs>
              <linearGradient id={`cl-bg-${u}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0f172a" />
                <stop offset="1" stopColor="#1e293b" />
              </linearGradient>
              <radialGradient id={`cl-glow-${u}`} cx="0.75" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#f97316" stopOpacity="0.35" />
                <stop offset="1" stopColor="#f97316" stopOpacity="0" />
              </radialGradient>
              <AlkhanPattern id={`cl-a-${u}`} color="#f97316" scale={0.6} />
            </defs>
            <rect width="1200" height="300" fill={`url(#cl-bg-${u})`} />
            <rect width="1200" height="300" fill={`url(#cl-glow-${u})`} />
            <Ulzii x={900} y={185} s={2} color="#f97316" width={2.5} opacity={0.35} />
            <Ulzii x={180} y={190} s={1.1} color="#f97316" width={2.5} opacity={0.12} />
            <rect y="0" width="1200" height="24" fill={`url(#cl-a-${u})`} opacity="0.25" />
            <rect y="274" width="1200" height="24" fill={`url(#cl-a-${u})`} />
          </Art>
          <Wordmark tone="dark" small={small} />
        </div>
      )
  }
}
