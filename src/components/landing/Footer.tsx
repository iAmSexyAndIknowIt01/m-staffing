import { Zap } from "lucide-react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer
      className="
        relative
        overflow-hidden
        pt-16
        pb-8
        md:pt-22.5
      "
    >
      {/* BG */}
      <div
        className="
          absolute
          inset-0
          bg-linear-to-b
          from-[#0b0b0b]
          via-[#090909]
          to-black
        "
      />

      {/* GLOW - Утасны хөтөч дээр ачаалал өгөхгүйн тулд нуув */}
      <div
        className="
          hidden
          md:block
          absolute
          top-[10%]
          left-[10%]
          w-125
          h-125
          rounded-full
          bg-orange-500/10
          blur-[180px]
        "
      />

      <div
        className="
          hidden
          md:block
          absolute
          bottom-0
          right-[10%]
          w-175
          h-175
          rounded-full
          bg-orange-300/5
          blur-[220px]
        "
      />

      {/* GRID */}
      <div
        className="
          absolute
          inset-0
          opacity-[0.03]
          md:opacity-[0.05]
          bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]
          bg-size-[50px_50px]
          md:bg-size-[70px_70px]
        "
      />

      <div className="relative z-10 max-w-350 mx-auto px-4 md:px-6 transform-gpu">
        <div
          className="
            rounded-4xl
            md:rounded-4xl
            bg-[#121212]/90
            md:bg-white/3
            border
            border-white/5
            md:border-white/10
            md:backdrop-blur-xl
            p-6
            md:p-12
          "
        >
          {/* TOP */}
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-[1.5fr_1fr_1fr_1.2fr]
              gap-10
            "
          >
            {/* BRAND */}
            <div>
              <div
                className="
                  flex
                  items-center
                  gap-4
                "
              >
                <img src="/logo.png" alt="" width={52} height={52} className="w-12 h-12 md:w-13 md:h-13 shrink-0" />

                <div>
                  <h2
                    className="
                      text-2xl
                      md:text-3xl
                      font-black
                      text-white
                    "
                  >
                    MStaffing
                  </h2>
                  <div className="text-orange-400 text-xs md:text-sm">
                    Цаг бүр үнэ цэнэтэй
                  </div>
                </div>
              </div>

              <p
                className="
                  mt-5
                  text-sm
                  text-gray-400
                  leading-7
                  md:leading-8
                  max-w-105
                "
              >
                Монголын ажил хайгч болон байгууллагуудыг илүү хурдан, илүү
                ухаалаг байдлаар холбох шинэ үеийн платформ.
              </p>
            </div>

            {/* PLATFORM */}
            <div>
              <h3 className="text-white text-sm md:text-base font-bold">
                Платформ
              </h3>
              <div
                className="
                  mt-4
                  md:mt-6
                  flex
                  flex-col
                  gap-3
                  md:gap-4
                  text-sm
                  text-gray-400
                "
              >
                <Link href="/dashboard/staff/jobs" className="hover:text-orange-400 transition">
                  Ажил хайх
                </Link>
                <Link href="/dashboard/company/search-staff" className="hover:text-orange-400 transition">
                  Ажилтан хайх
                </Link>
                <Link href="/register" className="hover:text-orange-400 transition">
                  Бүртгүүлэх
                </Link>
              </div>
            </div>

            {/* COMPANY */}
            <div>
              <h3 className="text-white text-sm md:text-base font-bold">
                Компани
              </h3>
              <div
                className="
                  mt-4
                  md:mt-6
                  flex
                  flex-col
                  gap-3
                  md:gap-4
                  text-sm
                  text-gray-400
                "
              >
                <Link href="/about" className="hover:text-orange-400 transition">
                  Бидний тухай
                </Link>
                <Link href="/about#contact" className="hover:text-orange-400 transition">
                  Холбоо барих
                </Link>
                <Link href="/faq" className="hover:text-orange-400 transition">
                  Түгээмэл асуулт
                </Link>
              </div>
            </div>

            {/* CTA */}
            <div>
              <div
                className="
                  rounded-3xl
                  md:rounded-3xl
                  bg-white/2
                  md:bg-white/4
                  border
                  border-white/5
                  md:border-white/10
                  p-5
                  md:p-6
                "
              >
                <div
                  className="
                    inline-flex
                    items-center
                    justify-center
                    h-8
                    px-4
                    rounded-full
                    bg-orange-500/10
                    border
                    border-orange-500/20
                    text-orange-400
                    text-xs
                    font-semibold
                  "
                >
                  <Zap size="1em" className="inline-block shrink-0 align-[-0.125em] mr-1.5" aria-hidden="true" /> Өнөөдөр эхэл
                </div>

                <h3
                  className="
                    mt-4
                    text-xl
                    md:text-2xl
                    text-white
                    font-black
                  "
                >
                  Шинэ боломжоо эхлүүл
                </h3>

                <p
                  className="
                    mt-2
                    text-xs
                    md:text-sm
                    text-gray-400
                    leading-6
                  "
                >
                  Хэдхэн минутын дотор ажил эсвэл ажилтантай холбоорой.
                </p>

                <Link href="/register">
                  <button
                    className="
                      mt-5
                      orange-btn
                      w-full
                      h-11.5
                      md:h-12.5
                      text-sm
                      flex
                      items-center
                      justify-center
                    "
                  >
                    Үнэгүй эхлэх
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* BOTTOM */}
          <div
            className="
              mt-10
              md:mt-12
              pt-6
              border-t
              border-white/5
              md:border-white/10
              flex
              flex-col
              md:flex-row
              justify-between
              gap-4
              text-xs
              md:text-sm
            "
          >
            <div className="text-gray-500 text-center md:text-left">
              © {new Date().getFullYear()} MStaffing. Бүх эрх хуулиар хамгаалагдсан.
            </div>

            <div
              className="
                flex
                justify-center
                gap-6
                md:gap-8
                text-gray-500
              "
            >
              <Link href="/terms" className="hover:text-orange-400 transition">
                Үйлчилгээний нөхцөл
              </Link>
              <Link href="/privacy" className="hover:text-orange-400 transition">
                Нууцлалын бодлого
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}