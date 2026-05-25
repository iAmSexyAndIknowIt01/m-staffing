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
      className="
        relative
        overflow-hidden
        py-[180px]
      "
    >

      {/* BACKGROUND */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-b
          from-white
          via-[#fffaf6]
          to-white
        "
      />

      {/* GLOW */}

      <div
        className="
          absolute
          top-[10%]
          left-[5%]

          w-[600px]
          h-[600px]

          rounded-full

          bg-orange-300/10

          blur-[140px]

          animate-pulse
        "
      />

      <div
        className="
          absolute
          bottom-[10%]
          right-[5%]

          w-[700px]
          h-[700px]

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

          opacity-[0.03]

          bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]

          bg-[size:70px_70px]
        "
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6">

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

              backdrop-blur

              px-6
              py-3

              text-sm
              font-semibold

              shadow-lg
            "
          >
            WHY MSTAFFING
          </div>

          <h2
            className="
              mt-8
              text-5xl
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
              mt-8

              text-gray-500

              text-xl

              max-w-[800px]

              mx-auto

              leading-9
            "
          >
            Илүү хурдан. Илүү ухаалаг.
            Илүү мэргэжлийн ажлын экосистем.
          </p>

        </div>

        {/* CARDS */}

        <div
          className="
            mt-28

            grid

            md:grid-cols-2
            xl:grid-cols-4

            gap-8
          "
        >

          {items.map((item) => (

            <div
              key={item.title}
              className="
                group

                relative

                overflow-hidden

                rounded-[36px]

                bg-white/65

                backdrop-blur-xl

                border
                border-white

                p-10

                flex
                flex-col

                min-h-[430px]

                transition-all
                duration-500

                hover:-translate-y-3
                hover:shadow-[0_40px_120px_rgba(0,0,0,.08)]
              "
            >

              {/* TOP LIGHT */}

              <div
                className="
                  absolute
                  inset-x-0
                  top-0

                  h-[1px]

                  bg-gradient-to-r
                  from-transparent
                  via-orange-400
                  to-transparent

                  opacity-0
                  group-hover:opacity-100

                  transition
                "
              />

              {/* FLOAT GLOW */}

              <div
                className="
                  absolute

                  -top-24
                  -right-24

                  w-[180px]
                  h-[180px]

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

                  w-[78px]
                  h-[78px]

                  rounded-[26px]

                  bg-gradient-to-br
                  from-white
                  to-gray-50

                  border

                  shadow-[0_20px_50px_rgba(0,0,0,.08)]

                  flex
                  items-center
                  justify-center

                  text-[22px]
                  font-black
                "
              >

                <div
                  className="
                    absolute
                    inset-0

                    rounded-[26px]

                    bg-gradient-to-br

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
                    mt-10
                    text-[28px]
                    font-black
                    leading-tight
                  "
                >
                  {item.title}
                </h3>

                <p
                  className="
                    mt-5
                    text-gray-500
                    leading-8
                  "
                >
                  {item.desc}
                </p>

              </div>

              {/* FOOTER */}

              <div
                className="
                  mt-auto
                  pt-10

                  flex
                  justify-center
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-3

                    text-sm
                    font-semibold

                    text-gray-800
                  "
                >

                  Explore

                  <div
                    className="
                      w-8
                      h-8

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