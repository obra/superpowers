# Brainstorming rebuild: evaluation results

Evidence for the brainstorming rebuild (obra/superpowers#2463), described in
`2026-10-05-brainstorming-rebuild-design.md` on that PR. "Old" is `skills/brainstorming`
at `dev` (b1f8774). "New" is the rebuilt skill on `brainstorming-rebuild`.

**Environment:** Claude Code 2.1.289–2.1.291, macOS. Subject sessions,
simulated humans, and testers were all claude-opus-5-5. Subjects ran with
`--setting-sources project --strict-mcp-config` plus `--plugin-dir` for the
checkout under test, so no user CLAUDE.md, user plugins, or MCP servers.

**Tools** (all in `tests/brainstorming/`):
- `first-turn.sh`: isolated `claude -p` samples of the opening message.
- `converse.sh`: a claude-session-driver worker talks with a simulated human
  who has hidden intent (`scenarios/*/persona.md`).
- `blind-pair.sh`: launches two workers under neutral labels for a blind
  comparison.

None of this ran on quorum. The eval repo's scenarios were updated to match
(branch `brainstorming-rebuild` in superpowers-evals) but have not been run
live.

## 1. Opening message (first-turn.sh, 5 prompts × 5 reps per arm)

Prompts: habit tracker app, offsite talk, bakery side business, onboarding
emails, "make the app icon cornflower blue".

| | No skill | Old | New |
|---|---|---|---|
| Opening length (words) | 160–600 | 115–240 | 42–63 |
| Process jargon up front ("architectural", "spec", "plan") | 0/25 | 25/25 | 0/25 |
| Opens with a menu or a questionnaire (non-trivial prompts) | 20/20 | 20/20 | 0/20 |
| Mentions they can skip the questions | 0/20 | ~0/20 | 20/20 |
| Cornflower blue: just did it | 5/5 | 0/5 (design + approval round) | 5/5 |

No skill: 4–7 questions mostly about the *how* (platform, stack, format),
then a proposed default build. For the bakery it gave ~550 words of generic
advice before asking anything.

Old: one question, but always as a lettered A–E menu, after a 40–80 word
process announcement.

New (final wording): one line offering to skip the questions, then one open
question anchored in a real moment ("think of someone who signed up recently
— what happened in their first few days?").

## 2. Multi-turn conversations (converse.sh)

Scenarios: habit tracker (it's for the user's kids; prior attempts failed),
offsite talk (after layoffs; non-software), "skip some files" in a sync tool
(small change), plus opt-out, spike, and multi-project scenarios.

**Hidden facts drawn out (round 1, 2 reps per arm):**

| | Old | New |
|---|---|---|
| Habit tracker (7 facts) | 7/7, 6/7. Missed prior art (Habitica) in both | 7/7, 7/7 |
| Offsite talk (8 facts) | 7/8, 7/8. Missed the core goal (rebuild trust) in both | 8/8, 8/8 |

**Menus:** the old skill offered 16–27 lettered options per conversation.
The new one offered 0–1. In one old run, the human picked "A: excitement and
alignment around a vision" from the first menu, a plausible option that was
wrong for them.

**Final version, 12 runs across 6 scenarios:**
- 9 of 100 agent messages asked more than one question. Before the
  one-question wording fix, it was 55–80%.
- Zero menus.
- Guesses are labelled "(my guess)" in playbacks.

**Other measurements:**
- First playback came around turn 3–6 once playback was interleaved with
  questions (6 runs); before that it was turn 7–16.
- Project-sized conversations still run 12–20 turns to an approved document.

**Paths:**
- Small change: skip-files was played back, approved, then built with TDD.
- Non-software: the offsite talk was sized as a small job; the outline was
  delivered in chat after approval.
- Project: doc → builder check → approval → writing-plans. The gate held in
  every run.
- Opt-out ("skip the questions, just build it"): it built immediately.
- Multi-project (pottery studio: booking, portal, shop, newsletter): it split
  them and took booking first.

**Builder check:** in one run, the check noticed that showing two kids'
progress side by side conflicts with the "no competition" anti-goal. The
resulting question drew out a fact the human had held back ("the
10-year-old definitely rubbed it in").

**After the batching change (4 runs):** each produced exactly one round of
questions after the write-up, e.g. "The reviewer came back with seven
questions. I'll settle four of them myself… Three only you can answer."

## 3. Blind comparison (blind-pair.sh, 6 testers)

Six subagent testers each played a person with a hidden, partly unarticulated
intent and brainstormed the same idea with both skills, labelled only X and
Y. The coin-flip mapping wasn't read until all interviews were done. Ideas:
- a chores/allowance app (the real goal is teaching kids money)
- a community-garden site (the real goal is a visibly fair waitlist; a third
  of members are over 70 and won't use accounts)
- a neighborhood tool library, non-software (the real reason is loneliness)

Two testers per idea, with session order counterbalanced by the coin flip.

**All 6 testers preferred the new skill.** Mean ratings (1–10), new vs old:

| Understood me | Pleasant | Worth the time | Trust to build from |
|---|---|---|---|
| 8.8 / 6.3 | 8.0 / 6.3 | 7.8 / 7.3 | 8.7 / 6.7 |

The closest pair was a garden tester (8/7/7/8 vs 7/7/8/7). The smallest gap
is "worth the time": old sessions were shorter.

**Design documents:** I read the openings of every pair and the
tool-library docs in full.
- Keyword coverage of the hidden facts was close to even between arms.
- The difference is what the document is about. New documents open with the
  why: the triggering story, success six months out, and anti-goals written
  as failure conditions. Old documents open with a feature summary and treat
  the deeper goal as secondary or leave it out. Example from the tool library:
  - New: "Lending a drill is the excuse; the coffee and the conversation are
    the point."
  - Old: "Neighbors borrow tools and learn to use the machines, with coffee
    on."
- One old garden document never mentioned the older members.

**Process problems seen only in the old arm:**
- produced the deliverable before the human reviewed anything (1 session)
- treated "otherwise that's it" as approval and silently edited the spec (1)
- wrote a file outside its work dir (1)

**Where old did better:** a few concrete ideas the new arm didn't produce (an
extra-jobs board, knocking on doors, printouts for the shed door). Old
documents were often more concrete on mechanics.

**Complaints about the new skill, and what happened to them:**
- Builder-check follow-ups felt like being interrogated after "write it up."
  Every new-arm tester raised it. Fixed: one ranked round, minor gaps settled
  and marked.
- An unmarked guess inside a question ("hand the garden off someday"; "Dad").
  Open.
- An answer too long for a non-technical user (insurance research). Open.
- The visual companion offer's "token-intensive" line confused non-technical
  users. That text is checked by the companion eval; left as is.

## 4. After the blind test

**Visual companion** (converse.sh). The offer now names the moments that call
for it and drops the "token-intensive" line.

| Scenario | Before | After |
|---|---|---|
| Habit tracker | about 1 in 2 | 3/3 |
| Pottery booking | 0/3 | 3/3 |
| Sync-tool flag, talk outline (nothing visual) | 0 | 0/4 |

After the change, offers came at turns 3–7 and never upfront.

**Writing style** (first-turn.sh, `prompts/style-*.txt`: a research
report, an insurance question, and a security question; 5 reps each). Lines
tested:
- "Be clear and concise. Lead with the most important information. Avoid
  jargon."
- "Be clear and concise. Lead with what matters. Avoid jargon." (adopted)
- that line plus "making sure your human partner reads and understands"
- "You write well…"
- "Channel your inner journalist"
- "Channel your inner Hemingway"
- "Write the way Walt Mossberg…"
- "a seasoned wire-service reporter"
- "a BA in Journalism from Wesleyan"
- a five-point recipe
- "fewest words that fully answer this person"

Results on Opus:
- Every variant, including no line, already led with the point.
- No plain line moved length beyond noise.
- Journalist identities added source attributions: 17–27 per 5 research
  replies against 16 for the control, and 0–7 for plain lines.

Five of the lines were also run on Sonnet, gpt-6-luna and gpt-6-astra (Codex
CLI 0.157.1). No style line moved any model beyond noise. The model mattered
far more than the wording:

| Model | Research report, mean words |
|---|---|
| Opus | 350–400 |
| Sonnet | 325–350 |
| gpt-6-luna | 170–185 |
| gpt-6-astra | 180–190 |

gpt-6-astra cited heavily under every variant, including one link more
specific than its notes.

## Known gaps

- Offering a spike mid-conversation is untested. The spike scenario asks for
  a spike outright, so the skill doesn't load.
- Not run on quorum or under any harness other than Claude Code.
- All humans were simulated by the same model family as the subject.

## Harness caveats

- claude-session-driver workers inherit the operator's Claude account. In 2
  old-arm sessions, the subject used the operator's name for the persona.
- Workers run with the operator's real HOME and permissions bypassed. One
  old-arm session wrote to `~/Desktop`.
- The csd launch needed a fix for Claude Code's trust dialog, which now
  defaults to "No, exit" (obra/claude-session-driver#34).
