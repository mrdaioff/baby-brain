# Agent Instructions

This is the **single canonical source** of repository-wide rules for any AI coding agent working here — Claude Code, Codex, Copilot, Gemini, Cursor, or whatever exists next year. Every instruction file at the repo root (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.github/copilot-instructions.md`) is **generated from this file**. Edit this one, then run `npm run sync:agents`. See `.agents/README.md` for how that works and how to add a new CLI.

**If `_system/install.yml` is missing or says `tier: unset`, stop and read `.agents/skills/install/SKILL.md` first.** This repo has not been set up yet.

---

## The rule this repo exists to enforce

Everything below is machinery. This is the part that matters:

**The repo is the source of truth. Read it before you work; write to it after.**

Concretely, every session:

1. **Before working on a unit of client work**, read that folder's `context.md`. All of it. It exists so you do not re-derive what a previous session already established, and so you do not contradict a decision that was already made.
2. **After doing anything meaningful** — a build, a decision, a bug fixed, a validation passed, an open item closed — update `context.md` and `open-items.md` without being asked. Then commit and push.
3. **When something important surfaces in conversation and is not written down anywhere, write it down and say so in chat.**

An agent's own memory does not count. Every CLI has some private store — a memory directory, an auto-derived preferences file, a session cache. Each one is invisible to every other tool and to the human's next session on a different machine. Those stores are a **cache of this repo, never the authority**. When something true and portable ends up in one, move it into the relevant committed file and delete the private copy, so there is exactly one version to keep correct. See `.agents/memory/index.md`.

Where to route a new fact:

| The fact is about | It goes in |
|---|---|
| How to work in general — git, verification, destructive actions | `.agents/working-agreements.md` |
| A tool's behaviour or a gotcha you just hit | `.agents/tooling.md` |
| Which commercial context something belongs to | `.agents/work-contexts.md` |
| This repo's own rules or architecture | `.agents/agent.md` (then `npm run sync:agents`) |
| The state of a specific piece of client work | `projects/<slug>/context.md` |

If the target file does not exist yet, create it. Do not skip the update because the file is missing.

---

## Start here

Four companion files carry context this one does not. Read them at the points below.

| File | Read it when |
|---|---|
| `.agents/working-agreements.md` | **Before your first commit or destructive action.** How to work here, with the reasoning behind each rule. |
| `.agents/work-contexts.md` | Any time a client, project, or call is involved — if you run under more than one commercial identity, routing to the wrong one is a real error. |
| `.agents/tooling.md` | Before working with any external tool or API. Task-scoped operating knowledge. |
| `.agents/memory/index.md` | At session start. Where committed state lives, and why a CLI's private memory is not authoritative. |

Skill playbooks live under `.agents/skills/<name>/SKILL.md`. Read the relevant one before doing that kind of task.

---

## What this repository is

A personal knowledge system that captures what you produce and what you consume, keeps the two strictly separated, extracts reusable concepts from both, and tracks the client work you do with them. Plain Markdown, YAML front matter, and folders — versioned in git so the whole thing is greppable, diffable, and portable.

It is deliberately not an app. Nothing here needs a server to be useful.

---

## Architecture

### The content tiers

**`brand/`** — First-party only. Things you said, wrote, decided, or believe. Raw meeting transcripts in `artifacts/`, plus voice, opinions, and positioning. Transcripts follow `YYYY-MM-DD_HHmmss_Topic_Name.md`.

**`library/`** — Third-party only. Newsletters, podcasts, videos, articles, social posts. Kept strictly separate from `brand/`.

The separation is the point. Mix them and you can no longer tell your own position from something you read once, which makes everything downstream — quoting, attribution, content generation — unreliable. The `librarian` skill's whole job is getting this routing right, using the alias list in `_system/config.yml` to decide whether a speaker is you.

**`knowledge_base/`** — Reusable concepts extracted from both tiers, organised by domain. Entries carry a lifecycle: **emergent → validated → canonical**, defined in `_system/knowledge_graph/taxonomy.yaml` and governed by the `knowledge-base-governance` skill. Cross-references use `[[wiki-link]]` syntax — see `.agents/conventions/wiki_links.md`.

**`projects/`** — One folder per unit of client work. This directory may have been renamed during install; `_system/config.yml` records what it is called here. It supersedes any external tracker. Each folder holds `context.md` (the living record), `README.md`, `calls.md`, and `open-items.md`. The `project-creation` skill covers what a new one needs to be discoverable.

**`services/`** — A catalog of concrete, sellable offerings drawn from real scoped work, with a status lifecycle (idea → pitched → scoped → delivered → proven). Distinct from `knowledge_base/`, which holds theory. Governed by `services-catalog`.

**`intake/`** — The drop point. Files land in `inbox/`, get processed, and move to `processed/`.

### Front matter

Every file in `knowledge_base/` and `brand/` needs YAML front matter. Knowledge base nodes use `type`, `domain`, `status`, `source`, `tags`, `related_concepts`, `date`. `scripts/lint-frontmatter.mjs` enforces this, and it runs in CI if you installed Tier 1.

---

## Install tiers

What is present in this repo depends on the tier chosen at install. Check `_system/install.yml`.

**Tier 0 — files and conventions.** The folders, the skills, the instruction files. You file things by hand with your agent's help. No accounts, no cost, nothing to break.

**Tier 1 — hosted ingestion.** Drop a file in `intake/inbox/`, push, and a cloud agent files it without you present. The chain: `ingest-content.yml` detects the push and opens a GitHub issue mentioning the agent → the agent processes it per the `librarian` skill and opens a PR whose body contains `Fixes #<issue-number>` → `auto-merge.yml` merges it → `ingest-cleanup.yml` moves the file to `processed/`.

The `Fixes #<issue-number>` line is load-bearing. Without it nothing merges and nothing closes.

**Beyond Tier 1 — automated capture.** Content can also arrive without anyone touching the repo: a transcript filed the moment a call ends, an article saved from a phone, a newsletter forwarded to an address that lands in `intake/`.

That is deliberately not shipped as code here. It binds tightly to one specific recorder, scraper and job runner, and it was the one component nobody could verify without paid accounts. `docs/automated-capture.md` covers whether it is worth building at all, the architecture, and the constraints that cost a day each to discover. Point an agent at that rather than letting it invent one.

When any part of the hosted pipeline misbehaves, go to `TROUBLESHOOTING.md` before reading the workflow source. The failure modes are non-obvious and they are already written down.

---

## Skills

Lazy-loaded playbooks. Invoke by name or match to the task.

| Skill | Use it for |
|---|---|
| `install` | First-time setup, or adding/removing a tier later. |
| `librarian` | Ingesting any content — a transcript, a newsletter, an article. Owns the first-party/third-party routing decision. |
| `knowledge-base-governance` | Creating a concept, or promoting one between lifecycle states. |
| `project-creation` | Creating a new unit of client work so it is discoverable everywhere it needs to be. |
| `services-catalog` | Keeping `services/` current when you scope, pitch, or deliver something. |
| `session-teardown` | Closing a session, worktree, or branch without losing unfinished work. |
| `anti-ai-writing` | Any generated prose. Applies to every writing task. |

`.claude/skills/` is a **generated, read-only mirror** of `.agents/skills/` so Claude Code's native loader finds them without a second copy to maintain. Never hand-edit anything under `.claude/skills/` — edit the source and run `npm run sync:agents`. Other CLIs read `.agents/skills/<name>/SKILL.md` directly.

---

## Commands

```bash
npm run sync:agents         # regenerate every generated agent file from its source
npm run sync:agents:check   # CI gate — exits 1 on drift
node scripts/lint-frontmatter.mjs   # validate YAML front matter
node scripts/repo-health-scan.js    # structural health check, tier-aware
node scripts/rollup-open-items.mjs  # aggregate open items across projects
```

---

## Extending this

This template ships the skeleton, not your business. The pieces most people add next:

- **Domain skills.** The audit checklist for your kind of work, the strategy process you run for a new client, the way you write. Copy the shape of an existing `SKILL.md`: front matter with a `name` and a `description` that says *when* to reach for it, then the protocol, then the anti-patterns. The anti-patterns section earns its keep — it is where you record what went wrong last time.
- **A content pipeline.** If you publish, the `brand/` → `knowledge_base/` → draft path is worth automating. That is very specific to where you publish, so it is not shipped here.
- **More ingestion sources.** Everything downstream of `intake/` is source-agnostic, so a new source only has to land a file there. `docs/automated-capture.md` has the pattern and the traps.

You do not need to design these from scratch. Describe what you want to your agent and point it at the existing skills as the shape to follow — that is what the conventions in this repo are for.
