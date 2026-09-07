# intake/

The drop point. Everything entering this repo passes through here.

```
intake/
  inbox/      Drop files here. Naming: YYYY-MM-DD_[Title].[ext]
  processed/  Where they move once filed
              (If you build the capture extension, add a staging/ here for
              automated sources to land in before promotion — see
              docs/automated-capture.md.)
```

## Tier 0

Put a file in `inbox/` and ask your agent to ingest it. It follows the
`librarian` skill: routes to `brand/` or `library/`, writes front matter,
extracts concepts, and moves the file to `processed/`.

## Tier 1

Put a file in `inbox/`, commit, push. The rest happens without you.

If files are sitting in `inbox/` and nothing is happening, go to
`TROUBLESHOOTING.md`. It is almost always an expired credential, and four
distinct faults produce that one symptom.
