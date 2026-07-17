import { useEffect, useState } from "react";

import { brandAssetUrl, brandDisplayName, loadBrandManifest } from "../lib/brands";
import type { BrandManifest } from "../lib/types";

interface Props {
    slugs: string[];
    selected: string | null;
    onSelect: (slug: string) => void;
}

interface BrandThumb {
    slug: string;
    name: string;
    iconUrl: string | null;
}

async function loadThumb(slug: string): Promise<BrandThumb> {
    try {
        const m: BrandManifest = await loadBrandManifest(slug);
        const iconRel = m.icon_file ?? m.logo_file ?? null;
        return {
            slug,
            name: m.name,
            iconUrl: iconRel ? brandAssetUrl(slug, iconRel) : null,
        };
    } catch {
        return { slug, name: slug, iconUrl: null };
    }
}

export function BrandSelector({ slugs, selected, onSelect }: Props) {
    const [thumbs, setThumbs] = useState<Record<string, BrandThumb>>({});

    useEffect(() => {
        let cancelled = false;
        Promise.all(slugs.map(loadThumb)).then((arr) => {
            if (cancelled) return;
            const map: Record<string, BrandThumb> = {};
            for (const t of arr) map[t.slug] = t;
            setThumbs(map);
        });
        return () => {
            cancelled = true;
        };
    }, [slugs]);

    return (
        <div className="rounded-xl border border-brand-line bg-brand-card backdrop-blur-xl p-5 shadow-sm">
            <div className="flex items-baseline justify-between">
                <h2 className="font-display text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-mid">
                    Marca
                </h2>
                <p className="text-[11px] text-brand-ink-mute">
                    {slugs.length === 0
                        ? "vacío"
                        : `${slugs.length} disponible${slugs.length === 1 ? "" : "s"}`}
                </p>
            </div>

            {slugs.length === 0 ? (
                <p className="mt-3 text-xs text-brand-ink-mute">Sin marcas cargadas.</p>
            ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                    {slugs.map((slug) => {
                        const t = thumbs[slug];
                        const isSel = slug === selected;
                        return (
                            <button
                                key={slug}
                                type="button"
                                title={t ? brandDisplayName(t.name) : slug}
                                onClick={() => onSelect(slug)}
                                className={`group flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 text-center transition focus:outline-none focus:ring-2 focus:ring-brand-mint/40 ${
                                    isSel
                                        ? "border-brand-mint bg-brand-mint/10"
                                        : "border-brand-line hover:border-brand-line-strong hover:bg-brand-bg/60"
                                }`}
                            >
                                <BrandThumbIcon thumb={t} />
                                <span
                                    className={`w-full truncate text-[10px] leading-tight ${
                                        isSel
                                            ? "font-semibold text-brand-ink"
                                            : "text-brand-ink-soft"
                                    }`}
                                >
                                    {t ? brandDisplayName(t.name).split(/\s+/)[0] : slug}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/** Logo on a light chip so dark logos stay visible on any theme; the chip is
 *  softened in dark mode (via --brand-logo) so it doesn't glare. */
function BrandThumbIcon({ thumb }: { thumb: BrandThumb | null | undefined }) {
    return (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-logo">
            {thumb?.iconUrl ? (
                <img src={thumb.iconUrl} alt="" className="h-8 w-8 object-contain" />
            ) : (
                <span className="text-[10px] font-semibold text-[#5f767e]">
                    {(thumb?.slug ?? "·").slice(0, 2).toUpperCase()}
                </span>
            )}
        </span>
    );
}
