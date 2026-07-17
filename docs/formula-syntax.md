# Formula syntax (LaTeX) in layout-studio

The renderer supports mathematical formulas in markdown. They are rasterized to
an image with MathJax (in the web layer) and embedded in the PDF, so the content
accepts **standard mathematical LaTeX**. For formulas to be detected properly and
to avoid formula-looking text slipping through, the markdown must follow this
contract.

## Delimiters

| Type | Syntax | Rule |
|---|---|---|
| **Block** | `$$ ... $$` | On its **own paragraph** (isolated line, with blank lines before and after). May span several lines. Rendered centered and large. |
| **Inline** | `$ ... $` | Within running text. **Single line**, no breaks. |

Examples:

```markdown
The mean is computed as:

$$\bar{x} = \frac{\sum_{i=1}^{n} x_i}{n}$$

In a symmetric distribution, $\bar{x} \approx M_e$.
```

## Rules for inline `$...$` (GitHub style, anti-false-positives)

1. **No spaces adjacent** to the `$`: `$x^2$` ✅ — `$ x^2 $` ❌ (not detected).
2. The closing `$` **cannot be followed by a digit**. That's why prices stay as
   literal text: `the course costs $10 and $20` → literal.
3. **Literal dollar sign** → write it `\$`: `\$100` prints as `$100`.
4. An inline formula **cannot contain** a `$` inside.

## Content (LaTeX)

Inside the delimiters goes mathematical LaTeX (MathJax, all packages):

- Fractions: `\frac{a}{b}`, `\dfrac{n_i}{n}`
- Summations with limits: `\sum_{i=1}^{n} x_i`
- Roots: `\sqrt{x^2 + y^2}`
- Accents: `\bar{x}`, `\hat{p}`
- Sub/superscripts: `x_i`, `y^2`, `e^{i\pi}`
- Relational operators: `\leq`, `\geq`, `\approx`, `\neq`
- Greek letters: `\sigma`, `\pi`, `\mu`, `\alpha`
- Integrals: `\int_0^1 x^2 \, dx`

## Gotchas

- **In table cells**, a vertical bar inside the formula must be escaped as `\|`,
  otherwise the `|` breaks the column: `$\|r\|$`.
- **Real backslashes** in the `.md`: `\frac`, not `\\frac`. Watch out if the
  markdown is generated via JSON or another format that escapes strings: there
  the `\` may be duplicated and break the TeX.

## Limitations

- Formulas are **not** rendered in **headings** (`#`, `##`, …).
- They do work in: paragraphs, lists, tables, blockquotes, quizzes and callouts.
- Very tall inline formulas (large fractions) may exceed the line height; for
  complex expressions, use a block `$$...$$`.
