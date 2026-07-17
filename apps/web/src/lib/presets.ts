import type { LayoutOptions } from "./types";

/**
 * Named starting points for the layout. A preset only seeds the fields it lists;
 * the advanced controls stay editable, so a preset is a jumping-off point, not a
 * lock. "Density" (margins + body size + leading) is the multi-field intent most
 * users actually think in, which is why it lives behind a single choice here.
 */
export interface LayoutPreset {
    id: string;
    label: string;
    description: string;
    /** Fields this preset sets; everything else is left as-is. */
    values: Partial<LayoutOptions>;
    /** Preset only available for the PDF render path. */
    pdfOnly?: boolean;
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
    {
        id: "compact",
        label: "Compacto",
        description: "Informe técnico denso: más texto por página.",
        values: {
            margin_left: 43, margin_right: 43, margin_top: 48, margin_bottom: 48,
            body_size: 9.5, body_lead: 14.5,
        },
    },
    {
        id: "comfortable",
        label: "Cómodo",
        description: "Más aire e interlineado, cuerpo mayor.",
        values: {
            margin_left: 56, margin_right: 56, margin_top: 62, margin_bottom: 56,
            body_size: 10.5, body_lead: 16.5,
        },
    },
];

// Fields compared to decide whether the current layout still matches a density
// preset.
const DENSITY_KEYS: (keyof LayoutOptions)[] = [
    "margin_left", "margin_right", "margin_top", "margin_bottom", "body_size", "body_lead",
];

/** The preset the current layout matches, or null when it's been fine-tuned. */
export function activePresetId(layout: LayoutOptions): string | null {
    for (const preset of LAYOUT_PRESETS) {
        const matches = DENSITY_KEYS.every((k) => {
            const target = preset.values[k] as number | undefined;
            // Tolerant compare so a non-binary-fraction preset value can't silently
            // fail to match (the current values are all exact, but this future-proofs).
            return target !== undefined && Math.abs((layout[k] as number) - target) < 1e-6;
        });
        if (matches) return preset.id;
    }
    return null;
}
