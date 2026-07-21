"use client";

interface Ad {
  id: string;
  title: string;
  description: string;
  badge: string;
  full_content?: string; // шаардлагатай бол бүрэн контент талбар
}

export default function AdCard({ 
  ad, 
  onOpenModal 
}: { 
  ad: Ad; 
  onOpenModal: (ad: Ad) => void 
}) {
  return (
    <div 
      onClick={() => onOpenModal(ad)}
      className="bg-orange-500 border border-orange-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer my-4 group"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1">
          <span className="inline-block bg-white/25 text-white backdrop-blur-md text-[10px] px-3 py-1 rounded-full font-bold tracking-widest uppercase border border-white/20">
            {ad.badge}
          </span>
          <h3 className="text-lg font-extrabold mt-3 leading-tight text-white group-hover:opacity-90 transition-opacity">
            {ad.title}
          </h3>
          <p className="text-sm text-white/80 mt-1.5 leading-relaxed">
            {ad.description}
          </p>
        </div>
        
        <div className="shrink-0">
          <button className="px-5 py-2.5 bg-white text-orange-600 rounded-2xl text-sm font-bold shadow-sm hover:bg-orange-50 transition-all flex items-center gap-2">
            Дэлгэрэнгүй
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}