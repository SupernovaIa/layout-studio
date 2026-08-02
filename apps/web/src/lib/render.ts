/**
 * Render orchestration: pulls brand assets from the static catalog, writes
 * them into Pyodide's virtual filesystem and calls the renderer's public
 * API. Returns a `Uint8Array` of PDF bytes.
 */

import JSZip from "jszip";

import { brandAssetUrl, loadBrandManifest } from "./brands";
import { ensurePythonDocx, getPyodide } from "./pyodide";
import type { MermaidTheme } from "./mermaid";
import type { BrandColors, BrandManifest, LayoutOptions } from "./types";

type PaletteColors = Partial<BrandColors>;

/**
 * A non-fatal problem rasterizing an embedded asset (formula, mermaid diagram
 * or SVG image). The offending block is left as-is in the document and the
 * render continues; callers can surface these to the user afterwards.
 */
export interface AssetWarning {
    kind: "formula" | "mermaid" | "svg";
    /** The offending source — the TeX, mermaid code or image src. */
    detail: string;
    /** The underlying error message. */
    message: string;
}

type AssetWarn = (w: AssetWarning) => void;

const BRAND_FS_ROOT = "/brands";
const DOC_FS_ROOT = "/doc-assets";
/** FS dir where rasterized formula PNGs are staged (absolute paths, not base_path-relative). */
const FORMULA_FS_DIR = `${DOC_FS_ROOT}/_formulas`;
/** FS dir where rasterized mermaid diagram PNGs are staged (absolute paths). */
const MERMAID_FS_DIR = `${DOC_FS_ROOT}/_mermaid`;
/** FS dir where rasterized SVG-image PNGs are staged (absolute paths). */
const SVG_FS_DIR = `${DOC_FS_ROOT}/_svg`;

/** Fenced ```mermaid ... ``` block. Captures the diagram source (group 1). */
const MERMAID_BLOCK_RE = /^[ \t]*```[ \t]*mermaid[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```[ \t]*$/gim;

/** Matches markdown image refs `![alt](src)`, capturing the src. */
const IMAGE_REF_RE = /!\[[^\]]*\]\(([^)]+)\)/g;

/** Block math: `$$ ... $$` (possibly multi-line). Captures the TeX body. */
const BLOCK_FORMULA_RE = /\$\$([\s\S]+?)\$\$/g;

/**
 * Markdown code regions, so formula detection skips them: a `$` inside a code
 * fence or inline code is shell/literal (`$VAR`, `$(cmd)`), never math. Matches
 * fenced blocks (``` and ~~~), then double- and single-backtick inline code.
 * Used as the split delimiter (capturing group) so code is preserved verbatim
 * while only the spans between it are scanned for `$...$`.
 */
const CODE_REGION_RE = /(```[\s\S]*?```|~~~[\s\S]*?~~~|``[^`]*``|`[^`\n]*`)/g;

/**
 * Inline math `$ ... $`, GitHub-style, to avoid false positives on prices:
 *  - not preceded by `\` (escape) or `$` (so `$$` blocks are excluded);
 *  - no whitespace just inside either delimiter;
 *  - the closing `$` is not followed by a digit (kills `$10 y $20`) nor `$`;
 *  - single line only.
 * Literal dollars are written `\$` and un-escaped after extraction.
 */
const INLINE_FORMULA_RE = /(?<![\\$])\$(?!\s)([^\n$]+?)(?<!\s)\$(?![\d$])/g;

/** Directory portion of a "/"-separated path ("a/b/c.md" → "a/b", "x.md" → ""). */
function dirOf(p: string): string {
    const i = p.lastIndexOf("/");
    return i === -1 ? "" : p.slice(0, i);
}

/** Normalize a "/"-separated path, resolving "." and ".." and dropping empties. */
function normalizePath(p: string): string {
    const out: string[] = [];
    for (const seg of p.split("/")) {
        if (seg === "" || seg === ".") continue;
        if (seg === "..") out.pop();
        else out.push(seg);
    }
    return out.join("/");
}

async function fetchBytes(url: string): Promise<Uint8Array> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status})`);
    return new Uint8Array(await res.arrayBuffer());
}

/**
 * Remove everything staged for a single document (rasterized formula/mermaid/SVG
 * PNGs and per-doc images, all under {@link DOC_FS_ROOT}) from Pyodide's FS.
 * Called between files in a batch so memory stays bounded to one document
 * instead of growing with the whole folder. Brand assets (`/brands`, `/custom`)
 * are staged once and deliberately left in place. Best-effort.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanDocAssets(pyodide: any): void {
    try {
        pyodide.runPython(`import shutil; shutil.rmtree("${DOC_FS_ROOT}", ignore_errors=True)`);
    } catch {
        /* best-effort: a failed cleanup must not abort the batch */
    }
}

/**
 * Stages brand assets in Pyodide's FS (idempotent per brand+session) and
 * returns the FS metadata needed to build a `BrandConfig` in Python.
 */
const stagedBrands = new Set<string>();

async function stageBrandAssets(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pyodide: any,
    brand: BrandManifest,
): Promise<{ fontsDir: string; logoPath: string | null; hasMono: boolean }> {
    const brandDir = `${BRAND_FS_ROOT}/${brand.slug}`;
    const fontsDir = `${brandDir}/fonts`;
    const logoExt = brand.logo_file?.split(".").pop() ?? "png";
    const logoPath = brand.logo_file ? `${brandDir}/logo.${logoExt}` : null;
    const hasMono = Boolean(brand.font_files.mono);

    if (stagedBrands.has(brand.slug)) return { fontsDir, logoPath, hasMono };

    pyodide.FS.mkdirTree(fontsDir);

    const fontEntries = Object.entries(brand.font_files) as Array<
        [keyof BrandManifest["font_files"], string]
    >;
    for (const [variant, relPath] of fontEntries) {
        const bytes = await fetchBytes(brandAssetUrl(brand.slug, relPath));
        pyodide.FS.writeFile(`${fontsDir}/${variant}.ttf`, bytes);
    }

    if (brand.logo_file && logoPath) {
        const bytes = await fetchBytes(brandAssetUrl(brand.slug, brand.logo_file));
        pyodide.FS.writeFile(logoPath, bytes);
    }

    stagedBrands.add(brand.slug);
    return { fontsDir, logoPath, hasMono };
}

async function stageCustomLogo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pyodide: any,
    file: File,
): Promise<string> {
    const ext = file.name.split(".").pop() ?? "png";
    const path = `/custom/logo.${ext}`;
    pyodide.FS.mkdirTree("/custom");
    pyodide.FS.writeFile(path, new Uint8Array(await file.arrayBuffer()));
    return path;
}

/** Co-branding logo source: one of the catalog brands' logos, or an uploaded file. */
export type ClientLogo =
    | { kind: "brand"; slug: string }
    | { kind: "custom"; file: File };

/**
 * Stages the client co-branding logo in Pyodide's FS and returns its path,
 * or null when the source has no usable logo (e.g. a catalog brand without
 * logo_file). Brand-sourced logos are fetched from the static catalog.
 */
async function stageClientLogo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pyodide: any,
    logo: ClientLogo,
): Promise<string | null> {
    let bytes: Uint8Array;
    let ext: string;
    if (logo.kind === "brand") {
        const manifest = await loadBrandManifest(logo.slug);
        if (!manifest.logo_file) return null;
        bytes = await fetchBytes(brandAssetUrl(logo.slug, manifest.logo_file));
        ext = manifest.logo_file.split(".").pop() ?? "png";
    } else {
        bytes = new Uint8Array(await logo.file.arrayBuffer());
        ext = logo.file.name.split(".").pop() ?? "png";
    }
    const path = `/custom/client-logo.${ext}`;
    pyodide.FS.mkdirTree("/custom");
    pyodide.FS.writeFile(path, bytes);
    return path;
}

/** Metadata for one staged formula, consumed by the Python renderer. */
interface StagedFormula {
    /** Absolute Pyodide-FS path to the rasterized PNG. */
    path: string;
    /** Intrinsic width/height in MathJax `ex` units (Python sizes from these). */
    ex_w: number;
    ex_h: number;
    /** Depth below the baseline in `ex` — inline baseline alignment. */
    ex_depth: number;
    /** True for `$$...$$` display math (own line, centered). */
    display: boolean;
}

/**
 * Rasterizes `$$...$$` (block) and `$...$` (inline) math to PNGs, stages them
 * in Pyodide's FS and replaces each in the markdown with a `⟦Fn⟧` marker the
 * renderer recognizes — standalone (own line) for block, in-place for inline.
 * Finally un-escapes `\$` to a literal `$`. Returns the rewritten markdown and
 * the `id → metadata` map. MathJax is imported lazily so documents without
 * math pay nothing.
 *
 * Block runs before inline so `$$` is never mistaken for two inline delimiters.
 */
async function stageFormulas(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pyodide: any,
    markdown: string,
    colorHex: string,
    onWarn?: AssetWarn,
): Promise<{ markdown: string; formulas: Record<string, StagedFormula> }> {
    if (!markdown.includes("$")) return { markdown, formulas: {} };

    const { renderFormula } = await import("./formulas");
    const formulas: Record<string, StagedFormula> = {};
    let idx = 0;
    let madeDir = false;

    // One pass over a regex: render each match (async, in document order) then
    // substitute markers in a single sync replace pulling from the queue, so
    // identical TeX (distinct ids) can't be mis-targeted.
    const runPass = async (
        src: string,
        re: RegExp,
        display: boolean,
        marker: (id: string) => string,
    ): Promise<string> => {
        const matches = [...src.matchAll(re)];
        if (matches.length === 0) return src;
        if (!madeDir) {
            pyodide.FS.mkdirTree(FORMULA_FS_DIR);
            madeDir = true;
        }
        const out: string[] = [];
        for (const m of matches) {
            const tex = m[1].trim();
            if (!tex) {
                out.push(m[0]); // leave empty `$$ $$` / `$ $` as-is
                continue;
            }
            try {
                const id = `F${idx++}`;
                const { png, exWidth, exHeight, exDepth } = await renderFormula(tex, { display, colorHex });
                const path = `${FORMULA_FS_DIR}/${id}.png`;
                pyodide.FS.writeFile(path, png);
                formulas[id] = { path, ex_w: exWidth, ex_h: exHeight, ex_depth: exDepth, display };
                out.push(marker(id));
            } catch (err) {
                // Mirror mermaid/SVG: a formula that won't rasterize must not
                // abort the whole (possibly batch) render. Leave it as raw TeX.
                console.warn("[formula] no se pudo rasterizar la fórmula, se deja como texto:", tex, err);
                onWarn?.({ kind: "formula", detail: tex, message: err instanceof Error ? err.message : String(err) });
                out.push(m[0]);
            }
        }
        let k = 0;
        return src.replace(re, () => out[k++]);
    };

    // Split off code regions (odd indices) so `$` inside them is never parsed
    // as math; transform only the prose spans (even indices) and rejoin.
    const parts = markdown.split(CODE_REGION_RE);
    for (let i = 0; i < parts.length; i += 2) {
        if (!parts[i].includes("$")) continue;
        let seg = await runPass(parts[i], BLOCK_FORMULA_RE, true, (id) => `\n\n⟦${id}⟧\n\n`);
        seg = await runPass(seg, INLINE_FORMULA_RE, false, (id) => `⟦${id}⟧`);
        parts[i] = seg.replace(/\\\$/g, "$"); // literal dollar escape
    }
    return { markdown: parts.join(""), formulas };
}

/**
 * Renders every ```mermaid``` block to a PNG (in the browser), stages it in
 * Pyodide's FS and rewrites the fence as a standalone image reference
 * (`![diagram](/abs/path.png)`) so the existing image pipeline draws it — no
 * Python changes needed. A block that fails to render is left as-is (the raw
 * mermaid code is shown as a code block). Mermaid is imported lazily so
 * documents without diagrams pay nothing.
 */
async function stageMermaid(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pyodide: any,
    markdown: string,
    colors: BrandColors,
    onWarn?: AssetWarn,
): Promise<string> {
    if (!/```[ \t]*mermaid/i.test(markdown)) return markdown;

    const { renderMermaid } = await import("./mermaid");
    const matches = [...markdown.matchAll(MERMAID_BLOCK_RE)];
    if (matches.length === 0) return markdown;

    pyodide.FS.mkdirTree(MERMAID_FS_DIR);
    const theme = brandMermaidTheme(colors);

    // Render in document order; collect a replacement per match (image ref on
    // success, original fence on failure) and substitute in a single pass.
    const replacements: string[] = [];
    let idx = 0;
    for (const m of matches) {
        const code = m[1].trim();
        if (!code) {
            replacements.push(m[0]);
            continue;
        }
        try {
            const { png } = await renderMermaid(code, theme);
            const id = `M${idx++}`;
            const path = `${MERMAID_FS_DIR}/${id}.png`;
            pyodide.FS.writeFile(path, png);
            replacements.push(`\n\n![diagram](${path})\n\n`);
        } catch (err) {
            console.warn("[mermaid] no se pudo renderizar el diagrama, se deja como código:", err);
            onWarn?.({ kind: "mermaid", detail: code, message: err instanceof Error ? err.message : String(err) });
            replacements.push(m[0]); // keep the raw block as a code fence
        }
    }
    let k = 0;
    return markdown.replace(MERMAID_BLOCK_RE, () => replacements[k++]);
}

/** Base64-encode bytes (chunked to avoid blowing the argument stack on big TTFs). */
function bytesToBase64(bytes: Uint8Array): string {
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
}

/**
 * Builds the `<style>` injected into rasterized SVGs: one `@font-face` per brand
 * TTF (embedded as base64 — an `<img>`-loaded SVG can't fetch external fonts) plus
 * an `!important` rule pinning the brand family on text elements, so the SVG's own
 * `font-family` (which may not match the brand) is overridden and the text always
 * rasterizes with the document's typography. Cached per brand+session — the TTFs
 * are several hundred KB each.
 */
const brandFontCss = new Map<string, string>();

async function brandSvgFontCss(brand: BrandManifest): Promise<string> {
    const cached = brandFontCss.get(brand.slug);
    if (cached) return cached;

    const family = brand.font_family;
    // variant key → (font-weight, font-style) so SVG bold/italic text picks the
    // matching face while the family is forced to the brand's.
    const variants: Array<[keyof BrandManifest["font_files"], number, string]> = [
        ["regular", 400, "normal"],
        ["bold", 700, "normal"],
        ["medium", 500, "normal"],
        ["light", 300, "normal"],
        ["italic", 400, "italic"],
    ];

    const faces: string[] = [];
    for (const [variant, weight, style] of variants) {
        const rel = brand.font_files[variant];
        if (!rel) continue;
        const bytes = await fetchBytes(brandAssetUrl(brand.slug, rel));
        const b64 = bytesToBase64(bytes);
        faces.push(
            `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};` +
                `src:url(data:font/ttf;base64,${b64}) format('truetype');}`,
        );
    }
    const css = `${faces.join("")}text,tspan,textPath{font-family:'${family}'!important;}`;
    brandFontCss.set(brand.slug, css);
    return css;
}

const brandHtmlFontCss = new Map<string, string>();

/**
 * `@font-face` rules embedding the brand TTFs as base64, for the standalone HTML
 * export (a shared file can't fetch the app's fonts). Same variants as
 * {@link brandSvgFontCss} but without the SVG-only `!important` family pin, so
 * regular HTML cascade applies. Cached per brand — the TTFs are hundreds of KB.
 */
export async function brandFontFaceCss(brand: BrandManifest): Promise<string> {
    const cached = brandHtmlFontCss.get(brand.slug);
    if (cached) return cached;

    const family = brand.font_family;
    const variants: Array<[keyof BrandManifest["font_files"], number, string]> = [
        ["regular", 400, "normal"],
        ["bold", 700, "normal"],
        ["medium", 500, "normal"],
        ["light", 300, "normal"],
        ["italic", 400, "italic"],
    ];

    const faces: string[] = [];
    for (const [variant, weight, style] of variants) {
        const rel = brand.font_files[variant];
        if (!rel) continue;
        const bytes = await fetchBytes(brandAssetUrl(brand.slug, rel));
        const b64 = bytesToBase64(bytes);
        faces.push(
            `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};` +
                `src:url(data:font/ttf;base64,${b64}) format('truetype');}`,
        );
    }
    const css = faces.join("");
    brandHtmlFontCss.set(brand.slug, css);
    return css;
}

/**
 * Mermaid theme derived from the active brand: maps the semantic palette onto
 * mermaid's `base` `themeVariables`. Colours only — the font is intentionally
 * left untouched (see `MermaidTheme`), so diagrams keep mermaid's default
 * typography and never clip. `colors` is the *effective* palette (after any
 * palette override), so themed diagrams track the selected palette.
 */
function brandMermaidTheme(colors: BrandColors): MermaidTheme {
    const text = colors.text ?? "#1A1A1A";
    const soft = colors.bg_soft ?? "#F4F7FA";
    const white = colors.white ?? "#FFFFFF";
    return {
        themeVariables: {
            // Nodes: light fill, dark border, dark text.
            primaryColor: colors.primary_light,
            primaryBorderColor: colors.primary_dark,
            primaryTextColor: text,
            mainBkg: colors.primary_light,
            nodeBorder: colors.primary_dark,
            secondaryColor: soft,
            secondaryBorderColor: colors.primary_mid,
            secondaryTextColor: text,
            tertiaryColor: white,
            tertiaryBorderColor: colors.primary_mid,
            tertiaryTextColor: text,
            // Edges / general text — a visible brand tone, not the faint divider line.
            lineColor: colors.primary_dark,
            textColor: text,
            titleColor: colors.primary_dark,
            edgeLabelBackground: white,
            // Subgraph clusters.
            clusterBkg: soft,
            clusterBorder: colors.primary_mid,
            // Sequence/state extras kept consistent with the palette.
            actorBkg: colors.primary_light,
            actorBorder: colors.primary_dark,
            actorTextColor: text,
            noteBkgColor: colors.quote_bg ?? soft,
            noteBorderColor: colors.primary_mid,
            labelBoxBkgColor: soft,
            labelBoxBorderColor: colors.primary_mid,
        },
    };
}

/** Resolve a markdown image `src` to an absolute Pyodide-FS path, mirroring the
 * Python `_resolve_image`: absolute paths as-is, otherwise against `basePath`. */
function resolveImagePath(src: string, basePath: string | null): string {
    const isAbs = src.startsWith("/");
    const joined = isAbs ? src : basePath ? `${basePath}/${src}` : src;
    return (joined.startsWith("/") ? "/" : "") + normalizePath(joined);
}

/**
 * Rasterizes every `![alt](*.svg)` reference to a PNG (in the browser, reusing
 * the document's brand fonts) and rewrites it to `![alt](/abs/path.png)` so the
 * existing image pipeline draws it — no Python changes needed. This mirrors
 * `stageMermaid`. The SVG bytes are read from Pyodide's FS, where local images
 * are staged in batch mode (`renderBatchZip`); remote/data refs and refs whose
 * bytes aren't in the FS are left untouched. A reference that fails to rasterize
 * is left as-is, so the Python renderer's `*[imagen no disponible]*` fallback
 * keeps the rest of the PDF intact. The rasterizer is imported lazily.
 */
async function stageSvgImages(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pyodide: any,
    markdown: string,
    basePath: string | null,
    brand: BrandManifest,
    onWarn?: AssetWarn,
): Promise<string> {
    if (!/\.svg\b/i.test(markdown)) return markdown;
    const matches = [...markdown.matchAll(IMAGE_REF_RE)];
    if (matches.length === 0) return markdown;

    const { rasterizeSvg } = await import("./svg-image");
    let fontCss: string | null = null;
    let madeDir = false;
    let idx = 0;

    // Build a replacement per image ref (rewritten PNG ref on success, original
    // ref otherwise) and substitute in a single pass, like stageMermaid.
    const replacements: string[] = [];
    for (const m of matches) {
        const full = m[0];
        const src = m[1].trim();
        const altMatch = /^!\[([^\]]*)\]/.exec(full);
        const alt = altMatch ? altMatch[1] : "";
        const bare = src.split(/[?#]/)[0];
        if (/^(https?:|data:)/i.test(src) || !/\.svg$/i.test(bare)) {
            replacements.push(full); // not a local SVG — leave it for the image pipeline
            continue;
        }

        const path = resolveImagePath(src, basePath);
        let bytes: Uint8Array;
        try {
            bytes = pyodide.FS.readFile(path); // binary by default
        } catch {
            console.warn(`[svg] no se encontró el SVG en el FS, se deja la ref: ${path}`);
            replacements.push(full);
            continue;
        }

        try {
            if (!fontCss) fontCss = await brandSvgFontCss(brand);
            const svgStr = new TextDecoder().decode(bytes);
            const png = await rasterizeSvg(svgStr, fontCss);
            if (!madeDir) {
                pyodide.FS.mkdirTree(SVG_FS_DIR);
                madeDir = true;
            }
            const id = `S${idx++}`;
            const pngPath = `${SVG_FS_DIR}/${id}.png`;
            pyodide.FS.writeFile(pngPath, png);
            replacements.push(`![${alt}](${pngPath})`);
        } catch (err) {
            console.warn("[svg] no se pudo rasterizar el SVG, se deja la ref original:", err);
            onWarn?.({ kind: "svg", detail: src, message: err instanceof Error ? err.message : String(err) });
            replacements.push(full);
        }
    }
    let k = 0;
    return markdown.replace(IMAGE_REF_RE, () => replacements[k++]);
}

interface RenderArgs {
    markdown: string;
    brand: BrandManifest;
    layout: LayoutOptions;
    /** When set, overrides the brand's primary_dark/light/mid colors (palette selection). */
    paletteColors?: PaletteColors;
    /** When set, overrides the brand's logo with a user-uploaded file. */
    customLogo?: File | null;
    /** When set, a co-branding logo drawn bottom-right in the footer (base layout only). */
    clientLogo?: ClientLogo | null;
    /** Pyodide-FS directory that relative image paths in the markdown resolve against. */
    basePath?: string | null;
    /** Called for each asset (formula/mermaid/SVG) that fails to rasterize; the
     * block is left as-is and the render continues. */
    onAssetWarning?: AssetWarn;
}

// `pyphen` powers optional word hyphenation. It is not a core renderer dep, so
// it's fetched from PyPI the first time a hyphenated render runs (cached after).
// Failure is non-fatal: the renderer just skips hyphenation.
let pyphenInstall: Promise<void> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePyphen(pyodide: any): Promise<void> {
    if (!pyphenInstall) {
        pyphenInstall = (async () => {
            const micropip = pyodide.pyimport("micropip");
            await micropip.install("pyphen");
        })();
    }
    try {
        await pyphenInstall;
    } catch (err) {
        pyphenInstall = null; // allow a later retry
        console.warn("No se pudo instalar pyphen; se renderiza sin partición de palabras.", err);
    }
}

export async function renderPdf({ markdown, brand, layout, paletteColors, customLogo, clientLogo, basePath, onAssetWarning }: RenderArgs): Promise<Uint8Array> {
    const pyodide = await getPyodide();
    if (layout.hyphenate) await ensurePyphen(pyodide);
    const fs = await stageBrandAssets(pyodide, brand);

    const effectiveColors = paletteColors
        ? { ...brand.colors, ...paletteColors }
        : brand.colors;

    const logoPath = customLogo
        ? await stageCustomLogo(pyodide, customLogo)
        : fs.logoPath;
    const clientLogoPath = clientLogo ? await stageClientLogo(pyodide, clientLogo) : null;

    const withDiagrams = await stageMermaid(pyodide, markdown, effectiveColors, onAssetWarning);
    const withSvg = await stageSvgImages(pyodide, withDiagrams, basePath ?? null, brand, onAssetWarning);
    const { markdown: processedMd, formulas } = await stageFormulas(
        pyodide, withSvg, effectiveColors.text ?? "#1A1A1A", onAssetWarning,
    );

    pyodide.globals.set("md_text", processedMd);
    pyodide.globals.set(
        "brand_json",
        JSON.stringify({ ...brand, colors: effectiveColors, _fs: { fonts_dir: fs.fontsDir, logo_path: logoPath, client_logo_path: clientLogoPath, has_mono: fs.hasMono } }),
    );
    pyodide.globals.set("layout_json", JSON.stringify(layout));
    pyodide.globals.set("base_path", basePath ?? null);
    pyodide.globals.set("formulas_json", JSON.stringify(formulas));

    const result = await pyodide.runPythonAsync(`
import dataclasses
import json
from pathlib import Path
from layout_studio_renderer import (
    BrandColors, BrandConfig, BrandFonts, LayoutOptions,
    render_markdown_to_pdf,
)

brand = json.loads(brand_json)
layout_dict = json.loads(layout_json)
formulas = json.loads(formulas_json)

# An autosaved session can predate a LayoutOptions field being dropped, so keep
# only what the engine still accepts instead of raising TypeError on the splat.
layout_dict = {
    k: v for k, v in layout_dict.items()
    if k in {f.name for f in dataclasses.fields(LayoutOptions)}
}
fs = brand["_fs"]

cfg = BrandConfig(
    name=brand["name"],
    colors=BrandColors(**brand["colors"]),
    fonts=BrandFonts(
        family=brand["font_family"],
        regular=Path(fs["fonts_dir"]) / "regular.ttf",
        bold=Path(fs["fonts_dir"]) / "bold.ttf",
        medium=Path(fs["fonts_dir"]) / "medium.ttf",
        light=Path(fs["fonts_dir"]) / "light.ttf",
        italic=Path(fs["fonts_dir"]) / "italic.ttf",
        mono=(Path(fs["fonts_dir"]) / "mono.ttf") if fs.get("has_mono") else None,
    ),
    logo_path=Path(fs["logo_path"]) if fs["logo_path"] else None,
    logo_fallback_text=brand.get("logo_fallback_text", ""),
    document_author=brand.get("document_author", ""),
    client_logo_path=Path(fs["client_logo_path"]) if fs.get("client_logo_path") else None,
)
opts = LayoutOptions(**layout_dict)
render_markdown_to_pdf(md_text, cfg, opts, Path(base_path) if base_path else None, formulas)
`);

    const bytes = result.toJs() as Uint8Array;
    result.destroy();
    return bytes;
}

export async function renderDocx({ markdown, brand, layout, paletteColors, customLogo, clientLogo, basePath, onAssetWarning }: RenderArgs): Promise<Uint8Array> {
    const pyodide = await getPyodide();
    await ensurePythonDocx();
    const fs = await stageBrandAssets(pyodide, brand);

    const effectiveColors = paletteColors
        ? { ...brand.colors, ...paletteColors }
        : brand.colors;

    const logoPath = customLogo
        ? await stageCustomLogo(pyodide, customLogo)
        : fs.logoPath;
    const clientLogoPath = clientLogo ? await stageClientLogo(pyodide, clientLogo) : null;

    const withDiagrams = await stageMermaid(pyodide, markdown, effectiveColors, onAssetWarning);
    const processedMd = await stageSvgImages(pyodide, withDiagrams, basePath ?? null, brand, onAssetWarning);

    pyodide.globals.set("md_text", processedMd);
    pyodide.globals.set(
        "brand_json",
        JSON.stringify({ ...brand, colors: effectiveColors, _fs: { fonts_dir: fs.fontsDir, logo_path: logoPath, client_logo_path: clientLogoPath, has_mono: fs.hasMono } }),
    );
    pyodide.globals.set("layout_json", JSON.stringify(layout));
    pyodide.globals.set("base_path", basePath ?? null);

    const result = await pyodide.runPythonAsync(`
import dataclasses
import json
from pathlib import Path
from layout_studio_renderer import (
    BrandColors, BrandConfig, BrandFonts, LayoutOptions,
    render_markdown_to_docx,
)

brand = json.loads(brand_json)
layout_dict = json.loads(layout_json)
fs = brand["_fs"]

# See the PDF path: tolerate autosaved sessions that predate a dropped field.
layout_dict = {
    k: v for k, v in layout_dict.items()
    if k in {f.name for f in dataclasses.fields(LayoutOptions)}
}

cfg = BrandConfig(
    name=brand["name"],
    colors=BrandColors(**brand["colors"]),
    fonts=BrandFonts(
        family=brand["font_family"],
        regular=Path(fs["fonts_dir"]) / "regular.ttf",
        bold=Path(fs["fonts_dir"]) / "bold.ttf",
        medium=Path(fs["fonts_dir"]) / "medium.ttf",
        light=Path(fs["fonts_dir"]) / "light.ttf",
        italic=Path(fs["fonts_dir"]) / "italic.ttf",
        mono=(Path(fs["fonts_dir"]) / "mono.ttf") if fs.get("has_mono") else None,
    ),
    logo_path=Path(fs["logo_path"]) if fs["logo_path"] else None,
    logo_fallback_text=brand.get("logo_fallback_text", ""),
    document_author=brand.get("document_author", ""),
    client_logo_path=Path(fs["client_logo_path"]) if fs.get("client_logo_path") else None,
)
opts = LayoutOptions(**layout_dict)
render_markdown_to_docx(md_text, cfg, opts, Path(base_path) if base_path else None)
`);

    const bytes = result.toJs() as Uint8Array;
    result.destroy();
    return bytes;
}

// ---------------------------------------------------------------------------
// Reading view: parse a document to structured blocks (same Python parser the
// PDF uses, so the HTML reading view never diverges from the book), resolving
// any FS-staged mermaid/formula PNGs to blob URLs the browser can show.
// ---------------------------------------------------------------------------

/** One parsed block. Shape mirrors `parser.py` (see its module docstring). */
export interface ReadingBlock {
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface ReadingDoc {
    /** Frontmatter (titulo resolved by `prepare_reading_content`). */
    meta: Record<string, unknown>;
    /** Content blocks with the cover title stripped and heading levels normalised. */
    blocks: ReadingBlock[];
    /** Formula id → blob URL of its rasterized PNG (for `{type:"formula"}` blocks). */
    formulaUrls: Record<string, string>;
}

interface ParseArgs {
    markdown: string;
    brand: BrandManifest;
    paletteColors?: PaletteColors;
}

/** Read a PNG staged in Pyodide's FS and hand back a browser blob URL. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fsPngToBlobUrl(pyodide: any, path: string): string | null {
    try {
        const bytes = pyodide.FS.readFile(path) as Uint8Array;
        return URL.createObjectURL(new Blob([bytes as BlobPart], { type: "image/png" }));
    } catch {
        return null;
    }
}

/**
 * Parse `markdown` into normalised content blocks — minus the cover title — for
 * the HTML reading view. Mermaid diagrams and `$…$` math are rasterized
 * (reusing the PDF pipeline) and exposed as blob URLs; FS-staged image sources
 * are rewritten to blob URLs in place.
 */
export async function parseReadingDoc({ markdown, brand, paletteColors }: ParseArgs): Promise<ReadingDoc> {
    const pyodide = await getPyodide();
    const effectiveColors = paletteColors ? { ...brand.colors, ...paletteColors } : brand.colors;

    const withDiagrams = await stageMermaid(pyodide, markdown, effectiveColors);
    const { markdown: processedMd, formulas } = await stageFormulas(
        pyodide, withDiagrams, effectiveColors.text ?? "#1A1A1A",
    );

    pyodide.globals.set("md_text", processedMd);
    const result = await pyodide.runPythonAsync(`
import json
from layout_studio_renderer.parser import parse_markdown, prepare_reading_content
from layout_studio_renderer.code_highlight import highlight as _highlight, READING_PALETTE

_meta, _blocks = parse_markdown(md_text)
_meta, _content = prepare_reading_content(_meta, _blocks)
# Tokenize fenced code with the Pygments lexer + Ayu Mirage palette so the
# web reading view's code highlighting is consistent.
for _b in _content:
    if _b.get("type") == "code":
        _chunks = _highlight(_b.get("text", "") or "", _b.get("lang", "") or "", "default", READING_PALETTE)
        _b["tokens"] = [[_c, bool(_bd), _t] for (_c, _bd, _t) in _chunks]
json.dumps({"meta": _meta, "blocks": _content})
`);
    const parsed = JSON.parse(result as string) as { meta: Record<string, unknown>; blocks: ReadingBlock[] };
    if (typeof (result as { destroy?: () => void }).destroy === "function") {
        (result as { destroy: () => void }).destroy();
    }

    // Resolve formula PNGs (staged in FORMULA_FS_DIR) to blob URLs.
    const formulaUrls: Record<string, string> = {};
    for (const [id, meta] of Object.entries(formulas)) {
        const url = fsPngToBlobUrl(pyodide, meta.path);
        if (url) formulaUrls[id] = url;
    }

    // Rewrite FS-staged image sources (mermaid PNGs, batch-staged images) to
    // blob URLs. Remote/data URLs and unstaged relative paths are left as-is.
    for (const blk of parsed.blocks) {
        if (blk.type === "image" && typeof blk.src === "string" && blk.src.startsWith("/")) {
            const url = fsPngToBlobUrl(pyodide, blk.src);
            if (url) blk.src = url;
        }
    }

    return { meta: parsed.meta, blocks: parsed.blocks, formulaUrls };
}

/**
 * Revoke every blob URL owned by a `ReadingDoc` (rasterized formula PNGs and
 * FS-staged image sources rewritten in {@link parseReadingDoc}). Call this when
 * replacing a doc with a newer one, when discarding a stale-token result, and on
 * unmount — otherwise the debounced re-parse leaks a blob URL per edit.
 */
export function revokeReadingDoc(doc: ReadingDoc | null | undefined): void {
    if (!doc) return;
    for (const url of Object.values(doc.formulaUrls)) {
        if (typeof url === "string" && url.startsWith("blob:")) URL.revokeObjectURL(url);
    }
    for (const blk of doc.blocks) {
        if (blk.type === "image" && typeof blk.src === "string" && blk.src.startsWith("blob:")) {
            URL.revokeObjectURL(blk.src);
        }
    }
}

// ---------------------------------------------------------------------------
// Batch mode: render every .md in a folder, pack the PDFs into a zip with
// the same relative structure.
// ---------------------------------------------------------------------------

export interface BatchInputFile {
    /** Relative path from the chosen folder root, e.g. "unidad-1/caso-02.md". */
    relativePath: string;
    file: File;
}

export interface BatchProgress {
    done: number;
    total: number;
    current: string;
}

/** An {@link AssetWarning} tagged with the batch file it occurred in. */
export interface BatchWarning extends AssetWarning {
    /** Relative path of the .md whose render produced the warning. */
    file: string;
}

/** Result of a batch render: the ZIP bytes plus any non-fatal asset warnings. */
export interface BatchResult {
    zip: Uint8Array;
    warnings: BatchWarning[];
}

interface BatchArgs {
    files: BatchInputFile[];
    brand: BrandManifest;
    layout: LayoutOptions;
    paletteColors?: PaletteColors;
    customLogo?: File | null;
    clientLogo?: ClientLogo | null;
    format?: "pdf" | "docx";
    onProgress?: (p: BatchProgress) => void;
}

export async function renderBatchZip({
    files,
    brand,
    layout,
    paletteColors,
    customLogo,
    clientLogo,
    format = "pdf",
    onProgress,
}: BatchArgs): Promise<BatchResult> {
    if (files.length === 0) throw new Error("No hay ficheros .md que procesar");

    // Warm up Pyodide + stage assets once so per-file calls only do the render.
    const pyodide = await getPyodide();
    await stageBrandAssets(pyodide, brand);

    // Index every input file by its normalized path within the dragged folder
    // so an .md can locate sibling images by relative reference.
    const filesByPath = new Map<string, File>(
        files.map((f) => [normalizePath(f.relativePath), f.file]),
    );

    // Only .md files are rendered; images are inputs staged on demand below.
    const mdFiles = files.filter((f) => f.relativePath.toLowerCase().endsWith(".md"));

    const zip = new JSZip();
    const warnings: BatchWarning[] = [];
    let done = 0;

    for (const entry of mdFiles) {
        onProgress?.({ done, total: mdFiles.length, current: entry.relativePath });
        const markdown = await entry.file.text();
        const onAssetWarning: AssetWarn = (w) => warnings.push({ ...w, file: entry.relativePath });

        // Stage local images referenced by this .md into Pyodide's FS, under a
        // path that mirrors their location in the folder, so Python can read
        // them relative to the .md's directory (DOC_FS_ROOT/<mdDir>).
        const mdDir = dirOf(normalizePath(entry.relativePath));
        for (const m of markdown.matchAll(IMAGE_REF_RE)) {
            const src = m[1].trim();
            if (/^(https?:|data:)/i.test(src)) continue;
            const fromRoot = normalizePath(mdDir ? `${mdDir}/${src}` : src);
            const imgFile = filesByPath.get(fromRoot);
            if (!imgFile) continue;
            const fsPath = `${DOC_FS_ROOT}/${fromRoot}`;
            pyodide.FS.mkdirTree(dirOf(fsPath));
            pyodide.FS.writeFile(fsPath, new Uint8Array(await imgFile.arrayBuffer()));
        }
        const basePath = mdDir ? `${DOC_FS_ROOT}/${mdDir}` : DOC_FS_ROOT;

        const rendered = format === "docx"
            ? await renderDocx({ markdown, brand, layout, paletteColors, customLogo, clientLogo, basePath, onAssetWarning })
            : await renderPdf({ markdown, brand, layout, paletteColors, customLogo, clientLogo, basePath, onAssetWarning });
        const outPath = entry.relativePath.replace(/\.md$/i, format === "docx" ? ".docx" : ".pdf");
        zip.file(outPath, rendered);
        done += 1;

        // Free this document's staged assets before the next one so a large
        // folder doesn't grow Pyodide's FS without bound (OOM near the end).
        cleanDocAssets(pyodide);
    }
    onProgress?.({ done, total: mdFiles.length, current: "" });

    const bytes = await zip.generateAsync({ type: "uint8array" });
    return { zip: bytes, warnings };
}
