Read `prompts/analyst-common.md` first; it gives your role, inputs,
context-safety rules, and the return format. This file adds the dimension.

Dimension: Cost and time

Account for where tokens and wall-clock went.

1. Tokens. Claude Code: sum `message.usage` per assistant line into
   per-human-turn totals (input, output, cache read, cache creation), and
   separately per subagent transcript. Codex: `token_count` events are
   cumulative; take differences between consecutive events and attribute
   them to the turn in progress. Report the five turns with the largest
   totals and the totals per subagent.
2. Wall-clock. Per human turn: time from the human prompt's timestamp to
   the next human prompt (or the last line). Codex also has
   `task_complete.duration_ms`. Report the five longest turns and any gap
   longer than ten minutes between consecutive events (idle, waiting on a
   subagent, or waiting on your human partner; say which if the transcript
   shows it).
3. Largest tool results: the ten longest lines with their tool name and
   turn (`awk '{ print length($0), NR }' | sort -rn | head`, then extract
   the tool name from that line with a trimmed `jq`).
4. Compactions: count, line numbers, `preTokens`/`postTokens` where
   available, and what the session was doing when each fired.
5. Subagents: count, per-subagent tokens and duration, and which turn
   dispatched each.
6. Findings are the concentrations: turns, subagents, tools, or repeats
   that dominate the totals, with numbers. Do not speculate about why a
   turn was expensive beyond what the transcript shows.
