CONTAMINATED: both arms read superpowers skills from ~/.agents/skills/superpowers
(a symlink to an old installed copy under ~/.codex, without the v3 helpers),
which Codex discovers relative to HOME; csd does not override HOME. Codex also
seeds every fresh CODEX_HOME with the curated marketplace's released
superpowers. So cxspike did not test the checkout, and cxbare was not bare.
Kept as a data point: Codex (gpt-5.6-sol, effort low) with the old skills
visible behaved like bare Claude: TDD from the plan, ~50 s, no ledger, no
review, crash shipped 6/6. Rerun with a scratch HOME and the curated plugin
disabled is under 2026-09-17-codex/.
