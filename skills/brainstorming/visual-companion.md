# Visual Companion Reference

Quick reference for the browser-based visual brainstorming companion.

## Files

| File | Purpose |
|------|---------|
| `lib/brainstorm-server/start-server.sh` | Start server, outputs JSON with URL and session paths |
| `lib/brainstorm-server/stop-server.sh` | Stop server and clean up session directory |
| `lib/brainstorm-server/wait-for-feedback.sh` | Wait for user feedback (polling-based) |
| `lib/brainstorm-server/frame-template.html` | Base HTML template with CSS |
| `lib/brainstorm-server/CLAUDE-INSTRUCTIONS.md` | Detailed usage guide |

## Quick Start

```bash
# 1. Start server
${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/start-server.sh
# Returns: {"screen_dir":"/tmp/brainstorm-xxx","screen_file":"...","url":"http://localhost:PORT"}

# 2. Start watcher FIRST (background bash) - avoids race condition
${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/wait-for-feedback.sh $SCREEN_DIR

# 3. Write HTML to screen_file using Write tool (browser auto-refreshes)

# 4. Call TaskOutput(task_id, block=true, timeout=600000)
#    If timeout, call again. After 3 timeouts (30 min), prompt user.
# Returns: {"choice":"a","feedback":"user notes"}

# 5. Iterate or advance - update screen if feedback changes it, else next question

# 6. Clean up when done
${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/stop-server.sh $SCREEN_DIR
```

## Key Principles

- **Always ask first** before starting visual companion
- **Scale fidelity to the question** - wireframes for layout, polish for polish questions
- **Explain the question** on each page - what decision are you seeking?
- **Iterate before advancing** - if feedback changes current screen, update and re-show
- **2-4 options max** per screen

## CSS Classes

### Options (A/B/C choices)
```html
<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Title</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

### Cards (visual designs)
```html
<div class="cards">
  <div class="card" data-choice="x" onclick="toggleSelect(this)">
    <div class="card-image"><!-- mockup --></div>
    <div class="card-body">
      <h3>Name</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

### Mockup container
```html
<div class="mockup">
  <div class="mockup-header">Label</div>
  <div class="mockup-body"><!-- content --></div>
</div>
```

### Split view
```html
<div class="split">
  <div><!-- left --></div>
  <div><!-- right --></div>
</div>
```

### Pros/Cons
```html
<div class="pros-cons">
  <div class="pros"><h4>Pros</h4><ul><li>...</li></ul></div>
  <div class="cons"><h4>Cons</h4><ul><li>...</li></ul></div>
</div>
```

### Mock elements
```html
<div class="mock-nav">Nav items</div>
<div class="mock-sidebar">Sidebar</div>
<div class="mock-content">Content</div>
<button class="mock-button">Button</button>
<input class="mock-input" placeholder="Input">
<div class="placeholder">Placeholder area</div>
```

## User Feedback Format

```json
{
  "choice": "option-id",    // from data-choice attribute
  "feedback": "user notes"  // from feedback textarea
}
```

Both fields are optional - user may select without notes, or send notes without selection.
