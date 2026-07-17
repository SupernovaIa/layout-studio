import { useEffect, useState } from "react";
import { type PyodideStatus, subscribePyodideStatus } from "../lib/pyodide";

/**
 * Engine-load status as a floating toast. Positioned `fixed` (out of document
 * flow) on purpose: appearing/disappearing must never shift the page layout.
 */
export function PyodideStatusBar() {
    const [status, setStatus] = useState<PyodideStatus>({ state: "idle" });
    useEffect(() => subscribePyodideStatus(setStatus), []);

    if (status.state === "ready" || status.state === "idle") return null;

    const base =
        "fixed left-1/2 top-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-brand-card px-4 py-3 text-sm shadow-xl";

    if (status.state === "error") {
        return (
            <div role="status" className={`${base} border-brand-coral/40 text-brand-coral`}>
                Error: {status.message}
            </div>
        );
    }

    const pct = Math.round(status.progress * 100);
    return (
        <div role="status" aria-live="polite" className={`${base} border-brand-mint/50 text-brand-ink`}>
            <div className="mb-2 flex items-center justify-between">
                <span>Cargando motor…</span>
                <span className="tabular-nums text-brand-ink-soft">{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-mint/20">
                <div
                    className="h-full rounded-full bg-brand-mid transition-[width] duration-300 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
