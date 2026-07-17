import type { ExportFormat } from "./RenderButton";
import type { LayoutOptions } from "../lib/types";
import { LAYOUT_PRESETS, activePresetId } from "../lib/presets";

interface Props {
    value: LayoutOptions;
    onChange: (next: LayoutOptions) => void;
    format: ExportFormat;
    onFormatChange: (f: ExportFormat) => void;
}

const FORMAT_OPTIONS: { id: ExportFormat; label: string; activeClass: string }[] = [
    { id: "pdf", label: "PDF", activeClass: "bg-[#d32f2f] text-white shadow-sm" },
    { id: "docx", label: "Word", activeClass: "bg-[#2b579a] text-white shadow-sm" },
    { id: "html", label: "HTML", activeClass: "bg-[#e36209] text-white shadow-sm" },
];

const NUMBER_FIELDS: { key: keyof LayoutOptions; label: string }[] = [
    { key: "margin_left", label: "Margen izq." },
    { key: "margin_right", label: "Margen der." },
    { key: "margin_top", label: "Margen sup." },
    { key: "margin_bottom", label: "Margen inf." },
    { key: "body_size", label: "Cuerpo" },
    { key: "body_lead", label: "Interlineado" },
    { key: "h1_size", label: "Título H1" },
    { key: "h2_size", label: "Título H2" },
    { key: "h3_size", label: "Título H3" },
];

const SECTION_LABEL =
    "mb-2 text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-mid";

export function LayoutControls({
    value,
    onChange,
    format,
    onFormatChange,
}: Props) {
    const setField = (key: keyof LayoutOptions, v: number | boolean) =>
        onChange({ ...value, [key]: v });

    const presets = LAYOUT_PRESETS;
    const active = activePresetId(value);
    const activePreset = presets.find((p) => p.id === active);

    return (
        <div className="rounded-xl border border-brand-line bg-brand-card backdrop-blur-xl p-5 shadow-sm">
            <div>
                <p className={SECTION_LABEL}>Formato</p>
                <div
                    role="group"
                    aria-label="Formato de salida"
                    className="inline-flex rounded-lg border border-brand-line bg-brand-bg p-0.5"
                >
                    {FORMAT_OPTIONS.map((o) => {
                        const isSelected = format === o.id;
                        return (
                            <button
                                key={o.id}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => onFormatChange(o.id)}
                                className={`rounded-md px-4 py-1 text-xs font-semibold transition ${
                                    isSelected ? o.activeClass : "text-brand-text-soft hover:bg-brand-card"
                                }`}
                            >
                                {o.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-4">
                <p className={SECTION_LABEL}>Tipo de documento</p>
                <div
                    role="group"
                    aria-label="Tipo de documento"
                    className="inline-flex flex-wrap rounded-lg border border-brand-line bg-brand-bg p-0.5"
                >
                    {presets.map((p) => {
                        const isSelected = active === p.id;
                        const disabled = p.pdfOnly && format === "docx";
                        return (
                            <button
                                key={p.id}
                                type="button"
                                aria-pressed={isSelected}
                                disabled={disabled}
                                title={disabled ? "Solo disponible en PDF." : p.description}
                                onClick={() => onChange({ ...value, ...p.values })}
                                className={`rounded-md px-4 py-1 text-xs font-semibold transition ${
                                    isSelected
                                        ? "bg-brand-mint text-brand-dark shadow-sm"
                                        : "text-brand-text-soft hover:bg-brand-card"
                                } ${disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent" : ""}`}
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-brand-ink-soft">
                    {activePreset ? activePreset.description : "Ajustes personalizados."}
                </p>
            </div>

            <details className="group mt-4 border-t border-brand-line pt-3">
                <summary className="flex cursor-pointer list-none items-center gap-1 text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-mid hover:text-brand-ink">
                    <svg aria-hidden className="h-3 w-3 transition group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" />
                    </svg>
                    Ajustes avanzados
                </summary>

                <label className="mt-3 flex items-center gap-2.5 text-sm text-brand-ink">
                    <input
                        type="checkbox"
                        checked={value.justify}
                        onChange={(e) => setField("justify", e.target.checked)}
                        className="h-4 w-4 rounded border-brand-line text-brand-ink accent-brand-mint focus:ring-2 focus:ring-brand-mint/30"
                    />
                    Texto justificado
                </label>

                <label className={`mt-2 flex items-center gap-2.5 text-sm ${value.justify ? "cursor-pointer text-brand-ink" : "cursor-not-allowed opacity-40"}`}>
                    <input
                        type="checkbox"
                        checked={value.hyphenate}
                        disabled={!value.justify}
                        onChange={(e) => setField("hyphenate", e.target.checked)}
                        className="h-4 w-4 rounded border-brand-line text-brand-ink accent-brand-mint focus:ring-2 focus:ring-brand-mint/30 disabled:cursor-not-allowed"
                    />
                    Partición de palabras
                    <span className="group relative flex cursor-help items-center text-brand-ink-soft">
                        ⓘ
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 w-52 -translate-x-1/2 rounded-lg bg-brand-dark px-3 py-2 text-[11px] leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                            Añade guiones al final de línea para un justificado más apretado (sin ríos). El idioma se toma del documento.
                        </span>
                    </span>
                </label>

                <div className="mt-3 grid grid-cols-2 gap-3">
                    {NUMBER_FIELDS.map(({ key, label }) => (
                        <label
                            key={key}
                            className="block text-[11px] font-medium text-brand-ink-soft"
                        >
                            {label}
                            <input
                                type="number"
                                step="0.5"
                                value={value[key] as number}
                                onChange={(e) => setField(key, Number(e.target.value))}
                                className="mt-1 w-full rounded-md border border-brand-line bg-brand-bg px-2 py-1.5 text-sm text-brand-ink focus:border-brand-mint focus:outline-none focus:ring-2 focus:ring-brand-mint/30"
                            />
                        </label>
                    ))}
                </div>
            </details>
        </div>
    );
}
