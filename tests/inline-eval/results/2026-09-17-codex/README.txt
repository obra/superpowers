Codex CLI 0.154, worker model gpt-5.6-sol at reasoning effort low (csd's
default; also the operator's setting), fresh CODEX_HOME per rep via csd,
scratch HOME, curated superpowers removed. cxspike installs this checkout
(executing-plans v3) as a local-marketplace plugin; cxbare has no plugin.
wordstat fixture, 3 reps per arm.

              cxbare (3)         cxspike / v3 inline (3)
wall clock    47-49 s            116-138 s
skill reads   0                  4-5 (executing-plans, TDD, verification, finishing)
helpers       0                  5-6 task-start/task-done calls
ledger        0                  4-7 touches
reviewer      0                  1 spawn_agent each (model gpt-6-astra)
RED->GREEN    3/3 all tasks      3/3 all tasks
utf8 probe    handled 3/3        handled 1/3

On this harness the planted defect does not discriminate: gpt-5.6-sol's
idiom for the bare CLI was read_text(encoding="utf-8") with
except (OSError, UnicodeError), which handles it. Under v3 two of three
implementers wrote except OSError only, and the gpt-6-astra final reviewer
did not surface the decode case (no rollout mentions it; Codex encrypts
message bodies, so only the outcome is readable). The v3 process itself
translated: helpers, ledger, one review, no re-review. Codex token counts
are Codex's own cumulative figures, not comparable to the Claude arms.
