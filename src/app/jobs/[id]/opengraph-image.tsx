import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { getPublicJob } from "@/lib/publicJob"

// Facebook, Messenger г.м.-д зарын холбоосыг хуваалцахад харагдах 1200×630 зураг
export const alt = "MStaffing — нээлттэй ажлын байр"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const revalidate = 300

// Монгол кирилл (Ө, Ү) үсэгтэй фонт — зурагт орох текстийн үсгүүдээр л жижиглэж татна
async function loadFont(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text()
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1]
    if (!url) return null
    const res = await fetch(url)
    return res.ok ? await res.arrayBuffer() : null
  } catch {
    return null
  }
}

// Компанийн лого (png/jpeg) — өөр формат, алдаа гарвал логогүй зурна
async function loadImageDataUri(url: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url)
    const type = res.headers.get("content-type") ?? ""
    if (!res.ok || !/image\/(png|jpe?g)/.test(type)) return null
    const buf = Buffer.from(await res.arrayBuffer())
    return `data:${type};base64,${buf.toString("base64")}`
  } catch {
    return null
  }
}

export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getPublicJob(id)

  const title = job?.title ?? "Ажлын байр"
  const company = job?.companyName ?? "MStaffing"
  const chips = job ? [job.salaryText, job.jobTypeLabel].filter(Boolean) : []
  const cta = "Анкет илгээх →"

  const allText = ["НЭЭЛТТЭЙ АЖЛЫН БАЙР", "MStaffing", "mstaffing.mn", title, company, cta, ...chips].join(" ")
  const [regular, bold] = await Promise.all([loadFont(500, allText), loadFont(700, allText)])
  const fonts = [
    ...(regular ? [{ name: "Inter", data: regular, weight: 500 as const, style: "normal" as const }] : []),
    ...(bold ? [{ name: "Inter", data: bold, weight: 700 as const, style: "normal" as const }] : []),
  ]

  const [logo, companyLogo] = await Promise.all([
    readFile(join(process.cwd(), "public", "logo.png"))
      .then((b) => `data:image/png;base64,${b.toString("base64")}`)
      .catch(() => null),
    loadImageDataUri(job?.companyLogoUrl ?? null),
  ])

  const titleSize = title.length > 40 ? 52 : title.length > 24 ? 62 : 72

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background: "#ffffff",
          fontFamily: "Inter",
          color: "#1d1814",
          position: "relative",
        }}
      >
        {/* Баруун доод талын зөөлөн улбар шар туяа */}
        <div
          style={{
            position: "absolute",
            right: 120,
            bottom: 80,
            width: 360,
            height: 360,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(255,122,0,0.22) 0%, rgba(255,122,0,0) 70%)",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 22, letterSpacing: 4, color: "#8a7f75", fontWeight: 500 }}>НЭЭЛТТЭЙ АЖЛЫН БАЙР</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {logo && <img src={logo} width={52} height={52} alt="" />}
            <div style={{ fontSize: 40, fontWeight: 700, color: "#ff7a00" }}>MStaffing</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: titleSize, fontWeight: 700, lineHeight: 1.15, maxWidth: 1000, display: "flex" }}>
            {title.length > 80 ? `${title.slice(0, 79)}…` : title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {companyLogo && (
              <img
                src={companyLogo}
                width={48}
                height={48}
                alt=""
                style={{ borderRadius: 10, objectFit: "contain", border: "1px solid #eee" }}
              />
            )}
            <div style={{ fontSize: 30, color: "#5c5249", fontWeight: 500 }}>{company}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {chips.map((chip) => (
              <div
                key={chip}
                style={{ fontSize: 26, padding: "14px 24px", background: "#f4f1ee", borderRadius: 12, fontWeight: 500 }}
              >
                {chip}
              </div>
            ))}
            <div
              style={{
                fontSize: 26,
                padding: "14px 26px",
                background: "#ff7a00",
                color: "#ffffff",
                borderRadius: 12,
                fontWeight: 700,
              }}
            >
              {cta}
            </div>
          </div>
          <div style={{ fontSize: 26, color: "#5c5249", fontWeight: 500 }}>mstaffing.mn</div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  )
}
