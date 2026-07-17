"""Editorial book layout (Prometeo line) on top of the base ReportLab renderer.

Adds the full-book chrome the WeasyPrint skill produces: a bleed cover, an
auto-generated index with real page numbers (two-pass), section dividers
("portadillas"), per-page isotipo + folio, green heading hierarchy with a
terracota "SECCIÓN N" kicker, and Ayu Mirage dark code blocks. Enabled per
render via ``LayoutOptions.editorial`` (driven by the Prometeo brand).

The cover wordmark and the isotipo are drawn as vectors/text so no extra image
assets need to be shipped or staged.
"""
from __future__ import annotations

import io
import re
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from .code_highlight import highlight as highlight_code
from .config import BrandConfig, LayoutOptions
from .fonts import font_names, register_brand_fonts
from .renderer import Renderer

# Ayu Mirage syntax palette (category -> (hex_no_hash, bold)) — matches the skill.
_AYU = {
    "keyword": ("FFA759", False),
    "func": ("FFD580", False),
    "builtin": ("FFD580", False),
    "string": ("BAE67E", False),
    "number": ("FFCC66", False),
    "comment": ("5C6773", False),
    "operator": ("FFCC66", False),
}
_AYU_BG = "#1F2430"
_AYU_BAR = "#1A1F2B"
_AYU_FG = "#CBCCC6"
_AYU_LABEL = "#FFCC66"

_CREMA = "#FEFAF3"
_TABLA = "#CBDECF"


def _norm(s: str) -> str:
    s = s.lower().strip()
    for a, b in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u")):
        s = s.replace(a, b)
    return s


class EditorialRenderer(Renderer):
    def __init__(self, c, meta, brand, layout, base_path=None, formulas=None,
                 toc=None, toc_offset=0, with_index=True):
        # Set page-kind before super().__init__ runs (it calls draw_header_footer).
        self._page_kind = "cover"
        self._toc_offset = toc_offset
        self._with_index = with_index
        self._collect = toc is None          # measure pass collects TOC entries
        self.toc = toc if toc is not None else []
        self._sec_no = 0
        super().__init__(c, meta, brand, layout, base_path, formulas)
        self.col_crema = HexColor(_CREMA)
        self.col_tabla = HexColor(_TABLA)
        names = font_names(brand.fonts.family)
        self._f_light = names["light"]
        self._mono = names["mono"] if brand.fonts.mono is not None else "Courier"
        self._mono_bold = self._mono if brand.fonts.mono is not None else "Courier-Bold"

    # ---- chrome -----------------------------------------------------------
    def _tracked(self, x, y, text, font, size, color, track):
        """drawString with manual letter-spacing; returns the drawn width."""
        c = self.c
        c.setFont(font, size)
        c.setFillColor(color)
        cx = x
        for ch in text:
            c.drawString(cx, y, ch)
            cx += c.stringWidth(ch, font, size) + track
        return max(0.0, cx - track - x)

    def _draw_isotipo(self, color, x_right, y_top):
        c = self.c
        bw, bh, gap = 17, 3.0, 4.0
        c.setFillColor(color)
        for i in range(3):
            c.rect(x_right - bw, y_top - i * (bh + gap), bw, bh, fill=1, stroke=0)

    def draw_header_footer(self) -> None:
        kind = getattr(self, "_page_kind", "content")
        if kind in ("cover", "divider"):
            return                                  # full-bleed pages: no chrome
        # isotipo top-right, aligned to the content right edge
        self._draw_isotipo(self.col_dark, self.W - self.MR, self.H - self.MT + 24)
        if kind != "index":                         # the index has no folio
            c = self.c
            c.setFont(self.style.f_medium, 9)
            c.setFillColor(self.col_dark)
            c.drawRightString(self.W - self.MR, self.MB - 22, str(self.page_num))

    def _start_page(self, kind: str) -> None:
        self.c.showPage()
        self.page_num += 1
        self._page_kind = kind
        self.y = self.H - self.MT
        self.draw_header_footer()

    # ---- cover ------------------------------------------------------------
    def _draw_wordmark(self, x, y, color, scale=1.0):
        c = self.c
        size = 17 * scale
        w = self._tracked(x, y, "MI MARCA", self._f_light, size, color, 4 * scale)
        c.setFont(self.style.f_regular, 8 * scale)
        c.setFillColor(color)
        c.drawRightString(x + w, y - 11 * scale, "")

    def _cover_photo(self, area):
        ax, ay, aw, ah = area
        c = self.c
        src = self.meta.get("foto_portada") or self.meta.get("cover")
        img = None
        if src:
            p = self._resolve_image(str(src))
            if p is not None:
                try:
                    img = ImageReader(str(p))
                except Exception:
                    img = None
        if img is None:
            c.setFillColor(HexColor("#1D3326"))
            c.rect(ax, ay, aw, ah, fill=1, stroke=0)
            return
        iw, ih = img.getSize()
        s = max(aw / iw, ah / ih)
        dw, dh = iw * s, ih * s
        dx, dy = ax - (dw - aw) / 2, ay - (dh - ah) / 2
        c.saveState()
        path = c.beginPath()
        path.rect(ax, ay, aw, ah)
        c.clipPath(path, stroke=0, fill=0)
        c.drawImage(img, dx, dy, dw, dh, mask="auto")
        c.restoreState()

    def render_cover(self) -> None:
        c = self.c
        W, H = self.W, self.H
        band_h = H * 0.36
        # photo (top), brand band (bottom)
        self._cover_photo((0, band_h, W, H - band_h))
        c.setFillColor(self.col_dark)
        c.rect(0, 0, W, band_h, fill=1, stroke=0)
        # white wordmark, top-left over the photo
        self._draw_wordmark(self.ML, H - 56, self.col_white, scale=1.15)
        # band text: kicker / title / subtitle
        tx = self.ML
        ty = band_h - 56
        kicker = (self.meta.get("kicker") or self.meta.get("eyebrow") or "").strip()
        if kicker:
            self._tracked(tx, ty, kicker.upper(), self.style.f_medium, 10, self.col_white, 3)
            ty -= 34
        title = str(self.meta.get("titulo") or self.meta.get("title") or "Documento")
        c.setFillColor(self.col_white)
        for ln in self._wrap([(self.style.f_bold, self.col_white, title)], 40, W - 2 * self.ML):
            self._draw(tx, ty, ln, 40)
            ty -= 46
        subtitle = str(self.meta.get("subtitulo") or self.meta.get("subtitle") or "")
        if subtitle:
            c.setFillColor(self.col_white)
            for ln in self._wrap([(self._f_light, self.col_white, subtitle)], 13, W - 2 * self.ML):
                self._draw(tx, ty - 4, ln, 13)
                ty -= 18

    # ---- section divider (portadilla) ------------------------------------
    def render_divider(self, num: int, title: str) -> None:
        c = self.c
        W, H = self.W, self.H
        band_h = H * 0.44
        self._cover_photo((0, band_h, W, H - band_h))
        c.setFillColor(self.col_dark)
        c.rect(0, 0, W, band_h, fill=1, stroke=0)
        # giant number straddling the band edge, in terracota
        c.setFont(self.style.f_bold, 96)
        c.setFillColor(self.col_mid)
        c.drawString(self.ML, band_h - 4, f"{num:02d}")
        # title in white inside the band
        c.setFillColor(self.col_white)
        ty = band_h - 150
        for ln in self._wrap([(self.style.f_bold, self.col_white, title)], 26, W - 2 * self.ML):
            self._draw(self.ML, ty, ln, 26)
            ty -= 32

    # ---- index ------------------------------------------------------------
    def render_index(self, entries) -> None:
        c = self.c
        c.setFont(self.style.f_bold, 27)
        c.setFillColor(self.col_dark)
        c.drawString(self.ML, self.y - 24, "Índice de contenidos")
        self.y -= 24 + 26
        for level, title, page in entries:
            eh = 20 if level == 1 else 16
            if self.y - eh < self.MB + 12:
                self._start_page("index")
            if level == 1:
                self.y -= 8
                font = self.style.f_medium
                size = 12.5
                x = self.ML
                col = self.col_dark
            else:
                font = self._f_light
                size = 10.5
                x = self.ML + 16
                col = self.col_text
            shown = str(page + self._toc_offset)
            c.setFont(font, size)
            c.setFillColor(col)
            c.drawString(x, self.y, title)
            # dot leader + page number
            pw = c.stringWidth(shown, font, size)
            tw = c.stringWidth(title, font, size)
            c.setFillColor(self.col_dark)
            c.drawRightString(self.W - self.MR, self.y, shown)
            dot_x0 = x + tw + 6
            dot_x1 = self.W - self.MR - pw - 6
            if dot_x1 > dot_x0:
                c.setFont(font, size)
                c.setFillColor(self.col_text_soft)
                dots = "·" * max(0, int((dot_x1 - dot_x0) / c.stringWidth("· ", font, size)))
                c.drawString(dot_x0, self.y, dots)
            self.y -= eh

    # ---- headings (green + kicker) ---------------------------------------
    def _record(self, level, title):
        if self._collect:
            self.toc.append((level, title, self.page_num))

    # IDML "Cuerpo de texto" heading ladder (rendered in green, not the style's
    # terracota default which the books override): section 22.3/26 SB12 SA6,
    # subsection 18/20 SB14 SA6, level-3 13/16.7 SB14 SA4.
    def render_h1(self, text: str) -> None:
        title = re.sub(r"\s*\*\([^)]+\)\*\s*$", "", text).strip()
        lines = self._wrap([(self.style.f_regular, self.col_dark, title)], 22, self.CW)
        self.need_space(40 + len(lines) * 26)
        self.y -= 12                                       # SB 12
        # Only true top-level sections ("1. ...", not "1.1. ...") get a kicker.
        m = re.match(r"^(\d+)\.(?=\s|$)", title)
        if m:
            self._sec_no += 1
            self._tracked(self.ML, self.y, f"SECCIÓN {self._sec_no}",
                          self.style.f_medium, 9, self.col_mid, 2.5)
            self.y -= 16
        self._record(1, title)
        for ln in lines:
            self._draw(self.ML, self.y, ln, 22)
            self.y -= 26
        self.y -= 6                                        # SA 6

    def render_h2(self, text: str) -> None:
        clean = re.sub(r"^[^\w\d¿¡\s]+\s*", "", text).strip() or text
        lines = self._wrap([(self.style.f_medium, self.col_dark, clean)], 18, self.CW)
        self.need_space(28 + len(lines) * 20)
        self.y -= 14                                       # SB 14
        self._record(2, clean)
        for ln in lines:
            self._draw(self.ML, self.y, ln, 18)
            self.y -= 20
        self.y -= 6                                        # SA 6

    def render_h3(self, text: str) -> None:
        lines = self._wrap([(self.style.f_bold, self.col_dark, text)], 13, self.CW)
        self.need_space(22 + len(lines) * 17)
        self.y -= 14                                       # SB 14
        for ln in lines:
            self._draw(self.ML, self.y, ln, 13)
            self.y -= 17
        self.y -= 4                                        # SA 4

    # ---- table (Prometeo style: light-green header, green grid) ----------
    def render_table(self, header, rows) -> None:
        # Base draws header bg = col_dark, header text = col_white, row lines =
        # col_line, zebra = col_bg_soft. Swap to the Prometeo table look.
        saved = (self.col_table_header, self.col_white, self.col_bg_soft, self.col_line)
        green = self.col_dark
        self.col_table_header = self.col_tabla  # header background (#CBDECF)
        self.col_white = green                  # header text (green)
        self.col_bg_soft = HexColor("#FFFFFF")  # no zebra striping
        self.col_line = green                   # grid lines (green)
        self._table_center_header = True        # IDML "Tabla Encabezado" = CenterAlign
        try:
            super().render_table(header, rows)
        finally:
            self.col_table_header, self.col_white, self.col_bg_soft, self.col_line = saved
            self._table_center_header = False

    # ---- code (Ayu Mirage + JetBrains Mono, rounded, soft shadow) --------
    def render_code(self, lang: str, text: str) -> None:
        c = self.c
        font, font_bold = self._mono, self._mono_bold
        size, line_h, pad = 9, 13, 12
        chunks = highlight_code(text, lang, "default", _AYU)
        lines = [[]]
        for color, bold, txt in chunks:
            parts = txt.split("\n")
            for pi, part in enumerate(parts):
                if pi > 0:
                    lines.append([])
                if part:
                    lines[-1].append((color, bold, part))
        max_w = self.CW - 2 * pad
        char_w = c.stringWidth("M", font, size)
        max_chars = max(1, int(max_w / char_w))
        wrapped = []
        for line in lines:
            if not line:
                wrapped.append([]); continue
            cur, cur_len = [], 0
            for color, bold, txt in line:
                rem = txt
                while cur_len + len(rem) > max_chars:
                    take = max_chars - cur_len
                    if take > 0:
                        cur.append((color, bold, rem[:take]))
                    wrapped.append(cur); cur, cur_len = [], 0
                    rem = rem[take:]
                if rem:
                    cur.append((color, bold, rem)); cur_len += len(rem)
            wrapped.append(cur)

        label_h = 16 if lang else 0
        idx, first = 0, True
        while idx < len(wrapped):
            seg_label_h = label_h if first else 0
            avail_h = self.y - (self.MB + 12) - 2 * pad - seg_label_h
            seg_max = int(avail_h // line_h)
            if seg_max < 1:
                self.new_page(); continue
            seg = wrapped[idx:idx + seg_max]
            idx += len(seg)
            box_h = len(seg) * line_h + 2 * pad + seg_label_h
            y_top = self.y
            y_bottom = y_top - box_h
            # soft shadow
            c.setFillColor(HexColor("#000000")); c.setFillAlpha(0.14)
            c.roundRect(self.ML + 1.5, y_bottom - 2, self.CW, box_h, 7, fill=1, stroke=0)
            c.setFillAlpha(1)
            # box + header bar
            c.setFillColor(HexColor(_AYU_BG))
            c.roundRect(self.ML, y_bottom, self.CW, box_h, 7, fill=1, stroke=0)
            if first and lang:
                self._tracked(self.ML + pad, y_top - 13, lang.upper(),
                              self.style.f_medium, 7.5, HexColor(_AYU_LABEL), 2)
            ty = y_top - pad - size - seg_label_h + 4
            for line_chunks in seg:
                cx = self.ML + pad
                for color, bold, txt in line_chunks:
                    f = font_bold if bold else font
                    c.setFont(f, size)
                    c.setFillColor(HexColor(f"#{color}") if color else HexColor(_AYU_FG))
                    c.drawString(cx, ty, txt)
                    cx += c.stringWidth(txt, f, size)
                ty -= line_h
            self.y = y_bottom - 12
            first = False
            if idx < len(wrapped):
                self.new_page()

    # ---- crema box (Objetivos / Preguntas) -------------------------------
    def _draw_check(self, x, y, color):
        c = self.c
        c.setStrokeColor(color)
        c.setLineWidth(1.5)
        c.setLineCap(1)
        c.line(x, y + 2.5, x + 3, y)
        c.line(x + 3, y, x + 8, y + 7)

    def render_box(self, kind: str, title: str, items: list) -> None:
        c = self.c
        pad = 14
        size = self.opts.body_size
        lead = self.opts.body_lead
        marker_w = 20
        label_h = 25
        inner_w = self.CW - 2 * pad - marker_w
        wrapped = []
        for it in items:
            t = it["text"] if isinstance(it, dict) else it
            wrapped.append(self._wrap(self._tokens(t), size, inner_w))
        total_lines = sum(len(w) for w in wrapped)
        box_h = pad + label_h + total_lines * lead + len(items) * 5 + pad

        self.need_space(box_h + 6)
        if self._collect:
            self.toc.append((1, title, self.page_num))
        y_top = self.y
        y_bottom = y_top - box_h
        c.setFillColor(self.col_crema)
        c.rect(self.ML, y_bottom, self.CW, box_h, fill=1, stroke=0)  # esquinas rectas
        self._tracked(self.ML + pad, y_top - pad - 6, title.upper(),
                      self.style.f_medium, 9, self.col_mid, 2.5)
        ty = y_top - pad - label_h
        for w in wrapped:
            if kind == "objetivos":
                self._draw_check(self.ML + pad + 2, ty - 1, self.col_dark)
            else:
                c.setFillColor(self.col_mid)
                c.circle(self.ML + pad + 5, ty + 2, 2, fill=1, stroke=0)
            for ln in w:
                self._draw(self.ML + pad + marker_w, ty, ln, size)
                ty -= lead
            ty -= 5
        self.y = y_bottom - 12

    # ---- dispatcher: dividers + Objetivos/Preguntas boxes ----------------
    def render_content(self, blocks) -> None:
        i, n = 0, len(blocks)
        while i < n:
            blk = blocks[i]
            if blk["type"] == "h1":
                nt = _norm(blk["text"])
                kind = "objetivos" if nt.startswith("objetivos") else (
                    "preguntas" if nt.startswith("preguntas") else None)
                if kind:
                    items = []
                    if i + 1 < n and blocks[i + 1]["type"] == "ul":
                        items = blocks[i + 1]["items"]
                        i += 1
                    self.render_box(kind, blk["text"].strip(), items)
                    i += 1
                    continue
                # Portadilla only for top-level integer sections ("1. ...").
                m = re.match(r"^(\d+)\.(?=\s|$)", blk["text"].strip())
                if m:
                    self._start_page_for_divider()
                    self.render_divider(int(m.group(1)),
                                        re.sub(r"^\d+\.\s*", "", blk["text"].strip()))
                    self._start_page("content")
            self.render_blocks([blk])
            i += 1

    def _start_page_for_divider(self) -> None:
        self.c.showPage()
        self.page_num += 1
        self._page_kind = "divider"
        self.y = self.H - self.MT
        # no chrome on dividers


def _count_index_pages(entries, layout: LayoutOptions) -> int:
    H = layout.page_size[1]
    avail = H - layout.margin_top - layout.margin_bottom
    used = 24 + 26                       # title block on first page
    pages = 1
    for level, _t, _p in entries:
        eh = (20 + 8) if level == 1 else 16
        if used + eh > avail:
            pages += 1
            used = 0
        used += eh
    return pages


def _editorial_content(meta: dict, blocks: list) -> tuple[dict, list]:
    """Resolve the cover title and normalise heading levels for both conventions.

      * web   (`#`=title, `##`=section, `###`=subsection): the lone `#` is the
        cover title; the rest keep their levels.
      * skill (`#`=section, `##`=subsection, `###`=...): there are `#` headings
        that aren't the title, so every level is shifted down one (h1_doc→h1,
        h1→h2, h2→h3) and nothing is dropped.
    """
    cover_title = str(meta.get("titulo") or meta.get("title") or "").strip()
    h1doc_idxs = [i for i, b in enumerate(blocks) if b["type"] == "h1_doc"]

    title_idx = None
    if not cover_title and h1doc_idxs:           # no frontmatter title → first `#`
        title_idx = h1doc_idxs[0]
        cover_title = blocks[title_idx]["text"].strip()
    elif cover_title:                            # title is the `#` equal to it
        for i in h1doc_idxs:
            if blocks[i]["text"].strip() == cover_title:
                title_idx = i
                break

    # Skill convention when a `#` heading exists that isn't the cover title.
    shift = any(i != title_idx for i in h1doc_idxs)
    bump = {"h1_doc": "h1", "h1": "h2", "h2": "h3", "h3": "h3"}

    content: list = []
    for i, b in enumerate(blocks):
        if i == title_idx:
            continue
        nb = dict(b)
        if b["type"] == "h1_doc":
            nb["type"] = "h1"                    # stray `#` → a section
        if shift:
            nb["type"] = bump.get(b["type"], nb["type"])
        content.append(nb)

    meta = {**meta, "titulo": cover_title or "Documento"}
    return meta, content


def render_editorial(c, meta, blocks, brand: BrandConfig, layout: LayoutOptions,
                     base_path: Path | None = None, formulas: dict | None = None) -> None:
    register_brand_fonts(brand.fonts)
    meta, content = _editorial_content(meta, blocks)

    # Pass 1 (measure): render cover + content (with dividers), collect TOC.
    scratch = canvas.Canvas(io.BytesIO(), pagesize=layout.page_size)
    m = EditorialRenderer(scratch, meta, brand, layout, base_path, formulas,
                          toc=None, with_index=False)
    m.render_cover()
    m._start_page("content")
    m.render_content(content)
    scratch.showPage()
    entries = list(m.toc)

    offset = _count_index_pages(entries, layout) if entries else 0

    # Pass 2 (real): cover, index (page numbers + offset), content.
    r = EditorialRenderer(c, meta, brand, layout, base_path, formulas,
                          toc=entries, toc_offset=offset, with_index=True)
    r.render_cover()
    r._start_page("index")
    r.render_index(entries)
    r._start_page("content")
    r.render_content(content)
