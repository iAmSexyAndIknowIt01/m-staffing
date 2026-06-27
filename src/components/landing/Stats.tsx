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
        py-24
        md:py-45
        bg-[#070707]
      "
    >
      {/* BACKGROUND */}
      <div
        className="
          absolute
          inset-0
          bg-linear-to-b
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
          opacity-[0.03]
          md:opacity-[0.05]
          bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]
          bg-size-[50px_50px]
          md:bg-size-[70px_70px]
        "
      />

      {/* GLOW EFFECTS - Гацалтаас сэргийлж утасны хөтөч дээр бүрэн нууна */}
      <div
        className="
          hidden
          md:block
          absolute
          top-0
          left-[10%]
          w-175
          h-175
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
          w-125
          h-125
          rounded-full
          bg-blue-500/10
          blur-[160px]
        "
      />

      <div
        className="
          relative
          z-10
          max-w-350
          mx-auto
          px-6
        "
      />
      <div className="relative z-10 max-w-350 mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center">
          <div
            className="
              inline-flex
              rounded-full
              border
              border-white/10
              bg-white/5
              px-6
              py-3
              text-xs
              md:text-sm
              font-semibold
              text-orange-300
            "
          >
            MSTAFFING TODAY
          </div>

          <h2
            className="
              mt-6
              md:mt-8
              text-4xl
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
              mt-6
              md:mt-8
              text-sm
              md:text-xl
              text-white/60
              max-w-190
              mx-auto
              leading-6
              md:leading-9
            "
          >
            Монголын ажлын зах зээлийг
            илүү хурдан, илүү ил тод
            болгож буй платформ.
          </p>
        </div>

        {/* STATS CARDS */}
        <div
          className="
            mt-16
            md:mt-28
            grid
            grid-cols-1
            md:grid-cols-3
            gap-6
            md:gap-8
          "
        >
          {data.map((item) => (
            <div
              key={item.title}
              className="
                group
                relative
                overflow-hidden
                rounded-4xl
                md:rounded-[36px]
                border
                border-white/10
                bg-white/2
                md:bg-white/3
                md:backdrop-blur-xl
                p-8
                md:p-10
                transition-all
                duration-500
                will-change-transform
                transform-gpu
                hover:-translate-y-2
                md:hover:-translate-y-3
                hover:border-orange-500/40
                hover:bg-white/5
                hover:shadow-[0_30px_60px_rgba(255,120,0,.06)]
                min-h-80
                md:min-h-90
                flex
                flex-col
              "
            >
              {/* HOVER HOVER LIGHT GLOW - Зөвхөн компьютер дээр */}
              <div
                className="
                  hidden
                  md:block
                  absolute
                  -top-24
                  -right-15
                  w-55
                  h-55
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
                  w-16
                  h-16
                  md:w-19.5
                  md:h-19.5
                  rounded-[20px]
                  md:rounded-3xl
                  border
                  border-white/10
                  bg-white/5
                  flex
                  items-center
                  justify-center
                  text-2xl
                  md:text-3xl
                "
              >
                {item.icon}
              </div>

              {/* VALUE */}
              <h2
                className="
                  mt-8
                  md:mt-10
                  text-5xl
                  md:text-[72px]
                  font-black
                  leading-none
                  text-white
                  tracking-tight
                "
              >
                {item.value}
              </h2>

              {/* TITLE */}
              <h3
                className="
                  mt-4
                  md:mt-5
                  text-xl
                  md:text-2xl
                  font-bold
                  text-white
                "
              >
                {item.title}
              </h3>

              {/* DESC */}
              <p
                className="
                  mt-3
                  text-white/50
                  text-xs
                  md:text-sm
                  leading-5
                  md:leading-8
                  flex-1
                "
              >
                {item.desc}
              </p>

              {/* FOOTER */}
              <div
                className="
                  mt-8
                  md:mt-10
                  flex
                  items-center
                  justify-between
                "
              >
                <span
                  className="
                    text-xs
                    text-white/40
                  "
                >
                  Live Data
                </span>

                <div
                  className="
                    w-8
                    h-8
                    md:w-10
                    md:h-10
                    rounded-full
                    bg-orange-500
                    text-white
                    flex
                    items-center
                    justify-center
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