export default function CTA() {
  return (
    <section className="section py-[180px]">

      <div
        className="
        relative

        overflow-hidden

        rounded-[48px]

        glass

        px-8
        py-24

        md:px-20

        text-center
      "
      >

        {/* BACKGROUND GLOW */}

        <div
          className="
          absolute

          -top-40
          -right-40

          w-[500px]

          h-[500px]

          rounded-full

          bg-orange-200/40

          blur-[120px]
        "
        />

        <div
          className="
          absolute

          -bottom-40
          -left-40

          w-[400px]

          h-[400px]

          rounded-full

          bg-orange-100

          blur-[120px]
        "
        />

        {/* CONTENT */}

        <div className="relative z-10">

          <p
            className="
            orange-text

            font-bold

            tracking-[8px]
          "
          >
            ӨНӨӨДРӨӨС ЭХЭЛ
          </p>

          <h2
            className="
            mt-8

            text-5xl

            md:text-7xl

            font-black

            leading-tight
          "
          >
            Хэдхэн минутын дараа

            <br />

            <span className="orange-text">
              дараагийн боломж
            </span>

            таны өмнө.
          </h2>

          <p
            className="
            mt-8

            text-gray-500

            text-xl

            max-w-3xl

            mx-auto
          "
          >
            Ажил хайгч эсвэл ажил олгогч
            байхаас үл хамааран
            өнөөдрөөс эхлүүлээрэй.
          </p>

          {/* BUTTONS */}

          <div
            className="
            mt-14

            flex

            justify-center

            gap-5

            flex-wrap
          "
          >

            <button
              className="
              orange-btn

              px-10

              hover:scale-105
            "
            >
              Ажил Хайх
            </button>

            <button
              className="
              glass

              px-10

              py-4

              rounded-2xl

              hover:-translate-y-1

              transition
            "
            >
              Ажилтан Авах
            </button>

          </div>

          {/* BADGE */}

          <div
            className="
            mt-14

            inline-flex

            items-center

            gap-3

            rounded-full

            bg-orange-50

            px-8

            py-4
          "
          >

            <div
              className="
              text-3xl
            "
            >
              ⚡
            </div>

            <div
              className="
              text-left
            "
            >
              <div className="font-bold">
                10,000+ хэрэглэгч
              </div>

              <div className="text-gray-500">
                өдөр бүр шинэ боломж
              </div>
            </div>

          </div>

        </div>

      </div>

    </section>
  )
}