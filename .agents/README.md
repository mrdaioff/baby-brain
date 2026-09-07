# `.agents/` — the provider-agnostic instruction layer

Every AI coding CLI looks for its own hardcoded instruction filename at the repo root. Left alone, that produces one set of rules per tool, drifting apart — and the drift is silent, because no tool reads another tool's file. This directory is the single source those files are generated from, so any CLI, installed today or next month, starts with the same context.

## Layout

| Path | What it is |
|---|---|
| `agent.md` | **The canonical repo-wide rules.** Architecture, protocols, the source-of-truth discipline. Every root loader file is generated from this. |
| `working-agreements.md` | Standing instructions on *how* to work — git, verification, destructive actions — each with the reason it exists. |
| `work-contexts.md` | Your commercial contexts and the routing rules between them. |
| `tooling.md` | Operating knowledge for the external tools you use. Task-scoped: read the relevant section before that kind of work. |
| `memory/index.md` | Where committed state lives, and why a CLI's private memory is never authoritative. |
| `skills/<name>/SKILL.md` | Task playbooks. Canonical copies; `.claude/skills/` is a generated mirror. |
| `conventions/` | Formatting standards (wiki-links, etc.). |
| `templates/` | File templates. |

## Generated files — never hand-edit

```
.agents/agent.md  ──►  AGENTS.md                        (Codex, Cursor, Amp, Zed, Jules, Aider)
                  ──►  GEMINI.md                        (Gemini CLI)
                  ──►  .github/copilot-instructions.md  (GitHub Copilot)
                  ──►  CLAUDE.md                        (Claude Code — @-import, not a copy)

.agents/skills/   ──►  .claude/skills/                  (Claude Code's native skill loader)
```

```bash
npm run sync:agents         # regenerate everything
npm run sync:agents:check   # CI gate — exits 1 on drift
```

If you installed Tier 1, `.github/workflows/check-agent-sync.yml` runs the check on every PR and push touching either a source or a generated file, so editing a generated file directly fails the build. At Tier 0 the check is still there as an npm script — run it before you commit.

**Why full copies and not pointers.** A CLI reads its own instruction file automatically, but only follows a pointer to another file if it decides to. A pointer means a session can start with none of the repo's rules loaded, which is exactly what this layout exists to prevent. Claude Code is the one exception: its `@`-import is resolved by the CLI itself at session start, so `CLAUDE.md` stays a one-liner without losing anything.

This distinction is worth testing rather than assuming, because it varies by tool and changes between releases. The check that settles it: ask the CLI a question answerable **only** from `agent.md`, with file reads forbidden. If it answers, the content is really loaded. If it says it needs to read a file first, that tool needs an inline copy, not a pointer.

## Adding a new CLI

1. Find the instruction filename it reads at the repo root.
2. Add a row to `TARGETS` in `scripts/sync-agent-entrypoints.mjs` — filename, `mode` (`inline` unless the tool resolves includes itself), and a `readBy` label.
3. Run `npm run sync:agents`.
4. If you are on Tier 1, add the generated path to the `paths:` filters in `.github/workflows/check-agent-sync.yml`.
5. If it uses MCP, add its config file and note it in `.agents/tooling.md`.

That is the whole checklist. Nothing else in the repo needs to know the tool exists.

**Then run the load test above** before trusting it. A generated file the CLI never actually reads is worse than no file, because it looks like coverage.

## Also check what the new CLI writes

Some tools auto-derive their own memory or preference files from watching sessions. Those are caches, and they are invisible to every other tool. When one accumulates something true and portable, move it into `working-agreements.md` or `tooling.md` so the rest of the fleet gets it — and delete it from the private store, so there is only one copy to keep correct.

Add the tool's private directory to `.gitignore` at the same time. Committing one CLI's derived cache gives it a false authority it should not have.
