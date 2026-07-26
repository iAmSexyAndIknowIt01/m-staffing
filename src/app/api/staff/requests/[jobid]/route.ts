import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobid: string }> }
) {
  try {
    const { jobid } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    const userRole = cookieStore.get("user_role")?.value;

    if (!userId || userRole !== "staff") {
      return NextResponse.json(
        { error: "Хандах эрхгүй байна." },
        { status: 403 }
      );
    }

    // tr_job_request -> mt_openjob -> mt_company холбоогоор бүрэн мэдээллийг татах
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
          category,
          job_type,
          salary_type,
          location,
          salary,
          description,
          requirements,
          created_at,
          mt_company (
            id,
            company_name,
            logo_url
          )
        )
      `)
      .eq("id", jobid)
      .eq("applicant_id", userId) // Тухайн хэрэглэгчийн өөрийнх нь хүсэлт мөн эсэхийг баталгаажуулах
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Мэдээлэл олдсонгүй" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}

// status-г шинэчлэх (POST болон PATCH аргуудыг дэмжинэ)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobid: string }> }
) {
  return handleUpdateStatus(request, params);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobid: string }> }
) {
  return handleUpdateStatus(request, params);
}

async function handleUpdateStatus(
  request: Request,
  paramsPromise: Promise<{ jobid: string }>
) {
  try {
    const { jobid } = await paramsPromise;
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    const userRole = cookieStore.get("user_role")?.value;

    if (!userId || userRole !== "staff") {
      return NextResponse.json(
        { error: "Хандах эрхгүй байна." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const newStatus = body.status || "accepted";

    // Тухайн хүсэлт нь зөвхөн нэвтэрсэн хэрэглэгчийнх (applicant_id) мөн эсэхийг шалгаад update хийх
    const { data, error } = await supabase
      .from("tr_job_request")
      .update({ status: newStatus })
      .eq("id", jobid)
      .eq("applicant_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Хүсэлт олдсонгүй эсвэл танд үйлдэл хийх эрх байхгүй байна." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Амжилттай шинэчиллээ", data },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Server update error:", err);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}