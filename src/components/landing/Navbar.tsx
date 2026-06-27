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
        transform-gpu
      "
    >
      <div
        className="
          max-w-350
          mx-auto
          px-4
          md:px-6
          pt-4
          md:pt-5
        "
      >
        <div
          className="
            h-16
            rounded-full
            px-5
            md:px-6
            flex
            items-center
            justify-between
            border
            border-gray-100
            md:border-white/20
            bg-white/95
            md:bg-white/65
            md:backdrop-blur-xl
            shadow-sm
            md:shadow-[0_20px_60px_rgba(255,120,0,.08)]
            will-change-transform
          "
        >
          {/* LEFT */}
          <Link
            href="/"
            className="
              flex
              items-center
              gap-2
              md:gap-3
            "
          >
            <div
              className="
                w-9
                h-9
                md:w-10
                md:h-10
                rounded-xl
                bg-linear-to-br
                from-orange-500
                to-orange-300
                flex
                items-center
                justify-center
                text-white
                font-black
                text-sm
                md:text-xl
              "
            >
              M
            </div>

            <div>
              <h1
                className="
                  text-lg
                  md:text-xl
                  font-black
                  leading-none
                "
              >
                <span className="text-orange-500">M</span>
                <span className="text-orange-500">Staffing</span>
              </h1>
              <p
                className="
                  text-[10px]
                  md:text-[11px]
                  text-gray-400
                  mt-0.5
                "
              >
                Future of Work
              </p>
            </div>
          </Link>

          {/* CENTER - Компьютер дээр харагдана */}
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
                href: "/dashboard/staff/jobs",
              },
              {
                label: "Staff Хайх",
                href: "/dashboard/company/applicants",
              },
              {
                label: "Яагаад MStaffing",
                href: "#features",
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                scroll={true}
                className="
                  relative
                  text-[15px]
                  text-gray-700
                  hover:text-orange-500
                  transition
                  after:absolute
                  after:left-0
                  after:-bottom-1
                  after:h-0.5
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
                  h-10
                  md:h-11
                  px-5
                  md:px-7
                  text-xs
                  md:text-sm
                  flex
                  items-center
                  justify-center
                  active:scale-100
                  md:hover:scale-[1.03]
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