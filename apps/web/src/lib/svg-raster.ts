/**
 * Shared SVG → PNG rasterization helpers used by the in-browser rasterizers
 * (formulas, mermaid, SVG images). The Python renderer only draws raster, so
 * every vector source is turned into a PNG here via an offscreen `<canvas>` and
 * staged into Pyodide's FS (see `render.ts`).
 *
 * Consolidated from per-module copies that had drifted: `svgToPng` was
 * triplicated and `svgSize`/`pinSvgSize` duplicated.
 */

/** Read intrinsic width/height (px) from an SVG string's `viewBox` or, failing
 * that, its `width`/`height` attributes. Accepts single- or double-quoted
 * attribute values (both valid XML). Falls back to 800×600. */
export function svgSize(svgStr: string): { w: number; h: number } {
    const m = /viewBox\s*=\s*["']([\d.\s-]+)["']/.exec(svgStr);
    if (m) {
        const parts = m[1].trim().split(/\s+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
            return { w: parts[2], h: parts[3] };
        }
    }
    const wm = /\bwidth\s*=\s*["']([\d.]+)["']/.exec(svgStr);
    const hm = /\bheight\s*=\s*["']([\d.]+)["']/.exec(svgStr);
    return { w: wm ? parseFloat(wm[1]) : 800, h: hm ? parseFloat(hm[1]) : 600 };
}

/** Matches the root `<svg …>` opening tag. The attribute group tolerates `>`
 * inside quoted attribute values (e.g. `title="a > b"`) by consuming quoted
 * strings whole, so the match doesn't stop at the first `>` inside a value. */
const SVG_OPEN_TAG_RE = /<svg((?:[^>"']|"[^"]*"|'[^']*')*)>/;

/** Strip a named attribute (single- or double-quoted value) from an attr string. */
function stripAttr(attrs: string, name: string): string {
    return attrs.replace(new RegExp(`\\s${name}\\s*=\\s*("[^"]*"|'[^']*')`, "i"), "");
}

/**
 * Force explicit px width/height on the root `<svg>` (so the rasterized `<img>`
 * has an intrinsic size) and a white background (so the PNG isn't transparent),
 * optionally injecting a `<style>` block as the first child (used to embed brand
 * fonts). Returns the SVG unchanged if no `<svg>` tag is found, so callers can
 * fall back.
 */
export function pinSvgSize(svgStr: string, pxW: number, pxH: number, styleTag = ""): string {
    const out = svgStr.replace(SVG_OPEN_TAG_RE, (_match, attrs: string) => {
        const cleaned = stripAttr(stripAttr(stripAttr(attrs, "width"), "height"), "style");
        return `<svg${cleaned} width="${pxW}" height="${pxH}" style="background:#ffffff">${styleTag}`;
    });
    return out === svgStr ? svgStr : out;
}

/**
 * Rasterize an SVG string to PNG bytes via an offscreen canvas. `errorLabel`
 * names the source in thrown errors (e.g. "el diagrama mermaid"); `background`,
 * when set, paints a backdrop before drawing (formulas stay transparent; mermaid
 * and SVG images use white). Throws if the SVG can't be loaded as an image, so
 * the caller can fall back.
 */
export async function svgToPng(
    svgStr: string,
    pxW: number,
    pxH: number,
    { errorLabel, background }: { errorLabel: string; background?: string },
): Promise<Uint8Array> {
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
        const img = new Image();
        img.width = pxW;
        img.height = pxH;
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`No se pudo rasterizar ${errorLabel}`));
            img.src = url;
        });

        const canvas = document.createElement("canvas");
        canvas.width = pxW;
        canvas.height = pxH;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D no disponible");
        if (background) {
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, pxW, pxH);
        }
        ctx.drawImage(img, 0, 0, pxW, pxH);

        const pngBlob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), "image/png"),
        );
        if (!pngBlob) throw new Error(`No se pudo exportar ${errorLabel} a PNG`);
        return new Uint8Array(await pngBlob.arrayBuffer());
    } finally {
        URL.revokeObjectURL(url);
    }
}
