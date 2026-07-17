#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["layout-studio-renderer"]
#
# [tool.uv.sources]
# layout-studio-renderer = { path = "../" }
# ///
"""Genera el DOCX de prueba con la tabla de 35 filas."""

from pathlib import Path
from layout_studio_renderer import render_markdown_to_docx, reference_brand


def main() -> None:
    here = Path(__file__).resolve().parent
    md = (here / "test_table_header_repeat.md").read_text(encoding="utf-8")
    docx = render_markdown_to_docx(md, reference_brand())
    out = here / "test_output.docx"
    out.write_bytes(docx)
    print(f"OK: {out}")


if __name__ == "__main__":
    main()
