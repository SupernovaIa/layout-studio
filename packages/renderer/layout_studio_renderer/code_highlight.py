"""Syntax highlighting for fenced code blocks via Pygments.

Returns a flat list of `(color_hex_or_None, bold, text)` chunks. The renderer
splits these into lines and char-wraps them to fit the box width.
"""

from __future__ import annotations

from pygments import lex
from pygments.lexers import get_lexer_by_name, guess_lexer
from pygments.styles import get_style_by_name
from pygments.token import Comment, Keyword, Name, Number, Operator, String, Token
from pygments.util import ClassNotFound

# Token type → key, in priority order (most specific first). Used to map a
# Pygments token onto a brand-derived color when `brand_palette` is supplied.
_BRAND_TOKEN_ORDER = [
    (Comment, "comment"),
    (Keyword, "keyword"),
    (String, "string"),
    (Number, "number"),
    (Name.Decorator, "func"),
    (Name.Function, "func"),
    (Name.Class, "func"),
    (Name.Builtin, "builtin"),
    (Operator, "operator"),
]

# Default light theme: reads well over a pale background and matches the calm
# aesthetic of the rest of the document. The renderer may request a dark theme
# (e.g. "one-dark") for editor-style code blocks. Styles are cached by name.
_DEFAULT_STYLE = "friendly"
_STYLE_CACHE: dict[str, object] = {}


def _get_style(name: str):
    style = _STYLE_CACHE.get(name)
    if style is None:
        try:
            style = get_style_by_name(name)
        except ClassNotFound:
            style = get_style_by_name(_DEFAULT_STYLE)
        _STYLE_CACHE[name] = style
    return style


def background_for(style_name: str) -> str | None:
    """The Pygments theme's own background color (e.g. "#282c34"), or None."""
    return getattr(_get_style(style_name), "background_color", None)


def _normalize_lang(lang: str) -> str:
    if not lang:
        return ""
    return lang.strip().lower()


def _brand_lookup(
    tok_type, palette: dict[str, tuple[str, bool]]
) -> tuple[str | None, bool]:
    """Map a Pygments token onto a brand color via `_BRAND_TOKEN_ORDER`.

    Returns ``(hex_without_hash, bold)`` or ``(None, False)`` when no category
    matches (the renderer then paints it with the box's default text color).
    """
    for tok_cat, key in _BRAND_TOKEN_ORDER:
        if tok_type in tok_cat and key in palette:
            return palette[key]
    return None, False


def highlight(
    code: str,
    lang: str,
    style_name: str = _DEFAULT_STYLE,
    brand_palette: dict[str, tuple[str, bool]] | None = None,
) -> list[tuple[str | None, bool, str]]:
    """Tokenize `code` and return styled chunks.

    `style_name` selects the Pygments color theme (falls back to the default
    light theme if unknown). When `brand_palette` is given (a mapping of
    category → (hex_without_hash, bold)), token colors come from the brand
    palette instead of the Pygments theme. Tabs are expanded to four spaces
    because ReportLab's Courier doesn't render tab stops in a way that matches
    typical editor layouts.
    """
    _style = _get_style(style_name)
    code = code.expandtabs(4)

    lexer = None
    norm_lang = _normalize_lang(lang)
    if norm_lang:
        try:
            lexer = get_lexer_by_name(norm_lang, stripnl=False)
        except ClassNotFound:
            lexer = None
    if lexer is None and code.strip():
        try:
            lexer = guess_lexer(code)
        except ClassNotFound:
            lexer = None

    if lexer is None:
        return [(None, False, code)]

    out: list[tuple[str | None, bool, str]] = []
    for tok_type, txt in lex(code, lexer):
        if not txt:
            continue
        if brand_palette is not None:
            color, bold = _brand_lookup(tok_type, brand_palette)
        else:
            # `style_for_token` raises KeyError for token types the style
            # doesn't know (some lexers — notably YAML — emit tokens like
            # `Token.Literal.Scalar.Plain` that aren't in every style's table).
            # Fall back to the default color so the chunk still renders.
            try:
                s = _style.style_for_token(tok_type)
            except KeyError:
                s = {}
            color = s.get("color") or None
            bold = bool(s.get("bold"))
        out.append((color, bold, txt))
    return out


def is_token_whitespace(token_type) -> bool:
    return token_type in Token.Text or token_type in Token.Whitespace
