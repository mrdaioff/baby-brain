import fs from "node:fs";
import path from "node:path";

// sync-agent-skills.mjs
//
// .agents/skills/<name>/SKILL.md is the single canonical copy of every skill
// (see .agents/agent.md). Claude Code only discovers skills under
// .claude/skills/, so this script generates a read-only mirror there —
// nothing under .claude/skills/ should ever be hand-edited.
//
// Usage:
//   node scripts/sync-agent-skills.mjs           # regenerate .claude/skills/
//   node scripts/sync-agent-skills.mjs --check   # CI gate: exit 1 on drift, no writes
//
// Mirrors the file-per-skill layout exactly (just SKILL.md today, but copies
// whatever files exist so a future skill with supporting assets still works).

const REPO_ROOT = process.cwd();
const SOURCE_DIR = path.join(REPO_ROOT, ".agents", "skills");
const TARGET_DIR = path.join(REPO_ROOT, ".claude", "skills");
const CHECK_ONLY = process.argv.includes("--check");

function listFilesRecursive(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`Canonical skills directory not found: ${SOURCE_DIR}`);
  process.exit(1);
}

const sourceFiles = listFilesRecursive(SOURCE_DIR);
const drifted = [];
const missing = [];

for (const sourceFile of sourceFiles) {
  const rel = path.relative(SOURCE_DIR, sourceFile);
  const targetFile = path.join(TARGET_DIR, rel);
  const content = fs.readFileSync(sourceFile);

  if (!fs.existsSync(targetFile)) {
    missing.push(rel);
    if (!CHECK_ONLY) {
      fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      fs.writeFileSync(targetFile, content);
    }
    continue;
  }

  const existing = fs.readFileSync(targetFile);
  if (!existing.equals(content)) {
    drifted.push(rel);
    if (!CHECK_ONLY) {
      fs.writeFileSync(targetFile, content);
    }
  }
}

// Flag stray files under .claude/skills/ that no longer have a canonical
// source (e.g. a skill renamed or removed in .agents/skills/).
const orphaned = [];
if (fs.existsSync(TARGET_DIR)) {
  for (const targetFile of listFilesRecursive(TARGET_DIR)) {
    const rel = path.relative(TARGET_DIR, targetFile);
    if (rel === "README.md") continue; // the generated-mirror marker file
    if (!fs.existsSync(path.join(SOURCE_DIR, rel))) {
      orphaned.push(rel);
    }
  }
}

if (CHECK_ONLY) {
  if (drifted.length || missing.length || orphaned.length) {
    if (drifted.length) {
      console.error("Drifted (edited directly in .claude/skills/ instead of .agents/skills/):");
      drifted.forEach((f) => console.error(`  ${f}`));
    }
    if (missing.length) {
      console.error("Missing from .claude/skills/ (needs regenerating):");
      missing.forEach((f) => console.error(`  ${f}`));
    }
    if (orphaned.length) {
      console.error("Orphaned in .claude/skills/ (no canonical source in .agents/skills/):");
      orphaned.forEach((f) => console.error(`  ${f}`));
    }
    console.error("\nRun `node scripts/sync-agent-skills.mjs` to regenerate, or delete orphans by hand.");
    process.exit(1);
  }
  console.log(`.claude/skills/ is in sync with .agents/skills/ (${sourceFiles.length} files).`);
} else {
  console.log(`Synced ${sourceFiles.length} file(s) from .agents/skills/ to .claude/skills/.`);
  if (orphaned.length) {
    console.warn("Orphaned files in .claude/skills/ with no canonical source (not deleted automatically):");
    orphaned.forEach((f) => console.warn(`  ${f}`));
  }
}
