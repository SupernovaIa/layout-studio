"""Smoke coverage for the table renderer (previously untested)."""

from layout_studio_renderer import render_markdown_to_pdf, reference_brand

TABLE_MD = (
    "Texto introductorio.\n\n"
    "| Columna A | Columna B | Columna C |\n"
    "| --- | --- | --- |\n"
    "| uno | dos | tres |\n"
    "| cuatro | cinco | seis |\n"
)


def test_table_renders_to_valid_pdf():
    pdf = render_markdown_to_pdf(TABLE_MD, reference_brand())
    assert pdf.startswith(b"%PDF-")


def test_table_adds_content_over_plain_text():
    brand = reference_brand()
    with_table = render_markdown_to_pdf(TABLE_MD, brand)
    without_table = render_markdown_to_pdf("Texto introductorio.\n", brand)
    assert len(with_table) > len(without_table)


def test_long_table_overflows_without_crashing():
    # Enough rows to overflow several pages; exercises the page-break +
    # header-repeat path. Must not crash and grows well past a short table.
    rows = "\n".join(f"| fila {i} | valor {i} | nota {i} |" for i in range(80))
    long_md = f"| A | B | C |\n| --- | --- | --- |\n{rows}\n"
    short_md = "| A | B | C |\n| --- | --- | --- |\n| 1 | 2 | 3 |\n"
    brand = reference_brand()
    long_pdf = render_markdown_to_pdf(long_md, brand)
    assert long_pdf.startswith(b"%PDF-")
    assert len(long_pdf) > len(render_markdown_to_pdf(short_md, brand))
