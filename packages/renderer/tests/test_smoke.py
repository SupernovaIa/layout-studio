"""End-to-end smoke test: render the bundled reference example to PDF bytes."""

import dataclasses
from pathlib import Path

from layout_studio_renderer import (
    LayoutOptions,
    render_markdown_to_pdf,
    reference_brand,
)

EXAMPLE = Path(__file__).resolve().parent.parent / "examples" / "reference_case.md"
# Any bundled image works as a stand-in co-branding logo for the size assertion.
LOGO = Path(__file__).resolve().parent.parent / "examples" / "diagram.png"


def test_renders_reference_example():
    md = EXAMPLE.read_text(encoding="utf-8")
    pdf = render_markdown_to_pdf(md, reference_brand())
    assert pdf.startswith(b"%PDF-"), "Output should be a PDF"
    assert len(pdf) > 5000, "PDF unexpectedly small"


def test_no_justify_still_renders():
    md = EXAMPLE.read_text(encoding="utf-8")
    pdf = render_markdown_to_pdf(
        md, reference_brand(), LayoutOptions(justify=False)
    )
    assert pdf.startswith(b"%PDF-")


def test_client_logo_renders():
    md = EXAMPLE.read_text(encoding="utf-8")
    brand = reference_brand()
    cobranded = dataclasses.replace(brand, client_logo_path=LOGO)
    pdf = render_markdown_to_pdf(md, cobranded)
    assert pdf.startswith(b"%PDF-")
    # The client logo adds image content on every page → strictly bigger output.
    assert len(pdf) > len(render_markdown_to_pdf(md, brand))
