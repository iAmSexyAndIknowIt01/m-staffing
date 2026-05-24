const items = [
  {
    icon: "⚡",
    title: "CV шаардлагагүй",
    desc: "Хэдхэн товшилтоор бүртгүүлээд ажлаа эхлүүлээрэй.",
  },

  {
    icon: "🚀",
    title: "Ажлын бүртгэл хурдан",
    desc: "Урт процессгүйгээр ажилд хурдан холбогдоно.",
  },

  {
    icon: "🕒",
    title: "Шууд ажил эхлэх",
    desc: "Өөрт тохирох ажлаа сонгоод шууд ажиллана.",
  },

  {
    icon: "🛡️",
    title: "Найдвартай ажил олгогч",
    desc: "Баталгаажсан байгууллагуудтай ажиллах боломж.",
  },
]

export default function Features() {
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
          ЯАГААД MSTAFFING
        </p>

        <h2
          className="
          mt-6
          text-5xl
          md:text-7xl
          font-black
        "
        >
          Монголын

          <span className="orange-text">
            {" "}шинэ үеийн ажил
          </span>
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
          Ажил хайх процессыг илүү
          хурдан, ойлгомжтой,
          найдвартай болголоо.
        </p>

      </div>

      {/* GRID */}

      <div
        className="
        mt-20

        grid

        grid-cols-1

        md:grid-cols-2

        xl:grid-cols-4

        gap-8
      "
      >

        {items.map((item) => (

          <div
            key={item.title}

            className="

            glass

            relative

            overflow-hidden

            rounded-[40px]

            p-10

            transition-all

            duration-300

            hover:-translate-y-4

            hover:scale-[1.02]

            hover:shadow-[0_40px_100px_rgba(255,122,0,.15)]

            cursor-pointer
          "
          >

            {/* ORANGE TOP */}

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
              w-[90px]

              h-[90px]

              rounded-[28px]

              bg-orange-50

              flex

              items-center

              justify-center

              text-5xl
            "
            >
              {item.icon}
            </div>

            {/* TITLE */}

            <h3
              className="
              mt-8

              text-2xl

              font-black
            "
            >
              {item.title}
            </h3>

            {/* DESC */}

            <p
              className="
              mt-5

              text-gray-500

              leading-8
            "
            >
              {item.desc}
            </p>

            {/* HOVER EFFECT */}

            <div
              className="
              mt-10

              orange-text

              font-bold

              opacity-0

              translate-y-3

              transition

              duration-300

              group-hover:opacity-100
            "
            >
              →
            </div>

          </div>

        ))}

      </div>

    </section>
  )
}