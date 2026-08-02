import { brandDisplayName } from "../lib/brands";
import type { BrandPalette } from "../lib/types";

interface Props {
    palettes: BrandPalette[];
    selectedPaletteId?: string | null;
    onPaletteChange?: (id: string) => void;
    /** Render without the card chrome (border/background/padding). */
    bare?: boolean;
}

/** Predefined color schemes for the active brand, as swatch buttons. */
export function PaletteSelector({
    palettes,
    selectedPaletteId,
    onPaletteChange,
    bare = false,
}: Props) {
    if (palettes.length === 0) return null;

    return (
        <div className={bare ? "" : "rounded-xl border border-brand-line bg-brand-card backdrop-blur-xl p-5 shadow-sm"}>
            <p className="mb-2 text-[10px] font-semibold uppercase font-mono tracking-[0.18em] text-brand-mid">
                Paleta
            </p>
            <div className="flex flex-wrap gap-2">
                {palettes.map((p) => {
                    const isSelected = p.id === selectedPaletteId;
                    return (
                        <button
                            key={p.id}
                            type="button"
                            title={brandDisplayName(p.name)}
                            onClick={() => onPaletteChange?.(p.id)}
                            style={{ backgroundColor: p.swatch ?? p.colors.primary_mid }}
                            className={[
                                "h-6 w-6 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-1",
                                isSelected
                                    ? "scale-110 ring-2 ring-brand-accent ring-offset-1"
                                    : "opacity-70 hover:opacity-100",
                            ].join(" ")}
                            aria-pressed={isSelected}
                            aria-label={p.name}
                        />
                    );
                })}
            </div>
            {selectedPaletteId && (
                <p className="mt-1.5 text-[10px] text-brand-ink-soft">
                    {brandDisplayName(
                        palettes.find((p) => p.id === selectedPaletteId)?.name ?? "",
                    )}
                </p>
            )}
        </div>
    );
}
