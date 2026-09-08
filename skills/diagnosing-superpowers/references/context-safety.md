# Context safety for session transcripts

One transcript line can exceed a megabyte; a Codex `compacted` line can
embed a whole history. Printing one whole line can end the session doing
the diagnosis. Every reader of a session file, controller or subagent,
follows these rules for every file, every time.

1. **Measure before reading.**

   ```bash
   wc -lc "$F"
   awk '{ if (length($0) > 100000) print NR, length($0) }' "$F"   # long lines
   ```

2. **Never `cat` or `grep` for content.** Get line numbers and counts
   first (`grep -n … | cut -d: -f1`, `jq -r '.type' | sort | uniq -c`),
   then small fields from specific lines (`sed -n Np | jq -c '{…}'` or
   `| cut -c1-500`). The harness reference lists the field-extraction
   commands.
3. **Narrow anything over 500 characters.** If a command returns more than
   500 characters for one record, tighten the field or the slice.
4. **Read-only.** Never modify, move, or delete a session file.
