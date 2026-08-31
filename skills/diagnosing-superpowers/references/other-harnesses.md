# Other harnesses: discover, then report what you found

This file is for any harness without a verified reference in this
directory. You know your own harness better than this file does. Use that
knowledge, and write down exactly what you found so the report reader can
judge it.

## Procedure

1. **Ask the harness.** Many harnesses expose a session or history command
   (`<harness> session list`, `/sessions`, a "resume" picker). Use it to get
   the session id and, if shown, the file path.
2. **Look under the harness's config directory** (`~/.<harness>/`,
   `~/.config/<harness>/`, `~/.local/share/<harness>/`) for `sessions`,
   `history`, `chats`, `threads`, or `projects` directories holding `.jsonl`
   or `.json` files.
3. **Confirm a candidate** by extracting its first human message with a
   size-safe command (`head -c 2000`, or `jq` on the first record) and
   matching it to what your human partner remembers. Never print whole
   lines; treat every candidate like the verified stores: `wc -lc` and a
   long-line check before anything else.
4. **Map the fields you need** by reading a handful of records with `jq -c
   'keys'` or `head -c`: human prompt, assistant text, tool call and result,
   model, harness version, timestamps, subagent linkage, compaction.
5. **Record in the case file and the report's coverage notes**: the store
   path, the layout you inferred, which of the fields above you could and
   could not find, and your confidence. Field-level claims in the report
   are marked "inferred from the file, not a documented format".
6. **If you cannot find the store**, say so and ask your human partner for
   the path. Do not guess a layout from another harness.
