import nodemailer from "nodemailer"

// Gmail SMTP. GMAIL_USER, GMAIL_APP_PASSWORD орчны хувьсагч шаардлагатай.
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export const MAIL_FROM = `"MSTAFFING" <${process.env.GMAIL_USER}>`

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// Мэдэгдлийн нийтлэг имэйл загвар (гэрээ г.м.). lines-ийг escape хийнэ.
export function noticeEmailHtml(title: string, lines: string[], link?: { href: string; label: string }): string {
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
