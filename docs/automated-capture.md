# Automated capture — should you build it, and how

This template ships two tiers: files and conventions (Tier 0), and hosted
ingestion (Tier 1). There is a third thing you can build on top, and this
document is what used to be a shipped Tier 2.

It is documentation rather than code on purpose. See "Why this is not shipped"
at the end.

**Automated capture** means content arrives in `intake/inbox/` without you
putting it there — a meeting transcript filed the moment the call ends, an
article saved from your phone, a newsletter forwarded to an address that drops
it into the repo.

---

## First: do you actually need it?

Probably not yet. Answer honestly.

**How many things a week are you ingesting by hand?** Under five, and automation
costs more than it saves — you are spending an evening of setup and $20–80 a
month to avoid a task that takes eleven seconds. The manual path is: save the
file, commit, push. That is the whole thing.

**Are the items you skip skipped because filing is annoying, or because they were
not worth keeping?** This is the question that matters. Automation only pays when
real material is being lost to friction. If you are mostly skipping things that
did not deserve a place anyway, automating capture just fills the repo with them —
and a knowledge base full of things you never wanted is worse than a thin one,
because you stop trusting what is in it.

**Is your recorder already producing transcripts you re-read?** If you never open
them, piping them in automatically changes nothing except your storage bill.

The honest threshold is roughly: **several items a week, arriving faster than you
file them, that you would genuinely miss.** Below that, build it later. The
conventions in this repo do not care how content arrives.

---

## What it is, architecturally

Two halves that work independently. Build one, live with it, then decide whether
the second is worth it — plenty of people want transcripts and never care about
web capture.

### Half A — meeting transcripts

```
recorder ──webhook──► public endpoint ──► job ──► intake/staging/ ──► promote ──► intake/inbox/
         └──poll─────────────────────────► job ──┘
```

**Two paths in, deliberately.** A webhook for speed, a scheduled poll as the
safety net. Webhooks get missed — the endpoint is down, the provider retries
twice and gives up, a deploy lands mid-delivery. A poll that runs every 15
minutes catches whatever the webhook dropped.

**They share one dedup log, committed to the repo.** That is what makes running
both safe: whichever path sees a recording first writes its id to the log, and
the other skips it. Commit the log rather than keeping it in a database — it has
to survive a job runner losing its state, and it is three lines of text.

**Staging exists so promotion can merge.** Transcripts land in `intake/staging/`
first, not `inbox/`, because a separate step may want to combine the recorder's
transcript with notes you took during the same call before either becomes an
artifact. If you have no second source, staging is a pass-through and you can
collapse it.

### Half B — web and email capture

```
phone share sheet ──► relay ──┐
browser action ──────► relay ──┼──► scrape job ──► intake/inbox/
forwarded email ──► RSS ──poll─┘
```

A messaging bot and a browser action both post a URL to a small hosted endpoint,
which triggers a job that scrapes the page and writes it in. Email is different
in shape — a service that turns an address into an RSS feed, polled on a
schedule — but lands in the same place.

**Dedup before scraping, not after.** The same link will arrive twice, from two
surfaces, because you forgot you already saved it. Check `inbox/` and
`processed/` for the normalised URL before spending a scrape credit.

---

## The non-obvious design constraints

These are the things that cost a day each to discover.

**Your job runner probably has no inbound URL.** Most scheduled-job platforms can
only be triggered by their own API with a bearer token, and a webhook provider's
config screen will not let you add an auth header. So you need a thin hosted
function in front whose entire job is: receive the POST, verify the signature,
forward to the runner, return 200 fast. That relay is why the architecture has a
piece that looks redundant.

**Verify webhook signatures, and return 200 quickly.** An endpoint that accepts
anything is an open write path into your repo. Most providers sign with an HMAC
over a timestamp and body — implement the check, and reject on failure. Separately,
providers time out fast: acknowledge first, do the work asynchronously.

**Deploy asymmetry will confuse you.** If your job runner deploys on push but your
hosted functions need a manual deploy command, you will change a function, see no
effect, and conclude the system is broken. Write down which is which before you
need it at 11pm.

**A webhook secret is often shown exactly once.** At creation time, in the API
response. There is frequently no endpoint to retrieve or regenerate it — if you
lose it, you delete the webhook and make a new one. Save it immediately.

**Scrapers fail silently, and zero results is the signature.** Two real causes
worth checking before you debug your own code: a missing trailing slash on the
target URL (some scrapers return nothing without it, and platform permalinks
usually omit it), and the scraper itself being broken for the URL shape you are
using — including for the example in its own documentation. Test against a
known-good URL before assuming the fault is yours.

**Bot-triggered events do not always cascade.** On GitHub, a push made with the
default Actions token does not trigger other workflows. If your capture job
commits with that token, nothing downstream fires and the file sits there. Use a
personal token, or do the downstream work in the same job.

---

## If you decide to build it

You do not need this repo's implementation, and you should not want it — it was
written against one specific recorder, one scraper, and one job runner. Yours will
differ in every one of those.

What transfers is the shape. Describe it to your agent roughly like this:

> Build a scheduled job that polls `<provider>` for finished recordings, skips any
> whose id already appears in a dedup log committed at `.github/logs/<name>.log`,
> writes the rest into `intake/staging/` as Markdown with front matter, and appends
> the ids it handled. Then a second job that promotes `intake/staging/` into
> `intake/inbox/`. Keep every provider credential in the runner's own secret store,
> never in the repo.

Then add the webhook path once the polling path is proven working, not before.

Build it in this order, and stop when it is enough:

1. **Polling only, one source.** Slower, far simpler, no public endpoint, no
   signature verification. This alone eliminates most manual filing.
2. **Webhook for that source**, if the delay actually bothers you.
3. **The second half**, only if you find yourself wanting it.

Most people should stop after step 1, and a good number after step 0.

---

## Why this is not shipped as code

Three reasons, in order of weight.

**It was the only part nobody could verify.** Every other part of this template
was installed from scratch by readers who had never seen it. Tier 2 could not be —
testing it needs five paid accounts a test cannot create — so it was the one
component shipping on the author's word alone. It also turned out to be broken:
a task called a script that was never extracted, and the source repo's name was
hardcoded across thirty-odd call sites, so every write would have targeted
somebody else's repository.

**It was the least transferable part.** Bound to specific providers by every
line. A reader using a different recorder could use none of it, and would want
this document instead.

**Shipping code you cannot test is how a template loses trust.** A forker who
hits a broken tier stops believing the working ones. Better to ship less and have
it be true.

The working implementation still exists in the repository this was extracted
from. If you want a reference rather than a design, ask its author.
