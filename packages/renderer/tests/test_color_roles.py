"""Tests for the per-brand color-role overrides.

Two layers:
- Resolution: a `Renderer` built from a brand with overrides exposes the right
  `col_*` attributes (and falls back to the historical roles without them).
- Painting: the override colors actually reach the canvas draw operations
  (captured by spying on setFillColor/setStrokeColor), and a brand without
  overrides never uses them.
"""

import dataclasses
import io

from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas as canvas_mod

from layout_studio_renderer import LayoutOptions, render_markdown_to_pdf, reference_brand
from layout_studio_renderer.fonts import register_brand_fonts, register_mono_fonts
from layout_studio_renderer.renderer import Renderer

# Distinct from every color in the reference palette, so "appears in output" is
# unambiguous evidence the override (not a default) was used.
OVERRIDES = {
    "table_header_bg": "#336699",
    "header_rule": "#AABBCC",
    "footer_rule": "#DDEEFF",
    "heading": "#123456",
    "page_number": "#654321",
}

MD = (
    "# Título del documento\n\n"
    "## Sección\n\nPárrafo de prueba.\n\n"
    "### Subsección\n\nMás texto.\n\n"
    "| A | B |\n| --- | --- |\n| 1 | 2 |\n"
)


def _with_overrides(base):
    return dataclasses.replace(base, colors=dataclasses.replace(base.colors, **OVERRIDES))


def _renderer(brand, layout=None):
    layout = layout or LayoutOptions()
    register_brand_fonts(brand.fonts)
    register_mono_fonts()
    c = canvas_mod.Canvas(io.BytesIO(), pagesize=layout.page_size)
    return Renderer(c, {"titulo": "T"}, brand, layout)


def _capture(brand):
    """Render MD and collect every fill/stroke color (as hex) set on the canvas."""
    fills, strokes = [], []
    of, os_ = canvas_mod.Canvas.setFillColor, canvas_mod.Canvas.setStrokeColor

    def _hex(color):
        return color.hexval() if hasattr(color, "hexval") else str(color)

    def fspy(self, color, *a, **k):
        fills.append(_hex(color))
        return of(self, color, *a, **k)

    def sspy(self, color, *a, **k):
        strokes.append(_hex(color))
        return os_(self, color, *a, **k)

    canvas_mod.Canvas.setFillColor, canvas_mod.Canvas.setStrokeColor = fspy, sspy
    try:
        render_markdown_to_pdf(MD, brand)
    finally:
        canvas_mod.Canvas.setFillColor, canvas_mod.Canvas.setStrokeColor = of, os_
    return fills, strokes


# --- resolution -----------------------------------------------------------

def test_overrides_resolve_to_explicit_colors():
    r = _renderer(_with_overrides(reference_brand()))
    assert r.col_table_header == HexColor("#336699")
    assert r.col_header_rule == HexColor("#AABBCC")
    assert r.col_footer_rule == HexColor("#DDEEFF")
    assert r.col_heading == HexColor("#123456")  # h1 / h2
    assert r.col_heading_h3 == HexColor("#123456")  # h3 collapses to the same
    assert r.col_page_number == HexColor("#654321")


def test_no_overrides_fall_back_to_historical_roles():
    r = _renderer(reference_brand())
    assert r.col_table_header == r.col_dark
    assert r.col_header_rule == r.col_light
    assert r.col_footer_rule == r.col_line
    assert r.col_page_number == r.col_light
    assert r.col_heading == r.col_dark  # h1 / h2 default
    assert r.col_heading_h3 == r.col_mid  # h3 default


def test_theme_resolves_roles_and_fallbacks():
    # Unit-level: the resolver alone, no Renderer/canvas/fonts needed.
    from layout_studio_renderer.theme import Theme

    base = reference_brand().colors
    default = Theme.resolve(base)
    assert default.table_header == default.dark
    assert default.header_rule == default.light
    assert default.footer_rule == default.line
    assert default.page_number == default.light
    assert default.heading == default.dark
    assert default.heading_h3 == default.mid

    overridden = Theme.resolve(dataclasses.replace(base, **OVERRIDES))
    assert overridden.table_header == HexColor("#336699")
    assert overridden.header_rule == HexColor("#AABBCC")
    assert overridden.footer_rule == HexColor("#DDEEFF")
    assert overridden.page_number == HexColor("#654321")
    assert overridden.heading == HexColor("#123456")
    assert overridden.heading_h3 == HexColor("#123456")


# --- painting -------------------------------------------------------------

def test_override_colors_reach_the_canvas():
    fills, strokes = _capture(_with_overrides(reference_brand()))
    assert HexColor("#336699").hexval() in fills  # table header band
    assert HexColor("#654321").hexval() in fills  # page number
    assert HexColor("#123456").hexval() in fills  # headings
    assert HexColor("#AABBCC").hexval() in strokes  # header rule
    assert HexColor("#DDEEFF").hexval() in strokes  # footer rule


def test_brand_without_overrides_never_uses_them():
    fills, strokes = _capture(reference_brand())
    used = set(fills) | set(strokes)
    for hexcode in OVERRIDES.values():
        assert HexColor(hexcode).hexval() not in used
