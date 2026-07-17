/**
 * Adaptive reading view — the document rendered as accessible, responsive HTML.
 * It mirrors the PDF look (section dividers, justified body with colored terms,
 * crema callout boxes, styled tables, Ayu code) so the screen reading experience
 * matches the export, while the left sidebar gives a discreet "where am I" index
 * with scroll-spy.
 *
 * Parsing happens in Python (via `parseReadingDoc`) so the blocks here are the
 * exact same ones the PDF renders — the two outputs can never drift apart.
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import type { BrandColors } from "../lib/types";
import type { ReadingBlock, ReadingDoc } from "../lib/render";

interface Props {
    doc: ReadingDoc;
    colors: BrandColors;
    fontFamily?: string;
    /** Document title (from frontmatter); shown as the page H1. */
    title?: string;
    /**
     * Render for a standalone HTML file (no React on the page): drop the mobile
     * drawer toggle + scrim and let the index sit in the flow so it stays
     * reachable without JS. Used by the HTML export (`renderReadingHtml`).
     */
    staticExport?: boolean;
}

// --- model -----------------------------------------------------------------

type Node =
    | { kind: "divider"; id: string; num: number; title: string }
    | { kind: "section"; id: string; title: string }
    | { kind: "subsection"; id: string; title: string }
    | { kind: "minor"; title: string }
    | { kind: "box"; boxKind: "objetivos" | "preguntas"; title: string; items: string[] }
    | { kind: "block"; block: ReadingBlock };

interface TocEntry {
    id: string;
    level: 1 | 2;
    label: string;
    isDivider: boolean;
}

const norm = (s: string): string =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const slug = (s: string, n: number): string =>
    `sec-${n}-${norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "x"}`;

/** Turn the flat block list into renderable nodes + a 2-level table of contents. */
function buildModel(blocks: ReadingBlock[]): { nodes: Node[]; toc: TocEntry[] } {
    const nodes: Node[] = [];
    const toc: TocEntry[] = [];
    let counter = 0;

    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];

        if (b.type === "h1") {
            const text: string = (b.text ?? "").trim();
            const nt = norm(text);

            // Objetivos / Preguntas → crema callout box (consumes a following ul).
            const boxKind = nt.startsWith("objetivos") ? "objetivos" : nt.startsWith("preguntas") ? "preguntas" : null;
            if (boxKind) {
                let items: string[] = [];
                if (i + 1 < blocks.length && blocks[i + 1].type === "ul") {
                    items = (blocks[i + 1].items as Array<{ text: string } | string>).map((it) =>
                        typeof it === "string" ? it : it.text,
                    );
                    i += 1;
                }
                nodes.push({ kind: "box", boxKind, title: text, items });
                continue;
            }

            const id = slug(text, counter++);
            const m = /^(\d+)\.(?=\s|$)/.exec(text);
            if (m) {
                const title = text.replace(/^\d+\.\s*/, "");
                nodes.push({ kind: "divider", id, num: parseInt(m[1], 10), title });
                toc.push({ id, level: 1, label: title, isDivider: true });
            } else {
                nodes.push({ kind: "section", id, title: text });
                toc.push({ id, level: 1, label: text, isDivider: false });
            }
            continue;
        }

        if (b.type === "h2") {
            const text: string = (b.text ?? "").trim();
            const id = slug(text, counter++);
            nodes.push({ kind: "subsection", id, title: text });
            toc.push({ id, level: 2, label: text, isDivider: false });
            continue;
        }

        if (b.type === "h3") {
            nodes.push({ kind: "minor", title: (b.text ?? "").trim() });
            continue;
        }

        nodes.push({ kind: "block", block: b });
    }

    return { nodes, toc };
}

// --- inline markdown -------------------------------------------------------

// Bold allows a lone `*` inside (`**a*b**`) via `\*(?!\*)`, but never swallows
// the closing `**`, so it stays in step with the PDF's inline parsing.
const INLINE_RE =
    /(`[^`]+`)|(\*\*(?:[^*]|\*(?!\*))+\*\*)|(\*[^*]+\*|_[^_]+_)|(\[[^\]]+\]\([^)]+\))|(⟦F\d+⟧)/g;

/** Render a markdown inline string to React nodes (bold/italic/code/link/math). */
// Guard Markdown link hrefs: React does not strip dangerous schemes, so a
// `javascript:`/`data:` URL in user Markdown would render as a live link.
// Allow only web-safe schemes plus anchors and relative paths; anything else
// falls back to plain text (label without the href).
function safeHref(href: string): string | null {
    const h = href.trim();
    if (/^(https?:|mailto:|tel:|\/\/|\/|#|\.\.?\/)/i.test(h)) return h; // safe scheme / relative / anchor
    if (!/^[a-z][a-z0-9+.-]*:/i.test(h)) return h; // no scheme at all → relative
    return null; // unknown scheme (javascript:, data:, vbscript:, …)
}

function renderInline(text: string, formulaUrls: Record<string, string>): ReactNode[] {
    const out: ReactNode[] = [];
    let last = 0;
    let key = 0;
    let m: RegExpExecArray | null;
    INLINE_RE.lastIndex = 0;
    while ((m = INLINE_RE.exec(text)) !== null) {
        if (m.index > last) out.push(text.slice(last, m.index));
        const tok = m[0];
        if (m[1]) {
            out.push(<code key={key++} className="rv-code-inline">{tok.slice(1, -1)}</code>);
        } else if (m[2]) {
            // Bold = a defined/key term: colored strong, like the book.
            out.push(<strong key={key++} className="rv-term">{tok.slice(2, -2)}</strong>);
        } else if (m[3]) {
            out.push(<em key={key++}>{tok.slice(1, -1)}</em>);
        } else if (m[4]) {
            const lm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
            if (lm) {
                const href = safeHref(lm[2]);
                if (href === null) {
                    out.push(lm[1]); // unsafe scheme: render the label as plain text
                } else {
                    const external = /^https?:/i.test(href);
                    out.push(
                        <a key={key++} href={href} className="rv-link"
                           {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}>
                            {lm[1]}
                        </a>,
                    );
                }
            } else {
                out.push(tok);
            }
        } else if (m[5]) {
            const id = tok.slice(1, -1);
            const url = formulaUrls[id];
            out.push(url
                ? <img key={key++} src={url} alt="fórmula" className="rv-formula-inline" />
                : <span key={key++}>{id}</span>);
        }
        last = m.index + tok.length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
}

// --- block rendering -------------------------------------------------------

function Block({ block, formulaUrls }: { block: ReadingBlock; formulaUrls: Record<string, string> }): ReactNode {
    const t = block.type;
    if (t === "p") {
        return <p className="rv-p">{renderInline(block.text ?? "", formulaUrls)}</p>;
    }
    if (t === "hr") return <hr className="rv-hr" />;
    if (t === "ul") {
        const items = (block.items ?? []) as Array<{ text: string; children?: string[] } | string>;
        return (
            <ul className="rv-ul">
                {items.map((it, k) => {
                    const text = typeof it === "string" ? it : it.text;
                    const children = typeof it === "string" ? [] : it.children ?? [];
                    return (
                        <li key={k}>
                            <span>{renderInline(text, formulaUrls)}</span>
                            {children.length > 0 && (
                                <ul className="rv-ul rv-ul-sub">
                                    {children.map((c, j) => <li key={j}>{renderInline(c, formulaUrls)}</li>)}
                                </ul>
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    }
    if (t === "ol") {
        const items = (block.items ?? []) as string[];
        return <ol className="rv-ol">{items.map((it, k) => <li key={k}>{renderInline(it, formulaUrls)}</li>)}</ol>;
    }
    if (t === "blockquote") {
        const lines = (block.lines ?? []) as string[];
        return (
            <blockquote className="rv-quote">
                {lines.map((ln, k) => <p key={k}>{renderInline(ln, formulaUrls)}</p>)}
            </blockquote>
        );
    }
    if (t === "callout") {
        const lines = (block.lines ?? []) as string[];
        return (
            <div className="rv-callout" role="group" aria-label={block.label || "Nota"}>
                {block.label ? <div className="rv-callout-label">{block.label}</div> : null}
                <pre className="rv-callout-body">{lines.join("\n")}</pre>
            </div>
        );
    }
    if (t === "table") {
        const header = (block.header ?? []) as string[];
        const rows = (block.rows ?? []) as string[][];
        return (
            <div className="rv-table-wrap">
                <table className="rv-table">
                    <thead>
                        <tr>{header.map((h, k) => <th key={k} scope="col">{renderInline(h, formulaUrls)}</th>)}</tr>
                    </thead>
                    <tbody>
                        {rows.map((r, ri) => (
                            <tr key={ri}>{r.map((cell, ci) => <td key={ci}>{renderInline(cell, formulaUrls)}</td>)}</tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    if (t === "code") {
        // Tokens come from the same Pygments + Ayu Mirage pass the PDF runs
        // (see parseReadingDoc); each is [hexWithoutHash | null, bold, text].
        const tokens = block.tokens as Array<[string | null, boolean, string]> | undefined;
        return (
            <pre className="rv-pre" tabIndex={0} aria-label={block.lang ? `Código ${block.lang}` : "Código"}>
                <code>
                    {tokens && tokens.length > 0
                        ? tokens.map(([color, bold, txt], k) => (
                              <span
                                  key={k}
                                  style={{
                                      color: color ? `#${color}` : undefined,
                                      fontWeight: bold ? 700 : undefined,
                                  }}
                              >
                                  {txt}
                              </span>
                          ))
                        : (block.text ?? "")}
                </code>
            </pre>
        );
    }
    if (t === "quiz") {
        const options = (block.options ?? []) as string[];
        return (
            <div className="rv-quiz">
                <p className="rv-quiz-q">{renderInline(block.question ?? "", formulaUrls)}</p>
                <ul className="rv-quiz-opts">
                    {options.map((o, k) => <li key={k}>{renderInline(o, formulaUrls)}</li>)}
                </ul>
            </div>
        );
    }
    if (t === "image") {
        return (
            <figure className="rv-figure">
                <img src={block.src} alt={block.alt || ""} loading="lazy" />
                {block.alt ? <figcaption>{block.alt}</figcaption> : null}
            </figure>
        );
    }
    if (t === "formula") {
        const url = formulaUrls[block.id];
        return url
            ? <figure className="rv-figure rv-formula-block"><img src={url} alt="fórmula" /></figure>
            : null;
    }
    return null;
}

// --- sidebar / scroll-spy --------------------------------------------------

function useScrollSpy(toc: TocEntry[]): { activeId: string | null; progress: number } {
    const [activeId, setActiveId] = useState<string | null>(toc[0]?.id ?? null);
    const [progress, setProgress] = useState(0);
    const visible = useRef<Set<string>>(new Set());

    useEffect(() => {
        const ids = toc.map((t) => t.id);
        const order = new Map(ids.map((id, i) => [id, i]));
        const obs = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) visible.current.add(e.target.id);
                    else visible.current.delete(e.target.id);
                }
                if (visible.current.size > 0) {
                    let best: string | null = null;
                    let bestRank = Infinity;
                    for (const id of visible.current) {
                        const r = order.get(id) ?? Infinity;
                        if (r < bestRank) { bestRank = r; best = id; }
                    }
                    if (best) setActiveId(best);
                }
            },
            { rootMargin: "-12% 0px -70% 0px", threshold: 0 },
        );
        const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
        els.forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, [toc]);

    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const h = document.documentElement;
                const max = h.scrollHeight - h.clientHeight;
                setProgress(max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0);
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
    }, []);

    return { activeId, progress };
}

function Sidebar({
    toc, activeId, progress, onJump, navId,
}: {
    toc: TocEntry[];
    activeId: string | null;
    progress: number;
    onJump: (id: string) => void;
    navId: string;
}) {
    const activeIdx = Math.max(0, toc.findIndex((t) => t.id === activeId));
    const sectionCount = toc.filter((t) => t.level === 1).length;
    const currentSection = toc.slice(0, activeIdx + 1).filter((t) => t.level === 1).length;

    return (
        <nav id={navId} className="rv-toc" aria-label="Índice del documento">
            <div className="rv-toc-head">
                <span className="rv-toc-kicker">Índice</span>
                {sectionCount > 0 && (
                    <span className="rv-toc-pos" aria-live="polite">
                        Sección {Math.max(1, currentSection)} de {sectionCount}
                    </span>
                )}
            </div>
            <div className="rv-progress" role="progressbar" aria-label="Progreso de lectura"
                 aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                <span style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <ol className="rv-toc-list">
                {toc.map((t) => (
                    <li key={t.id} className={t.level === 2 ? "rv-toc-l2" : "rv-toc-l1"}>
                        <a
                            href={`#${t.id}`}
                            aria-current={t.id === activeId ? "true" : undefined}
                            className={t.id === activeId ? "is-active" : undefined}
                            onClick={(e) => { e.preventDefault(); onJump(t.id); }}
                        >
                            {t.label}
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}

// --- main ------------------------------------------------------------------

export function ReadingView({ doc, colors, fontFamily, title, staticExport = false }: Props) {
    const { nodes, toc } = useMemo(() => buildModel(doc.blocks), [doc.blocks]);
    const { activeId, progress } = useScrollSpy(toc);
    const [navOpen, setNavOpen] = useState(false);
    const navId = "rv-sidebar-nav";

    const jump = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        el.focus({ preventScroll: true });
        setNavOpen(false);
    };

    const rootStyle = {
        "--brand-dark": colors.primary_dark,
        "--brand-mid": colors.primary_mid,
        "--brand-light": colors.primary_light,
        "--brand-bg-soft": colors.bg_soft ?? "#F4F7FA",
        "--brand-line": colors.line ?? "#D6DEE5",
        "--brand-text": colors.text ?? "#1A1A1A",
        "--brand-text-soft": colors.text_soft ?? "#555555",
        "--rv-font": fontFamily ? `"${fontFamily}", ui-sans-serif, system-ui, sans-serif` : "ui-sans-serif, system-ui, sans-serif",
    } as CSSProperties;

    return (
        <div className={`rv-root${staticExport ? " rv-static" : ""}`} style={rootStyle}>
            {/* In static export the CSS is injected raw into the document <head>
                (renderToStaticMarkup would HTML-escape the `>` in these selectors,
                which the browser does not decode inside <style>). */}
            {!staticExport && <style>{READING_CSS}</style>}
            <a href="#rv-content" className="rv-skip">Saltar al contenido</a>

            {!staticExport && (
                <button
                    type="button"
                    className="rv-nav-toggle"
                    aria-expanded={navOpen}
                    aria-controls={navId}
                    onClick={() => setNavOpen((v) => !v)}
                >
                    {navOpen ? "Cerrar índice" : "Índice"}
                </button>
            )}

            <div className={`rv-grid${navOpen ? " rv-nav-open" : ""}`}>
                <aside className="rv-aside">
                    <Sidebar toc={toc} activeId={activeId} progress={progress} onJump={jump} navId={navId} />
                </aside>

                <main id="rv-content" className="rv-content" tabIndex={-1}>
                    <article className="rv-article">
                        {title ? <h1 className="rv-title">{title}</h1> : null}
                        {nodes.map((node, k) => {
                            switch (node.kind) {
                                case "divider":
                                    return (
                                        <section key={k} className="rv-divider" aria-labelledby={node.id}>
                                            <span className="rv-divider-num" aria-hidden="true">
                                                {String(node.num).padStart(2, "0")}
                                            </span>
                                            <h2 id={node.id} tabIndex={-1} className="rv-divider-title">{node.title}</h2>
                                        </section>
                                    );
                                case "section":
                                    return <h2 key={k} id={node.id} tabIndex={-1} className="rv-h2">{node.title}</h2>;
                                case "subsection":
                                    return <h3 key={k} id={node.id} tabIndex={-1} className="rv-h3">{node.title}</h3>;
                                case "minor":
                                    return <h4 key={k} className="rv-h4">{node.title}</h4>;
                                case "box":
                                    return (
                                        <div key={k} className="rv-box" role="group" aria-label={node.title}>
                                            <div className="rv-box-label">{node.title}</div>
                                            <ul className={`rv-box-list rv-box-${node.boxKind}`}>
                                                {node.items.map((it, j) => (
                                                    <li key={j}>{renderInline(it, doc.formulaUrls)}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                case "block":
                                    return <Block key={k} block={node.block} formulaUrls={doc.formulaUrls} />;
                                default:
                                    return null;
                            }
                        })}
                    </article>
                </main>
            </div>
            {!staticExport && navOpen && <button type="button" className="rv-scrim" aria-hidden="true" tabIndex={-1} onClick={() => setNavOpen(false)} />}
        </div>
    );
}

// --- scoped styles ---------------------------------------------------------
// Kept as a string so the reading view is self-contained and brand colors flow
// through CSS variables set on .rv-root. Uses system focus rings + adequate
// contrast; respects prefers-reduced-motion via the JS smooth-scroll guard.

export const READING_CSS = `
.rv-root { font-family: var(--rv-font); color: var(--brand-text); }
.rv-skip { position: absolute; left: -999px; top: 0; background: var(--brand-dark); color: #fff;
    padding: 8px 14px; border-radius: 0 0 8px 0; z-index: 50; }
.rv-skip:focus { left: 0; }

.rv-grid { display: grid; grid-template-columns: 1fr; gap: 0; }
@media (min-width: 1024px) {
    .rv-grid { grid-template-columns: 260px minmax(0, 1fr); gap: 40px; align-items: start; }
}

/* sidebar */
.rv-aside { }
@media (min-width: 1024px) {
    .rv-aside { position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow: auto; }
}
.rv-toc { border: 1px solid var(--brand-line); border-radius: 14px; background: #fff; padding: 16px 14px; }
.rv-toc-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.rv-toc-kicker { font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--brand-mid); }
.rv-toc-pos { font-size: 11px; color: var(--brand-text-soft); }
.rv-progress { height: 4px; border-radius: 999px; background: var(--brand-bg-soft); overflow: hidden; margin-bottom: 12px; }
.rv-progress > span { display: block; height: 100%; background: var(--brand-mid); transition: width .15s ease; }
.rv-toc-list { list-style: none; margin: 0; padding: 0; }
.rv-toc-list a { display: block; text-decoration: none; color: var(--brand-text-soft); padding: 6px 10px;
    border-radius: 8px; border-left: 2px solid transparent; font-size: 13px; line-height: 1.35; transition: background .12s, color .12s; }
.rv-toc-l2 a { padding-left: 22px; font-size: 12.5px; }
.rv-toc-list a:hover { background: var(--brand-bg-soft); color: var(--brand-dark); }
.rv-toc-list a.is-active { color: var(--brand-dark); background: var(--brand-bg-soft); border-left-color: var(--brand-mid); font-weight: 600; }
.rv-toc-list a:focus-visible { outline: 2px solid var(--brand-mid); outline-offset: 2px; }
.rv-toc-l1 { margin-top: 2px; }

/* mobile nav toggle + scrim */
.rv-nav-toggle { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 14px; font-size: 13px;
    font-weight: 600; color: var(--brand-dark); background: #fff; border: 1px solid var(--brand-line);
    border-radius: 999px; padding: 7px 16px; cursor: pointer; }
.rv-nav-toggle:focus-visible { outline: 2px solid var(--brand-mid); outline-offset: 2px; }
.rv-scrim { position: fixed; inset: 0; background: rgba(15,23,32,.4); border: 0; z-index: 39; }
@media (min-width: 1024px) { .rv-nav-toggle, .rv-scrim { display: none; } }
@media (max-width: 1023px) {
    .rv-aside { position: fixed; top: 0; left: 0; bottom: 0; width: 80%; max-width: 320px; z-index: 40;
        background: #fff; padding: 16px; overflow: auto; transform: translateX(-105%); transition: transform .2s ease;
        box-shadow: 0 10px 40px rgba(0,0,0,.18); }
    .rv-nav-open .rv-aside { transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) { .rv-aside { transition: none; } .rv-progress > span { transition: none; } }

/* content */
.rv-content { min-width: 0; }
.rv-article { max-width: 70ch; margin: 0 auto; }
.rv-title { font-size: clamp(26px, 3.4vw, 36px); line-height: 1.15; font-weight: 800; color: var(--brand-dark); margin: 4px 0 28px; }

.rv-divider { margin: 44px 0 24px; padding: 26px 28px; border-radius: 16px; background: var(--brand-dark);
    color: #fff; scroll-margin-top: 20px; }
.rv-divider-num { display: block; font-size: clamp(40px, 7vw, 72px); font-weight: 800; line-height: 1;
    color: rgba(255,255,255,.28); letter-spacing: -0.02em; }
.rv-divider-title { margin: 6px 0 0; font-size: clamp(20px, 2.6vw, 28px); font-weight: 700; color: #fff; }

.rv-h2 { font-size: clamp(20px, 2.4vw, 26px); font-weight: 700; color: var(--brand-dark); line-height: 1.2;
    margin: 38px 0 12px; padding-top: 6px; border-top: 3px solid var(--brand-light); scroll-margin-top: 20px; display: inline-block; }
.rv-h3 { font-size: clamp(16px, 1.9vw, 20px); font-weight: 700; color: var(--brand-mid); margin: 28px 0 8px; scroll-margin-top: 20px; }
.rv-h4 { font-size: 15px; font-weight: 700; color: var(--brand-dark); margin: 20px 0 6px; }

.rv-p { font-size: 16px; line-height: 1.7; margin: 0 0 14px; text-align: justify; hyphens: auto; }
.rv-term { color: var(--brand-dark); font-weight: 700; }
.rv-link { color: var(--brand-mid); text-decoration: underline; text-underline-offset: 2px; }
.rv-link:focus-visible { outline: 2px solid var(--brand-mid); outline-offset: 2px; }
.rv-code-inline { font-family: ui-monospace, "JetBrains Mono", Menlo, monospace; font-size: .88em;
    background: var(--brand-bg-soft); border: 1px solid var(--brand-line); border-radius: 5px; padding: 1px 5px; }

.rv-ul, .rv-ol { font-size: 16px; line-height: 1.65; margin: 0 0 16px; padding-left: 1.3em; }
.rv-ul li, .rv-ol li { margin: 4px 0; }
.rv-ul { list-style: none; padding-left: 0; }
.rv-ul > li { position: relative; padding-left: 1.3em; }
.rv-ul > li::before { content: ""; position: absolute; left: .25em; top: .62em; width: 6px; height: 6px;
    border-radius: 50%; background: var(--brand-mid); }
.rv-ul-sub { margin: 4px 0 4px; padding-left: .4em; }
.rv-ul-sub > li::before { background: var(--brand-light); width: 5px; height: 5px; top: .6em; }

.rv-hr { border: 0; border-top: 1px solid var(--brand-line); margin: 28px 0; }

.rv-quote { margin: 16px 0; padding: 4px 18px; border-left: 4px solid var(--brand-light);
    background: var(--brand-bg-soft); border-radius: 0 10px 10px 0; color: var(--brand-text-soft); font-style: italic; }
.rv-quote p { margin: 8px 0; }

/* crema callout boxes (Objetivos / Preguntas) */
.rv-box { margin: 22px 0; padding: 18px 20px; border-radius: 14px; background: #FBF6EC; border: 1px solid #ece1cb; }
.rv-box-label { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--brand-mid); margin-bottom: 10px; }
.rv-box-list { list-style: none; margin: 0; padding: 0; font-size: 15.5px; line-height: 1.6; }
.rv-box-list li { position: relative; padding-left: 26px; margin: 7px 0; }
.rv-box-objetivos li::before { content: ""; position: absolute; left: 2px; top: 7px; width: 9px; height: 5px;
    border-left: 2px solid var(--brand-dark); border-bottom: 2px solid var(--brand-dark); transform: rotate(-45deg); }
.rv-box-preguntas li::before { content: ""; position: absolute; left: 4px; top: 8px; width: 6px; height: 6px;
    border-radius: 50%; background: var(--brand-mid); }

/* copy-to-Claude callout */
.rv-callout { margin: 18px 0; border: 1px solid var(--brand-line); border-radius: 12px; overflow: hidden; }
.rv-callout-label { background: var(--brand-bg-soft); padding: 8px 14px; font-size: 11px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase; color: var(--brand-mid); border-bottom: 1px solid var(--brand-line); }
.rv-callout-body { margin: 0; padding: 14px; font-family: ui-monospace, "JetBrains Mono", Menlo, monospace;
    font-size: 13px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }

/* tables — brand-colored header */
.rv-table-wrap { overflow-x: auto; margin: 18px 0; }
.rv-table { width: 100%; border-collapse: collapse; font-size: 14.5px; }
.rv-table th, .rv-table td { border: 1px solid var(--brand-light); padding: 9px 12px; text-align: left; vertical-align: top; }
.rv-table th { background: var(--brand-light); color: var(--brand-dark); font-weight: 700; }
.rv-table tbody tr:nth-child(even) { background: var(--brand-bg-soft); }

/* code — Ayu-ish dark */
.rv-pre { margin: 18px 0; padding: 16px 18px; border-radius: 12px; background: #1F2430; color: #CBCCC6;
    overflow-x: auto; font-family: ui-monospace, "JetBrains Mono", Menlo, monospace; font-size: 13.5px; line-height: 1.6; }
.rv-pre:focus-visible { outline: 2px solid var(--brand-mid); outline-offset: 2px; }
.rv-pre code { font-family: inherit; white-space: pre; }

/* quiz */
.rv-quiz { margin: 18px 0; padding: 16px 18px; border: 1px solid var(--brand-line); border-radius: 12px; background: #fff; }
.rv-quiz-q { font-weight: 600; margin: 0 0 8px; }
.rv-quiz-opts { list-style: none; margin: 0; padding: 0; }
.rv-quiz-opts li { padding: 6px 10px; border: 1px solid var(--brand-line); border-radius: 8px; margin: 6px 0; font-size: 15px; }

/* figures */
.rv-figure { margin: 18px 0; text-align: center; }
.rv-figure img { max-width: 100%; height: auto; border-radius: 10px; }
.rv-figure figcaption { font-size: 12.5px; color: var(--brand-text-soft); margin-top: 8px; }
.rv-formula-block img { background: transparent; }
.rv-formula-inline { display: inline-block; vertical-align: middle; height: 1.05em; }

/* standalone HTML export: no JS to drive the drawer, so on narrow screens the
   index sits in the flow (above the content) instead of an off-canvas panel. */
@media (max-width: 1023px) {
    .rv-static .rv-aside { position: static; width: auto; max-width: none; transform: none;
        box-shadow: none; padding: 0; margin-bottom: 24px; overflow: visible; }
}
`;
