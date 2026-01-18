# Visual Companion Reference

Quick reference for using the visual brainstorming companion.

## Files

| File | Purpose |
|------|---------|
| `lib/brainstorm-server/start-server.sh` | Start server, outputs JSON with URL |
| `lib/brainstorm-server/stop-server.sh` | Stop server and clean up |
| `lib/brainstorm-server/wait-for-event.sh` | Wait for user feedback |
| `lib/brainstorm-server/frame-template.html` | Base HTML template with CSS |
| `lib/brainstorm-server/CLAUDE-INSTRUCTIONS.md` | Detailed usage guide |
| `/tmp/brainstorm/screen.html` | Write your screens here |
| `/tmp/brainstorm/.server.log` | Server output (for watcher) |

## Quick Start

```bash
# 1. Start server
${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/start-server.sh
# Returns: {"type":"server-started","port":52341,"url":"http://localhost:52341"}

# 2. Write screen
# Write HTML to /tmp/brainstorm/screen.html

# 3. Wait for feedback (background)
${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/wait-for-event.sh /tmp/brainstorm/.server.log

# 4. Read watcher output when it completes
# Returns: {"choice":"a","feedback":"user notes"}

# 5. Clean up when done
${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/stop-server.sh
```

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
