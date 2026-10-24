import { supabase } from "@/lib/supabase"
import { LegalSection } from "./PublicPageShell"

interface LegalRow {
  id: number
  title: string
  content: string
}

// mt_terms / mt_privacy хүснэгтийн заалтуудыг дарааллаар нь харуулна
export default async function LegalDocument({ table }: { table: "mt_terms" | "mt_privacy" }) {
  const { data, error } = await supabase
    .from(table)
    .select("id, title, content, order_index")
    .order("order_index", { ascending: true })

  if (error) console.error(`LEGAL_DOCUMENT_ERROR (${table}):`, error)
  const rows = (data ?? []) as LegalRow[]

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm text-gray-500">
        Баримт бичгийг ачаалж чадсангүй. Түр хүлээгээд хуудсаа дахин ачаална уу.
      </p>
    )
  }

  return (
    <div>
      <nav aria-label="Агуулга" className="mb-10 rounded-2xl border border-gray-100 bg-gray-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Агуулга</p>
        <ol className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          {rows.map((row, i) => (
            <li key={row.id}>
              <a href={`#section-${row.id}`} className="text-gray-600 hover:text-orange-600">
                {i + 1}. {row.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {rows.map((row, i) => (
        <LegalSection key={row.id} id={`section-${row.id}`} title={`${i + 1}. ${row.title}`}>
          <p className="whitespace-pre-line">{row.content}</p>
        </LegalSection>
      ))}
    </div>
  )
}
