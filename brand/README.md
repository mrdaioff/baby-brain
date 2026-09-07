# brand/

**First-party content only.** Things you said, wrote, decided, or believe.

If it did not originate with you, it belongs in `library/`. That separation is
the foundation everything else here rests on: mix the two and you can no longer
tell your own position from something you read once, which makes quoting,
attribution, and any generated content untrustworthy.

The `librarian` skill makes this call by matching speaker labels against
`identity.aliases` in `_system/config.yml`. Keep that list generous — a false
match on your own name is harmless, a miss is not.

```
brand/
  artifacts/     Raw meeting transcripts and dictations
  transcripts/   Cleaned transcript text
  voice/         How you write and speak — tone, principles, patterns
  opinions/      Positions you hold, and why
```

## Naming

Transcripts: `YYYY-MM-DD_HHmmss_Topic_Name.md`

## Front matter

Required on every file — at minimum `type`, `source`, `date`, `tags`.

Note that `scripts/lint-frontmatter.mjs` does **not** check this directory. It is
scoped to `knowledge_base/` only, so frontmatter here is a convention you and your
agent maintain, with nothing failing the build when it drifts. Widening the linter
is a reasonable change to make; until you do, do not assume a missing field will
be caught.
