import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // Таны төслийн supabase клиент

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("mt_ads")
      .select("*")
      .order("created_at", { ascending: false }); // Шинэ ад эхэнд харагдана

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      ads: data // Өмнөх жишгээр 'ads' гэсэн түлхүүрээр буцаав
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}