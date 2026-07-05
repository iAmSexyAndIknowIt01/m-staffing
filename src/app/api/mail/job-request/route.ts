import { NextResponse } from "next/server";
import { cookies } from "next/headers"; // 🔥 Күүки уншихад ашиглана
import { supabase } from "@/lib/supabase"; 
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
});

export async function POST(req: Request) {
  try {
    const { job_id } = await req.json();

    if (!job_id) {
      return NextResponse.json({ message: "Ажлын ID шаардлагатай" }, { status: 400 });
    }

    // 1. 🔥 КҮҮКИ-ЭЭС STAFF_ID-Г УНШИЖ АВАХ
    const cookieStore = await cookies();
    const staffId = cookieStore.get("user_id")?.value; // Таны күүкиний нэр 'user_id' гэж үзэв

    if (!staffId) {
      return NextResponse.json({ message: "Хэрэглэгчийн сесс олдсонгүй (staff_id күүки байхгүй байна)" }, { status: 401 });
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
    const companyName = (jobData.mt_company as any).company_name;
    const jobTitle = jobData.title;

    if (!companyEmail) {
      return NextResponse.json({ message: "Ажил олгогчийн мэйл хаяг бүртгэлгүй байна" }, { status: 400 });
    }

    // 4. Gmail-ээр ажил олгогч руу мэйл илгээх
    await transporter.sendMail({
      from: `"MSTAFFING" <${process.env.GMAIL_USER}>`,
      to: companyEmail,
      subject: `[MSTAFFING] Шинэ анкет ирлээ - ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
          <h2 style="color: #4f46e5; text-align: center;">MSTAFFING</h2>
          <p>Сайн байна уу, <strong>${companyName}</strong>?</p>
          <p>Танай системд зарласан <span style="color: #4f46e5; font-weight: bold;">"${jobTitle}"</span> ажлын байранд шинэ ажил хайгч анкет илгээлээ.</p>
          
          <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #4c1d95; line-height: 1.6;">
              <strong>Ажил хайгчийн нэр:</strong> ${fullName}<br/>
              <strong>Холбоо барих мэйл:</strong> ${staffData.email}<br/>
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
    return NextResponse.json({ message: "Мэйл илгээх явцад алдаа гарлаа", error: error.message }, { status: 500 });
  }
}