/**
 * Brand catalog types. Mirrors what lives in /public/brands/{slug}/brand.json
 * plus the renderer's `LayoutOptions`.
 */

export interface BrandColors {
    primary_dark: string;
    primary_light: string;
    primary_mid: string;
    text?: string;
    text_soft?: string;
    line?: string;
    bg_soft?: string;
    quote_bg?: string;
    white?: string;
    /** Optional per-brand role overrides (fall back to primary_dark / primary_light / line). */
    table_header_bg?: string;
    header_rule?: string;
    footer_rule?: string;
    /** One color for all headings (h1/h2/h3); falls back to primary_dark / primary_mid. */
    heading?: string;
    /** Running page-number color; falls back to primary_light. */
    page_number?: string;
}

export interface BrandManifest {
    slug: string;
    name: string;
    colors: BrandColors;
    font_family: string;
    /** Relative paths inside the brand directory. */
    font_files: {
        regular: string;
        bold: string;
        medium: string;
        light: string;
        italic: string;
        /** Optional monospace TTF for code blocks (e.g. JetBrains Mono). */
        mono?: string;
    };
    logo_file?: string;
    /** Small square icon (PNG, ~256 px) used in the brand selector UI. */
    icon_file?: string;
    logo_fallback_text?: string;
    document_author?: string;
    layout_defaults?: Partial<LayoutOptions>;
    /** If true, this brand ships a palettes.json with selectable color schemes. */
    has_palettes?: boolean;
    /**
     * "catalog" → palettes are built dynamically from the rest of the brand
     * catalog (used by the generic brand). When set, has_palettes is implied.
     */
    palettes_source?: "catalog";
}

/** A single named color palette (from palettes.json or built from the catalog). */
export interface BrandPalette {
    id: string;
    name: string;
    /** Hex color used for the swatch button in the UI. */
    swatch?: string;
    /** All color overrides to apply — may be partial, primaries are required. */
    colors: BrandColors;
}

export interface BrandPaletteCatalog {
    palettes: BrandPalette[];
}

export interface LayoutOptions {
    margin_left: number;
    margin_right: number;
    margin_top: number;
    margin_bottom: number;
    body_size: number;
    body_lead: number;
    h1_size: number;
    h2_size: number;
    h3_size: number;
    justify: boolean;
    /** Word hyphenation for justified text (language from the frontmatter). */
    hyphenate: boolean;
    /** Editorial book layout (cover, auto index, dividers, Ayu Mirage). */
    editorial: boolean;
}

export const DEFAULT_LAYOUT: LayoutOptions = {
    margin_left: 43,
    margin_right: 43,
    margin_top: 48,
    margin_bottom: 48,
    body_size: 9.5,
    body_lead: 14.5,
    h1_size: 16.5,
    h2_size: 12.5,
    h3_size: 11,
    justify: true,
    hyphenate: false,
    editorial: false,
};

export interface BrandCatalog {
    brands: string[];
}
