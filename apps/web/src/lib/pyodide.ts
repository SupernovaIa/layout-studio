/**
 * Pyodide singleton loader.
 *
 * Boots Pyodide once per page, installs `pyyaml` (pre-built in the Pyodide
 * distribution), `reportlab` from PyPI via micropip, and the local
 * layout-studio-renderer wheel served from /wheels/. Returns a Promise that
 * resolves to the live Pyodide instance.
 *
 * The Pyodide runtime itself is loaded from jsDelivr by injecting a <script>
 * tag on first use (see `loadPyodideScript`), so it never blocks the first
 * paint. `window.loadPyodide` is exposed globally by that script.
 */

declare global {
    interface Window {
        // Pyodide's loader is intentionally loose. We don't pull in pyodide's
        // TS types because the surface we use is tiny.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        loadPyodide: (options?: { indexURL?: string }) => Promise<any>;
    }
}

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const WHEELS_BASE = "/wheels";

function loadPyodideScript(): Promise<void> {
    if ("loadPyodide" in window) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `${PYODIDE_INDEX_URL}pyodide.js`;
        script.onload = () => resolve();
        script.onerror = () => {
            // Remove the failed tag so a retry injects a fresh one.
            script.remove();
            reject(new Error("No se pudo descargar el motor (pyodide.js). Revisa tu conexión."));
        };
        document.head.appendChild(script);
    });
}

async function resolveRendererWheelUrl(): Promise<string> {
    // The build script writes manifest.json alongside the wheel so the JS loader
    // doesn't have to hardcode the version. micropip rejects non-PEP-427 names,
    // so we cannot use a stable alias filename.
    const res = await fetch(`${WHEELS_BASE}/manifest.json`);
    if (!res.ok) {
        throw new Error(
            `No se pudo leer ${WHEELS_BASE}/manifest.json. ¿Has ejecutado 'pnpm build:wheel'?`,
        );
    }
    const data = (await res.json()) as { renderer: string };
    return `${WHEELS_BASE}/${data.renderer}`;
}

export type PyodideStatus =
    | { state: "idle" }
    | { state: "loading"; progress: number }
    | { state: "ready" }
    | { state: "error"; message: string };

const LOAD_STEPS = 4;

type StatusListener = (s: PyodideStatus) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodidePromise: Promise<any> | null = null;
let lastStatus: PyodideStatus = { state: "idle" };
const listeners = new Set<StatusListener>();

function setStatus(next: PyodideStatus) {
    lastStatus = next;
    for (const l of listeners) l(next);
}

export function subscribePyodideStatus(fn: StatusListener): () => void {
    listeners.add(fn);
    fn(lastStatus);
    return () => listeners.delete(fn);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPyodide(): Promise<any> {
    if (pyodidePromise) return pyodidePromise;

    pyodidePromise = (async () => {
        try {
            setStatus({ state: "loading", progress: 0 });
            await loadPyodideScript();
            const pyodide = await window.loadPyodide({
                indexURL: PYODIDE_INDEX_URL,
            });

            setStatus({ state: "loading", progress: 1 / LOAD_STEPS });
            await pyodide.loadPackage(["micropip", "pyyaml"]);

            setStatus({ state: "loading", progress: 2 / LOAD_STEPS });
            const micropip = pyodide.pyimport("micropip");
            await micropip.install("reportlab");

            setStatus({ state: "loading", progress: 3 / LOAD_STEPS });
            const wheelUrl = await resolveRendererWheelUrl();
            await micropip.install(wheelUrl);

            setStatus({ state: "ready" });
            return pyodide;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setStatus({ state: "error", message });
            // Reset so a future call can retry.
            pyodidePromise = null;
            throw err;
        }
    })();

    return pyodidePromise;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let docxInstallPromise: Promise<void> | null = null;

/**
 * Install `python-docx` on demand, the first time a DOCX export is requested.
 * Kept off the `getPyodide()` critical path so a failure here never blocks PDF
 * rendering (which only needs reportlab). The result is cached; a failed
 * install resets so a later retry can re-attempt.
 */
export async function ensurePythonDocx(): Promise<void> {
    if (docxInstallPromise) return docxInstallPromise;
    docxInstallPromise = (async () => {
        const pyodide = await getPyodide();
        const micropip = pyodide.pyimport("micropip");
        await micropip.install("python-docx");
    })();
    try {
        await docxInstallPromise;
    } catch (err) {
        docxInstallPromise = null;
        throw err;
    }
}
