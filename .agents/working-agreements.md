# Working Agreements

Standing instructions about *how* to work in this repo and on the systems it touches.

**Every rule here should carry the incident that produced it.** That is not decoration. A rule without its reason gets misapplied by an agent that cannot see which situation it was meant for, or deleted by a future session that reads it as arbitrary. When you add one, write down what actually went wrong.

This file ships generic. It becomes valuable when you replace these with your own. The moment an agent does something you did not want, add the rule and the incident here rather than correcting it again next week — and rather than letting it live in one CLI's private memory, where no other tool can see it.

---

## Git and delivery

**Commit and push completed work without being asked.** Most people work from the remote, not from whatever machine the agent happens to be on. Uncommitted or unpushed work is invisible. After finishing a task that creates or modifies files, commit and push in the same flow — do not stop to ask "want me to commit?"

**Another session may be committing to this same checkout right now.** If you run more than one agent session against one working directory, there is no lock, and two failure modes follow:

1. *Your staged files get swept into someone else's commit.* `git add` stages correctly, but before your `git commit` runs, a concurrent session commits and takes your staged files with it. Their message ships your changes. Your `git commit` then no-ops with "nothing to commit."
   → **After any commit, verify `git rev-parse HEAD` and confirm your files landed under the message you wrote.** If `git commit` reports "nothing to commit" right after you staged real changes, check `git log -1` and `git show --stat HEAD` before doing anything else. Do not fix a mismatched message by amending or force-pushing something already pushed without asking — the message is cosmetic, the file changes are intact.

2. *Two sessions independently do the same rework with different content.* Both consolidate the same file, each keeping unique material the other lacks. This surfaces only as "local is behind origin **and** has unrelated-looking uncommitted changes to the same files."
   → **Diff working-tree content against the origin blob directly** with `git show origin/main:<path>`. Do not trust `git diff origin/main -- <path>`, which reports untracked local files as pure deletions rather than a content diff. When both sides have non-overlapping unique content, **ask which to keep** — discarding either loses work nobody can recover.

**Do not build an automated push-on-session-end hook** unless it is explicitly asked for. It sounds helpful and it is not: with concurrent sessions it can force a reconciliation decision without a human present, or push half-finished work. Flagging drift when you wrap up — uncommitted changes, unpushed commits, a branch behind or ahead — is the right version of this.

**In a squash-merging repo, "ahead of `main`" does not mean unmerged.** A squash merge does not make the branch an ancestor of `main`, so a fully merged branch reports `ahead_by > 0` forever and its commit SHAs never appear in `main`'s history. Checking commit reachability will tell you work is unmerged when it shipped hours ago. The reliable tests are whether a PR exists for the branch in any state, and whether the branch's *file content* differs from `main`. Verify a landed commit by diffing files, not by hunting for the SHA.

---

## Keeping the written record current

**Update the relevant `context.md` after any meaningful session, without being asked.** Meaningful means a build, a decision, a bug fixed, a validation passed, an open item resolved.

- After a build → update Current State, add a dated log entry
- After a decision → append to Key Decisions, dated
- After validating something → close the open item
- Commit and push immediately

**When something important surfaces in conversation and is not written down, write it down and say so in chat.** Route it: repo-wide rules to `.agents/agent.md`, how-to-work rules here, tool knowledge to `.agents/tooling.md`, project state to that project's `context.md`. If the target file does not exist, create it — do not skip the update because the file is missing.

**Offer a session handoff when a thread is about to die with state in it.** `context.md` holds durable truth. A handoff holds perishable *session* state: what you were mid-way through, the IDs and dead ends you dug up that are not in any file yet, what the next session should do first. Do not put the second kind in `context.md` — it goes stale there and buries the durable record.

Offer one when the thread is long and the remaining work is mechanical enough for a fresh session; when the model is about to be swapped mid-thread (a swap re-ingests the whole prior thread with no cache reuse, so starting clean from a self-contained handoff is strictly cheaper); or when the context is being transferred to someone else's agent entirely.

Write it as `projects/<slug>/<topic>-handoff-YYYY-MM-DD.md` with `type: session-handoff` front matter. Assume the reader has **none** of the prior conversation: restate the goal, the key IDs and tool prefixes, what is already established, and the next concrete step.

**Offer, do not reflexively produce.** A handoff nobody reads is one more file to keep correct. If the durable outcome fits in `context.md`, it belongs in `context.md`.

**Client-specific artifacts belong in that client's own tracked system, not in a scratch location** — and following whatever pattern that system already uses for the same kind of thing. Before treating client-facing work as done, check whether there is an existing repo or convention for the artifact you just made. This is in addition to updating `context.md`, not instead of it: the narrative record and the artifact both need a durable home, and they are often different places.

---

## Destructive and irreversible actions

**Confirm in the moment before tearing down deployed or shared resources** — hosted projects, live URLs, scheduled jobs, deployed code, repos, remote branches, database tables. This holds **even when you were told earlier "kill it when we're done."** Circumstances change; it may still be in use, or worth preserving a copy of. Restate exactly what will be removed, ask, and wait for a yes. This applies to resources created in the current session too.

**Search before creating anything client-facing.** Before creating a document in a shared drive, search by title *across sibling folders*, not just the target folder. A client's team may maintain living documents that have drifted from — or gotten *ahead of* — your source-of-truth repo. Your repo is not automatically authoritative about someone else's work, and duplicate documents are often expensive to clean up because the connector that created one has no delete tool.

**Test small batches before full spend or rollout.** Never commit the whole budget to an untested run.

---

## Verification standards

**Never state a claim as fact unless you actually checked it — and say which half you checked.** Separate what the data shows from what you inferred, and label the inference. "The config says 200" is verified; "so we can raise it" is a guess about a vendor's limits. When a number is going to a client, state the method that produced it in the same breath. A keyword count is not a measurement. If the method cannot support the claim, say the number cannot be sized yet rather than shipping the best available guess.

**A proxy test that fails to detect a known instance is not weak evidence — it is no evidence.** Check a proxy against a known-positive case before trusting any count it produces. A wrong answer that is internally consistent will pass every plausible-looking test you build around it.

**Verify standing claims, not just what changed.** When syncing or auditing documents, do not treat "out of scope", "not live", "deferred", "held off", "pending approval" as ground truth because they were not in the diff. A claim that was wrong the day it was written survives every subsequent review, because nothing in the git log ever looks like it touched that claim. Grep the document set for those phrases and verify each hit against the actual system.

**Do not infer "test" versus "real" from how substantive something reads.** Content produced during a debugging session can read as entirely genuine. Substance is not evidence of intent — only the person who made it knows. Enumerate everything from the relevant window and ask, rather than filtering by "does this sound real."

**Content gets renamed in flight — do not check by filename.** The librarian retitles files during ingestion, so searching for a source filename will report correctly-ingested content as missing. Match on the timestamp prefix, on source front matter, or on the ingestion issue's state instead.

**Do not take another agent's report at face value.** Sub-agent and background-task results can be wrong or misleading. Verify conclusions that matter before acting on them.

**Query live systems rather than trusting cached reports or stale snapshots.** Cross-reference across sources before trusting a number, and spot-check full samples rather than the first few rows.

---

## Build philosophy

Context for judgment calls, not hard rules. Replace these with your own.

- Prefer systems that keep themselves clean over one-time fixes or arrangements that need manual upkeep.
- **Keep reusable machinery project-agnostic.** A shared script, skill, or template should never point at one project as its reference implementation. The pattern gets copied, the coupling comes with it, and that project quietly becomes load-bearing for work unrelated to it. Carry the template inline, or glob for it.
