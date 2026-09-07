---
project: {slug}
type: open-items
updated: {YYYY-MM-DD}
---

# {Project Name} — Open Items

**Status:** 🔴 open / not started · 🟡 in progress · ✅ done · ⚪ waiting on
someone else, no action needed from us right now · 👤 human-only

> The project router appends a row here for every commitment it finds in a
> matched call, and `scripts/rollup-open-items.mjs` reads this table to build
> the cross-project view at `projects/OPEN-ITEMS.md`.
>
> Both depend on this exact shape: the `## Open Items` heading, the column
> order below, and `## Closed` as the boundary the rollup stops at. Rename a
> heading or reorder a column and this project silently drops out of the
> rollup — no error, it just stops appearing.
>
> **The router never closes an item.** It only ever appends 🔴 or ⚪. Marking
> something ✅ is for a human, or for a session that actually did the work.
>
> Delete this block once the project is real.

## Open Items

| # | Logged | Owner | Item | Due | Status |
|---|---|---|---|---|---|

## Closed

_Move rows here once done. The rollup stops reading at this heading, so
anything below it is out of the cross-project view._

| # | Logged | Owner | Item | Closed | Status |
|---|---|---|---|---|---|
