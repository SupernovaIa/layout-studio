# Markdown features in layout-studio

Index of everything the renderer understands in the input markdown. Each element
is parsed in `packages/renderer/.../parser.py` and drawn to PDF (`renderer.py`)
and/or DOCX (`docx_renderer.py`).

Unless stated otherwise, a feature works the same in **PDF** and **DOCX**. The
"Format" column flags the differences.

## Summary table

| Feature | Syntax | Format |
|---|---|---|
| Frontmatter | `---` … `---` at the start | PDF · DOCX |
| Headings | `#` `##` `###` `####` | PDF · DOCX |
| Paragraphs | running text | PDF · DOCX |
| Bold / italic / inline code | `**x**` · `*x*` · `` `x` `` | PDF · DOCX |
| Lists | `-`/`*` and `1.` (with nesting) | PDF · DOCX |
| Tables | `\| … \|` + `\|---\|` | PDF · DOCX |
| Blockquotes | `> …` | PDF · DOCX |
| Horizontal rule | `---` on its own line | PDF · DOCX |
| Images | `![alt](src)` on its own line | PDF · DOCX |
| Code blocks | ` ```lang … ``` ` | PDF · DOCX |
| "Copy to Claude" callout | `> **Label** ` + fence | PDF · DOCX |
| Quiz | `**N.** question` + `a) b) c)` | PDF · DOCX |
| Formulas (LaTeX) | `$…$` · `$$…$$` | **PDF only** |
| Mermaid diagrams | ` ```mermaid … ``` ` | PDF · DOCX |

---

## Frontmatter (metadata)

Optional YAML block at the start of the document, between `---`:

```markdown
---
title: Infrastructure and workflow
module: 6
lesson: 19
---
```

Parsed as a metadata dictionary. It is not printed as content; the renderer uses
it for document data.

## Headings

| Markdown | Meaning |
|---|---|
| `# Text` | Document title (h1) |
| `## Text` | Section (h2) |
| `### Text` | Subsection (h3) |
| `#### Text` | Sub-subsection (h4) |

> Formulas are **not** rendered inside headings.

## Inline text

Inside paragraphs, lists, tables, blockquotes, quizzes and callouts:

- **Bold**: `**text**`
- *Italic*: `*text*`
- `Code`: `` `text` `` (painted with the brand color)

Not supported: links `[text](url)` (printed literally), strikethrough
`~~text~~`, or inline images mixed into prose.

## Lists

- **Unordered** with `-` or `*`. They allow one nesting level by indenting with
  2 spaces or a tab.
- **Ordered** with `1.`, `2.`, …

```markdown
- First point
  - Nested subpoint
- Second point

1. Step one
2. Step two
```

## Tables

Standard markdown table; the second row is the separator:

```markdown
| Service  | Port |
|---|---|
| backend  | 8000 |
| frontend | 5173 |
```

> In cells, a vertical bar inside a formula must be escaped `\|`.

## Blockquotes

```markdown
> One or more quote lines.
```

## Horizontal rule

A `---` on its **own line** (with blank lines around it) produces a separator
line. Note: `---` at the start of the document is frontmatter, not a rule.

## Images

An image must be **alone on its line**:

```markdown
![Alternative text](path/image.png)
```

- **Relative local paths** are resolved against the `.md` directory (the web
  layer stages them in the Pyodide FS).
- Remote URLs (`http(s)://`, `data:`) are **not downloaded** (there is no network
  in the Pyodide sandbox).
- If the image cannot be loaded, the PDF shows a note with the alt text.

## Code blocks

Fence with optional language; the content is taken literally and highlighted with
Pygments (in PDF):

````markdown
```python
def hello():
    return "world"
```
````

## "Copy to Claude" callout

A blockquote that opens a fence on the same line produces a labeled box with the
prompt text verbatim (line breaks preserved):

````markdown
> **Paste this into Claude** ```
Your prompt here,
across several lines.
```
````

## Quiz

A numbered paragraph (`**N.** …` or `N. …`) followed by a list whose options
start with `a)`, `b)`, … collapses into a quiz block:

```markdown
**1.** What does `docker compose up` do?

- a) Brings up the stack
- b) Deletes the volumes
- c) Nothing
```

## Formulas (LaTeX)

`$…$` (inline) and `$$…$$` (block). Rasterized with MathJax and embedded as an
image. **PDF only**: in DOCX the LaTeX appears as literal text, unrendered.

Full documentation: [formula-syntax.md](./formula-syntax.md).

## Mermaid diagrams

A ` ```mermaid ` block is rendered as a diagram, in both PDF and DOCX:

````markdown
```mermaid
flowchart LR
    A[Spec] --> B[Code]
    B --> C[Verification]
    C --> D[Commit]
```
````

How it works: the block is rasterized in the browser with
[mermaid](https://mermaid.js.org) (lazy-loaded: only downloaded if the document
has diagrams), converted to PNG and embedded as an image. That's why it works the
same in PDF and DOCX without touching the Python renderer.

Supports any mermaid diagram (flowchart, sequence, gantt, etc.). Details:

- Labels are rendered as SVG text (`htmlLabels` disabled) so the diagram is
  rasterizable; `<br/>` inside nodes still works.
- If a diagram has a syntax error, it **does not break the render**: the block is
  left as code and a warning is logged to the console.
- Very wide diagrams are scaled to fit the content column, so they may look
  small. Prefer vertical orientation (`flowchart TB`) or split them if you need
  more detail.
