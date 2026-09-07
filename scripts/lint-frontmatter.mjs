import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// lint-frontmatter.mjs
//
// CI gate for knowledge_base/**/*.md frontmatter drift. Fails the PR when a
// CHANGED file's YAML frontmatter doesn't match the authoritative schema in
// _system/knowledge_graph/taxonomy.yaml.
//
// This intentionally only lints files that changed in the current PR/push —
// NOT the full knowledge_base/ tree. Scoping to changed files keeps this
// workflow judging only what the PR actually touched rather than re-flagging
// any pre-existing file that predates a taxonomy change.
// The workflow that invokes
// this script (.github/workflows/lint-frontmatter.yml) is responsible for
// computing the changed-file list via `git diff` and piping it in — this
// script does not do its own repo-wide walk.
//
// Scope (v1): knowledge_base/**/*.md only — the highest-value, most-drifted
// tier per .agents/agent.md's content tiers. brand/ and library/ also
// have `domains` entries in taxonomy.yaml (domains.brand, domains.library)
// and their own frontmatter conventions (see brand/artifacts/*.md, which use
// a materially different schema: type: call, no `domain`/`related_concepts`,
// status values like "raw" instead of the emergent/validated/canonical
// lifecycle). Extending this linter to those trees is a reasonable future
// step but is out of scope here — don't assume knowledge_base's required-
// field list applies to them.
//
// Usage:
//   node scripts/lint-frontmatter.mjs [file1.md file2.md ...]
//   git diff --name-only ... | node scripts/lint-frontmatter.mjs
//
// If no CLI args are given, changed-file paths are read newline-separated
// from stdin. Paths not under knowledge_base/ or not ending in .md are
// ignored, so callers don't need to pre-filter perfectly.

const REPO_ROOT = process.cwd();
const TAXONOMY_PATH = path.join(REPO_ROOT, "_system", "knowledge_graph", "taxonomy.yaml");

// Per .agents/agent.md § Front matter:
// "Knowledge base nodes use: type, domain, status, source, tags,
// related_concepts, date."
const REQUIRED_FIELDS = ["type", "domain", "status", "source", "tags", "related_concepts", "date"];

function loadTaxonomy() {
  if (!fs.existsSync(TAXONOMY_PATH)) {
    console.error(`lint-frontmatter: taxonomy file not found at ${TAXONOMY_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(TAXONOMY_PATH, "utf8");

  // taxonomy.yaml is plain YAML (no --- frontmatter fences). Rather than add
  // a new top-level yaml/js-yaml dependency, reuse gray-matter's bundled YAML
  // parser (gray-matter is already a project dependency — see package.json)
  // by wrapping the file's contents in frontmatter fences before parsing.
  const { data } = matter(`---\n${raw}\n---\n`);
  return data;
}

function readChangedFiles() {
  const argFiles = process.argv.slice(2);
  if (argFiles.length > 0) return argFiles;

  if (process.stdin.isTTY) {
    // Interactive shell, nothing piped in, no args given — nothing to lint.
    return [];
  }

  const input = fs.readFileSync(0, "utf8");
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isLintable(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  if (!normalized.startsWith("knowledge_base/")) return false;
  if (!normalized.endsWith(".md")) return false;
  const base = path.basename(normalized);
  // Skip underscore-prefixed audit artifacts (e.g. a normalization report).
  // These aren't knowledge_base nodes and don't carry node frontmatter.
  if (base.startsWith("_")) return false;
  // Skip README.md at any depth. A directory README explains what belongs in
  // that directory — it is documentation about the nodes, not a node itself,
  // so node frontmatter would be meaningless on it. Without this the linter
  // rejects the README this repo ships with, which is a confusing first
  // impression: the tool failing on the file that explains the tool.
  if (base.toLowerCase() === "readme.md") return false;
  return true;
}

function isPresent(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
}

function lintFile(relPath) {
  const absPath = path.join(REPO_ROOT, relPath);
  if (!fs.existsSync(absPath)) {
    // File was deleted/renamed away in this diff — nothing to lint.
    return null;
  }

  const raw = fs.readFileSync(absPath, "utf8");
  const errors = [];

  let parsed;
  try {
    parsed = matter(raw);
  } catch (err) {
    return { file: relPath, errors: [`could not parse YAML frontmatter: ${err.message}`] };
  }

  const fm = parsed.data ?? {};

  if (Object.keys(fm).length === 0) {
    return {
      file: relPath,
      errors: ["missing frontmatter block entirely (no `---`-delimited YAML at top of file)"],
    };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!isPresent(fm[field])) {
      errors.push(`missing required field \`${field}\``);
    }
  }

  return { file: relPath, errors };
}

function main() {
  const taxonomy = loadTaxonomy();
  const validDomains = new Set(taxonomy.domains?.knowledge_base ?? []);
  const validStatuses = new Set(taxonomy.status_lifecycle?.blessed ?? []);

  if (validDomains.size === 0 || validStatuses.size === 0) {
    console.error(
      "lint-frontmatter: could not load domains.knowledge_base / status_lifecycle.blessed from taxonomy.yaml — aborting."
    );
    process.exit(1);
  }

  const changed = readChangedFiles();
  const files = [...new Set(changed.map((f) => f.trim()).filter(Boolean))].filter(isLintable);

  if (files.length === 0) {
    console.log("lint-frontmatter: no knowledge_base/**/*.md files changed — nothing to lint.");
    process.exit(0);
  }

  const results = [];

  for (const relPath of files) {
    const result = lintFile(relPath);
    if (!result) continue;

    const absPath = path.join(REPO_ROOT, relPath);
    const raw = fs.readFileSync(absPath, "utf8");
    const { data: fm } = matter(raw);

    // Only run the status/domain value checks if the fields are actually
    // present — a missing field is already reported above, no need to
    // double-report it as "invalid" too.
    if (isPresent(fm?.status) && !validStatuses.has(fm.status)) {
      result.errors.push(
        `invalid \`status: ${fm.status}\` — must be one of: ${[...validStatuses].join(", ")} ` +
          `(per _system/knowledge_graph/taxonomy.yaml status_lifecycle.blessed)`
      );
    }

    if (isPresent(fm?.domain) && !validDomains.has(fm.domain)) {
      result.errors.push(
        `invalid \`domain: ${fm.domain}\` — must be one of: ${[...validDomains].join(", ")} ` +
          `(per _system/knowledge_graph/taxonomy.yaml domains.knowledge_base)`
      );
    }

    if (result.errors.length > 0) {
      results.push(result);
    }
  }

  if (results.length > 0) {
    console.error(`\nFrontmatter lint failed for ${results.length} of ${files.length} changed file(s):\n`);
    for (const { file, errors } of results) {
      console.error(`- ${file}`);
      for (const e of errors) console.error(`    - ${e}`);
    }
    console.error(
      "\nFix the frontmatter and push again. Schema reference: _system/knowledge_graph/taxonomy.yaml, " +
        ".agents/skills/librarian/SKILL.md (Extraction Template)."
    );
    console.error(
      "\nNote: this only checks files changed in this PR/push. See " +
        "the taxonomy in _system/knowledge_graph/taxonomy.yaml for the allowed " +
        "normalization — pre-existing drift elsewhere in knowledge_base/ is not blocked here."
    );
    process.exit(1);
  }

  console.log(`OK: frontmatter lint passed for ${files.length} changed knowledge_base file(s).`);
}

main();
