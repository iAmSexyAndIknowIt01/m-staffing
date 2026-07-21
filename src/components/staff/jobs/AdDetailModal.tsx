"use client";

interface Ad {
  id: string;
  title: string;
  description: string;
  badge: string;
  full_content?: string;
}

interface AdDetailModalProps {
  selectedAd: Ad | null;
  onClose: () => void;
}

export default function AdDetailModal({ selectedAd, onClose }: AdDetailModalProps) {
  if (!selectedAd) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Модалын толгой хэсэг (Улбар шар дизайн) */}
        <div className="bg-orange-500 text-white p-6 relative">
          {/* <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all text-white font-bold"
          >
            ✕
          </button> */}
          
          <span className="inline-block bg-white/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest text-white mb-3">
            {selectedAd.badge}
          </span>
          <h2 className="text-2xl font-black leading-tight pr-8">{selectedAd.title}</h2>
        </div>

        {/* Модалын контент хэсэг */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-base font-semibold text-gray-700">{selectedAd.description}</p>
          {selectedAd.full_content && (
            <div className="whitespace-pre-line leading-relaxed text-gray-600 text-sm">
              {selectedAd.full_content}
            </div>
          )}
        </div>

        {/* Модалын хөл хэсэг */}
        <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all text-sm"
          >
            Хаах
          </button>
        </div>

      </div>
    </div>
  );
}