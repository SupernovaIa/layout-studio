import { useEffect, useRef, useState } from "react";

import { brandAssetUrl, brandDisplayName, loadBrandManifest } from "../lib/brands";
import type { ClientLogo } from "../lib/render";
import type { BrandManifest } from "../lib/types";

interface Props {
    /** All catalog slugs; brands without a logo are filtered out internally. */
    slugs: string[];
    /** The document's main brand — excluded from the options (no self co-branding). */
    excludeSlug: string | null;
    value: ClientLogo | null;
    onChange: (logo: ClientLogo | null) => void;
}

const ACCEPTED = ".png,.jpg,.jpeg,.webp,.svg";

interface LogoOption {
    slug: string;
    name: string;
    logoUrl: string;
}

async function loadOption(slug: string): Promise<LogoOption | null> {
    try {
        const m: BrandManifest = await loadBrandManifest(slug);
        if (!m.logo_file) return null;
        return { slug, name: m.name, logoUrl: brandAssetUrl(slug, m.logo_file) };
    } catch {
        return null;
    }
}

/**
 * Picker for the co-branding (client) logo: one of the catalog brands' logos
 * or an uploaded file. Drawn bottom-right in the page footer (base layout only).
 * Collapsed behind a "Logo adicional" toggle until the user opts in.
 */
export function ClientLogoSelector({ slugs, excludeSlug, value, onChange }: Props) {
    const [options, setOptions] = useState<LogoOption[]>([]);
    const [enabled, setEnabled] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all(slugs.map(loadOption)).then((arr) => {
            if (!cancelled) setOptions(arr.filter((o): o is LogoOption => o !== null));
        });
        return () => {
            cancelled = true;
        };
    }, [slugs]);

    const visible = options.filter((o) => o.slug !== excludeSlug);
    const customFile = value?.kind === "custom" ? value.file : null;
    const customPreviewUrl = customFile ? URL.createObjectURL(customFile) : null;

    const toggle = () => {
        if (enabled) onChange(null); // collapsing discards the selection
        setEnabled(!enabled);
    };

    return (
        <div className="rounded-xl border border-brand-line bg-brand-card backdrop-blur-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-mid">
                    Logo adicional
                </h2>
                <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={toggle}
                    className={`relative h-4 w-7 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-mint/40 ${
                        enabled ? "bg-brand-mint" : "bg-brand-line"
                    }`}
                >
                    <span
                        className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-[left] ${
                            enabled ? "left-3.5" : "left-0.5"
                        }`}
                    />
                </button>
            </div>

            {enabled && (
                <>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                        {visible.map((o) => {
                            const isSel = value?.kind === "brand" && value.slug === o.slug;
                            return (
                                <button
                                    key={o.slug}
                                    type="button"
                                    title={brandDisplayName(o.name)}
                                    onClick={() => onChange(isSel ? null : { kind: "brand", slug: o.slug })}
                                    className={`flex h-14 items-center justify-center rounded-lg border-2 p-2 transition focus:outline-none focus:ring-2 focus:ring-brand-mint/40 ${
                                        isSel
                                            ? "border-brand-mint bg-brand-mint/10"
                                            : "border-brand-line bg-brand-logo hover:border-brand-line-strong hover:bg-brand-bg"
                                    }`}
                                >
                                    <img src={o.logoUrl} alt={brandDisplayName(o.name)} className="max-h-full max-w-full object-contain" />
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            title={customFile ? customFile.name : "Subir un logo"}
                            onClick={() => inputRef.current?.click()}
                            className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed p-2 transition focus:outline-none focus:ring-2 focus:ring-brand-mint/40 ${
                                customFile
                                    ? "border-brand-mint bg-brand-mint/10"
                                    : "border-brand-line bg-brand-bg hover:border-brand-mint hover:bg-brand-mint/5"
                            }`}
                        >
                            {customFile && customPreviewUrl ? (
                                <img src={customPreviewUrl} alt={customFile.name} className="max-h-full max-w-full object-contain" />
                            ) : (
                                <>
                                    <svg className="h-4 w-4 text-brand-ink-mute" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                                    </svg>
                                    <span className="text-[10px] text-brand-ink-mute">Subir</span>
                                </>
                            )}
                        </button>
                    </div>

                    <p className="mt-2.5 text-[11px] leading-relaxed text-brand-ink-mute">
                        Aparece abajo a la derecha en el pie de cada página.
                    </p>
                </>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onChange({ kind: "custom", file });
                    e.target.value = "";
                }}
            />
        </div>
    );
}
