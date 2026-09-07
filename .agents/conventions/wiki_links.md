---
description: "Convention for linking related concepts using [[wiki-link]] syntax"
---

# Wiki-Link Convention

Wiki-links connect related ideas across the repo. They are plain Markdown, so the graph needs no tooling to exist and no database to survive.

```markdown
This depends on [[compounding-documentation]] and contradicts [[premature-standardisation]].
```

**The link is not the filename.** A concept lives at
`knowledge_base/methodology/2026-09-02_Compounding_Documentation.md` and is linked
as `[[compounding-documentation]]`. The file carries a date so the directory sorts
chronologically; the link carries none, because a link that encodes a date breaks
the moment you revise the entry.

So the two never string-match, and searching for a link will not find its file
directly. Convert between them by hand: lowercase the title portion and swap
underscores for hyphens. When you need to find every reference to a concept,
search the link form; when you need the file, search the title with underscores.

This is the one piece of friction in the convention. It is the price of
filenames that sort usefully and links that survive editing, and it is worth
knowing about rather than discovering.

## Why bother

A concept nobody can navigate to is a concept you will rewrite from scratch in four months, having forgotten you already had it. Links are what turn a folder of files into something you can actually reason across: what relates to what, which ideas keep recurring, and which are isolated enough to be suspect.

They also give an agent somewhere to go. An entry with two good links gives it context; an entry with none gives it a dead end.

## Naming

**Lowercase, hyphen-separated, no abbreviations.**

```markdown
✅ [[client-onboarding-checklist]]
✅ [[pricing-anchors]]
✅ [[scope-creep-early-signals]]

❌ [[Client Onboarding Checklist]]   capitals
❌ [[client onboarding checklist]]   spaces
❌ [[client_onboarding_checklist]]   underscores
❌ [[client-onboard-cl]]             abbreviated
```

Consistency matters more than the specific choice. `[[pricing-anchors]]` and `[[pricing anchor]]` are two different nodes as far as any search is concerned, and a graph split across spelling variants is worse than no graph, because it looks complete while hiding half of itself.

Name it as the thing someone would search for, not as a title. `[[scope-creep-early-signals]]`, not `[[thoughts-on-scope-creep]]`.

## Where they go

**`knowledge_base/` entries — required.** Every entry links to at least two others under a `## Related Concepts` heading, each with a clause saying *how* they relate:

```markdown
## Related Concepts

- [[pricing-anchors]] — why the first number stated constrains the rest
- [[scope-creep-early-signals]] — the failure this is meant to prevent
```

The clause is the point. A bare list of links records that two things are near each other; the clause records why, which is the part you will have forgotten.

**`library/` entries — recommended.** Link the concepts an external source touches, so a third-party piece is reachable from the ideas it informed.

**`brand/artifacts/` — optional.** Link concepts that came out of a call, in the section where you record what was contributed.

**Generated content — recommended.** Linking as you write is what surfaces which concepts are actually earning their place.

## Creating a new concept

1. Name it as something searchable.
2. **Check it does not already exist** — a near-duplicate under a slightly different name is the most common way this graph degrades.
3. Create the file at `knowledge_base/<domain>/YYYY-MM-DD_Concept_Name.md`.
4. Link it from wherever it came from, and link at least two related concepts from it.

**A link to a concept that does not exist yet is fine.** It marks something worth writing rather than an error. What is not fine is a link to something you meant to write and never did, left for a year — see maintenance below.

## Linking to sources

Reference a specific file by path, so the reader stays inside the system:

```markdown
First discussed in [[brand/artifacts/2026-01-11_Strategy_Call.md]]
From the interview: [[library/podcasts/2026-01-09_Expert_Interview.md]]
```

## Relationship semantics — optional

As the graph grows, naming the *kind* of relationship starts to earn its keep:

```markdown
- [[pricing-anchors]] — **foundational to** this
- [[discovery-call-structure]] — **is a tactic for** this
- [[scope-creep-early-signals]] — **is the failure mode of** this
```

Only add this where it clarifies something. Ceremony for its own sake is just more to maintain.

## Maintenance

Renaming a concept means updating every reference to it. Search for the old name, replace it, confirm the file exists under the new one.

Sweep occasionally — not on a schedule, but when you notice the graph feels wrong. Find links pointing at files that do not exist, and for each one either write the file or drop the link. Both are fine answers; leaving it is not.

## Anti-patterns

- **Over-linking.** Linking every noun makes the real relationships invisible.
- **Inconsistent naming.** `[[pricing-anchor]]` and `[[pricing-anchors]]` are two nodes and one bug.
- **Orphan entries.** No links out, nothing links in. Unreachable, and it will be rewritten from scratch.
- **One-way links.** If A cites B as foundational, B should acknowledge A. The graph is only navigable in the directions you actually build.
- **Stale links after a rename.** Rename and update in the same pass, or not at all.
- **Links buried at the bottom.** Put them where a reader — or an agent — will actually encounter them.
