# Claude Code session store

Verified against: Claude Code 2.1.247 (transcript `version` field), macOS.
When a field below is missing from the file in front of you, trust the file
and say so in coverage notes.

## Where

- Main transcript: `~/.claude/projects/<cwd-slug>/<sessionId>.jsonl`, where
  `<cwd-slug>` is the working directory with every `/` replaced by `-`
  (e.g. `/tmp/work` → `-tmp-work`).
- Subagent transcripts: `~/.claude/projects/<cwd-slug>/<sessionId>/subagents/agent-<agentId>.jsonl`,
  each with a sibling `agent-<agentId>.meta.json`
  (`agentType`, `description`, `toolUseId`, `spawnDepth`, optional `model`).
- Plugin registry: `~/.claude/plugins/installed_plugins.json` — per plugin:
  `installPath`, `version`, `installedAt`, `lastUpdated`, `gitCommitSha`.
- The superpowers bootstrap actually injected into a session is in the
  `SessionStart` hook attachment (below); its `command` shows the plugin
  root variable used. A dev checkout loaded with `--plugin-dir` will not be
  in the registry, so report both the registry entry and the hook evidence.

## Which file is the current session

The most recently modified `.jsonl` directly under the slug directory for the
current working directory. Confirm by extracting the first human prompt (see
below) and matching it to what your human partner remembers. If two files
are close in mtime, show both first prompts and ask.

## Line types

Every line is one JSON object. `type` values seen: `user`, `assistant`,
`attachment`, `system`, plus session-level records (`permission-mode`,
`mode`, `bridge-session`, `last-prompt`, `ai-title`, `atis-latch`,
`pr-link`, `queue-operation`, `relocated`, `worktree-state`).

Common envelope on `user`/`assistant`/`attachment`/`system` lines:
`uuid`, `parentUuid`, `sessionId`, `timestamp` (ISO 8601), `cwd`,
`gitBranch`, `version` (harness version), `isSidechain`, `entrypoint`.

| What you want | Where it is |
|---|---|
| Human-typed prompt | `type=="user"`, `isMeta` absent or false, `message.content` is a string or a list whose first block is `type:"text"`. Lines whose first block is `tool_result` are tool results, not prompts. `<system-reminder>` text inside a prompt is injected, not typed. Text beginning with `<task-notification>`, `<command-name>`, `<local-command-stdout>`, `<system-reminder>`, or `This session is being continued from a previous conversation` is harness-injected too, even though `isMeta` is absent on those lines — exclude them or your human-turn count will be several times too high. |
| Human-typed prompt queued mid-turn | `type=="attachment"`, `attachment.type=="queued_command"`, `attachment.origin.kind=="human"`, text in `attachment.prompt`. These are typed while a turn is running and never appear as standalone `user` lines, so they are missing from the list above. Add them to the timeline. |
| Assistant text / tool calls | `type=="assistant"`, `message.content[]` blocks of `type:"text"` or `type:"tool_use"` (`id`, `name`, `input`). |
| Tool result | `type=="user"`, `message.content[0].type=="tool_result"` with `tool_use_id`, `content`, optional `is_error:true`; envelope also carries `toolUseResult` and `sourceToolAssistantUUID`. |
| Model | `message.model` on assistant lines. |
| Tokens | `message.usage` on assistant lines: `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`. |
| Skill invocation | `tool_use` block with `name:"Skill"` and `input.skill` (e.g. `superpowers:brainstorming`); the tool result line has `toolUseResult.commandName`. |
| Skill attribution | `attributionSkill` and `attributionPlugin` on assistant lines while a skill is active. |
| Subagent dispatch | `tool_use` with `name:"Agent"` (`input.description`, `input.subagent_type`, `input.prompt`); the subagent's own file is matched by `toolUseId` in its `.meta.json`. Subagent lines have `isSidechain:true` and `agentId`. |
| Hook output | `type=="attachment"`, `attachment.type` `hook_success`/`hook_failure`, `attachment.hookName` (e.g. `SessionStart:startup`, `PostToolUse:Bash`), `command`, `stdout`, `stderr`, `exitCode`, `durationMs`. |
| Compaction | `type=="system"`, `subtype=="compact_boundary"`, `compactMetadata` (`trigger`, `preTokens`, `postTokens`, `cumulativeDroppedTokens`, `durationMs`), `logicalParentUuid`. |
| Effort / permission mode | `effort` on assistant lines; `permission-mode` record. |

## Safe extraction

Lines can exceed a megabyte. Never print a whole line. Check size first:

```bash
F=~/.claude/projects/<slug>/<id>.jsonl
wc -lc "$F"
awk '{ if (length($0) > 100000) print NR, length($0) }' "$F"   # long lines
```

With `jq` (preferred):

```bash
jq -r '.type' "$F" | sort | uniq -c                                    # line-type census
jq -r 'select(.type=="user" and .isMeta!=true and ((.message.content|type)=="string" or .message.content[0].type=="text"))
       | select((.message.content|if type=="string" then . else (.[0].text // "") end)
                | test("^(<task-notification>|<command-name>|<local-command-stdout>|<system-reminder>|This session is being continued)") | not)
       | "\(input_line_number)\t\(.timestamp)\t\((.message.content|if type=="string" then . else .[0].text end)[0:160])"' "$F"   # human prompts
jq -r 'select(.type=="attachment" and .attachment.type=="queued_command" and .attachment.origin.kind=="human")
       | "\(input_line_number)\t\(.timestamp)\t\(.attachment.prompt[0:160])"' "$F"   # human prompts queued mid-turn; merge with the list above
jq -c 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use")
       | {name, id, input: (.input|tostring|.[0:120])}' "$F"           # tool calls
jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and .name=="Skill") | .input.skill' "$F"   # skill invocations
jq -c 'select(.type=="assistant") | {ts:.timestamp, model:.message.model, skill:.attributionSkill,
       u:(.message.usage|{input_tokens,output_tokens,cache_read_input_tokens,cache_creation_input_tokens})}' "$F"   # per-message usage
jq -c 'select(.subtype=="compact_boundary") | {line:input_line_number, ts:.timestamp,
       m:(.compactMetadata|{trigger,preTokens,postTokens,cumulativeDroppedTokens,durationMs})}' "$F"   # compactions (full compactMetadata also has UUID lists; keep this trimmed)
jq -c 'select(.type=="attachment" and (.attachment.type|startswith("hook"))) | {line:input_line_number, hook:.attachment.hookName, exit:.attachment.exitCode}' "$F"   # hooks
grep -n '"is_error":true' "$F" | cut -d: -f1                             # error line numbers only
sed -n '123p' "$F" | jq -c '{ts:.timestamp, first:((.message.content // "") as $c
       | ($c | if type=="array" then ($c[0] // "") else $c end) | tostring | .[0:400])}'   # one line, trimmed (content is sometimes a bare string, sometimes absent)
```

Without `jq`, the same with python3 (one line per record, print only what
you asked for):

```bash
python3 -c 'import json,sys
for n,l in enumerate(open(sys.argv[1]),1):
    o=json.loads(l)
    if o.get("type")=="assistant":
        for b in o["message"].get("content",[]):
            if b.get("type")=="tool_use": print(n, b["name"], str(b.get("input"))[:120])' "$F"
```

## Subagents

List `~/.claude/projects/<slug>/<id>/subagents/`. For each `agent-*.meta.json`
print `agentType`, `description`, `model`; the matching `.jsonl` is that
subagent's transcript and follows the same line format. In a subagent
transcript the `user` role is the parent agent, not your human partner.
