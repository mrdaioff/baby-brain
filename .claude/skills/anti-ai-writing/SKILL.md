---
name: anti-ai-writing
description: Always apply this skill when writing, drafting, or generating any text content — blog posts, LinkedIn posts, emails, documentation, anything meant to sound human. Hard constraint on all writing output covering banned vocabulary, structural tells (rule of three, elegant variation, "-ing" fake-analysis phrases), grammar tells (copula avoidance, em dash overuse, vague attributions), and formatting tells that mark text as AI-generated. Run the self-check in this skill before finalizing any piece of writing.
---

# Anti-AI Writing Protocol

Source: Wikipedia's "Signs of AI writing" plus its Hacker News discussion thread (news.ycombinator.com/item?id=44700558). Refresh monthly.

Every piece of writing you produce must pass through this filter. These are patterns that mark text as AI-generated. Violating them makes the output sound fake, regardless of how good the ideas are.

## 0. ORWELL'S SIX RULES

From George Orwell, "Politics and the English Language" (1946). These are the governing principles behind everything below — when a rule elsewhere in this doc and an Orwell rule conflict, Orwell wins.

1. Never use a metaphor, simile, or other figure of speech which you are used to seeing in print.
2. Never use a long word where a short one will do.
3. If it is possible to cut a word out, always cut it out.
4. Never use the passive where you can use the active.
5. Never use a foreign phrase, a scientific word, or a jargon word if you can think of an everyday English equivalent.
6. Break any of these rules sooner than say anything outright barbarous.

Rule 6 is not a loophole — it means these are judgment calls, not mechanical filters. A vivid, non-clichéd metaphor is fine; a stale one ("game-changer," "at the end of the day") isn't. A jargon word the audience actually uses (ICP, CRM) is fine; one used to sound smart isn't.

This matters because the banned-list approach has a real failure mode: phrases like "on the other hand" or "not only X but Y" are also just how humans write, so a purely mechanical ban produces stilted prose without actually proving anything (this is the core objection raised against Wikipedia's own guide by its editors — treat the lists below as signal to weigh, not a keyword filter to run blind).

## 1. BANNED VOCABULARY

Never use these words/phrases in generated content. They are statistically overrepresented in LLM output and immediately flag text as AI-written.

**Hard-banned words:**
- delve, landscape (abstract), tapestry (abstract), testament, interplay
- intricate/intricacies, meticulous/meticulously, pivotal, vibrant
- garner, bolstered, underscore (verb), showcase (verb)
- foster/fostering, enhance/enhancing, emphasize/emphasizing
- highlight (verb, when used as superficial analysis), enduring
- crucial, valuable, nestled, groundbreaking, renowned
- align with, resonate with, boasts (meaning "has")
- causal, empirical, correlate (when used as vague analytical dressing rather than precise technical terms — a Grok-specific tell, but the instinct generalizes)
- leverage (verb), streamline, paradigm shift, transformative
- deep dive, robust
- key (as a bare adjective: "key insight," "key differentiator," "key takeaway")

**Hard-banned phrases:**
- "stands as / serves as" (when "is" works)
- "is a testament to / is a reminder of"
- "a vital/significant/crucial/pivotal/key role/moment"
- "underscores/highlights its importance/significance"
- "reflects broader" / "symbolizing its ongoing/enduring/lasting"
- "contributing to the" / "setting the stage for"
- "marking/shaping the" / "represents/marks a shift"
- "key turning point" / "evolving landscape" / "focal point"
- "indelible mark" / "deeply rooted"
- "diverse array" / "rich cultural heritage" / "in the heart of"
- "commitment to" (when vague) / "natural beauty"
- "exemplifies" / "showcasing" / "featuring" (as filler)
- "valuable insights" / "ensuring" / "encompassing"
- "cultivating" / "a diverse range of experiences"

**Narrative/mood vocabulary (story-format posts, anecdotes):**
- fate, static, glitch, flicker (and fade), echoes
- vague evocative words reached for to manufacture atmosphere instead of describing what actually happened

**Canned notability puffery (never include):**
- "profiled in" / "written by a leading expert" / "independent coverage"
- "maintains an active/strong social media presence" / "maintains a strong digital presence"
- "featured in [Outlet], [Outlet], and other media" (name-dropping outlets as a substitute for saying something)

**Collaborative residue (never include):**
- "I hope this helps" / "Of course!" / "Certainly!" / "You're absolutely right!"
- "Would you like..." / "Let me know" / "Here is a" / "Is there anything else" / "More detailed breakdown"

## 2. STRUCTURAL TELLS TO AVOID

### Superficial analysis via participle phrases
Never attach "-ing" phrases to sentences as fake depth.
- BAD: "The company expanded to three cities, **highlighting its growing influence.**"
- GOOD: "The company expanded to three cities."

### "Despite challenges" formula
Never use the pattern: "Despite its [positive words], [subject] faces challenges..." followed by vague optimism.

### "Not X, it's Y" parallelisms
Avoid formulaic negation-then-assertion, with or without "just." Covers "It's not just X, it's Y," the shorter "X isn't Y. It's Z," and negative-listing chains ("Not a X. Not a Y. A Z.").
- BAD: "It's not just a tool — it's a movement."
- BAD: "The part that matters isn't any single platform. It's the seam between two of them."
- BAD: "Not a feature. Not a fix. A rebuild."
- GOOD: State the claim directly, or use a fragment pair instead: "Not any single platform. The seam between two of them."

### The fake-secret reveal
Never frame a point as a hidden truth "nobody talks about" or "no one tells you." It's a manufactured setup for an unremarkable point.
- BAD: "Here's the trap nobody talks about:"
- BAD: "Here's what no one tells you about X."
- BAD: "What most people get wrong about X..." / "What if I told you X?"
- GOOD: Just state the point. Let it be interesting on its own, or cut it.

### Sweeping-scope openers ("everyone," "nobody," "most X")
Don't open a sentence (especially the hook) with an unattributed absolute-scope claim — "Everyone obsesses over X," "Nobody checks Y," "Most teams do Z." It's a manufactured authority move standing in for evidence you don't have. Caught repeatedly across a batch of posts, and flagged by the author as an obvious tell ("the everyone... or nobody..., or starting sentences with most... are ai-isms").
- BAD: "Everyone obsesses over token count." / "Nobody's checking systematically." / "Most teams catch this manually."
- GOOD: Ground it in your own experience or a specific number instead: "I used to evaluate every project by asking X." / "This gets caught manually right now." / A concrete stat if you have one.
- This is stricter than the "Overgeneralization" rule below — it applies even when the underlying claim is true (most teams probably DO do it manually); the tell is the sentence shape, not the accuracy.

### Colon reveals for drama
Don't use a colon to stage a dramatic one-line payoff.
- BAD: "The best part: it learns."
- GOOD: "It learns, and that's the best part." Or just cut the setup.

### Kicker lines
Don't close a point with a short, fake-profound fragment for effect.
- BAD: "That's it. That's the whole thing."
- GOOD: End on the actual point, not a manufactured beat.

### Summary-recap endings
Don't close a piece by restating what it already said. End on a concrete point, takeaway, or next action instead.

### Unnecessary signposting
Don't announce that you're about to say something instead of just saying it.
- BAD: "It's important to note that the deadline moved."
- BAD: "It's worth noting that this only applies to new accounts."
- GOOD: "The deadline moved." / "This only applies to new accounts."

### Rule of three
Don't default to triple-adjective or triple-phrase structures.
- BAD: "global SEO professionals, marketing experts, and growth hackers"
- Use two items, or four, or just one. Break the AI cadence.

### Elegant variation
Don't avoid repeating a word by cycling through synonyms. If the word is "pipeline," say "pipeline" again — don't switch to "data conduit," "processing channel," "information pathway."

Wikipedia moved this to "historical indicators" in its 2026-09 revision: it came from repetition penalties in older models and shows up much less in current output. Keep following the rule (synonym-cycling is bad writing regardless), but don't treat its presence as proof a draft was AI-generated, or its absence as proof it wasn't.

### Inline-header bullet lists
Don't use "**Bold header:** description" bullet lists as default structure. Use prose.

### Outline-like structure
Don't create "Challenges and Legacy" or "Future Outlook" sections. Don't end pieces with speculation about "potential developments."

More generally, "X and Y" headers are an AI tell on their own — "Awards and recognition," "Impact and legacy," "Challenges and opportunities." They exist because the model wanted a section there, not because the content divides that way. Name the section after what's actually in it, or drop the header.

## 3. GRAMMAR AND STYLE TELLS

### Copula avoidance
Don't replace "is" and "are" with "serves as," "stands as," "marks," "represents," "features," "offers," "boasts," "functions as," "operates as," "maintains," "refers to." If something IS something, say "is."
- BAD: "Gallery 825 **serves as** LAAA's exhibition space"
- GOOD: "Gallery 825 **is** LAAA's exhibition space"

### Em dash overuse
Default to zero em dashes. Treat that as the standing bar, not just the old "usually zero, longer pieces get one or two" guidance. Rewrite with a period, a comma, or a colon instead; almost every em dash in a draft can be replaced by one of those without losing anything. Only reach for one if a comma, period, and colon all genuinely fail, and even then default to a period first. A specific tell on top of frequency: AI output tends to pad em dashes with spaces on both sides ("word — word"), against normal typographic convention (closed-up "word—word"). Don't space them either way — better to just not reach for the em dash.

### Sentence-initial "Additionally"
Never start a sentence with "Additionally." More broadly, don't lean on transition words (Additionally, Furthermore, Moreover, In conclusion) to fake logical connective tissue between sentences that don't actually need one. Use "Also," cut the transition entirely, or restructure.

Wikipedia now lists transition words *in isolation* under "ineffective indicators" — humans use them, and most style guides accept them. So this is a rule about your own output, not a detector: don't strip every "however" out of someone else's writing to make it look human.

### Vague connection or association
State the relationship. Don't gesture at one with "associated with," "connected to/with," or "in connection with" when you know what the actual link is.
- BAD: "He was associated with leadership at ExampleCorp." / "Her work has been connected with the pricing rebuild."
- GOOD: "He was ExampleCorp's CEO in 2017." / "She rebuilt the pricing model."
- If you genuinely don't know the relationship, say so or cut the sentence. The vague version reads like you're hiding that you don't know.

### Vague attributions
Never write "experts argue," "researchers note," "industry reports suggest," "observers have cited" without naming specific people or sources.
- BAD: "Industry experts suggest this approach works."
- GOOD: Name the expert or drop the claim.

### Overgeneralization
Don't present one source's opinion as a widely-held view. Don't use "several" when you mean "two."

## 4. CONTENT TELLS

### Undue emphasis on significance
Don't constantly remind the reader that something is important, significant, or transformative. If the content is strong, importance is self-evident.

### Promotional / puffery tone
Don't drift into press-release language. No "commitment to excellence," no "dedication to craftsmanship," no "enhancing the experience."

### Ingratiating fake-corporate warmth
Don't be relentlessly, uniformly friendly regardless of context — the tone that reads like it went through three rounds of HR approval before hitting send. Real writing has register: it can be flat, blunt, annoyed, dry. Constant warmth with no variation is a tell on its own, independent of word choice.

### Hedging then asserting
Don't hedge that something is minor and then spend a paragraph on its importance anyway.

### Knowledge-cutoff disclaimers
Never write "While specific details are limited...", "based on available information", "up to my last training update", "as of my last knowledge update", "not widely available/documented/disclosed", or "in the provided sources / search results." Either you have the information or you don't.

## 5. FORMATTING TELLS

### Title case in headings
Use sentence case for all headings, not Title Case. This includes colons within a heading or sentence — sentence case after the colon too, unless grammar, a proper noun, a title, or code requires otherwise.

### Excessive boldface
Don't bold words for emphasis in body text (decorative bold). Use sentence structure for emphasis instead.

### Emoji headings and over-sectioned structure
Don't use emoji in headings. Don't create a header for a tiny section — if a section is one or two sentences, it doesn't need its own header.

### Emoji as decorative formatting
Don't scatter emoji before bullet points or section labels as a substitute for structure (e.g. "👋 Welcome," "🧠 The insight"). If a list needs a visual marker, it needs better writing, not an emoji.

### Unnecessary tables
Don't reach for a small table to present something that reads fine as prose — basic stats, a short list of names/roles, a two-item comparison. Tables are for data dense enough that prose would obscure it.

### Placeholder text left in
Never deliver output containing unfilled brackets or template blanks — `[Insert X here]`, `[Your Name]`, `INSERT_SOURCE_URL`, or similar. Either fill it in or cut it before finalizing.

### Model citation artifacts
Never ship text carrying a model's internal citation or rendering markers. They come from pasting chat output into a document without reading it, and each model leaves its own:
- ChatGPT: `:contentReference[oaicite:0]{index=0}`, `oai_citation`, `turn0search0`, `attributableIndex`, a bare `+1` appended to a phrase
- Gemini: `[cite: 1]`, `[span_1](start_span)`
- Grok: `grok_card`, `grok_render_citation_card_json`
- DeepSeek: lenticular brackets with dagger symbols, like `【85†L261-269】`
- Perplexity: `attached_file`, `ppl-ai-file-upload`
- Unattributed: a stray `:::writing` fence

Search for these by name before delivering anything drafted in a chat window. This is the same failure as leaving a placeholder in: the reader learns exactly which tool wrote it.

### Curly quotes
Use straight quotation marks and apostrophes, not curly/smart quotes.

### Markdown-generation artifacts
Four structural habits that come from a model writing Markdown, not from a person writing a document:
- **A title heading restating the document title** at the top of a doc that already has a title (a page, a PR body, an issue). Start with the content.
- **Thematic breaks (`---`) between every section.** A horizontal rule is not a section separator; the heading already does that job. Use one only for a genuine break in kind.
- **Headings that contain nothing but other headings.** If a section's entire body is its subsections, it doesn't need to exist.
- **Level-1 headings (`#`) inside a document.** Start at `##`; `#` is the title's level.

## 6. REVISING SOMEONE'S OWN DRAFT

When the input is already the person's own words (a rough draft, a dictated voice memo, a rambling first pass) and the task is to clean it up rather than write from scratch, the highest-risk failure mode isn't banned vocabulary — it's *restructuring*. A worked example: the author handed over their own raw draft (dictation artifacts, run-on sentences, comma splices) plus a separate AI-smoothed version, and asked for a merge. The merged output rewrote his sentences into short declarative fragments and, in doing so, reintroduced exactly the tells this skill exists to catch — "Here's the part worth noticing" (fake-secret reveal), "Worth saying plainly too" (signposting), "But the recall? Give that away." (kicker line), "The reason is simple" (announcement-instead-of-statement) — despite believing the draft had been checked against this file. Their reaction: "it reads and flows typical ai, too different from what I'd have said, neither my words nor flow."

**Default to minimal-touch copyediting, not rewriting, when the source is the person's own words:**
- Fix only objective errors: stray capitalization (common in dictated text), typos, subject-verb agreement, missing words.
- Preserve their actual sentence structure, run-ons, comma splices, and parentheticals. A rambling sentence in their voice beats a clean one in nobody's voice.
- Don't break long sentences into punchy fragments for effect — that restructuring is itself an AI tell, independent of word choice.
- Don't add new lines, insights, or framing devices, even good ones, without flagging them separately as additions and asking first. An idea that isn't in their draft or wasn't dictated by them doesn't belong merged in silently, no matter how sharp it reads.
- If a smoothed/AI version exists alongside the raw draft, treat it as a source for content ideas to *ask about*, not prose to merge in. Its sentence-level phrasing is exactly the failure mode to avoid, even when its underlying point is good.
- Run the full self-check (§8 below) against your own edit before delivering — writing a "light touch" pass doesn't exempt it from the same scan.

## 7. THE REPLACEMENT RULE

When you catch yourself reaching for a banned word, apply this:

| Instead of | Use |
|-----------|-----|
| delve | dig into, explore, look at |
| landscape | market, space, field, scene |
| tapestry | mix, combination, range |
| pivotal | important, big, central |
| vibrant | active, busy, lively |
| underscore | show, prove, make clear |
| showcase | show, demonstrate, display |
| foster | build, create, encourage |
| enhance | improve, strengthen, add to |
| garner | earn, get, win, attract |
| intricate | complex, detailed, specific |
| bolster | strengthen, support, back up |
| serves as | is |
| Additionally | Also / [restructure] |
| leveraging | using |
| innovative | new, original, different |
| deep dive | look at it closely, go through it |
| robust | works, holds up, handles X |
| key (adj.) | [cut it] or name why it matters |
| associated with | [state the actual relationship] |

## 8. THE SELF-CHECK

Before finalizing any writing, scan for:
0. If the source was the person's own draft: did you restructure their sentences instead of just fixing errors? (see §6, Revising Someone's Own Draft)
1. Any word from the banned list (Ctrl+F each one if needed)
2. Any em dash at all (default is zero, not "one or two" — see Em dash overuse above)
3. Any "-ing" phrase attached as fake analysis
4. Any "Not just X, but Y" or "X isn't Y. It's Z" construction
5. Any triple-adjective or triple-phrase patterns (rule of three)
5a. Any sentence, especially the hook, opening with an unattributed "Everyone...," "Nobody...," or "Most [people/teams/X]..." claim
6. Any vague attributions without named sources
7. Any "Despite challenges..." formula
8. Title case in headings
9. Sentences starting with "Additionally"
10. "Serves as" / "stands as" where "is" works
11. Any "nobody talks about" / "no one tells you" fake-secret framing
12. Any clichéd figure of speech seen a hundred times before (Orwell #1)
13. Any long/fancy word where a short one works (Orwell #2)
14. Any word that can just be cut (Orwell #3)
15. Any passive construction that could be active (Orwell #4)
16. Any jargon/foreign phrase with a plain English equivalent (Orwell #5)
17. Any "it's important/worth noting that" signposting instead of just stating the thing
18. Any canned notability puffery ("profiled in," "maintains an active social media presence," outlet name-drops)
19. Em dashes padded with spaces on both sides
20. Any colon used to stage a dramatic one-line payoff, or a fake-profound kicker fragment as a closer
21. A summary-recap ending that just restates what the piece already said
22. Emoji in headings, or a header over a section that's only one or two sentences
23. Any "associated with" / "connected to" / "in connection with" standing in for a relationship you could state directly
24. Markdown artifacts: a title heading restating the doc title, `---` between sections, a heading whose body is only subsections, a `#` heading mid-document
25. An "X and Y" section header ("Awards and recognition," "Impact and legacy") that doesn't match what's in the section
26. Emoji used as decorative bullet/section markers, not just in headings
27. A small table used where prose or a two-item comparison would read fine
28. Any unfilled placeholder or template blank (`[Insert X here]`, `INSERT_SOURCE_URL`)
29. Any model citation artifact (`contentReference`, `oaicite`, `[cite: 1]`, `grok_card`, `【†】`, `ppl-ai-file-upload`)

If any are found, rewrite that section before delivering.

---

**Source:** https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing, its Hacker News discussion (news.ycombinator.com/item?id=44700558), r/AskReddit "What are the most obvious signs of AI writing?" (reddit.com/r/AskReddit/comments/1rkdsaf), and github.com/petergyang/no-ai-slop (SKILL.md + eval.md)
**Last synced:** 2026-09-02

The tells in this file go stale — models change, and a pattern that screamed "AI" last year can read as ordinary this year. Re-read the sources every few months and update what no longer holds. There is no automation for this; it is a judgement call about how writing currently sounds.
