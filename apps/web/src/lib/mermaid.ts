/**
 * Mermaid → PNG rasterizer, used to embed diagrams in the PDF/DOCX.
 *
 * The Python renderer (Pyodide) only draws text and images, so ```mermaid```
 * fenced blocks are rendered here, in the browser, with mermaid's SVG output
 * and a `<canvas>`, then staged into Pyodide's FS like any other image (see
 * `render.ts`). This mirrors the formula pipeline in `formulas.ts`.
 *
 * Mermaid is heavy (~MBs), so this module is meant to be imported lazily
 * (dynamic `import()`) and only when a document actually contains a
 * ```mermaid``` block.
 *
 * We disable `htmlLabels` so labels become SVG `<text>`/`<tspan>` nodes instead
 * of `<foreignObject>` HTML, which browsers refuse to rasterize onto a canvas
 * (the canvas gets tainted/blank). This keeps `<br/>` line breaks working.
 */

import { pinSvgSize, svgSize, svgToPng } from "./svg-raster";

/** Oversampling factor over the diagram's intrinsic size, for crispness. The
 * Python renderer scales the PNG down to the content column, so this only
 * governs sharpness, not on-page size. */
const SCALE = 3;

export interface RenderedMermaid {
    /** PNG bytes, ready to write into Pyodide's FS. */
    png: Uint8Array;
}

/** Brand theming for mermaid, built in `render.ts` from the active palette. */
export interface MermaidTheme {
    /** `themeVariables` for mermaid's `base` theme — colours only.
     *
     * Deliberately NO `fontFamily`: mermaid sizes node boxes by measuring the
     * label text, so swapping the font afterwards (theme or injected
     * `@font-face`) makes the glyphs no longer fit and the text clips. The 62
     * deliverable flowcharts keep mermaid's default font; hero diagrams that
     * need Poppins are authored as hand-made SVGs (which DO get the brand font,
     * see `svg-image.ts`). */
    themeVariables: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mermaidMod: any = null;
let idSeq = 0;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getMermaid(): Promise<any> {
    if (mermaidMod) return mermaidMod;
    const { default: mermaid } = await import("mermaid");
    mermaidMod = mermaid;
    return mermaid;
}

/**
 * (Re)apply mermaid's global config. `htmlLabels` MUST be set at the top level
 * (not only under `flowchart`): the per-diagram option alone still emits
 * `<foreignObject>` for subgraph titles, and a `<foreignObject>` with HTML makes
 * the SVG invalid XML, so it won't load as an `<img>` for canvas rasterization.
 * Top-level false forces plain SVG `<text>`/`<tspan>` labels everywhere. When a
 * `theme` is given, the `base` theme is themed with the brand palette/font.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function configure(mermaid: any, theme?: MermaidTheme): void {
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        htmlLabels: false,
        flowchart: { htmlLabels: false },
        ...(theme ? { theme: "base", themeVariables: theme.themeVariables } : {}),
    });
}

/** Escape a literal string for use inside a `RegExp`. */
function escapeRe(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Node-shape delimiter pairs, longest/nested first so e.g. `((…))` is matched
 * before `(…)` and we never corrupt a nested shape by quoting half of it. */
const MERMAID_SHAPES: Array<[open: string, close: string]> = [
    ["[[", "]]"], ["[(", ")]"], ["([", "])"], ["((", "))"], ["{{", "}}"],
    ["[", "]"], ["(", ")"], ["{", "}"],
];

/** Chars that make Mermaid require quotes around a node/edge label. */
const NEEDS_QUOTING = /[(){}:,@]/;

/**
 * Best-effort: wrap node-shape and edge labels that contain special characters
 * in double quotes (`A[x (y)]` → `A["x (y)"]`, `B -->|a:b| C` → `B -->|"a:b"| C`).
 * This is heuristic — it only runs as a retry after Mermaid has already failed
 * to parse `code`, and the retry's output is itself validated by re-rendering,
 * so a bad guess just falls back to showing the raw block. Labels already
 * quoted (content starting with `"`) and plain labels are left untouched.
 */
function autoQuoteLabels(code: string): string {
    let out = code;
    for (const [open, close] of MERMAID_SHAPES) {
        // Content runs up to the first char of the close delimiter; excluding `"`
        // means an already-quoted label can't match (so we never double-quote).
        const contentClass = `[^"${escapeRe(close[0])}]`;
        const re = new RegExp(`${escapeRe(open)}(${contentClass}+?)${escapeRe(close)}`, "g");
        out = out.replace(re, (m, content: string) =>
            NEEDS_QUOTING.test(content) ? `${open}"${content}"${close}` : m,
        );
    }
    // Edge labels: `|text|`.
    out = out.replace(/\|([^"|]*[(){}:,@][^"|]*)\|/g, (_m, c: string) => `|"${c}"|`);
    return out;
}

/**
 * Render a mermaid source string to a PNG. Throws if mermaid fails to parse the
 * diagram so the caller can fall back to showing the raw code block. On a parse
 * failure it first retries once with {@link autoQuoteLabels} applied, recovering
 * the common "special chars in an unquoted label" case automatically.
 */
export async function renderMermaid(code: string, theme?: MermaidTheme): Promise<RenderedMermaid> {
    const mermaid = await getMermaid();
    configure(mermaid, theme);
    let svg: string;
    try {
        ({ svg } = await mermaid.render(`mmd-${idSeq++}`, code));
    } catch (err) {
        const fixed = autoQuoteLabels(code);
        if (fixed === code) throw err; // nothing to retry → real syntax error
        ({ svg } = await mermaid.render(`mmd-${idSeq++}`, fixed)); // may throw → caller falls back
        console.info("[mermaid] diagrama recuperado auto-entrecomillando etiquetas con caracteres especiales");
    }

    const { w, h } = svgSize(svg);
    const pxW = Math.max(1, Math.ceil(w * SCALE));
    const pxH = Math.max(1, Math.ceil(h * SCALE));
    const sized = pinSvgSize(svg, pxW, pxH);

    const png = await svgToPng(sized, pxW, pxH, {
        errorLabel: "el diagrama mermaid",
        background: "#ffffff",
    });
    return { png };
}
