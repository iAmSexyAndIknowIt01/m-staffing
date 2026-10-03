import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { MAIL_FROM, codeEmailHtml, transporter } from "@/lib/mailer"
import {
  RESET_CODE_TTL_MS,
  RESET_MAX_ATTEMPTS,
  RESET_MAX_CODES_PER_HOUR,
  RESET_RESEND_COOLDOWN_MS,
  generateResetCode,
  hashResetCode,
  isResetCodeMatch,
  normalizeEmail,
  validateNewPassword,
} from "@/lib/passwordReset"

// Имэйл бүртгэлтэй эсэхээс үл хамааран ижил хариу өгнө —
// ингэснээр энэ API-аар хэний имэйл бүртгэлтэйг тааж олох боломжгүй.
const GENERIC_SENT_MESSAGE =
  "Хэрэв энэ имэйл бүртгэлтэй бол нууц үг сэргээх код илгээгдлээ. Имэйлээ шалгана уу."

const INVALID_CODE_MESSAGE = "Код буруу эсвэл хугацаа нь дууссан байна. Дахин код авна уу."

async function findUserIdByEmail(email: string): Promise<string | null> {
  const [staff, company] = await Promise.all([
    supabase.from("mt_staff").select("id").eq("email", email).maybeSingle(),
    supabase.from("mt_company").select("id").eq("email", email).maybeSingle(),
  ])
  if (staff.error) throw staff.error
  if (company.error) throw company.error
  return staff.data?.id ?? company.data?.id ?? null
}

// -------------------------------------------------------------
// 1. POST: Имэйл рүү 6 оронтой сэргээх код илгээнэ
// -------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = normalizeEmail(body?.email)

    if (!email) {
      return NextResponse.json({ message: "Зөв имэйл хаяг оруулна уу." }, { status: 400 })
    }

    // Давтан илгээлтийг хязгаарлана (бүртгэлгүй имэйлд ч адил хариу өгөхийн тулд эхэлж шалгана)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recent, error: recentError } = await supabase
      .from("password_reset_codes")
      .select("created_at")
      .eq("email", email)
      .gte("created_at", hourAgo)
      .order("created_at", { ascending: false })

    if (recentError) throw recentError

    if (recent && recent.length > 0) {
      const last = new Date(recent[0].created_at).getTime()
      if (Date.now() - last < RESET_RESEND_COOLDOWN_MS) {
        return NextResponse.json(
          { message: "Код саяхан илгээгдсэн байна. 1 минутын дараа дахин оролдоно уу." },
          { status: 429 }
        )
      }
      if (recent.length >= RESET_MAX_CODES_PER_HOUR) {
        return NextResponse.json(
          { message: "Хэт олон удаа код хүссэн байна. 1 цагийн дараа дахин оролдоно уу." },
          { status: 429 }
        )
      }
    }

    const userId = await findUserIdByEmail(email)
    if (!userId) {
      return NextResponse.json({ success: true, message: GENERIC_SENT_MESSAGE })
    }

    const code = generateResetCode()

    // Өмнөх кодууд хүчингүй — зөвхөн хамгийн сүүлийнх нь ажиллана.
    // Устгахгүй, attempts-ийг дүүргэнэ: цагийн хязгаарын тоололд орсон хэвээр үлдэнэ.
    await supabase
      .from("password_reset_codes")
      .update({ attempts: RESET_MAX_ATTEMPTS })
      .eq("email", email)

    const { error: insertError } = await supabase
      .from("password_reset_codes")
      .insert({ user_id: userId, email, code_hash: hashResetCode(code) })

    if (insertError) throw insertError

    await transporter.sendMail({
      from: MAIL_FROM,
      to: email,
      subject: "MSTAFFING - Нууц үг сэргээх код",
      html: codeEmailHtml(
        "Таны МSTAFFING бүртгэлийн нууц үг сэргээх 6 оронтой код (10 минут хүчинтэй):",
        code
      ),
    })

    return NextResponse.json({ success: true, message: GENERIC_SENT_MESSAGE })
  } catch (error) {
    console.error("PASSWORD_RESET_POST_ERROR:", error)
    return NextResponse.json({ message: "Код илгээх явцад алдаа гарлаа." }, { status: 500 })
  }
}

// -------------------------------------------------------------
// 2. PUT: Кодыг шалгаад шинэ нууц үгийг тохируулна
// -------------------------------------------------------------
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const email = normalizeEmail(body?.email)
    const code = typeof body?.code === "string" ? body.code.trim() : ""
    const newPassword = body?.password

    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ message: "Имэйл болон 6 оронтой код шаардлагатай." }, { status: 400 })
    }

    const passwordError = validateNewPassword(newPassword)
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 })
    }

    const { data: latest, error: fetchError } = await supabase
      .from("password_reset_codes")
      .select("id, user_id, code_hash, attempts, created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError) throw fetchError

    if (
      !latest ||
      latest.attempts >= RESET_MAX_ATTEMPTS ||
      Date.now() - new Date(latest.created_at).getTime() > RESET_CODE_TTL_MS
    ) {
      return NextResponse.json({ message: INVALID_CODE_MESSAGE }, { status: 400 })
    }

    if (!isResetCodeMatch(code, latest.code_hash)) {
      const attempts = latest.attempts + 1
      await supabase.from("password_reset_codes").update({ attempts }).eq("id", latest.id)

      const remaining = RESET_MAX_ATTEMPTS - attempts
      return NextResponse.json(
        {
          message: remaining > 0
            ? `Код буруу байна. ${remaining} оролдлого үлдлээ.`
            : "Хэт олон удаа буруу оруулсан тул код хүчингүй боллоо. Дахин код авна уу.",
        },
        { status: 400 }
      )
    }

    // Кодыг дахин ашиглахгүйн тулд нууц үг солихоос өмнө хүчингүй болгоно
    const { data: consumed, error: consumeError } = await supabase
      .from("password_reset_codes")
      .update({ attempts: RESET_MAX_ATTEMPTS })
      .eq("id", latest.id)
      .lt("attempts", RESET_MAX_ATTEMPTS)
      .select("id")

    if (consumeError) throw consumeError
    if (!consumed || consumed.length === 0) {
      // Зэрэг ирсэн өөр хүсэлт энэ кодыг аль хэдийн ашигласан
      return NextResponse.json({ message: INVALID_CODE_MESSAGE }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(latest.user_id, {
      password: newPassword as string,
    })

    if (updateError) {
      console.error("PASSWORD_RESET_UPDATE_ERROR:", updateError)
      const message = updateError.code === "weak_password"
        ? "Нууц үг хэт сул байна. Илүү урт, нийлмэл нууц үг оруулна уу."
        : updateError.code === "same_password"
          ? "Шинэ нууц үг хуучинтайгаа ижил байна."
          : "Нууц үг шинэчлэхэд алдаа гарлаа."
      // Шинэчлэгдээгүй тул кодыг буцааж ашиглах боломжтой болгоно
      await supabase.from("password_reset_codes").update({ attempts: latest.attempts }).eq("id", latest.id)
      return NextResponse.json({ message }, { status: 400 })
    }

    // Нууц үг солигдсон тул:
    // - бусад төхөөрөмж дээрх бүх session-ийг хүчингүй болгоно
    // - login түгжээг тайлна
    // - энэ имэйлийн сэргээх кодуудыг устгана
    const results = await Promise.all([
      supabase
        .from("auth_session_revocations")
        .upsert({ user_id: latest.user_id, revoked_before: new Date().toISOString() }, { onConflict: "user_id" }),
      supabase.from("auth_login_attempts").delete().eq("email", email),
      supabase.from("password_reset_codes").delete().eq("email", email),
    ])
    for (const { error } of results) {
      if (error) console.error("PASSWORD_RESET_CLEANUP_ERROR:", error)
    }

    return NextResponse.json({
      success: true,
      message: "Нууц үг амжилттай шинэчлэгдлээ. Шинэ нууц үгээрээ нэвтэрнэ үү.",
    })
  } catch (error) {
    console.error("PASSWORD_RESET_PUT_ERROR:", error)
    return NextResponse.json({ message: "Нууц үг шинэчлэх явцад алдаа гарлаа." }, { status: 500 })
  }
}
