import type { ReactNode } from "react"
import FoalIllustration from "./FoalIllustration"

// «Унага» маскот товчны зүүн талд тохойгоороо түшээд зогсоно: амьсгалах, нүд цавчих, чих сэрвэлзэх
// хөдөлгөөнтэй; товч дээр хулганаа аваачих эсвэл фокуслахад гараа даллана. Утсан дэлгэц дээр нуугдана.
export default function FoalLean({ children }: { children: ReactNode }) {
  return (
    <div className="foal-lean relative flex *:flex-1">
      <FoalIllustration
        variant="lean"
        size={104}
        className="foal-animated pointer-events-none absolute right-full -bottom-2 -mr-4 z-10 hidden md:block"
      />
      {children}
    </div>
  )
}
