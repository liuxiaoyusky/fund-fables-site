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
