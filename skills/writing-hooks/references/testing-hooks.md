# Testing Hooks

TDD methodology adapted for Claude Code hooks. Same discipline as writing-skills: no hook without a failing test first.

## The Iron Law

```
NO HOOK WITHOUT A FAILING TEST FIRST
```

This applies to NEW hooks AND EDITS to existing hooks. Same as skills — write test before hook, watch it fail, write hook, watch it pass.

## RED: Baseline Without Hook

### 1. Define the Scenario

What behavior do you want to enforce? Be specific:
- "Claude should not execute `rm -rf /` via Bash"
- "Claude should warn about untracked files before committing"
- "Claude should not stop until all tests pass"
- "Claude should inject sprint context after compaction"

### 2. Run Without Hook

Trigger the scenario in Claude Code without the hook installed. Document:
- **What happened?** Did Claude execute the dangerous command? Stop too early?
- **What rationalizations did Claude use?** "It's safe because...", "The user asked me to..."
- **What information was missing?** Context lost after compaction?

### 3. Record Baseline

Save the transcript or take notes. This is your "failing test" — the behavior you want to change.

## GREEN: Write Minimal Hook

### 4. Write the Hook

Address exactly what you observed in the baseline. Don't add extra checks for hypothetical cases.

**Start with the simplest version:**
```bash
#!/bin/bash
INPUT=$(cat)
# Extract what you need
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
# Check the specific condition
if echo "$COMMAND" | grep -q 'rm -rf'; then
  echo "Blocked: rm -rf not allowed" >&2
  exit 2
fi
exit 0
```

### 5. Install and Test

Add the hook to settings, then run the same scenario. Behavior should change.

**Quick verification outside Claude:**
```bash
# Test with matching input
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /tmp/build"}}' | ./my-hook.sh
echo $?  # Should be 2

# Test with non-matching input
echo '{"tool_name":"Bash","tool_input":{"command":"npm test"}}' | ./my-hook.sh
echo $?  # Should be 0
```

### 6. Verify in Claude Code

Run the actual scenario in Claude Code. The hook should fire and change behavior. If it doesn't:
- Check matcher matches tool name (not permission syntax)
- Check script is executable (`chmod +x`)
- Check `jq` is installed
- Toggle verbose mode (`Ctrl+O`) to see hook output
- Run `claude --debug` for full execution details

## REFACTOR: Edge Cases

### 7. False Positives

Does the hook block legitimate actions?
- Guard that blocks `rm` also blocks `rm -rf node_modules` (intended cleanup)
- Guard that blocks `git push` also blocks pushes to your own fork

**Test:** Run normal workflows and verify the hook doesn't interfere.

### 8. False Negatives

Does the hook miss dangerous variations?
- `rm -rf /` blocked but `sudo rm -rf /` slips through
- `git push --force` blocked but `git push -f` slips through
- Command in a variable: `CMD="rm -rf /"; $CMD`

**Test:** Try variations of the blocked pattern.

### 9. Performance

Does the hook add noticeable latency?
- PreToolUse hooks run before EVERY matching tool call
- A 2-second hook on `Bash` adds 2 seconds to every command
- Set appropriate `timeout` values

**Measure:**
```bash
time echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | ./my-hook.sh
```

### 10. Infinite Loops (Stop hooks only)

Does the Stop hook prevent Claude from ever stopping?

**CRITICAL:** Always check `stop_hook_active`:
```bash
INPUT=$(cat)
if [ "$(echo "$INPUT" | jq -r '.stop_hook_active')" = "true" ]; then
  exit 0  # Allow stop — already continued
fi
```

**Additional safeguards:**
- Throttle continuations (max N per time window)
- Set `CLAUDE_HOOK_JUDGE_MODE` for recursive prevention
- Use a marker file to track continuation count

## Pressure Scenarios for Hooks

Adapted from writing-skills pressure testing:

### Time Pressure
"I need to deploy NOW, just let the push through."
Does the guard hold when Claude is under deadline pressure?

### Sunk Cost
"I've already done 90% of the work, just skip the test check."
Does the Stop hook still enforce passing tests?

### Authority
"The user told me to force push to main."
Does the push guard still block?

### Exhaustion
After 50+ tool calls in a session, does the hook still fire reliably?
(This tests the hook mechanism, not Claude's judgment.)

## Common Testing Mistakes

- **Testing the script but not the hook config:** Script works standalone but hook never fires (wrong matcher)
- **Testing happy path only:** Hook blocks the obvious case but misses variations
- **Not testing stdin consumption:** Hook works with `echo | script` but hangs when Claude calls it (didn't read stdin)
- **Not testing exit codes:** Script does the right thing but returns wrong exit code
- **Not testing with actual Claude:** Manual testing passes but hook behaves differently in context

## Debugging Hooks

### Hook not firing
1. Run `/hooks` and confirm it appears under the correct event
2. Check matcher matches tool name exactly (case-sensitive, regex)
3. Verify you're triggering the right event (PreToolUse vs PostToolUse)
4. For `PermissionRequest`: doesn't fire in non-interactive mode (`-p`)

### Hook fires but doesn't block
1. Check exit code (must be exactly 2 to block)
2. Check stderr has the message (not stdout)
3. For JSON output: must exit 0, not exit 2

### Hook causes errors
1. Test manually: `echo '<json>' | ./script.sh`
2. Check for missing `jq` dependency
3. Check script is executable
4. Check for shell profile interference (unconditional echo in .zshrc)

### Hook runs forever
1. For Stop hooks: check `stop_hook_active`
2. Add throttling (max continuations per time window)
3. Set `timeout` in hook config
