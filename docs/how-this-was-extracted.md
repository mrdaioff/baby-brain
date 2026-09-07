# How this template was extracted

This repo did not start as a template. It was pulled out of a working personal
knowledge repository of roughly 3,500 files, of which about 90 were the system
and the rest were one person's content, clients, and history.

That origin is worth knowing, because it explains why `install/SKILL.md` has a
step devoted to hunting the previous owner's data, and because anyone doing the
same thing to their own repo will hit the same problems in the same order.

## The history is deliberately one commit

Squashed on purpose, not for tidiness.

The extraction ran for a day across a dozen commits, and the early ones carried
real client names in the skill files — the exact leaks the later commits removed.
Scrubbing a file does nothing about the commit that introduced it. Worse, the
cleanup commit messages *described* what they were removing, naming the same
clients again in prose that would outlive the fix.

So the working tree was clean and the history was not, and the repository was one
visibility change away from publishing everything the cleanup had supposedly
removed.

**If you extract a template from a private repo, start its history clean.** Fresh
`git init`, no shared history with the source, and squash before the first push.
Fixing forward is not fixing.

## What actually leaked, and why grep did not catch it

Four review passes found leaks. The pattern held every time: **leaks live in prose
examples, never in mechanism.** Workflows, scripts, and config were carried over
almost verbatim and leaked nothing, because they contain no illustrations. Skill
files leaked repeatedly, because a skill is mostly examples, and examples are
where the author reached for something real rather than inventing a placeholder.

Three specific failures, each of which defeated a targeted search:

**Case matters.** Auditing for `Acme Partners` and `Northwind` misses
`acme-partners` and `northwind`. The leaks were lowercase kebab-case slugs; the
searches were capitalised and space-separated, and matched nothing.

**You cannot grep for a name you have never seen.** One leaked client slug
appeared in no list of known names, because nobody involved in the audit knew the
client existed. It was found by a reader, not a search.

**Reused vocabulary is the highest-yield signal, and the least obvious.** A real
template invents a fresh placeholder for each example. A leak reuses the author's
actual vocabulary, because that was easier than inventing one. So an enum of eight
oddly precise categories, or the same handful of concept names recurring through
every example in a file, is worth checking even when nothing in it looks like a
name. That heuristic found more real leaks than every other category combined.

## Scrubbing does not work; rewriting does

Every leak found came from a file carried over near-verbatim. None came from a
file that had been rewritten from scratch.

That is not a coincidence. Scrubbing is subtractive — you keep the sentence and
edit the name out — so it leaves residue. Real examples from this extraction:
`"a partner org, a partner org (white-label)"`, `"just just not personally spoken
by the owner"`, and a scan list that read `"Me, the owner, the owner, the owner,
I"`. Each is a scar marking where a name used to be, and each survived review.

Rewriting carries the lesson and not the sentence. A name cannot survive a
sentence you never copied. The heavily-exampled skills here were rewritten rather
than scrubbed, and the rewrite also cut the largest of them from about 1,000 lines
to 150 without losing a rule — the redundancy was hiding in the same places the
leaks were.

Files with no examples — a writing-style guide sourced from a public article, a
git-mechanics procedure — were left alone. The verbatim percentage is a proxy for
risk; examples drawn from the author's business are the risk itself.

## Test with someone who has never seen it

Reading your own extraction does not work. You cannot un-know the names, so the
leaks read as ordinary placeholder text.

What worked was handing a clean clone to a reader with no context and a concrete
task — set this up for a fictional person, then actually use it — and asking for
defects rather than an opinion. Each pass found a different class of problem:
first leaks, then gaps in the setup instructions, then contradictions between
files nobody had cross-read, then functional bugs in code that documentation
review had never executed.

Verify what those readers report before acting on it. Roughly one claim in four
was wrong — pattern-matching that looked like a finding — and acting on those
would have genericised perfectly good examples for nothing.

The last pass found the funniest one. The instruction warning about leaking the
previous owner's data was itself naming real clients as its cautionary example.

This document did it too, on the first draft, in the paragraph about case
sensitivity — reaching for the real names to illustrate why searching for them
failed. Caught by the sweep, one commit before publication.

Take that as the actual lesson rather than a joke: writing about a leak pulls the
leaked value straight back to mind, and every prose pass over this material is
another chance to reintroduce what you just removed. Run the mechanical sweep
after the final edit, not before it.
