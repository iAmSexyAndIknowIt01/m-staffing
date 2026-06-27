import Link from "next/link"

const steps = [
  {
    no: "01",
    title: "Бүртгүүлэх",
    desc: "Ажил хайгч эсвэл байгууллагаар хэдхэн секундэд эхэлнэ.",
  },
  {
    no: "02",
    title: "Хайлт хийх",
    desc: "Өөрт тохирох ажил эсвэл ажилтан хайна.",
  },
  {
    no: "03",
    title: "Холбогдох",
    desc: "Шууд чатлаж тохиролцоонд хүрнэ.",
  },
  {
    no: "04",
    title: "Ажил эхлэх",
    desc: "Хурдан бөгөөд найдвартай эхлүүлнэ.",
  },
]

export default function CTA() {
  return (
    <section
      className="
        relative
        overflow-hidden
        py-16
        md:py-35
      "
    >
      {/* BG */}
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

      {/* GLOW - Зөвхөн компьютер дээр уншина */}
      <div
        className="
          hidden
          md:block
          absolute
          top-[10%]
          left-[10%]
          w-150
          h-150
          rounded-full
          bg-orange-300/10
          blur-[150px]
        "
      />

      {/* GRID */}
      <div
        className="
          absolute
          inset-0
          opacity-[0.05]
          md:opacity-[0.09]
          bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]
          bg-size-[50px_50px]
          md:bg-size-[70px_70px]
        "
      />

      <div className="relative z-10 max-w-350 mx-auto px-4 md:px-6">
        <div
          className="
            rounded-4xl
            md:rounded-[44px]
            bg-white
            md:bg-white/65
            md:backdrop-blur-xl
            border
            border-gray-100
            md:border-white
            px-6
            py-12
            md:px-14
            md:py-20
            shadow-[0_20px_50px_rgba(0,0,0,.04)]
            md:shadow-[0_40px_120px_rgba(0,0,0,.06)]
          "
        >
          {/* HEADER */}
          <div className="text-center">
            <div
              className="
                inline-flex
                rounded-full
                bg-gray-50
                md:bg-white
                px-5
                py-2
                text-xs
                md:text-sm
                font-semibold
                shadow-xs
                border
                border-gray-100
              "
            >
              HOW MSTAFFING WORKS
            </div>

            <h2
              className="
                mt-5
                text-3xl
                md:text-6xl
                font-black
                leading-tight
              "
            >
              Хэдхэн алхмаар
              <span className="orange-text">
                {" "}ажил эхэлнэ
              </span>
            </h2>

            <p
              className="
                mt-4
                text-sm
                md:text-lg
                text-gray-500
                max-w-175
                mx-auto
                leading-6
                md:leading-7
              "
            >
              Бүртгэлээс эхлээд ажил эхлэх хүртэл — бүх процесс хэдхэн минут.
            </p>
          </div>

          {/* ROADMAP */}
          <div
            className="
              mt-12
              md:mt-14
              grid
              grid-cols-1
              md:grid-cols-4
              gap-8
              md:gap-5
            "
          >
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="
                  relative
                  text-center
                  px-4
                "
              >
                {/* LINE - Зөвхөн компьютер дээр харагдана */}
                {index !== 3 && (
                  <div
                    className="
                      hidden
                      md:block
                      absolute
                      top-8.5
                      left-[60%]
                      w-full
                      h-px
                      bg-linear-to-r
                      from-orange-300
                      to-transparent
                    "
                  />
                )}

                {/* STEP */}
                <div
                  className="
                    relative
                    w-15
                    h-15
                    md:w-17
                    md:h-17
                    mx-auto
                    rounded-full
                    bg-white
                    border
                    border-gray-100
                    shadow-md
                    flex
                    items-center
                    justify-center
                    text-orange-500
                    font-black
                    text-sm
                    md:text-base
                  "
                >
                  {step.no}
                </div>

                <h3
                  className="
                    mt-4
                    md:mt-5
                    text-lg
                    md:text-xl
                    font-black
                  "
                >
                  {step.title}
                </h3>

                <p
                  className="
                    mt-2
                    text-gray-500
                    leading-6
                    md:leading-7
                    text-xs
                    md:text-sm
                  "
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* BUTTONS */}
          <div
            className="
              mt-10
              md:mt-14
              flex
              justify-center
              gap-3
              md:gap-4
              flex-wrap
            "
          >
            <Link href="/jobs" className="w-full sm:w-auto">
              <button
                className="
                  w-full
                  sm:w-55
                  h-13
                  md:h-14
                  orange-btn
                  flex
                  items-center
                  justify-center
                  text-sm
                "
              >
                Ажил Хайх
              </button>
            </Link>

            <Link href="/staff" className="w-full sm:w-auto">
              <button
                className="
                  w-full
                  sm:w-55
                  h-13
                  md:h-14
                  rounded-2xl
                  bg-white
                  border
                  border-gray-200
                  font-semibold
                  text-sm
                  active:translate-y-0
                  md:hover:-translate-y-1
                  transition
                "
              >
                Staff Хайх
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}