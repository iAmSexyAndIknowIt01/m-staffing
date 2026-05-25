import Link from "next/link"

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
          pt-5
        "
      >

        <div
          className="
            glass

            h-[64px]

            rounded-full

            px-6

            flex
            items-center
            justify-between

            border
            border-white/20

            backdrop-blur-xl

            shadow-[0_20px_60px_rgba(255,120,0,.08)]
          "
        >

          {/* LEFT */}

          <Link
            href="/"
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-10
                h-10

                rounded-xl

                bg-gradient-to-br
                from-orange-500
                to-orange-300

                flex
                items-center
                justify-center

                text-white
                font-black
              "
            >
              M
            </div>

            <div>

              <h1
                className="
                  text-xl
                  font-black
                  leading-none
                "
              >
                <span className="orange-text">
                  MStaffing
                </span>
              </h1>

              <p
                className="
                  text-[11px]
                  text-gray-400
                "
              >
                Future of Work
              </p>

            </div>

          </Link>

          {/* CENTER */}

          <nav
            className="
              hidden
              lg:flex

              items-center

              gap-8
            "
          >

            {[
              {
                label: "Ажил Хайх",
                href: "/jobs",
              },

              {
                label: "Staff Хайх",
                href: "/staff",
              },

              {
                label: "Яагаад MStaffing",
                href: "#features",
              },
            ].map((item) => (

              <Link
                key={item.label}
                href={item.href}
                className="
                  relative

                  text-[15px]

                  text-gray-700

                  hover:text-orange-500

                  transition

                  after:absolute
                  after:left-0
                  after:-bottom-1

                  after:h-[2px]

                  after:w-0

                  after:bg-orange-500

                  hover:after:w-full

                  after:transition-all
                "
              >
                {item.label}
              </Link>

            ))}

          </nav>

          {/* RIGHT */}

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <Link href="/login">

              <button
                className="
                  orange-btn

                  h-[44px]
                  px-7

                  text-sm

                  flex
                  items-center
                  justify-center

                  hover:scale-[1.03]

                  transition
                "
              >
                Нэвтрэх
              </button>

            </Link>

          </div>

        </div>

      </div>

    </header>
  )
}