import { contrastRatio, wcagLevel, type WcagLevel } from "../lib/contrast";
import { resolveTheme, type ResolvedTheme } from "../lib/theme";
import type { BrandColors } from "../lib/types";

interface Props {
    colors: BrandColors;
    /** Render without the card chrome (border/background/padding). */
    bare?: boolean;
}

type Role = keyof ResolvedTheme;

/** The color pairs a reader actually perceives in the rendered PDF. Mirrors the
 *  renderer's draw calls: body/headings on the page, boxes, quotes, the table
 *  header band (white text) and the running page number. */
const PAIRS: { label: string; fg: Role; bg: Role }[] = [
    { label: "Cuerpo / página", fg: "text", bg: "white" },
    { label: "Titulares / página", fg: "heading", bg: "white" },
    { label: "Subtítulos (h3) / página", fg: "heading_h3", bg: "white" },
    { label: "Texto / caja suave", fg: "text", bg: "bg_soft" },
    { label: "Texto / cita", fg: "text", bg: "quote_bg" },
    { label: "Cabecera de tabla", fg: "white", bg: "table_header" },
    { label: "Nº de página / página", fg: "page_number", bg: "white" },
];

const BADGE: Record<WcagLevel, string> = {
    AAA: "border-brand-mint/50 bg-brand-mint/15 text-brand-ink",
    AA: "border-brand-mint/50 bg-brand-mint/15 text-brand-ink",
    "AA grande": "border-amber-400/50 bg-amber-100 text-amber-700",
    Falla: "border-brand-coral/40 bg-brand-coral/10 text-brand-coral",
};

export function ContrastPanel({ colors, bare = false }: Props) {
    const theme = resolveTheme(colors);
    const rows = PAIRS.map((p) => {
        const fg = theme[p.fg];
        const bg = theme[p.bg];
        const ratio = contrastRatio(fg, bg);
        return { ...p, fg, bg, ratio, level: wcagLevel(ratio) };
    });
    const failing = rows.filter((r) => r.level === "Falla").length;

    return (
        <div className={bare ? "" : "rounded-xl border border-brand-line bg-brand-card backdrop-blur-xl p-5 shadow-sm"}>
            <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-1.5">
                    <h2 className="font-display text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-mid">
                        Contraste
                    </h2>
                    <span className="group relative flex cursor-help items-center text-brand-ink-mute">
                        ⓘ
                        <span className="pointer-events-none absolute left-0 top-full z-10 mt-1.5 w-60 rounded-lg bg-brand-dark px-3 py-2 text-[11px] font-normal leading-relaxed normal-case tracking-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                            Comprueba que cada combinación de texto y fondo del PDF se lee
                            bien, según el estándar de accesibilidad WCAG. El ratio va de 1
                            (invisible) a 21 (negro sobre blanco). <b>AA</b> es el mínimo
                            recomendado; <b>Falla</b> significa poco legible.
                        </span>
                    </span>
                </div>
                <p
                    className={`text-[11px] ${
                        failing > 0 ? "font-semibold text-brand-coral" : "text-brand-ink-mute"
                    }`}
                >
                    {failing > 0
                        ? `${failing} por debajo del mínimo`
                        : "legible (AA+)"}
                </p>
            </div>

            <div className="mt-3 grid gap-1.5">
                {rows.map((r) => (
                    <div
                        key={r.label}
                        className="flex items-center justify-between gap-2 rounded-lg border border-brand-line bg-brand-bg/40 px-2.5 py-1.5"
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <span
                                className="flex h-5 w-6 shrink-0 items-center justify-center rounded border border-brand-line text-[11px] font-bold"
                                style={{ backgroundColor: r.bg, color: r.fg }}
                            >
                                Aa
                            </span>
                            <span className="truncate text-[11px] text-brand-ink-soft">
                                {r.label}
                            </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <span className="tabular-nums text-[11px] text-brand-ink-mute">
                                {r.ratio.toFixed(2)}
                            </span>
                            <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${BADGE[r.level]}`}
                            >
                                {r.level}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-2.5 text-[10px] leading-relaxed text-brand-ink-mute">
                Contraste WCAG del esquema de color activo, tal como se dibuja en el PDF.
            </p>
        </div>
    );
}
