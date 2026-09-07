#!/usr/bin/env bash
# project-router.sh — Pre-filter an artifact against the project registry
# and create a GitHub issue for @claude to route it.
#
# Usage: bash scripts/project-router.sh <artifact_path>
# Expects: GH_TOKEN, GH_REPO environment variables

set -euo pipefail

ARTIFACT_PATH="$1"
REGISTRY_PATH="projects/registry.yml"

if [ ! -f "$ARTIFACT_PATH" ]; then
  echo "ERROR: Artifact not found: $ARTIFACT_PATH"
  exit 1
fi

if [ ! -f "$REGISTRY_PATH" ]; then
  echo "ERROR: Registry not found: $REGISTRY_PATH"
  exit 1
fi

# ── Step 1: Parse artifact frontmatter ──────────────────────────────────────

IFS=$'\t' read -r TITLE DATE PARTICIPANTS TAGS TRANSCRIPT_LINK < <(python3 - "$ARTIFACT_PATH" <<'PYEOF'
import sys, re

# Force UTF-8 stdout — on Windows, Python's default stdout encoding when not
# attached to a UTF-8-aware terminal is cp1252, which mangles any non-ASCII
# byte (em-dashes, accented names, curly quotes — common in titles and tags)
# into a single wrong byte. That single byte then desyncs bash's tab-
# delimited `read` on the other end, silently shifting every field after it
# by one position (Participants ends up holding the Tags content, Tags and
# Transcript Link come out empty) — this is why routing silently failed for
# every artifact with a non-ASCII title. See history around 2026-07-18 for
# the reproduction.
sys.stdout.reconfigure(encoding="utf-8")

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Extract YAML frontmatter between --- markers
m = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
if not m:
    print("" * 5)
    sys.exit(0)

import yaml
fm = yaml.safe_load(m.group(1))

title = fm.get("title", "")
date = fm.get("date", "")
# brand/artifacts/'s documented convention is `participants:` (Format A),
# but ~15 files — mostly external-content holdovers — use `contributors:`
# instead (the library/[type]/ convention). Fall back to it so those aren't
# silently skipped with "No participants found".
participants = fm.get("participants") or fm.get("contributors", [])
tags = fm.get("tags", [])
transcript_link = fm.get("transcript_link", "")

# Clean obsidian-style links from transcript_link: [[path]] -> path
if transcript_link:
    transcript_link = re.sub(r'^\[\[|\]\]$', '', transcript_link.strip())

# Output tab-separated so bash can read it
print("\t".join([
    str(title),
    str(date),
    "|".join(str(p) for p in participants) if participants else "",
    "|".join(str(t) for t in tags) if tags else "",
    str(transcript_link),
]))
PYEOF
)

if [ -z "$PARTICIPANTS" ]; then
  echo "WARNING: No participants found in $ARTIFACT_PATH. Skipping."
  exit 0
fi

echo "  Title: $TITLE"
echo "  Date: $DATE"
echo "  Participants: $PARTICIPANTS"
echo "  Tags: $TAGS"

# ── Step 2: Load registry and pre-filter ────────────────────────────────────

CANDIDATES=$(python3 - "$REGISTRY_PATH" "$PARTICIPANTS" "$TAGS" <<'PYEOF'
import sys, yaml

sys.stdout.reconfigure(encoding="utf-8")  # see note in the frontmatter-parsing step above

registry_path = sys.argv[1]
participants_str = sys.argv[2]
tags_str = sys.argv[3]

with open(registry_path, "r", encoding="utf-8") as f:
    registry = yaml.safe_load(f)

artifact_participants = [p.strip().lower() for p in participants_str.split("|") if p.strip()]
artifact_tags = [t.strip().lower() for t in tags_str.split("|") if t.strip()]

candidates = []

for slug, project in registry.items():
    if project.get("status") != "active":
        continue

    proj_participants = [str(p).lower() for p in project.get("participants", [])]
    proj_keywords = [str(k).lower() for k in project.get("keywords", [])]
    proj_name = project.get("name", "")
    proj_participants_display = ", ".join(project.get("participants", []))

    matched = False

    # Check participant overlap (substring match)
    for ap in artifact_participants:
        for pp in proj_participants:
            if ap in pp or pp in ap:
                matched = True
                break
        if matched:
            break

    # Check tag/keyword overlap
    if not matched:
        for at in artifact_tags:
            if at in proj_keywords:
                matched = True
                break

    if matched:
        candidates.append(f"{slug}\t{proj_name}\t{proj_participants_display}")

for c in candidates:
    print(c)
PYEOF
)

if [ -z "$CANDIDATES" ]; then
  FILENAME=$(basename "$ARTIFACT_PATH")
  echo "No project overlap for $FILENAME. Skipping."
  exit 0
fi

echo "  Candidate projects:"
echo "$CANDIDATES" | while IFS=$'\t' read -r slug name ppl; do
  echo "    - $slug ($name)"
done

# ── Step 3: Check for duplicate issues ──────────────────────────────────────

FILENAME=$(basename "$ARTIFACT_PATH")

existing_issue=$(gh issue list \
  --repo "$GH_REPO" \
  --search "\"[Project Router]\" \"$FILENAME\" in:title" \
  --state all \
  --limit 1 \
  --json number \
  --jq '.[0].number' 2>/dev/null || echo "")

if [ -n "$existing_issue" ] && [ "$existing_issue" != "null" ]; then
  echo "Issue already exists for $FILENAME (Issue #$existing_issue). Skipping."
  exit 0
fi

# ── Step 4: Create GitHub issue ─────────────────────────────────────────────

# Ensure the label exists
gh label create project-routing \
  --repo "$GH_REPO" \
  --color 7057ff \
  --description "Project router classification" 2>/dev/null || true

# Build candidate list for issue body
CANDIDATE_LINES=""
while IFS=$'\t' read -r slug name ppl; do
  CANDIDATE_LINES="${CANDIDATE_LINES}- **${slug}** — ${name} (participants: ${ppl})
"
done <<< "$CANDIDATES"

# Resolve transcript path (strip obsidian link syntax if present)
TRANSCRIPT_PATH="$TRANSCRIPT_LINK"
if [ -n "$TRANSCRIPT_PATH" ]; then
  # Add .md extension if not present
  [[ "$TRANSCRIPT_PATH" != *.md ]] && TRANSCRIPT_PATH="${TRANSCRIPT_PATH}.md"
fi

# Build issue body
ISSUE_BODY=$(cat <<EOF
@claude Please route this artifact to the correct project.

## Artifact
- **File:** \`${ARTIFACT_PATH}\`
- **Title:** ${TITLE}
- **Date:** ${DATE}
- **Participants:** ${PARTICIPANTS}

## Candidate Projects
${CANDIDATE_LINES}
## Instructions
1. Read the full artifact at \`${ARTIFACT_PATH}\`
2. Read \`projects/registry.yml\` for project context
3. Determine if this call is **primarily about** one of the candidate projects listed above
4. **If no clear match:** Comment "No project match — closing" and close this issue
5. **If genuinely a new project:** Comment with a suggestion for a new project name, but do NOT create it. Leave the issue open for human review.
6. **If yes (clear match):** Make the following changes and open a single PR:

   **a) Append to \`projects/{slug}/calls.md\`:**
   \`\`\`
   | ${DATE} | ${TITLE} | [artifact](../../${ARTIFACT_PATH}) | [transcript](../../${TRANSCRIPT_PATH}) |
   \`\`\`

   **b) Update \`projects/{slug}/context.md\`:**
   - Read the existing context.md
   - Rewrite the **Current State** section to reflect any meaningful changes surfaced in this call
   - Append to **Notes & Nodes** (only if the call contains project-relevant insights, decisions, or updates — skip if the call is purely operational with nothing new):
     \`- **${DATE}** — [1-2 sentence summary of the key insight or update]\`
   - If a clear new decision was made, append to **Key Decisions**:
     \`- **${DATE}** — [decision]\`
   - If a new open question surfaced, add it to **Open Questions**
   - Do NOT rewrite Key Decisions, Open Questions, or Notes & Nodes history — only append

   **c) Append to \`projects/{slug}/open-items.md\`:**
   - Read the artifact's "Commitments & Open Items" section. If the artifact has no such
     section, or it is empty, skip this step entirely — do not invent items.
   - Append one row per commitment to the Open Items table, preserving the owner exactly as
     the artifact recorded it (including commitments owned by people other than the owner).
   - Logged = the call date. Status = 🔴 for anything not yet started, or ⚪ if the
     item is explicitly blocked on someone outside our control with no action needed
     from us.
   - Do NOT mark anything ✅, and do NOT edit or close existing rows. Only a human or a
     session that actually did the work closes an item.
   - If \`projects/{slug}/open-items.md\` does not exist, create it with this header:
     \`\`\`
     ---
     project: {slug}
     type: open-items
     updated: ${DATE}
     ---

     # {Project Name} — Open Items

     **Status:** 🔴 open / not started · 🟡 in progress · ✅ done · ⚪ waiting on
     someone else, no action needed from us right now · 👤 human-only

     ## Open Items

     | # | Logged | Owner | Item | Due | Status |
     |---|---|---|---|---|---|
     \`\`\`
   - Set the file's \`updated:\` frontmatter to ${DATE}.

   **d) Regenerate the cross-project rollup:**
   - If you appended anything in step (c), run \`node scripts/rollup-open-items.mjs\` and
     include the regenerated \`projects/OPEN-ITEMS.md\` in the same PR.

   **PR title:** \`router: link ${FILENAME} to {slug}\`
   **PR body:** \`Fixes #{this_issue_number}\`

**IMPORTANT:** Do NOT modify the artifact itself. Only update \`projects/{slug}/calls.md\`, \`projects/{slug}/context.md\`, \`projects/{slug}/open-items.md\` and \`projects/OPEN-ITEMS.md\`.
EOF
)

ISSUE_TITLE="[Project Router] Route: ${FILENAME}"

issue_url=$(gh issue create \
  --repo "$GH_REPO" \
  --title "$ISSUE_TITLE" \
  --body "$ISSUE_BODY" \
  --label "project-routing")

echo "Created routing issue: $issue_url"
