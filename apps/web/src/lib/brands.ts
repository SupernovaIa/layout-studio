/**
 * Brand catalog loader. Reads the static index at /brands/index.json and
 * each brand's manifest at /brands/{slug}/brand.json. Returns nothing
 * cached at the module level — let React Query / component state cache
 * if needed.
 */

import { assertValidBrandManifest } from "./brand-schema";
import type { BrandCatalog, BrandManifest, BrandPalette, BrandPaletteCatalog } from "./types";

const BRANDS_BASE = "/brands";

export async function loadBrandCatalog(): Promise<string[]> {
    const res = await fetch(`${BRANDS_BASE}/index.json`);
    if (!res.ok) {
        throw new Error(`No se pudo cargar el catálogo de marcas (${res.status})`);
    }
    const data: BrandCatalog = await res.json();
    return data.brands;
}

export async function loadBrandManifest(slug: string): Promise<BrandManifest> {
    const res = await fetch(`${BRANDS_BASE}/${slug}/brand.json`);
    if (!res.ok) {
        throw new Error(`No se pudo cargar la marca "${slug}" (${res.status})`);
    }
    const raw: unknown = await res.json();
    assertValidBrandManifest(raw, slug);
    return raw;
}

export function brandAssetUrl(slug: string, relativePath: string): string {
    return `${BRANDS_BASE}/${slug}/${relativePath}`;
}

/**
 * Display name for a brand/palette. Kept as a hook so brands can carry a longer
 * `name` (e.g. a vendor suffix) while the UI shows a short label. By default it
 * just returns the trimmed name unchanged.
 */
export function brandDisplayName(name: string): string {
    return name.trim() || name;
}

/**
 * Loads the palette catalog for a brand that has `has_palettes: true`.
 * Returns an empty array if the brand has no palettes.json.
 */
export async function loadBrandPalettes(slug: string): Promise<BrandPalette[]> {
    const res = await fetch(`${BRANDS_BASE}/${slug}/palettes.json`);
    if (!res.ok) return [];
    const data: BrandPaletteCatalog = await res.json();
    return data.palettes;
}

/**
 * Builds palettes dynamically from the brand catalog, excluding `excludeSlug`.
 * Used by brands with `palettes_source: "catalog"` (e.g. the generic brand).
 */
export async function loadPalettesFromCatalog(excludeSlug: string): Promise<BrandPalette[]> {
    const slugs = await loadBrandCatalog();
    const others = slugs.filter((s) => s !== excludeSlug);
    // Tolerate a malformed brand: skip it (with a warning) rather than break
    // every palette for the catalog-sourced brand.
    const manifests = await Promise.all(
        others.map((s) =>
            loadBrandManifest(s).catch((err: Error) => {
                console.warn(`Paleta de "${s}" omitida: ${err.message}`);
                return null;
            }),
        ),
    );
    return manifests
        .filter((m): m is BrandManifest => m !== null)
        .map((m) => ({
            id: m.slug,
            name: m.name,
            swatch: m.colors.primary_mid,
            colors: m.colors,
        }));
}
