// Хотын (Улаанбаатар маягийн) cover зургууд — нэг ижил хотын бүтэц, өөр өөр өнгө/цаг үе.
// Уулс, алс холын барилгууд, Засгийн газрын ордон маягийн багана бүхий барилга, далбаат шилэн цамхаг,
// өндөр байшингууд, мод, зам. 1200×300 талбайд зурагдана (доод хэсгээрээ тулгуурлана).

export type CityTheme = "city_day" | "city_morning" | "city_sunset" | "city_night" | "city_line" | "city_orange"

type Palette = {
  sky: [string, string]
  mountain: string
  mountainOpacity: number
  far: string
  farOpacity: number
  body: string
  body2: string
  window: string
  windowOpacity: number
  lit: number // 0–7: хэдэн хувь цонх асаалттай харагдах
  sail: [string, string]
  sailLine: string
  roof: string
  ground: string
  road: string
  tree: string
  stroke?: string // «зураасан» хувилбарт барилгын хүрээ
  clouds?: { color: string; opacity: number }
  sun?: { cx: number; cy: number; r: number; color: string }
  moon?: boolean
  stars?: boolean
}

export const CITY_THEMES: Record<CityTheme, { tone: "dark" | "orange" | "light"; palette: Palette }> = {
  // Зураг дээрх шиг: цэнхэр тэнгэр, цагаан үүл, шаргал уулс, цайвар барилга, улбар шар дээвэр
  city_day: {
    tone: "light",
    palette: {
      sky: ["#7dd3fc", "#e0f2fe"],
      mountain: "#c8a97e",
      mountainOpacity: 1,
      far: "#cbd5e1",
      farOpacity: 1,
      body: "#f8fafc",
      body2: "#e2e8f0",
      window: "#64748b",
      windowOpacity: 0.45,
      lit: 7,
      sail: ["#38bdf8", "#1d4ed8"],
      sailLine: "#e0f2fe",
      roof: "#ea580c",
      ground: "#94a3b8",
      road: "#f8fafc",
      tree: "#65a30d",
      clouds: { color: "#ffffff", opacity: 0.95 },
    },
  },
  city_morning: {
    tone: "light",
    palette: {
      sky: ["#fed7aa", "#fff7ed"],
      mountain: "#fdba74",
      mountainOpacity: 0.8,
      far: "#fdba74",
      farOpacity: 0.55,
      body: "#fb923c",
      body2: "#f97316",
      window: "#fff7ed",
      windowOpacity: 0.7,
      lit: 5,
      sail: ["#fdba74", "#ea580c"],
      sailLine: "#fff7ed",
      roof: "#c2410c",
      ground: "#ea580c",
      road: "#fed7aa",
      tree: "#c2410c",
      clouds: { color: "#ffffff", opacity: 0.7 },
      sun: { cx: 160, cy: 150, r: 46, color: "#fff7ed" },
    },
  },
  city_sunset: {
    tone: "orange",
    palette: {
      sky: ["#9a3412", "#fdba74"],
      mountain: "#c2410c",
      mountainOpacity: 0.7,
      far: "#7c2d12",
      farOpacity: 0.6,
      body: "#431407",
      body2: "#581c0c",
      window: "#fdba74",
      windowOpacity: 0.85,
      lit: 2,
      sail: ["#7c2d12", "#431407"],
      sailLine: "#fb923c",
      roof: "#7c2d12",
      ground: "#2a0e05",
      road: "#fb923c",
      tree: "#2a0e05",
      sun: { cx: 600, cy: 200, r: 80, color: "#fff7ed" },
    },
  },
  city_night: {
    tone: "dark",
    palette: {
      sky: ["#020617", "#1e293b"],
      mountain: "#1e293b",
      mountainOpacity: 1,
      far: "#0f172a",
      farOpacity: 0.9,
      body: "#0f172a",
      body2: "#172033",
      window: "#fb923c",
      windowOpacity: 0.9,
      lit: 3,
      sail: ["#1e3a8a", "#0f172a"],
      sailLine: "#fb923c",
      roof: "#1e293b",
      ground: "#020617",
      road: "#f97316",
      tree: "#020617",
      moon: true,
      stars: true,
    },
  },
  city_line: {
    tone: "light",
    palette: {
      sky: ["#fff7ed", "#ffedd5"],
      mountain: "#fed7aa",
      mountainOpacity: 0.8,
      far: "#fdba74",
      farOpacity: 0.25,
      body: "#fff7ed",
      body2: "#fff7ed",
      window: "#f97316",
      windowOpacity: 0.55,
      lit: 4,
      sail: ["#ffedd5", "#fed7aa"],
      sailLine: "#f97316",
      roof: "#fdba74",
      ground: "#fed7aa",
      road: "#f97316",
      tree: "#fdba74",
      stroke: "#ea580c",
      sun: { cx: 1000, cy: 140, r: 40, color: "#fdba74" },
    },
  },
  city_orange: {
    tone: "orange",
    palette: {
      sky: ["#ea580c", "#fb923c"],
      mountain: "#fdba74",
      mountainOpacity: 0.45,
      far: "#c2410c",
      farOpacity: 0.45,
      body: "#c2410c",
      body2: "#9a3412",
      window: "#fed7aa",
      windowOpacity: 0.75,
      lit: 3,
      sail: ["#fb923c", "#c2410c"],
      sailLine: "#fed7aa",
      roof: "#7c2d12",
      ground: "#7c2d12",
      road: "#fdba74",
      tree: "#9a3412",
      clouds: { color: "#fff7ed", opacity: 0.3 },
    },
  },
}

export function isCityTheme(value: string): value is CityTheme {
  return Object.prototype.hasOwnProperty.call(CITY_THEMES, value)
}

// ── Хотын бүтэц (бүх хувилбарт ижил) ──────────────────────

const BASE = 282

type Kind = "tower" | "block" | "palace" | "glass" | "sail"
const BUILDINGS: { x: number; w: number; h: number; k: Kind }[] = [
  { x: 30, w: 72, h: 165, k: "tower" },
  { x: 110, w: 95, h: 90, k: "block" },
  { x: 212, w: 58, h: 128, k: "tower" },
  { x: 280, w: 220, h: 66, k: "palace" },
  { x: 510, w: 62, h: 150, k: "tower" },
  { x: 580, w: 84, h: 100, k: "block" },
  { x: 672, w: 50, h: 172, k: "tower" },
  { x: 730, w: 92, h: 122, k: "glass" },
  { x: 832, w: 118, h: 192, k: "sail" },
  { x: 960, w: 72, h: 106, k: "block" },
  { x: 1040, w: 56, h: 158, k: "tower" },
  { x: 1104, w: 96, h: 92, k: "block" },
]

// Цонхнууд: [x, y, seed] — seed < lit бол харагдана
const WINDOWS: [number, number, number][] = BUILDINGS.flatMap(({ x, w, h, k }, b) => {
  if (k !== "tower" && k !== "block") return []
  const top = BASE - h + (k === "block" ? 16 : 10)
  const out: [number, number, number][] = []
  for (let r = 0; top + r * 16 + 8 < BASE - 6; r++) {
    for (let c = 0; x + 7 + c * 13 + 6 < x + w - 4; c++) {
      out.push([x + 7 + c * 13, top + r * 16, (b * 31 + r * 7 + c * 13) % 7])
    }
  }
  return out
})

const FAR_HEIGHTS = [70, 95, 80, 110, 75, 100, 120, 85, 90, 130, 78, 105, 95, 115, 80, 100, 125, 90, 85, 110, 95, 120, 80, 100, 90, 105, 115, 85, 95, 100]
const FAR_PATH = `M0 300 ${FAR_HEIGHTS.map((h, i) => `V${BASE - h} H${(i + 1) * 40}`).join(" ")} V300 Z`

const SAIL = BUILDINGS.find((b) => b.k === "sail")!
const SAIL_PATH = `M${SAIL.x} ${BASE} V${BASE - SAIL.h * 0.45} C${SAIL.x} ${BASE - SAIL.h * 0.85} ${SAIL.x + SAIL.w * 0.45} ${BASE - SAIL.h} ${SAIL.x + SAIL.w} ${BASE - SAIL.h} V${BASE} Z`

const TREES = [108, 140, 262, 300, 470, 505, 575, 700, 955, 1000, 1100, 1160]
const CLOUDS: [number, number, number][] = [[120, 70, 1], [470, 50, 1.3], [760, 85, 0.9], [1050, 60, 1.1]]
const STARS: [number, number][] = [[60, 110], [180, 80], [300, 120], [420, 95], [560, 70], [640, 125], [900, 75], [1010, 110], [1150, 85], [760, 60]]

function Cloud({ x, y, s, color, opacity }: { x: number; y: number; s: number; color: string; opacity: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color} opacity={opacity}>
      <ellipse cx="0" cy="8" rx="34" ry="16" />
      <ellipse cx="32" cy="-4" rx="30" ry="24" />
      <ellipse cx="66" cy="6" rx="32" ry="18" />
      <ellipse cx="34" cy="14" rx="56" ry="12" />
    </g>
  )
}

export function CityArt({ theme, uid }: { theme: CityTheme; uid: string }) {
  const p = CITY_THEMES[theme].palette
  const sw = p.stroke ? 2 : 0
  const st = p.stroke
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id={`cy-sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="1" stopColor={p.sky[1]} />
        </linearGradient>
        <linearGradient id={`cy-sail-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.sail[0]} />
          <stop offset="1" stopColor={p.sail[1]} />
        </linearGradient>
        <clipPath id={`cy-clip-${uid}`}>
          <path d={SAIL_PATH} />
        </clipPath>
        {p.moon && (
          <mask id={`cy-moon-${uid}`}>
            <rect width="1200" height="300" fill="white" />
            <circle cx="232" cy="88" r="24" fill="black" />
          </mask>
        )}
      </defs>

      {/* Тэнгэр */}
      <rect width="1200" height="300" fill={`url(#cy-sky-${uid})`} />
      {p.stars && STARS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#fff" opacity="0.7" />)}
      {p.moon && <circle cx="220" cy="96" r="26" fill="#fed7aa" mask={`url(#cy-moon-${uid})`} />}
      {p.sun && (
        <>
          <circle cx={p.sun.cx} cy={p.sun.cy} r={p.sun.r * 1.6} fill={p.sun.color} opacity="0.2" />
          <circle cx={p.sun.cx} cy={p.sun.cy} r={p.sun.r} fill={p.sun.color} opacity="0.9" />
        </>
      )}
      {p.clouds && CLOUDS.map(([x, y, s]) => <Cloud key={x} x={x} y={y} s={s} color={p.clouds!.color} opacity={p.clouds!.opacity} />)}

      {/* Уулс, алс холын барилгууд */}
      <path
        d="M0 205 C80 175 160 190 240 170 S400 155 480 175 S640 145 760 165 S920 140 1040 162 S1160 155 1200 165 V300 H0 Z"
        fill={p.mountain}
        opacity={p.mountainOpacity}
      />
      <path d={FAR_PATH} fill={p.far} opacity={p.farOpacity} />

      {/* Ойрын барилгууд */}
      {BUILDINGS.map(({ x, w, h, k }, i) => {
        const fill = i % 2 ? p.body2 : p.body
        if (k === "sail") return null
        if (k === "palace") {
          const pcx = x + 70
          const pw = 80
          const ptop = BASE - h - 28
          return (
            <g key={x}>
              <rect x={x} y={BASE - h} width={w} height={h} fill={fill} stroke={st} strokeWidth={sw} />
              <rect x={x - 2} y={BASE - h - 5} width={w + 4} height="6" fill={p.roof} />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
                <g key={c}>
                  <rect x={x + 8 + c * 9} y={BASE - h + 16} width="5" height="8" fill={p.window} opacity={p.windowOpacity} />
                  <rect x={x + 154 + c * 7} y={BASE - h + 16} width="4" height="8" fill={p.window} opacity={p.windowOpacity} />
                  <rect x={x + 8 + c * 9} y={BASE - h + 36} width="5" height="8" fill={p.window} opacity={p.windowOpacity} />
                  <rect x={x + 154 + c * 7} y={BASE - h + 36} width="4" height="8" fill={p.window} opacity={p.windowOpacity} />
                </g>
              ))}
              <rect x={pcx} y={ptop} width={pw} height={h + 28} fill={p.body} stroke={st} strokeWidth={sw} />
              <rect x={pcx - 4} y={ptop - 6} width={pw + 8} height="8" fill={p.roof} />
              <path d={`M${pcx + 26} ${ptop - 6} L${pcx + 30} ${ptop - 20} H${pcx + 50} L${pcx + 54} ${ptop - 6} Z`} fill={p.roof} />
              {[0, 1, 2, 3, 4, 5].map((c) => (
                <rect key={c} x={pcx + 7 + c * 12.5} y={ptop + 14} width="4.5" height={h + 14} fill={p.window} opacity={p.windowOpacity * 0.8} />
              ))}
            </g>
          )
        }
        if (k === "glass") {
          return (
            <g key={x}>
              <rect x={x} y={BASE - h} width={w} height={h} fill={p.sail[1]} stroke={st} strokeWidth={sw} />
              {Array.from({ length: Math.floor(w / 9) }, (_, c) => (
                <line key={c} x1={x + 5 + c * 9} y1={BASE - h + 4} x2={x + 5 + c * 9} y2={BASE} stroke={p.sailLine} strokeWidth="1" opacity="0.4" />
              ))}
              <rect x={x} y={BASE - h} width={w} height="5" fill={p.roof} />
            </g>
          )
        }
        return (
          <g key={x}>
            <rect x={x} y={BASE - h} width={w} height={h} fill={fill} stroke={st} strokeWidth={sw} />
            {k === "block" && <rect x={x - 2} y={BASE - h - 4} width={w + 4} height="7" fill={p.roof} />}
            {k === "tower" && h > 160 && <line x1={x + w / 2} y1={BASE - h} x2={x + w / 2} y2={BASE - h - 18} stroke={st ?? fill} strokeWidth="3" />}
          </g>
        )
      })}
      <g fill={p.window} opacity={p.windowOpacity}>
        {WINDOWS.filter(([, , s]) => s < p.lit).map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="6" height="8" rx="1" />
        ))}
      </g>

      {/* Далбаат шилэн цамхаг */}
      <path d={SAIL_PATH} fill={`url(#cy-sail-${uid})`} stroke={st} strokeWidth={sw} />
      <g clipPath={`url(#cy-clip-${uid})`} stroke={p.sailLine} strokeWidth="1.2" opacity="0.45">
        {Array.from({ length: 24 }, (_, r) => (
          <line key={r} x1={SAIL.x} y1={BASE - 4 - r * 8} x2={SAIL.x + SAIL.w} y2={BASE - 4 - r * 8} />
        ))}
      </g>

      {/* Мод, газар, зам */}
      {TREES.map((x) => (
        <g key={x} fill={p.tree}>
          <circle cx={x} cy={BASE - 9} r="9" />
          <rect x={x - 1.5} y={BASE - 3} width="3" height="4" />
        </g>
      ))}
      <rect y={BASE} width="1200" height={300 - BASE} fill={p.ground} />
      <line x1="0" y1={BASE + 9} x2="1200" y2={BASE + 9} stroke={p.road} strokeWidth="2" strokeDasharray="18 14" opacity="0.7" />
    </svg>
  )
}
