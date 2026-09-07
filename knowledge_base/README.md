# knowledge_base/

Reusable concepts and frameworks extracted from `brand/` and `library/`,
organised by domain.

Each entry moves through a lifecycle — **emergent → validated → canonical** —
defined in `_system/knowledge_graph/taxonomy.yaml` and governed by the
`knowledge-base-governance` skill.

The lifecycle is the point. A thought you had once on a call and a framework
you have used with five clients are not the same kind of knowledge, and
flattening them makes the whole base unreliable to draw from.

There is deliberately **no scheduled staleness review and no forced promotion
deadline.** Entries get promoted when they earn it, by being used again.

## Domains

Create directories as you need them. A common starting set:

```
knowledge_base/
  business/  technical/  methodology/  sales/
  strategy/  marketing/  operational/  emergent/
```

`emergent/` is for concepts without a home domain yet. It is supposed to have
things in it — that is the lifecycle working, not untidiness.

## Cross-references

Use `[[wiki-link]]` syntax. See `.agents/conventions/wiki_links.md`. A link to a
concept that does not exist yet is fine — it marks something worth writing.

## Front matter

`type`, `domain`, `status`, `source`, `tags`, `related_concepts`, `date`. Start
from `.agents/templates/knowledge_base_node_template.md`.
