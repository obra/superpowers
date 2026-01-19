# Verify Both Locations When Using Worktrees and Update Tests After Architectural Changes

**Date:** 2026-01-19
**Session:** calendar-prep-mvp chat interface implementation
**Category:** verification, testing

## User Feedback

> "the files are there" (after I declared implementation failed by checking worktree only)
> "use the .env.local on root level" (when test failed due to missing Gemini API key)

## Problem 1: Incomplete Worktree Verification

During verification, I checked only the worktree location for implementation files and concluded the implementation failed when I found nothing there. User corrected me - files were in the main project directory.

**What happened:**
1. Created worktree at `.worktrees/chat-interface`
2. Invoked executing-plans agent with instruction to work in worktree path
3. Agent actually worked in main directory instead
4. During verification, only checked worktree location
5. Found no files → false alarm "implementation failed"
6. User: "the files are there" → checked main directory → all files present

**Root cause:** Assumed agent followed path instruction, only verified expected location.

## Problem 2: Test Infrastructure Out of Sync with Architecture

Lambda test failed with "Gemini API key not configured" error. The test infrastructure needed updating after switching from system-wide to per-user Gemini API keys.

**What happened:**
1. Implementation changed from system-wide `geminiApiKey` to per-user `user_config.credentials.gemini.apiKey`
2. Test script created mock user but didn't include `credentials.gemini.apiKey`
3. Test failed: "Gemini API key not configured for user test-user-mocked"
4. User: "use the .env.local on root level"
5. Added `credentials.gemini.apiKey: process.env.GEMINI_API_KEY` to mockUserConfig
6. Tests passed

**Root cause:** Test infrastructure wasn't updated when architectural patterns changed.

## Correct Pattern

### Pattern 1: Always Check Both Locations When Using Worktrees

When agents are involved with worktrees, verify BOTH locations:

```bash
# After agent completes
git status --short
git branch --show-current

# Check worktree
ls /path/to/.worktrees/feature-name/target/directory/

# Check main directory
ls /path/to/main-project/target/directory/

# Compare
if [ worktree has files ]; then
  echo "Agent worked in worktree (as expected)"
elif [ main has files ]; then
  echo "Agent worked in main directory (unexpected but okay)"
else
  echo "Implementation actually failed"
fi
```

**Don't assume agents follow path instructions - verify with evidence.**

### Pattern 2: Update Test Infrastructure After Architectural Changes

When implementation patterns change (especially auth/credentials):

1. **Identify affected test infrastructure:**
   ```bash
   grep -r "mockUserConfig\|test.*user\|mock.*credentials" packages/*/src/scripts/
   ```

2. **Update test fixtures to match new patterns:**
   - Old: System-wide `geminiApiKey` in secrets
   - New: Per-user `credentials.gemini.apiKey` in user_config
   - Test needs: `mockUserConfig.credentials.gemini.apiKey`

3. **Verify tests pass with new structure:**
   ```bash
   pnpm test
   # Should exit 0
   ```

## Examples

### Good: Checking Both Locations

```bash
# After executing-plans completes
files_in_worktree=$(find .worktrees/chat-interface/packages/admin-ui/app/chats -type f 2>/dev/null | wc -l)
files_in_main=$(find packages/admin-ui/app/chats -type f 2>/dev/null | wc -l)

if [ "$files_in_worktree" -gt 0 ]; then
  echo "✅ Implementation in worktree (expected location)"
elif [ "$files_in_main" -gt 0 ]; then
  echo "⚠️  Implementation in main directory (unexpected but present)"
  # Proceed with verification
else
  echo "❌ No implementation found"
fi
```

### Good: Test Infrastructure Update Checklist

After architectural change from system-wide to per-user credentials:

- [ ] Update mock user configs in test scripts
- [ ] Update test fixtures (mockSecrets → mockUserConfig)
- [ ] Verify all test scripts that create users
- [ ] Run full test suite
- [ ] Check for hardcoded references to old pattern

## Success Criteria

**Worktree verification:**
- Check both worktree AND main directory before declaring failure
- Use `git status` to see what actually changed
- Don't trust agent path instructions without verification

**Test infrastructure:**
- Tests pass after architectural changes
- Mock data matches new credential patterns
- No hardcoded references to deprecated patterns

## Related Learnings

- Agent working directory isn't guaranteed (verify after completion)
- Test failures may indicate infrastructure lag, not implementation bugs
