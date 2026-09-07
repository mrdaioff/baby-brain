# Memory

## The rule

**This repository is the record. Any agent's private memory is a cache of it.**

Every CLI has some private store — a memory directory, an auto-derived
preferences file, a session cache. Each one has the same two properties:

1. **It is invisible to every other tool.** A fact stored in one CLI's memory
   is a fact the others will re-learn by making the same mistake.
2. **It is invisible to a different machine.** Move to a laptop, a cloud
   session, or a fresh clone, and it is gone.

So a fact that lives *only* in a private store is a fact you will lose. On any
conflict between a private store and a committed file, **the committed file
wins** — the private note reflects what was true when it was written, and
nothing has been keeping it current.

## Where committed state actually lives

| What | Where |
|---|---|
| Repo-wide rules and architecture | `.agents/agent.md` |
| How to work — git, verification, destructive actions | `.agents/working-agreements.md` |
| Commercial contexts and routing | `.agents/work-contexts.md` |
| Tool behaviour and gotchas | `.agents/tooling.md` |
| The state of a specific piece of client work | `projects/<slug>/context.md` |
| Commitments and who owes what | `projects/<slug>/open-items.md` |
| Concepts and frameworks | `knowledge_base/` |

## What to do when something lands in a private store

Move it to the committed file it belongs in, then **delete the private copy**,
so there is exactly one version to keep correct. Two copies of a fact is worse
than one, because they diverge and nothing tells you which is current.

Keep in a private store only what is genuinely session-local: a scratch note
for the next fifteen minutes, or a pointer at the committed file that holds
the real thing.

## Verify before you rely on one

A recalled memory naming a file, a function, or a flag is a claim about the
past. Check the thing still exists before acting on it.
