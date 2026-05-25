import Link from "next/link"

export default function Footer() {
  return (
    <footer
      className="
        relative
        overflow-hidden

        pt-[90px]
        pb-8
      "
    >

      {/* BG */}

      <div
        className="
          absolute
          inset-0

          bg-gradient-to-b
          from-[#0b0b0b]
          via-[#090909]
          to-black
        "
      />

      {/* GLOW */}

      <div
        className="
          absolute
          top-[10%]
          left-[10%]

          w-[500px]
          h-[500px]

          rounded-full

          bg-orange-500/10

          blur-[180px]
        "
      />

      <div
        className="
          absolute
          bottom-0
          right-[10%]

          w-[700px]
          h-[700px]

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

          opacity-[0.05]

          bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]

          bg-[size:70px_70px]
        "
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6">

        <div
          className="
            rounded-[40px]

            bg-white/[0.03]

            border
            border-white/10

            backdrop-blur-xl

            p-8
            md:p-12
          "
        >

          {/* TOP */}

          <div
            className="
              grid
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

                <div
                  className="
                    w-[52px]
                    h-[52px]

                    rounded-2xl

                    bg-gradient-to-br
                    from-orange-500
                    to-orange-400

                    text-white

                    flex
                    items-center
                    justify-center

                    font-black
                    text-xl
                  "
                >
                  M
                </div>

                <div>

                  <h2
                    className="
                      text-3xl
                      font-black
                      text-white
                    "
                  >
                    MStaffing
                  </h2>

                  <div className="text-orange-400 text-sm">
                    Future of Work
                  </div>

                </div>

              </div>

              <p
                className="
                  mt-6

                  text-gray-400

                  leading-8

                  max-w-[420px]
                "
              >
                Монголын ажил хайгч болон
                байгууллагуудыг илүү хурдан,
                илүү ухаалаг байдлаар холбох
                шинэ үеийн платформ.
              </p>

            </div>

            {/* PLATFORM */}

            <div>

              <h3 className="text-white font-bold">
                Платформ
              </h3>

              <div
                className="
                  mt-6

                  flex
                  flex-col

                  gap-4

                  text-gray-400
                "
              >

                <Link
                  href="/jobs"
                  className="hover:text-orange-400 transition"
                >
                  Ажил Хайх
                </Link>

                <Link
                  href="/staff"
                  className="hover:text-orange-400 transition"
                >
                  Staff Хайх
                </Link>

                <Link
                  href="/register"
                  className="hover:text-orange-400 transition"
                >
                  Бүртгүүлэх
                </Link>

              </div>

            </div>

            {/* COMPANY */}

            <div>

              <h3 className="text-white font-bold">
                Компани
              </h3>

              <div
                className="
                  mt-6

                  flex
                  flex-col

                  gap-4

                  text-gray-400
                "
              >

                <a className="hover:text-orange-400 transition">
                  Бидний тухай
                </a>

                <a className="hover:text-orange-400 transition">
                  Холбоо барих
                </a>

                <a className="hover:text-orange-400 transition">
                  Түгээмэл асуулт
                </a>

              </div>

            </div>

            {/* CTA */}

            <div>

              <div
                className="
                  rounded-[28px]

                  bg-white/[0.04]

                  border
                  border-white/10

                  p-6
                "
              >

                <div
                  className="
                    inline-flex

                    items-center
                    justify-center

                    h-[36px]

                    px-5

                    rounded-full

                    bg-orange-500/10

                    border
                    border-orange-500/20

                    text-orange-400

                    text-sm

                    font-semibold
                  "
                >
                  ⚡ START TODAY
                </div>

                <h3
                  className="
                    mt-4

                    text-2xl

                    text-white

                    font-black
                  "
                >
                  Шинэ боломжоо
                  эхлүүл
                </h3>

                <p
                  className="
                    mt-3

                    text-gray-400

                    leading-7
                  "
                >
                  Хэдхэн минутын дотор
                  ажил эсвэл ажилтантай
                  холбоорой.
                </p>

                <Link href="/register">

                  <button
                    className="
                      mt-6

                      orange-btn

                      w-full

                      h-[50px]

                      flex
                      items-center
                      justify-center
                    "
                  >
                    Үнэгүй Эхлэх
                  </button>

                </Link>

              </div>

            </div>

          </div>

          {/* BOTTOM */}

          <div
            className="
              mt-12

              pt-6

              border-t
              border-white/10

              flex

              flex-col
              md:flex-row

              justify-between

              gap-4
            "
          >

            <div className="text-gray-500">
              © 2026 MStaffing • All rights reserved
            </div>

            <div
              className="
                flex

                gap-8

                text-gray-500
              "
            >

              <a className="hover:text-orange-400">
                Үйлчилгээний нөхцөл
              </a>

              <a className="hover:text-orange-400">
                Нууцлал
              </a>

            </div>

          </div>

        </div>

      </div>

    </footer>
  )
}