/**
 * HTML export: turn a Markdown document into a self-contained `.html` file that
 * looks like the reading view but needs no server, no app and no network.
 *
 * It reuses the exact same pipeline as the on-screen reading view — the Python
 * parser (`parseReadingDoc`) and the `ReadingView` component (serialized once
 * with `renderToStaticMarkup`) — so the exported file can never drift from what
 * the app shows. Everything is inlined: brand fonts as base64 `@font-face`,
 * formula/diagram/image PNGs as `data:` URIs, and the component CSS in <head>.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ReadingView, READING_CSS } from "../components/ReadingView";
import { brandFontFaceCss, parseReadingDoc, revokeReadingDoc, type ReadingDoc } from "./render";
import type { BrandColors, BrandManifest } from "./types";

type PaletteColors = Partial<BrandColors>;

interface Args {
    markdown: string;
    brand: BrandManifest;
    paletteColors?: PaletteColors;
    /** Embed the brand TTFs (true, on-brand but heavier) or fall back to system fonts. */
    embedFonts?: boolean;
}

/** Read a `blob:` URL back as a `data:` URI so it survives in a standalone file. */
async function blobUrlToDataUri(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = () => reject(fr.error ?? new Error("FileReader failed"));
        fr.readAsDataURL(blob);
    });
}

/** Rewrite every `blob:` URL in a doc (formula PNGs + image sources) to a data URI. */
async function inlineBlobUrls(doc: ReadingDoc): Promise<void> {
    for (const [id, url] of Object.entries(doc.formulaUrls)) {
        if (url.startsWith("blob:")) doc.formulaUrls[id] = await blobUrlToDataUri(url);
    }
    for (const blk of doc.blocks) {
        if (blk.type === "image" && typeof blk.src === "string" && blk.src.startsWith("blob:")) {
            blk.src = await blobUrlToDataUri(blk.src);
        }
    }
}

const escapeHtml = (s: string): string =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrapDocument(body: string, title: string, fontCss: string): string {
    const lang = "es";
    return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="layout-studio">
<title>${escapeHtml(title)}</title>
<style>
${fontCss}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:#fff;padding:32px 20px}
.rv-export{max-width:1180px;margin:0 auto}
${READING_CSS}
</style>
</head>
<body>
<div class="rv-export">
${body}
</div>
</body>
</html>
`;
}

/**
 * Render `markdown` to a standalone HTML document (as UTF-8 bytes, ready to
 * download). Blob URLs from {@link parseReadingDoc} are revoked before returning.
 */
export async function renderReadingHtml({
    markdown,
    brand,
    paletteColors,
    embedFonts = true,
}: Args): Promise<Uint8Array> {
    const doc = await parseReadingDoc({ markdown, brand, paletteColors });
    try {
        await inlineBlobUrls(doc);

        const colors: BrandColors = { ...brand.colors, ...(paletteColors ?? {}) };
        const title = typeof doc.meta.titulo === "string" && doc.meta.titulo.trim()
            ? doc.meta.titulo.trim()
            : "Documento";

        const body = renderToStaticMarkup(
            createElement(ReadingView, {
                doc,
                colors,
                fontFamily: embedFonts ? brand.font_family : undefined,
                title,
                staticExport: true,
            }),
        );

        const fontCss = embedFonts ? await brandFontFaceCss(brand) : "";
        const html = wrapDocument(body, title, fontCss);
        return new TextEncoder().encode(html);
    } finally {
        revokeReadingDoc(doc);
    }
}
