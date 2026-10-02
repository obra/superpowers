Read `prompts/analyst-common.md` first; it gives your role, inputs,
context-safety rules, and the return format. This file adds the dimension.

Dimension: Cost and time

Account for where tokens and wall-clock went.

1. Tokens. Use only the usage records and counter meanings established in the
   case file. State whether each counter is incremental or cumulative before
   calculating totals; difference cumulative observations without turning a
   missing observation into zero. Report the five turns with the largest
   supported totals and the supported totals per associated session.
2. Wall-clock. Use the evidenced timestamp fields, event boundaries, and units
   recorded in the case file. Report the five longest supported turns and any
   gap longer than ten minutes between consecutive events (idle, waiting on an
   associated session, or waiting on your human partner; say which only when
   the records show it).
3. Largest tool results: use the case file's evidenced tool-result records to
   report the ten largest results with their tool and turn. Measure records
   before extracting bounded content.
4. Compactions: count and locate records whose meaning as compaction events was
   established during discovery. Report available before/after counters and
   what the session was doing when each fired; mark unsupported fields absent.
5. Associated sessions: count them and report supported usage, duration, and
   dispatching turn for each.
6. Report the turns, subagents, tools, or repeats that dominate the
   totals, with numbers. Do not speculate about why a
   turn was expensive beyond what the transcript shows.
