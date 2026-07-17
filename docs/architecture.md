# Architecture

**Zero backend**: the Python engine runs in the browser via Pyodide (WebAssembly)
and brands are static files in the repository.

```
User opens the web app
        ↓
Web reads /brands/index.json   → catalog of available brands
User picks a brand and uploads MD
        ↓
Web downloads brand.json + logo + fonts (static assets of the site itself)
Pyodide runs packages/renderer in the browser
        ↓
PDF generated client-side, downloaded locally
```

No server, no database, no recurring cost. The site is 100% static and can be
served from any static host or nginx container (see [deployment.md](deployment.md)).

## Structure

```
layout-studio/
├── apps/
│   └── web/                          # Vite + React + Tailwind (static)
│       └── public/
│           └── brands/
│               ├── index.json        # catalog of slugs
│               └── mimarca/
│                   ├── brand.json    # colors, font_family, layout_defaults
│                   ├── logo.png
│                   └── fonts/*.ttf
└── packages/
    └── renderer/                     # Python module Markdown → PDF
                                      # packaged as a wheel and loaded into
                                      # Pyodide client-side
```

## Status

- [x] `packages/renderer`: parametrizable refactor done.
- [x] `apps/web`: scaffold + UI.
- [x] Static brand catalog.
- [x] Pyodide integration.
- [x] Renderer wheel for Pyodide.
- [x] CI on GitHub Actions (web build + renderer pytest).
- [ ] Deployment (static host or container — see deployment.md).
