// Dashboard дотор хуудас солигдох бүрд контент зөөлөн гарч ирнэ (template нь навигац бүрд дахин mount хийгдэнэ)
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="m-page-in flex flex-1 flex-col min-w-0 w-full">{children}</div>
}
