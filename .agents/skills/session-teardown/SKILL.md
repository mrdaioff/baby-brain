---
name: session-teardown
description: Close coding-agent sessions, terminals, worktrees, and branches without losing unfinished work. Use when asked to close a session, clean up a worktree, or remove a branch after implementation.
---

# Session teardown

Use this only after work has ended or the user has asked to stop it. It does not authorize deleting code, remote branches, deployments, or other shared resources.

## Preserve work first

Before closing anything, identify every branch, worktree, terminal, and agent session created for the work.

For each branch with work, verify one of these states against the remote:

- Its intended commits are reachable from `origin/main`.
- Its intended commits are in an open pull request with a recorded URL.
- The user has explicitly chosen to keep the work unmerged, and its commit SHA and remote branch have been reported.

Do not delete a branch or worktree merely because a task or terminal has finished. A clean worktree does not prove that its commits are preserved elsewhere.

If the work is only local, stop teardown. Commit and push it, open a pull request, or ask the user whether to discard it. Do not infer permission to discard unmerged work from a request to "close the session."

## Verify before removal

Run checks appropriate to the repository and report what they cover:

```text
git status --short
git log --oneline <base>..<branch>
git merge-base --is-ancestor <commit> origin/main
git ls-remote --heads origin <branch>
```

For a branch intended to merge, resolve conflicts and get it merged before branch cleanup. If the main checkout is dirty, use an isolated worktree or a pull request. Do not merge into or reset that checkout.

## Close in safe order

1. Preserve and verify commits.
2. Close the agent and terminal sessions.
3. Remove temporary local worktrees.
4. Remove local branches.
5. Remove a remote branch only after its commits are verified on `origin/main` or the user explicitly wants it retained.

Before removing a deployed or shared resource, including a remote branch, follow `.agents/working-agreements.md`: restate the exact target and get confirmation in that moment. A prior instruction to clean up does not replace that confirmation.

## Handoff

State the commit or pull request that preserves the work, every resource closed, and anything intentionally left open. If the work cannot be preserved or needs a choice, leave the branch and worktree intact and ask for direction.
