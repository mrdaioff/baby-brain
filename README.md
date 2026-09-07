# baby brain

A git-tracked knowledge system your AI agents can actually work in.

This is the seed. Take a copy, run the install skill, and it becomes *your* brain —
your transcripts, your concepts, your clients, your working agreements. Nothing
in here is anyone else's content; it is the machinery and the conventions that
make an agent file things consistently and write back what it learned.

Plain Markdown, YAML front matter, and folders. No app, no database, no server. The value is not the storage — it is the set of conventions that make an agent file things consistently, read the right context before it starts, and write back what it learned when it finishes.

---

## Start here

### 1. Make a private copy

Click **Use this template → Create a new repository**, and set the visibility to
**Private**.

> **Do not fork this repo.** A fork of a public repository is permanently public
> — GitHub gives you no way to make it private later. Within a week this repo
> will hold your call transcripts, your client names, and your commercial terms,
> and by then it is far too late to discover that.
>
> "Use this template" also gives you a clean history with no connection to this
> one, which is what you want for something that will accumulate private material.

If you are working outside GitHub, `git clone` this repo, delete `.git`, and
`git init` a fresh private one. Same result.

### 2. Point your agent at it

Open your new repo in whatever coding agent you use — Claude Code, Codex, Cursor —
and say:

> Read `.agents/skills/install/SKILL.md` and set this repo up for me.

It will ask which of two tiers you want, get your name and vocabulary right,
delete everything you did not choose, and verify that what is left actually works.
Budget five minutes for the tier most people should take.

**Do not start by reading the architecture.** It is written for the agent, not for you.

---

## What you are getting

Two tiers. The install skill will walk you through choosing; the short version:

| Tier | What it does | Cost | Setup |
|---|---|---|---|
| **0 — Files** | Folders, conventions, and skills. You drop things in; your agent files them correctly. | Free | ~5 minutes |
| **1 — Hosted ingestion** | Drop a file, push, and a cloud agent files it and merges the PR while you are asleep. | Agent subscription + Actions minutes | 20–40 min |

**Tier 0 is the actual product.** Tier 1 automates filing, which is worth it once you are ingesting several things a week and is pure overhead before then. Plenty of people should take Tier 0 and never upgrade.

Want content to arrive on its own — transcripts filed the moment a call ends, articles saved from your phone? That is a real extension, but it is not shipped here, because it binds to specific providers and could not be verified without paid accounts. `docs/automated-capture.md` covers whether you need it and how to build it against your own.

---

## The idea

Four directories, and one rule.

**`brand/`** holds things *you* produced — meeting transcripts, decisions, opinions, positions.
**`library/`** holds things *other people* produced — newsletters, articles, podcasts, posts.

Keeping those apart is the whole foundation. Mix them and you can no longer tell your own position from something you read once, which makes every downstream use — quoting, attribution, drafting — untrustworthy. Filing is not clerical here; it is what makes the rest work.

**`knowledge_base/`** holds concepts extracted from both, each moving through a lifecycle: emergent → validated → canonical. A thought you had once is not the same as a framework you have used with five clients, and the repo tracks the difference.

**`projects/`** holds one folder per unit of client work. Called something else in your business? The install skill renames it — `clients`, `engagements`, `opportunities`, `matters`, `deals`.

And the rule:

> **The repo is the source of truth. The agent reads `context.md` before it works, and writes back to it after.**

That habit is the entire value proposition. Every convention in here exists to make it easy and to make skipping it noticeable. An agent's own memory does not count — it is invisible to every other tool you use and to your next session on a different machine.

---

## Daily use

Once installed, the loop is:

1. **Something arrives** — a transcript, an article you want to keep, notes from a call. It goes in `intake/inbox/`: by hand, or automatically if you have built the capture extension.
2. **Your agent files it.** The `librarian` skill decides whether it is yours or someone else's, writes it to the right tier with proper front matter, and extracts any reusable concepts into `knowledge_base/`.
3. **You work.** Before touching a project, the agent reads that folder's `context.md`. After anything meaningful, it writes back and pushes.

That is it. Everything else in this repo is in service of those three steps.

---

## Working across more than one agent

Every CLI reads a different instruction filename at the repo root, so a repo with rules in `CLAUDE.md` alone tells Codex nothing.

`.agents/agent.md` is the single source; `npm run sync:agents` generates `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and `.github/copilot-instructions.md` from it, plus the `.claude/skills/` mirror. Adding a new tool is a one-row change in `scripts/sync-agent-entrypoints.mjs`. See `.agents/README.md` — including how to test that a CLI is really loading its file rather than just having one.

---

## Making it yours

This ships the skeleton, deliberately. The parts that make it *yours* are the parts nobody can ship:

- **`.agents/working-agreements.md`** starts generic. Every time an agent does something you did not want, write the rule *and what went wrong* into that file. The incident matters as much as the rule — a rule without its reason gets misapplied or deleted by a future session that cannot see the point of it. This file is the highest-leverage thing in the repo after a few months.
- **`.agents/tooling.md`** starts empty. Fill it as you hit gotchas with the tools you actually use.
- **Your own skills.** Copy the shape of any existing `SKILL.md`: front matter with a `description` that says *when* to reach for it, then the protocol, then the anti-patterns.

You do not have to design any of that up front. Describe what you want to your agent and point it at an existing skill as the shape to follow.

---

## Layout

```
.agents/            Instruction layer — the source every root file is generated from
  skills/           Task playbooks (install, librarian, project-creation, session-teardown, …)
  conventions/      Formatting standards
_system/
  config.yml        Your identity and vocabulary. Edit this first.
  install.yml       Which tier is installed. Written by the install skill.
  knowledge_graph/  Taxonomy: domains, node types, lifecycle states
brand/              First-party content
library/            Third-party content
knowledge_base/     Extracted concepts
projects/           Client work (renameable)
services/           Sellable offerings
intake/             Drop point
scripts/            Sync, lint, health checks
.github/workflows/  Tier 1
docs/               Design notes and extension guides
```

---

## Troubleshooting

`TROUBLESHOOTING.md`, ordered by how often each cause turns out to be the real one. Read it before editing a workflow file — the automation failures here are not obvious from the source, and most of them are expired credentials rather than bugs.

## Where this came from

This was extracted from a working personal knowledge repo of ~3,500 files. If you
are thinking of doing the same to yours, `docs/how-this-was-extracted.md` covers
what leaked, why grep kept missing it, and why the history here is a single commit.

## License

MIT. See `LICENSE`.
