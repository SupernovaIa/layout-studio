/**
 * SVG image → PNG rasterizer, used to embed `![alt](foo.svg)` references in the
 * PDF/DOCX.
 *
 * The Python renderer (Pyodide/ReportLab) only draws raster images, so SVGs
 * referenced from the markdown are rasterized here, in the browser, with the
 * browser's own SVG engine and a `<canvas>`, then staged into Pyodide's FS like
 * any other image (see `render.ts`). This mirrors the mermaid pipeline in
 * `mermaid.ts`; the canvas/size plumbing lives in `svg-raster.ts`.
 *
 * Fidelity caveat: an SVG loaded through an `<img>` for canvas rasterization is
 * isolated — it does NOT fetch external fonts referenced via `@import`/`<link>`
 * (e.g. Poppins from Google Fonts), so its text would fall back to a default
 * face. The caller injects `@font-face` declarations with the brand TTFs
 * embedded as base64 (plus an `!important` rule pinning the brand family on
 * text), so the text always rasterizes with the document's typography.
 *
 * This module is imported lazily (dynamic `import()`) and only when a document
 * actually references an `.svg`, matching mermaid/formulas.
 */

import { pinSvgSize, svgSize, svgToPng } from "./svg-raster";

/** Oversampling factor over the SVG's intrinsic size, for crispness. The Python
 * renderer scales the PNG down to the content column, so this only governs
 * sharpness, not on-page size. Same criterion as mermaid's `SCALE`. */
const SCALE = 3;

/**
 * Rasterize an SVG source string to a PNG. `styleCss` is injected into the SVG
 * (brand `@font-face` + family override). Throws if the SVG can't be loaded as
 * an image so the caller can fall back to the original (broken) reference.
 */
export async function rasterizeSvg(svgStr: string, styleCss: string): Promise<Uint8Array> {
    const { w, h } = svgSize(svgStr);
    const pxW = Math.max(1, Math.ceil(w * SCALE));
    const pxH = Math.max(1, Math.ceil(h * SCALE));
    const styleTag = styleCss ? `<style>${styleCss}</style>` : "";
    const prepared = pinSvgSize(svgStr, pxW, pxH, styleTag);
    return svgToPng(prepared, pxW, pxH, { errorLabel: "el SVG", background: "#ffffff" });
}
