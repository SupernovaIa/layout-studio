# Deployment and CI

## Deployment

The app is **100% static**: the Python engine runs in the browser via Pyodide
(WebAssembly) and brands are static files in the repository. That means it can be
hosted anywhere.

The included `Dockerfile` is a multi-stage build: it builds the web
(`pnpm --filter @layout-studio/web build`) and serves the result statically with
nginx (`nginx.conf`). You can deploy that image on any container host (Cloud Run,
Fly.io, a VPS…), or skip Docker entirely and publish the contents of
`apps/web/dist/` to any static host (GitHub Pages, Netlify, Cloudflare Pages,
Vercel…).

The renderer wheel (`apps/web/public/wheels/*.whl`) is committed, so the container
build does not need Python. If you update the renderer, run `pnpm build:wheel`
locally and commit the new `.whl` + `manifest.json` before pushing.

## CI

`.github/workflows/ci.yml` runs on every push and PR:

- **web**: `pnpm install` + `pnpm --filter @layout-studio/web build` (includes
  `tsc --noEmit`).
- **renderer**: `pytest` over `packages/renderer`, plus a check that the committed
  wheel matches the Python source.
