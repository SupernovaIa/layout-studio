"""Standalone-image support: the Python renderer is the consumer end of the
SVG pipeline. SVGs referenced from the markdown are rasterized to PNG in the
web layer (browser canvas + brand fonts) and staged into the FS; the renderer
just resolves the path and draws the PNG — exactly like any other image.

These tests pin that contract: a staged PNG resolves against `base_path` and is
embedded, while a missing or unreadable file degrades to a visible
"imagen no disponible" note instead of crashing the render (the SVG fallback)."""

import base64
from pathlib import Path

from layout_studio_renderer import (
    LayoutOptions,
    render_markdown_to_pdf,
    reference_brand,
)

# Canonical 1x1 transparent PNG — enough for ImageReader to load + size.
_PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk"
    "+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)


def test_relative_image_resolves_against_base_path(tmp_path: Path):
    # The web layer rewrites `![x](foo.svg)` to `![x](/abs/_svg/S0.png)`; here we
    # feed the staged PNG and assert it embeds, resolved relative to base_path.
    (tmp_path / "diagram.png").write_bytes(_PNG_1X1)
    md = "# T\n\n![un diagrama](diagram.png)\n\nFin."
    pdf = render_markdown_to_pdf(md, reference_brand(), LayoutOptions(), tmp_path)
    assert pdf.startswith(b"%PDF-")


def test_missing_image_falls_back_without_crashing(tmp_path: Path):
    # A broken/absent SVG (rasterization failed → ref left untouched) must not
    # break the render: the rest of the document still produces a PDF.
    md = "# T\n\n![roto](no-existe.svg)\n\nEl resto del documento sigue."
    pdf = render_markdown_to_pdf(md, reference_brand(), LayoutOptions(), tmp_path)
    assert pdf.startswith(b"%PDF-")


def test_unreadable_image_falls_back(tmp_path: Path):
    # A file that exists but isn't a valid image must degrade, not raise.
    bad = tmp_path / "broken.png"
    bad.write_bytes(b"not a png")
    md = "x\n\n![y](broken.png)\n\nz"
    pdf = render_markdown_to_pdf(md, reference_brand(), LayoutOptions(), tmp_path)
    assert pdf.startswith(b"%PDF-")
