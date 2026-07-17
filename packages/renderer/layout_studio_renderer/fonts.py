"""Font registration helpers.

Each brand has a family name and five TTF paths. We register them with
ReportLab under the names `{family}`, `{family}-Bold`, `{family}-Medium`,
`{family}-Light`, `{family}-Italic`. The renderer always references variants
by these derived names.

A bundled JetBrains Mono TTF (Unicode monospace) is registered once as
"JetBrainsMono" / "JetBrainsMono-Bold" for use in code blocks.
"""

from __future__ import annotations

from pathlib import Path

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from .config import BrandFonts

_ASSETS = Path(__file__).parent / "assets" / "fonts"

MONO_REGULAR = "JetBrainsMono"
MONO_BOLD = "JetBrainsMono-Bold"


def font_names(family: str) -> dict[str, str]:
    return {
        "regular": family,
        "bold": f"{family}-Bold",
        "medium": f"{family}-Medium",
        "light": f"{family}-Light",
        "italic": f"{family}-Italic",
        "mono": f"{family}-Mono",
    }


_REGISTERED: set[str] = set()
_REGISTERED_MONO: set[str] = set()


def register_mono_fonts() -> None:
    """Register the bundled JetBrains Mono TTFs. Idempotent."""
    if MONO_REGULAR in _REGISTERED:
        return
    pdfmetrics.registerFont(TTFont(MONO_REGULAR, str(_ASSETS / "JetBrainsMono-Regular.ttf")))
    pdfmetrics.registerFont(TTFont(MONO_BOLD, str(_ASSETS / "JetBrainsMono-Bold.ttf")))
    _REGISTERED.add(MONO_REGULAR)


def register_brand_fonts(fonts: BrandFonts) -> dict[str, str]:
    """Register the brand's TTFs with ReportLab. Idempotent per family name.

    The mono variant is tracked separately: brands can share a `family` name
    (e.g. two brands may both use "Poppins") yet differ in whether they
    ship a mono font, so registering the family must not skip a later mono.
    """
    names = font_names(fonts.family)
    if fonts.family not in _REGISTERED:
        pdfmetrics.registerFont(TTFont(names["regular"], str(fonts.regular)))
        pdfmetrics.registerFont(TTFont(names["bold"], str(fonts.bold)))
        pdfmetrics.registerFont(TTFont(names["medium"], str(fonts.medium)))
        pdfmetrics.registerFont(TTFont(names["light"], str(fonts.light)))
        pdfmetrics.registerFont(TTFont(names["italic"], str(fonts.italic)))
        _REGISTERED.add(fonts.family)

    if fonts.mono is not None and names["mono"] not in _REGISTERED_MONO:
        pdfmetrics.registerFont(TTFont(names["mono"], str(fonts.mono)))
        _REGISTERED_MONO.add(names["mono"])

    return names
