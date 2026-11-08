import type { Metadata } from "next"

// page.tsx нь client component тул metadata-г энд тодорхойлно
export const metadata: Metadata = {
  title: "Бүртгүүлэх",
  alternates: { canonical: "/register" },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
