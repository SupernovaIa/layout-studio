"""PDF rendering engine.

Mirrors the rendering logic of the original single-script prototype but reads
all palette/font/layout values from `BrandConfig` and `LayoutOptions` instead
of module-level constants. The visual output for `reference_brand()` should be
identical to that script.
"""

from __future__ import annotations

import colorsys
import re
from dataclasses import dataclass
from pathlib import Path

from reportlab.lib.colors import HexColor, Color
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen.canvas import Canvas

from .code_highlight import background_for as code_background_for
from .code_highlight import highlight as highlight_code
from .config import BrandConfig, LayoutOptions
from .fonts import MONO_BOLD, MONO_REGULAR, font_names, register_brand_fonts, register_mono_fonts
from .hyphenation import resolve_hyphenator
from .theme import Theme


@dataclass(frozen=True)
class _Style:
    """Resolved colors + font names used by the inline helpers."""

    f_regular: str
    f_bold: str
    f_medium: str
    f_italic: str
    c_text: Color
    c_code: Color
    c_link: Color


def _build_style(brand: BrandConfig) -> _Style:
    names = font_names(brand.fonts.family)
    return _Style(
        f_regular=names["regular"],
        f_bold=names["bold"],
        f_medium=names["medium"],
        f_italic=names["italic"],
        c_text=HexColor(brand.colors.text),
        c_code=HexColor(brand.colors.primary_dark),
        c_link=HexColor(brand.colors.primary_mid),
    )


# ---------------------------------------------------------------------------
# Inline tokenizer / line wrap / draw
# ---------------------------------------------------------------------------

# Inline spans, plus the `⟦Fn⟧` marker the web layer injects for inline `$...$`
# math (pre-rasterized to PNG). The marker becomes an image token (see `_IMG`).
_INLINE_RE = re.compile(
    r"(\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|⟦F\d+⟧)"
)

# Captures the label and target of a `[text](url)` inline link.
_LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")

# Sentinel in the `font` slot of an inline token marking it as an image (a
# rasterized formula) rather than text. Its second slot holds the formula spec
# (path/ex dims) plus a cached ImageReader; the text slot is unused.
_IMG = "\x00img"


def _hex_no_hash(h: str) -> str:
    return h.lstrip("#").upper()


def _darken(h: str, factor: float) -> str:
    """Blend a hex color toward black by `factor` (0..1). Returns no-hash hex."""
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    k = 1 - factor
    return "%02X%02X%02X" % (int(r * k), int(g * k), int(b * k))


def _base_hue(h: str) -> float:
    """Hue (0..1) of a hex color, used as the anchor for derived accents."""
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return colorsys.rgb_to_hls(r, g, b)[0]


def _accent(base_hue: float, hue_shift: float, sat: float, light: float) -> str:
    """A color at `base_hue + hue_shift` (turns) with fixed S/L for legibility
    on white. Returns no-hash hex."""
    r, g, b = colorsys.hls_to_rgb((base_hue + hue_shift) % 1.0, light, sat)
    return "%02X%02X%02X" % (round(r * 255), round(g * 255), round(b * 255))


def _parse_inline(
    text: str, style: _Style, formulas: dict | None = None
) -> list[tuple]:
    """Tokenize `[text](url)` links, **bold**, *italic*, `code` and `⟦Fn⟧`.

    Text spans become ``(font, color, text, url)`` where ``url`` is ``None``
    for plain spans and the target for link spans (drawn in the link color and
    turned into a clickable annotation). A formula marker becomes an image
    token ``(_IMG, spec, "", None)`` where ``spec`` carries the PNG path, the
    intrinsic ex dimensions and a cached ImageReader. A marker with no matching
    (or unreadable) formula falls back to literal text so nothing is silently
    dropped.
    """
    formulas = formulas or {}
    tokens: list[tuple] = []
    pos = 0
    for m in _INLINE_RE.finditer(text):
        start, end = m.span()
        if start > pos:
            tokens.append((style.f_regular, style.c_text, text[pos:start], None))
        chunk = m.group(0)
        if chunk.startswith("["):
            link = _LINK_RE.match(chunk)
            tokens.append((style.f_regular, style.c_link, link.group(1), link.group(2)))
        elif chunk.startswith("**"):
            tokens.append((style.f_bold, style.c_text, chunk[2:-2], None))
        elif chunk.startswith("*"):
            tokens.append((style.f_italic, style.c_text, chunk[1:-1], None))
        elif chunk.startswith("`"):
            tokens.append((style.f_medium, style.c_code, chunk[1:-1], None))
        elif chunk.startswith("⟦"):
            spec = _formula_image_spec(chunk[1:-1], formulas)
            if spec is not None:
                tokens.append((_IMG, spec, "", None))
            else:
                tokens.append((style.f_regular, style.c_text, chunk, None))
        pos = end
    if pos < len(text):
        tokens.append((style.f_regular, style.c_text, text[pos:], None))
    return tokens


def _formula_image_spec(fid: str, formulas: dict) -> dict | None:
    """Resolve a formula id to a spec with a cached ImageReader, or None."""
    spec = formulas.get(fid)
    if not spec:
        return None
    if "_reader" not in spec:
        try:
            spec["_reader"] = ImageReader(str(spec["path"]))
        except Exception:
            spec["_reader"] = None
    return spec if spec["_reader"] is not None else None


def _img_dims(spec: dict, size: float) -> tuple[float, float, float]:
    """Inline formula (width, height, depth) in pt at the given font size.

    Mirrors the block sizing (`_FORMULA_EX_EM`) but scales to the *local* text
    size so inline math matches its surrounding line. `depth` is how far the
    glyph extends below the baseline, used to align it with the text baseline.
    """
    ex_pt = size * _FORMULA_EX_EM
    return (
        float(spec.get("ex_w", 0)) * ex_pt,
        float(spec.get("ex_h", 0)) * ex_pt,
        float(spec.get("ex_depth", 0)) * ex_pt,
    )


def _tok_w(c: Canvas, font, color, txt, size: float) -> float:
    """Advance width of one token: image width for `_IMG`, else string width."""
    if font is _IMG:
        return _img_dims(color, size)[0]
    return c.stringWidth(txt, font, size)


def _is_space(token) -> bool:
    """A whitespace text token (never true for an image token)."""
    return token[0] is not _IMG and not token[2].strip()


def _wrap_tokens(
    c: Canvas, tokens: list[tuple], size: float, max_w: float, hyphenate=None
) -> list[list[tuple]]:
    lines: list[list[tuple]] = [[]]
    cur_w = 0.0

    def _try_hyphenate(word, font, color, url) -> bool:
        """When `word` overflows the current line, split it at a hyphenation
        point so the head (plus a hyphen) fills this line and the tail starts the
        next. Returns False when hyphenation is off or no break point fits."""
        nonlocal cur_w
        if hyphenate is None or len(word) < 5:
            return False
        # Only split a run of letters plus optional trailing punctuation
        # ("composición." -> "composición" + "."); leaves code/compounds alone.
        m = re.match(r"^([^\W\d_]{2,})(\W*)$", word, re.UNICODE)
        if not m:
            return False
        core, trailing = m.group(1), m.group(2)
        avail = max_w - cur_w
        for head, tail in hyphenate(core):        # longest head first
            if len(head) < 2 or len(tail) < 1:
                continue
            if c.stringWidth(head + "-", font, size) <= avail:
                lines[-1].append((font, color, head + "-", url))
                rest = tail + trailing
                lines.append([(font, color, rest, url)])
                cur_w = c.stringWidth(rest, font, size)
                return True
        return False

    for font, color, txt, url in tokens:
        # Image tokens (formulas) are indivisible: place as a single unit,
        # wrapping to the next line if they don't fit the current one.
        if font is _IMG:
            iw = _img_dims(color, size)[0]
            if cur_w + iw > max_w and cur_w > 0:
                lines.append([(font, color, txt, url)])
                cur_w = iw
            else:
                lines[-1].append((font, color, txt, url))
                cur_w += iw
            continue
        parts = txt.split("\n")
        for pi, part in enumerate(parts):
            if pi > 0:
                lines.append([])
                cur_w = 0
            words = re.split(r"(\s+)", part)
            for w in words:
                if not w:
                    continue
                ww = c.stringWidth(w, font, size)
                # A single word wider than the whole line can't be wrapped by
                # spaces (e.g. a long inline-code identifier like
                # `sandbox_mode=workspace-write` in a narrow table column).
                # Break it at natural delimiters first (_ - = / . :) so
                # snake_case, kebab and path-like tokens wrap at readable
                # boundaries; fall back to a character break for any chunk still
                # wider than the line. Either way it never overflows into the
                # adjacent column or off the page.
                if ww > max_w and w.strip():
                    chunks = re.findall(r"[^_\-=/.:]+[_\-=/.:]*|[_\-=/.:]+", w.lstrip())
                    for chunk in chunks:
                        cww = c.stringWidth(chunk, font, size)
                        if cww > max_w:
                            if cur_w > 0:
                                lines.append([])
                                cur_w = 0
                            seg = ""
                            seg_w = 0.0
                            for ch in chunk:
                                cw = c.stringWidth(ch, font, size)
                                if seg and seg_w + cw > max_w:
                                    lines[-1].append((font, color, seg, url))
                                    lines.append([])
                                    seg, seg_w = ch, cw
                                else:
                                    seg += ch
                                    seg_w += cw
                            if seg:
                                lines[-1].append((font, color, seg, url))
                                cur_w = seg_w
                        elif cur_w + cww > max_w and cur_w > 0:
                            lines.append([(font, color, chunk, url)])
                            cur_w = cww
                        else:
                            lines[-1].append((font, color, chunk, url))
                            cur_w += cww
                    continue
                if cur_w + ww > max_w and cur_w > 0:
                    ws = w.lstrip()
                    if not ws:
                        lines.append([])
                        cur_w = 0
                    elif not _try_hyphenate(ws, font, color, url):
                        lines.append([(font, color, ws, url)])
                        cur_w = c.stringWidth(ws, font, size)
                else:
                    lines[-1].append((font, color, w, url))
                    cur_w += ww
    return lines


def _draw_token(
    c: Canvas, cx: float, y: float, font, color, txt, size: float, url=None
) -> float:
    """Draw one token at (cx, y); return its advance width."""
    if font is _IMG:
        spec = color
        w, h, depth = _img_dims(spec, size)
        # Align the formula's baseline with the text baseline (`y`): its bottom
        # sits `depth` below the baseline.
        c.drawImage(
            spec["_reader"], cx, y - depth, width=w, height=h,
            mask="auto", preserveAspectRatio=True,
        )
        return w
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawString(cx, y, txt)
    w = c.stringWidth(txt, font, size)
    # Underline + clickable rectangle over the drawn glyphs for link tokens.
    # The underline spans whitespace too (space tokens keep the url) so it stays
    # continuous across multi-word link labels.
    if url:
        uy = y - size * 0.12
        c.setStrokeColor(color)
        c.setLineWidth(max(0.4, size * 0.05))
        c.line(cx, uy, cx + w, uy)
        if txt.strip():
            c.linkURL(url, (cx, y - size * 0.2, cx + w, y + size * 0.8), relative=0)
    return w


def _draw_line(c: Canvas, x: float, y: float, line_tokens, size: float) -> None:
    cx = x
    for font, color, txt, url in line_tokens:
        cx += _draw_token(c, cx, y, font, color, txt, size, url)


def _draw_line_justified(c: Canvas, x: float, y: float, line_tokens, size: float, max_w: float) -> None:
    tokens = list(line_tokens)
    while tokens and _is_space(tokens[-1]):
        tokens.pop()
    if not tokens:
        return

    total_w = sum(_tok_w(c, t[0], t[1], t[2], size) for t in tokens)
    n_spaces = sum(1 for t in tokens if _is_space(t))

    if n_spaces == 0 or total_w >= max_w:
        _draw_line(c, x, y, tokens, size)
        return

    extra_per_space = (max_w - total_w) / n_spaces
    cx = x
    for token in tokens:
        font, color, txt, url = token
        cx += _draw_token(c, cx, y, font, color, txt, size, url)
        if _is_space(token):
            cx += extra_per_space  # stretch spaces to justify


# ---------------------------------------------------------------------------
# Renderer
# ---------------------------------------------------------------------------

# Maps a formula's intrinsic MathJax `ex` units to points, relative to the
# body font size: pt = ex * body_size * _FORMULA_EX_EM. Purely a visual
# calibration knob, not a physical constant. 0.5 validated against display
# math (renders proportionate to 10.5pt body text); tune if body_size changes.
_FORMULA_EX_EM = 0.5


class Renderer:
    def __init__(
        self,
        c: Canvas,
        meta: dict,
        brand: BrandConfig,
        layout: LayoutOptions,
        base_path: Path | None = None,
        formulas: dict | None = None,
    ):
        self.c = c
        self.meta = meta
        self.brand = brand
        self.opts = layout
        # Directory that relative image paths (`![](img.png)`) are resolved
        # against. None means relative images cannot be located.
        self.base_path = Path(base_path) if base_path is not None else None
        # Pre-rasterized math: id -> {"path", "ex_w", "ex_h", "display"}.
        self.formulas = formulas or {}
        self.style = _build_style(brand)
        # Optional word hyphenator (None when disabled or pyphen is unavailable).
        self._hyphenator = resolve_hyphenator(layout, meta)

        # Working palette: a fully-resolved Theme (every role + fallback decided
        # in one place) copied onto mutable attributes.
        theme = Theme.resolve(brand.colors)
        self.col_dark = theme.dark
        self.col_light = theme.light
        self.col_mid = theme.mid
        self.col_text = theme.text
        self.col_text_soft = theme.text_soft
        self.col_line = theme.line
        self.col_bg_soft = theme.bg_soft
        self.col_quote_bg = theme.quote_bg
        self.col_white = theme.white
        self.col_table_header = theme.table_header
        self.col_header_rule = theme.header_rule
        self.col_footer_rule = theme.footer_rule
        self.col_page_number = theme.page_number
        self.col_heading = theme.heading        # h1 / h2
        self.col_heading_h3 = theme.heading_h3  # h3

        # Page geometry shortcuts
        self.W, self.H = layout.page_size
        self.ML = layout.margin_left
        self.MR = layout.margin_right
        self.MT = layout.margin_top
        self.MB = layout.margin_bottom
        self.CW = layout.content_width

        self.y = self.H - self.MT
        self.page_num = 1
        self.draw_header_footer()

    # --- inline helpers as bound methods (for readability) ----------------

    def _tokens(self, text: str):
        return _parse_inline(text, self.style, self.formulas)

    def _wrap(self, tokens, size, max_w):
        return _wrap_tokens(self.c, tokens, size, max_w, self._hyphenator)

    def _draw(self, x, y, line, size):
        _draw_line(self.c, x, y, line, size)

    def _draw_just(self, x, y, line, size, max_w, is_last):
        if self.opts.justify and not is_last:
            _draw_line_justified(self.c, x, y, line, size, max_w)
        else:
            _draw_line(self.c, x, y, line, size)

    # --- chrome -----------------------------------------------------------

    def draw_header_footer(self) -> None:
        c = self.c
        W, H, ML, MR, MB = self.W, self.H, self.ML, self.MR, self.MB

        # Running header: document title (soft grey, mixed case) on the left,
        # page number (brand accent) on the right, thin accent rule below.
        title = (self.meta.get("titulo") or self.meta.get("curso_nombre") or "").strip()
        if len(title) > 70:
            title = title[:69].rstrip() + "…"

        c.setFont(self.style.f_regular, 8.5)
        c.setFillColor(self.col_text_soft)
        c.drawString(ML, H - 32, title)

        c.setFont(self.style.f_bold, 9)
        c.setFillColor(self.col_page_number)
        c.drawRightString(W - MR, H - 32, str(self.page_num))

        c.setStrokeColor(self.col_header_rule)
        c.setLineWidth(0.6)
        c.line(ML, H - 40, W - MR, H - 40)

        logo_drawn = False
        if self.brand.logo_path:
            try:
                img = ImageReader(str(self.brand.logo_path))
                iw, ih = img.getSize()
                target_h = 18
                target_w = iw * target_h / ih
                c.drawImage(
                    img, ML, MB - 30, width=target_w, height=target_h,
                    mask="auto", preserveAspectRatio=True,
                )
                logo_drawn = True
            except Exception:
                logo_drawn = False
        if not logo_drawn and self.brand.logo_fallback_text:
            c.setFont(self.style.f_medium, 8)
            c.setFillColor(self.col_dark)
            c.drawString(ML, MB - 22, self.brand.logo_fallback_text)

        # Co-branding: client logo bottom-right, mirroring the brand logo.
        if self.brand.client_logo_path:
            try:
                img = ImageReader(str(self.brand.client_logo_path))
                iw, ih = img.getSize()
                target_h = 18
                target_w = iw * target_h / ih
                c.drawImage(
                    img, W - MR - target_w, MB - 30, width=target_w, height=target_h,
                    mask="auto", preserveAspectRatio=True,
                )
            except Exception:
                pass

        c.setStrokeColor(self.col_footer_rule)
        c.setLineWidth(0.4)
        c.line(ML, MB - 6, W - MR, MB - 6)

    def new_page(self) -> None:
        self.c.showPage()
        self.page_num += 1
        self.y = self.H - self.MT
        self.draw_header_footer()

    def need_space(self, needed: float) -> None:
        if self.y - needed < self.MB + 12:
            self.new_page()

    # --- block renderers --------------------------------------------------

    def render_h1_doc(self, text: str) -> None:
        self.y -= 22
        c = self.c
        hc = self.col_heading
        lines = self._wrap(self._tokens(text), 24, self.CW)
        for ln in lines:
            for j, (_f, _col, t, u) in enumerate(ln):
                ln[j] = (self.style.f_bold, hc, t, u)

        eyebrow = self.meta.get("eyebrow", "")
        if isinstance(eyebrow, str) and eyebrow.strip():
            c.setFont(self.style.f_medium, 9)
            c.setFillColor(self.col_mid)
            c.drawString(self.ML, self.y, eyebrow.strip())
            self.y -= 28

        for ln in lines:
            self._draw(self.ML, self.y, ln, 24)
            self.y -= 30
        c.setStrokeColor(hc)
        c.setLineWidth(2)
        c.line(self.ML, self.y + 22, self.ML + 60, self.y + 22)
        self.y -= 14

    def render_h1(self, text: str) -> None:
        c = self.c
        hc = self.col_heading
        m = re.match(r"^(\d+(?:\.\d+)*)\.\s*(.+?)(?:\s*\*\([^)]+\)\*)?\s*$", text)
        if m:
            num, title = m.group(1), m.group(2)
        else:
            num, title = None, re.sub(r"\s*\*\([^)]+\)\*\s*$", "", text)

        if num:
            num_str = f"{num}."
            num_w = c.stringWidth(num_str, self.style.f_bold, self.opts.h1_size)
            text_x = self.ML + num_w + 10
            title_size = self.opts.h1_size
        else:
            num_str = None
            text_x = self.ML + 14
            title_size = 18

        avail = (self.W - self.MR) - text_x
        lines = self._wrap(self._tokens(title), title_size, avail)
        for ln in lines:
            for j, (_f, _col, t, u) in enumerate(ln):
                ln[j] = (self.style.f_bold, hc, t, u)
        line_h = title_size + 8

        # Keep the heading with its content: reserve room for the heading plus a
        # few lines of whatever follows, so a section title never sits orphaned
        # at the bottom of a page while its body starts on the next one.
        keep_with_next = 4 * self.opts.body_lead
        self.need_space(60 + self.opts.body_lead + (len(lines) - 1) * line_h + keep_with_next)
        self.y -= 24

        if num_str is not None:
            c.setFont(self.style.f_bold, self.opts.h1_size)
            c.setFillColor(hc)
            c.drawString(self.ML, self.y - 6, num_str)
        else:
            c.setFillColor(hc)
            c.rect(self.ML, self.y - 8, 4, 16, fill=1, stroke=0)

        for i, ln in enumerate(lines):
            self._draw(text_x, self.y - 6, ln, title_size)
            if i < len(lines) - 1:
                self.y -= line_h

        self.y -= 13
        c.setStrokeColor(self.col_light)
        c.setLineWidth(0.8)
        c.line(self.ML, self.y, self.W - self.MR, self.y)
        self.y -= 23

    def render_h2(self, text: str) -> None:
        hc = self.col_heading
        lines = self._wrap(self._tokens(text), self.opts.h2_size, self.CW)
        for ln in lines:
            for j, (_f, _col, t, u) in enumerate(ln):
                ln[j] = (self.style.f_bold, hc, t, u)
        self.need_space(36 + self.opts.body_lead + (len(lines) - 1) * 18 + 3 * self.opts.body_lead)
        self.y -= 16
        for ln in lines:
            self._draw(self.ML, self.y, ln, self.opts.h2_size)
            self.y -= 18

    def render_h3(self, text: str) -> None:
        hc = self.col_heading_h3
        lines = self._wrap(self._tokens(text), self.opts.h3_size, self.CW)
        for ln in lines:
            for j, (_f, _col, t, u) in enumerate(ln):
                ln[j] = (self.style.f_medium, hc, t, u)
        self.need_space(26 + self.opts.body_lead + (len(lines) - 1) * 14 + 3 * self.opts.body_lead)
        self.y -= 10
        for ln in lines:
            self._draw(self.ML, self.y, ln, self.opts.h3_size)
            self.y -= 14

    def render_p(self, text: str) -> None:
        lines = self._wrap(self._tokens(text), self.opts.body_size, self.CW)
        for i, ln in enumerate(lines):
            self.need_space(self.opts.body_lead + 2)
            self._draw_just(self.ML, self.y, ln, self.opts.body_size, self.CW, i == len(lines) - 1)
            self.y -= self.opts.body_lead
        self.y -= 8

    def render_blockquote(self, qlines: list[str]) -> None:
        c = self.c
        text = "\n".join(qlines).strip()
        if not text:
            return
        paragraphs = [p for p in text.split("\n") if p.strip()]
        all_lines = [
            self._wrap(self._tokens(p), self.opts.body_size, self.CW - 36)
            for p in paragraphs
        ]
        total_lines = sum(len(ls) for ls in all_lines)
        gaps = max(0, len(paragraphs) - 1) * 6
        box_h = total_lines * self.opts.body_lead + 24 + gaps

        self.need_space(box_h + 6)
        y_top = self.y
        y_bottom = self.y - box_h
        c.setFillColor(self.col_quote_bg)
        c.roundRect(self.ML, y_bottom, self.CW, box_h, 4, fill=1, stroke=0)
        c.setFillColor(self.col_dark)
        c.rect(self.ML, y_bottom, 3, box_h, fill=1, stroke=0)

        ty = y_top - 16
        for idx, ls in enumerate(all_lines):
            for li, ln in enumerate(ls):
                self._draw_just(
                    self.ML + 18, ty, ln, self.opts.body_size, self.CW - 36,
                    li == len(ls) - 1,
                )
                ty -= self.opts.body_lead
            if idx < len(all_lines) - 1:
                ty -= 6
        self.y = y_bottom - 14

    def render_callout(self, label: str, lines: list[str]) -> None:
        """Labeled "copy to Claude" box: a header tag plus the prompt text
        verbatim. Body is proportional and word-wrapped (so long Spanish prose
        reads well) while preserving the source line breaks (numbered steps,
        a/b/c sub-items). Paginates across pages for long prompts.
        """
        c = self.c
        size = self.opts.body_size
        lead = self.opts.body_lead
        pad = 16
        label_h = 18 if label else 0

        # Pre-wrap: each source line becomes wrapped sub-lines; blank source
        # lines become gap markers.
        units: list[tuple[str, object]] = []
        for raw in lines:
            if not raw.strip():
                units.append(("gap", None))
                continue
            for wl in self._wrap(self._tokens(raw.strip()), size, self.CW - 2 * pad):
                units.append(("line", wl))

        gap_h = 5.0
        bottom = self.MB + 12
        idx = 0
        first = True
        while idx < len(units):
            avail = self.y - bottom
            head_h = pad + (label_h if first else 0)
            used = head_h
            seg: list[tuple[str, object]] = []
            j = idx
            while j < len(units):
                h = lead if units[j][0] == "line" else gap_h
                if seg and used + h + pad > avail:
                    break
                used += h
                seg.append(units[j])
                j += 1
            if not seg:
                self.new_page()
                continue

            box_h = used + pad
            y_top = self.y
            y_bottom = y_top - box_h
            c.setFillColor(self.col_quote_bg)
            c.roundRect(self.ML, y_bottom, self.CW, box_h, 4, fill=1, stroke=0)
            c.setFillColor(self.col_mid)
            c.rect(self.ML, y_bottom, 3, box_h, fill=1, stroke=0)

            ty = y_top - pad
            if first and label:
                c.setFont(self.style.f_bold, 8)
                c.setFillColor(self.col_mid)
                c.drawString(self.ML + pad, ty - 4, label.upper())
                ty -= label_h
            ty -= size
            for kind, payload in seg:
                if kind == "gap":
                    ty -= gap_h
                    continue
                self._draw(self.ML + pad, ty, payload, size)
                ty -= lead

            self.y = y_bottom - 14
            idx = j
            first = False
            if idx < len(units):
                self.new_page()

    def render_checklist(self, items: list) -> None:
        """Do/don't list: ✅/❌ lines from the source rendered as a hanging
        list with coloured markers. The brand body font (Poppins) has no glyph
        for the emoji, so we strip them in the parser and draw our own ✓/✗ from
        JetBrains Mono (which covers them): brand green for ok, classic red for
        not-ok.
        """
        register_mono_fonts()  # ensure the mono font is registered for code blocks
        c = self.c
        size = self.opts.body_size
        lead = self.opts.body_lead
        marker_x = self.ML + 2
        text_x = self.ML + 20
        text_w = self.CW - 20
        col_no = HexColor("#D64541")  # classic red
        for item in items:
            ok = item.get("ok", True)
            glyph = "✓" if ok else "✗"
            col = self.col_light if ok else col_no  # brand green / classic red
            lines = self._wrap(self._tokens(item["text"]), size, text_w)
            self.need_space(lead + 2)
            c.setFont(MONO_BOLD, size)
            c.setFillColor(col)
            c.drawString(marker_x, self.y, glyph)
            for idx, ln in enumerate(lines):
                if idx > 0:
                    self.need_space(lead + 2)
                self._draw_just(
                    text_x, self.y, ln, size, text_w, idx == len(lines) - 1,
                )
                self.y -= lead
            self.y -= 3
        self.y -= 8

    def render_ul(self, items: list) -> None:
        c = self.c
        for item in items:
            if isinstance(item, str):
                text, children = item, []
            else:
                text, children = item["text"], item.get("children", [])

            lines = self._wrap(self._tokens(text), self.opts.body_size, self.CW - 22)
            self.need_space(self.opts.body_lead + 2)
            c.setFillColor(self.col_dark)
            c.circle(self.ML + 5, self.y + 4, 2, fill=1, stroke=0)
            for idx, ln in enumerate(lines):
                if idx > 0:
                    self.need_space(self.opts.body_lead + 2)
                self._draw_just(
                    self.ML + 16, self.y, ln, self.opts.body_size, self.CW - 22,
                    idx == len(lines) - 1,
                )
                self.y -= self.opts.body_lead
            for child in children:
                clines = self._wrap(self._tokens(child), self.opts.body_size, self.CW - 44)
                self.need_space(self.opts.body_lead + 2)
                c.setFillColor(self.col_mid)
                c.circle(self.ML + 24, self.y + 4, 1.6, fill=1, stroke=0)
                for cidx, cln in enumerate(clines):
                    if cidx > 0:
                        self.need_space(self.opts.body_lead + 2)
                    self._draw_just(
                        self.ML + 34, self.y, cln, self.opts.body_size, self.CW - 44,
                        cidx == len(clines) - 1,
                    )
                    self.y -= self.opts.body_lead
            self.y -= 4
        self.y -= 8

    def render_ol(self, items: list[str]) -> None:
        c = self.c
        for idx, item in enumerate(items, 1):
            lines = self._wrap(self._tokens(item), self.opts.body_size, self.CW - 26)
            self.need_space(self.opts.body_lead + 4)
            c.setFont(self.style.f_bold, self.opts.body_size)
            c.setFillColor(self.col_dark)
            c.drawString(self.ML, self.y, f"{idx}.")
            for li, ln in enumerate(lines):
                if li > 0:
                    self.need_space(self.opts.body_lead + 2)
                self._draw_just(
                    self.ML + 20, self.y, ln, self.opts.body_size, self.CW - 26,
                    li == len(lines) - 1,
                )
                self.y -= self.opts.body_lead
            self.y -= 4
        self.y -= 8

    def render_table(self, header: list[str], rows: list[list[str]]) -> None:
        c = self.c
        n_cols = len(header)
        col_w = self.CW / n_cols
        col_widths = [col_w] * n_cols
        last_is_num = re.search(r"(h|%|hora|peso|tiempo)", header[-1].lower()) is not None
        if last_is_num and n_cols >= 2:
            col_widths[-1] = self.CW * 0.18
            remaining = self.CW - col_widths[-1]
            for k in range(n_cols - 1):
                col_widths[k] = remaining / (n_cols - 1)

        def _row_height(row: list[str]) -> float:
            max_lines = 1
            for j, cell in enumerate(row):
                if j >= n_cols:
                    break
                wlines = self._wrap(self._tokens(cell), 9.5, col_widths[j] - 20)
                max_lines = max(max_lines, len(wlines))
            return max(20, max_lines * 14 + 8)

        # Wrap header cells to their column width so long labels (e.g. "Agent
        # Platform" in a 6-column table) never overflow the page edge.
        header_size = 9.5
        header_lines = [
            self._wrap([(self.style.f_medium, self.col_white, h, None)], header_size, col_widths[j] - 20)
            for j, h in enumerate(header)
        ]
        header_max_lines = max((len(hl) for hl in header_lines), default=1)
        row_h_header = max(24, header_max_lines * 13 + 8)

        center_header = getattr(self, "_table_center_header", False)

        def _draw_header() -> None:
            y_top = self.y
            c.setFillColor(self.col_table_header)
            c.rect(self.ML, y_top - row_h_header, self.CW, row_h_header, fill=1, stroke=0)
            cx = self.ML
            for j, hlines in enumerate(header_lines):
                ty = y_top - 16
                for ln in hlines:
                    if j == n_cols - 1 and last_is_num:
                        total_w = sum(c.stringWidth(t[2], t[0], header_size) for t in ln)
                        self._draw(cx + col_widths[j] - 10 - total_w, ty, ln, header_size)
                    elif center_header:
                        total_w = sum(c.stringWidth(t[2], t[0], header_size) for t in ln)
                        self._draw(cx + (col_widths[j] - total_w) / 2, ty, ln, header_size)
                    else:
                        self._draw(cx + 10, ty, ln, header_size)
                    ty -= 13
                cx += col_widths[j]
            self.y = y_top - row_h_header

        # Ensure header + the actual first data row fit together (no orphan header)
        first_row_h = _row_height(rows[0]) if rows else 24
        self.need_space(row_h_header + first_row_h + 2)
        _draw_header()

        for ridx, row in enumerate(rows):
            wrapped_cells = []
            for j, cell in enumerate(row):
                if j >= n_cols:
                    break
                wlines = self._wrap(self._tokens(cell), 9.5, col_widths[j] - 20)
                wrapped_cells.append(wlines)
            max_lines = max((len(wl) for wl in wrapped_cells), default=1)
            row_h = max(20, max_lines * 14 + 8)

            # The first data row is already guaranteed to fit with the header,
            # so skip its space check to avoid orphaning the header.
            if ridx > 0:
                page_before = self.page_num
                self.need_space(row_h + 2)
                if self.page_num != page_before:
                    _draw_header()
            if ridx % 2 == 1:
                c.setFillColor(self.col_bg_soft)
                c.rect(self.ML, self.y - row_h, self.CW, row_h, fill=1, stroke=0)

            cx = self.ML
            for j, wlines in enumerate(wrapped_cells):
                ty = self.y - 14
                for ln in wlines:
                    if j == n_cols - 1 and last_is_num:
                        total_w = sum(c.stringWidth(t[2], t[0], 9.5) for t in ln)
                        x_draw = cx + col_widths[j] - 10 - total_w
                        self._draw(x_draw, ty, ln, 9.5)
                    else:
                        self._draw(cx + 10, ty, ln, 9.5)
                    ty -= 14
                cx += col_widths[j]
            self.y -= row_h
            c.setStrokeColor(self.col_line)
            c.setLineWidth(0.4)
            c.line(self.ML, self.y, self.W - self.MR, self.y)

        self.y -= 14

    def render_quiz(self, question: str, options: list[str]) -> None:
        c = self.c
        qlines = self._wrap(self._tokens(question), self.opts.body_size, self.CW - 24)
        self.need_space(self.opts.body_lead * (len(qlines) + len(options)) + 12)
        c.setFillColor(self.col_dark)
        c.rect(self.ML, self.y - 2, 3, self.opts.body_lead - 4, fill=1, stroke=0)
        for idx, ln in enumerate(qlines):
            if idx > 0:
                self.need_space(self.opts.body_lead + 2)
            self._draw_just(
                self.ML + 12, self.y, ln, self.opts.body_size, self.CW - 24,
                idx == len(qlines) - 1,
            )
            self.y -= self.opts.body_lead
        self.y -= 2
        for opt in options:
            olines = self._wrap(self._tokens(opt), self.opts.body_size, self.CW - 32)
            self.need_space(self.opts.body_lead + 2)
            for oi, oln in enumerate(olines):
                if oi > 0:
                    self.need_space(self.opts.body_lead + 2)
                self._draw(self.ML + 20, self.y, oln, self.opts.body_size)
                self.y -= self.opts.body_lead
        self.y -= 6

    def _resolve_image(self, src: str) -> Path | None:
        """Map a markdown `src` to a readable filesystem path, or None.

        Remote/data URIs are not fetched here (no network in the Pyodide
        sandbox); the web layer is expected to stage local files into the FS
        and pass `base_path`.
        """
        if not src or src.startswith(("http://", "https://", "data:")):
            return None
        p = Path(src)
        if not p.is_absolute() and self.base_path is not None:
            p = self.base_path / src
        return p

    def render_image(self, alt: str, src: str) -> None:
        """Standalone image, drawn at its native size, scaled down to fit the
        content column (and a single page) while preserving aspect ratio.

        On any failure to load, a soft note with the alt text is rendered so a
        missing image is visible to the author instead of silently dropped.
        """
        c = self.c
        path = self._resolve_image(src)
        img = None
        if path is not None:
            try:
                img = ImageReader(str(path))
            except Exception:
                img = None
        if img is None:
            note = alt.strip() or src
            self.render_p(f"*[imagen no disponible: {note}]*")
            return

        iw, ih = img.getSize()
        if iw <= 0 or ih <= 0:
            return

        # Native px → pt (ReportLab's user space is 72 dpi), capped to the
        # content width and to one full content page height.
        w, h = float(iw), float(ih)
        if w > self.CW:
            s = self.CW / w
            w, h = w * s, h * s
        max_h = self.H - self.MT - self.MB - 24
        if h > max_h:
            s = max_h / h
            w, h = w * s, h * s

        gap = 8
        if self.y - (h + gap) < self.MB + 12:
            self.new_page()

        x = self.ML + (self.CW - w) / 2  # center within the content column
        self.y -= h
        c.drawImage(
            img, x, self.y, width=w, height=h,
            mask="auto", preserveAspectRatio=True,
        )
        self.y -= gap + 6

    def render_formula(self, fid: str) -> None:
        """Display (`$$...$$`) formula pre-rasterized to PNG by the web layer.

        Sized from its intrinsic `ex` dimensions relative to `body_size`,
        centered in the content column and scaled down if it would overflow the
        width. Falls back to a soft note if the PNG is missing.
        """
        c = self.c
        spec = self.formulas.get(fid)
        img = None
        if spec:
            try:
                img = ImageReader(str(spec["path"]))
            except Exception:
                img = None
        if img is None:
            self.render_p(f"*[fórmula no disponible: {fid}]*")
            return

        ex_pt = self.opts.body_size * _FORMULA_EX_EM
        w = float(spec.get("ex_w", 0)) * ex_pt
        h = float(spec.get("ex_h", 0)) * ex_pt
        if w <= 0 or h <= 0:  # missing dims: fall back to native px (72 dpi)
            iw, ih = img.getSize()
            w, h = float(iw), float(ih)
        if w > self.CW:
            s = self.CW / w
            w, h = w * s, h * s

        gap = 8
        if self.y - (h + gap) < self.MB + 12:
            self.new_page()
        x = self.ML + (self.CW - w) / 2  # center within the content column
        self.y -= h
        c.drawImage(
            img, x, self.y, width=w, height=h,
            mask="auto", preserveAspectRatio=True,
        )
        self.y -= gap + 6

    def render_hr(self) -> None:
        self.y -= 8

    def _brand_code_palette(self) -> dict[str, tuple[str, bool]]:
        """Tonal syntax palette derived from the brand colors.

        Maps token categories (see `_BRAND_TOKEN_ORDER`) to
        ``(hex_without_hash, bold)``. Strings use a darkened tint of the light
        accent so they stay legible on a white background.
        """
        cols = self.brand.colors
        # Anchor on the brand hue, then rotate it for each category so tokens
        # are visibly distinct (teal keywords, indigo functions, green
        # builtins, warm strings/numbers) while still harmonizing with the
        # brand. S/L are fixed for legible contrast on a white background.
        h = _base_hue(cols.primary_mid)
        return {
            "keyword": (_accent(h, 0.00, 0.55, 0.33), True),
            "func": (_accent(h, 0.16, 0.50, 0.42), True),
            "builtin": (_accent(h, -0.08, 0.50, 0.38), False),
            "string": (_accent(h, 0.45, 0.50, 0.45), False),
            "number": (_accent(h, 0.55, 0.55, 0.42), False),
            "comment": (_hex_no_hash(cols.text_soft), False),
            "operator": (_hex_no_hash(cols.text), False),
        }

    def render_code(self, lang: str, text: str) -> None:
        """Fenced code block with Pygments-driven syntax highlighting.

        Uses the bundled JetBrains Mono TTF (full Unicode coverage) so any
        character — including non-Latin scripts — renders correctly. Tokens
        are split into lines and char-wrapped to the box width.
        """
        # An empty fenced block (``` ```) carries no content; rendering it would
        # leave a stray empty box on the page. Skip it entirely.
        if not text.strip():
            return

        c = self.c
        font = MONO_REGULAR
        font_bold = MONO_BOLD
        size = 9
        line_h = 13
        pad = 14

        # Resolve theme: editor-style dark block vs. calm light block.
        brand_palette = None
        if self.opts.code_dark:
            style_name = self.opts.code_style or "monokai"
            theme_bg = code_background_for(style_name)
            col_box_bg = HexColor(theme_bg) if theme_bg else HexColor("#22272E")
            col_box_bar = self.col_light
            col_box_default = HexColor("#E6E6E6")
            col_box_label = HexColor("#9DB0B8")
            col_box_border = None  # dark box stands out on its own
        else:
            style_name = self.opts.code_style or "friendly"
            # Default light look is a clean white box with a thin border so it
            # reads as a block on the white page; an explicit light theme uses
            # its own background instead.
            theme_bg = code_background_for(style_name) if self.opts.code_style else None
            col_box_bg = HexColor(theme_bg) if theme_bg else self.col_white
            col_box_bar = self.col_mid
            col_box_default = self.col_text
            col_box_label = self.col_text_soft
            col_box_border = self.col_line
            # Default light blocks recolor syntax from the brand palette (tonal)
            # instead of the Pygments theme.
            if not self.opts.code_style:
                brand_palette = self._brand_code_palette()

        # Tokenize → flat (color, bold, text) chunks → split at newlines into
        # per-line lists.
        chunks = highlight_code(text, lang, style_name, brand_palette)
        lines: list[list[tuple[str | None, bool, str]]] = [[]]
        for color, bold, txt in chunks:
            parts = txt.split("\n")
            for pi, part in enumerate(parts):
                if pi > 0:
                    lines.append([])
                if part:
                    lines[-1].append((color, bold, part))

        # Char-wrap each line. JetBrains Mono is monospace, so character count
        # maps cleanly to width.
        max_w = self.CW - 2 * pad
        char_w = c.stringWidth("M", font, size)
        max_chars = max(1, int(max_w / char_w))

        wrapped: list[list[tuple[str | None, bool, str]]] = []
        for line in lines:
            if not line:
                wrapped.append([])
                continue
            cur: list[tuple[str | None, bool, str]] = []
            cur_len = 0
            for color, bold, txt in line:
                remaining = txt
                while cur_len + len(remaining) > max_chars:
                    take = max_chars - cur_len
                    if take > 0:
                        cur.append((color, bold, remaining[:take]))
                    wrapped.append(cur)
                    cur = []
                    cur_len = 0
                    remaining = remaining[take:]
                if remaining:
                    cur.append((color, bold, remaining))
                    cur_len += len(remaining)
            wrapped.append(cur)

        # Paginate: a code block taller than the page must split across pages,
        # otherwise the overflow is drawn off-page and the content is silently
        # lost. We emit one box per page segment; the language label only goes
        # on the first segment.
        label_h = 14 if lang else 0

        # Keep-together: if the whole block doesn't fit in the space left on the
        # current page but would fit on a fresh one, move it down rather than
        # splitting it (which would orphan a line or two of code in a tiny box).
        full_h = len(wrapped) * line_h + 2 * pad + label_h
        page_avail = (self.H - self.MT) - (self.MB + 12)
        if full_h > (self.y - (self.MB + 12)) and full_h <= page_avail:
            self.new_page()

        min_tail = 2  # never leave fewer than this many code lines on a page
        idx = 0
        first = True
        while idx < len(wrapped):
            seg_label_h = label_h if first else 0
            # Lines that fit between the current y and the bottom margin.
            avail_h = self.y - (self.MB + 12) - 2 * pad - seg_label_h
            seg_max = int(avail_h // line_h)
            if seg_max < 1:
                # Not even one line fits here — start a fresh page.
                self.new_page()
                continue

            seg_count = min(seg_max, len(wrapped) - idx)
            # Widow control: if splitting here would leave a tiny tail on the
            # next page, pull a few lines down so the tail keeps at least
            # `min_tail` lines.
            remaining_after = len(wrapped) - idx - seg_count
            if 0 < remaining_after < min_tail:
                seg_count = max(1, seg_count - (min_tail - remaining_after))

            seg = wrapped[idx:idx + seg_count]
            idx += len(seg)

            seg_box_h = len(seg) * line_h + 2 * pad + seg_label_h
            y_top = self.y
            y_bottom = y_top - seg_box_h

            c.setFillColor(col_box_bg)
            if col_box_border is not None:
                c.setStrokeColor(col_box_border)
                c.setLineWidth(0.6)
                c.roundRect(self.ML, y_bottom, self.CW, seg_box_h, 5, fill=1, stroke=1)
            else:
                c.roundRect(self.ML, y_bottom, self.CW, seg_box_h, 5, fill=1, stroke=0)
            c.setFillColor(col_box_bar)
            c.rect(self.ML, y_bottom, 3, seg_box_h, fill=1, stroke=0)

            if first and lang:
                c.setFont(self.style.f_medium, 7.5)
                c.setFillColor(col_box_label)
                c.drawRightString(self.ML + self.CW - pad, y_top - 12, lang.upper())

            ty = y_top - pad - size - seg_label_h + 4
            for line_chunks in seg:
                cx = self.ML + pad
                for color, bold, txt in line_chunks:
                    f = font_bold if bold else font
                    c.setFont(f, size)
                    c.setFillColor(HexColor(f"#{color}") if color else col_box_default)
                    c.drawString(cx, ty, txt)
                    cx += c.stringWidth(txt, f, size)
                ty -= line_h

            self.y = y_bottom - 12
            first = False
            if idx < len(wrapped):
                self.new_page()

    # --- dispatcher -------------------------------------------------------

    def render_blocks(self, blocks: list[dict]) -> None:
        for blk in blocks:
            t = blk["type"]
            if t == "h1_doc":
                self.render_h1_doc(blk["text"])
            elif t == "h1":
                self.render_h1(blk["text"])
            elif t == "h2":
                self.render_h2(blk["text"])
            elif t == "h3":
                self.render_h3(blk["text"])
            elif t == "p":
                self.render_p(blk["text"])
            elif t == "blockquote":
                self.render_blockquote(blk["lines"])
            elif t == "ul":
                self.render_ul(blk["items"])
            elif t == "ol":
                self.render_ol(blk["items"])
            elif t == "table":
                self.render_table(blk["header"], blk["rows"])
            elif t == "quiz":
                self.render_quiz(blk["question"], blk["options"])
            elif t == "image":
                self.render_image(blk.get("alt", ""), blk["src"])
            elif t == "formula":
                self.render_formula(blk["id"])
            elif t == "code":
                self.render_code(blk.get("lang", ""), blk["text"])
            elif t == "callout":
                self.render_callout(blk.get("label", ""), blk["lines"])
            elif t == "checklist":
                self.render_checklist(blk["items"])
            elif t == "hr":
                self.render_hr()


def render_blocks_to_canvas(
    c: Canvas,
    meta: dict,
    blocks: list[dict],
    brand: BrandConfig,
    layout: LayoutOptions,
    base_path: Path | None = None,
    formulas: dict | None = None,
) -> None:
    """Register the brand's fonts and run the renderer onto an open Canvas."""
    register_brand_fonts(brand.fonts)
    register_mono_fonts()
    r = Renderer(c, meta, brand, layout, base_path, formulas)
    r.render_blocks(blocks)
