// Нийтэд харагдах байгууллагын мэдээлэл (Бидний тухай, Түгээмэл асуулт хуудас г.м.).
// Холбоо барих мэдээллийг орчны хувьсагчаас уншина — Vercel-ийн Environment Variables-д
// NEXT_PUBLIC_CONTACT_EMAIL, NEXT_PUBLIC_CONTACT_PHONE, NEXT_PUBLIC_CONTACT_ADDRESS-ийг тохируулахад
// кодыг өөрчлөхгүйгээр шинэчлэгдэнэ. Хоосон талбар хуудсан дээр харагдахгүй.
export const SITE_NAME = "MStaffing"

export const SITE_CONTACT = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() ?? "",
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS?.trim() ?? "",
}

export const HAS_CONTACT_INFO = Object.values(SITE_CONTACT).some(Boolean)
