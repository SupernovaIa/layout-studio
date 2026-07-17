/**
 * Runtime validation for a brand's `brand.json`, run at load time so a malformed
 * manifest surfaces a clear message in the UI instead of a cryptic crash deep in
 * Pyodide (an unknown `colors` key throws in `BrandColors(**colors)`; a bad hex
 * blows up mid-render).
 *
 * This is the authoritative check. `public/brands/brand.schema.json` mirrors
 * these rules for editor support (`$schema`) and as a contract for the
 * `add-brand` skill — keep the two in sync.
 */
import type { BrandManifest } from "./types";

const HEX = /^#[0-9A-Fa-f]{6}$/;
const SLUG = /^[a-z][a-z0-9-]*$/;

/**
 * Every color key the Python engine's `BrandColors` accepts. The `colors` object
 * is spread into that dataclass (`BrandColors(**colors)`), which rejects unknown
 * kwargs — so an unlisted key here is a hard error, not a warning.
 */
export const ALLOWED_COLOR_KEYS = [
    "primary_dark",
    "primary_light",
    "primary_mid",
    "text",
    "text_soft",
    "line",
    "bg_soft",
    "quote_bg",
    "white",
    "table_header_bg",
    "header_rule",
    "footer_rule",
    "heading",
    "page_number",
] as const;

const REQUIRED_COLOR_KEYS = ["primary_dark", "primary_light", "primary_mid"] as const;
const REQUIRED_FONT_VARIANTS = ["regular", "bold", "medium", "light", "italic"] as const;
const OPTIONAL_FONT_VARIANTS = ["mono"] as const;

function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Returns a list of human-readable problems (Spanish, matching the UI). Empty
 * means the manifest is valid. `slug` is the catalog folder name, checked
 * against the manifest's own `slug` field.
 */
export function validateBrandManifest(raw: unknown, slug: string): string[] {
    const errors: string[] = [];
    if (!isObject(raw)) {
        return [`brand.json de "${slug}" no es un objeto JSON.`];
    }

    // --- identity ---
    if (typeof raw.slug !== "string" || !SLUG.test(raw.slug)) {
        errors.push('`slug` debe ser kebab-case en minúsculas (ej. "acme").');
    } else if (raw.slug !== slug) {
        errors.push(`\`slug\` ("${raw.slug}") no coincide con la carpeta ("${slug}").`);
    }
    if (typeof raw.name !== "string" || raw.name.trim() === "") {
        errors.push("`name` es obligatorio (texto no vacío).");
    }
    if (typeof raw.font_family !== "string" || raw.font_family.trim() === "") {
        errors.push("`font_family` es obligatorio (texto no vacío).");
    }

    // --- colors (spread into BrandColors(**colors): strict on keys + hex) ---
    if (!isObject(raw.colors)) {
        errors.push("`colors` es obligatorio y debe ser un objeto.");
    } else {
        const colors = raw.colors;
        for (const key of REQUIRED_COLOR_KEYS) {
            if (!(key in colors)) errors.push(`Falta el color obligatorio \`${key}\`.`);
        }
        for (const [key, value] of Object.entries(colors)) {
            if (!(ALLOWED_COLOR_KEYS as readonly string[]).includes(key)) {
                errors.push(`Color desconocido \`${key}\` (rompería el motor). Claves válidas: ${ALLOWED_COLOR_KEYS.join(", ")}.`);
                continue;
            }
            if (typeof value !== "string" || !HEX.test(value)) {
                errors.push(`El color \`${key}\` debe ser un hex \`#RRGGBB\` (recibido: ${JSON.stringify(value)}).`);
            }
        }
    }

    // --- fonts ---
    if (!isObject(raw.font_files)) {
        errors.push("`font_files` es obligatorio y debe ser un objeto.");
    } else {
        const ff = raw.font_files;
        for (const variant of REQUIRED_FONT_VARIANTS) {
            if (typeof ff[variant] !== "string" || (ff[variant] as string).trim() === "") {
                errors.push(`Falta la fuente \`font_files.${variant}\` (ruta relativa al .ttf).`);
            }
        }
        for (const variant of OPTIONAL_FONT_VARIANTS) {
            if (variant in ff && typeof ff[variant] !== "string") {
                errors.push(`\`font_files.${variant}\` debe ser una ruta (texto) si se incluye.`);
            }
        }
    }

    // --- optional string fields ---
    for (const field of ["logo_file", "icon_file", "logo_fallback_text", "document_author"] as const) {
        if (field in raw && typeof raw[field] !== "string") {
            errors.push(`\`${field}\` debe ser texto si se incluye.`);
        }
    }
    if ("palettes_source" in raw && raw.palettes_source !== "catalog") {
        errors.push('`palettes_source` solo admite el valor "catalog".');
    }

    return errors;
}

/** Throws a single, readable Error if the manifest is invalid; otherwise narrows the type. */
export function assertValidBrandManifest(raw: unknown, slug: string): asserts raw is BrandManifest {
    const errors = validateBrandManifest(raw, slug);
    if (errors.length > 0) {
        throw new Error(`brand.json de "${slug}" inválido:\n- ${errors.join("\n- ")}`);
    }
}
