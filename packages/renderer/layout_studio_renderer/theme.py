"""Resolves a brand's `BrandColors` into a complete set of concrete drawing
colors.

This is the single place the per-brand override fallback rules live: every
semantic slot below is filled here, so the renderer's draw code reads a ready
color (`self.col_heading`) instead of falling back inline
(`self.col_heading or self.col_dark`) at each call site.
"""

from __future__ import annotations

from dataclasses import dataclass

from reportlab.lib.colors import Color, HexColor

from .config import BrandColors


@dataclass(frozen=True)
class Theme:
    """Fully-resolved palette. Direct slots map 1:1 to BrandColors; the rest
    apply the documented fallbacks."""

    # Direct brand colors.
    dark: Color
    light: Color
    mid: Color
    text: Color
    text_soft: Color
    line: Color
    bg_soft: Color
    quote_bg: Color
    white: Color
    # Role slots (override → fallback).
    table_header: Color  # table_header_bg → dark
    header_rule: Color   # header_rule     → light
    footer_rule: Color   # footer_rule     → line
    page_number: Color   # page_number     → light
    heading: Color       # heading         → dark  (h1 / h2)
    heading_h3: Color    # heading         → mid   (h3)

    @classmethod
    def resolve(cls, cols: BrandColors) -> "Theme":
        dark = HexColor(cols.primary_dark)
        light = HexColor(cols.primary_light)
        mid = HexColor(cols.primary_mid)
        line = HexColor(cols.line)

        def pick(value: str | None, default: Color) -> Color:
            return HexColor(value) if value else default

        return cls(
            dark=dark,
            light=light,
            mid=mid,
            text=HexColor(cols.text),
            text_soft=HexColor(cols.text_soft),
            line=line,
            bg_soft=HexColor(cols.bg_soft),
            quote_bg=HexColor(cols.quote_bg),
            white=HexColor(cols.white),
            table_header=pick(cols.table_header_bg, dark),
            header_rule=pick(cols.header_rule, light),
            footer_rule=pick(cols.footer_rule, line),
            page_number=pick(cols.page_number, light),
            heading=pick(cols.heading, dark),
            heading_h3=pick(cols.heading, mid),
        )
