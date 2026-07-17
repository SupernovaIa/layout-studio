import { useState } from "react";

import { applyMode, currentMode, type ThemeMode } from "../lib/theme-mode";

/** Sun/moon button that flips the light/dark theme and persists it. */
export function ThemeToggle() {
    const [mode, setMode] = useState<ThemeMode>(currentMode);

    const toggle = () => {
        const next: ThemeMode = mode === "dark" ? "light" : "dark";
        applyMode(next);
        setMode(next);
    };

    const isDark = mode === "dark";
    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={isDark ? "Modo claro" : "Modo oscuro"}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-line text-brand-ink-soft transition hover:border-brand-line-strong hover:text-brand-ink"
        >
            {isDark ? (
                // Sun
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
            ) : (
                // Moon
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
            )}
        </button>
    );
}
