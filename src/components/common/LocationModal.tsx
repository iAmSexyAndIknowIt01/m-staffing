import { useState, useEffect } from "react";

type Location = { id: number; name: string; parent_id: number | null };

export default function LocationModal({ isOpen, onClose, onSelect }: { isOpen: boolean; onClose: () => void; onSelect: (name: string) => void }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedParent, setSelectedParent] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/locations")
        .then(res => res.json())
        .then(data => setLocations(data.data));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parents = locations.filter((loc) => loc.parent_id === null);
  const children = locations.filter((loc) => loc.parent_id === selectedParent);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Бариул */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />

        <h3 className="font-black text-xl mb-4 text-gray-800">
          {selectedParent ? "Дүүрэг / Сум" : "Байршил сонгох"}
        </h3>
        
        {selectedParent && (
          <button 
            onClick={() => setSelectedParent(null)} 
            className="mb-4 flex items-center text-orange-500 font-bold text-sm hover:underline"
          >
            ← Буцах
          </button>
        )}

        <div className="space-y-2 overflow-y-auto flex-1 pr-2">
          {(!selectedParent ? parents : children).map((loc) => {
            const hasChildren = locations.some((l) => l.parent_id === loc.id);

            return (
              <button 
                key={loc.id} 
                onClick={() => {
                  if (hasChildren) {
                    setSelectedParent(loc.id);
                  } else {
                    // Parent / Child нэрийг нэгтгэх логик
                    const parentLocation = locations.find((l) => l.id === loc.parent_id);
                    const finalName = parentLocation 
                      ? `${parentLocation.name} / ${loc.name}` 
                      : loc.name;
                    
                    onSelect(finalName);
                    onClose();
                  }
                }}
                className="flex justify-between items-center w-full p-4 bg-gray-50 hover:bg-orange-50 rounded-2xl transition-all active:scale-95 border border-gray-100"
              >
                <span className="font-semibold text-gray-700">{loc.name}</span>
                {hasChildren && <span className="text-gray-400">▶</span>}
              </button>
            );
          })}
        </div>

        <button 
          onClick={onClose} 
          className="mt-6 w-full bg-gray-900 text-white py-4 rounded-2xl font-bold active:scale-95 transition"
        >
          Хаах
        </button>
      </div>
    </div>
  );
}