import fs from "node:fs";
import path from "node:path";

// sync-agent-entrypoints.mjs
//
// .agents/agent.md is the single canonical source of repository-wide rules
// (see .agents/README.md). Every AI coding CLI looks for its own hardcoded
// instruction filename at the repo root, so this script generates one loader
// per known CLI from that single source.
//
// Two loader shapes:
//   "inline" — the full text of .agents/agent.md is copied into the file.
//              Used for every CLI that has no include mechanism. A pointer is
//              NOT good enough: the CLI reads its own file automatically but
//              only follows a pointer if it decides to, so a session can start
//              with none of the repo's rules loaded.
//   "import" — a one-line reference the CLI resolves itself at session start.
//              Only Claude Code supports this (@-import), so only it avoids
//              carrying a duplicate copy in the repo.
//
// Usage:
//   node scripts/sync-agent-entrypoints.mjs           # regenerate all loaders
//   node scripts/sync-agent-entrypoints.mjs --check   # CI gate: exit 1 on drift
//
// To support a new CLI: add a row to TARGETS below and re-run. Nothing else.

const REPO_ROOT = process.cwd();
const SOURCE_FILE = path.join(REPO_ROOT, ".agents", "agent.md");
const SOURCE_REL = ".agents/agent.md";
const CHECK_ONLY = process.argv.includes("--check");

const TARGETS = [
  {
    file: "AGENTS.md",
    mode: "inline",
    readBy:
      "Codex, Cursor, Amp, Command Code, Zed, Jules, Aider, and any other CLI that reads `AGENTS.md`",
  },
  {
    file: "GEMINI.md",
    mode: "inline",
    readBy: "Gemini CLI",
  },
  {
    file: path.join(".github", "copilot-instructions.md"),
    mode: "inline",
    readBy: "GitHub Copilot (VS Code, JetBrains, and copilot.com)",
  },
  {
    file: "CLAUDE.md",
    mode: "import",
    readBy: "Claude Code",
  },
];

// core.autocrlf=true on Windows checks these files out with CRLF, while the
// banner below is assembled in JS with \n. Comparing raw bytes would then
// report permanent false drift locally while passing in CI (Linux, LF only) —
// a gate that cries wolf is worse than no gate. Normalize both sides.
// .gitattributes also pins these paths to eol=lf so the working tree stays put.
const toLf = (s) => s.replace(/\r\n/g, "\n");

// The CI gate only exists at Tier 1. Naming it unconditionally left
// every generated file pointing at a deleted path on a Tier 0 install.
const CI_GATE_REL = ".github/workflows/check-agent-sync.yml";
const ciGateExists = () => fs.existsSync(path.join(REPO_ROOT, CI_GATE_REL));

function render(target, sourceText) {
  const banner = [
    "<!--",
    "  GENERATED FILE — DO NOT EDIT.",
    `  Source of truth: ${SOURCE_REL}`,
    "  Regenerate:      npm run sync:agents",
    ...(ciGateExists() ? [`  CI gate:         ${CI_GATE_REL}`] : []),
    "-->",
    "",
    `> **Read by:** ${target.readBy}.`,
    `> The repository's rules live in \`${SOURCE_REL}\` — the single canonical source shared by every AI coding CLI.`,
    `> Edit that file and run \`npm run sync:agents\`. Never edit this file directly; changes here are overwritten and fail CI.`,
    "",
  ].join("\n");

  if (target.mode === "import") {
    // Claude Code resolves @-imports at session start, so it gets the full
    // text without the repo carrying a second copy.
    return `${banner}\n@${SOURCE_REL}\n`;
  }

  return `${banner}\n---\n\n${sourceText}`;
}

if (!fs.existsSync(SOURCE_FILE)) {
  console.error(`Canonical instructions file not found: ${SOURCE_FILE}`);
  process.exit(1);
}

const sourceText = toLf(fs.readFileSync(SOURCE_FILE, "utf8"));
const drifted = [];
const missing = [];

for (const target of TARGETS) {
  const targetPath = path.join(REPO_ROOT, target.file);
  const expected = render(target, sourceText);
  const rel = target.file.split(path.sep).join("/");

  if (!fs.existsSync(targetPath)) {
    missing.push(rel);
    if (!CHECK_ONLY) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, expected, "utf8");
    }
    continue;
  }

  if (toLf(fs.readFileSync(targetPath, "utf8")) !== expected) {
    drifted.push(rel);
    if (!CHECK_ONLY) {
      fs.writeFileSync(targetPath, expected, "utf8");
    }
  }
}

if (CHECK_ONLY) {
  if (drifted.length || missing.length) {
    if (drifted.length) {
      console.error(`Drifted (edited directly instead of ${SOURCE_REL}):`);
      drifted.forEach((f) => console.error(`  ${f}`));
    }
    if (missing.length) {
      console.error("Missing (needs regenerating):");
      missing.forEach((f) => console.error(`  ${f}`));
    }
    console.error("\nRun `npm run sync:agents` to regenerate.");
    process.exit(1);
  }
  console.log(
    `All ${TARGETS.length} agent entrypoints are in sync with ${SOURCE_REL}.`
  );
} else {
  console.log(
    `Synced ${TARGETS.length} agent entrypoint(s) from ${SOURCE_REL}: ${TARGETS.map(
      (t) => t.file.split(path.sep).join("/")
    ).join(", ")}.`
  );
}
