# Codex session store

Verified against: Codex CLI 0.146.0, 0.147.0 and 0.149.0-alpha.4.1 rollouts
(`cli_version` in `session_meta`), macOS. When a field below is missing from
the file in front of you, trust the file and say so in coverage notes.

## Where

`~/.codex/sessions/YYYY/MM/DD/rollout-<ISO-timestamp>-<thread-id>.jsonl`.
Subagent threads are separate rollout files whose `session_meta.payload`
has `thread_source: "subagent"` and `source.subagent.thread_spawn.parent_thread_id`
pointing at the parent thread id. Root sessions have `thread_source: "user"`.

## Which file is the current session

The most recently modified rollout whose `session_meta.payload.cwd` is the
current working directory and whose `thread_source` is `user`. Confirm by
matching the first `user_message` event to what your human partner
remembers. Newer rollouts may carry no `user_message` event at all: when
that command returns nothing, fall back to `response_item` messages with
`role:"user"` (see Human-typed prompt below) and confirm against the first
of those instead.

## Line types

Every line is `{timestamp, type, payload}` (some also carry `ordinal`).
`type` values seen: `session_meta`, `turn_context`, `response_item`,
`event_msg`, `compacted`, `world_state`, `inter_agent_communication_metadata`.

| What you want | Where it is |
|---|---|
| Session identity | `session_meta.payload`: `id`, `session_id`, `cwd`, `originator` (e.g. `Codex Desktop`), `cli_version`, `model_provider`, `thread_source`, `source`, `git` (`commit_hash`, `branch`, `repository_url`), `base_instructions.text`. |
| Model per turn | `turn_context.payload`: `turn_id`, `model`, `effort`, `cwd`, `approval_policy`, `sandbox_policy`, `multi_agent_version`. Also `event_msg` `thread_settings_applied`. |
| Human-typed prompt | `event_msg` with `payload.type=="user_message"`: `payload.message`. When that returns nothing — seen on `thread_source: "user"` Codex Desktop rollouts at `cli_version 0.149.0-alpha.4.1`, and on subagent rollouts — fall back to `response_item` messages with `payload.role=="user"`, text in `payload.content[0].text`. `role:"developer"` messages are injected boilerplate, not typed, and so is any fallback text that begins with a tag such as `<subagent_notification>`, `<environment_context>`, `<skill>` or `<recommended_plugins>`. On a subagent rollout the fallback text is the parent agent's dispatch prompt, not your human partner's. |
| Assistant text | `event_msg` `agent_message` (`payload.message`, `payload.phase`) or `response_item` `message` with `role:"assistant"`. |
| Tool calls | `response_item` with `payload.type` `function_call` (`name`, `arguments`, `call_id`) or `custom_tool_call` (`name`, `input`, `call_id`); outputs are `function_call_output` / `custom_tool_call_output` matched by `call_id`. Also `event_msg` `patch_apply_end` (`success`, `changes`), `web_search_end`, `mcp_tool_call_end` (`invocation.server`, `invocation.tool`). |
| Turn timing | `event_msg` `task_started` (`turn_id`, `started_at`, `model_context_window`) and `task_complete` (`duration_ms`, `time_to_first_token_ms`, `last_agent_message`); `turn_aborted` (`reason`, `duration_ms`). |
| Tokens | `event_msg` `token_count`: `payload.info.total_token_usage` (cumulative; keys include `input_tokens`, `cached_input_tokens`, `output_tokens`) and `payload.rate_limits`. |
| Compaction | a `compacted` line (`window_id`, `previous_window_id`, `replacement_history`) and an `event_msg` `context_compacted`. |
| Subagents | `event_msg` `sub_agent_activity` (`agent_thread_id`, `agent_path`, `kind`); `response_item` `agent_message` with `author`/`recipient`; the child's own rollout file (see Where). |
| Skill use | No attribution field. Look for `SKILL.md` in `function_call.arguments` / `custom_tool_call.input` and in `world_state`/`session_meta` instruction text. |
| Reasoning | `response_item` `reasoning` (`summary[].text`; `encrypted_content` is opaque). |

## Safe extraction

Rollouts reach hundreds of megabytes; `compacted` lines embed whole
histories. Never print a whole line. Check size first:

```bash
F=~/.codex/sessions/YYYY/MM/DD/rollout-....jsonl
wc -lc "$F"
awk '{ if (length($0) > 100000) print NR, length($0) }' "$F"
```

With `jq`:

```bash
head -1 "$F" | jq '.payload | {id, cwd, originator, cli_version, model_provider, thread_source, git}'   # identity
jq -r '.type + "/" + (.payload.type // "")' "$F" | sort | uniq -c                                       # census
jq -r 'select(.type=="event_msg" and .payload.type=="user_message") | "\(input_line_number)\t\(.timestamp)\t\(.payload.message[0:160])"' "$F"   # human prompts
jq -r 'select(.type=="response_item" and .payload.type=="message" and .payload.role=="user")
       | "\(input_line_number)\t\(.timestamp)\t\((.payload.content[0].text // "")[0:160])"' "$F"   # human prompts, fallback when the line above returns nothing; skip rows whose text starts with a `<tag>`
jq -r 'select(.type=="turn_context") | "\(.timestamp)\t\(.payload.model)\t\(.payload.effort)"' "$F"    # model per turn
jq -c 'select(.type=="response_item" and (.payload.type=="function_call" or .payload.type=="custom_tool_call"))
       | {line:input_line_number, name:.payload.name, args:((.payload.arguments // .payload.input)|tostring|.[0:120])}' "$F"   # tool calls
jq -c 'select(.payload.type=="task_complete" or .payload.type=="turn_aborted") | {ts:.timestamp, type:.payload.type, ms:.payload.duration_ms}' "$F"   # turn timing
jq -c 'select(.payload.type=="token_count") | {ts:.timestamp, t:.payload.info.total_token_usage}' "$F"   # tokens (cumulative)
grep -n '"type":"compacted"\|"context_compacted"' "$F" | cut -d: -f1       # compaction line numbers
grep -n 'SKILL\.md' "$F" | cut -d: -f1                                    # skill-read line numbers
sed -n '123p' "$F" | jq -c '{ts:.timestamp, type, p:(.payload|tostring|.[0:400])}'   # one line, trimmed
```

Find a thread's subagent rollouts (filenames only, never content):

```bash
grep -l '"parent_thread_id":"<thread-id>"' ~/.codex/sessions/*/*/*/rollout-*.jsonl
```

A subagent rollout can carry no `event_msg` `user_message` at all — the
parent agent's dispatch prompt instead shows up as a `response_item`
`message` with `role:"user"`. If a `user_message` event is present, it is
from the parent agent, not your human partner.
