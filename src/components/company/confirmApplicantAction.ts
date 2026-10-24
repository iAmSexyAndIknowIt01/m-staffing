import { BadgeCheck, CalendarCheck, FileSignature, UserMinus, UserX, type LucideIcon } from "lucide-react"
import { showConfirm } from "@/components/common/AppDialog"

// Анкет дээрх үйлдэл бүрийг хийхээс өмнө ажил горилогчийн нэртэй баталгаажуулалт асууна

interface ApplicantSummary {
  user_name: string
  job_title?: string
  phone?: string
}

interface ActionCopy {
  title: string
  message: string
  confirmLabel: string
  icon: LucideIcon
  danger?: boolean
}

const STATUS_ACTIONS: Record<string, ActionCopy> = {
  interview: {
    title: "Ярилцлагад урих",
    message: "Ажил горилогчийн төлөв «Ярилцлага» болж өөрчлөгдөнө. Үргэлжлүүлэх үү?",
    confirmLabel: "Урих",
    icon: CalendarCheck,
  },
  rejected: {
    title: "Анкетаас татгалзах",
    message: "Ажил горилогчийн төлөв «Татгалзсан» болж өөрчлөгдөнө. Үргэлжлүүлэх үү?",
    confirmLabel: "Татгалзах",
    icon: UserX,
    danger: true,
  },
  approved: {
    title: "Тэнцсэн гэж тэмдэглэх",
    message: "Ярилцлагад тэнцсэн гэж тэмдэглэнэ. Төлөв «Тэнцсэн» болж өөрчлөгдөнө. Үргэлжлүүлэх үү?",
    confirmLabel: "Тэнцсэн",
    icon: BadgeCheck,
  },
  "not-approved": {
    title: "Тэнцээгүй гэж тэмдэглэх",
    message: "Ярилцлагад тэнцээгүй гэж тэмдэглэнэ. Төлөв «Тэнцээгүй» болж өөрчлөгдөнө. Үргэлжлүүлэх үү?",
    confirmLabel: "Тэнцээгүй",
    icon: UserMinus,
    danger: true,
  },
}

const CREATE_CONTRACT: ActionCopy = {
  title: "Гэрээ үүсгэх",
  message: "Энэ ажил горилогчтой байгуулах хөдөлмөрийн гэрээний ноорог үүсгэж нээнэ. Үргэлжлүүлэх үү?",
  confirmLabel: "Гэрээ үүсгэх",
  icon: FileSignature,
}

function ask(copy: ActionCopy, applicant?: ApplicantSummary) {
  return showConfirm(copy.message, {
    title: copy.title,
    confirmLabel: copy.confirmLabel,
    icon: copy.icon,
    danger: copy.danger,
    subject: applicant
      ? {
          name: applicant.user_name,
          details: [applicant.job_title, applicant.phone].filter(
            (v): v is string => !!v && v !== "Хоосон"
          ),
        }
      : undefined,
  })
}

export function confirmStatusChange(status: string, applicant?: ApplicantSummary): Promise<boolean> {
  const copy = STATUS_ACTIONS[status]
  return copy ? ask(copy, applicant) : Promise.resolve(true)
}

export function confirmCreateContract(applicant?: ApplicantSummary): Promise<boolean> {
  return ask(CREATE_CONTRACT, applicant)
}
