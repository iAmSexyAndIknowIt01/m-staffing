#!/usr/bin/env python3
"""
Dark mode CSS үүсгэгч.

Төслийн компонентууд Tailwind-ийн өнгөний классыг (bg-white, text-gray-900,
border-gray-100, bg-indigo-50 ...) шууд ашигладаг. Хуудас бүрт `dark:` variant
нэмэхийн оронд энэ скрипт src доторх ашиглагдсан өнгөний классуудыг цуглуулж,
`html.dark` үед тэдгээрийг харанхуй хувилбараар нь орлуулах CSS-ийг
src/app/theme-dark.css руу бичнэ.

Шинэ өнгөний класс нэмсний дараа дахин ажиллуулна:
    python3 scripts/generate-dark-theme.py

Зарчим:
- Цайвар гадаргуу (white, gray/slate 50-300), бараан текст (gray/slate 300-950),
  цайвар хүрээ, цайвар өнгөт дэвсгэр (indigo-50 г.м.) -> харанхуй хувилбар
- Аль хэдийн харанхуй дизайнтай элементүүд (bg-slate-900 banner, bg-white/10
  шилэн товч, gradient banner) хөндөгдөхгүй
- Дүрмүүд `@layer utilities` дотор `:where(html.dark)`-тэй тул specificity нь
  эх классын хэмжээнд үлдэж, hover зэрэг төлвүүд хэвийн давамгайлна
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "src" / "app" / "theme-dark.css"

NEUTRALS = {"gray", "slate", "zinc", "neutral", "stone"}
CHROMATIC = {
    "indigo", "orange", "amber", "emerald", "green", "red", "rose", "blue", "sky",
    "violet", "purple", "yellow", "pink", "teal", "cyan", "lime", "fuchsia",
}
VARIANT_RE = r"(?:(?:hover|focus|focus-visible|focus-within|group-hover|active|disabled|checked|peer-checked|placeholder|sm|md|lg|xl):)*"
TOKEN_RE = re.compile(
    r"(?<![\w:/\[-])(" + VARIANT_RE +
    r"(?:bg|text|border|divide|from|via|to)-(?:white|black|" + "|".join(sorted(NEUTRALS | CHROMATIC)) +
    r")(?:-\d{2,3})?(?:/\d{1,3})?!?)(?![\w/-])"
)
# Дурын (arbitrary) hex өнгө: bg-[#f8faff], via-[#fffaf6] г.м. Цайвар бол харанхуй гадаргуу руу
ARBITRARY_RE = re.compile(r"(?<![\w:/\[-])((?:bg|from|via|to)-\[#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\])")

MEDIA = {"sm": "40rem", "md": "48rem", "lg": "64rem", "xl": "80rem"}


def esc(cls: str) -> str:
    return re.sub(r"([:/\[\]#!.()%])", r"\\\1", cls)


def with_alpha(color: str, alpha: int | None) -> str:
    if alpha is None or alpha >= 100:
        return color
    return f"color-mix(in srgb, {color} {alpha}%, transparent)"


def tint(name: str, pct: int) -> str:
    return f"color-mix(in srgb, var(--color-{name}-500) {pct}%, var(--dk-surface))"


def map_color(prop: str, color: str, shade: int | None, alpha: int | None) -> str | None:
    """Харанхуй горимын өнгө, эсвэл хөндөхгүй бол None."""
    if prop == "bg":
        if color == "white":
            return None if (alpha is not None and alpha < 50) else with_alpha("var(--dk-surface)", alpha)
        if color in NEUTRALS and shade is not None:
            if alpha is not None and alpha < 30 and shade >= 800:
                return None
            table = {50: "var(--dk-surface-2)", 100: "var(--dk-surface-3)", 200: "var(--dk-surface-4)",
                     300: "var(--dk-surface-5)", 900: "var(--dk-raised)", 950: "var(--dk-raised)",
                     800: "var(--dk-raised-hover)"}
            v = table.get(shade)
            return with_alpha(v, alpha) if v else None
        if color in CHROMATIC and shade is not None and shade <= 200:
            pct = {50: 14, 100: 20, 200: 28}[shade]
            if alpha is not None and alpha < 100:
                pct = max(4, round(pct * alpha / 100)) if alpha >= 20 else None
                if pct is None:
                    return None
            return tint(color, pct)
        return None

    if prop in ("from", "via", "to"):
        if color == "white" and alpha is None:
            return "var(--dk-surface)"
        if color in NEUTRALS and shade is not None and shade <= 100 and alpha is None:
            return "var(--dk-surface-2)"
        if color in CHROMATIC and shade is not None and shade <= 100 and alpha is None:
            return tint(color, 14 if shade == 50 else 20)
        return None

    if prop == "text":
        if color == "black":
            return "var(--dk-fg)"
        if color in NEUTRALS and shade is not None:
            table = {950: "var(--dk-fg)", 900: "var(--dk-fg)", 800: "var(--dk-fg-2)", 700: "var(--dk-fg-2)",
                     600: "var(--dk-fg-3)", 500: "var(--dk-fg-4)", 400: "var(--dk-fg-5)", 300: "var(--dk-fg-5)"}
            v = table.get(shade)
            return with_alpha(v, alpha) if v else None
        if color in CHROMATIC and shade is not None and shade >= 600:
            to = {600: 400, 700: 300, 800: 300, 900: 200, 950: 200}[shade]
            return with_alpha(f"var(--color-{color}-{to})", alpha)
        return None

    if prop in ("border", "divide"):
        if color == "white":
            return None if (alpha is not None and alpha < 50) else "var(--dk-border)"
        if color in NEUTRALS and shade is not None:
            if shade >= 700:
                return None
            table = {50: "var(--dk-border)", 100: "var(--dk-border)", 200: "var(--dk-border-strong)",
                     300: "var(--dk-border-strong)", 400: "var(--dk-border-heavy)",
                     500: "var(--dk-border-heavy)", 600: "var(--dk-border-heavy)"}
            return with_alpha(table[shade], alpha)
        if color in CHROMATIC and shade is not None and shade <= 200:
            pct = {50: 22, 100: 28, 200: 36}[shade]
            return tint(color, pct)
        return None
    return None


DECL = {
    "bg": "background-color: {v}",
    "text": "color: {v}",
    "border": "border-color: {v}",
    "from": "--tw-gradient-from: {v}",
    "via": "--tw-gradient-via: {v}",
    "to": "--tw-gradient-to: {v}",
}


def is_light_hex(hexstr: str) -> bool:
    if len(hexstr) == 3:
        hexstr = "".join(c * 2 for c in hexstr)
    r, g, b = (int(hexstr[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.85


def build_arbitrary_rule(token: str, hexstr: str) -> str | None:
    if not is_light_hex(hexstr):
        return None
    prop = token.split("-", 1)[0]
    sel = ":where(html.dark) ." + esc(token)
    if prop == "bg":
        return f"  {sel} {{ background-color: var(--dk-bg); }}"
    return f"  {sel} {{ --tw-gradient-{prop}: var(--dk-surface); }}"


def build_rule(token: str) -> str | None:
    important = token.endswith("!")
    core = token[:-1] if important else token
    parts = core.split(":")
    variants, utility = parts[:-1], parts[-1]
    m = re.fullmatch(r"(bg|text|border|divide|from|via|to)-([a-z]+)(?:-(\d{2,3}))?(?:/(\d{1,3}))?", utility)
    if not m:
        return None
    prop, color, shade, alpha = m.group(1), m.group(2), m.group(3), m.group(4)
    value = map_color(prop, color, int(shade) if shade else None, int(alpha) if alpha else None)
    if value is None:
        return None

    sel = "." + esc(token)
    pseudo = ""
    prefix = ":where(html.dark) "
    media = None
    for v in variants:
        if v in MEDIA:
            media = MEDIA[v]
        elif v == "group-hover":
            prefix = ":where(html.dark) .group:hover "
        elif v == "peer-checked":
            prefix = ":where(html.dark) .peer:checked ~ "
        elif v == "placeholder":
            pseudo += "::placeholder"
        else:
            pseudo += ":" + v
    imp = " !important" if important else ""

    if prop == "divide":
        selector = f"{prefix}{sel}{pseudo} > :not(:last-child)"
        decl = f"border-color: {value}{imp}"
    else:
        selector = f"{prefix}{sel}{pseudo}"
        decl = DECL[prop].format(v=value) + imp
    rule = f"  {selector} {{ {decl}; }}"
    if media:
        rule = f"  @media (width >= {media}) {{\n  {rule}\n  }}"
    return rule


def main() -> None:
    tokens: set[str] = set()
    arbitrary: dict[str, str] = {}
    for path in SRC.rglob("*.tsx"):
        text = path.read_text(encoding="utf-8")
        tokens.update(TOKEN_RE.findall(text))
        for token, hexstr in ARBITRARY_RE.findall(text):
            arbitrary[token] = hexstr

    rules = []
    for token, hexstr in sorted(arbitrary.items()):
        rule = build_arbitrary_rule(token, hexstr)
        if rule:
            rules.append(rule)
    for token in sorted(tokens):
        rule = build_rule(token)
        if rule:
            rules.append(rule)

    header = (
        "/* АВТОМАТААР ҮҮСГЭСЭН — гараар бүү засаарай.\n"
        "   scripts/generate-dark-theme.py ажиллуулж шинэчилнэ.\n"
        "   html.dark үед цайвар өнгөний Tailwind классуудыг харанхуй хувилбараар орлуулна. */\n"
    )
    OUT.write_text(header + "@layer utilities {\n" + "\n".join(rules) + "\n}\n", encoding="utf-8")
    print(f"{len(tokens) + len(arbitrary)} класс олдлоо, {len(rules)} дүрэм -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
