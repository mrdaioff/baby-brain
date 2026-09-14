# Troubleshooting

Applies to Tier 1. Ordered by how often each cause turns out to be
the real one — work down, do not skip ahead.

**Read this before editing a workflow file.** Almost every failure below looks
like a bug in the automation and is actually an expired credential. The
workflow files also carry accumulated fixes for problems that are not visible
from reading them, so a plausible-looking cleanup tends to reintroduce one.

---

## Files land in `intake/inbox/` but nothing ever happens

Four distinct faults produce this same symptom. They are distinguishable, and
the distinguishing evidence is listed with each.

### 1. The agent's auth token expired

**By far the most common.** Check a failed run's output for a task that failed
**instantly** — roughly 200ms, one turn, zero cost, and an empty model-usage
object.

**Zero model usage is the signature.** It means the request was rejected at the
API boundary, so the task never ran at all. This is what makes it look like a
logic bug rather than an auth problem: the workflow succeeded, the agent was
invoked, and it returned immediately.

Rotate the secret. Nothing else needs to change.

### 2. The GitHub personal access token expired

Different symptom: issues stop being **created** at all, and the issue-to-PR
step fails silently with nothing useful in the Actions log.

Distinguishing it from #1: with an expired agent token, the issue exists and
the agent fails on it. With an expired PAT, there is no issue.

### 3. Work gets done, but nothing merges

The agent runs, does the work, and pushes a branch — but no PR opens, so
auto-merge never fires and no issue closes.

The usual cause is that a vendor's stock workflow template overwrote the
repo's customised one. Re-running a GitHub App's setup flow writes a generic
50-line template over whatever was there, silently reverting the PR-creation
step, the write permissions, and any actor guard.

**If you ever re-run a GitHub App's setup flow, diff before merging.** Nothing
fails loudly. The only symptom is issues quietly not closing.

The detector: branches ahead of `main` with **no PR in any state**. The "no PR"
half is load-bearing — in a squash-merging repo a merged branch reports
`ahead_by > 0` forever, so "ahead of main" alone means nothing. Several
appearing at once means the workflow broke, not the runs.

### 4. The cloud agent's job never fires at all (org-owned repos)

Symptom: issues are created correctly, and nothing ever answers them. No failed
run, no error — `claude.yml` simply reports the job as skipped, or does not
appear in the run list at all.

Cause: a guard comparing `github.actor` to `github.repository_owner`. On an
**org-owned** repo those can never be equal — `repository_owner` is the org
name, `actor` is a username — so the condition is false for everybody,
including you.

This template gates on `author_association` instead, which works for both
personal and org repos. If you have edited that guard, or restored a stock
workflow template over it, check this first.

### 5. A large file killed the whole batch

Symptom: a push containing several files produces **zero** issues, and the
only trace is one failed Actions run.

Cause: the workflow truncates oversized files for the issue-body excerpt by
piping a line-limited read into a byte-limited one. Under `set -o pipefail`
that pipeline fails whenever a file has fewer lines than the line cap but
still exceeds the byte cap — a few very long lines, which is exactly the shape
of an HTML email or a scraped page dump. The byte-limited reader hits its
quota and exits, closing the pipe while the other end is still writing.

Because the file loop runs in one script under `set -e`, this kills every
*other* file queued in the same push, including ones that would have succeeded
on their own.

Look in `gh run list` and `gh run view --log-failed`, not in the issue tracker —
there is nothing there to find.

**Files orphaned by this are not picked up by a later push.** The workflow only
processes that push's diff, so they need issues created manually.

---

## PRs open but never merge

First: **is the PR supposed to merge?** `auto-merge.yml` only fires for a PR
with a linked closing issue carrying `ingestion` or `project-routing`. A PR you
wrote by hand will sit there, which is deliberate — an earlier version matched
on a title substring and squash-merged anything whose title happened to contain
"ingest" or "router", including hand-written changes to the workflow files
themselves. Do not restore that shortcut.

If the PR *is* an automation PR, check the `Fixes #<issue-number>` line in its
body. Without it GitHub never links the issue, so the label is never seen.

Then two repo settings, not code:

- **Squash merging is disabled.** `auto-merge.yml` calls `gh pr merge --squash`.
  Enable it under Settings → General → Pull Requests.
- **Branch protection requires a review.** The PAT owner is always the PR
  author, and GitHub will not let anyone approve their own PR, so a required
  review makes these PRs permanently unmergeable. Either exempt the workflow or
  drop the requirement on `main`.

### The PR exists, the work is done, and it still cannot merge

Every automation PR — ingestion *and* router — rewrites the same aggregate
files: `projects/<slug>/context.md`, `calls.md`, `open-items.md`, and the
generated `projects/OPEN-ITEMS.md`. Two bot PRs opened minutes apart therefore
conflict the moment the first one merges. `auto-merge.yml` fails with
`Pull Request has merge conflicts`, and the PR sits open with its issue open
and its source file still in `intake/inbox/`. The stale-PR sweep does not
catch it, because that bucket looks at age (30 days), not mergeability.

**`mergeable: CONFLICTING` on a `claude/issue-*` PR is the signature.**
`gh pr view <n> --json mergeable` shows it.

Two things handle this. `auto-merge.yml` checks the branch out, merges `main`
into it with a runner-local *union* merge driver for `projects/**/*.md` (both
sides kept — they are append-style logs), regenerates `projects/OPEN-ITEMS.md`
with `scripts/rollup-open-items.mjs` instead of resolving it, pushes with the
default `GITHUB_TOKEN` (no `synchronize` event, so no extra run), and retries
the squash merge up to three times. And the health scan's "stuck automation
PRs" bucket flags any `claude/issue-*` PR that is CONFLICTING or older than
two days.

If that bucket fires anyway, the conflict is in a file the union driver
refuses — anything outside `projects/` — and someone has to resolve it by
hand: merge `main` into the branch, fix the file, push, and let auto-merge
retry.

### Cleanup pushes race with everything else committing to `main`

`ingest-cleanup.yml` moves the source file from `inbox/` to `processed/` and
pushes. `main` moves constantly — auto-merge, the router, other cleanup runs —
so a plain push loses that race with `! [rejected] main -> main (fetch first)`
and leaves an already-ingested file sitting in `intake/inbox/` next to a
*closed* issue. That reads as "never ingested" unless you check the issue.

The push now rebases onto `origin/main` and retries five times. If a file is
still in `inbox/` with a closed `[Ingest]` issue, it only needs moving to
`intake/processed/`; the content is already on `main` under whatever title the
librarian gave it.

### Branches pile up

Every automation run leaves a `claude/issue-*` branch behind after its PR
merges. Turn on **Settings → General → Pull Requests → Automatically delete
head branches** and GitHub removes them on merge. Nothing here depends on the
branch surviving; the health scan's stranded-branch check looks for branches
with *no* PR, which a deleted merged branch is not.

## A file was ingested but you cannot find it

The librarian **retitles files during ingestion**. Searching for the source
filename will report correctly-ingested content as missing.

Match on the timestamp prefix, on the source front matter, or on the ingestion
issue's state instead.

The same mistake makes a whole batch look unprocessed when in fact only the
`inbox/` → `processed/` move failed.

---

## Health scan reports failures for automation you removed

`_system/install.yml` is missing or has the wrong tier. The scan reads it to
decide which checks apply. Fix the file rather than ignoring the scan.
