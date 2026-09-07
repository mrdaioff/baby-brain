import fs from "node:fs";
import path from "node:path";

// rollup-open-items.mjs
//
// Every project tracks its own commitments in projects/<slug>/open-items.md
// (see .agents/skills/project-creation/SKILL.md). That keeps each item next to
// its project, but leaves no single place to answer "what do I owe anyone right
// now" across all of them. This script generates that view.
//
// Reads every projects/*/open-items.md, drops anything already done, and writes
// projects/OPEN-ITEMS.md as one table sorted by due date.
//
// Usage:
//   node scripts/rollup-open-items.mjs           # regenerate projects/OPEN-ITEMS.md
//   node scripts/rollup-open-items.mjs --check   # exit 1 on drift, no writes
//
// Deliberately no CI gate wired to --check: unlike the .claude/skills mirror, a
// stale rollup is regenerable in one command and nothing downstream reads it.

const REPO_ROOT = process.cwd();
const PROJECTS_DIR = path.join(REPO_ROOT, "projects");
const OUTPUT_FILE = path.join(PROJECTS_DIR, "OPEN-ITEMS.md");
const CHECK_ONLY = process.argv.includes("--check");

const DONE_MARKERS = ["✅", ":white_check_mark:"];

// Sort buckets: overdue first, then real dates ascending, then undated last.
const OVERDUE_RANK = -1;
const UNDATED_RANK = Number.MAX_SAFE_INTEGER;

function splitRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return null;
  return trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparatorRow(cells) {
  return cells.every((cell) => /^:?-{2,}:?$/.test(cell));
}

// Due values in the wild: "2026-08-28", "**2026-08-28**", "2026-11", "Oct 2026",
// "overdue", "—". Anything we can't parse sorts to the bottom rather than
// guessing a date that isn't there.
function dueRank(due) {
  const raw = due.replace(/\*/g, "").trim().toLowerCase();
  if (!raw || raw === "—" || raw === "-" || raw === "none stated") return UNDATED_RANK;
  if (raw.includes("overdue")) return OVERDUE_RANK;

  const iso = raw.match(/(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (iso) {
    const [, y, m, d] = iso;
    return Date.UTC(Number(y), Number(m) - 1, Number(d) ? Number(d) : 1);
  }

  const monthYear = raw.match(
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/,
  );
  if (monthYear) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    return Date.UTC(Number(monthYear[2]), months.indexOf(monthYear[1]), 1);
  }

  return UNDATED_RANK;
}

// Parses the "## Open Items" table. Stops at a "## Closed" heading so archived
// rows don't resurface in the rollup.
function parseOpenItems(markdown, project) {
  const lines = markdown.split(/\r?\n/);
  const items = [];
  let header = null;

  for (const line of lines) {
    if (/^##\s+Closed\b/i.test(line)) break;

    const cells = splitRow(line);
    if (!cells) {
      // A blank line or prose ends the current table; the next one re-detects.
      if (line.trim() === "") header = null;
      continue;
    }
    if (isSeparatorRow(cells)) continue;

    if (!header) {
      header = cells.map((c) => c.toLowerCase());
      continue;
    }

    const get = (name) => {
      const idx = header.indexOf(name);
      return idx === -1 ? "" : (cells[idx] ?? "");
    };

    const status = get("status");
    if (DONE_MARKERS.some((marker) => status.includes(marker))) continue;

    const item = get("item");
    if (!item) continue;

    items.push({
      project,
      logged: get("logged"),
      owner: get("owner"),
      item,
      due: get("due"),
      status,
    });
  }

  return items;
}

function collect() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  const all = [];

  for (const entry of fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(PROJECTS_DIR, entry.name, "open-items.md");
    if (!fs.existsSync(file)) continue;
    all.push(...parseOpenItems(fs.readFileSync(file, "utf8"), entry.name));
  }

  return all.sort((a, b) => {
    const diff = dueRank(a.due) - dueRank(b.due);
    if (diff !== 0) return diff;
    return a.project.localeCompare(b.project);
  });
}

function render(items) {
  // Local date, not toISOString() — UTC rolls over a day early for anyone east of it
  // and the banner then reads as stale on the day it was generated.
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const lines = [
    "# Open Items — All Projects",
    "",
    "<!-- GENERATED FILE — do not edit by hand. -->",
    "<!-- Run `node scripts/rollup-open-items.mjs` to regenerate. -->",
    "<!-- Edit the source row in projects/<slug>/open-items.md instead. -->",
    "",
    `Every open commitment across all projects, newest deadline first. Regenerated ${today}.`,
    "",
    "**Status:** 🔴 open / not started · 🟡 in progress · ⚪ waiting on someone else, no action",
    "needed from us right now · 👤 human-only. Completed items stay in their project file.",
    "",
  ];

  if (items.length === 0) {
    lines.push("_No open items._", "");
    return lines.join("\n");
  }

  lines.push(
    "| Due | Project | Owner | Item | Logged | Status |",
    "|---|---|---|---|---|---|",
  );

  for (const it of items) {
    const due = it.due && it.due !== "—" ? it.due : "—";
    lines.push(
      `| ${due} | [${it.project}](${it.project}/open-items.md) | ${it.owner} | ${it.item} | ${it.logged} | ${it.status} |`,
    );
  }

  lines.push("");
  return lines.join("\n");
}

const items = collect();
const output = render(items);

if (CHECK_ONLY) {
  const current = fs.existsSync(OUTPUT_FILE) ? fs.readFileSync(OUTPUT_FILE, "utf8") : "";
  // Normalise two things that differ without the content differing: the
  // regenerated-on line changes daily, and git's autocrlf hands back CRLF in the
  // working tree on Windows while this script always writes LF.
  const strip = (s) =>
    s.replace(/\r\n/g, "\n").replace(/Regenerated \d{4}-\d{2}-\d{2}\./, "Regenerated <date>.");
  if (strip(current) !== strip(output)) {
    console.error("projects/OPEN-ITEMS.md is out of date. Run: node scripts/rollup-open-items.mjs");
    process.exit(1);
  }
  console.log(`projects/OPEN-ITEMS.md is up to date (${items.length} open item(s)).`);
} else {
  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`Wrote projects/OPEN-ITEMS.md — ${items.length} open item(s) across all projects.`);
}
