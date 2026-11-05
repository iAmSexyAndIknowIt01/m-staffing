import Navbar from "./Navbar"
import Footer from "./Footer"
import Reveal from "./Reveal"

interface PublicPageShellProps {
  eyebrow: string
  title: string
  description?: string
  children: React.ReactNode
}

// Нүүр хуудасны Navbar/Footer-тэй, нэвтрэхгүйгээр харагдах мэдээллийн хуудасны хүрээ
export default function PublicPageShell({ eyebrow, title, description, children }: PublicPageShellProps) {
  return (
    <>
      <Navbar />
      <div className="bg-white">
        <header className="pt-32 md:pt-40 pb-10 md:pb-14 border-b border-gray-100 bg-linear-to-b from-orange-50/60 to-white">
          <div className="max-w-4xl mx-auto px-5 md:px-8">
            <p style={{ "--d": 80 } as React.CSSProperties} className="dash-in text-xs font-semibold tracking-[0.2em] uppercase text-orange-600">{eyebrow}</p>
            <h1 style={{ "--d": 160 } as React.CSSProperties} className="dash-in mt-3 text-3xl md:text-5xl font-bold tracking-tight text-gray-900">{title}</h1>
            {description && (
              <p style={{ "--d": 240 } as React.CSSProperties} className="dash-in mt-4 text-base md:text-lg text-gray-500 leading-relaxed max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-12 md:py-16">{children}</div>
      </div>
      <Footer />
    </>
  )
}

// Хууль эрх зүйн баримт бичгийн нэг хэсэг — скроллоор дэлгэцэнд орох үед доороос гарч ирнэ
export function LegalSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <Reveal id={id} className="scroll-mt-28 py-8 first:pt-0 border-b border-gray-100 last:border-b-0">
      <section>
        <h2 className="text-lg md:text-xl font-bold text-gray-900">{title}</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-7 text-gray-600">{children}</div>
      </section>
    </Reveal>
  )
}
