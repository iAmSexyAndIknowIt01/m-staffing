import { DEFAULT_CONTRACT_TERMS } from "@/lib/contracts"
import type { ContractTemplateInput } from "@/types/contract"

// Загвар хоосон үед санал болгох эхлэл. Сонгоход форм бөглөгдөж нээгдэнэ — хэрэглэгч
// өөрийн нөхцлөөр засаад хадгална (автоматаар хадгалагдахгүй).

export interface StarterTemplate {
  emoji: string
  title: string
  description: string
  template: ContractTemplateInput
}

const base: Omit<ContractTemplateInput, "name" | "terms"> = {
  is_default: false,
  position: null,
  salary: null,
  salary_type: "monthly",
  duration_months: null,
  work_hours: null,
  location: null,
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    emoji: "🏢",
    title: "Бүтэн цагийн ажилтан",
    description: "Да–Ба 09:00–18:00, хугацаагүй",
    template: {
      ...base,
      name: "Бүтэн цагийн ажилтан",
      work_hours: "Даваа-Баасан 09:00-18:00",
      terms: DEFAULT_CONTRACT_TERMS,
    },
  },
  {
    emoji: "⏱️",
    title: "Цагийн ажилтан",
    description: "Цагийн цалин, 6 сар",
    template: {
      ...base,
      name: "Цагийн ажилтан",
      salary_type: "hourly",
      duration_months: 6,
      terms: `1. Ажил олгогч нь ажилтны ажилласан цагийг бүртгэж, гэрээнд заасан цагийн хөлсөөр тооцон сар бүр олгоно.
2. Ажлын хуваарийг талууд урьдчилан тохиролцоно.
3. Ажилтан нь хөдөлмөрийн дотоод журам, хөдөлмөрийн аюулгүй байдлын шаардлагыг мөрдөнө.
4. Талууд Монгол Улсын Хөдөлмөрийн тухай хуулийн дагуу эрх, үүргээ хэрэгжүүлнэ.`,
    },
  },
  {
    emoji: "🌱",
    title: "Туршилтын хугацаатай",
    description: "3 сар, Да–Ба 09:00–18:00",
    template: {
      ...base,
      name: "Туршилтын хугацаа — 3 сар",
      duration_months: 3,
      work_hours: "Даваа-Баасан 09:00-18:00",
      terms: `${DEFAULT_CONTRACT_TERMS}
5. Энэхүү гэрээ нь туршилтын хугацааны гэрээ бөгөөд хугацаа дуусахад талууд хамтран ажиллах эсэхээ харилцан тохиролцож, шинэ гэрээ байгуулна.`,
    },
  },
]
