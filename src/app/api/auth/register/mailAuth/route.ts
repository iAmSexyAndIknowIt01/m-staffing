import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; 
import nodemailer from "nodemailer";

// Gmail SMTP тохиргоо
// Gmail SMTP тохиргоог ингэж шинэчилнэ:
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    // SSL гэрчилгээний алдааг үл тоомсорлож, холболтыг үргэлжлүүлнэ
    rejectUnauthorized: false,
  },
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Имэйл хаяг шаардлагатай" }, { status: 400 });
    }

    // Хэрэглэгч бүртгэгдсэн эсэхийг шалгах
    const { data: existingUser } = await supabase
      .from("mt_staff")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json({ message: "Энэ имэйл хаяг бүртгэгдсэн байна." }, { status: 400 });
    }

    // 6 оронтой код үүсгэх
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

    // register_auth хүснэгтэд хадгалах
    const { error: insertError } = await supabase
      .from("register_auth")
      .insert([{ mail: email, code: generatedCode }]);

    if (insertError) throw insertError;

    // 🔥 ЖИНХЭНЭ GMAIL-ЭЭР ЯМАР Ч ХЯЗГААРЛАЛТГҮЙ ШУУД ИЛГЭЭХ
    await transporter.sendMail({
      from: `"MSTAFFING" <${process.env.GMAIL_USER}>`,
      to: email, // Одоо хэрэглэгчийн бичсэн ямар ч имэйл рүү шууд очно
      subject: "MSTAFFING - Бүртгэл баталгаажуулах код",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
          <h2 style="color: #f97316; text-align: center;">МSTAFFING</h2>
          <p>Сайн байна уу?</p>
          <p>МSTAFFING системд бүртгүүлсэнд баярлалаа. Таны бүртгэлийг баталгаажуулах 6 оронтой код:</p>
          <div style="background-color: #fff7ed; border: 1px dashed #fed7aa; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #ea580c; margin: 20px 0; border-radius: 8px;">
            ${generatedCode}
          </div>
          <p style="color: #666; font-size: 12px;">Энэхүү кодыг хэнд ч дамжуулж болохгүй. Хэрэв та бүртгүүлээгүй бол энэ имэйлийг үл тоомсорлоорой.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Баталгаажуулах код имэйл рүү амжилттай илгээгдлээ.",
    });

  } catch (error) {
    console.error("MAIL_AUTH_POST_ERROR:", error);
    return NextResponse.json({ message: "Код илгээх явцад алдаа гарлаа" }, { status: 500 });
  }
}

// -------------------------------------------------------------
// 2. PUT ХҮСЭЛТ: Оруулсан кодыг register_auth-аас шүүж тулгана.
// -------------------------------------------------------------
export async function PUT(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ message: "Имэйл болон код шаардлагатай" }, { status: 400 });
    }

    const { data: latestAuth, error: fetchError } = await supabase
      .from("register_auth")
      .select("*")
      .eq("mail", email)
      .order("createdate", { ascending: false }) 
      .limit(1)
      .maybeSingle(); 

    if (fetchError) throw fetchError;

    if (!latestAuth) {
      return NextResponse.json({ message: "Баталгаажуулах хүсэлт олдсонгүй. Дахин код авна уу." }, { status: 404 });
    }

    if (latestAuth.code !== code) {
      return NextResponse.json({ message: "Баталгаажуулах код буруу байна." }, { status: 400 });
    }

    const now = new Date();
    const codeDuration = now.getTime() - new Date(latestAuth.createdate).getTime();
    const fiveMinutes = 5 * 60 * 1000;

    if (codeDuration > fiveMinutes) {
      return NextResponse.json({ message: "Кодны хүчинтэй 5 минутын хугацаа дууссан байна. Дахин код авна уу." }, { status: 400 });
    }

    await supabase.from("register_auth").delete().eq("mail", email);

    return NextResponse.json({ success: true, message: "Имэйл амжилттай баталгаажлаа." });
  } catch (error) {
    console.error("MAIL_AUTH_PUT_ERROR:", error);
    return NextResponse.json({ message: "Код баталгаажуулах явцад алдаа гарлаа" }, { status: 500 });
  }
}