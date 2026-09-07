---
name: project-creation
description: Use this skill when creating a new project folder under projects/, or when a conversation's context (a signed SOW, a new prospect, a recurring client relationship) implies one should exist but doesn't yet — even if the user hasn't explicitly asked to "create a project." Covers the seven committed artifacts a project needs to be discoverable (context.md, README.md, calls.md, open-items.md, registry.yml entry, projects/README.md row, and a services/ catalog check), the bucket-determination logic (the buckets in `_system/config.yml`), and the anti-patterns that leave a project half-created.
---

# Project Creation Protocol

Creating a project is not just `mkdir` + one file. A project is only "created" once it is discoverable three ways: by a human browsing `projects/`, by the automated call router, and by a future Claude session loading memory. Missing any one of these means the next session re-derives context that already existed, or a real client call gets silently dropped instead of routed.

Your guiding principle: a project isn't real until it shows up in all three places someone would look for it.

## Before creating anything

1. **Determine the bucket.** Which commercial identity is this work under? See `buckets.list` in `_system/config.yml` and the detail in `.agents/work-contexts.md`. Skip this if you work under a single banner.

   **Participant names alone are not enough.** Your own partners and collaborators appear on calls across every bucket, so their presence proves nothing — it is the client-side names that identify an engagement. If genuinely ambiguous, ask; never auto-create into the wrong bucket.
2. **Pick the slug.** Kebab-case, based on the COMPANY name, not a contact's name — `acme-logistics`, not `jane-doe`. Contacts change; the company is what the engagement is with. Check `projects/` for an existing folder or near-miss name first — don't create a duplicate under a slightly different slug.
3. **Search for prior calls.** Before writing anything, grep `brand/artifacts/` and `brand/transcripts/` for the client/contact names. If prior calls exist, they must be reflected in `calls.md` and `context.md` from the start — don't create a project that starts "blank" when real history already exists in the repo. (A project that starts blank when months of real calls already sit in the repo is worse than no project — it reads as authoritative and is not.)
4. **Determine actual status.** `active` only if there's a signed SOW or engagement. Otherwise `prospect`. Don't default to `active` for optimism's sake — the status field is read by humans deciding what's real revenue vs. pipeline.

## What to create (all of these, every time)

| # | File | Purpose | Template source |
|---|---|---|---|
| 1 | `projects/<slug>/context.md` | Living intelligence: Current State (rewritten each update) / Key Decisions (append-only, dated) / Open Questions / Notes & Nodes (append-only, dated) | `.agents/templates/project/context.md` |
| 2 | `projects/<slug>/README.md` | Status, Client, Started, Goal, Key Files, Stakeholders table, Current State snapshot | `.agents/templates/project/README.md` |
| 3 | `projects/<slug>/calls.md` | Auto-updated call log table (date / title / artifact link / transcript link). Seed manually with any calls found in step 3 above, and note the file was seeded manually if it predates the registry entry | `.agents/templates/project/calls.md` |
| 4 | `projects/<slug>/open-items.md` | Commitment tracker: who owes what, due date, status. The project router appends to this automatically from each call artifact's "Commitments & Open Items" section, so the file must exist (or the router will create it) for commitments to land anywhere. Seed with any commitments found in the prior calls from step 3 | `.agents/templates/project/open-items.md` |
| 5 | `projects/registry.yml` | Add an entry: slug, name, status, participants (client-side names — reliable signal), keywords. This is what lets the automated project router catch future transcripts | See existing entries in the same file |
| 6 | `projects/README.md` | Add a row to the **Active Projects** table (index of every project — the file's own stated purpose is "source of truth for project context") | Same file |
| 7 | `services/` catalog | If the project has a SOW/scope, check each deliverable against `services/README.md` — reinforce existing entries (new proof point, status bump) or add new ones. See `.agents/skills/services-catalog/SKILL.md` | Same skill |
| 8 | *(optional, CLI-specific)* private memory entry | If the CLI you're running has its own cross-session memory store, add a short orientation pointer + index line. This is a **cache, never the record** — it is invisible to every other CLI | `.agents/memory/index.md` |

**Copy the templates in `.agents/templates/project/` — do not improvise these
files.** Three of them have a machine contract, not merely a convention:

- `context.md` — the project router locates **Current State**, **Key Decisions**,
  **Open Questions** and **Notes & Nodes** by heading name when it writes a
  matched call into the project.
- `open-items.md` — the router appends to the `## Open Items` table, and
  `scripts/rollup-open-items.mjs` reads that table and stops at `## Closed`.
  Rename a heading or reorder a column and this project silently vanishes from
  `projects/OPEN-ITEMS.md`. No error — it just stops appearing.
- `calls.md` — the router appends rows in the template's exact column order.

Improvising a plausible-looking variant is the failure mode here, because
everything looks correct until the first routed call lands and quietly does
nothing.

Do all seven required items. A project missing #5 means future calls with this client silently fail to route. Missing #4 means every commitment made on those calls has nowhere to land. Missing #7 means real scoped work never makes it into the sales-brainstorming catalog.

**Everything a future session actually needs must be in the committed files (#1–#7), not in #8.** A fact that lives only in one CLI's private memory is lost the moment the owner opens a different tool. If something portable surfaces while creating the project, put it in `context.md` or the relevant `.agents/` file.

## Commit discipline

Stage only the files this task actually touched — never `git add -A` in this repo, given how much untracked scratch/export data typically sits in `projects/*/`. New commit, no `--no-verify`. For push behaviour and the concurrent-session verification step, follow `.agents/working-agreements.md` § Git and delivery — that file is the authority.

## Anti-patterns

- **Creating context.md alone and stopping.** It satisfies the "keep the written record current" rule in `.agents/working-agreements.md` but leaves the project undiscoverable by the router and by future sessions.
- **Defaulting status to `active`.** Only signed engagements are active; everything else is `prospect` (or whatever the real state is).
- **Starting calls.md blank when prior calls exist.** Always search `brand/artifacts/`/`brand/transcripts/` first.
- **Duplicating context.md's full decision log into a private memory file.** Memory is a pointer + the handful of facts that change how you'd behave (pricing sensitivity, tool constraints, routing triggers) — not a second copy of the project history.
- **Skipping `projects/registry.yml`.** This is the easiest one to forget because nothing breaks immediately — it just means the next real call with this client never gets auto-routed, and someone has to notice and backfill it later, as happened here.
