import { supabase } from "@/lib/supabase"

export interface LegalRow {
  id: number
  title: string
  content: string
}

export type LegalTable = "mt_terms" | "mt_privacy"

// mt_terms / mt_privacy хүснэгтийн заалтууд (дарааллаар)
export async function getLegalRows(table: LegalTable): Promise<LegalRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select("id, title, content, order_index")
    .order("order_index", { ascending: true })

  if (error) console.error(`LEGAL_DOCUMENT_ERROR (${table}):`, error)
  return (data ?? []) as LegalRow[]
}

export const sectionId = (row: LegalRow) => `section-${row.id}`

type Block = { type: "p"; text: string } | { type: "ul"; items: string[] }

// Заалтын текстийг мөрөөр нь хувааж, «-», «•», «*»-ээр эхэлсэн мөрүүдийг жагсаалт болгоно
function toBlocks(content: string): Block[] {
  const blocks: Block[] = []
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const bullet = line.match(/^[-•*]\s+(.*)$/)
    if (bullet) {
      const last = blocks[blocks.length - 1]
      if (last?.type === "ul") last.items.push(bullet[1])
      else blocks.push({ type: "ul", items: [bullet[1]] })
    } else {
      blocks.push({ type: "p", text: line })
    }
  }
  return blocks
}

// Албан ёсны баримт бичгийн заалтууд: дугаар, гарчиг, догол мөр бүрээр
export function LegalArticles({ rows }: { rows: LegalRow[] }) {
  return (
    <div className="divide-y divide-slate-100">
      {rows.map((row, i) => (
        <section key={row.id} id={sectionId(row)} aria-labelledby={`${sectionId(row)}-title`} className="scroll-mt-28 py-8 first:pt-0 last:pb-0 break-inside-avoid-page">
          <h2 id={`${sectionId(row)}-title`} className="flex items-baseline gap-3 text-base md:text-lg font-bold uppercase tracking-wide text-slate-900">
            <span className="tabular-nums text-orange-600">{i + 1}.</span>
            <span>{row.title}</span>
          </h2>
          <div className="mt-4 space-y-3 text-[15px] leading-7 text-slate-700 md:text-justify md:hyphens-auto md:pl-7">
            {toBlocks(row.content).map((block, bi) =>
              block.type === "p" ? (
                <p key={bi}>{block.text}</p>
              ) : (
                <ul key={bi} className="list-disc space-y-1.5 pl-5 marker:text-slate-400">
                  {block.items.map((item, ii) => (
                    <li key={ii}>{item}</li>
                  ))}
                </ul>
              )
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

export function LegalLoadError() {
  return (
    <p className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
      Баримт бичгийг ачаалж чадсангүй. Түр хүлээгээд хуудсаа дахин ачаална уу.
    </p>
  )
}

// Хянах самбарын дотор харуулах хувилбар: агуулга дээр нь, заалтууд доор нь
export default async function LegalDocument({ table }: { table: LegalTable }) {
  const rows = await getLegalRows(table)
  if (rows.length === 0) return <LegalLoadError />

  return (
    <div>
      <nav aria-label="Агуулга" className="mb-8 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Агуулга</p>
        <ol className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          {rows.map((row, i) => (
            <li key={row.id} className="flex gap-2">
              <span className="w-5 shrink-0 tabular-nums text-slate-400">{i + 1}.</span>
              <a href={`#${sectionId(row)}`} className="text-slate-600 hover:text-orange-600">
                {row.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <LegalArticles rows={rows} />
    </div>
  )
}
