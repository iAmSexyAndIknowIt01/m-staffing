import { Eye } from "lucide-react"
import { todayISO } from "@/lib/contracts"
import { contractEndDate } from "@/lib/contractTemplates"
import { workHoursLines } from "@/lib/workSchedule"
import type { ContractTemplateInput } from "@/types/contract"
import { formatDate, formatSalary } from "./format"

// Загвар засах үеийн шууд урьдчилан харах: гэрээ үүсгэхэд аль талбар загвараас,
// аль нь ажлын зараас бөглөгдөхийг ялгаж харуулна.

type Source = "template" | "job" | "manual"

const SOURCE_BADGE: Record<Source, { label: string; className: string }> = {
  template: { label: "Загвараас", className: "bg-indigo-50 text-indigo-600" },
  job: { label: "Ажлын зараас", className: "bg-amber-50 text-amber-700" },
  manual: { label: "Гэрээ бүрт", className: "bg-gray-100 text-gray-500" },
}

function Row({ label, value, source }: { label: string; value: string; source: Source }) {
  const badge = SOURCE_BADGE[source]
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-[11px] text-gray-400">{label}</div>
        <div className={`text-sm whitespace-pre-line break-words ${source === "template" ? "font-semibold text-gray-900" : "text-gray-400"}`}>{value}</div>
      </div>
      <span className={`shrink-0 text-[10px] font-bold rounded-md px-1.5 py-0.5 ${badge.className}`}>{badge.label}</span>
    </div>
  )
}

export default function TemplatePreview({ template }: { template: ContractTemplateInput }) {
  const today = todayISO()
  const endExample = template.duration_months ? contractEndDate(today, template.duration_months) : null
  const hours = workHoursLines(template.work_hours)

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
      <div>
        <h3 className="text-sm font-black text-gray-900"><Eye size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> Гэрээнд ингэж бөглөгдөнө</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">Тэнцсэн анкетаас гэрээ үүсгэхэд. Ноорог дээрээ дараа нь засаж болно.</p>
      </div>

      <div className="divide-y divide-gray-50">
        <Row label="Албан тушаал" value={template.position || "Ажлын зарын нэр"} source={template.position ? "template" : "job"} />
        <Row
          label="Цалин хөлс"
          value={template.salary !== null ? formatSalary(template.salary, template.salary_type) : "Ажлын зар дээрх цалин"}
          source={template.salary !== null ? "template" : "job"}
        />
        <Row
          label="Хугацаа"
          value={
            template.duration_months && endExample
              ? `${template.duration_months} сар\nЖишээ: өнөөдөр эхэлбэл ${formatDate(endExample)} дуусна`
              : "Дуусах огноог гараар оруулна (эсвэл хугацаагүй)"
          }
          source={template.duration_months ? "template" : "manual"}
        />
        <Row label="Ажлын цаг" value={hours.length ? hours.join("\n") : "Гараар оруулна"} source={hours.length ? "template" : "manual"} />
        <Row label="Ажлын байршил" value={template.location || "Ажлын зар дээрх байршил"} source={template.location ? "template" : "job"} />
      </div>

      <div className="pt-1">
        <div className="text-[11px] text-gray-400 mb-1">Гэрээний нөхцөл</div>
        <div className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-xl p-3 max-h-64 overflow-y-auto">
          {template.terms.trim() || "Нөхцөл бичээгүй байна."}
        </div>
      </div>
    </div>
  )
}
