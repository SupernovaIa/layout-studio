#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["layout-studio-renderer"]
#
# [tool.uv.sources]
# layout-studio-renderer = { path = "../" }
# ///
"""Genera el PDF de prueba para repetición de encabezados en tablas multipágina."""

from pathlib import Path
from layout_studio_renderer import render_markdown_to_pdf, reference_brand


def main() -> None:
    here = Path(__file__).resolve().parent
    md = (here / "test_table_header_repeat.md").read_text(encoding="utf-8")
    pdf = render_markdown_to_pdf(md, reference_brand())
    out = here / "test_table_header_repeat.pdf"
    out.write_bytes(pdf)
    print(f"OK: {out}")


if __name__ == "__main__":
    main()
