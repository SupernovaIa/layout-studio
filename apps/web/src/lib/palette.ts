/**
 * Small color helpers for the brand editor — dependency-free (HSL math), in
 * keeping with the contrast module. Enough to derive a coherent brand scheme
 * from one base color and to normalize input for <input type="color">.
 */

import { parseHex } from "./contrast";

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    const d = max - min;
    if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            default:
                h = (r - g) / d + 4;
        }
        h /= 6;
    }
    return { h, s, l };
}

function hue2rgb(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}

function hslToHex(h: number, s: number, l: number): string {
    let r: number;
    let g: number;
    let b: number;
    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    const to = (x: number): string =>
        Math.round(x * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/**
 * A coherent dark / mid / light trio from one base color: same hue, fixed
 * target lightnesses. Keeps the base as the mid (accent) tone; the dark is
 * deep enough to read as text/headings on white.
 */
export function deriveScheme(baseHex: string): {
    primary_dark: string;
    primary_mid: string;
    primary_light: string;
} {
    const { r, g, b } = parseHex(baseHex);
    const { h, s } = rgbToHsl(r, g, b);
    return {
        primary_dark: hslToHex(h, clamp01(s * 0.9), 0.22),
        primary_mid: baseHex.trim().toUpperCase(),
        primary_light: hslToHex(h, clamp01(s * 0.55), 0.85),
    };
}

/** Coerce arbitrary input into a valid #RRGGBB value for <input type="color">. */
export function normalizeColor(v: string): string {
    return /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : "#000000";
}
