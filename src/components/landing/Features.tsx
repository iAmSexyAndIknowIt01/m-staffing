const items = [
  {
    icon: "CV",
    title: "Хурдан бүртгэл",
    desc: "Хэдхэн алхмаар бүртгүүлж ажлын боломжтой холбогдоно.",
  },
  {
    icon: "AI",
    title: "Шууд холболт",
    desc: "Ажил хайгч болон ажил олгогчийг нэг дор холбодог.",
  },
  {
    icon: "24",
    title: "Уян хатан ажил",
    desc: "Өөрт тохирох цаг, нөхцөлөөр ажил сонгоно.",
  },
  {
    icon: "✓",
    title: "Баталгаатай орчин",
    desc: "Шалгагдсан байгууллагуудтай найдвартай хамтран ажиллана.",
  },
]

export default function Features() {
  return (
    <section
      id="features"
      className="
        relative
        overflow-hidden
        py-24
        md:py-45
      "
    >
      {/* BACKGROUND */}
      <div
        className="
          absolute
          inset-0
          bg-linear-to-b
          from-white
          via-[#fffaf6]
          to-white
        "
      />

      {/* GLOW EFFECTS - Гацалтаас сэргийлж зөвхөн таблет, компьютер дээр уншина */}
      <div
        className="
          hidden
          md:block
          absolute
          top-[10%]
          left-[5%]
          w-150
          h-150
          rounded-full
          bg-orange-300/10
          blur-[140px]
          animate-pulse
        "
      />

      <div
        className="
          hidden
          md:block
          absolute
          bottom-[10%]
          right-[5%]
          w-175
          h-175
          rounded-full
          bg-black/5
          blur-[180px]
        "
      />

      {/* GRID */}
      <div
        className="
          absolute
          inset-0
          opacity-[0.06]
          md:opacity-[0.09]
          bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]
          bg-size-[50px_50px]
          md:bg-size-[70px_70px]
        "
      />

      <div className="relative z-10 max-w-350 mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center">
          <div
            className="
              inline-flex
              items-center
              rounded-full
              border
              border-white
              bg-white/70
              px-6
              py-3
              text-xs
              md:text-sm
              font-semibold
              shadow-md
            "
          >
            WHY MSTAFFING
          </div>

          <h2
            className="
              mt-6
              md:mt-8
              text-4xl
              md:text-7xl
              font-black
              leading-tight
            "
          >
            Ажлын хайлтыг
            <br />
            <span className="orange-text">
              шинэ түвшинд
            </span>
          </h2>

          <p
            className="
              mt-6
              md:mt-8
              text-gray-500
              text-base
              md:text-xl
              max-w-200
              mx-auto
              leading-7
              md:leading-9
            "
          >
            Илүү хурдан. Илүү ухаалаг.
            Илүү мэргэжлийн ажлын экосистем.
          </p>
        </div>

        {/* CARDS */}
        <div
          className="
            mt-16
            md:mt-28
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-4
            gap-6
            md:gap-8
          "
        >
          {items.map((item) => (
            <div
              key={item.title}
              className="
                group
                relative
                overflow-hidden
                rounded-4xl
                md:rounded-[36px]
                bg-white
                md:bg-white/65
                md:backdrop-blur-xl
                border
                border-gray-100
                md:border-white
                p-8
                md:p-10
                flex
                flex-col
                min-h-95
                md:min-h-107.5
                transition-all
                duration-500
                will-change-transform
                transform-gpu
                hover:-translate-y-2
                md:hover:-translate-y-3
                hover:shadow-[0_30px_80px_rgba(0,0,0,.06)]
              "
            >
              {/* TOP LIGHT */}
              <div
                className="
                  absolute
                  inset-x-0
                  top-0
                  h-px
                  bg-linear-to-r
                  from-transparent
                  via-orange-400
                  to-transparent
                  opacity-0
                  group-hover:opacity-100
                  transition
                "
              />

              {/* FLOAT GLOW - Зөвхөн компьютер дээр харагдана */}
              <div
                className="
                  hidden
                  md:block
                  absolute
                  -top-24
                  -right-24
                  w-45
                  h-45
                  rounded-full
                  bg-orange-100/40
                  blur-[80px]
                  opacity-0
                  group-hover:opacity-100
                  transition
                "
              />

              {/* ICON */}
              <div
                className="
                  relative
                  w-17
                  h-17
                  md:w-19.5
                  md:h-19.5
                  rounded-[22px]
                  md:rounded-[26px]
                  bg-linear-to-br
                  from-white
                  to-gray-50
                  border
                  border-gray-100
                  shadow-[0_10px_30px_rgba(0,0,0,.04)]
                  flex
                  items-center
                  justify-center
                  text-lg
                  md:text-[22px]
                  font-black
                "
              >
                <div
                  className="
                    absolute
                    inset-0
                    rounded-[22px]
                    md:rounded-[26px]
                    bg-linear-to-br
                    from-orange-100
                    to-transparent
                  "
                />
                <span className="relative">
                  {item.icon}
                </span>
              </div>

              {/* CONTENT */}
              <div className="flex-1">
                <h3
                  className="
                    mt-8
                    md:mt-10
                    text-xl
                    md:text-[28px]
                    font-black
                    leading-tight
                  "
                >
                  {item.title}
                </h3>

                <p
                  className="
                    mt-4
                    text-gray-500
                    text-xs
                    md:text-sm
                    leading-6
                    md:leading-8
                  "
                >
                  {item.desc}
                </p>
              </div>

              {/* FOOTER */}
              <div
                className="
                  mt-auto
                  pt-8
                  flex
                  justify-center
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                    text-xs
                    md:text-sm
                    font-semibold
                    text-gray-800
                  "
                >
                  Explore
                  <div
                    className="
                      w-7
                      h-7
                      md:w-8
                      md:h-8
                      rounded-full
                      bg-orange-500
                      text-white
                      flex
                      items-center
                      justify-center
                      transition
                      group-hover:translate-x-1
                    "
                  >
                    →
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  )
}