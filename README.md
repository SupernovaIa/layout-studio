# layout-studio

Brand-aware document layout studio. Markdown in, branded PDFs out. **Zero backend**: the Python engine runs in the browser via Pyodide (WebAssembly) and brands are static files in the repository.

## Local development

Requirements: **Node ≥ 20** and **pnpm 9** (`corepack enable` if you don't have it).

```bash
pnpm install   # workspace dependencies
pnpm dev       # start Vite (apps/web) with hot reload → http://localhost:5173
```

The renderer wheel is already committed, so you don't need Python to work on the frontend. Only if you touch `packages/renderer/` rebuild the wheel with `pnpm build:wheel` (requires [uv](https://docs.astral.sh/uv/)); details in [docs/deployment.md](docs/deployment.md).

## Documentation

- [docs/architecture.md](docs/architecture.md) — how it works (Pyodide, repo structure, status).
- [docs/deployment.md](docs/deployment.md) — hosting options and CI.
- [docs/brands.md](docs/brands.md) — adding a new brand.
- [docs/features.md](docs/features.md) — index of supported markdown (headings, lists, tables, images, code, callouts, quizzes, formulas, Mermaid diagrams…).
- [docs/formula-syntax.md](docs/formula-syntax.md) — detailed LaTeX formula guide.
