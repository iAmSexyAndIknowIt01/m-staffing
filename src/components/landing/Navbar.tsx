export default function Navbar() {
  return (
    <header
      className="
      fixed
      top-0
      left-0
      w-full
      z-50
    "
    >
      <div
        className="
        max-w-[1440px]
        mx-auto
        px-6
        pt-6
      "
      >
        <div
          className="
          glass

          rounded-full

          px-8

          h-[82px]

          flex

          items-center

          justify-between

          shadow-[0_20px_80px_rgba(255,140,0,.08)]

          border

          border-orange-100
        "
        >

          {/* LEFT */}

          <div
            className="
            flex
            items-center
            gap-4
          "
          >

            <div
              className="
              w-12
              h-12

              rounded-2xl

              bg-gradient-to-br

              from-orange-500

              to-orange-300

              flex

              items-center

              justify-center

              text-white

              font-black

              text-lg
            "
            >
              M
            </div>

            <div>

              <h1
                className="
                text-2xl
                font-black
              "
              >
                <span className="orange-text">
                  MStaffing
                </span>
              </h1>

              <p
                className="
                text-xs
                text-gray-400
              "
              >
                Монголын цагийн ажил
              </p>

            </div>

          </div>

          {/* CENTER */}

          <nav
            className="
            hidden

            md:flex

            items-center

            gap-10
          "
          >

            {[
              "Ажил Хайх",
              "Ажилтан Авах",
              "Яагаад MStaffing",
            ].map((item) => (

              <a
                key={item}

                className="
                relative

                font-medium

                cursor-pointer

                hover:text-orange-500

                transition

                after:absolute

                after:left-0

                after:-bottom-2

                after:h-[2px]

                after:w-0

                after:bg-orange-500

                hover:after:w-full

                after:transition-all
              "
              >
                {item}
              </a>

            ))}

          </nav>

          {/* RIGHT */}

          <div
            className="
            flex
            items-center
            gap-4
          "
          >

            {/* <button
              className="
              hidden

              md:block

              px-6

              py-3

              rounded-xl

              hover:bg-orange-50

              transition
            "
            >
              Нэвтрэх
            </button> */}

            <button
              className="
              orange-btn

              px-7
            "
            >
              Нэвтрэх
            </button>

          </div>

        </div>
      </div>
    </header>
  )
}