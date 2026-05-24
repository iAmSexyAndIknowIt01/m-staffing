export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div className="max-w-[1400px] mx-auto px-8 py-6">
        <div
          className="
            glass
            rounded-full
            px-8
            py-4
            flex
            justify-between
            items-center
          "
        >
          <h1 className="font-black text-2xl orange-text">
            MStaffing
          </h1>

          <div className="flex items-center gap-8">
            <a className="cursor-pointer hover:text-orange-500 transition">
              Ажлууд
            </a>

            <a className="cursor-pointer hover:text-orange-500 transition">
              Байгууллага
            </a>

            <button className="orange-btn">
              Нэвтрэх
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}