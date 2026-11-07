"use client"

import { useEffect, useState } from "react"

interface TocItem {
  id: string
  title: string
}

// Баримт бичгийн гарчиг — уншиж буй заалтыг тодруулна (том дэлгэцэд хажууд бэхлэгдэнэ)
export default function LegalToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "")

  useEffect(() => {
    let frame = 0
    // Дэлгэцийн дээд хэсэг (navbar-ийн доор)-ийг давсан хамгийн сүүлийн заалт идэвхтэй
    const update = () => {
      frame = 0
      let current = items[0]?.id ?? ""
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top <= 140) current = item.id
      }
      // Хуудасны төгсгөлд хүрвэл сүүлийн заалт
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = items[items.length - 1]?.id ?? current
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [items])

  return (
    <nav aria-label="Баримт бичгийн агуулга">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Агуулга</p>
      <ol className="mt-4 space-y-0.5 border-l border-slate-200">
        {items.map((item, i) => {
          const isActive = active === item.id
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`-ml-px flex gap-2.5 border-l-2 py-1.5 pl-4 pr-2 text-sm leading-snug transition-colors ${
                  isActive
                    ? "border-orange-500 font-semibold text-slate-900"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                }`}
              >
                <span className="w-5 shrink-0 tabular-nums text-slate-400">{i + 1}.</span>
                <span>{item.title}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
