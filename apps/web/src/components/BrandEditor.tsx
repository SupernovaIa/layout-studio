import { useEffect, useState } from "react";

import { deriveScheme, normalizeColor } from "../lib/palette";
import { fullColors } from "../lib/theme";
import type { BrandColors } from "../lib/types";

interface Props {
    /** The color scheme currently in effect (brand, palette or custom). */
    colors: BrandColors;
    /** Whether a custom override is active (vs. the brand/palette defaults). */
    custom: boolean;
    /** Emit a full custom override. */
    onChange: (next: BrandColors) => void;
    /** Drop the custom override, back to the brand/palette scheme. */
    onReset: () => void;
    /** Render without the card chrome (border/background/padding). */
    bare?: boolean;
}

type Field = { key: keyof BrandColors; label: string };

const GROUPS: { eyebrow: string; fields: Field[] }[] = [
    {
        eyebrow: "Primarios",
        fields: [
            { key: "primary_dark", label: "Oscuro" },
            { key: "primary_mid", label: "Medio" },
            { key: "primary_light", label: "Claro" },
        ],
    },
    {
        eyebrow: "Texto",
        fields: [
            { key: "text", label: "Texto" },
            { key: "text_soft", label: "Texto suave" },
        ],
    },
    {
        eyebrow: "Superficies",
        fields: [
            { key: "white", label: "Página" },
            { key: "bg_soft", label: "Caja suave" },
            { key: "quote_bg", label: "Cita" },
            { key: "line", label: "Líneas" },
        ],
    },
];

export function BrandEditor({ colors, custom, onChange, onReset, bare = false }: Props) {
    // Explicit values (defaults resolved) so every field shows a real color.
    const view = fullColors(colors);

    // Base color for the scheme generator; follows the active mid tone.
    const [base, setBase] = useState(view.primary_mid);
    useEffect(() => setBase(view.primary_mid), [view.primary_mid]);

    const setField = (key: keyof BrandColors, value: string) =>
        onChange({ ...view, [key]: value });

    const generate = () => onChange({ ...view, ...deriveScheme(base) });

    return (
        <div className={bare ? "" : "rounded-xl border border-brand-line bg-brand-card backdrop-blur-xl p-5 shadow-sm"}>
            <div className="flex items-baseline justify-between">
                <h2 className="font-display text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-mid">
                    Colores
                </h2>
                {custom ? (
                    <button
                        type="button"
                        onClick={onReset}
                        className="text-[11px] text-brand-ink-mute underline decoration-brand-line underline-offset-2 transition hover:text-brand-coral"
                    >
                        Restablecer
                    </button>
                ) : (
                    <span className="text-[11px] text-brand-ink-mute">de la marca</span>
                )}
            </div>

            {/* Scheme generator */}
            <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-mid/80">
                    Generar desde un color
                </p>
                <div className="flex items-center gap-2">
                    <span
                        className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-brand-line"
                        style={{ background: base }}
                    >
                        <input
                            type="color"
                            value={normalizeColor(base)}
                            onChange={(e) => setBase(e.target.value)}
                            className="absolute inset-0 cursor-pointer opacity-0"
                            aria-label="Color base"
                        />
                    </span>
                    <input
                        type="text"
                        value={base}
                        onChange={(e) => setBase(e.target.value)}
                        placeholder="#RRGGBB"
                        className="w-full rounded-md border border-brand-line bg-brand-bg px-2 py-1.5 font-mono text-xs text-brand-ink focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                    />
                    <button
                        type="button"
                        onClick={generate}
                        className="shrink-0 rounded-md bg-brand-accent px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:brightness-110"
                    >
                        Generar
                    </button>
                </div>
                <p className="mt-1 text-[10px] text-brand-ink-mute">
                    Deriva oscuro / medio / claro del mismo tono.
                </p>
            </div>

            {/* Per-role fields */}
            <div className="mt-4 space-y-4 border-t border-brand-line pt-4">
                {GROUPS.map((g) => (
                    <div key={g.eyebrow}>
                        <p className="mb-2 text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-mid/80">
                            {g.eyebrow}
                        </p>
                        <div className="space-y-2">
                            {g.fields.map((f) => (
                                <ColorField
                                    key={f.key}
                                    label={f.label}
                                    value={(view[f.key] as string) ?? ""}
                                    onChange={(v) => setField(f.key, v)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ColorField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <label className="flex items-center gap-2">
            <span
                className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-brand-line"
                style={{ background: value }}
            >
                <input
                    type="color"
                    value={normalizeColor(value)}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                />
            </span>
            <span className="w-24 shrink-0 text-[11px] text-brand-ink-soft">{label}</span>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#RRGGBB"
                className="w-full rounded-md border border-brand-line bg-brand-bg px-2 py-1 font-mono text-xs text-brand-ink focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
            />
        </label>
    );
}
