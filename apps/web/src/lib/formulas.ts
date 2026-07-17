/**
 * TeX → PNG rasterizer, used to embed math formulas in the PDF.
 *
 * The Python renderer (Pyodide) only draws text and images, so formulas are
 * rasterized here, in the browser, with MathJax's SVG output and a `<canvas>`,
 * then staged into Pyodide's FS like any other image (see `render.ts`).
 *
 * MathJax is heavy, so this module is meant to be imported lazily (dynamic
 * `import()`) and only when a document actually contains `$`-delimited math.
 *
 * We import the `mathjax-full` source modules directly (not the prebuilt
 * `tex-svg` component) so Vite/Rollup can tree-shake to just the tex input +
 * svg output graph.
 */

import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";

import { svgToPng } from "./svg-raster";

/**
 * Pixels rendered per MathJax `ex` unit. The PNG is intentionally rasterized
 * at high resolution; the Python renderer scales it down to a size derived
 * from `body_size`, so this only governs crispness (oversampling), not the
 * on-page size. ~6× the eventual ~11pt line height.
 */
const PX_PER_EX = 32;

export interface RenderedFormula {
    /** PNG bytes, ready to write into Pyodide's FS. */
    png: Uint8Array;
    /** Intrinsic width in MathJax `ex` units (for on-page sizing in Python). */
    exWidth: number;
    /** Intrinsic height in MathJax `ex` units. */
    exHeight: number;
    /** Depth below the baseline in `ex` (the SVG's vertical-align). Phase 2: inline baseline. */
    exDepth: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MathDocument = any;

let mathDoc: MathDocument | null = null;
let adaptor: ReturnType<typeof liteAdaptor> | null = null;

function getMathDoc(): { doc: MathDocument; adaptor: ReturnType<typeof liteAdaptor> } {
    if (mathDoc && adaptor) return { doc: mathDoc, adaptor };
    adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    const tex = new TeX({ packages: AllPackages });
    const svg = new SVG({ fontCache: "local" });
    mathDoc = mathjax.document("", { InputJax: tex, OutputJax: svg });
    return { doc: mathDoc, adaptor };
}

/** Parse a MathJax dimension attribute like "12.345ex" into its numeric value. */
function exValue(raw: string | null): number {
    if (!raw) return 0;
    const n = parseFloat(raw.replace("ex", "").trim());
    return Number.isFinite(n) ? n : 0;
}

/** Extract the "-N.NNNex" vertical-align (depth) from the SVG root style. */
function exDepthFromStyle(style: string | null): number {
    if (!style) return 0;
    const m = /vertical-align:\s*(-?[\d.]+)ex/.exec(style);
    return m ? Math.abs(parseFloat(m[1])) : 0;
}

/**
 * Render a TeX string to a colored PNG. `display: true` produces display-style
 * math (larger operators, centered fractions); `false` is inline style.
 */
export async function renderFormula(
    tex: string,
    { display, colorHex }: { display: boolean; colorHex: string },
): Promise<RenderedFormula> {
    const { doc, adaptor } = getMathDoc();
    const node = doc.convert(tex, { display });
    // The conversion wraps the <svg> in an <mjx-container>; take the child.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svgEl = adaptor.firstChild(node) as any;

    const exWidth = exValue(adaptor.getAttribute(svgEl, "width"));
    const exHeight = exValue(adaptor.getAttribute(svgEl, "height"));
    const exDepth = exDepthFromStyle(adaptor.getAttribute(svgEl, "style"));

    // Pin explicit px dimensions so the rasterized <img> has an intrinsic size,
    // and inject the brand text color (MathJax glyphs use `currentColor`).
    const pxW = Math.max(1, Math.ceil(exWidth * PX_PER_EX));
    const pxH = Math.max(1, Math.ceil(exHeight * PX_PER_EX));
    adaptor.setAttribute(svgEl, "width", String(pxW));
    adaptor.setAttribute(svgEl, "height", String(pxH));
    const prevStyle = adaptor.getAttribute(svgEl, "style") ?? "";
    adaptor.setAttribute(svgEl, "style", `${prevStyle};color:${colorHex}`);

    const svgStr = adaptor.outerHTML(svgEl);
    const png = await svgToPng(svgStr, pxW, pxH, { errorLabel: "la fórmula" });
    return { png, exWidth, exHeight, exDepth };
}
