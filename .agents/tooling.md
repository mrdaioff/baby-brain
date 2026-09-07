# Tooling

**This file ships empty on purpose. It fills itself as you work.**

Task-scoped operating knowledge for the external tools this repo touches —
CRMs, enrichment platforms, APIs, browser automation, whatever you actually
use. Read the relevant section before that kind of work; do not read the whole
file every session.

## What belongs here

A tool's **non-obvious behaviour**, not its documentation. Specifically:

- Gotchas that cost you an hour and would cost the next session the same hour.
- The difference between two access paths to the same system, and when to
  prefer each (an MCP connector versus a CLI versus the raw API — they often
  disagree about what exists, and the failure is usually silent).
- Undocumented limits, and whether they are yours to raise or the vendor's.
- Settings that exist only in a UI and cannot be set programmatically.
- Deploy mechanics, especially where two backends in one repo behave
  differently.
- Auth that expires, and what the expiry looks like from the outside.

## What does not

Anything in the vendor's docs that an agent can look up. This file is for what
you learned that the docs do not say.

## Format

One section per tool. Date the entries — a gotcha that was true last year may
have been fixed, and an undated note is impossible to retire.

### Example shape

> ## [Tool name]
>
> **Prefer the CLI over the MCP connector for live reads (2026-01-15).** The
> connector caps results at 100 rows per view with no error and no indication
> that anything was truncated, so a count taken through it is silently wrong
> above that threshold. The CLI paginates properly.
>
> **A 404 on a known-good ID usually means a workspace mismatch, not a missing
> object (2026-02-02).** The connector authenticates as the right account but
> may be scoped to a different workspace than the one holding the object.
> Check the workspace before concluding the object is gone.
