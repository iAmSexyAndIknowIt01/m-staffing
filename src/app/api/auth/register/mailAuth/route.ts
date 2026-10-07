import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MAIL_FROM, codeEmailHtml, transporter } from "@/lib/mailer";
import { escapeLikePattern, generateCode, hashCode, isCodeMatch, normalizeEmail } from "@/lib/authCode";
import { getClientIp } from "@/lib/clientIp";
import { MAIL_CODE_MAX_PER_IP, MAIL_CODE_WINDOW_MS, isRateLimited, recordRateEvent } from "@/lib/rateLimit";

const CODE_TTL_MS = 5 * 60 * 1000       // Код 5 минут хүчинтэй
const RESEND_COOLDOWN_MS = 60 * 1000    // Нэг имэйл рүү 60 секундэд нэг удаа л код илгээнэ
const MAX_ATTEMPTS = 5                  // Буруу кодыг 5-аас олон удаа оруулбал код хүчингүй болно

// -------------------------------------------------------------
// 1. POST ХҮСЭЛТ: 6 оронтой код үүсгэж имэйлээр илгээнэ.
// -------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body?.email)

    if (!email) {
      return NextResponse.json({ message: "Зөв имэйл хаяг оруулна уу" }, { status: 400 });
    }

    // Хэрэглэгч бүртгэгдсэн эсэхийг шалгах (ажилтан болон компани).
    // ilike нь хуучин том үсэгтэй хадгалсан имэйлийг ч олно; %, _ тэмдэгтийг escape хийнэ.
    const emailPattern = escapeLikePattern(email)
    const [{ data: existingStaff }, { data: existingCompany }] = await Promise.all([
      supabase.from("mt_staff").select("id").ilike("email", emailPattern).limit(1).maybeSingle(),
      supabase.from("mt_company").select("id").ilike("email", emailPattern).limit(1).maybeSingle(),
    ])

    if (existingStaff || existingCompany) {
      return NextResponse.json({ message: "Энэ имэйл хаяг бүртгэгдсэн байна." }, { status: 400 });
    }

    // Давтан илгээлтийг хязгаарлах (Gmail-ээр spam явуулахаас сэргийлнэ)
    const { data: latest } = await supabase
      .from("register_auth")
      .select("createdate")
      .eq("mail", email)
      .order("createdate", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latest && Date.now() - new Date(latest.createdate).getTime() < RESEND_COOLDOWN_MS) {
      return NextResponse.json(
        { message: "Код саяхан илгээгдсэн байна. 1 минутын дараа дахин оролдоно уу." },
        { status: 429 }
      )
    }

    // Нэг IP-ээс олон өөр имэйл рүү код явуулахыг хязгаарлана
    const ip = getClientIp(req)
    if (await isRateLimited("mail_code", ip, MAIL_CODE_MAX_PER_IP, MAIL_CODE_WINDOW_MS)) {
      return NextResponse.json(
        { message: "Хэт олон удаа код хүссэн байна. Түр хүлээгээд дахин оролдоно уу." },
        { status: 429 }
      )
    }

    const generatedCode = generateCode();

    // Өмнөх кодуудыг устгаад шинийг хадгална (кодыг ил биш, hash-аар)
    await supabase.from("register_auth").delete().eq("mail", email)

    const { error: insertError } = await supabase
      .from("register_auth")
      .insert([{ mail: email, code: hashCode(generatedCode) }]);

    if (insertError) throw insertError;

    await recordRateEvent("mail_code", ip)

    await transporter.sendMail({
      from: MAIL_FROM,
      to: email,
      subject: "MSTAFFING - Бүртгэл баталгаажуулах код",
      html: codeEmailHtml(
        "МSTAFFING системд бүртгүүлсэнд баярлалаа. Таны бүртгэлийг баталгаажуулах 6 оронтой код:",
        generatedCode
      ),
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
// Амжилттай бол verified_at тэмдэглэнэ — /api/auth/register үүнийг шалгаж хэрэглэнэ.
// -------------------------------------------------------------
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body?.email)
    const code = typeof body?.code === "string" ? body.code.trim() : ""

    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ message: "Имэйл болон 6 оронтой код шаардлагатай" }, { status: 400 });
    }

    const { data: latestAuth, error: fetchError } = await supabase
      .from("register_auth")
      .select("id, code, createdate, attempts")
      .eq("mail", email)
      .order("createdate", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!latestAuth) {
      return NextResponse.json({ message: "Баталгаажуулах хүсэлт олдсонгүй. Дахин код авна уу." }, { status: 404 });
    }

    if (Date.now() - new Date(latestAuth.createdate).getTime() > CODE_TTL_MS) {
      await supabase.from("register_auth").delete().eq("mail", email)
      return NextResponse.json({ message: "Кодны хүчинтэй 5 минутын хугацаа дууссан байна. Дахин код авна уу." }, { status: 400 });
    }

    if ((latestAuth.attempts ?? 0) >= MAX_ATTEMPTS) {
      await supabase.from("register_auth").delete().eq("mail", email)
      return NextResponse.json({ message: "Хэт олон удаа буруу оролдлоо. Дахин код авна уу." }, { status: 429 });
    }

    if (!isCodeMatch(code, latestAuth.code)) {
      await supabase
        .from("register_auth")
        .update({ attempts: (latestAuth.attempts ?? 0) + 1 })
        .eq("id", latestAuth.id)
      return NextResponse.json({ message: "Баталгаажуулах код буруу байна." }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("register_auth")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", latestAuth.id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, message: "Имэйл амжилттай баталгаажлаа." });
  } catch (error) {
    console.error("MAIL_AUTH_PUT_ERROR:", error);
    return NextResponse.json({ message: "Код баталгаажуулах явцад алдаа гарлаа" }, { status: 500 });
  }
}
