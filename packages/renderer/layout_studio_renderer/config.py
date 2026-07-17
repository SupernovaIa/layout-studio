"""Configuration dataclasses for brand identity and layout options.

A `BrandConfig` describes *what* the document looks like (palette, fonts, logo)
and is meant to be stored per-brand. A `LayoutOptions` describes *how* a given
render uses that brand — page geometry, type scale, justify on/off — and is
per-render.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Tuple

from reportlab.lib.pagesizes import A4


@dataclass(frozen=True)
class BrandColors:
    """Hex strings (e.g. "#003D6B"). Converted to ReportLab colors inside the renderer."""

    primary_dark: str
    primary_light: str
    primary_mid: str
    text: str = "#1A1A1A"
    text_soft: str = "#555555"
    line: str = "#D6DEE5"
    bg_soft: str = "#F4F7FA"
    quote_bg: str = "#EAF4FB"
    white: str = "#FFFFFF"
    # Optional per-brand role overrides. When None each falls back to the
    # historical role, so existing brands render identically:
    #   table_header_bg -> primary_dark  (filled band behind table headers)
    #   header_rule     -> primary_light (thin rule under the running header)
    #   footer_rule     -> line          (thin rule above the footer)
    #   heading         -> primary_dark (h1/h2) + primary_mid (h3): one color for all headings
    #   page_number     -> primary_light (running page number)
    table_header_bg: str | None = None
    header_rule: str | None = None
    footer_rule: str | None = None
    heading: str | None = None
    page_number: str | None = None


@dataclass(frozen=True)
class BrandFonts:
    """Paths to TTF files for the five variants used by the renderer.

    All five are required today. The family name is used as the prefix when
    registering with ReportLab (Regular → `{family}`, Bold → `{family}-Bold`,
    etc.) so swapping a brand only requires changing the family name and paths.
    """

    family: str
    regular: Path
    bold: Path
    medium: Path
    light: Path
    italic: Path
    # Optional monospace TTF (e.g. JetBrains Mono) registered as `{family}-Mono`
    # and used for code blocks. When None the renderer falls back to Courier.
    mono: Path | None = None

    def all_paths(self) -> list[Path]:
        paths = [self.regular, self.bold, self.medium, self.light, self.italic]
        if self.mono is not None:
            paths.append(self.mono)
        return paths


@dataclass(frozen=True)
class BrandConfig:
    name: str
    colors: BrandColors
    fonts: BrandFonts
    logo_path: Path | None = None
    logo_fallback_text: str = ""
    document_author: str = ""
    # Optional co-branding logo (e.g. a client's) drawn opposite the brand logo
    # in the page footer.
    client_logo_path: Path | None = None


@dataclass(frozen=True)
class LayoutOptions:
    """Per-render layout choices. Defaults match the original Sanipro look."""

    page_size: Tuple[float, float] = A4
    margin_left: float = 43
    margin_right: float = 43
    margin_top: float = 48
    margin_bottom: float = 48

    # Denser body (a technical-report feel, more text per page) over the original
    # airier defaults (10.5 / 16.5). All three stay editable per render.
    body_size: float = 9.5
    body_lead: float = 14.5
    # Heading scale tuned down from the original brochure sizes (22/14/11.5) to a
    # soberer, more document-like ladder: sections read as structure, not banners.
    h1_size: float = 16.5
    h2_size: float = 12.5
    h3_size: float = 11

    justify: bool = True

    # Word hyphenation for justified body text (off by default). Needs `pyphen`;
    # degrades gracefully to no hyphenation if it is unavailable. The language is
    # taken from `hyphenate_lang`, else the frontmatter `idioma`/`lang`, else `es`.
    hyphenate: bool = False
    hyphenate_lang: str | None = None

    # Code-block appearance. `code_dark` swaps to an editor-style dark block
    # (dark background, light text, bright syntax). `code_style` is the Pygments
    # theme name; when None a sensible default is picked per light/dark mode.
    code_dark: bool = False
    code_style: str | None = None

    @property
    def content_width(self) -> float:
        w, _ = self.page_size
        return w - self.margin_left - self.margin_right
