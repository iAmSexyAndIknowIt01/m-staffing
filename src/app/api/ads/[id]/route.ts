import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // Таны өөрийн supabase client

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params-ийг Promise гэж тодорхойлно
) {
  // params-ийг await хийж id-г гаргаж авна
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from("mt_ads")
      .select("*")
      .eq("id", id) // Энд params.id-ын оронд шууд id-г ашиглана
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Ads not found" }, { status: 404 });

    return NextResponse.json({ ad: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}