---
name: services-catalog
description: Use when creating a new project, ingesting a SOW/proposal/pitch-shaped transcript, brainstorming what to sell a prospect, or when given context about a company and needing ideas for what the owner could offer them. Maintains services/ as a living catalog of concrete, sellable service offerings (not abstract business theory — that stays in knowledge_base/) drawn from real scoped work, signed SOWs, pitches, and brainstorms. Defines the service lifecycle (idea/pitched/scoped/delivered/proven), the catalog schema, and the trigger points where it must be updated automatically.
---

# Services Catalog Protocol

`services/` answers one question fast: **"Based on everything the owner has actually scoped, pitched, or delivered before, what could we sell this company?"** It is the concrete, sellable counterpart to `knowledge_base/business/` and `knowledge_base/sales/`, which capture the abstract theory behind pricing and positioning. A knowledge_base entry explains *why* a pricing model works; a `services/` entry is the *menu item* itself — name, what it is, what it costs, who's bought it.

Never mix the two: if you catch yourself writing "the psychology of X" or "why Y works," that belongs in `knowledge_base/`. If you're writing "here is a thing we sell and here's what it costs," that belongs in `services/`.

## Structure

```
services/
  README.md       — the catalog index: one row per service (Name | Category | Status | Pricing | Proof points)
  <slug>.md        — one file per distinct service
```

Each `services/<slug>.md` uses this frontmatter:

```yaml
---
name: A short, concrete name for the thing you sell
category: <one of your own categories — see below>
status: idea | pitched | scoped | delivered | proven
first_seen: YYYY-MM-DD
last_reinforced: YYYY-MM-DD
origin_projects: [slugs from projects/registry.yml, or "none" if brainstormed only]
related_concepts:
  - "[[knowledge_base/<domain>/<the-theory-behind-it>]]"
---
```

**Categories are yours to invent.** Do not copy a list from anywhere — write the
five to ten groupings that match what you actually sell, in your own words, and
keep them stable once chosen. A category taxonomy borrowed from another business
quietly reshapes how you think about your own offering, and it shows up in every
proposal you generate from this catalog afterwards.

Body sections: **What it is** (2-4 sentences) / **Pricing model** (exact numbers where known, or "not yet priced") / **Proof points** (which real client engagement used it, with a link to `projects/<slug>/` or the source transcript — or "brainstormed only, no client yet") / **Related concepts** (links into `knowledge_base/`).

## The status lifecycle

Mirrors the knowledge_base emergent → validated → canonical pattern, but scoped to commercial reality:

- **idea** — brainstormed (in conversation, a strategy session, or a knowledge_base concept) but never actually proposed to a real prospect
- **pitched** — proposed to a specific real prospect, no signed engagement yet
- **scoped** — written into an actual SOW or proposal with real pricing attached, for a signed or near-signed deal
- **delivered** — actually performed for at least one paying client
- **proven** — delivered profitably for 2+ clients; a repeatable, standardized offering

A service only moves forward on real evidence (a SOW, a signed engagement, a second client) — never bump status on optimism. This is the same discipline `project-creation` uses for `active` vs `prospect`.

## When to update the catalog (trigger points)

1. **New project created** (`project-creation` skill fires) — read the project's SOW/scope. For each distinct deliverable in it: if it matches an existing `services/<slug>.md`, bump `last_reinforced`, add the project to `origin_projects`, and consider a status bump (e.g. pitched → scoped once a real SOW exists, scoped → delivered once work is actually underway, delivered → proven if this is the 2nd+ client). If it's a genuinely new offering, create a new `services/<slug>.md` at `pitched` or `scoped` depending on whether it's signed.
2. **Ingesting a SOW, proposal, or pitch-shaped transcript** (`librarian` skill fires on ingestion) — same check as above, applied to whatever the document describes, even if no project folder exists yet (e.g. a prospect that never signs still counts as `pitched`).
3. **A brainstorming or strategy session surfaces a new offer idea** (no client attached yet) — add it at `idea` status so it doesn't get lost, same way `knowledge_base` captures `emergent` concepts from a call.
4. **Never retroactively remove a service that stalled.** If a prospect went cold, leave its status where it last had real evidence — don't delete, don't silently downgrade.

## Using the catalog to brainstorm for a new company

When the user gives context about a company (a new prospect, a call, a research pass) and wants ideas for what to sell them: read `services/README.md` first and reason from what's already proven/delivered/scoped before inventing something new from scratch. Precedent — "we've sold this exact thing to N companies before" — is a stronger pitch than a fresh idea with zero proof points. Only propose something at `idea` status if nothing in `scoped`/`delivered`/`proven` fits, and say so explicitly ("this would be new territory — we haven't sold this before").

## Anti-patterns

- **Treating this like knowledge_base.** Don't write theory, psychology, or market analysis here — link to the relevant `knowledge_base/` entry instead.
- **One giant catalog file.** Keep one file per service so status/evidence changes are a small diff, same reasoning as one-concept-per-file in `knowledge_base/`.
- **Forgetting `services/README.md`.** The index table is the fast-scan entry point; a service that only exists as an orphan file is undiscoverable in practice.
- **Bumping status without evidence.** A brainstormed idea is not "scoped" until a real SOW says so.
