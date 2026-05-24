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
    <section className="section py-[160px]">

      {/* TITLE */}

      <div className="text-center">

        <p
          className="
          orange-text
          font-bold
          tracking-[8px]
        "
        >
          MSTAFFING ӨНӨӨДӨР
        </p>

        <h2
          className="
          mt-6
          text-5xl
          md:text-7xl
          font-black
        "
        >
          Тоогоор

          <span className="orange-text">
            {" "}харвал
          </span>
        </h2>

      </div>

      {/* GRID */}

      <div
        className="
        mt-20

        grid

        md:grid-cols-3

        gap-8
      "
      >

        {data.map((item) => (

          <div
            key={item.title}

            className="
            glass

            rounded-[40px]

            p-12

            relative

            overflow-hidden

            transition-all

            duration-300

            hover:-translate-y-4

            hover:shadow-[0_40px_100px_rgba(255,122,0,.12)]
          "
          >

            {/* TOP LINE */}

            <div
              className="
              absolute

              top-0

              left-0

              w-full

              h-[6px]

              bg-gradient-to-r

              from-orange-400

              to-orange-200
            "
            />

            {/* ICON */}

            <div
              className="
              text-6xl
            "
            >
              {item.icon}
            </div>

            {/* NUMBER */}

            <h2
              className="
              mt-10

              text-6xl

              md:text-7xl

              font-black

              orange-text
            "
            >
              {item.value}
            </h2>

            {/* TITLE */}

            <h3
              className="
              mt-4

              text-2xl

              font-bold
            "
            >
              {item.title}
            </h3>

            {/* DESC */}

            <p
              className="
              mt-4

              text-gray-500
            "
            >
              {item.desc}
            </p>

          </div>

        ))}

      </div>

    </section>
  )
}