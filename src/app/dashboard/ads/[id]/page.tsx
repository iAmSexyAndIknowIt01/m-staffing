"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function AdDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAd() {
      if (!id) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/ads/${id}`);
        const result = await response.json();
        
        if (result.ad) {
          setAd(result.ad);
        } else if (result.data) {
          setAd(result.data);
        }
      } catch (err) {
        console.error("Ад татахад алдаа гарлаа", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAd();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!ad) return <div className="text-center py-20 text-gray-500">Зар сурталчилгаа олдсонгүй.</div>;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Тогтмол улбар шар дизайн */}
      <div className="bg-orange-500 text-white rounded-3xl p-8 mb-8 shadow-xl shadow-orange-100">
        <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest text-white">
          {ad.badge}
        </span>
        <h1 className="text-3xl md:text-4xl font-black mt-4 leading-tight">{ad.title}</h1>
      </div>
      
      {/* Контент */}
      <div className="prose lg:prose-lg max-w-none text-gray-800">
        <p className="text-xl font-medium text-gray-600 mb-6">{ad.description}</p>
        <div className="whitespace-pre-line leading-relaxed text-gray-700">{ad.full_content}</div>
      </div>
      
      {/* Буцах товч */}
      <button 
        onClick={() => window.history.back()} 
        className="mt-10 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-md flex items-center gap-2"
      >
        ← Буцах
      </button>
    </div>
  );
}