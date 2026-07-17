import { useEffect, useState } from "react";

import { loadBrandManifest } from "../lib/brands";
import { type PyodideStatus, subscribePyodideStatus } from "../lib/pyodide";
import {
    type BatchInputFile,
    type BatchProgress,
    type BatchWarning,
    type ClientLogo,
    renderBatchZip,
    renderDocx,
    renderPdf,
} from "../lib/render";
import { renderReadingHtml } from "../lib/htmlExport";
import type { BrandColors, LayoutOptions } from "../lib/types";

type PaletteColors = Partial<BrandColors>;

type RenderMode = "single" | "batch";
export type ExportFormat = "pdf" | "docx" | "html";

interface Props {
    disabled: boolean;
    /** Reason shown on the button when it is disabled (e.g. missing input). */
    blockedReason?: string;
    mode: RenderMode;
    /** Output format, controlled by the parent (shared across modes). */
    format: ExportFormat;
    brand: string | null;
    markdown: string;
    batchFiles: BatchInputFile[];
    layout: LayoutOptions;
    paletteColors?: PaletteColors;
    customLogo?: File | null;
    clientLogo?: ClientLogo | null;
    /** When set (single PDF mode), the rendered PDF is shown via this callback
     *  (inline preview) instead of being downloaded. */
    onResult?: (bytes: Uint8Array) => void;
}

/** Above this many documents in one batch, ask for confirmation — not a hard
 * cap, just a seatbelt against accidentally launching a very long/heavy run. */
const BATCH_CONFIRM_THRESHOLD = 500;

function downloadBlob(bytes: Uint8Array, name: string, mime: string) {
    const blob = new Blob([bytes as BlobPart], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function RenderButton({
    disabled,
    blockedReason,
    mode,
    format,
    brand,
    markdown,
    batchFiles,
    layout,
    paletteColors,
    customLogo,
    clientLogo,
    onResult,
}: Props) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<BatchProgress | null>(null);
    const [warnings, setWarnings] = useState<BatchWarning[]>([]);
    const [pyodideReady, setPyodideReady] = useState(false);

    useEffect(
        () =>
            subscribePyodideStatus((s: PyodideStatus) => {
                setPyodideReady(s.state === "ready");
            }),
        [],
    );

    const onClick = async () => {
        if (!brand) return;
        if (mode === "batch") {
            const mdCount = batchFiles.filter((f) =>
                f.relativePath.toLowerCase().endsWith(".md"),
            ).length;
            if (
                mdCount > BATCH_CONFIRM_THRESHOLD &&
                !window.confirm(
                    `Vas a procesar ${mdCount} documentos. Puede tardar bastante y consumir mucha memoria del navegador. ¿Continuar?`,
                )
            ) {
                return;
            }
        }
        setBusy(true);
        setError(null);
        setProgress(null);
        setWarnings([]);
        try {
            const manifest = await loadBrandManifest(brand);
            if (mode === "single") {
                if (format === "html") {
                    const html = await renderReadingHtml({ markdown, brand: manifest, paletteColors });
                    downloadBlob(html, `${brand}-document.html`, "text/html;charset=utf-8");
                } else if (format === "docx") {
                    const docx = await renderDocx({ markdown, brand: manifest, layout, paletteColors, customLogo, clientLogo });
                    downloadBlob(docx, `${brand}-document.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
                } else {
                    const pdf = await renderPdf({ markdown, brand: manifest, layout, paletteColors, customLogo, clientLogo });
                    if (onResult) {
                        onResult(pdf);
                    } else {
                        downloadBlob(pdf, `${brand}-document.pdf`, "application/pdf");
                    }
                }
            } else {
                if (format === "html") {
                    throw new Error("La exportación HTML aún no está disponible en modo lote; procesa el documento de forma individual.");
                }
                const { zip, warnings: batchWarnings } = await renderBatchZip({
                    files: batchFiles,
                    brand: manifest,
                    layout,
                    paletteColors,
                    customLogo,
                    clientLogo,
                    format,
                    onProgress: setProgress,
                });
                downloadBlob(zip, `${brand}-batch.zip`, "application/zip");
                setWarnings(batchWarnings);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
            setProgress(null);
        }
    };

    const blocked = disabled || busy || !pyodideReady;
    const formatLabel = format === "docx" ? "Word" : format === "html" ? "HTML" : "PDF";
    const label = (() => {
        if (busy && mode === "batch" && progress) {
            return `Procesando ${progress.done}/${progress.total}…`;
        }
        if (busy) return "Generando…";
        if (!pyodideReady) return "Esperando motor…";
        if (disabled && blockedReason) return blockedReason;
        if (mode === "batch") return `Generar ZIP · ${formatLabel}`;
        return `Generar ${formatLabel}`;
    })();

    return (
        <div>
            <button
                type="button"
                disabled={blocked}
                onClick={onClick}
                className="group relative w-full overflow-hidden rounded-lg bg-[#2f6d78] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-brand-mint/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-brand-line disabled:text-brand-ink-mute disabled:shadow-none"
            >
                <span className="relative">{label}</span>
                <span className="absolute inset-y-0 right-0 w-1 bg-brand-mint opacity-0 transition group-hover:opacity-100 group-disabled:!opacity-0" />
            </button>
            {progress && progress.total > 0 ? (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-line">
                    <div
                        className="h-full rounded-full bg-brand-mid transition-[width] duration-200 ease-out"
                        style={{
                            width: `${Math.round(
                                (progress.done / progress.total) * 100,
                            )}%`,
                        }}
                    />
                </div>
            ) : null}
            {error ? (
                <p className="mt-2 text-xs text-brand-coral">{error}</p>
            ) : null}
            {warnings.length > 0 ? <WarningReport warnings={warnings} /> : null}
        </div>
    );
}

const KIND_LABEL: Record<BatchWarning["kind"], string> = {
    formula: "fórmula",
    mermaid: "diagrama mermaid",
    svg: "imagen SVG",
};

/** Truncate a source snippet so the report stays readable. */
function snippet(s: string): string {
    const oneLine = s.replace(/\s+/g, " ").trim();
    return oneLine.length > 60 ? `${oneLine.slice(0, 57)}…` : oneLine;
}

/** Post-render summary of assets that couldn't be rasterized. The ZIP was still
 * generated (the blocks are left as raw text/code); this tells the user what to
 * review. */
function WarningReport({ warnings }: { warnings: BatchWarning[] }) {
    return (
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            <p className="font-medium">
                ZIP generado, pero {warnings.length} elemento{warnings.length === 1 ? "" : "s"} no se pud
                {warnings.length === 1 ? "o" : "ieron"} renderizar (se dejaron como texto):
            </p>
            <ul className="mt-1.5 max-h-40 space-y-1 overflow-auto font-mono text-[11px] leading-relaxed">
                {warnings.map((w, i) => (
                    <li key={i}>
                        <span className="text-amber-700">{w.file}</span> · {KIND_LABEL[w.kind]}:{" "}
                        <code className="rounded bg-amber-100 px-1">{snippet(w.detail)}</code>
                        {w.message ? <span className="text-amber-700"> — {snippet(w.message)}</span> : null}
                    </li>
                ))}
            </ul>
            {warnings.some((w) => w.kind === "mermaid") ? (
                <p className="mt-2 text-[11px] text-amber-700">
                    Pista mermaid: las etiquetas con caracteres especiales (<code className="rounded bg-amber-100 px-1">@ {"{ } ( ) : ,"}</code>)
                    deben ir entre comillas dobles, p. ej. <code className="rounded bg-amber-100 px-1">A["texto (x)"]</code>.
                </p>
            ) : null}
        </div>
    );
}
