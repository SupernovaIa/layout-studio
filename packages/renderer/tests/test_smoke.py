"""End-to-end smoke test: render the bundled reference example to PDF bytes."""

import dataclasses
from pathlib import Path

from layout_studio_renderer import (
    LayoutOptions,
    render_markdown_to_docx,
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


def test_non_string_frontmatter_title_renders():
    # YAML parses `titulo: 2024` as an int and a list as a list; neither may crash.
    for value in ("2024", "[a, b]"):
        md = f"---\ntitulo: {value}\n---\n\n# Heading\n\nBody text.\n"
        pdf = render_markdown_to_pdf(md, reference_brand())
        assert pdf.startswith(b"%PDF-")


def test_importing_package_does_not_load_python_docx():
    # PDF-only sessions (the web cold start) must not need python-docx/lxml.
    import subprocess
    import sys

    code = "import layout_studio_renderer, sys; sys.exit('docx' in sys.modules)"
    assert subprocess.run([sys.executable, "-c", code]).returncode == 0


def test_docx_export_still_works():
    md = EXAMPLE.read_text(encoding="utf-8")
    docx = render_markdown_to_docx(md, reference_brand())
    assert docx.startswith(b"PK"), "DOCX is a zip container"
