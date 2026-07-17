/**
 * Light/dark theme mode. The actual class is applied before first paint by an
 * inline script in index.html (no flash); this module keeps React in sync and
 * persists the user's choice.
 */

export type ThemeMode = "light" | "dark";

const KEY = "layout-studio:theme";

export function systemMode(): ThemeMode {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Current mode from the applied class (source of truth after the inline script). */
export function currentMode(): ThemeMode {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyMode(mode: ThemeMode): void {
    document.documentElement.classList.toggle("dark", mode === "dark");
    try {
        localStorage.setItem(KEY, mode);
    } catch {
        /* ignore */
    }
}
