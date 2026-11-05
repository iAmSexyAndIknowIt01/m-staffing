// Ажил хайгчийн хуудас бүр нээгдэхэд хэсгүүд нь дараалан доороос тодорч гарна (globals.css: .staff-page).
// template нь хуудас солигдох бүрт дахин үүсдэг тул animation хуудас бүрт тоглоно.
export default function StaffTemplate({ children }: { children: React.ReactNode }) {
  return <div className="staff-page w-full min-w-0 flex-1">{children}</div>
}
