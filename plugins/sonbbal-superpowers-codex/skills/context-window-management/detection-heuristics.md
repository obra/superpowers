# Detecting Context Pressure In Codex

Codex does not expose a reliable token-count API in normal skill workflows. Use visible signals and conservative judgment.

## Strong Signals

- Earlier conversation has been compacted or replaced by a summary.
- The task resumed after an interruption, context transition, or long-running session.
- You need to rely on constraints from many messages ago.
- You are about to report completion but cannot clearly list remaining verification obligations.

## Practical Heuristics

- 30+ back-and-forth turns in one task means context pressure is likely.
- 30+ tool calls or 15+ substantial file reads means the state should be compacted.
- Multiple independent edits, review cycles, or failed verification attempts increase risk.
- Code-heavy output consumes context quickly; large diffs or long logs should be summarized once conclusions are known.

## Behavioral Symptoms

Stop and preserve state if you notice:

- Re-reading the same files because you cannot remember conclusions.
- Uncertainty about the user's exact constraints, owned paths, or forbidden actions.
- Uncertainty about which tests passed, failed, or still need to run.
- Drift from the current task into adjacent work.
- A new request arriving while unresolved verification or cleanup remains.

## Rule Of Thumb

If losing the last 20 minutes of conversation would make the task unsafe to continue, create a compact state summary before doing more work.
