"""Optional word hyphenation (LayoutOptions.hyphenate)."""

import io

from reportlab.pdfgen.canvas import Canvas

from layout_studio_renderer import (
    LayoutOptions,
    render_markdown_to_pdf,
    reference_brand,
)
from layout_studio_renderer.hyphenation import resolve_hyphenator
from layout_studio_renderer.renderer import _wrap_tokens


def test_disabled_returns_no_hyphenator():
    assert resolve_hyphenator(LayoutOptions(hyphenate=False), {}) is None


def test_spanish_hyphenator_splits_words():
    h = resolve_hyphenator(LayoutOptions(hyphenate=True), {})
    assert callable(h)
    pairs = h("internacionalizacion")
    assert pairs, "expected at least one break point"
    assert all(head + tail == "internacionalizacion" for head, tail in pairs)


def test_wrap_inserts_hyphen_only_when_enabled():
    c = Canvas(io.BytesIO())
    font, size = "Helvetica", 10
    tokens = [(font, None, "aaa internacionalizacion", None)]
    w_prefix = c.stringWidth("aaa ", font, size)
    w_word = c.stringWidth("internacionalizacion", font, size)
    # Wide enough for the long word alone, too narrow for "aaa " + the word:
    # forces a wrap that hyphenation can fill instead of leaving a loose line.
    max_w = w_word + 0.5 * w_prefix

    h = resolve_hyphenator(LayoutOptions(hyphenate=True), {})
    flat_on = "".join(t[2] for line in _wrap_tokens(c, tokens, size, max_w, h) for t in line)
    flat_off = "".join(t[2] for line in _wrap_tokens(c, tokens, size, max_w, None) for t in line)

    assert "-" in flat_on
    assert "-" not in flat_off
    # No characters are lost or duplicated by the split (only a hyphen added).
    assert flat_on.replace("-", "") == "aaa internacionalizacion"


def test_render_with_hyphenation_produces_pdf():
    md = (
        "---\ntitulo: Prueba\nidioma: es\n---\n\n"
        "## 1. Seccion\n\n"
        "La internacionalizacion y la compatibilidad exigen una maquetacion "
        "cuidadosa para evitar rios tipograficos en el justificado.\n"
    )
    pdf = render_markdown_to_pdf(md, reference_brand(), LayoutOptions(hyphenate=True))
    assert pdf.startswith(b"%PDF-")
