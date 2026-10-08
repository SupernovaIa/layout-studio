"""Parser edge cases: tables and ordered lists."""

from layout_studio_renderer import render_markdown_to_pdf, reference_brand
from layout_studio_renderer.parser import parse_markdown


def _types(md: str) -> list[str]:
    return [b["type"] for b in parse_markdown(md)[1]]


def test_pipe_line_before_rule_is_not_a_table():
    assert "table" not in _types("a | b\n---\n\ntext\n")


def test_pipe_line_before_bullet_is_not_a_table():
    blocks = parse_markdown("use a | b here\n- item\n")[1]
    assert [b["type"] for b in blocks] == ["p", "ul"]


def test_single_column_table_still_parses():
    blocks = parse_markdown("| a |\n|---|\n| 1 |\n")[1]
    assert blocks == [{"type": "table", "header": ["a"], "rows": [["1"]]}]


def test_pipe_inside_inline_code_does_not_split_cell():
    blocks = parse_markdown("| a | b |\n|---|---|\n| `x|y` | 2 |\n")[1]
    assert blocks[0]["rows"] == [["`x|y`", "2"]]


def test_escaped_pipe_does_not_split_cell():
    blocks = parse_markdown("| a | b |\n|---|---|\n| x \\| y | 2 |\n")[1]
    assert blocks[0]["rows"] == [["x | y", "2"]]


def test_ordered_list_split_by_blank_line_keeps_source_numbers():
    blocks = parse_markdown("1. a\n\n2. b\n\n3. c\n")[1]
    assert [(b["type"], b["start"]) for b in blocks] == [("ol", 1), ("ol", 2), ("ol", 3)]


def test_ordered_list_start_defaults_to_first_number():
    blocks = parse_markdown("4. a\n5. b\n")[1]
    assert blocks[0]["start"] == 4
    assert len(blocks[0]["items"]) == 2


def test_bullets_nested_under_ordered_item_become_children():
    blocks = parse_markdown("1. one\n   - sub a\n   - sub b\n2. two\n")[1]
    assert blocks[0]["items"] == [
        {"text": "one", "children": ["sub a", "sub b"]},
        {"text": "two", "children": []},
    ]


def test_renders_pdf_with_nested_and_split_lists():
    md = "1. one\n   - sub\n\n2. two\n\n| a | b |\n|---|---|\n| `x|y` | 2 |\n"
    assert render_markdown_to_pdf(md, reference_brand()).startswith(b"%PDF-")
