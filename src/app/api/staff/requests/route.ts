import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    const userRole = cookieStore.get("user_role")?.value;

    if (!userId || userRole !== "staff") {
      return NextResponse.json(
        { error: "Хандах эрхгүй байна." },
        { status: 403 }
      );
    }

    // tr_job_request -> mt_openjob -> mt_company холбоогоор company_name татах
    const { data, error } = await supabase
      .from("tr_job_request")
      .select(`
        id,
        job_id,
        applicant_id,
        applicant_name,
        applicant_email,
        applicant_phone,
        resume_url,
        status,
        created_at,
        mt_openjob (
          id,
          title,
          mt_company (
            company_name
          )
        )
      `)
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}