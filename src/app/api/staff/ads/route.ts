import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // Таны төслийн supabase клиент

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("mt_ads")
      .select("id, title, description, full_content, badge, color_from, color_to, created_at")
      .order("created_at", { ascending: false }); // Шинэ ад эхэнд харагдана

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      ads: data // Өмнөх жишгээр 'ads' гэсэн түлхүүрээр буцаав
    });
  } catch (error) {
    console.error("STAFF_ADS_ERROR:", error)
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}