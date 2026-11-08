import type { Metadata } from "next"

// page.tsx нь client component тул metadata-г энд тодорхойлно
export const metadata: Metadata = {
  title: "Нэвтрэх",
  alternates: { canonical: "/login" },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
