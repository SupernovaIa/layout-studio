import { useEffect, useRef, useState } from "react";

import { saveSession, type PersistedSession } from "./session";

export type SaveState = "idle" | "saving" | "saved";

/** How long the "saved" state lingers before fading back to idle. */
const SAVED_TTL = 2000;
/** Debounce window: coalesce rapid edits into a single write. */
const DEBOUNCE = 600;

/**
 * Debounced autosave. Persists `session` ~600 ms after the last change (once
 * `ready` is true) and surfaces a transient save state for the UI.
 *
 * `ready` gates the very first write so we don't clobber a restored draft with
 * transient defaults while the brand catalog is still loading.
 */
export function useAutosave(session: PersistedSession, ready: boolean): SaveState {
    const [state, setState] = useState<SaveState>("idle");
    // Keep the latest session without re-arming the timer on identity changes.
    const latest = useRef(session);
    latest.current = session;
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedTtl = useRef<ReturnType<typeof setTimeout> | null>(null);
    // The first run persists the restored/hydrated session; do it silently so a
    // freshly loaded page doesn't flash "Guardando…" (which would also change
    // the header height and shift the layout).
    const firstRun = useRef(true);

    // Serialized payload as the dependency: unrelated re-renders don't re-arm
    // the timer, but any real content change does.
    const payload = JSON.stringify(session);

    useEffect(() => {
        if (!ready) return;
        if (firstRun.current) {
            firstRun.current = false;
            saveSession(latest.current); // persist once, no indicator
            return;
        }
        setState("saving");
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => {
            saveSession(latest.current);
            setState("saved");
            if (savedTtl.current) clearTimeout(savedTtl.current);
            savedTtl.current = setTimeout(() => setState("idle"), SAVED_TTL);
        }, DEBOUNCE);
        return () => {
            if (debounce.current) clearTimeout(debounce.current);
        };
    }, [payload, ready]);

    useEffect(
        () => () => {
            if (savedTtl.current) clearTimeout(savedTtl.current);
        },
        [],
    );

    return state;
}
