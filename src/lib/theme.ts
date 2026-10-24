// Өнгөний горим (light / dark). Хэрэглэгч сонгоогүй бол төхөөрөмжийн тохиргоог дагана.

export type Theme = "light" | "dark"

export const THEME_STORAGE_KEY = "mstaffing-theme"

// <head>-д шууд ажиллах script: хуудас зурагдахаас өмнө html.dark-ийг тавьж
// цагаан өнгө анивчихаас (flash) сэргийлнэ. layout.tsx үүнийг ашиглана.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`
