import { NextResponse } from "next/server";
import { getSession } from "@/lib/session"; // 🔥 Күүки уншихад ашиглана
import { supabase } from "@/lib/supabase"; 
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  try {
    const { job_id } = await req.json();

    if (!job_id) {
      return NextResponse.json({ message: "Ажлын ID шаардлагатай" }, { status: 400 });
    }

    // 1. 🔥 КҮҮКИ-ЭЭС STAFF_ID-Г УНШИЖ АВАХ
    const session = await getSession();
    const staffId = session?.userId; // Таны күүкиний нэр 'user_id' гэж үзэв

    if (!staffId || session.role !== "staff") {
      return NextResponse.json({ message: "Хэрэглэгчийн сесс олдсонгүй (staff_id күүки байхгүй байна)" }, { status: 401 });
    }

    // Анкет бүрт зөвхөн нэг удаа мэйл илгээнэ: notified_at-г атомаар тэмдэглэж,
    // анкет байхгүй эсвэл өмнө нь мэйл явсан бол илгээхгүй (spam-аас сэргийлнэ)
    const { data: claimed, error: claimError } = await supabase
      .from("tr_job_request")
      .update({ notified_at: new Date().toISOString() })
      .eq("job_id", job_id)
      .eq("applicant_id", staffId)
      .is("notified_at", null)
      .select("id")
      .maybeSingle();

    if (claimError) throw claimError;

    if (!claimed) {
      return NextResponse.json({ message: "Мэйл аль хэдийн илгээгдсэн эсвэл анкет олдсонгүй" }, { status: 409 });
    }

    // 2. Ажил хайгчийн (Staff) мэдээллийг баазаас шүүж авах
    const { data: staffData, error: staffError } = await supabase
      .from("mt_staff") // Таны ажил хайгчийн хүснэгт
      .select("first_name, last_name, email") // Шаардлагатай баганууд
      .eq("id", staffId)
      .single();

    if (staffError || !staffData) {
      console.error("STAFF_DATA_FETCH_ERROR:", staffError);
      return NextResponse.json({ message: "Ажил хайгчийн мэдээлэл олдсонгүй" }, { status: 404 });
    }

    const fullName = `${staffData.last_name || ""} ${staffData.first_name || ""}`.trim();

    // 3. Ажлын байр болон Компанийн мэдээллийг баазаас татах
    const { data: jobData, error: jobError } = await supabase
      .from("mt_openjob")
      .select(`
        title,
        mt_company (
          company_name,
          email 
        )
      `)
      .eq("id", job_id)
      .single();

    if (jobError || !jobData || !jobData.mt_company) {
      console.error("JOB_DATA_FETCH_ERROR:", jobError);
      return NextResponse.json({ message: "Ажлын байр эсвэл компанийн мэдээлэл олдсонгүй" }, { status: 404 });
    }

    const companyEmail = (jobData.mt_company as any).email;
    // Хэрэглэгчийн оруулсан утгуудыг HTML-д escape хийнэ (мэйл дотор линк/HTML шигтгэхээс сэргийлнэ)
    const companyName = escapeHtml((jobData.mt_company as any).company_name);
    const jobTitle = escapeHtml(jobData.title);
    const safeFullName = escapeHtml(fullName);
    const safeStaffEmail = escapeHtml(staffData.email);

    if (!companyEmail) {
      return NextResponse.json({ message: "Ажил олгогчийн мэйл хаяг бүртгэлгүй байна" }, { status: 400 });
    }

    // 4. Gmail-ээр ажил олгогч руу мэйл илгээх
    await transporter.sendMail({
      from: `"MSTAFFING" <${process.env.GMAIL_USER}>`,
      to: companyEmail,
      subject: `[MSTAFFING] Шинэ анкет ирлээ - ${String(jobData.title ?? "").replace(/[\r\n]+/g, " ")}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
          <h2 style="color: #4f46e5; text-align: center;">MSTAFFING</h2>
          <p>Сайн байна уу, <strong>${companyName}</strong>?</p>
          <p>Танай системд зарласан <span style="color: #4f46e5; font-weight: bold;">"${jobTitle}"</span> ажлын байранд шинэ ажил хайгч анкет илгээлээ.</p>
          
          <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #4c1d95; line-height: 1.6;">
              <strong>Ажил хайгчийн нэр:</strong> ${safeFullName}<br/>
              <strong>Холбоо барих мэйл:</strong> ${safeStaffEmail}<br/>
              <span style="display: block; margin-top: 8px; font-weight: bold;">
                Дэлгэрэнгүйг Ажил олгогчийн хянах самбар (Dashboard) руугаа нэвтэрч үзнэ үү.
              </span>
            </p>
          </div>
          
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
            Энэхүү мэйл нь системээс автоматаар илгээгдсэн тул хариу бичих шаардлагагүй.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Ажил олгогчид мэдэгдэл амжилттай хүргэгдлээ." });

  } catch (error: any) {
    console.error("MAIL_JOB_REQUEST_POST_ERROR:", error);
    return NextResponse.json({ message: "Мэйл илгээх явцад алдаа гарлаа" }, { status: 500 });
  }
}