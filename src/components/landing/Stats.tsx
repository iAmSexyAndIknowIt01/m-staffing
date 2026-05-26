const data = [
  {
    value: "100+",
    title: "Ажил Олгогч",
    icon: "🏢",
    desc: "Баталгаажсан байгууллагууд",
  },

  {
    value: "10,000+",
    title: "Ажил Хайгч",
    icon: "👨‍💼",
    desc: "Өдөр бүр идэвхтэй хэрэглэгч",
  },

  {
    value: "24/7",
    title: "Нээлттэй",
    icon: "⚡",
    desc: "Хэзээ ч ажил хайх боломж",
  },
]

export default function Stats() {
  return (
    <section
      className="
        relative
        overflow-hidden

        py-[180px]

        bg-[#070707]
      "
    >

      {/* BACKGROUND */}

      <div
        className="
          absolute
          inset-0

          bg-gradient-to-b

          from-[#090909]
          via-[#101010]
          to-black
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

      {/* GLOW */}

      <div
        className="
          absolute

          top-0
          left-[10%]

          w-[700px]
          h-[700px]

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

          w-[500px]
          h-[500px]

          rounded-full

          bg-blue-500/10

          blur-[160px]
        "
      />

      <div
        className="
          relative
          z-10

          max-w-[1400px]
          mx-auto

          px-6
        "
      >

        {/* HEADER */}

        <div className="text-center">

          <div
            className="
              inline-flex

              rounded-full

              border
              border-white/10

              bg-white/5

              backdrop-blur

              px-6
              py-3

              text-sm
              font-semibold

              text-orange-300
            "
          >
            MSTAFFING TODAY
          </div>

          <h2
            className="
              mt-8

              text-5xl
              md:text-7xl

              font-black

              leading-tight

              text-white
            "
          >
            Тоогоор

            <span className="text-orange-400">
              {" "}харвал
            </span>
          </h2>

          <p
            className="
              mt-8

              text-xl

              text-white/60

              max-w-[760px]

              mx-auto

              leading-9
            "
          >
            Монголын ажлын зах зээлийг
            илүү хурдан, илүү ил тод
            болгож буй платформ.
          </p>

        </div>

        {/* STATS */}

        <div
          className="
            mt-28

            grid

            md:grid-cols-3

            gap-8
          "
        >

          {data.map((item) => (

            <div
              key={item.title}
              className="
                group

                relative

                overflow-hidden

                rounded-[36px]

                border
                border-white/10

                bg-white/[0.03]

                backdrop-blur-xl

                p-10

                transition-all
                duration-500

                hover:-translate-y-3

                hover:border-orange-500/40

                hover:bg-white/[0.05]

                hover:shadow-[0_40px_120px_rgba(255,120,0,.10)]

                min-h-[360px]

                flex
                flex-col
              "
            >

              {/* LIGHT */}

              <div
                className="
                  absolute

                  -top-24
                  right-[-60px]

                  w-[220px]
                  h-[220px]

                  rounded-full

                  bg-orange-400/10

                  blur-[90px]

                  opacity-0

                  group-hover:opacity-100

                  transition
                "
              />

              {/* ICON */}

              <div
                className="
                  w-[78px]
                  h-[78px]

                  rounded-[24px]

                  border
                  border-white/10

                  bg-white/5

                  flex
                  items-center
                  justify-center

                  text-3xl
                "
              >
                {item.icon}
              </div>

              {/* VALUE */}

              <h2
                className="
                  mt-10

                  text-[58px]

                  md:text-[72px]

                  font-black

                  leading-none

                  text-white
                "
              >
                {item.value}
              </h2>

              {/* TITLE */}

              <h3
                className="
                  mt-5

                  text-2xl

                  font-bold

                  text-white
                "
              >
                {item.title}
              </h3>

              {/* DESC */}

              <p
                className="
                  mt-4

                  text-white/60

                  leading-8

                  flex-1
                "
              >
                {item.desc}
              </p>

              {/* FOOTER */}

              <div
                className="
                  mt-10

                  flex

                  items-center

                  justify-between
                "
              >

                <span
                  className="
                    text-sm

                    text-white/50
                  "
                >
                  Live Data
                </span>

                <div
                  className="
                    w-10
                    h-10

                    rounded-full

                    bg-orange-500

                    flex

                    items-center
                    justify-center

                    text-white

                    group-hover:translate-x-1

                    transition
                  "
                >
                  →
                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </section>
  )
}