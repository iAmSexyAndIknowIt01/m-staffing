// Нийтэд харагдах байгууллагын мэдээлэл (Бидний тухай, Түгээмэл асуулт хуудас г.м.).
// Холбоо барих мэдээллийг энд шууд бөглөнө. Хоосон талбар хуудсан дээр харагдахгүй.
export const SITE_NAME = "MStaffing"

export const SITE_CONTACT = {
  email: "hotinfo@mstaffing.mn",
  phone: "99448977",
  // Одоогоор хаяг харуулахгүй
  address: "",
}

export const HAS_CONTACT_INFO = Object.values(SITE_CONTACT).some(Boolean)
