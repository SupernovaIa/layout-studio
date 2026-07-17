# @layout-studio/renderer

Brand-aware Markdown → PDF engine, with all palette/font/logo values lifted into `BrandConfig`.

## Uso programático

```python
from layout_studio_renderer import render_markdown_to_pdf, reference_brand, LayoutOptions

pdf_bytes = render_markdown_to_pdf(
    md_text,
    brand=reference_brand(),
    layout=LayoutOptions(justify=True),
)
```

## Crear una marca nueva

```python
from pathlib import Path
from layout_studio_renderer import BrandColors, BrandConfig, BrandFonts

my_brand = BrandConfig(
    name="Acme",
    colors=BrandColors(
        primary_dark="#102A43",
        primary_light="#BCCCDC",
        primary_mid="#486581",
    ),
    fonts=BrandFonts(
        family="Inter",
        regular=Path("fonts/Inter-Regular.ttf"),
        bold=Path("fonts/Inter-Bold.ttf"),
        medium=Path("fonts/Inter-Medium.ttf"),
        light=Path("fonts/Inter-Light.ttf"),
        italic=Path("fonts/Inter-Italic.ttf"),
    ),
    logo_path=Path("logos/acme.png"),
    logo_fallback_text="Acme Corp",
)
```

## Test rápido

```bash
cd packages/renderer
uv run pytest
```

## Render de un ejemplo bundleado

```bash
cd packages/renderer
uv run examples/build_test_page_breaks.py
```
