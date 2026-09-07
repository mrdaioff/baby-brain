---
name: knowledge-base-governance
description: Use when creating a knowledge_base/ entry or deciding whether an existing one should move between lifecycle states. Governs the three-state lifecycle — emergent, validated, canonical — which is deliberately lightweight: no scheduled review, no forced promote-or-archive deadline.
---

# Knowledge Base Governance

Every `knowledge_base/` entry carries a `status`. It records one thing: **how much evidence there is that this idea actually works.**

That distinction is what makes the base worth drawing on. A thought you had once on a call and a framework you have used with five clients are not the same kind of knowledge, and a base that flattens them cannot be trusted when you reach into it.

## The three states

**`emergent`** — new. Extracted from a call, an article, or a moment of synthesis. Untested, possibly wrong, possibly about to be rewritten. Every entry starts here, without exception.

**`validated`** — used once, and it held up. You put it into real work and it did what you expected. You would reach for it again.

**`canonical`** — used repeatedly, roughly three times or more. It has become part of how you think, and people who follow your work recognise it as yours.

```
emergent ──[used once, and it worked]──► validated ──[used 2+ more times]──► canonical
```

Movement is earned by **use**, never asserted at creation. Creating something directly as `validated` because it feels solid defeats the whole mechanism: the status stops meaning "tested" and starts meaning "I liked it", at which point you may as well delete the field.

## Creating an entry

1. Extract the concept from its source — an artifact, a library item, or your own synthesis.
2. Write it up from `.agents/templates/knowledge_base_node_template.md`.
3. Set `status: emergent`.
4. State how you would validate it. What would prove this works? What piece of work would test it? An entry with no validation path can never legitimately be promoted, because nothing would count as evidence.
5. Link it to at least two related concepts with `[[wiki-links]]`. An orphan node is one you will never find again at the moment you need it.

## Promoting an entry

When you use a concept in real work, go back and update it:

- first use → `emergent` becomes `validated`
- third or later use → `validated` becomes `canonical`
- update `date` either way

Do it at the moment of use, while you still remember. Retroactive promotion is guesswork about your own history.

## No scheduled review, on purpose

There is no staleness check here, and no deadline by which an `emergent` entry must be promoted or archived. That is a design decision, not an omission.

Most work gets made organically rather than assembled from a concept you went looking for. So a large and permanent pool of untested `emergent` entries is the **expected steady state**, not a backlog demanding attention. Treating it as a queue to clear produces exactly the wrong behaviour — entries get promoted to shorten the list rather than because anything validated them, and within a quarter the status field means nothing at all.

Promote or archive when you notice something concrete: you used it, or it is plainly dead weight. Never on a timer.

Keep the field accurate all the same. It is what lets you ask the base for what has actually held up, rather than for everything you have ever thought.

## Anti-patterns

- **Creating an entry as `validated` or `canonical`.** Everything starts emergent.
- **Promoting to tidy up.** The pool of emergent entries is supposed to be large.
- **No validation path.** If nothing would count as evidence, the entry can never legitimately move.
- **Orphan nodes.** Two links minimum, or it is invisible when you need it.
- **Ten concepts from one source.** Concept sprawl degrades the base faster than sparseness does.
