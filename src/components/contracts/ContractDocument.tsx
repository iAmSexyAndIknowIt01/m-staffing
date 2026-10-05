import type { Ref } from "react"
import { CONTRACT_STATUS_LABELS } from "@/lib/contracts"
import type { Contract } from "@/types/contract"
import { formatDate, formatDateTime, formatSalary } from "./format"

// Гэрээний баримт. html2canvas Tailwind v4-ийн oklch өнгийг уншдаггүй тул
// PDF болох хэсэгт зөвхөн inline hex өнгө ашиглана (CV хуудастай ижил).

const label = { color: "#64748b", fontSize: "12px", width: "38%", padding: "6px 0", verticalAlign: "top" as const }
const value = { color: "#0f172a", fontSize: "13px", fontWeight: 600, padding: "6px 0" }

export default function ContractDocument({ contract, ref }: { contract: Contract; ref?: Ref<HTMLDivElement> }) {
  const rows: [string, string][] = [
    ["Ажил олгогч", contract.company_name],
    ["Ажилтан", contract.staff_name],
    ["Албан тушаал", contract.position],
    ["Цалин хөлс", formatSalary(contract.salary, contract.salary_type)],
    ["Эхлэх огноо", formatDate(contract.start_date)],
    ["Дуусах огноо", contract.end_date ? formatDate(contract.end_date) : "Хугацаагүй"],
    ["Ажлын цаг", contract.work_hours || "—"],
    ["Ажлын байршил", contract.location || "—"],
  ]

  return (
    <div
      ref={ref}
      style={{
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "190mm",
        margin: "0 auto",
        padding: "28px 32px",
        backgroundColor: "#ffffff",
        color: "#334155",
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        lineHeight: 1.55,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ color: "#f97316", fontWeight: 900, letterSpacing: "3px", fontSize: "13px" }}>MSTAFFING</div>
        <h2 style={{ color: "#0f172a", fontSize: "20px", fontWeight: 800, margin: "8px 0 4px" }}>ХӨДӨЛМӨРИЙН ГЭРЭЭ</h2>
        <div style={{ color: "#64748b", fontSize: "12px" }}>
          № {contract.contract_number} · Хувилбар {contract.version} · {CONTRACT_STATUS_LABELS[contract.status]}
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={label}>{k}</td>
              <td style={value}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ color: "#0f172a", fontSize: "14px", fontWeight: 800, margin: "20px 0 8px" }}>Гэрээний нөхцөл</h3>
      <div style={{ whiteSpace: "pre-wrap", fontSize: "13px", color: "#334155" }}>
        {contract.terms || "Нөхцөл оруулаагүй байна."}
      </div>

      <div style={{ display: "flex", gap: "24px", marginTop: "32px" }}>
        <div style={{ flex: 1, borderTop: "1px solid #cbd5e1", paddingTop: "8px" }}>
          <div style={{ fontSize: "11px", color: "#64748b" }}>Ажил олгогч</div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{contract.company_name}</div>
          <div style={{ fontSize: "11px", color: contract.company_signed_at ? "#059669" : "#94a3b8" }}>
            {contract.company_signed_at ? `Баталгаажуулсан: ${formatDateTime(contract.company_signed_at)}` : "Гарын үсэг зураагүй"}
          </div>
        </div>
        <div style={{ flex: 1, borderTop: "1px solid #cbd5e1", paddingTop: "8px" }}>
          <div style={{ fontSize: "11px", color: "#64748b" }}>Ажилтан</div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
            {contract.staff_signed_name || contract.staff_name}
          </div>
          <div style={{ fontSize: "11px", color: contract.staff_signed_at ? "#059669" : "#94a3b8" }}>
            {contract.staff_signed_at ? `Гарын үсэг зурсан: ${formatDateTime(contract.staff_signed_at)}` : "Гарын үсэг зураагүй"}
          </div>
        </div>
      </div>

      {contract.termination_reason && (
        <div style={{ marginTop: "20px", padding: "10px 12px", backgroundColor: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px", fontSize: "12px", color: "#be123c" }}>
          {formatDate(contract.terminated_at)}-нд {contract.terminated_by === "staff" ? "ажилтан" : "ажил олгогч"} цуцалсан. Шалтгаан: {contract.termination_reason}
        </div>
      )}

      {contract.content_hash && (
        <div style={{ marginTop: "20px", fontSize: "9px", color: "#94a3b8", wordBreak: "break-all" }}>
          Баталгаажуулах код (SHA-256): {contract.content_hash}
        </div>
      )}
    </div>
  )
}
