---
name: install
description: Use this skill the first time an agent opens a fresh copy of this template, or when the owner asks to add or remove one of the automation tiers later. Walks the owner through choosing an install tier (0 = files and conventions only, 1 = adds GitHub-hosted ingestion), applies the identity and vocabulary settings from _system/config.yml, physically removes everything the chosen tier does not use, and records the result in _system/install.yml. Read this before touching any other file in a repo whose _system/install.yml is missing or still says tier: unset.
---

# Install Protocol

You are setting up a fresh copy of this template for its new owner. They have not read the repo. They may not know what any of it does. Your job is to get them to a working state in one session and to **delete everything they did not choose**, so nothing sits in their repo failing quietly forever.

Read this whole file before you start. The single most common way this goes wrong is an agent that configures a tier without removing the tiers above it.

---

## The one thing you cannot do

**You cannot create accounts, generate API keys, or install GitHub Apps.**

Tier 1 needs credentials that only a human can produce, in a browser, in their own name. Every one of those points is marked **STOP** below. At a STOP:

1. Tell the owner exactly what to go do, with the URL.
2. Tell them exactly what to bring back — the shape of the value, so they know they grabbed the right thing.
3. Wait. Do not guess a value, do not scaffold a placeholder and move on, and do not mark the step done.
4. When they come back, verify the credential works before continuing.

An install that reports success with a placeholder token in it is worse than one that stops honestly at step 4. The owner will not discover the difference for days, and when they do, the failure looks like a bug in the pipeline rather than an incomplete install.

---

## Step 1 — Ask which tier

Show the owner this table. Do not pick for them, and do not steer toward the higher tiers because they are more interesting.

| Tier | What you get | What it costs | Setup |
|---|---|---|---|
| **0 — Files** | The folder structure, the conventions, the skills, and the agent instruction files. You drop notes and transcripts in by hand; your agent files them correctly. | Nothing. | About five minutes, all of it in this session. |
| **1 — Hosted ingestion** | Everything in 0, plus: drop a file in `intake/inbox/`, push, and a cloud agent files it, extracts concepts, and opens a merged PR without you present. | A Claude subscription or API credits. GitHub Actions minutes; the free tier is usually enough. | 20–40 minutes. Two credentials you must create. |

There is a third thing people ask about — content arriving automatically from a meeting recorder or a phone. That is not a tier here; it is an extension they build against their own providers. If they raise it, point them at `docs/automated-capture.md`, which starts by helping them decide whether they need it at all. Most do not.

Then say this, in your own words: **Tier 0 is the actual product.** The conventions and the skills are what make a repo like this work. Tier 1 automates the filing, which matters once you are ingesting several things a week and is pure overhead before then. Someone who takes Tier 0 and never upgrades has lost nothing.

Recommend starting at 0 unless the owner already has a meeting recorder running and already knows they want its output in here. Downgrading after wiring up five providers is far harder than upgrading later.

Be accurate about what upgrading costs, though: this skill **deletes** the files for tiers that were declined, so adding one back later means restoring those files from the original template or from git history first. Re-running this skill against the installed repo cannot conjure them back. That is a reason to keep the repo in git from day one, not a reason to over-install now.

**Ask, and wait for an answer.** Do not proceed on an assumption.

---

## Step 2 — Identity and vocabulary

Open `_system/config.yml` and fill it in with the owner.

**Identity.** Ask for their name as it appears in meeting transcripts, and every variant of it. Push a little here: the `aliases` list is what the `librarian` skill matches speaker labels against to decide whether a transcript is theirs or a third party's. If the list is short, their own calls get filed as external material and the first-party/third-party split — the thing this repo exists to maintain — quietly stops working.

Ask specifically for nicknames, accented and unaccented spellings, how their recorder writes it, and how clients say it. Over-including is harmless; a miss is not.

**Vocabulary.** Ask what they call a unit of client work. The default is `projects`. Common alternatives are `clients`, `engagements`, `opportunities`, `matters`, `deals`. Use their word, not yours — this is the directory they open every day.

Then apply it, in this order:

1. `git mv projects <their-word>`, and likewise for `first_party_dir` and `third_party_dir` if they changed those. **Also `git mv .agents/templates/project <their-word-singular>`** — `project-creation` copies the four scaffold files from there, and it is easy to miss because it sits under `.agents/`, not in the renamed directory.
2. Rewrite every reference across the tree: `.agents/`, `scripts/`, `.github/workflows/`, the root instruction files, `README.md`, and the renamed directory's own `README.md` and `registry.yml`.

   **`scripts/` is not optional, and it is not prose.** `scripts/rollup-open-items.mjs` holds a real runtime path:

   ```js
   const PROJECTS_DIR = path.join(REPO_ROOT, "projects");
   ```

   Miss it and the script does not crash — it does `if (!fs.existsSync(PROJECTS_DIR)) return []` and reports zero open items, forever, for a repo full of them. `scripts/project-router.sh` embeds the directory name a dozen times in the prompt it builds. Grep `scripts/` specifically and read every hit.

3. Grep the whole tree for the old word afterwards. You will **not** reach zero, and should not try: the `install` skill's own text uses `projects` as the default vocabulary, `services-catalog` has an `origin_projects` schema field, and two files legitimately list it as one alternative among several. What must reach zero is *functional* references — paths in code, paths in workflow `paths:` filters, and prose describing the renamed directory. Read each remaining hit and confirm it is one of the harmless kinds.
4. Run `npm run sync:agents` so the generated root files pick up the change.

Do the rename **now**, before anything else is written. Renaming a populated repo later means rewriting file content, wiki-links, and cross-references, and something always gets missed.

**Buckets.** Ask whether they work under more than one commercial identity — their own clients plus a white-label partner, say, or two agencies. If yes, fill in `buckets.list` and set `enabled: true`, and the `project-creation` skill will force an explicit choice instead of guessing. If everything is under one banner, leave it disabled: an unused bucket field is one more thing for an agent to fill in wrongly.

If you did enable buckets, **fill in `.agents/work-contexts.md` in the same pass.** `config.yml` holds only the ids; that file holds what an agent actually needs to route correctly — who is in each context, which names are reliable signals and which appear everywhere, and what must never cross over. Every session is told to read it whenever a client is involved, so leaving it as an empty template while buckets are live is worse than not enabling them. Record what the owner told you, and mark what you do not know as an open question rather than inventing it.

---

## Step 3 — Remove what they did not choose

This is the step that gets skipped, and skipping it is why people abandon repos like this one. A Tier 0 owner who keeps `.github/workflows/` gets a failed Actions run and an email on every single push, forever, for a feature they declined.

Delete, do not disable. A commented-out workflow is a thing the next agent will helpfully re-enable.

### If they chose Tier 0

```bash
rm -rf .github/workflows/ .github/logs/
rm -f  .env.example TROUBLESHOOTING.md scripts/project-router.sh
```

Then trim the files that survive but still describe what you just deleted:
`intake/README.md` documents `staging/` and the hosted pipeline, and `.gitignore`
carries build state for tooling you may not use. **Open every directory README** — each one states
which of its contents belong to which tier, and they are the only place some of
that is written down.

Each of those last four is easy to leave behind, and each is actively misleading if you do:

- **`.env.example`** lists nothing but Tier 1 secrets. Left in place it tells the owner — and every future agent — to go configure credentials for a pipeline they declined.
- **`TROUBLESHOOTING.md`** documents only pipeline failures. At Tier 0 there is no pipeline, and the `README.md` link to it goes in the same pass.
- **`scripts/project-router.sh`** is 260 lines whose only caller was `.github/workflows/project-router.yml`, which you just deleted. Nothing can invoke it again.
- **`.github/logs/`** exists solely to hold the pipeline's dedup log.

Keep `.github/pull_request_template.md`.

`package.json` needs no changes — every script left in it works at Tier 0, and `gray-matter` is the only dependency.

Finally, remove the Tier 1 section from `README.md` and `.agents/agent.md`, and run `npm run sync:agents`. Their repo should read as though the hosted pipeline was never there.

### If they chose Tier 1

Nothing to remove. Optionally delete `.github/workflows/repo-health.yml` — useful, but a scheduled job that will mail them weekly.

`.env.example` and `TROUBLESHOOTING.md` both stay: at Tier 1 they describe machinery that is actually present.

### Sections inside skills you are keeping

Deleting files is not the whole job. At **Tier 0**, the `librarian` skill still carries a section on processing
automated ingestion issues — the `Fixes #<issue-number>` auto-merge rules — instructions about
issues, PRs, and an auto-merge workflow that no longer exist in this repo. The
agent reads them on every single ingestion.

Cut those sections. Leaving them in is not harmless: an agent that believes it
is supposed to open a PR will either try and fail, or narrate a step that never
happened.

---

## Step 3.5 — Scrub the previous owner

**Do not skip this, and do not assume it has been done.**

This template was extracted from somebody's real working repository, not
hand-authored as clean placeholder content. Extraction is never complete. Real
client names, commercial-context ids, and personal attributions survive inside
skill files, code comments and examples, sitting there looking exactly like
generic placeholders — because that is what a client slug looks like out of
context.

This has already happened. An earlier version of this very template shipped
frontmatter examples naming two real commercial contexts and three real client
slugs, plus a named person's dated writing preferences — every one of them
reading as innocuous placeholder text. An agent following the setup would have
told its new owner they had partner organisations and clients they had never
heard of.

(Those names are deliberately not repeated here. Writing a leak into the
instruction that warns about leaks is the same mistake wearing a different
hat — and yes, that happened too, and was caught by the sweep described
below.)

So: grep for what is *shaped like* someone's data, not for names you know. You
cannot grep for a name you have never seen, which is exactly why the last one
survived a targeted audit.

- Frontmatter example values: `context:`, `client:`, `project:`, `bucket:` —
  is the value a placeholder like `<slug>`, or a real-looking company name?
- Kebab-case slugs used as examples anywhere in `.agents/skills/`.
- Attributions: a person's name attached to a preference, an opinion, or a
  dated incident. Generic templates should say "the author" or nothing.
- Code comments in `scripts/` naming a product, client, or dashboard.
- **Reused, over-specific vocabulary.** The highest-yield category, and the least
  obvious. A genuine template invents a fresh placeholder for each example; a leak
  reuses the author's real vocabulary, because that was easier than inventing one.
  So look for *repetition and specificity*, not for names: an enum of eight oddly
  precise categories, or the same handful of concept names recurring across every
  example in a file. Test a suspect list by asking whether it reads as one
  business's actual taxonomy rather than as illustration. If it does, replace it
  with an instruction to invent their own.
- `LICENSE` — the copyright line is the original author's and **stays**. That
  is how MIT works, and it is not a leak. Do not "fix" it.

Be willing to conclude that something is fine. Not every domain-flavoured example is
a leak, and genericising a perfectly good illustration costs clarity for nothing.
Where you can check — does this value appear elsewhere in the repo as real data? —
check rather than guess.

Anything that names a real party gets replaced with a pointer to
`_system/config.yml` or a clearly fake placeholder. If you are unsure whether a
name is real or invented, treat it as real.

Report what you found to the owner. They should know their template arrived
carrying someone else's business.

## Step 4 — Tier 1 setup

Skip this section entirely if they chose Tier 0.

The Tier 1 loop: a push touching `intake/inbox/` fires `ingest-content.yml`, which opens a GitHub issue mentioning the cloud agent; the agent processes the file per the `librarian` skill and opens a PR whose body says `Fixes #<issue>`; `auto-merge.yml` merges it; `ingest-cleanup.yml` moves the file from `inbox/` to `processed/`.

Every link in that chain has to hold, so verify at the end rather than assuming.

**STOP 1 — Install the cloud coding agent's GitHub App.** Send them to install it on this repository specifically, not on all repos. Ask them to confirm it appears under the repo's Settings → Integrations.

**STOP 2 — Generate the agent's auth token.** They generate this from their own account. Tell them the expected prefix so they can confirm they copied the right value. Have them add it as a repository secret named `CLAUDE_CODE_OAUTH_TOKEN` under Settings → Secrets and variables → Actions.

**STOP 3 — Generate a GitHub personal access token** with `repo` and `workflow` scopes, as a repository secret named `GH_PERSONAL_TOKEN`. This is the one that opens the issue and the PR.

Warn them in these words: **both of these expire.** When they do, the pipeline stops with no error anyone will see — files pile up in `inbox/` and nothing happens. `TROUBLESHOOTING.md` carries the two distinct signatures. Suggest a calendar reminder a month before the PAT's expiry date.

**Before the test, check two repo settings.** Both are silent failures later:

- Settings → General → Pull Requests → **Allow squash merging** must be on.
  `auto-merge.yml` merges with `--squash` and nothing else.
- **Branch protection on `main` must not require a review.** The PAT owner is
  always the PR author, and GitHub forbids approving your own PR, so a required
  review makes every ingestion PR permanently unmergeable.

The ingestion labels create themselves on first run — you do not need to make
them by hand.

**Then verify, end to end, before calling it done:**

1. Write a small real Markdown file into `intake/inbox/`, named `YYYY-MM-DD_Install-Test.md`, with a couple of paragraphs of genuine prose in it rather than filler.
2. Commit and push.
3. `gh run list --limit 5` — confirm `ingest-content.yml` succeeded.
4. `gh issue list --label ingestion` — confirm an issue was created.
5. Wait for the cloud agent. Confirm a PR appears and merges.
6. Confirm the file moved to `intake/processed/`.

If it stalls, work `TROUBLESHOOTING.md` in the order given — the checks are ordered by how often each cause turns out to be the real one. Do not start editing the workflow files. They carry accumulated fixes for bugs that are not obvious from reading them, and a plausible-looking cleanup will reintroduce one.

---

## Step 5 — Mention the extension, briefly

If the owner asked about automatic capture — transcripts arriving on their own, saving things from a phone — do not build it now, and do not promise it.

Tell them it is a real extension, that `docs/automated-capture.md` walks through whether it is worth it and how to build it against their own providers, and that the honest threshold is several items a week arriving faster than they can file them. Below that it costs more than it saves.

Then move on. A fresh install is the worst possible moment to take on five provider accounts.

---

## Step 6 — Record what you did

Write `_system/install.yml`:

```yaml
tier: 0            # 0 or 1 — the tier actually verified working
installed: 2026-01-01
vocabulary_applied: true
removed:
  - .github/workflows/
  - .github/logs/
  - .env.example
  - TROUBLESHOOTING.md
  - scripts/project-router.sh
notes: >
  Anything the next agent needs to know. Half-finished steps, a credential the
  owner said they would create later, a provider they chose to skip.
```

This file is not bookkeeping. `scripts/repo-health-scan.js` reads it and skips the checks belonging to tiers that are not installed. Without it, a Tier 0 repo reports pipeline failures for a pipeline that was deliberately removed, every time the scan runs, and the owner learns to ignore the health scan.

If the install stopped partway — a credential they have not made yet — record the tier that **actually works today**, not the one they intend to reach, and put the remainder in `notes`.

---

## Step 7 — Hand over

Close by telling them three things, briefly.

1. **The daily loop.** Content in, agent files it, concepts get extracted. Point at `README.md` § Daily use.
2. **The one rule that matters.** Before working on a unit of client work, the agent reads that folder's `context.md`; after doing anything meaningful, it writes back. That habit is the whole value of the repo — everything else is filing.
3. **What to customise first.** `.agents/working-agreements.md` ships generic. The moment an agent does something they did not want, they should write the rule *and the incident that produced it* into that file. That is how the repo comes to know them.

Do not dump the architecture on them. They will read it when they need it.

---

## Anti-patterns

- **Configuring a tier without removing the ones above it.** The most common failure by a wide margin. See Step 3.
- **Filling in a placeholder credential to keep momentum.** Stop instead.
- **Choosing the tier for them** because a higher one demos better.
- **Renaming the project directory after content exists.** Do it in Step 2 or not at all.
- **Marking Tier 1 done without the end-to-end test.** Every link in that chain has failed in production at least once, and a green run on the first workflow proves almost nothing.
- **"Improving" a workflow file during install.** Change one only in response to a failure you have actually reproduced.
- **Skipping `_system/install.yml`** because the install went cleanly.
