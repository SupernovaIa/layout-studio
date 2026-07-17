"""Top-level public API.

`render_markdown_to_pdf` is the only function callers need: pass a Markdown
string, a brand config and (optionally) layout options, get back PDF bytes.

`reference_brand()` provides a neutral reference identity built from the
assets bundled in this package — used by tests and as a reference preset.
"""

from __future__ import annotations

import io
from pathlib import Path

from reportlab.pdfgen import canvas

from .config import BrandColors, BrandConfig, BrandFonts, LayoutOptions
from .docx_renderer import render_markdown_to_docx as _render_docx
from .parser import parse_markdown
from .renderer import render_blocks_to_canvas
from .docx_renderer import render_markdown_to_docx as _render_docx


_PACKAGE_ASSETS = Path(__file__).resolve().parent / "assets"


def reference_brand() -> BrandConfig:
    """Neutral reference brand built from the assets bundled in this package."""
    fonts_dir = _PACKAGE_ASSETS / "fonts"
    return BrandConfig(
        name="Reference",
        colors=BrandColors(
            primary_dark="#1B2A4A",
            primary_light="#A9C4F5",
            primary_mid="#3A5CA8",
        ),
        fonts=BrandFonts(
            family="Poppins",
            regular=fonts_dir / "Poppins-Regular.ttf",
            bold=fonts_dir / "Poppins-Bold.ttf",
            medium=fonts_dir / "Poppins-Medium.ttf",
            light=fonts_dir / "Poppins-Light.ttf",
            italic=fonts_dir / "Poppins-Italic.ttf",
        ),
        logo_path=None,
        logo_fallback_text="Mi Marca",
        document_author="Mi Marca",
    )


def render_markdown_to_pdf(
    md_text: str,
    brand: BrandConfig,
    layout: LayoutOptions | None = None,
    base_path: str | Path | None = None,
    formulas: dict | None = None,
) -> bytes:
    """Render a Markdown document (with optional YAML frontmatter) to PDF bytes.

    `base_path` is the directory that relative image paths in the markdown
    (`![](img.png)`) are resolved against. When None, relative images cannot be
    located and render as a soft "imagen no disponible" note.

    `formulas` maps a formula id (e.g. "F0") to ``{"path", "ex_w", "ex_h",
    "display"}`` for math pre-rasterized to PNG by the web layer. The markdown
    carries a ``⟦F0⟧`` marker where each formula goes (see the parser).
    """
    layout = layout or LayoutOptions()
    meta, blocks = parse_markdown(md_text)

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=layout.page_size)
    c.setTitle(meta.get("titulo", "Documento"))
    if brand.document_author:
        c.setAuthor(brand.document_author)

    bp = Path(base_path) if base_path is not None else None
    if layout.editorial:
        from .editorial import render_editorial
        render_editorial(c, meta, blocks, brand, layout, bp, formulas)
    else:
        render_blocks_to_canvas(c, meta, blocks, brand, layout, bp, formulas)
    c.save()
    return buf.getvalue()


def render_markdown_to_docx(
    md_text: str,
    brand: BrandConfig,
    layout: LayoutOptions | None = None,
    base_path: str | Path | None = None,
) -> bytes:
    """Render a Markdown document (with optional YAML frontmatter) to DOCX bytes."""
    return _render_docx(md_text, brand, layout, base_path)
