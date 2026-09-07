#!/usr/bin/env node

/**
 * repo-health-scan.js
 *
 * Weekly repo-hygiene sweep covering four categories the automated
 * pipelines don't self-report on:
 *
 *   1. intake/inbox/ stragglers — files that landed in the inbox but were
 *      never picked up by ingest-content.yml. The ingestion pipeline only
 *      reacts to NEW pushes into inbox/; if the cloud agent never
 *      responds to the resulting issue (or the chain breaks silently, cf.
 *      the GH_PERSONAL_TOKEN expiry failure mode documented in
 *      TROUBLESHOOTING.md), a file can sit there indefinitely with nothing flagging
 *      it. Staleness is measured from *first-added-to-git* date, not the
 *      leading date in the filename (`YYYY-MM-DD_HHmmss_Title.md`) — that
 *      date is when the transcript/content happened, which can predate
 *      the file actually landing in the repo by a long stretch.
 *
 *   2. Open GitHub issues labeled `ingestion` that are old enough to imply
 *      the @claude -> PR -> auto-merge chain broke. Threshold is
 *      intentionally longer than the inbox-file threshold (14d vs 7d):
 *      by the time an `ingestion` issue exists, the file has already
 *      cleared the "landed in inbox" step, so a few extra days of normal
 *      processing latency (weekends, App backlog) are expected before
 *      calling it stuck. 14 days is a starting point, not a hard rule —
 *      adjust ISSUE_STALE_DAYS below if it proves too noisy or too lax.
 *
 *   3. Open PRs older than 30 days — covers both abandoned/competing
 *      feature branches (e.g. two PRs for the same feature left open) and
 *      unmerged Dependabot PRs piling up. This is a flag-only report; nothing
 *      is auto-closed or auto-merged.
 *
 *   4. Root-level junk — files/directories that don't look like they
 *      belong at repo root. Detection is structural (naming heuristics),
 *      not a blocklist of specific filenames, so it also catches future
 *      junk with different names. See classifyRootEntry() for the rules.
 *
 * This is a read-only reporting tool.
 * It never deletes, moves, or auto-closes anything. It shells out to the
 * `gh` CLI for issue/PR data (rather than hitting the GitHub API directly via
 * fetch); inside GitHub Actions, `gh`
 * is preauthenticated via the GH_TOKEN env var. Locally, it uses whatever
 * `gh auth status` is already logged into.
 *
 * Usage:
 *   node scripts/repo-health-scan.js --json           # raw findings as JSON
 *   node scripts/repo-health-scan.js --issue-body      # compact markdown for the GH issue
 *   node scripts/repo-health-scan.js --full-report      # full per-item listing (for step summary)
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const REPO_ROOT = fs.existsSync(path.join(__dirname, "..", "intake"))
  ? path.resolve(__dirname, "..")
  : process.cwd();

const INBOX_DIR = path.join(REPO_ROOT, "intake", "inbox");

const INBOX_STALE_DAYS = 7;
const ISSUE_STALE_DAYS = 14; // see doc block above for reasoning
const PR_STALE_DAYS = 30;
const SAMPLE_SIZE = 25;
// A branch is only "stranded" once the run that pushed it has had time to open
// its PR. Two hours is far longer than any observed run and keeps an in-flight
// ingestion from being flagged mid-write.
const BRANCH_GRACE_HOURS = 2;
const CLAUDE_BRANCH_PREFIX = "claude/issue-";

// --- gh CLI helpers ------------------------------------------------------

function ghJson(args) {
  try {
    const out = execFileSync(process.platform === "win32" ? "gh.exe" : "gh", args, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      maxBuffer: 20 * 1024 * 1024,
    });
    return { data: JSON.parse(out) };
  } catch (err) {
    // Don't crash the whole scan if gh isn't authenticated / rate-limited /
    // unavailable in some environment — surface the error in the report
    // instead so the rest of the categories still come through.
    const message = err && err.stderr ? String(err.stderr).trim() : String(err && err.message ? err.message : err);
    return { data: null, error: message };
  }
}

function daysAgo(isoDate, today) {
  const d = new Date(isoDate);
  return Math.floor((today - d) / 86400000);
}

// `gh api --paginate --jq` streams one JSON value per line rather than a single
// document, so its output is not parseable as JSON. Use this for those calls.
function ghLines(args) {
  try {
    const out = execFileSync(process.platform === "win32" ? "gh.exe" : "gh", args, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      maxBuffer: 20 * 1024 * 1024,
    });
    return { data: out.split(String.fromCharCode(10)).map((l) => l.trim()).filter(Boolean) };
  } catch (err) {
    const message = err && err.stderr ? String(err.stderr).trim() : String(err && err.message ? err.message : err);
    return { data: null, error: message };
  }
}

// --- 1. intake/inbox/ stragglers -----------------------------------------

function firstAddedDate(absPath) {
  const rel = path.relative(REPO_ROOT, absPath).split(path.sep).join("/");
  try {
    const out = execFileSync(
      "git",
      ["log", "--diff-filter=A", "--format=%aI", "--reverse", "--", rel],
      { cwd: REPO_ROOT, encoding: "utf-8" }
    ).trim();
    const firstLine = out.split("\n")[0];
    if (firstLine) return { date: firstLine, tracked: true };
  } catch {
    // fall through to mtime fallback
  }
  // No "added" commit found — either untracked (dropped but not yet
  // committed/pushed) or git log genuinely has nothing for it. Fall back
  // to filesystem birth/mtime so a straggler still gets surfaced rather
  // than silently skipped.
  try {
    const stat = fs.statSync(absPath);
    const fallback = (stat.birthtime && stat.birthtime.getTime() > 0 ? stat.birthtime : stat.mtime).toISOString();
    return { date: fallback, tracked: false };
  } catch {
    return { date: null, tracked: false };
  }
}

function scanInboxStragglers(today) {
  if (!fs.existsSync(INBOX_DIR)) {
    return { count: 0, thresholdDays: INBOX_STALE_DAYS, items: [], note: "intake/inbox/ does not exist" };
  }

  const items = [];
  for (const entry of fs.readdirSync(INBOX_DIR, { withFileTypes: true })) {
    if (entry.name === ".gitkeep" || entry.name.startsWith(".")) continue;
    if (!entry.isFile()) continue; // subdirectories (if any) aren't part of the naming convention

    const abs = path.join(INBOX_DIR, entry.name);
    const { date, tracked } = firstAddedDate(abs);
    if (!date) continue;

    const days = daysAgo(date, today);
    if (days > INBOX_STALE_DAYS) {
      items.push({
        file: entry.name,
        firstAdded: date.slice(0, 10),
        daysOld: days,
        tracked,
        ...classifyStraggler(entry.name),
      });
    }
  }

  items.sort((a, b) => b.daysOld - a.daysOld);
  return { count: items.length, thresholdDays: INBOX_STALE_DAYS, items };
}

// A file sitting in intake/inbox/ means one of two very different things, and
// the fix differs: either it never got an ingestion issue (genuinely orphaned —
// ingest-content.yml only ever processes its own push diff, so a file missed
// once is never retried), or its issue ran to completion and only the
// inbox -> processed move failed. Checking the issue distinguishes them.
//
// Do NOT try to answer this by looking for a matching filename elsewhere in the
// repo: the librarian retitles content during ingestion (2026-07-18
// "Newsletter-Fwd_Anthropics_new_landlord.md" landed as
// "library/newsletters/2026-07-18_Anthropics_Landlord_Is_Elon_Musk.md"), so a
// filename check reports correctly-ingested files as missing.
function classifyStraggler(filename) {
  const title = `[Ingest] ${filename}`;
  const { data, error } = ghJson([
    "issue", "list",
    "--search", `"${title}" in:title`,
    "--state", "all",
    "--limit", "1",
    "--json", "number,state",
  ]);
  if (error || !data || data.length === 0) {
    return { issueNumber: null, issueState: null, diagnosis: "no ingestion issue — never picked up" };
  }
  const issue = data[0];
  return {
    issueNumber: issue.number,
    issueState: issue.state,
    diagnosis: issue.state === "CLOSED"
      ? "processed — ingest-cleanup.yml did not move it out of inbox/"
      : "issue still open — ingestion has not finished",
  };
}

// --- 2. Stale `ingestion` issues -------------------------------------------

function scanStaleIngestionIssues(today) {
  const { data, error } = ghJson([
    "issue", "list",
    "--label", "ingestion",
    "--state", "open",
    "--limit", "200",
    "--json", "number,title,url,createdAt",
  ]);

  if (error) return { count: 0, thresholdDays: ISSUE_STALE_DAYS, items: [], error };

  const items = (data || [])
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      url: issue.url,
      createdAt: issue.createdAt,
      daysOld: daysAgo(issue.createdAt, today),
    }))
    .filter((issue) => issue.daysOld > ISSUE_STALE_DAYS)
    .sort((a, b) => b.daysOld - a.daysOld);

  return { count: items.length, thresholdDays: ISSUE_STALE_DAYS, items };
}

// --- 3. Stale open PRs ------------------------------------------------------

function scanStalePRs(today) {
  const { data, error } = ghJson([
    "pr", "list",
    "--state", "open",
    "--limit", "200",
    "--json", "number,title,url,createdAt,isDraft,author",
  ]);

  if (error) return { count: 0, thresholdDays: PR_STALE_DAYS, items: [], error };

  const items = (data || [])
    .map((pr) => ({
      number: pr.number,
      title: pr.title,
      url: pr.url,
      createdAt: pr.createdAt,
      daysOld: daysAgo(pr.createdAt, today),
      isDraft: pr.isDraft,
      author: pr.author && pr.author.login,
    }))
    .filter((pr) => pr.daysOld > PR_STALE_DAYS)
    .sort((a, b) => b.daysOld - a.daysOld);

  return { count: items.length, thresholdDays: PR_STALE_DAYS, items };
}

// --- 5. Stranded Claude branches --------------------------------------------
//
// The failure this exists to catch: on 2026-09-02, PR #2170 replaced the
// customised claude.yml with the stock template, deleting its auto-create-PR
// step. Claude kept doing the work and pushing claude/issue-* branches, but
// nothing opened a PR, so auto-merge.yml never fired and 14 issues sat open
// with finished work stranded on branches. Bucket 2 could not see it: those
// issues were 1-3 days old, well under its 14-day threshold, so this scan
// reported "None — clean" throughout.
//
// Note on the ahead_by test: this repo squash-merges, which does not make the
// branch an ancestor of main. A merged branch therefore still reports
// ahead_by > 0 forever. So "ahead of main" alone means nothing — the load-
// bearing condition is the absence of a PR in ANY state.
function scanStrandedBranches(today) {
  const { data: prData, error: prError } = ghJson([
    "pr", "list", "--state", "all", "--limit", "500", "--json", "headRefName",
  ]);
  if (prError) return { count: 0, items: [], error: prError };
  const withPR = new Set((prData || []).map((pr) => pr.headRefName));

  // Keep the jq filter page-safe: `--paginate --jq` applies the filter once per
  // page, so a filter that can emit "null" for a page without matches pollutes
  // the stream. `.[].name` only ever emits real names. Prefix-filter in JS.
  const { data: branches, error: brError } = ghLines([
    "api", "repos/{owner}/{repo}/branches", "--paginate", "--jq", ".[].name",
  ]);
  if (brError) return { count: 0, items: [], error: brError };

  const candidates = (branches || [])
    .filter((b) => b.startsWith(CLAUDE_BRANCH_PREFIX) && !withPR.has(b));

  const items = [];
  for (const branch of candidates) {
    const { data: cmp } = ghJson([
      "api", `repos/{owner}/{repo}/compare/main...${branch}`, "--jq",
      "{ahead: .ahead_by, when: .commits[-1].commit.committer.date}",
    ]);
    if (!cmp || !cmp.ahead) continue;

    const when = cmp.when || null;
    if (when && (today - new Date(when)) / 36e5 < BRANCH_GRACE_HOURS) continue;

    const m = branch.match(/^claude\/issue-(\d+)-/);
    items.push({
      branch,
      issueNumber: m ? Number(m[1]) : null,
      commitsAhead: cmp.ahead,
      lastCommit: when ? when.slice(0, 10) : "unknown",
      daysOld: when ? daysAgo(when, today) : null,
    });
  }

  items.sort((a, b) => (b.daysOld ?? 0) - (a.daysOld ?? 0));
  return { count: items.length, items };
}

// --- 4. Root-level junk -----------------------------------------------------
//
// Deliberately structural, not a list of today's known offenders (`0`, `1`,
// `TODAY`, `contacts-cleaned.csv`, the mangled `C:\Users\...` directory,
// etc.) — those exist in the repo today purely as *test fixtures* for this
// heuristic, not as inputs it pattern-matches on by name. A differently
// named piece of junk next month should trip the same rules.

// Tooling/VCS internals — not part of the "hygiene" surface at all.
const ROOT_SKIP = new Set(["node_modules", ".git"]);

// Extensions considered normal for root-level project files (docs, config).
// Data dumps, exports, logs, etc. belong in a subdirectory, not root.
const ROOT_ALLOWED_EXTENSIONS = new Set([".md", ".json", ".ts", ".js", ".mjs", ".cjs", ".yml", ".yaml"]);

// A small number of conventional extensionless root files.
const EXTENSIONLESS_ALLOW = new Set(["LICENSE", "Makefile", "Dockerfile", "Procfile", "CNAME"]);

// Keyword bank for "looks like a working artifact, not a deliverable" —
// generalized categories (test output, exports, scratch files, backups),
// not literal filenames.
const SUSPICIOUS_KEYWORD_PATTERNS = [
  /test.?output/i,
  /\bscratch(pad)?\b/i,
  /\btemp\b/i,
  /\btmp\b/i,
  /\bcleaned?\b/i,
  /\bexport(ed)?\b/i,
  /\bdump\b/i,
  /\bbackup\b/i,
  /\bcopy\b/i,
  /\buntitled\b/i,
  /\bdraft\b/i,
  /\bwip\b/i,
  /\bold\b/i,
  /\bfinal\b/i,
  /\breport\b/i,
  /\bcontacts?\b/i,
  /\bleads?\b/i,
];

// Unicode Private Use Area — commonly appears when an archive/zip extractor
// substitutes an illegal-on-Windows character (like `:`) with a lookalike
// PUA codepoint while unpacking a path that originated on another OS. This
// is exactly how the mangled `C:\Users\...` temp-path directory got its
// name in this repo.
const PUA_RANGE = /[-]/;

function looksLikeSmashedPath(name) {
  // A long run-on name with many camelCase transitions and no word
  // separators reads like several path segments got concatenated
  // (e.g. a Windows temp path with separators stripped).
  const hasSeparators = /[-_ ]/.test(name);
  if (hasSeparators) return false;
  const transitions = (name.match(/[a-z][A-Z]/g) || []).length;
  return name.length > 25 && transitions >= 4;
}

function classifyDirectory(name) {
  const reasons = [];
  if (PUA_RANGE.test(name)) reasons.push("contains-private-use-area-char (mangled path substitution)");
  if (/^[A-Za-z][:\\]/.test(name)) reasons.push("looks like a drive-letter / absolute-path prefix");
  if (/[\\/]/.test(name)) reasons.push("contains embedded path separator");
  if (looksLikeSmashedPath(name)) reasons.push("long run-on name with many concatenated capitalized segments (smashed path)");
  return reasons;
}

// A bundler's entry point must sit at the repo root — that is where the tool
// requires it — so it is not junk. Flagged index.html on 2026-09-02 as a
// "data dump" when it is in fact a legitimate build entry point.
function isBuildEntryPoint(name) {
  if (name.toLowerCase() !== "index.html") return false;
  return ["vite.config.ts", "vite.config.js", "vite.config.mjs", "webpack.config.js"]
    .some((cfg) => fs.existsSync(path.join(REPO_ROOT, cfg)));
}

function classifyFile(name) {
  const reasons = [];
  if (isBuildEntryPoint(name)) return reasons;
  if (PUA_RANGE.test(name)) reasons.push("contains-private-use-area-char (mangled path substitution)");
  if (/[\\/]/.test(name)) reasons.push("contains embedded path separator");

  const ext = path.extname(name);
  const base = ext ? name.slice(0, -ext.length) : name;

  if (!ext) {
    if (!EXTENSIONLESS_ALLOW.has(name)) reasons.push("no file extension and not a known extensionless convention (LICENSE, Makefile, ...)");
  } else if (!ROOT_ALLOWED_EXTENSIONS.has(ext.toLowerCase())) {
    reasons.push(`extension "${ext}" is not a typical root-level project file type (data dumps/exports belong in a subdirectory)`);
  }

  if (/^[a-z0-9]{1,2}$/i.test(base)) reasons.push("generic 1-2 character name");

  for (const pattern of SUSPICIOUS_KEYWORD_PATTERNS) {
    if (pattern.test(base)) {
      reasons.push(`filename matches working-artifact keyword pattern (${pattern})`);
      break; // one hit is enough signal, avoid noisy duplicate reasons
    }
  }

  return reasons;
}

function scanRootJunk() {
  const entries = fs.readdirSync(REPO_ROOT, { withFileTypes: true });
  const items = [];

  for (const entry of entries) {
    if (ROOT_SKIP.has(entry.name)) continue;
    // Dotfiles/dot-directories are a legitimate, expected root pattern
    // (.env.example, .gitignore, .claude/, .github/, etc.) — skip them
    // from the "does this belong at root" check. They can still be flagged
    // by the structural mangled-path rules further down if genuinely weird,
    // but plain dotfile presence is never itself a signal.
    const isDotEntry = entry.name.startsWith(".");

    if (entry.isDirectory()) {
      const reasons = classifyDirectory(entry.name);
      if (reasons.length > 0) {
        items.push({ name: entry.name, type: "directory", reasons });
      }
      continue;
    }

    if (isDotEntry) continue;

    if (entry.isFile()) {
      const reasons = classifyFile(entry.name);
      if (reasons.length > 0) {
        items.push({ name: entry.name, type: "file", reasons });
      }
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return { count: items.length, items };
}

// --- Install tier --------------------------------------------------------

// Four of the five buckets below only make sense once the hosted ingestion
// pipeline exists. On a Tier 0 repo that pipeline was deliberately removed, so
// running them reports failures for automation nobody installed — and an owner
// who sees a red health scan every week stops reading it at all.
//
// Read the tier rather than inferring it from what happens to be on disk: a
// half-finished Tier 1 install has the workflow files but no working
// credentials, and should not be scanned as though it were live.
function installedTier() {
  const p = path.join(REPO_ROOT, "_system", "install.yml");
  if (!fs.existsSync(p)) return 0;
  const m = fs.readFileSync(p, "utf8").match(/^\s*tier:\s*(\d+)/m);
  return m ? Number(m[1]) : 0;
}

// --- Orchestration -----------------------------------------------------

function scan() {
  const today = new Date();
  const tier = installedTier();
  const automated = tier >= 1;

  return {
    generatedAt: today.toISOString(),
    tier,
    // Files sitting unfiled matter at every tier — at Tier 0 they just mean
    // nobody has asked their agent to ingest them yet.
    inboxStragglers: scanInboxStragglers(today),
    rootJunk: scanRootJunk(),
    // Everything below depends on the hosted pipeline. When it is not
    // installed, return the same shape the scanners do with nothing in it, so
    // the renderer needs no tier-specific branch of its own.
    staleIngestionIssues: automated
      ? scanStaleIngestionIssues(today)
      : { count: 0, thresholdDays: ISSUE_STALE_DAYS, items: [], skipped: true },
    stalePRs: automated
      ? scanStalePRs(today)
      : { count: 0, thresholdDays: PR_STALE_DAYS, items: [], skipped: true },
    strandedBranches: automated
      ? scanStrandedBranches(today)
      : { count: 0, items: [], skipped: true },
  };
}

// --- Rendering -----------------------------------------------------------

function table(rows, headers) {
  const lines = [`| ${headers.join(" | ")} |`, `|${headers.map(() => "---").join("|")}|`];
  for (const row of rows) lines.push(`| ${row.join(" | ")} |`);
  return lines.join("\n");
}

function renderIssueBody(result) {
  const { inboxStragglers, staleIngestionIssues, stalePRs, rootJunk, strandedBranches, generatedAt, tier } = result;
  const lines = [];

  lines.push(`_Generated ${generatedAt} by \`scripts/repo-health-scan.js\`._`);
  lines.push("");
  lines.push(
    tier >= 1
      ? `**Install tier: ${tier}.** All five buckets apply.`
      : "**Install tier: 0.** The hosted ingestion pipeline is not installed, so the "
        + "issue, PR, and branch buckets below are skipped rather than run against "
        + "automation that is not there. Set `tier:` in `_system/install.yml` if this is wrong."
  );
  lines.push("");
  lines.push("This is a **reporting-only** issue. Nothing was auto-processed, closed, merged, or deleted. A human decides each action.");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(table(
    [
      [`\`intake/inbox/\` stragglers (>${inboxStragglers.thresholdDays}d since first added to git)`, String(inboxStragglers.count)],
      [`Stale \`ingestion\` issues (open >${staleIngestionIssues.thresholdDays}d)`, staleIngestionIssues.error ? "error" : String(staleIngestionIssues.count)],
      [`Stale open PRs (>${stalePRs.thresholdDays}d)`, stalePRs.error ? "error" : String(stalePRs.count)],
      ["Root-level junk candidates", String(rootJunk.count)],
      ["Stranded `claude/issue-*` branches (work pushed, no PR)", strandedBranches.error ? "error" : String(strandedBranches.count)],
    ],
    ["Category", "Count"]
  ));
  lines.push("");

  // --- 1. Inbox stragglers ---
  lines.push("## 1. `intake/inbox/` stragglers");
  lines.push("");
  lines.push("Files still sitting in `intake/inbox/`. Staleness is measured from first-added-to-git date, not the leading date in the filename. Each line is checked against its `[Ingest] <filename>` issue, because two different faults look identical here: a file that never got an issue (genuinely missed — `ingest-content.yml` only processes its own push diff, so it is never retried) versus one whose ingestion finished and where only the `inbox/` → `processed/` move failed.");
  lines.push("");
  if (inboxStragglers.note) {
    lines.push(`_${inboxStragglers.note}_`);
  } else if (inboxStragglers.count === 0) {
    lines.push("None — clean.");
  } else {
    const sample = inboxStragglers.items.slice(0, SAMPLE_SIZE);
    lines.push(`<details><summary>${Math.min(SAMPLE_SIZE, inboxStragglers.count)} oldest of ${inboxStragglers.count} total — click to expand</summary>`);
    lines.push("");
    for (const item of sample) {
      const untrackedNote = item.tracked ? "" : " _(no git \"added\" history found — using filesystem date instead; may just mean it hasn't been committed/pushed yet)_";
      lines.push(`- [ ] \`intake/inbox/${item.file}\` — first added ${item.firstAdded} (${item.daysOld}d ago)${item.diagnosis ? ` — **${item.diagnosis}**${item.issueNumber ? ` (#${item.issueNumber})` : ""}` : ""}${untrackedNote}`);
    }
    lines.push("");
    lines.push("</details>");
    if (inboxStragglers.count > SAMPLE_SIZE) {
      lines.push("");
      lines.push(`_${inboxStragglers.count - SAMPLE_SIZE} more not shown here — see this run's job summary or re-run \`node scripts/repo-health-scan.js --full-report\` locally._`);
    }
  }
  lines.push("");

  // --- 2. Stale ingestion issues ---
  lines.push("## 2. Stale `ingestion` issues");
  lines.push("");
  lines.push("Open issues labeled `ingestion` where the `@claude` → PR → auto-merge chain likely broke silently (check first whether `GH_PERSONAL_TOKEN` expired — see `TROUBLESHOOTING.md`).");
  lines.push("");
  if (staleIngestionIssues.error) {
    lines.push(`_Could not fetch issues via \`gh\`: ${staleIngestionIssues.error}_`);
  } else if (staleIngestionIssues.count === 0) {
    lines.push("None — clean.");
  } else {
    const sample = staleIngestionIssues.items.slice(0, SAMPLE_SIZE);
    lines.push(`<details><summary>${Math.min(SAMPLE_SIZE, staleIngestionIssues.count)} oldest of ${staleIngestionIssues.count} total — click to expand</summary>`);
    lines.push("");
    for (const item of sample) {
      lines.push(`- [ ] #${item.number} [${item.title}](${item.url}) — open ${item.daysOld}d (created ${item.createdAt.slice(0, 10)})`);
    }
    lines.push("");
    lines.push("</details>");
  }
  lines.push("");

  // --- 3. Stale PRs ---
  lines.push("## 3. Stale open PRs");
  lines.push("");
  lines.push("Covers abandoned/competing feature branches and unmerged Dependabot PRs alike. Flagged only — nothing here is auto-closed or auto-merged.");
  lines.push("");
  if (stalePRs.error) {
    lines.push(`_Could not fetch PRs via \`gh\`: ${stalePRs.error}_`);
  } else if (stalePRs.count === 0) {
    lines.push("None — clean.");
  } else {
    const sample = stalePRs.items.slice(0, SAMPLE_SIZE);
    lines.push(`<details><summary>${Math.min(SAMPLE_SIZE, stalePRs.count)} oldest of ${stalePRs.count} total — click to expand</summary>`);
    lines.push("");
    for (const item of sample) {
      const draftTag = item.isDraft ? " (draft)" : "";
      const authorTag = item.author ? ` by @${item.author}` : "";
      lines.push(`- [ ] #${item.number} [${item.title}](${item.url})${draftTag}${authorTag} — open ${item.daysOld}d (created ${item.createdAt.slice(0, 10)})`);
    }
    lines.push("");
    lines.push("</details>");
  }
  lines.push("");

  // --- 4. Root junk ---
  lines.push("## 4. Root-level junk candidates");
  lines.push("");
  lines.push("Detected structurally (unusual name shape, unexpected extension, working-artifact keywords, mangled-path characters) — not a fixed blocklist, so this should also catch future junk with different names. False positives are possible; use judgment before deleting anything.");
  lines.push("");
  if (rootJunk.count === 0) {
    lines.push("None — clean.");
  } else {
    for (const item of rootJunk.items) {
      lines.push(`- [ ] \`${item.name}\` (${item.type}) — ${item.reasons.join("; ")}`);
    }
  }
  lines.push("");
  lines.push("## 5. Stranded `claude/issue-*` branches");
  lines.push("");
  lines.push("Branches with commits ahead of `main` and **no pull request in any state** — finished work that nothing will ever merge. Surfaces a broken auto-create-PR step within hours, instead of waiting out bucket 2's 14-day threshold.");
  lines.push("");
  if (strandedBranches.error) {
    lines.push("_Could not enumerate branches via `gh`: " + strandedBranches.error + "_");
  } else if (strandedBranches.count === 0) {
    lines.push("None — clean.");
  } else {
    for (const item of strandedBranches.items.slice(0, SAMPLE_SIZE)) {
      const issueTag = item.issueNumber ? ` (issue #${item.issueNumber})` : "";
      lines.push(`- [ ] \`${item.branch}\`${issueTag} — ${item.commitsAhead} commit(s) ahead, last ${item.lastCommit}${item.daysOld !== null ? ` (${item.daysOld}d ago)` : ""}`);
    }
    lines.push("");
    lines.push("**If several appear at once, suspect the workflow, not the runs.** Check that `.github/workflows/claude.yml` still has its auto-create-PR step — re-running the GitHub App setup overwrites that file with a stock template that has none (PR #2170).");
  }
  lines.push("");
  lines.push("---");
  lines.push("### Triage checklist for whoever works this issue");
  lines.push("- [ ] For inbox stragglers: read each line's diagnosis — \"no ingestion issue\" needs one created by hand; \"processed\" just needs the file moved to `intake/processed/`");
  lines.push("- [ ] For stale `ingestion` issues: same root-cause check; close once resolved");
  lines.push("- [ ] For stale PRs: decide merge, close, or rebase per PR — especially competing PRs for the same feature");
  lines.push("- [ ] For root junk: verify each flagged item by hand before deleting (this scan does not delete anything)");
  lines.push("- [ ] For stranded branches: open the missing PR, then check whether `claude.yml` lost its auto-create-PR step");
  lines.push("- [ ] Close this issue once all five buckets are empty (or acceptably small) for this cycle");

  return lines.join("\n");
}

function renderFullReport(result) {
  const { inboxStragglers, staleIngestionIssues, stalePRs, rootJunk, strandedBranches, generatedAt, tier } = result;
  const lines = [];
  lines.push(`# Repo Health — Full Report (${generatedAt}) — install tier ${tier}`);
  lines.push("");

  lines.push(`## Inbox stragglers (${inboxStragglers.count})`);
  lines.push("");
  for (const item of inboxStragglers.items) {
    lines.push(`- \`intake/inbox/${item.file}\` — first added ${item.firstAdded} (${item.daysOld}d ago)${item.tracked ? "" : " [untracked/fallback date]"}`);
  }
  lines.push("");

  lines.push(`## Stale ingestion issues (${staleIngestionIssues.count})`);
  lines.push("");
  if (staleIngestionIssues.error) lines.push(`Error: ${staleIngestionIssues.error}`);
  for (const item of staleIngestionIssues.items) {
    lines.push(`- #${item.number} ${item.title} — ${item.url} — ${item.daysOld}d old`);
  }
  lines.push("");

  lines.push(`## Stale PRs (${stalePRs.count})`);
  lines.push("");
  if (stalePRs.error) lines.push(`Error: ${stalePRs.error}`);
  for (const item of stalePRs.items) {
    lines.push(`- #${item.number} ${item.title} — ${item.url} — ${item.daysOld}d old${item.isDraft ? " (draft)" : ""}`);
  }
  lines.push("");

  lines.push(`## Root junk (${rootJunk.count})`);
  lines.push("");
  for (const item of rootJunk.items) {
    lines.push(`- ${item.name} (${item.type}) — ${item.reasons.join("; ")}`);
  }

  return lines.join("\n");
}

// --- CLI -----------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const result = scan();

  if (args.includes("--json")) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else if (args.includes("--full-report")) {
    process.stdout.write(renderFullReport(result) + "\n");
  } else {
    process.stdout.write(renderIssueBody(result) + "\n");
  }
}

main();
