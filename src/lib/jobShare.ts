// Ажлын зар хуваалцах линк (ShareModal ашиглана)

// Нэвтрэлтгүй нээгдэх нийтийн зарын хуудас — Facebook, Messenger г.м. урьдчилсан зураг, гарчгийг эндээс уншина
export function jobShareUrl(origin: string, jobId: string): string {
  return `${origin}/jobs/${encodeURIComponent(jobId)}`
}
