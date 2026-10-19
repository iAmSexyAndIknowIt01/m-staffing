const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"]

// Хянах самбарын толгойд харуулах огноо: "2026 оны 10 сарын 19", "Даваа гараг"
// (браузер бүр mn-MN locale-ыг ижил дэмждэггүй тул гараар форматлав)
export function formatToday(now: Date) {
  return {
    date: `${now.getFullYear()} оны ${now.getMonth() + 1} сарын ${now.getDate()}`,
    weekday: `${WEEKDAYS[now.getDay()]} гараг`,
  }
}
