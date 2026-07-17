/**
 * WCAG contrast — pure functions, no dependencies.
 *
 * Relative-luminance ratio per WCAG 2.1. Kept dependency-free on purpose: the
 * contrast panel only needs ratios, not the full color engine, so this mirrors
 * the tiny luminance formula rather than pulling in a color library.
 */

export type WcagLevel = "AAA" | "AA" | "AA grande" | "Falla";

/** Parse #RGB or #RRGGBB into 0–255 channels; falls back to black on garbage. */
export function parseHex(hex: string): { r: number; g: number; b: number } {
    let h = hex.trim().replace(/^#/, "");
    if (h.length === 3) h = h.replace(/./g, (c) => c + c);
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return { r: 0, g: 0, b: 0 };
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
    };
}

/** Linearize an sRGB channel (0–255) for luminance. */
function channel(v: number): number {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
    const { r, g, b } = parseHex(hex);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two colors (order-independent), rounded to 2 dp. */
export function contrastRatio(a: string, b: string): number {
    const l1 = luminance(a);
    const l2 = luminance(b);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return Math.round(ratio * 100) / 100;
}

/** Map a contrast ratio to its WCAG level (normal-size text thresholds). */
export function wcagLevel(ratio: number): WcagLevel {
    if (ratio >= 7) return "AAA";
    if (ratio >= 4.5) return "AA";
    if (ratio >= 3) return "AA grande";
    return "Falla";
}
