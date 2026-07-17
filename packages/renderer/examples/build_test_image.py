#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["layout-studio-renderer"]
#
# [tool.uv.sources]
# layout-studio-renderer = { path = "../" }
# ///
"""Genera el PDF de prueba para imágenes PNG externas."""

from pathlib import Path
from layout_studio_renderer import render_markdown_to_pdf, reference_brand


def main() -> None:
    here = Path(__file__).resolve().parent
    md = (here / "test_image.md").read_text(encoding="utf-8")
    # base_path = el directorio del .md, igual que hace la web con DOC_FS_ROOT/<mdDir>.
    pdf = render_markdown_to_pdf(md, reference_brand(), base_path=here)
    out = here / "test_image.pdf"
    out.write_bytes(pdf)
    print(f"OK: {out}")


if __name__ == "__main__":
    main()
