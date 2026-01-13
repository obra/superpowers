# Superpowers-NG Release Notes

## v0.1.0 (2026-01-13)

**Initial release** of Superpowers-NG, an enhanced fork of [obra/superpowers](https://github.com/obra/superpowers) with Manus-style persistent planning.

### New Features

#### Manus Planning System

**File-based planning that survives context resets**

Added `manus-planning` skill inspired by [planning-with-files](https://github.com/OthmanAdi/planning-with-files) by OthmanAdi. This enables long-running tasks that span multiple sessions or exceed 50 tool calls.

**The 3 Files** (`docs/manus/`):
- `task_plan.md` - Goal, 5 phases (Requirements → Planning → Implementation → Testing → Delivery), decisions table, errors log
- `findings.md` - Requirements, research, technical decisions, resources (critical for visual/browser content that doesn't persist in context)
- `progress.md` - Session log with timestamps, test results table, error log, 5-question reboot check for context resumption

**Key Features:**
- **Persistent memory**: Files survive context resets, enabling work across multiple sessions
- **Automatic reminders**: PreToolUse hooks show plan preview before Write/Edit/Bash operations (when `.active` marker exists)
- **2-Action Rule**: After every 2 view/browser/search operations, update `findings.md` to preserve discoveries
- **Archive system**: Completed tasks auto-archive to `docs/manus/archive/YYYY-MM-DD-<topic>/`, new tasks get prompted (continue or start new)
- **5 Phases**: Structured workflow from Requirements through Delivery with status tracking

**Files:**
- `skills/manus-planning/SKILL.md` - Main skill definition
- `skills/manus-planning/templates/task_plan.md` - Phase tracking template
- `skills/manus-planning/templates/findings.md` - Research storage template
- `skills/manus-planning/templates/progress.md` - Session log template
- `commands/manus-plan.md` - Slash command `/manus-plan`
- `hooks/manus-pretool.sh` - Conditional PreToolUse hook (only active when marker file exists)

#### Brainstorming Enhancement

**Planning choice after design**

Updated `brainstorming` skill to present both planning options after design completion:
1. **Native planning** (writing-plans → executing-plans): Short tasks, interactive development
2. **Manus planning** (manus-planning): Long runs, multi-session projects

When Manus is chosen, design document content is automatically copied into `findings.md` for persistent reference.

**File:**
- `skills/brainstorming/SKILL.md` - Updated "After the Design" section

#### Planning Guidance

**Added planning approach comparison**

Updated `using-superpowers` skill with "Planning Approaches" section explaining when to use Native vs Manus planning:

| Approach | Skills | Best For |
|----------|--------|----------|
| **Native** | writing-plans + executing-plans | Short tasks (<30 min), interactive development with human checkpoints |
| **Manus** | manus-planning | Long autonomous runs, multi-session projects, tasks requiring >50 tool calls |

**File:**
- `skills/using-superpowers/SKILL.md` - Added planning guidance section

### Technical Implementation

#### Hooks System Enhancement

**Conditional PreToolUse hook**

Added PreToolUse hook to `hooks.json` that fires before Write/Edit/Bash operations:
- Only outputs when `docs/manus/.active` marker file exists
- Displays first 30 lines of `task_plan.md` as context reminder
- Outputs empty JSON `{}` when inactive (no interference with native planning)
- Cross-platform compatible (uses same `run-hook.cmd` wrapper as SessionStart)

**Files:**
- `hooks/hooks.json` - Added PreToolUse matcher for Write|Edit|Bash
- `hooks/manus-pretool.sh` - Bash script with JSON escaping, checks marker file

### Breaking Changes

**Plugin renamed to superpowers-ng**

This fork is distributed separately from original superpowers:
- Plugin name: `superpowers-ng`
- Repository: `OniReimu/superpowers`
- Version reset to v0.1.0

**File:**
- `.claude-plugin/plugin.json` - Updated name, version, author, repository, added credits

### Credits

**Original Authors:**
- **Jesse Vincent (obra)** - [obra/superpowers](https://github.com/obra/superpowers) - Original Superpowers framework
- **Ahmad Othman Ammar Adi (OthmanAdi)** - [planning-with-files](https://github.com/OthmanAdi/planning-with-files) - Manus 3-file pattern

**Superpowers-NG:**
- **OniReimu** - Integration and enhancement

**Inspiration:**
- Manus AI (acquired by Meta for $2B) - Context engineering principles codified in planning-with-files

### Design Decisions

**Separate planning systems (no cross-style switching)**
- Native and Manus use different file formats and hooks
- Users choose one at the start based on task complexity
- Prevents format conflicts and unexpected behavior

**Marker file for conditional hooks**
- `.active` file enables/disables PreToolUse hooks
- Clean isolation: hooks don't fire for native planning
- Automatically removed on task completion

**Archive approach for multi-task handling**
- Completed tasks (no `.active`): Auto-archive to `docs/manus/archive/YYYY-MM-DD-<topic>/`
- In-progress tasks (`.active` exists): Prompt user to continue or start new
- Preserves history while keeping active location predictable

**Design document integration**
- Brainstorming → Manus flow copies design content into `findings.md`
- Becomes part of persistent research storage
- Accessible across context resets

### Known Limitations

**Installation requires manual setup**
- Marketplace integration pending
- Users must clone repository directly
- Will be resolved in future release

**No cross-platform testing**
- Hook script tested on macOS only
- Should work on Linux/Windows (uses polyglot wrapper)
- Community testing needed

### Upgrade Path

**For users of obra/superpowers:**
- Superpowers-NG is a separate fork, not a drop-in replacement
- Can install both plugins side-by-side
- Native planning workflows unchanged
- Manus planning is additive, opt-in feature

**For new users:**
- Start with either Native or Manus planning based on task
- Both workflows fully supported
- Brainstorming skill guides choice after design

### What's Next

**Planned enhancements:**
- Marketplace publication for easy installation
- Subagent handoff support (Task 8 from implementation plan)
- Template customization
- Cross-platform testing and validation
- Community feedback integration

---

**Full Changelog:** https://github.com/OniReimu/superpowers/compare/obra:main...OniReimu:main
**Issues:** https://github.com/OniReimu/superpowers/issues
**Original Superpowers:** https://github.com/obra/superpowers
**Planning-with-files:** https://github.com/OthmanAdi/planning-with-files
