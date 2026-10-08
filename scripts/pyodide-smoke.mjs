// Boots Pyodide in Node the way the web app does (same pinned versions, the
// committed renderer wheel) and renders a PDF and a DOCX. Catches what neither
// pytest (CPython) nor `vite build` can: a dependency that no longer installs
// or imports under Pyodide.
//
// Usage: node scripts/pyodide-smoke.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPyodide, version as pyodideNpmVersion } from "pyodide";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const web = join(root, "apps/web");

// Single source of truth: the constants the web app ships with.
const loaderSource = readFileSync(join(web, "src/lib/pyodide.ts"), "utf8");
function pinned(name) {
    const m = loaderSource.match(new RegExp(`const ${name} = "([^"]+)"`));
    if (!m) throw new Error(`${name} not found in apps/web/src/lib/pyodide.ts`);
    return m[1];
}
const PYODIDE_VERSION = pinned("PYODIDE_VERSION");
const REPORTLAB_VERSION = pinned("REPORTLAB_VERSION");
const PYTHON_DOCX_VERSION = pinned("PYTHON_DOCX_VERSION");

if (pyodideNpmVersion !== PYODIDE_VERSION) {
    throw new Error(
        `pyodide npm package is ${pyodideNpmVersion} but the web app loads ${PYODIDE_VERSION}; keep them equal.`,
    );
}

const manifest = JSON.parse(readFileSync(join(web, "public/wheels/manifest.json"), "utf8"));
const wheelName = manifest.renderer.split("/").pop();
const wheelBytes = readFileSync(join(web, "public/wheels", manifest.renderer));

const pyodide = await loadPyodide();
await pyodide.loadPackage(["micropip", "pyyaml"]);
const micropip = pyodide.pyimport("micropip");
await micropip.install(`reportlab==${REPORTLAB_VERSION}`);

pyodide.FS.writeFile(`/tmp/${wheelName}`, wheelBytes);
await micropip.install(`emfs:/tmp/${wheelName}`);

// PDF path: must work without python-docx installed.
const pdfCheck = await pyodide.runPythonAsync(`
import sys
from layout_studio_renderer import render_markdown_to_pdf, reference_brand

md = "---\\ntitulo: 2024\\n---\\n\\n# Smoke\\n\\nText with a table.\\n\\n| A | B |\\n|---|---|\\n| 1 | 2 |\\n"
pdf = render_markdown_to_pdf(md, reference_brand())
(pdf[:5] == b"%PDF-", "docx" in sys.modules)
`);
const [isPdf, docxLoaded] = pdfCheck.toJs();
if (!isPdf) throw new Error("PDF render did not produce a PDF");
if (docxLoaded) throw new Error("python-docx was imported during a PDF-only render");

// DOCX path: installed on demand, like ensurePythonDocx() in the web app.
await micropip.install(`python-docx==${PYTHON_DOCX_VERSION}`);
const isDocx = await pyodide.runPythonAsync(`
from layout_studio_renderer import render_markdown_to_docx, reference_brand

render_markdown_to_docx("# Smoke\\n\\nBody.\\n", reference_brand())[:2] == b"PK"
`);
if (!isDocx) throw new Error("DOCX render did not produce a zip container");

console.log(`OK: Pyodide ${PYODIDE_VERSION}, reportlab ${REPORTLAB_VERSION}, python-docx ${PYTHON_DOCX_VERSION}, ${manifest.renderer}`);
