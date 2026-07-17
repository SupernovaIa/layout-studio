# Brand catalog

Static brand presets consumed by the web app at runtime via `fetch`. The catalog is **read-only** for users — adding/editing brands requires a commit.

## Layout

```
brands/
├── index.json                # { "brands": ["mimarca", ...] }
└── <slug>/
    ├── brand.json            # BrandManifest (see apps/web/src/lib/types.ts)
    ├── logo.png              # logo completo, transparente, ≥ 400 px alto. Va en el PDF.
    ├── icon.png              # opcional. Solo símbolo/mark, cuadrado, ~256 px. Para el dropdown.
    └── fonts/
        ├── regular.ttf
        ├── bold.ttf
        ├── medium.ttf
        ├── light.ttf
        └── italic.ttf
```

All five font variants are required (the renderer references them explicitly). If a brand only has one weight, duplicate that TTF under the missing variant names.

## `brand.json` shape

```jsonc
{
    "slug": "mimarca",                     // must match the directory name
    "name": "Mi Marca",                    // display name
    "colors": {
        "primary_dark": "#003D6B",         // required
        "primary_light": "#B7E0F5",        // required
        "primary_mid": "#1F6FA8",          // required
        "text": "#1A1A1A",                 // optional (default shown)
        "text_soft": "#555555",            // optional
        "line": "#D6DEE5",                 // optional
        "bg_soft": "#F4F7FA",              // optional
        "quote_bg": "#EAF4FB",             // optional
        "white": "#FFFFFF"                 // optional
    },
    "font_family": "Poppins",              // name registered in ReportLab
    "font_files": {
        "regular": "fonts/regular.ttf",    // paths relative to this dir
        "bold": "fonts/bold.ttf",
        "medium": "fonts/medium.ttf",
        "light": "fonts/light.ttf",
        "italic": "fonts/italic.ttf"
    },
    "logo_file": "logo.png",               // optional, path relative to this dir
    "icon_file": "icon.png",               // optional, square mark for the brand selector
    "logo_fallback_text": "Mi Marca",
    "document_author": "Mi Marca",
    "layout_defaults": {                    // optional partial LayoutOptions overrides
        "justify": true
    }
}
```

## Añadir una marca nueva

1. Crear el directorio `apps/web/public/brands/<slug>/` con los assets.
2. Añadir `<slug>` al array de `index.json`.
3. Commit + push y vuelve a desplegar (o reconstruye el sitio estático). La marca aparecerá en el dropdown al recargar.
