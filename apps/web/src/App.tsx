import { useCallback, useEffect, useRef, useState } from "react";

import { BrandEditor } from "./components/BrandEditor";
import { BrandSelector } from "./components/BrandSelector";
import { ClientLogoSelector } from "./components/ClientLogoSelector";
import { ContrastPanel } from "./components/ContrastPanel";
import { InputPanel } from "./components/InputPanel";
import { LayoutControls } from "./components/LayoutControls";
import { LogoUpload } from "./components/LogoUpload";
import { PaletteSelector } from "./components/PaletteSelector";
import { PdfPreview } from "./components/PdfPreview";
import { PyodideStatusBar } from "./components/PyodideStatus";
import { RenderButton } from "./components/RenderButton";
import { ThemeToggle } from "./components/ThemeToggle";
import { loadBrandCatalog, loadBrandManifest, loadBrandPalettes, loadPalettesFromCatalog } from "./lib/brands";
import { getPyodide, subscribePyodideStatus, type PyodideStatus } from "./lib/pyodide";
import { renderPdf, type BatchInputFile, type ClientLogo } from "./lib/render";
import { clearSession, loadSession, type PersistedSession } from "./lib/session";
import { DEFAULT_LAYOUT, type BrandColors, type BrandPalette, type LayoutOptions } from "./lib/types";
import { useAutosave, type SaveState } from "./lib/useAutosave";
import type { ExportFormat } from "./components/RenderButton";

export default function App() {
    // Read the autosaved draft once, before any effect runs.
    const [initial] = useState(() => loadSession());

    const [brandSlugs, setBrandSlugs] = useState<string[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [brandPalettes, setBrandPalettes] = useState<BrandPalette[]>([]);
    const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(null);
    const [brandColors, setBrandColors] = useState<BrandColors | null>(null);
    const [customColors, setCustomColors] = useState<BrandColors | null>(initial?.customColors ?? null);
    const [markdown, setMarkdown] = useState(initial?.markdown ?? "");
    const [batchFiles, setBatchFiles] = useState<BatchInputFile[]>([]);
    const [format, setFormat] = useState<ExportFormat>(initial?.format ?? "pdf");
    const [layout, setLayout] = useState<LayoutOptions>(DEFAULT_LAYOUT);
    const [customLogo, setCustomLogo] = useState<File | null>(null);
    const [clientLogo, setClientLogo] = useState<ClientLogo | null>(null);
    const [catalogError, setCatalogError] = useState<string | null>(null);

    // Restored draft awaiting the brand-derived state (layout + palette). Consumed
    // once, on the initial brand load; later brand switches reset to defaults.
    const restoredRef = useRef<PersistedSession | null>(initial);
    // Gates autosave until the initial brand-derived state has settled, so we
    // don't overwrite the saved draft with transient defaults during load.
    const [hydrated, setHydrated] = useState(false);

    // --- Inline PDF preview state ---
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewBusy, setPreviewBusy] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [livePreview, setLivePreview] = useState(false);
    const [pyodideReady, setPyodideReady] = useState(false);

    const urlRef = useRef<string | null>(null);
    const tokenRef = useRef(0);
    const chainRef = useRef<Promise<void>>(Promise.resolve());

    useEffect(() => {
        loadBrandCatalog()
            .then((slugs) => {
                setBrandSlugs(slugs);
                if (slugs.length > 0) {
                    const saved = restoredRef.current?.selectedBrand;
                    const initialBrand =
                        saved && slugs.includes(saved)
                            ? saved
                            : slugs.includes("mimarca")
                              ? "mimarca"
                              : slugs[0];
                    setSelectedBrand(initialBrand);
                } else {
                    setHydrated(true); // no brand → nothing brand-derived to restore
                }
            })
            .catch((err: Error) => {
                setCatalogError(err.message);
                setHydrated(true);
            });

        void getPyodide().catch(() => {});
        return subscribePyodideStatus((s: PyodideStatus) => setPyodideReady(s.state === "ready"));
    }, []);

    // Clear custom logo when leaving the "personalizada" brand.
    useEffect(() => {
        if (selectedBrand !== "personalizada") setCustomLogo(null);
    }, [selectedBrand]);

    // Drop the client logo if the user switches the main brand to that same brand.
    useEffect(() => {
        setClientLogo((cur) => (cur?.kind === "brand" && cur.slug === selectedBrand ? null : cur));
    }, [selectedBrand]);

    // Clear stale PDF preview when switching to batch mode.
    useEffect(() => { if (batchFiles.length > 0) setPreviewUrl(null); }, [batchFiles]);

    // Load palettes + layout defaults whenever the selected brand changes.
    useEffect(() => {
        if (!selectedBrand) {
            setBrandPalettes([]);
            setSelectedPaletteId(null);
            setBrandColors(null);
            setCustomColors(null);
            return;
        }
        void loadBrandManifest(selectedBrand)
            .then(async (manifest) => {
                setBrandColors(manifest.colors);
                // When this brand comes from a restored draft, its saved layout and
                // palette win over the brand's defaults (consumed once). Otherwise
                // apply the brand's layout defaults (e.g. Prometeo's editorial book
                // layout: 60pt margins, 11/18 body, editorial mode on).
                const pending =
                    restoredRef.current?.selectedBrand === selectedBrand ? restoredRef.current : null;

                setLayout(pending?.layout ?? { ...DEFAULT_LAYOUT, ...(manifest.layout_defaults ?? {}) });
                // Restore a custom color override for this brand, else clear it
                // (switching brand drops any override from the previous one).
                setCustomColors(pending?.customColors ?? null);

                let palettes: BrandPalette[] = [];
                if (manifest.palettes_source === "catalog") {
                    palettes = await loadPalettesFromCatalog(selectedBrand);
                } else if (manifest.has_palettes) {
                    palettes = await loadBrandPalettes(selectedBrand);
                }
                setBrandPalettes(palettes);

                const defaultPaletteId = palettes.length > 0 ? palettes[0].id : null;
                setSelectedPaletteId(
                    pending && palettes.some((p) => p.id === pending.selectedPaletteId)
                        ? pending.selectedPaletteId
                        : defaultPaletteId,
                );

                restoredRef.current = null; // consume: later brand switches reset to defaults
                setHydrated(true);
            })
            .catch((err: Error) => {
                setCatalogError(err.message);
                restoredRef.current = null;
                setHydrated(true);
            });
    }, [selectedBrand]);

    // Autosave the editing session (Markdown + brand/palette/format/layout).
    const saveState = useAutosave(
        { markdown, selectedBrand, selectedPaletteId, format, layout, customColors },
        hydrated,
    );

    // Discard the saved draft and start fresh (files reset; brand/layout stay).
    const handleDiscard = useCallback(() => {
        clearSession();
        setMarkdown("");
        setBatchFiles([]);
    }, []);

    const isBatch = batchFiles.length > 0;
    const hasContent = isBatch || markdown.trim().length > 0;
    const canRender = selectedBrand !== null && hasContent;
    const canSingle = selectedBrand !== null && markdown.trim().length > 0;

    const selectedPalette = brandPalettes.find((p) => p.id === selectedPaletteId) ?? null;
    const paletteColors = selectedPalette?.colors ?? undefined;
    // Color override sent to the renderer: a custom edit wins over the selected
    // palette. When neither is set, the renderer uses the brand's own colors.
    const overrideColors = customColors ?? paletteColors;
    // The color set actually in effect — drives the editor + contrast panel.
    const effectiveColors = overrideColors ?? brandColors;

    // Publish a freshly rendered PDF into the inline viewer (revoking the old blob).
    const showPdf = useCallback((bytes: Uint8Array) => {
        const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setPreviewUrl(url);
    }, []);

    // Render into the preview. Coalesced + stale-guarded so rapid edits only
    // keep the latest result; renders are serialized (Pyodide is single-runtime).
    const renderToPreview = useCallback(() => {
        if (!selectedBrand || !markdown.trim() || !pyodideReady) return;
        const myToken = ++tokenRef.current;
        chainRef.current = chainRef.current.then(async () => {
            if (myToken !== tokenRef.current) return; // a newer edit superseded us
            setPreviewBusy(true);
            setPreviewError(null);
            try {
                const manifest = await loadBrandManifest(selectedBrand);
                const pdf = await renderPdf({ markdown, brand: manifest, layout, paletteColors: overrideColors, customLogo, clientLogo });
                if (myToken === tokenRef.current) showPdf(pdf);
            } catch (err) {
                if (myToken === tokenRef.current) {
                    setPreviewError(err instanceof Error ? err.message : String(err));
                }
            } finally {
                if (myToken === tokenRef.current) setPreviewBusy(false);
            }
        });
    }, [selectedBrand, markdown, layout, overrideColors, customLogo, clientLogo, pyodideReady, showPdf]);

    // Live preview: debounce re-renders on any change to the inputs.
    useEffect(() => {
        if (!livePreview || !canSingle || !pyodideReady) return;
        const t = setTimeout(renderToPreview, 700);
        return () => clearTimeout(t);
    }, [livePreview, canSingle, pyodideReady, renderToPreview]);


    return (
        <div className="relative min-h-full">
            <div className="aurora" aria-hidden />
            <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
                <Header
                    saveState={saveState}
                    hasDraft={markdown.trim().length > 0}
                    onDiscard={handleDiscard}
                />

                <PyodideStatusBar />

                {catalogError ? (
                    <div className="mb-6 rounded-lg border border-brand-coral/30 bg-brand-coral/5 px-4 py-3 text-sm text-brand-coral">
                        {catalogError}
                    </div>
                ) : null}

                <div className="grid items-stretch gap-8 lg:grid-cols-[2fr_1fr]">
                    <section className="flex flex-col gap-3">
                        <InputPanel
                            className="flex-1"
                            markdown={markdown}
                            onMarkdownChange={setMarkdown}
                            files={batchFiles}
                            onFilesChange={setBatchFiles}
                        />
                        <RenderButton
                            mode={isBatch ? "batch" : "single"}
                            format={format}
                            disabled={!canRender}
                            blockedReason={!selectedBrand ? "Elige una marca" : !hasContent ? "Añade contenido" : undefined}
                            brand={selectedBrand}
                            markdown={markdown}
                            batchFiles={batchFiles}
                            layout={layout}
                            paletteColors={overrideColors}
                            customLogo={customLogo}
                            clientLogo={clientLogo}
                            onResult={format === "pdf" ? showPdf : undefined}
                        />
                        {!isBatch && (
                            <button
                                type="button"
                                onClick={() => setLivePreview((v) => !v)}
                                className="text-xs text-brand-ink-soft underline decoration-brand-line underline-offset-2 transition hover:text-brand-ink"
                            >
                                {livePreview ? "Desactivar vista previa en vivo" : "Activar vista previa en vivo"}
                            </button>
                        )}
                    </section>

                    <aside className="space-y-6">
                        <BrandSelector
                            slugs={brandSlugs}
                            selected={selectedBrand}
                            onSelect={setSelectedBrand}
                        />
                        {selectedBrand === "personalizada" && (
                            <LogoUpload value={customLogo} onChange={setCustomLogo} />
                        )}
                        {!layout.editorial && (
                            <ClientLogoSelector
                                slugs={brandSlugs}
                                excludeSlug={selectedBrand}
                                value={clientLogo}
                                onChange={setClientLogo}
                            />
                        )}
                        <LayoutControls
                            value={layout}
                            onChange={setLayout}
                            format={format}
                            onFormatChange={setFormat}
                            showEditorial={selectedBrand === "prometeo"}
                        />
                        {effectiveColors && (
                            <details className="group/adv overflow-hidden rounded-xl border border-brand-line bg-brand-card backdrop-blur-xl shadow-sm">
                                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 transition hover:bg-brand-bg/40">
                                    <span className="flex items-center gap-2 font-display text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-mid">
                                        <svg
                                            aria-hidden
                                            className="h-3 w-3 transition group-open/adv:rotate-90"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" />
                                        </svg>
                                        Colores y contraste
                                    </span>
                                    <span className="text-[11px] font-normal normal-case tracking-normal text-brand-ink-mute">
                                        avanzado
                                    </span>
                                </summary>
                                <div className="divide-y divide-brand-line border-t border-brand-line">
                                    {brandPalettes.length > 0 && (
                                        <div className="px-5 py-5">
                                            <PaletteSelector
                                                bare
                                                palettes={brandPalettes}
                                                selectedPaletteId={selectedPaletteId}
                                                onPaletteChange={setSelectedPaletteId}
                                            />
                                        </div>
                                    )}
                                    <div className="px-5 py-5">
                                        <BrandEditor
                                            bare
                                            colors={effectiveColors}
                                            custom={customColors !== null}
                                            onChange={setCustomColors}
                                            onReset={() => setCustomColors(null)}
                                        />
                                    </div>
                                    <div className="px-5 py-5">
                                        <ContrastPanel bare colors={effectiveColors} />
                                    </div>
                                </div>
                            </details>
                        )}
                    </aside>
                </div>

                {(previewUrl || livePreview) && (
                    <div className="mt-8">
                        <PdfPreview
                            url={previewUrl}
                            busy={previewBusy}
                            error={previewError}
                        />
                    </div>
                )}

                <Footer />
            </div>
        </div>
    );
}

function Header({
    saveState,
    hasDraft,
    onDiscard,
}: {
    saveState: SaveState;
    hasDraft: boolean;
    onDiscard: () => void;
}) {
    return (
        <header className="mb-10 flex items-center gap-4">
            <div>
                <div className="font-display text-[10px] font-semibold uppercase font-mono tracking-[0.22em] text-brand-mid">
                    Mi Marca
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink">
                    layout-studio
                </h1>
            </div>
            <div className="ml-auto flex items-center gap-3">
                <SaveIndicator state={saveState} hasDraft={hasDraft} onDiscard={onDiscard} />
                <ThemeToggle />
            </div>
        </header>
    );
}

function SaveIndicator({
    state,
    hasDraft,
    onDiscard,
}: {
    state: SaveState;
    hasDraft: boolean;
    onDiscard: () => void;
}) {
    // Nothing to show on a pristine, empty session.
    if (state === "idle" && !hasDraft) return null;

    const label =
        state === "saving"
            ? "Guardando…"
            : state === "saved"
              ? "Borrador guardado ✓"
              : "Borrador guardado";

    return (
        <div className="flex items-center gap-2 text-[11px]">
            <span
                className={`tabular-nums transition-colors ${
                    state === "saved" ? "text-brand-mid" : "text-brand-ink-mute"
                }`}
            >
                {label}
            </span>
            {hasDraft && (
                <button
                    type="button"
                    onClick={onDiscard}
                    className="text-brand-ink-mute underline decoration-brand-line underline-offset-2 transition hover:text-brand-coral"
                >
                    Descartar
                </button>
            )}
        </div>
    );
}

function Footer() {
    return (
        <footer className="mt-16 border-t border-brand-line pt-6 text-xs text-brand-ink-mute">
            <p>
                Motor Python ejecutándose en cliente vía Pyodide (WebAssembly).
                El catálogo de marcas se sirve como ficheros estáticos.
            </p>
        </footer>
    );
}
