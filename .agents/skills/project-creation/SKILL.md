---
name: project-creation
description: Use this skill when creating a new project folder under projects/, or when a conversation's context (a signed SOW, a new prospect, a recurring client relationship, a new internal build) implies one should exist but doesn't yet — even if the user hasn't explicitly asked to "create a project." Covers the three things every project needs to be discoverable (context.md, a registry.yml entry, a projects/README.md row), the files created only once they have something to hold (log, calls.md, open-items.md, README.md, a services/ catalog entry), the bucket-determination logic (the buckets in `_system/config.yml`), and the anti-patterns that leave a project half-created or padded with empty files.
---

# Project Creation Protocol

Creating a project is not just `mkdir`. A project is only "created" once it is discoverable two ways: by a human browsing `projects/README.md`, and by an agent matching new material against `projects/registry.yml`. Miss either and the next call or note about it gets filed somewhere else, or nowhere.

It is also not a form to fill in. Create the files that have something to hold. An empty call log or an empty stakeholders table is not a neutral placeholder: the next session reads it as "there are no calls" or "nobody else is involved", and may be wrong.

## Before creating anything

1. **Determine the bucket.** Which commercial identity is this work under? See `buckets.list` in `_system/config.yml` and the detail in `.agents/work-contexts.md`. Skip this if you work under a single banner, or if the project is not commercial work at all.

   **Participant names alone are not enough.** Your own partners and collaborators appear on calls across every bucket, so their presence proves nothing — it is the other side's names that identify an engagement. If genuinely ambiguous, ask; never auto-create into the wrong bucket.
2. **Pick the slug.** Kebab-case. For work with a company, base it on the COMPANY name, not a contact's name — `acme-logistics`, not `jane-doe`: contacts change, the company is what the engagement is with. For your own work, name the thing — `invoice-cli`, `pricing-research`. Check `projects/` for an existing folder or near-miss name first — don't create a duplicate under a slightly different slug.
3. **Search for prior material.** Before writing anything, grep `brand/artifacts/` and `brand/transcripts/` for the names and terms involved. If prior calls exist, they must be reflected in `calls.md` and `context.md` from the start. A project that starts blank when months of real calls already sit in the repo is worse than no project — it reads as authoritative and is not.
4. **Determine actual status.** `active` only if the work is actually under way — a signed SOW for client work, real commits for a build. Otherwise `prospect`. Don't default to `active` for optimism's sake — humans read the status field to decide what is real.

## Always create

| # | File | Purpose | Template source |
|---|---|---|---|
| 1 | `projects/<slug>/context.md` | Snapshot a session reads on day one, under 400 lines: Current State (rewritten each update) / Key Decisions (one dated line each) / Open Questions / Notes & Nodes. **No dated narrative** — that goes in the log. | `.agents/templates/project/context.md` |
| 2 | `projects/registry.yml` entry | Slug, name, status, and the terms that identify this project's material: participants on the other side (if there is one) and project-specific keywords. This is how an agent filing new material recognises it as belonging here. | The schema at the top of the same file |
| 3 | `projects/README.md` row | One row in the **Active projects** table, the index of every project. | Same file |

## Create when there is something to put in it

| File | Create it when | Template source |
|---|---|---|
| `projects/<slug>/log/YYYY-MM.md` | The first dated entry: a build-log entry, a call summary, the reasoning behind a decision. One file per month, append-only, entries headed `## YYYY-MM-DD — title`. | `.agents/templates/project/log.md` |
| `projects/<slug>/calls.md` | The first call. If step 3 found prior calls, that is now — seed them. | `.agents/templates/project/calls.md` |
| `projects/<slug>/open-items.md` | The first commitment worth tracking — something someone owes, by a date. If step 3 found commitments in prior calls, seed them. | `.agents/templates/project/open-items.md` |
| `projects/<slug>/README.md` | Other people are involved, or the folder holds enough that someone opening it cold needs a map. Drop any section that would be empty. | `.agents/templates/project/README.md` |
| `services/` catalog entry | The project has a SOW or scope. Check each deliverable against `services/README.md` — reinforce an existing entry or add one. See `.agents/skills/services-catalog/SKILL.md`. | Same skill |
| *(CLI-specific)* private memory pointer | The CLI you are running has its own cross-session memory store. A **cache, never the record** — invisible to every other CLI. | `.agents/memory/index.md` |

A software project, a research thread, or anything with no other party will often be just `context.md` and a log for a long time. That is the correct shape, not a half-created project.

**When you do create one of these files, copy its template — do not improvise it.** Keep every heading and column order exactly as the template has it. Two of them are read by scripts:

- `open-items.md` — `scripts/rollup-open-items.mjs` reads the `## Open Items` table and stops at `## Closed`. Rename a heading or reorder a column and this project silently vanishes from `projects/OPEN-ITEMS.md`. No error — it just stops appearing.
- `context.md` — the health scan flags any `context.md` over 400 lines, which is what happens when dated entries get stacked in it instead of in the log.

**Everything a future session actually needs must be in the committed files, not in private memory.** A fact that lives only in one CLI's memory store is lost the moment the owner opens a different tool. If something portable surfaces while creating the project, put it in `context.md` or the relevant `.agents/` file.

## Commit discipline

Stage only the files this task actually touched — never `git add -A` in this repo, given how much untracked scratch/export data typically sits in `projects/*/`. New commit, no `--no-verify`. For push behaviour and the concurrent-session verification step, follow `.agents/working-agreements.md` § Git and delivery — that file is the authority.

## Anti-patterns

- **Creating context.md alone and stopping.** Without the registry entry and the index row, nothing finds the project: a human browsing the index misses it, and the next call about it gets filed elsewhere.
- **Creating every template "to be complete".** Four files where three are empty tables tell the next session there is nothing to record. Create a file when it has its first entry.
- **Defaulting status to `active`.** Only work actually under way is active.
- **Starting calls.md blank when prior calls exist.** Always search `brand/artifacts/` and `brand/transcripts/` first.
- **Duplicating context.md's decision log into a private memory file.** Memory is a pointer + the handful of facts that change how you'd behave — not a second copy of the project history.
- **Skipping `projects/registry.yml`.** The easiest one to forget, because nothing breaks immediately — the next call or note about this project just gets filed somewhere else, and someone has to notice and backfill it later.
