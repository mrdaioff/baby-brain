# Contributing

This is a template, so what is useful to contribute is different from a normal project.

**Welcome:**

- Bug reports against the machinery: a script, a workflow, the sync tooling, the install skill. The most valuable report is "I ran the install skill on a fresh copy and this step failed or misled me", with what the agent did.
- Fixes to that machinery, as small PRs.
- A new row in `scripts/sync-agent-entrypoints.mjs` for a coding CLI that reads a different root file.
- Corrections where two files in here contradict each other.

**Not welcome:**

- Content. No knowledge base entries, no example transcripts, no sample projects, no opinions. The whole point is that this ships empty and fills with yours. Anything of that kind will be closed.
- Domain skills for one line of work. Keep those in your own copy. If a skill is genuinely universal, open an issue first and make the case.
- Provider-specific capture code. It was removed on purpose. See `docs/automated-capture.md` for why.

**Before opening a PR:** run `npm run sync:agents` and commit the regenerated files, or CI fails.
