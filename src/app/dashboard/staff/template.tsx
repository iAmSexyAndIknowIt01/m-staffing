// Ажил хайгчийн хуудас бүр нээгдэхэд хэсгүүд нь дараалан доороос тодорч гарна (globals.css: .page-stagger).
// template нь хуудас солигдох бүрт дахин үүсдэг тул animation хуудас бүрт тоглоно.
export default function StaffTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-stagger w-full min-w-0 flex-1">{children}</div>
}
