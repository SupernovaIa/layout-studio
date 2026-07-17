/**
 * Autosaved editing session (localStorage).
 *
 * Persists only the slice of app state worth surviving a reload: the Markdown
 * draft plus the brand / palette / format / layout choices. Uploaded files
 * (custom logo, batch inputs) and derived state (palettes, PDF preview) are
 * intentionally excluded — they can't be serialized cheaply and are re-derived.
 */

import type { BrandColors, LayoutOptions } from "./types";
import type { ExportFormat } from "../components/RenderButton";

const STORAGE_KEY = "layout-studio:session";
const VERSION = 1;

export interface PersistedSession {
    markdown: string;
    selectedBrand: string | null;
    selectedPaletteId: string | null;
    format: ExportFormat;
    layout: LayoutOptions;
    /** Custom color override, when the user has edited the scheme. */
    customColors?: BrandColors | null;
}

interface Envelope {
    version: number;
    session: PersistedSession;
}

/** Load the last autosaved session, or null if none / unreadable / stale. */
export function loadSession(): PersistedSession | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const env = JSON.parse(raw) as Envelope;
        if (env.version !== VERSION || !env.session) return null;
        // Minimal shape guard — enough to reject corrupt / foreign payloads.
        if (typeof env.session.markdown !== "string") return null;
        return env.session;
    } catch {
        return null;
    }
}

/** Best-effort persist; swallows quota / private-mode errors. */
export function saveSession(session: PersistedSession): void {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ version: VERSION, session } satisfies Envelope),
        );
    } catch {
        /* ignore */
    }
}

export function clearSession(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* ignore */
    }
}
