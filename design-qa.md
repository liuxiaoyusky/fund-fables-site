# Design QA — Story Route B

Date: 2026-07-21
Scope: homepage, bookshelf/directory, and reader in the approved light-theme direction. Dark mode remains functional but provisional and is not part of this visual acceptance.

## Reference and implementation inputs

| Surface | Reference visual | Implementation screenshot |
| --- | --- | --- |
| Homepage | `/Users/xiaoyuliu/.codex/visualizations/2026/07/17/019f70c1-59f7-7830-9201-3bf418fbd66f/fund-fables-directions/story-route.png` | `screenshots/story-route-home-1440.png` |
| Versioned directory | `/Users/xiaoyuliu/.codex/visualizations/2026/07/17/019f70c1-59f7-7830-9201-3bf418fbd66f/fund-fables-directions/story-route-directory.png` | `screenshots/story-route-directory-1440.png` |
| Reader | `/Users/xiaoyuliu/.codex/visualizations/2026/07/17/019f70c1-59f7-7830-9201-3bf418fbd66f/fund-fables-directions/story-route-reader.png` | `screenshots/story-route-reader-1440.png` |

Comparison viewport: 1440 × 1024, light theme, top-of-page, v2 selected, and the first v2 reader page. The reference's mixed reading counts are illustrative content; the implementation capture intentionally uses a new-reader state so progress comes from real local reading history rather than seeded display data.

## Same-input visual comparisons

Full-page comparisons:

- `screenshots/design-qa-home-comparison.png`
- `screenshots/design-qa-directory-comparison.png`
- `screenshots/design-qa-reader-comparison.png`

Focused top/content comparisons:

- `screenshots/design-qa-home-focus.png`
- `screenshots/design-qa-directory-focus.png`
- `screenshots/design-qa-reader-focus.png`

The final comparison pass found no open P0, P1, or P2 visual issues. The implementation preserves the selected direction's cool fog canvas, navy editorial typography, coral current-state cue, flat one-pixel frame, route rail, compact mono metadata, and restrained three-pixel corner radius.

## Issue history and fixes

| Severity | Finding | Resolution |
| --- | --- | --- |
| P1 | Reader header switched from the library brand to the current page title. | Pinned the first header topic and removed the animated secondary topic. |
| P1 | The default secondary table of contents competed with the quiet reading column. | Removed the secondary sidebar on reader pages while keeping the dedicated book-directory navigation. |
| P1 | Percent-encoded Chinese paths could prevent reader tools from initializing. | Normalized and decoded paths before route matching. |
| P2 | Homepage progress and actions were too small and horizontally compressed versus the reference. | Added a real progress label, 24px mono count, full-width primary action, and stacked secondary action. |
| P2 | The desktop search control was narrower than the reference. | Measured the rendered slot and set the form to 480px at the 1440px acceptance viewport. |
| P2 | Text glyphs were being used as download/highlight icons. | Removed fake glyph icons; the global download action uses the Material icon library. |
| P2 | Version tabs lacked complete keyboard and tab-state behavior. | Added roving `tabindex`, `aria-controls`, and Arrow/Home/End handling. |

## Interaction QA

- Homepage and directory show the real `Download Skill` ZIP action; reader pages omit it to reduce distraction.
- All five shelf rows remain visible, restore real reading state, and activate by mouse, Enter, or Space.
- v2/v1 tabs switch the corresponding home and chapter panels; click and ArrowLeft were verified with correct `aria-selected`, `tabindex`, and `hidden` states.
- Reader tools resolve `主页`, canonical `本书目录`, previous, and next destinations; the first page reports `001 / 196`.
- Highlight panel opens from `aria-expanded="false"` to `true`; save and clear controls become available without clearing existing user highlights during QA.
- Browser console error count after loading homepage, directory, and reader: 0.

## Responsive QA

Viewport: 390 × 844.

- `screenshots/story-route-home-390.png`
- `screenshots/story-route-directory-390.png`
- `screenshots/story-route-reader-390.png`

All three surfaces reported `scrollWidth = 390` at `innerWidth = 390`; no horizontal overflow was present. Primary actions remain at least 48px high, directory controls collapse to a two-column grid, and the reader keeps a comfortable text column with reachable highlight controls.

## Automated checks

- `mkdocs build --strict`: passed.
- `node --check` for `library.js`, `reading-tools.js`, and `reading-tracker.js`: passed.
- `npx --yes @google/design.md lint DESIGN.md`: 0 errors, 0 warnings, 1 informational inventory finding.
- `git diff --check`: passed.
- `unzip -t docs/downloads/skills/fable-teacher.zip`: passed.

Final result: passed

---

# Design QA — Version Gateway + Recursive Catalog

Date: 2026-07-21
Scope: the approved three-part flow: version gateway, desktop recursive catalog, and the same catalog structure on mobile.

## Reference and implementation inputs

| Surface | Reference visual | Implementation screenshot |
| --- | --- | --- |
| Version gateway | `/Users/xiaoyuliu/.codex/generated_images/019f70c1-59f7-7830-9201-3bf418fbd66f/exec-6420b832-f7df-41e2-9268-6c281067d3d4.png` | `screenshots/version-gateway-1440.png` |
| Desktop recursive catalog | `/Users/xiaoyuliu/.codex/generated_images/019f70c1-59f7-7830-9201-3bf418fbd66f/exec-106a7e44-e437-47ea-ae01-d59fccca415d.png` | `screenshots/recursive-catalog-1440.png` |
| Mobile recursive catalog | `/Users/xiaoyuliu/.codex/generated_images/019f70c1-59f7-7830-9201-3bf418fbd66f/exec-b0b7cdbd-a29a-4fff-910a-e7373826d199.png` | `screenshots/recursive-catalog-390.png` |

The references and implementation captures were opened together in one comparison pass. Desktop captures use 1440 × 1024; mobile uses 390 × 844. The gateway is shown with the classic edition selected. The catalog uses actual local reading state, so its 1 / 570 progress is data-driven rather than seeded to match illustrative reference numbers.

## Fidelity result

The three implementation states preserve the approved direction: cool fog canvas, flat ruled surface, book-family display type, mono route metadata, coral current-state cue, sea progress roles, a selected version row, and a recursive route line. The desktop catalog has a tree/preview split; mobile retains the same tree and removes only the duplicate preview pane. No new decorative image asset was introduced: the established numeric route node was retained instead of raster-extracting emblems from the exploratory source.

No P0, P1, or P2 finding remains open.

## Issue history and fixes

| Severity | Finding | Resolution |
| --- | --- | --- |
| P1 | Material styled recursive `details` as blue admonition cards and added edit icons plus alpha/roman counters. | Scoped resets to the catalog tree while retaining native `details / summary` semantics and disclosure behavior. |
| P1 | Programmatic ancestor expansion could select the outer chapter after the deepest current section. | Selection now changes only through an explicit summary interaction; initial preview stays on the current section. |
| P1 | Selecting IIQE v1 could pair v1 reading state with the shelf's v2 subtitle, lead, and 196-story denominator. | Added version-aware shelf metadata so v1 consistently reports its own copy and 205-story total. |
| P2 | Legacy `lastSection` state could show a current story while total progress still read 0. | The current story is included in the derived seen set before branch and total progress are calculated. |
| P1 | The four-track version row could clip metadata at 768px while global overflow hiding masked the problem. | Raised the compact gateway/catalog breakpoint to 860px and verified the real 768px layout after collapse. |
| P2 | A desktop preview duplicated the same information on narrow screens. | At 860px and below the preview is hidden and the canonical recursive tree becomes the single-column experience. |

## Interaction and accessibility QA

- Version rows expose `radiogroup` / `radio`, checked state, roving tabindex, and Arrow navigation. Classic resolves to a real catalog; the LOL edition changes the CTA to disabled and removes its href.
- Recursive branches use native disclosure controls. Current, seen, unread, and complete states use text in addition to color.
- Reader pages return to their exact edition catalog: fund classic → `/fables/fund-fables/catalog/`, IIQE v2 → `/fables/iique-paper-1-v2/catalog/`.
- Core mobile rows are at least 48px tall; focus outlines use the current-state role; reduced-motion removes transitions.
- Browser console warnings/errors across gateway, catalog, and reader checks: 0.

## Content and responsive QA

- Fund classic: 18 chapters / 570 stories; mixed direct-story and nested-section chapters render together.
- Private equity: 9 chapters / 568 stories.
- IIQE v1: 7 chapters / 205 stories; IIQE v2: 7 chapters / 196 stories.
- At 1440, 768, and 390px, `scrollWidth` equals `innerWidth`; no horizontal overflow or clipped grid content was found. At 768px the gateway and catalog use the compact single-column structure.
- `screenshots/version-gateway-768.png` covers the selected-but-unavailable LOL state and its disabled CTA; `screenshots/recursive-catalog-768.png` covers the compact recursive catalog.
- At 390px the preview pane is absent, two ancestors on the current route are expanded, and one current story is exposed.

## Automated checks

- `.venv/bin/python -m unittest scripts/test_catalog_hook.py`: passed.
- `node --check docs/javascripts/catalog.js`: passed.
- `.venv/bin/mkdocs build --strict`: passed.
- `npx --yes @google/design.md lint DESIGN.md`: 0 errors, 0 warnings, 1 informational inventory finding.
- `git diff --check`: passed.

final result: passed
