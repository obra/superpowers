---
name: iOS Simulator Skill
description: Build, test, and automate iOS apps with accessibility-driven navigation. 13 production-ready scripts including ultra token-efficient Xcode build automation, log monitoring, intelligent simulator selection, and semantic UI navigation. Use when user wants to test iOS apps, navigate simulator UI, build Xcode projects, or automate iOS testing.
license: Apache-2.0
---

# iOS Simulator Skill

Build, test, and automate iOS applications with progressive disclosure and accessibility-first navigation. This skill provides 12 production-ready scripts for the complete iOS development lifecycle.

## What This Skill Does

Instead of pixel-based navigation (fragile, breaks on UI changes), use semantic navigation that understands what elements mean:

```bash
# ❌ Fragile - breaks if UI changes
idb ui tap 320 400  # What's at those coordinates?

# ✅ Robust - finds by meaning
python scripts/navigator.py --find-text "Login" --tap
```

## Prerequisites

Verify your environment is ready:

```bash
bash scripts/sim_health_check.sh
```

**Requires:**
- macOS 12+
- Xcode Command Line Tools
- Python 3
- IDB (optional but recommended)

## ⚠️ Important: Use Skill Scripts, Not Raw Tools

**Always use these skill scripts instead of running `xcrun simctl`, `idb`, or `xcodebuild` directly.**

Why? This skill provides:
- ✅ **Semantic navigation** - Find elements by meaning, not coordinates
- ✅ **Progressive disclosure** - Minimal output by default, details on demand
- ✅ **Structured data** - Consistent JSON output, not raw CLI text
- ✅ **Error handling** - Clear, actionable error messages
- ✅ **Token efficiency** - Optimized for AI agents (5-10 tokens vs 400+)

**What you lose by using raw tools:**
- Coordinate-based navigation (fragile, breaks on UI changes)
- Massive token consumption (entire build logs, full accessibility trees)
- Inconsistent output formats
- Generic error messages

**Example - Find and tap a button:**
```bash
# ❌ Fragile - uses raw coordinates
idb ui tap 320 400  # Which element is this? Will it work next week?

# ✅ Robust - semantic navigation with skill script
python scripts/navigator.py --find-text "Login" --tap
```

The 12 scripts in this skill cover all common workflows. **Only use raw tools if you need something not covered by these scripts.**

## Configuration (Optional)

The skill **automatically learns your simulator preferences**. No setup required!

### Auto-Learning Behavior

After each successful build, the skill remembers which simulator was used:

```json
# Created at: .claude/skills/ios-simulator-skill/config.json
{
  "device": {
    "last_used_simulator": "iPhone 16 Pro",
    "last_used_at": "2025-10-18T13:36:18Z"
  }
}
```

**Next time you build without `--simulator`, it uses the remembered device automatically.**

### Simulator Selection Priority

1. `--simulator` CLI flag ← One-off override
2. `preferred_simulator` in config ← Manual preference (always used)
3. `last_used_simulator` in config ← Auto-learned from successful builds
4. Auto-detect first available iPhone
5. Generic iOS Simulator ← Fallback

### Manual Preference (Optional)

To always use a specific simulator, edit the config:

```json
{
  "device": {
    "preferred_simulator": "iPhone 15 Pro Max"
  }
}
```

**Config location**: `.claude/skills/ios-simulator-skill/config.json` (created automatically on first build)

## Quick Navigation

**First time?** → Start with screen mapping
**Know what you want?** → Jump to the right script

## 12 Production Scripts

### Build & Development (2 scripts)

#### 1. Build & Test Automation - "Build and run tests"

Build Xcode projects with **ultra token-efficient progressive disclosure**:

```bash
# Build project (ultra-minimal output: 5-10 tokens)
python scripts/build_and_test.py --project MyApp.xcodeproj
# Output: Build: SUCCESS (0 errors, 3 warnings) [xcresult-20251018-143052]

# Get error details on demand
python scripts/build_and_test.py --get-errors xcresult-20251018-143052

# Get warning details
python scripts/build_and_test.py --get-warnings xcresult-20251018-143052

# Get full build log
python scripts/build_and_test.py --get-log xcresult-20251018-143052

# Get everything as JSON
python scripts/build_and_test.py --get-all xcresult-20251018-143052 --json

# List recent builds
python scripts/build_and_test.py --list-xcresults
```

**Traditional Options:**
```bash
# Build workspace with specific scheme
python scripts/build_and_test.py --workspace MyApp.xcworkspace --scheme MyApp

# Run tests
python scripts/build_and_test.py --project MyApp.xcodeproj --test

# Clean build with simulator selection
python scripts/build_and_test.py --project MyApp.xcodeproj --clean --simulator "iPhone 15 Pro"

# Verbose mode (for debugging)
python scripts/build_and_test.py --project MyApp.xcodeproj --verbose
```

**Output (default - ultra-minimal):**
```
Build: SUCCESS (0 errors, 3 warnings) [xcresult-20251018-143052]
```

**Output (progressive disclosure - get warnings):**
```
Warnings (3):

1. 'UIWebView' is deprecated
   Location: LoginView.swift:line 45

2. Unused variable 'tempValue'
   Location: DataModel.swift:line 112

3. ...
```

**Output (on failure):**
```
Build: FAILED (2 errors, 1 warnings) [xcresult-20251018-143100]
```

**Then get error details:**
```bash
python scripts/build_and_test.py --get-errors xcresult-20251018-143100
```

**Key Features:**
- ✅ **Ultra token-efficient**: Default output is 5-10 tokens
- ✅ **Progressive disclosure**: Load error/warning/log details only when needed
- ✅ **Native xcresult**: Uses Apple's official result bundle format
- ✅ **Structured data**: JSON output via xcresulttool
- ✅ **Cached results**: Access build details hours/days later

**Options:**

*Build/Test:*
- `--project` or `--workspace` - Xcode project/workspace path
- `--scheme` - Build scheme (auto-detected if not specified)
- `--configuration` - Debug or Release (default: Debug)
- `--clean` - Clean before building
- `--test` - Run test suite
- `--suite` - Specific test suite to run
- `--simulator` - Target simulator name

*Progressive Disclosure:*
- `--get-errors XCRESULT_ID` - Get error details
- `--get-warnings XCRESULT_ID` - Get warning details
- `--get-log XCRESULT_ID` - Get full build log
- `--get-all XCRESULT_ID` - Get complete details
- `--list-xcresults` - List recent build results

*Output:*
- `--verbose` - Show detailed output
- `--json` - Output as JSON

**Use when:** You need to build your app or run automated tests.

**Integrations:**
- Combines with `sim_health_check.sh` to verify environment first
- Uses `app_launcher.py` to install built app
- Works with `test_recorder.py` for test documentation

**Progressive Disclosure Workflow:**
1. Build returns minimal result + xcresult ID
2. Agent sees build failed
3. Agent requests error details using xcresult ID
4. Agent gets structured error list
5. Agent fixes errors and rebuilds

---

#### 2. Log Monitor - "Watch app logs in real-time"

Monitor simulator logs with intelligent filtering and error detection:

```bash
# Monitor app logs in real-time (follow mode)
python scripts/log_monitor.py --app com.myapp.MyApp --follow

# Capture logs for specific duration
python scripts/log_monitor.py --app com.myapp.MyApp --duration 30s

# Show errors and warnings only from last 5 minutes
python scripts/log_monitor.py --severity error,warning --last 5m

# Save logs to file
python scripts/log_monitor.py --app com.myapp.MyApp --duration 1m --output logs/

# Verbose output with full log lines
python scripts/log_monitor.py --app com.myapp.MyApp --duration 30s --verbose
```

**Output:**
```
Logs for: com.myapp.MyApp
Total lines: 342
Errors: 2, Warnings: 5, Info: 87

Top Errors (2):
  ❌ Network request failed: timeout after 30s
  ❌ Image loading failed: invalid URL

Top Warnings (5):
  ⚠️  Deprecated API usage: UIWebView
  ⚠️  Main thread performance warning: 2.3s
  ⚠️  Memory warning received
```

**Options:**
- `--app` - App bundle ID to filter logs
- `--severity` - Filter by severity (error,warning,info,debug)
- `--follow` - Continuous streaming (Ctrl+C to stop)
- `--duration` - Capture duration (e.g., 30s, 5m, 1h)
- `--last` - Show logs from last N minutes
- `--output` - Save logs to directory
- `--verbose` - Show detailed log lines
- `--json` - Output as JSON

**Use when:** You need to debug issues, monitor app behavior, or capture logs during testing.

**Integrations:**
- Enhanced version of `app_state_capture.py` log capture
- Runs alongside `test_recorder.py` for comprehensive test documentation
- Complements `navigator.py` - see logs while interacting with UI

---

### Navigation & Interaction (5 scripts)

#### 3. Screen Mapper - "What's on this screen?"

See current screen in 5 lines:

```bash
python scripts/screen_mapper.py
```

**Output:**
```
Screen: LoginViewController (45 elements, 7 interactive)
Buttons: "Login", "Cancel", "Forgot Password"
TextFields: 2 (0 filled)
Navigation: NavBar: "Sign In"
Focusable: 7 elements
```

**Options:**
- `--verbose` - Full element breakdown
- `--hints` - Navigation suggestions
- `--json` - Complete analysis object

**Use when:** You need to understand what's currently visible and where to navigate next.

---

#### 4. Navigator - "Tap and interact with specific elements"

Find and interact with UI elements by meaning:

```bash
# Find and tap a button
python scripts/navigator.py --find-text "Login" --tap

# Enter text into first text field
python scripts/navigator.py --find-type TextField --index 0 --enter-text "user@test.com"

# Tap by accessibility ID
python scripts/navigator.py --find-id "submitButton" --tap

# List all tappable elements
python scripts/navigator.py --list
```

**Finding strategies (in order of preference):**
1. By text (fuzzy matching): `--find-text "Button text"`
2. By type: `--find-type TextField`
3. By accessibility ID: `--find-id "elementID"`
4. By coordinates (fallback): `--tap-at 200,400`

**Output:**
```
Tapped: Button "Login" at (320, 450)
Entered text in: TextField "Username"
Not found: text='Submit'
```

**Use when:** You need to find specific elements and interact with them (tap, type).

---

#### 5. Gesture Controller - "Swipe, scroll, and complex gestures"

Perform navigation gestures:

```bash
# Directional swipes
python scripts/gesture.py --swipe up|down|left|right

# Scroll multiple times
python scripts/gesture.py --scroll down --scroll-amount 3

# Pull to refresh
python scripts/gesture.py --refresh

# Pinch to zoom
python scripts/gesture.py --pinch in|out

# Long press
python scripts/gesture.py --long-press 200,300 --duration 2.0

# Custom swipe
python scripts/gesture.py --swipe-from 100,500 --swipe-to 100,100
```

**Output:**
```
Swiped up
Scrolled down (3x)
Performed pull to refresh
```

**Use when:** You need to navigate using gestures (scrolling lists, dismissing overlays, etc.).

---

#### 6. Keyboard Controller - "Type and press buttons"

Text entry and hardware button control:

```bash
# Type text (fast)
python scripts/keyboard.py --type "hello@example.com"

# Type slowly (for animations)
python scripts/keyboard.py --type "slow typing" --slow

# Press special keys
python scripts/keyboard.py --key return          # Submit
python scripts/keyboard.py --key delete          # Delete character
python scripts/keyboard.py --key tab             # Next field
python scripts/keyboard.py --key space           # Space
python scripts/keyboard.py --key up|down|left|right  # Arrow keys

# Press hardware buttons
python scripts/keyboard.py --button home         # Go home
python scripts/keyboard.py --button lock         # Lock device
python scripts/keyboard.py --button volume-up    # Volume up
python scripts/keyboard.py --button screenshot   # Take screenshot

# Key sequences
python scripts/keyboard.py --key-sequence return,return,delete

# Clear field
python scripts/keyboard.py --clear

# Dismiss keyboard
python scripts/keyboard.py --dismiss
```

**Output:**
```
Typed: "hello@example.com"
Pressed return
Pressed home button
```

**Use when:** You need to enter text or press buttons (including hardware).

---

#### 7. App Launcher - "Start/stop apps and manage installation"

App lifecycle control:

```bash
# Launch app by bundle ID
python scripts/app_launcher.py --launch com.example.app

# Terminate app
python scripts/app_launcher.py --terminate com.example.app

# Restart app
python scripts/app_launcher.py --restart com.example.app

# Install app from bundle
python scripts/app_launcher.py --install /path/to/app.app

# Uninstall app
python scripts/app_launcher.py --uninstall com.example.app

# Open deep link
python scripts/app_launcher.py --open-url "myapp://profile/123"

# List installed apps
python scripts/app_launcher.py --list

# Check app state
python scripts/app_launcher.py --state com.example.app
```

**Output:**
```
Launched com.example.app (PID: 12345)
Installed /path/to/app.app
Opened URL: myapp://profile/123
Installed apps (15):
  com.example.app: My App (v1.0.0)
  ...
```

**Use when:** You need to control app lifecycle or manage app installation.

---

### Testing & Analysis (5 scripts)

#### 8. Accessibility Auditor - "Check WCAG compliance"

Find accessibility issues:

```bash
# Quick audit (default - top 3 issues)
python scripts/accessibility_audit.py

# Full detailed report
python scripts/accessibility_audit.py --verbose

# Save report to file
python scripts/accessibility_audit.py --output audit.json
```

**Output (default):**
```
Elements: 45, Issues: 7
Critical: 2, Warning: 3, Info: 2

Top issues:
  [critical] missing_label (2x) - Add accessibilityLabel
  [warning] missing_hint (3x) - Add accessibilityHint
  [info] no_identifier (2x) - Add accessibilityIdentifier for testing
```

**Checks for:**
- **Critical:** Missing labels on buttons, empty buttons, images without alt text
- **Warnings:** Missing hints on controls, small touch targets (< 44x44pt)
- **Info:** Missing automation identifiers, deep nesting (> 5 levels)

**Exit codes:**
- 0 = No critical issues (pass)
- 1 = Critical issues found (fail)

**Use when:** You need to verify accessibility compliance or find UI issues.

---

#### 9. Visual Differ - "Compare screenshots for visual changes"

Pixel-by-pixel screenshot comparison:

```bash
# Compare two screenshots
python scripts/visual_diff.py baseline.png current.png

# With custom threshold (1% = 0.01)
python scripts/visual_diff.py baseline.png current.png --threshold 0.02

# Detailed output
python scripts/visual_diff.py baseline.png current.png --details
```

**Output:**
```
Difference: 0.5% (PASS)
Changed pixels: 1,234
Artifacts saved to: ./
```

**Generated artifacts:**
- `diff.png` - Changes highlighted in red
- `side-by-side.png` - Baseline and current comparison
- `diff-report.json` - Detailed metrics

**Use when:** You need to detect visual regressions or compare UI states.

---

#### 10. Test Recorder - "Document test execution automatically"

Record test steps with screenshots and accessibility snapshots:

```bash
# Start recording (call from Python or use as module)
python scripts/test_recorder.py --test-name "Login Flow" --output test-reports/
```

**Then in your test code:**
```python
from scripts.test_recorder import TestRecorder

recorder = TestRecorder("Login Flow", output_dir="test-reports/")

# Record each step
recorder.step("Launch app")
recorder.step("Tap login button")
recorder.step("Enter credentials", metadata={"user": "test@example.com"})
recorder.step("Verify login", assertion="Home screen visible")

# Generate report
recorder.generate_report()
```

**Output structure:**
```
test-reports/login-flow-TIMESTAMP/
├── report.md (Markdown with screenshots)
├── metadata.json (Complete timing data)
├── screenshots/ (Numbered screenshots per step)
└── accessibility/ (UI trees per step)
```

**Use when:** You need to document test execution with visual proof and timing data.

---

#### 11. App State Capture - "Create debugging snapshots"

Capture complete app state for bug reproduction:

```bash
# Capture everything
python scripts/app_state_capture.py --app-bundle-id com.example.app

# Custom output location and log lines
python scripts/app_state_capture.py \
  --app-bundle-id com.example.app \
  --output bug-reports/ \
  --log-lines 200
```

**Output:**
```
State captured: app-state-TIMESTAMP/
Issues found: 2 errors, 1 warning
Elements: 45
```

**Captures:**
- Screenshot of current screen
- Full accessibility tree (UI hierarchy)
- Recent app logs (filtered by app)
- Device information
- Error/warning counts
- Markdown summary

**Generated files:**
```
app-state-TIMESTAMP/
├── screenshot.png
├── accessibility-tree.json (full UI hierarchy)
├── app-logs.txt (recent logs)
├── device-info.json
├── summary.json (metadata)
└── summary.md (human-readable)
```

**Use when:** You need to capture the complete state for debugging or bug reports.

---

#### 12. Environment Health Check - "Verify everything is set up correctly"

Verify your environment before testing:

```bash
bash scripts/sim_health_check.sh
```

**Checks (8 total):**
1. macOS version
2. Xcode Command Line Tools
3. simctl availability
4. IDB installation
5. Python 3 installation
6. Available simulators
7. Booted simulators
8. Python packages (Pillow for visual_diff)

**Output:**
```
✓ macOS detected (version 14.1.1)
✓ Xcode Command Line Tools installed
✓ simctl is available
⚠ IDB not found (optional, for advanced features)
✓ Python 3 is installed (3.11.0)
✓ Found 6 available simulator(s)
⚠ No simulators currently booted
✓ Pillow (PIL) installed
```

**Exit codes:**
- 0 = Ready to test
- 1 = Fix issues before testing

**Use when:** Starting fresh or troubleshooting environment problems.

---

## Complete Workflow Examples

### Example 1: Login Automation

```bash
# 1. Check environment
bash scripts/sim_health_check.sh

# 2. Launch app
python scripts/app_launcher.py --launch com.example.app

# 3. See what's on screen
python scripts/screen_mapper.py

# 4. Fill login form
python scripts/navigator.py --find-type TextField --index 0 --enter-text "user@test.com"
python scripts/navigator.py --find-type SecureTextField --enter-text "password123"

# 5. Submit
python scripts/navigator.py --find-text "Login" --tap

# 6. Check for accessibility issues
python scripts/accessibility_audit.py
```

### Example 2: Scroll and Verify

```bash
# See current screen
python scripts/screen_mapper.py

# Scroll down to see more
python scripts/gesture.py --scroll down --scroll-amount 3

# Find and tap a result
python scripts/navigator.py --find-text "Search Result" --tap
```

### Example 3: Visual Regression Testing

```bash
# Capture baseline
python scripts/app_state_capture.py --output baseline/

# Make changes...

# Capture current state
python scripts/app_state_capture.py --output current/

# Compare visually
python scripts/visual_diff.py baseline/screenshot.png current/screenshot.png --threshold 0.02
```

### Example 4: Full Test Documentation

```bash
# Start recording
python scripts/test_recorder.py --test-name "User Registration" --output test-reports/

# In your test (Python):
# recorder.step("View registration form")
# recorder.step("Enter name", metadata={"name": "John Doe"})
# recorder.step("Enter email", metadata={"email": "john@example.com"})
# recorder.step("Submit form")
# recorder.step("Verify confirmation", assertion="Success message visible")
# recorder.generate_report()

# Get complete report in: test-reports/user-registration-TIMESTAMP/report.md
```

### Example 5: Debug a Problem

```bash
# Capture everything for analysis
python scripts/app_state_capture.py \
  --app-bundle-id com.example.app \
  --output bug-reports/ \
  --log-lines 200

# Creates bug-reports/app-state-TIMESTAMP/ with:
# - Current screenshot
# - Full UI hierarchy
# - App logs
# - Device info
# - summary.md (human-readable)
```

---

## Decision Tree

```
Want to...

├─ Build your Xcode app or run tests?
│  └─ python scripts/build_and_test.py --project MyApp.xcodeproj
│
├─ Watch app logs in real-time?
│  └─ python scripts/log_monitor.py --app com.app.id --follow
│
├─ See what's on screen?
│  └─ python scripts/screen_mapper.py
│
├─ Tap a button or enter text?
│  └─ python scripts/navigator.py --find-text "..." --tap
│
├─ Scroll or swipe?
│  └─ python scripts/gesture.py --scroll down
│
├─ Type or press keys?
│  └─ python scripts/keyboard.py --type "..."
│
├─ Launch/stop an app?
│  └─ python scripts/app_launcher.py --launch com.app.id
│
├─ Check accessibility?
│  └─ python scripts/accessibility_audit.py
│
├─ Compare screenshots?
│  └─ python scripts/visual_diff.py baseline.png current.png
│
├─ Document a test?
│  └─ python scripts/test_recorder.py --test-name "Test Name"
│
├─ Debug a problem?
│  └─ python scripts/app_state_capture.py --app-bundle-id com.app.id
│
├─ Pick which simulator to use?
│  └─ python scripts/simulator_selector.py --suggest
│
└─ Verify environment?
   └─ bash scripts/sim_health_check.sh
```

---

## Selecting a Simulator - The Smart Way

When you first start testing, Claude can **automatically suggest the best simulator for you**:

```bash
# Get top 4 recommended simulators
python scripts/simulator_selector.py --suggest
```

**Output example:**
```
Available Simulators:

1. iPhone 16 Pro (iOS 18.0)
   Recommended, Latest iOS, #1 common model
   UDID: 67A99DF0-27BD-4507-A3DE-B7D8C38F764A

2. iPhone 16 Pro Max (iOS 18.0)
   Latest iOS, #1 common model
   UDID: 3CF3A78B-F899-4C50-A158-3707C6E16E15

3. iPhone 16 (iOS 18.0)
   Latest iOS, #2 common model
   UDID: 20D618BD-AB45-41E5-8A4C-C11890E49205

4. iPhone 15 Pro (iOS 17.5)
   #1 common model
   UDID: E4190DEA-B937-4331-A58E-15C747722308
```

### How Claude Helps

When Claude sees this, it will:
1. **Parse the suggestions** as JSON
2. **Ask you to pick** from the top options
3. **Boot your choice** automatically
4. **Remember your preference** for next time

**How it ranks simulators:**

1. **Recently used** ← If you picked iPhone 16 Pro last time, it suggests it first
2. **Latest iOS version** ← Testing on current iOS is important
3. **Common models** ← iPhone 16 Pro, iPhone 15, iPhone SE (best for testing)
4. **Currently booted** ← If one's already running, suggest it

### Using the Selector

```bash
# Get top N suggestions (default: 4)
python scripts/simulator_selector.py --suggest --count 3

# Get suggestions as JSON for programmatic use
python scripts/simulator_selector.py --suggest --json

# List all available simulators
python scripts/simulator_selector.py --list

# Boot a specific simulator
python scripts/simulator_selector.py --boot 67A99DF0-27BD-4507-A3DE-B7D8C38F764A
```

### Auto-Learning

The skill **remembers which simulator you used last time**:

```json
# Saved in: .claude/skills/ios-simulator-skill/config.json
{
  "device": {
    "last_used_simulator": "iPhone 16 Pro",
    "last_used_at": "2025-10-18T16:50:00Z"
  }
}
```

Next time you test, the selector will suggest your previous device first.

---

## Token Efficiency

All scripts are optimized for minimal output:

| Operation | Raw Output | Skill Output | Savings |
|-----------|-----------|-------------|---------|
| Screen analysis | 200+ lines | 5 lines | 97.5% |
| Find & tap | 100+ lines | 1 line | 99% |
| Type text | 50+ lines | 1 line | 98% |
| Login flow | 400+ lines | 15 lines | 96% |

**Default modes:**
- ✅ Minimal output (3-5 lines)
- ✅ `--verbose` for details
- ✅ `--json` for machine-readable format

---

## Accessibility-First Philosophy

**Why semantic navigation instead of coordinates?**

```bash
# Fragile - breaks on any UI change
idb ui tap 320 400

# Robust - works even if layout changes
python scripts/navigator.py --find-text "Login" --tap
```

**Benefits:**
- Works across different screen sizes
- Survives UI redesigns
- Matches human understanding of the app
- Faster (no pixel processing)
- More reliable (structured data)

---

## When to Use Raw Tools (Advanced)

The 12 scripts in this skill cover all standard workflows. Raw tools should only be used for edge cases not covered:

```bash
# ✅ Covered by skill - use script
python scripts/navigator.py --find-text "Login" --tap

# ⚠️ Not covered - only then use raw tool
idb ui tap 320 400  # Only if you absolutely need coordinates

# ✅ Covered by skill - use script
python scripts/app_launcher.py --launch com.example.app

# ⚠️ Not covered - only then use raw tool
xcrun simctl launch booted com.example.app  # Bypass all skill benefits
```

**Benefits you get with skill scripts:**
- Robust semantic navigation (survives UI changes)
- Token-efficient output (5-10 tokens vs 400+)
- Structured error messages (clear fixes)
- Consistent output across all scripts

**What you lose with raw tools:**
- Fragile coordinate-based navigation
- Massive token consumption
- Unstructured output
- Generic error messages

**Rule of thumb:** If one of the 12 scripts can do the job, use it. Never use raw tools for standard operations.

---

## Help for Each Script

All scripts provide detailed help:

```bash
# Simulator Selection
python scripts/simulator_selector.py --help

# Development & Testing
python scripts/build_and_test.py --help
python scripts/log_monitor.py --help

# Navigation & Interaction
python scripts/screen_mapper.py --help
python scripts/navigator.py --help
python scripts/gesture.py --help
python scripts/keyboard.py --help
python scripts/app_launcher.py --help

# Testing & Analysis
python scripts/accessibility_audit.py --help
python scripts/visual_diff.py --help
python scripts/test_recorder.py --help
python scripts/app_state_capture.py --help

# Environment
bash scripts/sim_health_check.sh --help
```

---

## Best Practices

1. **Always start with screen mapping** - Understand what's on screen before navigating
2. **Use semantic finding** - Find by text or type, not coordinates
3. **Verify state after actions** - Use screen_mapper to confirm navigation worked
4. **Minimize verbose output** - Only use `--verbose` when debugging
5. **Capture state for bugs** - Use app_state_capture for reproduction
6. **Check accessibility** - Run accessibility_audit after major changes
7. **Use test_recorder** - Document important workflows for team reference

---

## Troubleshooting

**Environment issues?**
```bash
bash scripts/sim_health_check.sh
```

**Element not found?**
```bash
python scripts/screen_mapper.py --verbose
# See all elements, then try partial text matching
```

**App won't launch?**
```bash
python scripts/app_launcher.py --list  # Find correct bundle ID
python scripts/app_launcher.py --launch <correct-bundle-id>
```

**Gesture not working?**
- Ensure simulator is in foreground
- Try smaller swipe distances
- Check screen dimensions

---

## Next Steps

1. Run `bash scripts/sim_health_check.sh` to verify your environment
2. **Get simulator recommendations**: `python scripts/simulator_selector.py --suggest`
3. Claude will ask which simulator you want to use (top 3-4 recommended)
4. Launch your app: `python scripts/app_launcher.py --launch com.your.app`
5. Map the screen: `python scripts/screen_mapper.py`
6. Start navigating with `python scripts/navigator.py`

For detailed documentation on each script, see `CLAUDE.md` and the `references/` directory.

---

**Built for AI agents. Optimized for humans. Made for building and testing iOS apps efficiently.**
