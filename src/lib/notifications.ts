import { supabase } from "@/lib/supabase"
import { selectInChunks } from "@/lib/chunk"
import { MAIL_FROM, noticeEmailHtml, transporter } from "@/lib/mailer"
import { getAppOrigin } from "@/lib/url"
import { getJobCategoryLabel } from "@/lib/jobPost"
import {
  normalizeNotificationSettings,
  wantsJobOffer,
  type NotificationKey,
  type NotificationRole,
  type NotificationSettings,
} from "@/lib/notificationCatalog"

// Имэйл мэдэгдэл (nodemailer + Gmail SMTP). Хэрэглэгчийн тохиргоог (mt_notification_settings) шалгаж илгээнэ.
// Мэйл илгээж чадаагүй ч үндсэн үйлдлийг (анкетын төлөв, төлбөр г.м.) буцаахгүй — зөвхөн лог бичнэ.

const SETTINGS_COLUMNS = "application_status, job_offer, job_offer_categories, new_application, payment"

// Gmail өдөрт ~500 хүлээн авагч зөвшөөрдөг тул нэг зарын санал хэт олон хүнд явахаас сэргийлнэ
const JOB_OFFER_MAX_RECIPIENTS = 200
const BCC_BATCH = 50

export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  const { data, error } = await supabase
    .from("mt_notification_settings")
    .select(SETTINGS_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle()
  // Хүснэгт/мөр байхгүй бол анхдагч утга
  if (error) console.error("NOTIFICATION_SETTINGS_READ_ERROR:", error)
  return normalizeNotificationSettings(data)
}

export async function saveNotificationSettings(userId: string, role: NotificationRole, settings: NotificationSettings) {
  const { error } = await supabase
    .from("mt_notification_settings")
    .upsert({ user_id: userId, role, ...settings, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
  if (error) throw error
}

export function settingsUrl(req: Request, role: NotificationRole): string | undefined {
  const origin = getAppOrigin(req)
  return origin ? `${origin}/dashboard/${role}/settings` : undefined
}

export function appLink(req: Request, path: string, label: string): { href: string; label: string } | undefined {
  const origin = getAppOrigin(req)
  return origin ? { href: `${origin}${path}`, label } : undefined
}

interface NoticeInput {
  req: Request
  userId: string
  role: NotificationRole
  // Тохиргоогоор унтрааж болох төрөл. Өгөөгүй бол (жишээ нь байгууллага баталгаажих) үргэлж илгээнэ.
  type?: NotificationKey
  to: string | null | undefined
  subject: string
  lines: string[]
  link?: { href: string; label: string }
}

// Хэрэглэгч тухайн төрлийн мэдэгдлийг асаасан бол (type өгөөгүй бол шууд) нэг имэйл илгээнэ. Илгээсэн эсэхийг буцаана.
export async function sendNotice({ req, userId, role, type, to, subject, lines, link }: NoticeInput): Promise<boolean> {
  if (!to) return false
  try {
    if (type) {
      const settings = await getNotificationSettings(userId)
      if (!settings[type]) return false
    }
    await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject: `[MStaffing] ${subject.replace(/[\r\n]+/g, " ")}`,
      html: noticeEmailHtml(subject, lines, link, settingsUrl(req, role)),
    })
    return true
  } catch (err) {
    console.error(`NOTICE_MAIL_ERROR(${type ?? "always"}):`, err)
    return false
  }
}

// Шинэ зар нийтлэгдэхэд тухайн ангиллын санал авахаар тохируулсан ажил хайгчдад BCC-ээр мэдэгдэнэ
export async function notifyJobOffer(
  req: Request,
  job: { id: string; title: string; category: string; location?: string | null; companyId: string }
) {
  try {
    const { data: rows, error } = await supabase
      .from("mt_notification_settings")
      .select("user_id, job_offer, job_offer_categories")
      .eq("role", "staff")
      .eq("job_offer", true)
      .limit(2000)
    if (error) throw error

    const userIds = (rows ?? [])
      .filter((row) => wantsJobOffer(normalizeNotificationSettings(row), job.category))
      .map((row) => String(row.user_id))
    if (userIds.length === 0) return

    const staff = await selectInChunks<{ id: string; email: string | null }>(userIds, (ids) =>
      supabase.from("mt_staff").select("id, email").in("id", ids)
    )
    const emails = [...new Set(staff.map((s) => s.email?.trim()).filter((e): e is string => !!e))].slice(0, JOB_OFFER_MAX_RECIPIENTS)
    if (emails.length === 0) return

    const { data: company } = await supabase.from("mt_company").select("company_name").eq("id", job.companyId).maybeSingle()
    const companyName = company?.company_name || "Ажил олгогч"
    const subject = `Шинэ ажлын санал: ${job.title}`
    const lines = [
      `${companyName} "${job.title}" ажлын байр нийтэллээ.`,
      `Ангилал: ${getJobCategoryLabel(job.category)}${job.location ? ` · Байршил: ${job.location}` : ""}`,
      "Сонирхож байвал MStaffing-д нэвтэрч анкетаа илгээгээрэй.",
    ]
    const html = noticeEmailHtml(subject, lines, appLink(req, `/dashboard/staff/jobs/${job.id}`, "Ажлын байрыг харах"), settingsUrl(req, "staff"))

    // Хүлээн авагчид бие биеийнхээ хаягийг харахгүйн тулд BCC-ээр багцлан илгээнэ
    for (let i = 0; i < emails.length; i += BCC_BATCH) {
      await transporter.sendMail({
        from: MAIL_FROM,
        to: MAIL_FROM,
        bcc: emails.slice(i, i + BCC_BATCH),
        subject: `[MStaffing] ${subject.replace(/[\r\n]+/g, " ")}`,
        html,
      })
    }
  } catch (err) {
    console.error("JOB_OFFER_MAIL_ERROR:", err)
  }
}
