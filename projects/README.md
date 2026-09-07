# Projects

One folder per unit of client work. **This directory is the source of truth for
project context** — it supersedes any external tracker (Notion, a CRM, a
spreadsheet). If the two disagree, this wins, and the other one gets updated.

> Called something else in your business? The install skill renames this
> directory — `clients`, `engagements`, `opportunities`, `matters`, `deals`.
> `_system/config.yml` records what it is called here.

## Structure

```
projects/
  <slug>/
    context.md      — the living record. Read before working, write after.
    README.md       — goal, stakeholders, current state at a glance
    calls.md        — call log, linked to brand/artifacts/
    open-items.md   — commitment tracker: who owes what, by when
    sops/           — standard operating procedures (optional)
```

`context.md` is the important one. It has four sections:

- **Current State** — rewritten each update, never appended to
- **Key Decisions** — append-only, dated
- **Open Questions** — what is unresolved
- **Notes & Nodes** — append-only, dated

The append-only sections are append-only on purpose. A decision log you can
rewrite is a decision log you cannot trust six months later.

## Active projects

| Name | Slug | Company | Status |
|---|---|---|---|
| _none yet_ | | | |

<!-- Column 3 is deliberately "Company", not "Client": if you renamed this
     directory to `clients/` at install time, a "Client" column collides with
     the word now meaning the unit of work itself. "Company" stays unambiguous
     under every vocabulary. -->

Add a row here whenever you create a project. A project missing from this table
is a project the next person browsing the repo will not find.

## Adding one

Use the `project-creation` skill. It exists because creating a project is not
one directory and one file — a project is only really created once it is
discoverable three ways: by a human browsing this table, by the automation that
routes incoming calls, and by a future agent session loading context. Miss any
one and something silently stops working.

## How calls get routed

At Tier 1, when a transcript is ingested into `brand/artifacts/`, the
project router:

1. Pre-filters it against `registry.yml` on participants and keywords
2. If there is overlap, asks an agent to classify it
3. If it is primarily about a project, appends a row to that project's
   `calls.md` and any commitments to `open-items.md`, then opens a PR

`registry.yml` is a pre-filter, not the decision. Keep it loose enough to catch
real calls and specific enough not to catch everything.
