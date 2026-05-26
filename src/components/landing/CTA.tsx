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
        py-[140px]
      "
    >

      {/* BG */}

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

      <div
        className="
          absolute
          top-[10%]
          left-[10%]

          w-[600px]
          h-[600px]

          rounded-full
          bg-orange-300/10

          blur-[150px]
        "
      />

      <div
        className="
          absolute
          inset-0

          opacity-[0.09]

          bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]

          bg-[size:70px_70px]
        "
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6">

        <div
          className="
            rounded-[44px]

            bg-white/65
            backdrop-blur-xl

            border
            border-white

            px-8
            py-20

            md:px-14

            shadow-[0_40px_120px_rgba(0,0,0,.06)]
          "
        >

          {/* HEADER */}

          <div className="text-center">

            <div
              className="
                inline-flex

                rounded-full

                bg-white

                px-5
                py-2

                text-sm
                font-semibold

                shadow
              "
            >
              HOW MSTAFFING WORKS
            </div>

            <h2
              className="
                mt-5

                text-4xl
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
                mt-5

                text-lg

                text-gray-500

                max-w-[700px]

                mx-auto
              "
            >
              Бүртгэлээс эхлээд ажил эхлэх хүртэл —
              бүх процесс хэдхэн минут.
            </p>

          </div>

          {/* ROADMAP */}

          <div
            className="
              mt-14

              grid

              md:grid-cols-4

              gap-5
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

                {/* LINE */}

                {index !== 3 && (

                  <div
                    className="
                      hidden
                      md:block

                      absolute

                      top-[34px]
                      left-[60%]

                      w-full
                      h-[1px]

                      bg-gradient-to-r
                      from-orange-300
                      to-transparent
                    "
                  />

                )}

                {/* STEP */}

                <div
                  className="
                    relative

                    w-[68px]
                    h-[68px]

                    mx-auto

                    rounded-full

                    bg-white

                    border

                    shadow-lg

                    flex
                    items-center
                    justify-center

                    text-orange-500

                    font-black
                  "
                >
                  {step.no}
                </div>

                <h3
                  className="
                    mt-5

                    text-xl

                    font-black
                  "
                >
                  {step.title}
                </h3>

                <p
                  className="
                    mt-3

                    text-gray-500

                    leading-7

                    text-sm
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
              mt-14

              flex
              justify-center

              gap-4

              flex-wrap
            "
          >

            <Link href="/jobs">

              <button
                className="
                  w-[220px]
                  h-[56px]

                  orange-btn

                  flex
                  items-center
                  justify-center
                "
              >
                Ажил Хайх
              </button>

            </Link>

            <Link href="/staff">

              <button
                className="
                  w-[220px]
                  h-[56px]

                  rounded-2xl

                  bg-white

                  border

                  font-semibold

                  hover:-translate-y-1

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