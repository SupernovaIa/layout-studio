/**
 * Resolve a brand's `BrandColors` into concrete drawing colors.
 *
 * Mirror of the renderer's `Theme.resolve` (packages/renderer/.../theme.py):
 * the same defaults and override→fallback rules, so the contrast panel reflects
 * exactly the colors the PDF is drawn with. Keep the two in sync.
 */

import type { BrandColors } from "./types";

/** Defaults for the optional-but-always-filled slots (see config.py BrandColors). */
const DEFAULTS = {
    text: "#1A1A1A",
    text_soft: "#555555",
    line: "#D6DEE5",
    bg_soft: "#F4F7FA",
    quote_bg: "#EAF4FB",
    white: "#FFFFFF",
} as const;

export interface ResolvedTheme {
    dark: string;
    light: string;
    mid: string;
    text: string;
    text_soft: string;
    line: string;
    bg_soft: string;
    quote_bg: string;
    white: string;
    table_header: string;
    header_rule: string;
    footer_rule: string;
    page_number: string;
    heading: string;
    heading_h3: string;
}

/** Treat empty/whitespace as absent, matching the renderer's `if value` pick(). */
function pick(value: string | undefined, fallback: string): string {
    return value && value.trim() ? value : fallback;
}

/**
 * Expand a (possibly sparse) BrandColors into an explicit set of the nine
 * "base" colors, resolving their defaults. The optional role overrides
 * (table_header_bg, heading, …) are preserved verbatim rather than filled, so
 * a round-trip through the editor never disturbs the heading→h3 fallback split.
 */
export function fullColors(c: BrandColors): BrandColors {
    const t = resolveTheme(c);
    return {
        primary_dark: t.dark,
        primary_light: t.light,
        primary_mid: t.mid,
        text: t.text,
        text_soft: t.text_soft,
        line: t.line,
        bg_soft: t.bg_soft,
        quote_bg: t.quote_bg,
        white: t.white,
        table_header_bg: c.table_header_bg,
        header_rule: c.header_rule,
        footer_rule: c.footer_rule,
        heading: c.heading,
        page_number: c.page_number,
    };
}

export function resolveTheme(c: BrandColors): ResolvedTheme {
    const dark = c.primary_dark;
    const light = c.primary_light;
    const mid = c.primary_mid;
    const line = pick(c.line, DEFAULTS.line);

    return {
        dark,
        light,
        mid,
        text: pick(c.text, DEFAULTS.text),
        text_soft: pick(c.text_soft, DEFAULTS.text_soft),
        line,
        bg_soft: pick(c.bg_soft, DEFAULTS.bg_soft),
        quote_bg: pick(c.quote_bg, DEFAULTS.quote_bg),
        white: pick(c.white, DEFAULTS.white),
        table_header: pick(c.table_header_bg, dark),
        header_rule: pick(c.header_rule, light),
        footer_rule: pick(c.footer_rule, line),
        page_number: pick(c.page_number, light),
        heading: pick(c.heading, dark),
        heading_h3: pick(c.heading, mid),
    };
}
