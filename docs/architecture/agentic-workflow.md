
User sends a prompt
        │
        ▼
┌─ skill-activator.js (UserPromptSubmit hook) ──────────────┐
│  Is this a micro-task? ("fix typo on line 42")            │
│    YES → {} (no routing, zero overhead)                   │
│    NO  → Score against 14 skill rules                     │
│          Score < 2? → {} (weak match, skip)               │
│          Score ≥ 2? → Inject skill suggestions            │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌─ using-superpowers (always loaded at SessionStart) ───────┐
│  Classify: micro / lightweight / full                     │
│                                                           │
│  MICRO → just do it                                       │
│  LIGHTWEIGHT → implement → verification-before-completion │
│  FULL → route to appropriate pipeline:                    │
│    New feature → brainstorming → writing-plans → execute  │
│    Bug/error  → systematic-debugging → TDD → verify       │
│    Review     → requesting-code-review (w/ security)      │
│    Done?      → verification-before-completion            │
│    Merge?     → finishing-a-development-branch            │
└───────────────────────────────────────────────────────────┘
        │
        ▼  (meanwhile, running on every tool call)
┌─ Safety Hooks (PreToolUse) ───────────────────────────────┐
│  block-dangerous-commands.js → 30+ patterns (rm -rf, etc) │
│  protect-secrets.js → 50+ patterns (.env, SSH keys, etc)  │
└───────────────────────────────────────────────────────────┘
        │
        ▼  (after every Edit/Write)
┌─ Tracking Hooks (PostToolUse) ────────────────────────────┐
│  track-edits.js → logs file changes for TDD reminders     │
│  track-session-stats.js → logs skill invocations          │
└───────────────────────────────────────────────────────────┘
        │
        ▼  (when Claude stops responding)
┌─ Stop Hook ───────────────────────────────────────────────┐
│  stop-reminders.js →                                      │
│    "5 source files modified without tests"                │
│    "12 files changed, consider committing"                │
│    "Session: 45min, 8 skill invocations [debugging 3x]"   │
└───────────────────────────────────────────────────────────┘