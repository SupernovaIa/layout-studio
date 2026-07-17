"""Markdown parser used by the renderer.

Lifted verbatim from the original sanipro-pdf `build_caso.py` (the working
`parse_md` function, not the abandoned earlier attempt). Produces a list of
typed blocks plus the YAML frontmatter dict.

Output schema (block types):
    {"type": "h1_doc", "text": str}      # `#` — document title
    {"type": "h1", "text": str}          # `##` — section
    {"type": "h2", "text": str}          # `###`
    {"type": "h3", "text": str}          # `####`
    {"type": "p", "text": str}           # paragraph (text may include inline md)
    {"type": "blockquote", "lines": [str, ...]}
    {"type": "ul", "items": [{"text": str, "children": [str, ...]}, ...]}
    {"type": "ol", "items": [str, ...]}
    {"type": "table", "header": [str, ...], "rows": [[str, ...], ...]}
    {"type": "hr"}
    {"type": "image", "alt": str, "src": str}     # standalone ![alt](src)
    {"type": "formula", "id": str}                 # standalone ⟦Fn⟧ math marker
    {"type": "code", "lang": str, "text": str}    # fenced ```lang ... ```
    {"type": "callout", "label": str, "lines": [str, ...]}  # "> **label** ```" box
    {"type": "checklist", "items": [{"ok": bool, "text": str}, ...]}  # ❌/✅ lines
    {"type": "quiz", "question": str, "options": [str, ...]}  # post-processed
"""

from __future__ import annotations

import re

import yaml


def parse_markdown(md_text: str) -> tuple[dict, list[dict]]:
    """Parse a Markdown document with optional YAML frontmatter.

    Returns ``(meta, blocks)``.
    """
    meta: dict = {}
    body = md_text
    if md_text.startswith(("---\n", "---\r\n")):
        end = md_text.find("\n---", 4)
        if end != -1:
            try:
                parsed = yaml.safe_load(md_text[4:end])
            except yaml.YAMLError:
                parsed = None
            if isinstance(parsed, dict):
                meta = parsed
                body = md_text[end + 4:].lstrip("\n")

    lines = body.split("\n")
    blocks: list[dict] = []
    i = 0
    n = len(lines)

    para: list[str] = []

    def flush_paragraph() -> None:
        if para:
            txt = " ".join(para).strip()
            if txt:
                blocks.append({"type": "p", "text": txt})
            para.clear()

    while i < n:
        ln = lines[i]
        stripped = ln.strip()

        if not stripped:
            flush_paragraph()
            i += 1
            continue

        if ln.startswith("# "):
            flush_paragraph()
            blocks.append({"type": "h1_doc", "text": ln[2:].strip()})
            i += 1
            continue
        if ln.startswith("## "):
            flush_paragraph()
            blocks.append({"type": "h1", "text": ln[3:].strip()})
            i += 1
            continue
        if ln.startswith("### "):
            flush_paragraph()
            blocks.append({"type": "h2", "text": ln[4:].strip()})
            i += 1
            continue
        if ln.startswith("#### "):
            flush_paragraph()
            blocks.append({"type": "h3", "text": ln[5:].strip()})
            i += 1
            continue

        if stripped == "---":
            flush_paragraph()
            blocks.append({"type": "hr"})
            i += 1
            continue

        # Block formula marker: a line that is only `⟦Fn⟧`, injected by the web
        # layer for a `$$...$$` formula pre-rasterized to PNG. Resolved against
        # the `formulas` map passed to the renderer.
        mform = re.match(r"^⟦(F\d+)⟧$", stripped)
        if mform:
            flush_paragraph()
            blocks.append({"type": "formula", "id": mform.group(1)})
            i += 1
            continue

        # Standalone image: a line that is only `![alt](src)`. Inline images
        # mixed into prose are not supported (the inline tokenizer ignores
        # them); an image must sit on its own line to become a block.
        mimg = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)\s*$", stripped)
        if mimg:
            flush_paragraph()
            blocks.append({
                "type": "image",
                "alt": mimg.group(1).strip(),
                "src": mimg.group(2).strip(),
            })
            i += 1
            continue

        # Fenced code block: ```lang ... ``` (lang optional). Content is taken
        # raw, no inline-md parsing happens inside.
        if ln.startswith("```"):
            flush_paragraph()
            lang = ln[3:].strip()
            i += 1
            code_lines: list[str] = []
            while i < n and not lines[i].startswith("```"):
                code_lines.append(lines[i])
                i += 1
            if i < n:
                i += 1  # consume closing fence
            blocks.append({
                "type": "code",
                "lang": lang,
                "text": "\n".join(code_lines),
            })
            continue

        # "Copy to Claude" callout: a blockquote line that opens a fenced
        # block on the same line — `> **Etiqueta** ```` ``` ````. The body that
        # follows is NOT quoted and ends at the closing ``` fence. Rendered as
        # a labeled box with the prompt text verbatim (line breaks preserved).
        mcallout = re.match(r"^\s*>\s*(.*?)\s*```\s*$", ln)
        if mcallout:
            flush_paragraph()
            label = mcallout.group(1).replace("*", "").strip()
            i += 1
            body: list[str] = []
            while i < n and not lines[i].strip().startswith("```"):
                body.append(lines[i])
                i += 1
            if i < n:
                i += 1  # consume closing fence
            # Drop leading/trailing blank lines inside the box.
            while body and not body[0].strip():
                body.pop(0)
            while body and not body[-1].strip():
                body.pop()
            blocks.append({"type": "callout", "label": label, "lines": body})
            continue

        # Do/don't checklist: consecutive lines led by ❌ or ✅. Authored as
        # plain lines (no blank between the pair), so standard Markdown would
        # merge them into one run-on paragraph; we instead group each contiguous
        # run into a checklist block with a per-item ok/not-ok flag. The brand
        # body font has no glyph for these emoji, so the renderer draws its own
        # coloured ✓/✗ markers from the stripped text.
        if re.match(r"^(❌|✅)\s+", ln):
            flush_paragraph()
            check_items: list[dict] = []
            while i < n:
                m = re.match(r"^(❌|✅)\s+(.*)$", lines[i])
                if not m:
                    break
                buf = [m.group(2)]
                i += 1
                # Fold simple wrapped continuation lines into the item.
                while (
                    i < n
                    and lines[i].strip()
                    and not re.match(r"^(❌|✅)\s+", lines[i])
                    and not lines[i].startswith(("#", ">", "- ", "* ", "```"))
                    and not re.match(r"^\s*\d+\.\s+", lines[i])
                ):
                    buf.append(lines[i].strip())
                    i += 1
                check_items.append({
                    "ok": m.group(1) == "✅",
                    "text": " ".join(buf).strip(),
                })
            blocks.append({"type": "checklist", "items": check_items})
            continue

        if ln.startswith(">"):
            flush_paragraph()
            qlines: list[str] = []
            while i < n and (
                lines[i].startswith(">")
                or (lines[i].strip() == "" and i + 1 < n and lines[i + 1].startswith(">"))
            ):
                if lines[i].startswith(">"):
                    qlines.append(lines[i].lstrip(">").lstrip())
                else:
                    qlines.append("")
                i += 1
            blocks.append({"type": "blockquote", "lines": qlines})
            continue

        if "|" in ln and i + 1 < n and re.match(r"^\s*\|?\s*:?-+", lines[i + 1]):
            flush_paragraph()
            tl: list[str] = []
            while i < n and "|" in lines[i] and lines[i].strip():
                tl.append(lines[i])
                i += 1
            header = [c.strip() for c in tl[0].strip().strip("|").split("|")]
            rows = [
                [c.strip() for c in r.strip().strip("|").split("|")]
                for r in tl[2:]
            ]
            blocks.append({"type": "table", "header": header, "rows": rows})
            continue

        if re.match(r"^(\s*)(\d+)\.\s+(.*)$", ln):
            flush_paragraph()
            items: list[str] = []
            while i < n:
                m = re.match(r"^(\s*)(\d+)\.\s+(.*)$", lines[i])
                if not m:
                    break
                item_buf = [m.group(3)]
                i += 1
                while (
                    i < n
                    and lines[i].strip()
                    and not re.match(r"^(\s*)(\d+)\.\s+", lines[i])
                    and not lines[i].startswith(("- ", "* ", "#", ">"))
                ):
                    if lines[i].startswith("  ") or lines[i].startswith("\t"):
                        item_buf.append(lines[i].strip())
                        i += 1
                    else:
                        break
                items.append(" ".join(item_buf))
            blocks.append({"type": "ol", "items": items})
            continue

        if re.match(r"^[\-\*]\s+", ln):
            flush_paragraph()
            ul_items: list[dict] = []
            while i < n and re.match(r"^[\-\*]\s+", lines[i]):
                item_text = re.sub(r"^[\-\*]\s+", "", lines[i])
                i += 1
                children: list[str] = []
                while i < n and lines[i].strip() and (
                    lines[i].startswith("  ") or lines[i].startswith("\t")
                ):
                    sub = lines[i].lstrip()
                    if re.match(r"^[\-\*]\s+", sub):
                        children.append(re.sub(r"^[\-\*]\s+", "", sub))
                    else:
                        if children:
                            children[-1] += " " + sub
                        else:
                            item_text += " " + sub
                    i += 1
                ul_items.append({"text": item_text, "children": children})
            blocks.append({"type": "ul", "items": ul_items})
            continue

        para.append(stripped)
        i += 1

    flush_paragraph()

    # Post-process: collapse "**N.** question" + ul of a)/b)/c)/d) into a quiz block.
    processed: list[dict] = []
    i = 0
    while i < len(blocks):
        b = blocks[i]
        is_quiz_paragraph = (
            b["type"] == "p"
            and re.match(r"^(\*\*\d+\.\*\*|\d+\.)\s+", b["text"])
        )
        if (
            is_quiz_paragraph
            and i + 1 < len(blocks)
            and blocks[i + 1]["type"] == "ul"
        ):
            ul_items = blocks[i + 1]["items"]
            ul_texts = [it["text"] if isinstance(it, dict) else it for it in ul_items]
            if (
                len(ul_texts) >= 2
                and all(re.match(r"^[a-eA-E]\)\s+", t) for t in ul_texts)
            ):
                processed.append({
                    "type": "quiz",
                    "question": b["text"],
                    "options": ul_texts,
                })
                i += 2
                continue
        processed.append(b)
        i += 1

    return meta, processed
