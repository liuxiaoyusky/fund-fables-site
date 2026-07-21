"""Build accessible, recursive book catalogs from the real Markdown tree.

Pages opt in with a ``catalog_source`` front-matter value and a
``<!-- catalog-tree -->`` marker. MkDocs replaces the marker with static
``details``/``summary`` markup, while catalog.js adds progress and the desktop
preview pane. The static tree remains navigable without JavaScript.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from html import escape
from pathlib import Path
import re
from typing import Iterable


CATALOG_MARKER = "<!-- catalog-tree -->"
ROOT_PAGE_NAMES = {"index.md", "catalog.md", "progress.md"}
NUMBERED_SLUG = re.compile(r"^(\d+(?:-\d+)*)-(.+)$")
HEADING = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)
FRONT_MATTER_TITLE = re.compile(r"^title:\s*(.+?)\s*$", re.MULTILINE)
DISPLAY_NUMBER_PREFIX = re.compile(r"^\d+(?:\.\d+)*[、.．]\s*")


@dataclass
class CatalogNode:
    id: str
    kind: str
    label: str
    number: str = ""
    source_uri: str = ""
    children: list["CatalogNode"] = field(default_factory=list)
    story_count: int = 0


def natural_key(value: str) -> list[tuple[int, object]]:
    """Sort path segments so 2 comes before 10, including mixed CJK names."""

    return [
        (0, int(part)) if part.isdigit() else (1, part.casefold())
        for part in re.split(r"(\d+)", value)
        if part
    ]


def split_number(slug: str) -> tuple[str, str]:
    match = NUMBERED_SLUG.match(slug)
    if not match:
        return "", slug.replace("-", " ")
    return match.group(1).replace("-", "."), match.group(2).replace("-", " ")


def extract_story_title(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            match = FRONT_MATTER_TITLE.search(text[3:end])
            if match:
                return DISPLAY_NUMBER_PREFIX.sub("", match.group(1).strip().strip("\"'"))
    match = HEADING.search(text)
    return DISPLAY_NUMBER_PREFIX.sub("", match.group(1).strip()) if match else ""


def _find_or_create_branch(parent: CatalogNode, node_id: str, slug: str) -> CatalogNode:
    for child in parent.children:
        if child.id == node_id:
            return child
    number, label = split_number(slug)
    child = CatalogNode(id=node_id, kind="branch", label=label, number=number)
    parent.children.append(child)
    return child


def _finalise(node: CatalogNode) -> int:
    node.children.sort(key=lambda child: natural_key(child.id.rstrip("/").split("/")[-1]))
    if node.kind == "leaf":
        node.story_count = 1
        return 1
    node.story_count = sum(_finalise(child) for child in node.children)
    return node.story_count


def build_catalog(source_dir: Path, source_uri: str = "") -> CatalogNode:
    """Return a variable-depth tree rooted at ``source_dir``."""

    root = CatalogNode(id="", kind="root", label=source_dir.name)
    markdown_files = sorted(
        (
            path
            for path in source_dir.rglob("*.md")
            if path.relative_to(source_dir).parts[0] not in ROOT_PAGE_NAMES
            and path.name not in ROOT_PAGE_NAMES
            and len(path.relative_to(source_dir).parts) >= 2
        ),
        key=lambda path: [natural_key(part) for part in path.relative_to(source_dir).parts],
    )

    for path in markdown_files:
        relative = path.relative_to(source_dir)
        parent = root
        path_parts: list[str] = []
        for directory in relative.parts[:-1]:
            path_parts.append(directory)
            parent = _find_or_create_branch(parent, "/".join(path_parts) + "/", directory)

        stem = relative.stem
        path_parts.append(stem)
        number, fallback_label = split_number(stem)
        label = extract_story_title(path) or fallback_label
        relative_uri = relative.as_posix()
        file_source_uri = f"{source_uri.rstrip('/')}/{relative_uri}" if source_uri else relative_uri
        parent.children.append(
            CatalogNode(
                id="/".join(path_parts),
                kind="leaf",
                label=label,
                number=number,
                source_uri=file_source_uri,
            )
        )

    _finalise(root)
    return root


def iter_leaves(node: CatalogNode) -> Iterable[CatalogNode]:
    for child in node.children:
        if child.kind == "leaf":
            yield child
        else:
            yield from iter_leaves(child)


def _node_attrs(node: CatalogNode) -> str:
    return (
        f'data-node-id="{escape(node.id, quote=True)}" '
        f'data-node-label="{escape(node.label, quote=True)}" '
        f'data-story-count="{node.story_count}"'
    )


def _render_nodes(nodes: list[CatalogNode], page, files, level: int = 0) -> str:
    from mkdocs.utils import get_relative_url

    parts = [f'<ol class="catalog-tree__list catalog-tree__list--level-{level}">']
    for node in nodes:
        if node.kind == "branch":
            parts.append(f'<li class="catalog-tree__item catalog-tree__item--branch" {_node_attrs(node)}>')
            parts.append(f'<details data-catalog-branch {_node_attrs(node)}>')
            parts.append(f'<summary class="catalog-tree__row" {_node_attrs(node)}>')
            parts.append('<span class="catalog-tree__row-content">')
            parts.append(f'<span class="catalog-tree__number">{escape(node.number)}</span>')
            parts.append(f'<span class="catalog-tree__label">{escape(node.label)}</span>')
            parts.append(f'<span class="catalog-tree__count">{node.story_count} 篇</span>')
            parts.append('<span class="catalog-tree__status" data-role="branch-status">未开始</span>')
            parts.append('</span></summary>')
            parts.append(_render_nodes(node.children, page, files, level + 1))
            parts.append('</details></li>')
            continue

        target = files.get_file_from_path(node.source_uri)
        href = get_relative_url(target.url, page.url) if target else "#"
        parts.append(f'<li class="catalog-tree__item catalog-tree__item--leaf" {_node_attrs(node)}>')
        parts.append(
            f'<a class="catalog-tree__row catalog-tree__row--leaf" '
            f'data-catalog-leaf {_node_attrs(node)} href="{escape(href, quote=True)}">'
        )
        parts.append(f'<span class="catalog-tree__number">{escape(node.number)}</span>')
        parts.append(f'<span class="catalog-tree__label">{escape(node.label)}</span>')
        parts.append('<span class="catalog-tree__status" data-role="leaf-status">未读</span>')
        parts.append('</a></li>')
    parts.append('</ol>')
    return "\n".join(parts)


def render_catalog(root: CatalogNode, page, files) -> str:
    return (
        f'<nav class="catalog-tree" data-catalog-tree data-story-count="{root.story_count}" '
        'aria-label="本书多级目录">'
        f'{_render_nodes(root.children, page, files)}'
        '</nav>'
    )


def on_page_markdown(markdown: str, page, config, files, **kwargs) -> str:
    source_uri = page.meta.get("catalog_source")
    if not source_uri or CATALOG_MARKER not in markdown:
        return markdown

    source_dir = Path(config.docs_dir) / source_uri
    if not source_dir.is_dir():
        raise FileNotFoundError(f"Catalog source does not exist: {source_dir}")

    root = build_catalog(source_dir, source_uri)
    return markdown.replace(CATALOG_MARKER, render_catalog(root, page, files))
