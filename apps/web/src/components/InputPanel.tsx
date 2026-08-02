import { useCallback, useRef, useState } from "react";

import type { BatchInputFile } from "../lib/render";

interface Props {
    markdown: string;
    onMarkdownChange: (md: string) => void;
    files: BatchInputFile[];
    onFilesChange: (files: BatchInputFile[]) => void;
    className?: string;
}

interface FileWithRelativePath extends File {
    webkitRelativePath: string;
}

function hasRelativePath(f: File): f is FileWithRelativePath {
    return typeof (f as FileWithRelativePath).webkitRelativePath === "string";
}

/** Markdown plus the image formats supported as inputs: the raster formats
 * ReportLab embeds directly, plus `.svg` (rasterized to PNG in the browser by
 * the SVG pipeline before it reaches the renderer). */
const BATCH_EXTS = [".md", ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg"];

function isBatchFile(name: string): boolean {
    const lower = name.toLowerCase();
    return BATCH_EXTS.some((ext) => lower.endsWith(ext));
}

function isMarkdown(name: string): boolean {
    return name.toLowerCase().endsWith(".md");
}

function pickBatchFiles(list: FileList | File[]): BatchInputFile[] {
    const out: BatchInputFile[] = [];
    for (const f of Array.from(list)) {
        if (!isBatchFile(f.name)) continue;
        const rel =
            hasRelativePath(f) && f.webkitRelativePath
                ? f.webkitRelativePath
                : f.name;
        out.push({ relativePath: rel, file: f });
    }
    out.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    return out;
}

export function InputPanel({
    markdown,
    onMarkdownChange,
    files,
    onFilesChange,
    className = "",
}: Props) {
    const folderInputRef = useRef<HTMLInputElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [dragging, setDragging] = useState(false);

    const hasBatch = files.length > 0;

    // Validate that there's at least one .md, then hand off as a batch → ZIP.
    // Used by the folder picker, where the user's intent is explicitly "lote".
    const ingestBatch = useCallback(
        (list: FileList | File[]) => {
            const picked = pickBatchFiles(list);
            if (!picked.some((f) => isMarkdown(f.relativePath))) {
                alert("Arrastra ficheros .md o una carpeta que los contenga.");
                return;
            }
            onFilesChange(picked);
        },
        [onFilesChange],
    );

    // Drag-drop and "Abrir .md" are "this document" gestures: a single .md
    // (no images) loads into the editor for a one-off PDF. Anything else
    // (multiple files, images) falls back to a batch → ZIP.
    const ingest = useCallback(
        async (list: FileList | File[]) => {
            const picked = pickBatchFiles(list);
            if (!picked.some((f) => isMarkdown(f.relativePath))) {
                alert("Arrastra ficheros .md o una carpeta que los contenga.");
                return;
            }
            if (picked.length === 1 && isMarkdown(picked[0].relativePath)) {
                onFilesChange([]);
                onMarkdownChange(await picked[0].file.text());
                return;
            }
            onFilesChange(picked);
        },
        [onFilesChange, onMarkdownChange],
    );

    const onDrop = useCallback(
        async (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length > 0) await ingest(e.dataTransfer.files);
        },
        [ingest],
    );

    return (
        <div className={`flex flex-col ${className}`}>
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex flex-1 flex-col rounded-xl border-2 ${
                    dragging
                        ? "border-brand-accent bg-brand-accent/5"
                        : "border-dashed border-brand-line bg-brand-card backdrop-blur-xl"
                } p-5 shadow-sm transition`}
            >
                {/* Drop zone — the primary affordance. */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1">
                        <h2 className="font-display text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-mid">
                            Arrastra y suelta
                        </h2>
                        <p className="mt-1 text-xs text-brand-ink-mute">
                            Un <code className="rounded bg-brand-bg px-1 font-mono text-[11px]">.md</code> para un PDF, o una carpeta de <code className="rounded bg-brand-bg px-1 font-mono text-[11px]">.md</code> (con sus imágenes) para un ZIP.
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <button
                            type="button"
                            onClick={() => folderInputRef.current?.click()}
                            className="rounded-lg border border-brand-line bg-brand-bg px-3 py-1.5 text-xs font-medium text-brand-ink shadow-sm transition hover:border-brand-line-strong hover:bg-brand-bg"
                        >
                            Elegir carpeta
                        </button>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-lg border border-brand-line bg-brand-bg px-3 py-1.5 text-xs font-medium text-brand-ink shadow-sm transition hover:border-brand-line-strong hover:bg-brand-bg"
                        >
                            Abrir .md
                        </button>
                    </div>
                    <input
                        ref={folderInputRef}
                        type="file"
                        multiple
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error -- webkitdirectory is a real attribute, missing from React types.
                        webkitdirectory=""
                        directory=""
                        hidden
                        onChange={(e) => {
                            if (e.target.files) ingestBatch(e.target.files);
                            e.target.value = "";
                        }}
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".md"
                        hidden
                        onChange={(e) => {
                            if (e.target.files) void ingest(e.target.files);
                            e.target.value = "";
                        }}
                    />
                </div>

                {hasBatch ? (
                    /* Batch: a folder/multiple files was dropped → show the list. */
                    <div className="mt-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-brand-ink-soft">
                                {files.length} fichero{files.length === 1 ? "" : "s"} listo{files.length === 1 ? "" : "s"} → ZIP
                            </p>
                            <button
                                type="button"
                                onClick={() => onFilesChange([])}
                                className="text-[11px] font-medium text-brand-mid hover:text-brand-ink"
                            >
                                Quitar
                            </button>
                        </div>
                        <ul className="mt-2 max-h-[55vh] overflow-auto rounded-lg border border-brand-line bg-brand-bg/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-brand-ink">
                            {files.map((f) => (
                                <li key={f.relativePath}>{f.relativePath}</li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    /* Single doc: divider + editable textarea. */
                    <>
                        <div className="my-4 flex items-center gap-3">
                            <span className="h-px flex-1 bg-brand-line" />
                            <span className="text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-ink-mute">
                                o escribe
                            </span>
                            <span className="h-px flex-1 bg-brand-line" />
                        </div>
                        <div className="mb-2 flex items-center justify-between">
                            <LatexHelp />
                            <span className="text-[11px] text-brand-ink-mute">
                                {markdown.length.toLocaleString("es")} caracteres
                            </span>
                        </div>
                        <textarea
                            value={markdown}
                            onChange={(e) => onMarkdownChange(e.target.value)}
                            placeholder="---&#10;titulo: Mi documento&#10;eyebrow: CASO PRÁCTICO 01&#10;---&#10;&#10;# Hola"
                            spellCheck={false}
                            className="block min-h-[240px] w-full grow resize-y rounded-lg border border-brand-line bg-brand-bg/60 px-3 py-2.5 font-mono text-xs leading-relaxed text-brand-ink shadow-inner focus:border-brand-accent focus:bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                        />
                    </>
                )}
            </div>
        </div>
    );
}

function LatexHelp() {
    return (
        <details className="group">
            <summary className="cursor-pointer list-none text-[11px] font-medium text-brand-mid hover:text-brand-ink">
                <span className="inline-flex items-center gap-1">
                    <svg aria-hidden className="h-3 w-3 transition group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" />
                    </svg>
                    Fórmulas LaTeX
                </span>
            </summary>
            <div className="mt-1.5 space-y-1 rounded-lg border border-brand-line bg-brand-bg/50 px-3 py-2 text-[11px] leading-relaxed text-brand-ink-soft">
                <p>
                    Inline: <code className="rounded bg-brand-bg px-1 font-mono">$E=mc^2$</code> (sin espacios pegados a los <code className="rounded bg-brand-bg px-1 font-mono">$</code>).
                </p>
                <p>
                    Bloque: <code className="rounded bg-brand-bg px-1 font-mono">$$\frac{"{a}"}{"{b}"}$$</code> en su propia línea.
                </p>
                <p>
                    Dólar literal: <code className="rounded bg-brand-bg px-1 font-mono">\$</code>. Los precios como <code className="rounded bg-brand-bg px-1 font-mono">$10</code> seguidos de dígito no se interpretan como fórmula.
                </p>
                <p>
                    En tablas, escapa la barra vertical dentro de la fórmula: <code className="rounded bg-brand-bg px-1 font-mono">$\|r\|$</code>. No se renderizan fórmulas en encabezados.
                </p>
            </div>
        </details>
    );
}
