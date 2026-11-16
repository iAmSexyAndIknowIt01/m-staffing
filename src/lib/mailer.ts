import nodemailer from "nodemailer"
import { RESEND_BATCH_LIMIT, getResendConfig, sendBatchViaResend, sendViaResend, type MailMessage } from "./resend"

// Системийн БҮХ имэйл энэ файлын sendEmail / sendBulkEmail-ээр явна:
//   1. RESEND_API_KEY байвал noreply@mstaffing.mn (RESEND_FROM)-ээс Resend-ээр
//   2. Resend тохируулаагүй эсвэл алдаа өгвөл (жишээ нь Free багцын өдрийн хязгаар) Gmail SMTP-ээр нөөцөөр
//      (Gmail нь өөрийн хаягаасаа л илгээх тул нөөц үед илгээгч нь GMAIL_USER байна)

// Gmail SMTP (нөөц). GMAIL_USER, GMAIL_APP_PASSWORD орчны хувьсагч шаардлагатай.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const GMAIL_FROM = `"MStaffing" <${process.env.GMAIL_USER}>`
const GMAIL_BCC_BATCH = 50

// Нэг хүлээн авагчид имэйл илгээнэ (код, мэдэгдэл, гэрээ г.м.)
export async function sendEmail(message: MailMessage): Promise<void> {
  const resend = getResendConfig()
  if (resend) {
    try {
      await sendViaResend(message, resend)
      return
    } catch (error) {
      console.error("RESEND_SEND_ERROR (Gmail руу шилжинэ):", error)
    }
  }

  await transporter.sendMail({ from: GMAIL_FROM, ...message })
}

// Баталгаажуулах код (OTP) — sendEmail-тэй ижил (хуучин нэрийг хадгалав)
export const sendCodeEmail = sendEmail

// Олон хүнд ижил имэйл (ажлын санал г.м.). Хүн бүр зөвхөн өөрийн хаягийг харна:
// Resend-ээр бол хүн тус бүрд тусдаа имэйл (batch), Gmail нөөцөөр бол BCC.
export async function sendBulkEmail(recipients: string[], subject: string, html: string): Promise<void> {
  const resend = getResendConfig()
  for (let i = 0; i < recipients.length; i += RESEND_BATCH_LIMIT) {
    const chunk = recipients.slice(i, i + RESEND_BATCH_LIMIT)
    if (resend) {
      try {
        await sendBatchViaResend(chunk.map((to) => ({ to, subject, html })), resend)
        continue
      } catch (error) {
        console.error("RESEND_BATCH_ERROR (Gmail руу шилжинэ):", error)
      }
    }
    for (let j = 0; j < chunk.length; j += GMAIL_BCC_BATCH) {
      await transporter.sendMail({
        from: GMAIL_FROM,
        to: GMAIL_FROM,
        bcc: chunk.slice(j, j + GMAIL_BCC_BATCH),
        subject,
        html,
      })
    }
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// Мэдэгдлийн нийтлэг имэйл загвар (гэрээ г.м.). lines-ийг escape хийнэ.
// settingsHref өгвөл доор нь «мэдэгдлийн тохиргоо» холбоос гарна (хэрэглэгч өөрөө унтраах боломжтой).
export function noticeEmailHtml(
  title: string,
  lines: string[],
  link?: { href: string; label: string },
  settingsHref?: string
): string {
  const body = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")
  const button = link
    ? `<div style="text-align: center; margin: 24px 0;">
        <a href="${escapeHtml(link.href)}" style="background-color: #f97316; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">${escapeHtml(link.label)}</a>
      </div>`
    : ""
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
      <h2 style="color: #f97316; text-align: center;">МSTAFFING</h2>
      <h3 style="color: #111827;">${escapeHtml(title)}</h3>
      ${body}
      ${button}
      ${
        settingsHref
          ? `<p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 28px;">Энэ имэйлийг MStaffing автоматаар илгээв. Имэйл мэдэгдлээ <a href="${escapeHtml(settingsHref)}" style="color: #ea580c;">тохиргоо</a> хэсгээс өөрчилж болно.</p>`
          : ""
      }
    </div>
  `
}

// 6 оронтой кодыг харуулах нийтлэг имэйл загвар
export function codeEmailHtml(intro: string, code: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
      <h2 style="color: #f97316; text-align: center;">МSTAFFING</h2>
      <p>Сайн байна уу?</p>
      <p>${intro}</p>
      <div style="background-color: #fff7ed; border: 1px dashed #fed7aa; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #ea580c; margin: 20px 0; border-radius: 8px;">
        ${code}
      </div>
      <p style="color: #666; font-size: 12px;">Энэхүү кодыг хэнд ч дамжуулж болохгүй. Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоорой.</p>
    </div>
  `
}
