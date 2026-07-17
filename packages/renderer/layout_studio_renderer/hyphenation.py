"""Optional word hyphenation for justified body text.

ReportLab has no hyphenation of its own, so justified paragraphs can only be set
by stretching the interword spaces — which opens visible "rivers" in Spanish,
where words are long. When enabled (``LayoutOptions.hyphenate``) this resolves a
`pyphen` dictionary for the document language and hands the wrapper a callable
that lists a word's break points; the wrapper uses them to fill each line
tighter. It degrades to no hyphenation (never raising) if `pyphen` is missing.
"""
from __future__ import annotations

from typing import Callable

# A hyphenator lists a word's break points as (head, tail) pairs, longest head
# first, e.g. "minimizar" -> [("minimi", "zar"), ("mini", "mizar"), ...].
Hyphenator = Callable[[str], list[tuple[str, str]]]

# Map free-form frontmatter language values onto a pyphen dictionary code.
_LANG_ALIASES = {
    "es": "es", "esp": "es", "espanol": "es", "español": "es",
    "castellano": "es", "spanish": "es", "es-es": "es", "es_es": "es",
    "en": "en_US", "eng": "en_US", "english": "en_US", "ingles": "en_US",
    "inglés": "en_US", "en-us": "en_US", "en_us": "en_US", "en-gb": "en_GB",
    "ca": "ca", "catalan": "ca", "català": "ca",
    "fr": "fr", "french": "fr", "francés": "fr", "frances": "fr",
    "pt": "pt_PT", "portuguese": "pt_PT", "portugués": "pt_PT",
    "de": "de_DE", "german": "de_DE", "aleman": "de_DE", "alemán": "de_DE",
    "it": "it_IT", "italian": "it_IT", "italiano": "it_IT",
}


def _normalize_lang(raw: str | None) -> str:
    if not raw:
        return "es"
    key = raw.strip().lower()
    if key in _LANG_ALIASES:
        return _LANG_ALIASES[key]
    # Fall back to the primary subtag ("es-419" -> "es"); default to Spanish.
    return _LANG_ALIASES.get(key.split("-")[0].split("_")[0], "es")


def resolve_hyphenator(opts, meta: dict) -> Hyphenator | None:
    """Return a hyphenator for the document, or None when disabled/unavailable.

    Language precedence: ``LayoutOptions.hyphenate_lang`` → frontmatter
    ``idioma``/``lang`` → Spanish. Only words of 5+ letters are split, with at
    least two letters kept on each side (pyphen's default), so short words and
    code identifiers are left intact by the wrapper.
    """
    if not getattr(opts, "hyphenate", False):
        return None
    try:
        import pyphen
    except ImportError:
        return None

    raw = getattr(opts, "hyphenate_lang", None) or meta.get("idioma") or meta.get("lang")
    lang = _normalize_lang(raw if isinstance(raw, str) else None)
    try:
        dic = pyphen.Pyphen(lang=lang)
    except Exception:
        try:
            dic = pyphen.Pyphen(lang="es")
        except Exception:
            return None

    def hyphenate(word: str) -> list[tuple[str, str]]:
        return list(dic.iterate(word))

    return hyphenate
