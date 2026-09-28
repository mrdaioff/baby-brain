# Projects

One folder per unit of work — a client engagement, an internal build, a
research thread. **This directory is the source of truth for
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
    log/YYYY-MM.md  — dated entries, one file per month, append-only
    README.md       — goal, stakeholders, at a glance     (when useful)
    calls.md        — call log, linked to brand/artifacts/ (from the first call)
    open-items.md   — who owes what, by when               (from the first commitment)
    sops/           — standard operating procedures        (optional)
```

Only `context.md` is required. The others are created the first time they
have something to hold — an empty table is not a record, it is a claim that
there is nothing to record. Templates for all of them are in
`.agents/templates/project/`.

`context.md` has four sections:

- **Current State** — rewritten each update, never appended to
- **Key Decisions** — append-only, one dated line each
- **Open Questions** — what is unresolved
- **Notes & Nodes** — append-only, dated

The append-only sections are append-only on purpose. A decision log you can
rewrite is a decision log you cannot trust six months later.

`context.md` is a snapshot, not a history. It stays under 400 lines (the health
scan flags it past that) and never carries a dated paragraph. Everything dated —
build-log entries, call summaries, post-mortems, the reasoning behind a decision —
goes in `log/YYYY-MM.md`, one file per month, append-only, with entries headed
`## YYYY-MM-DD — title`. A session reads `context.md` to learn what is true
today; it reads the log only when it needs to know how things got that way.

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

Use the `project-creation` skill. A project is only really created once it is
discoverable two ways: by a human browsing this table, and by an agent matching
new material against `registry.yml`. Miss either and the next call or note about
it gets filed somewhere else.
