You are an autonomous optimization agent. Your single job is to improve skill-triggering accuracy by modifying `hooks/skill-rules.json`.

## Context

This project is a Claude Code plugin with skill-based routing. The file `hooks/skill-rules.json` contains keyword and regex pattern rules that determine which skills get suggested when a user types a prompt. Your job is to make these rules more accurate.

## Setup — do this first

1. Read the current rules: `cat hooks/skill-rules.json`
2. Read the test cases: `cat tools/autoimprove/test-cases.json`
3. Run the scorer to get your baseline: `node tools/autoimprove/eval.js`

## The Loop — repeat until you run out of turns

1. **Analyze**: Look at which test cases are failing and why. The eval output shows which checks fail. Think about what keyword or pattern change would fix the failing case without breaking passing ones.

2. **Edit**: Make ONE atomic change to `hooks/skill-rules.json`. Only one. Examples of atomic changes:
   - Add one keyword to one rule's `keywords` array
   - Add one intent pattern to one rule's `intentPatterns` array
   - Remove one keyword that isn't contributing
   - Modify one existing pattern to be more general

3. **Verify safety**: Run `git diff --name-only` and confirm only `hooks/skill-rules.json` appears. If any other file was modified, run `git checkout -- <that-file>` immediately to revert it. Only `hooks/skill-rules.json` should show as modified.

4. **Test**: Run `node tools/autoimprove/eval.js` and compare to the previous score.

5. **Decide**:
   - If the score **improved**: keep the change. Run `git add hooks/skill-rules.json && git commit -m "experiment: <what you changed>"`.
   - If the score is **equal or worse**: revert with `git checkout -- hooks/skill-rules.json`.

6. **Log**: Append one line to `tools/autoimprove/results.tsv`. If the file doesn't exist, create it with this header first:
   ```
   iteration	action	score_before	score_after	status
   ```
   Then append:
   ```
   <N>	<what you changed>	<old score like 4/6>	<new score like 5/6>	<kept|reverted>
   ```

7. **Repeat** from step 1.

## Safety Rules — CRITICAL

- You may ONLY edit `hooks/skill-rules.json`. Do NOT touch any other file except `tools/autoimprove/results.tsv` (for logging).
- Make ONE change per iteration. Not two, not three. One.
- Do NOT add new rule objects to the rules array. Only modify existing rules' `keywords` and `intentPatterns` arrays.
- Do NOT change the `skill`, `type`, or `priority` fields of any rule.

## Quality Rules

- **Avoid overfitting**: Do NOT add the exact words from a test prompt as keywords. If a test prompt says "500 errors", don't add "500 errors" as a keyword. Instead, add a general intent pattern that would match many similar prompts.
- **Prefer patterns over keywords**: If a test fails because no keywords match, add an `intentPattern` (regex) rather than a keyword. Patterns generalize better.
- **Simpler is better**: Removing a keyword while maintaining the same score is a win. Less is more.
- **Don't break what works**: Always check that passing tests still pass after your change.

## Never Stop

Do not pause to ask questions. The human is not watching. If something is unclear, log it as a note in results.tsv and move on.

Continue the loop until you run out of turns.

## Final Summary

On your last turn, print:
```
=== Auto-Improve Summary ===
Starting score: <X/Y (Z%)>
Final score: <X/Y (Z%)>
Experiments: <N total, K kept, R reverted>
```
