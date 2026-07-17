"""Math-formula support: the `⟦Fn⟧` markers the web layer injects for `$...$`
and `$$...$$` math (pre-rasterized to PNG) must parse, tokenize and render.

Rasterization itself lives in the web layer (MathJax + canvas); here we feed a
tiny real PNG through the parser/renderer and assert the wiring."""

import base64
from pathlib import Path

import pytest

from layout_studio_renderer import (
    LayoutOptions,
    render_markdown_to_pdf,
    reference_brand,
)
from layout_studio_renderer.parser import parse_markdown
from layout_studio_renderer.renderer import _IMG, _build_style, _parse_inline

# Canonical 1x1 transparent PNG — enough for ImageReader to load + size.
_PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk"
    "+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)


@pytest.fixture
def formula_png(tmp_path: Path) -> Path:
    p = tmp_path / "F0.png"
    p.write_bytes(_PNG_1X1)
    return p


def _spec(path: Path, display: bool = False) -> dict:
    return {"path": str(path), "ex_w": 6.0, "ex_h": 2.2, "ex_depth": 0.5,
            "display": display}


# --- parser ----------------------------------------------------------------

def test_standalone_marker_parses_as_formula_block():
    _, blocks = parse_markdown("Antes\n\n⟦F0⟧\n\nDespués")
    types = [b["type"] for b in blocks]
    assert "formula" in types
    formula = next(b for b in blocks if b["type"] == "formula")
    assert formula["id"] == "F0"


def test_inline_marker_stays_in_paragraph_text():
    # An in-prose marker must NOT become a block; it rides inside the paragraph
    # so the inline tokenizer can turn it into an image at draw time.
    _, blocks = parse_markdown("La ecuación ⟦F1⟧ es famosa.")
    assert [b["type"] for b in blocks] == ["p"]
    assert "⟦F1⟧" in blocks[0]["text"]


# --- inline tokenizer ------------------------------------------------------

def test_inline_tokenizer_emits_image_token(formula_png):
    style = _build_style(reference_brand())
    tokens = _parse_inline("a ⟦F0⟧ b", style, {"F0": _spec(formula_png)})
    img_tokens = [t for t in tokens if t[0] is _IMG]
    assert len(img_tokens) == 1
    spec = img_tokens[0][1]
    assert spec["ex_w"] == 6.0 and "_reader" in spec  # reader cached


def test_inline_marker_without_formula_falls_back_to_text():
    style = _build_style(reference_brand())
    tokens = _parse_inline("a ⟦F9⟧ b", style, {})  # nothing registered
    assert all(t[0] is not _IMG for t in tokens)
    assert any("⟦F9⟧" in t[2] for t in tokens)


def test_unreadable_png_falls_back_to_text(tmp_path):
    style = _build_style(reference_brand())
    bad = tmp_path / "broken.png"
    bad.write_bytes(b"not a png")
    tokens = _parse_inline("x ⟦F0⟧ y", style, {"F0": _spec(bad)})
    assert all(t[0] is not _IMG for t in tokens)


# --- end-to-end render -----------------------------------------------------

def test_block_and_inline_formulas_render_to_pdf(formula_png):
    md = "# T\n\nInline ⟦F0⟧ dentro.\n\n⟦F1⟧\n\nFin."
    formulas = {"F0": _spec(formula_png), "F1": _spec(formula_png, display=True)}
    pdf = render_markdown_to_pdf(md, reference_brand(), LayoutOptions(), None, formulas)
    assert pdf.startswith(b"%PDF-")


def test_embedded_formula_grows_pdf(formula_png):
    # With the formula registered, the PNG is embedded; without it, the marker
    # degrades to literal text. The embedded render must be larger.
    md = "Texto ⟦F0⟧ texto."
    with_img = render_markdown_to_pdf(
        md, reference_brand(), LayoutOptions(), None, {"F0": _spec(formula_png)})
    without = render_markdown_to_pdf(md, reference_brand(), LayoutOptions(), None, {})
    assert len(with_img) > len(without)


def test_no_formulas_map_still_renders():
    # Markers with no map at all must not crash (degrade to literal text).
    pdf = render_markdown_to_pdf("Sin ⟦F0⟧ mapa.", reference_brand())
    assert pdf.startswith(b"%PDF-")
