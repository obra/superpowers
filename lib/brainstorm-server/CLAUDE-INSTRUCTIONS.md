# Visual Companion Instructions for Claude

This document explains how to use the brainstorm visual companion to show mockups, designs, and options to users without resorting to ASCII art.

## When to Use

Use the visual companion when you need to show:
- **UI mockups** - layouts, navigation patterns, component designs
- **Design comparisons** - "Which of these 3 approaches works better?"
- **Interactive prototypes** - clickable wireframes
- **Visual choices** - anything where seeing beats describing

**Don't use it for:** simple text questions, code review, or when the user prefers terminal-only interaction.

## Lifecycle

```bash
# Start server (returns JSON with URL and session paths)
${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/start-server.sh
# Returns: {"type":"server-started","port":52341,"url":"http://localhost:52341",
#           "screen_dir":"/tmp/brainstorm-12345-1234567890",
#           "screen_file":"/tmp/brainstorm-12345-1234567890/screen.html"}

# Save screen_dir and screen_file from response!

# Tell user to open the URL in their browser

# Write screens to screen_file (auto-refreshes)

# Wait for user feedback:
# 1. Start watcher in background
${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/wait-for-event.sh $SCREEN_DIR/.server.log
# 2. Immediately call TaskOutput(task_id, block=true) to wait for completion

# When done, stop server (pass screen_dir)
${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/stop-server.sh $SCREEN_DIR
```

## Writing Screens

Copy the frame template structure but replace `#claude-content` with your content:

```html
<div id="claude-content">
  <h2>Your Question</h2>
  <p class="subtitle">Brief context</p>

  <!-- Your content here -->
</div>
```

The frame template (`frame-template.html`) includes CSS for:
- OS-aware light/dark theming
- Fixed header and feedback footer
- Common UI patterns (see below)

## CSS Helper Classes

### Options (A/B/C choices)

```html
<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Option Title</h3>
      <p>Description of this option</p>
    </div>
  </div>
  <!-- More options... -->
</div>
```

### Cards (visual designs)

```html
<div class="cards">
  <div class="card" data-choice="design1" onclick="toggleSelect(this)">
    <div class="card-image">
      <!-- Put mockup content here -->
    </div>
    <div class="card-body">
      <h3>Design Name</h3>
      <p>Brief description</p>
    </div>
  </div>
</div>
```

### Mockup Container

```html
<div class="mockup">
  <div class="mockup-header">Preview: Dashboard Layout</div>
  <div class="mockup-body">
    <!-- Your mockup HTML -->
  </div>
</div>
```

### Split View (side-by-side)

```html
<div class="split">
  <div class="mockup"><!-- Left side --></div>
  <div class="mockup"><!-- Right side --></div>
</div>
```

### Pros/Cons

```html
<div class="pros-cons">
  <div class="pros">
    <h4>Pros</h4>
    <ul>
      <li>Benefit one</li>
      <li>Benefit two</li>
    </ul>
  </div>
  <div class="cons">
    <h4>Cons</h4>
    <ul>
      <li>Drawback one</li>
      <li>Drawback two</li>
    </ul>
  </div>
</div>
```

### Inline Mockup Elements

```html
<div class="mock-nav">Logo | Home | About | Contact</div>
<div style="display: flex;">
  <div class="mock-sidebar">Navigation</div>
  <div class="mock-content">Main content area</div>
</div>
<button class="mock-button">Action Button</button>
<input class="mock-input" placeholder="Input field">
```

## User Feedback

When the user clicks Send, you receive JSON like:

```json
{"choice": "a", "feedback": "I like this but make the header smaller"}
```

- `choice` - which option/card they selected (from `data-choice` attribute)
- `feedback` - any notes they typed

## Example: Design Comparison

```html
<div id="claude-content">
  <h2>Which blog layout works better?</h2>
  <p class="subtitle">Consider readability and visual hierarchy</p>

  <div class="cards">
    <div class="card" data-choice="classic" onclick="toggleSelect(this)">
      <div class="card-image">
        <div style="padding: 1rem;">
          <div class="mock-nav">Blog Title</div>
          <div style="padding: 1rem;">
            <h3 style="margin-bottom: 0.5rem;">Post Title</h3>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">
              Content preview text goes here...
            </p>
          </div>
        </div>
      </div>
      <div class="card-body">
        <h3>Classic Layout</h3>
        <p>Traditional blog with posts in a single column</p>
      </div>
    </div>

    <div class="card" data-choice="magazine" onclick="toggleSelect(this)">
      <div class="card-image">
        <div style="padding: 1rem;">
          <div class="mock-nav">Blog Title</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; padding: 0.5rem;">
            <div class="placeholder" style="padding: 1rem;">Featured</div>
            <div class="placeholder" style="padding: 0.5rem;">Post</div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <h3>Magazine Layout</h3>
        <p>Grid-based with featured posts</p>
      </div>
    </div>
  </div>
</div>
```

## Tips

1. **Keep mockups simple** - Focus on layout and structure, not pixel-perfect design
2. **Use placeholders** - The `.placeholder` class works great for content areas
3. **Label clearly** - Use `.mockup-header` to explain what each mockup shows
4. **Limit choices** - 2-4 options is ideal; more gets overwhelming
5. **Provide context** - Use `.subtitle` to explain what you're asking
6. **Regenerate fully** - Write the complete HTML each turn; don't try to patch
