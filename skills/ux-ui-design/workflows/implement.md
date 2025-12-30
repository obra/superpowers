<required_reading>
**Read these reference files as needed:**
1. `references/accessibility.md` - Implementation patterns for a11y
2. `references/design-systems.md` - Token usage in code
3. `references/tools.md` - Component libraries, testing tools
</required_reading>

<objective>
Translate approved designs into accessible, maintainable code that matches the design pixel-perfect. Only start coding after design is reviewed and approved.

**You cannot skip design review.** Implementing unreviewed designs ships usability bugs and accessibility violations.
</objective>

<figma_to_code>
**Extract design context before implementing:**

```
1. Get Figma URL from user
2. Extract fileKey and nodeId from URL
3. Use mcp__figma__get_design_context to get:
   - Generated code structure
   - Design tokens used
   - Asset download URLs
4. Use mcp__figma__get_variable_defs for design system variables
5. Use mcp__figma__get_screenshot for visual reference
```

**Example extraction:**
```
URL: https://figma.com/design/ABC123/MyApp?node-id=1-2
fileKey: ABC123
nodeId: 1:2

Call: mcp__figma__get_design_context(fileKey="ABC123", nodeId="1:2")
Returns: Code structure, tokens, assets
```
</figma_to_code>

<process>

<step_1>
**Verify Design Approval**

Before writing any code:
- [ ] Design has passed Review workflow
- [ ] Critical/high issues from review are resolved
- [ ] Stakeholders have approved the design
- [ ] Implementation scope is clear

**If design isn't approved:** Return to Review or Design workflow.
</step_1>

<step_2>
**Analyze Design Structure**

Break down the design into components:

```
Page/Screen
├── Header Component
│   ├── Logo
│   ├── Navigation
│   └── User Menu
├── Main Content
│   ├── Hero Section
│   ├── Card Grid
│   │   └── Card Component (reusable)
│   └── CTA Section
└── Footer Component
```

**Identify:**
- Reusable components (build once, use everywhere)
- Existing design system components (don't rebuild)
- New components needed (build from scratch)
- Layout patterns (grid, flexbox, container queries)
</step_2>

<step_3>
**Set Up Design Tokens**

Map design tokens to code:

**CSS Custom Properties:**
```css
:root {
  /* Colors - from design system */
  --color-primary: #0066CC;
  --color-text: #1A1A1A;
  --color-text-secondary: #666666;
  --color-error: #D32F2F;
  --color-success: #2E7D32;

  /* Typography - from design system */
  --font-family: 'Inter', sans-serif;
  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-base: 1rem;    /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */

  /* Spacing - from design system */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;
}
```

**Never hardcode values.** Always use tokens:
- ❌ `color: #0066CC;`
- ✅ `color: var(--color-primary);`

- ❌ `padding: 16px;`
- ✅ `padding: var(--spacing-4);`
</step_3>

<step_4>
**Build Components with Accessibility**

Every component must be accessible from the start.

**Semantic HTML first:**
```html
<!-- ❌ Wrong -->
<div class="button" onclick="submit()">Submit</div>

<!-- ✅ Correct -->
<button type="submit">Submit</button>
```

**ARIA when HTML isn't enough:**
```html
<!-- Custom dropdown needs ARIA -->
<div role="combobox" aria-expanded="false" aria-haspopup="listbox">
  <input type="text" aria-autocomplete="list" />
  <ul role="listbox" aria-label="Options">
    <li role="option" aria-selected="false">Option 1</li>
  </ul>
</div>
```

**Keyboard handlers:**
```javascript
// All custom interactive elements need keyboard support
element.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'Enter':
    case ' ':
      activateElement();
      break;
    case 'Escape':
      closeElement();
      break;
    case 'ArrowDown':
      focusNext();
      break;
    case 'ArrowUp':
      focusPrevious();
      break;
  }
});
```

**Focus management:**
```javascript
// After modal opens, focus first interactive element
modal.addEventListener('open', () => {
  modal.querySelector('button, input, [tabindex="0"]').focus();
});

// Trap focus inside modal
modal.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    // Keep focus within modal
  }
});
```
</step_4>

<step_5>
**Implement All States**

Every component needs multiple states:

**Component states:**
```css
.button {
  /* Default */
  background: var(--color-primary);
}
.button:hover {
  /* Hover */
  background: var(--color-primary-dark);
}
.button:active {
  /* Active/pressed */
  background: var(--color-primary-darker);
}
.button:focus-visible {
  /* Keyboard focus */
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
.button:disabled {
  /* Disabled */
  opacity: 0.5;
  cursor: not-allowed;
}
.button[aria-busy="true"] {
  /* Loading */
  pointer-events: none;
}
```

**Screen states:**
```jsx
function DataScreen() {
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!data?.length) return <EmptyState onAction={createFirst} />;
  return <DataList data={data} />;
}
```
</step_5>

<step_6>
**Build Responsive**

Mobile-first approach:

```css
/* Base styles for mobile */
.container {
  padding: var(--spacing-4);
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-6);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: var(--spacing-8);
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

**Test on real devices:**
- Don't just resize browser window
- Test on actual phones/tablets
- Check touch interactions
- Verify touch target sizes (≥44x44px)
</step_6>

<step_7>
**Verify Implementation**

**Visual verification:**
- [ ] Matches design pixel-perfect (overlay comparison)
- [ ] All states implemented (hover, active, focus, disabled, loading, error)
- [ ] Responsive works on actual devices
- [ ] Design system tokens used (no hardcoded values)

**Accessibility verification:**
- [ ] Keyboard navigation works for entire flow
- [ ] Focus indicators visible on all interactive elements
- [ ] Tab order is logical
- [ ] Screen reader announces correctly (test with VoiceOver/NVDA)
- [ ] Color contrast verified (axe DevTools, WAVE)

**Functional verification:**
- [ ] Happy path works
- [ ] Error states handle gracefully
- [ ] Edge cases handled (empty, long text, missing data)
- [ ] Loading states show appropriate feedback

Run automated testing:
```bash
# Accessibility testing
npx axe-cli http://localhost:3000/page

# Or in tests
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('page is accessible', async () => {
  const { container } = render(<Page />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```
</step_7>

</process>

<component_checklist>
**Every component must have:**

<accessibility_requirements>
- [ ] Semantic HTML elements used
- [ ] ARIA attributes where HTML isn't enough
- [ ] Keyboard handlers for custom interactions
- [ ] Focus management (visible indicators, logical order)
- [ ] Screen reader testing passed
</accessibility_requirements>

<visual_requirements>
- [ ] Uses design system tokens only
- [ ] All states styled (hover, active, focus, disabled, loading, error)
- [ ] Responsive at all breakpoints
- [ ] Matches design pixel-perfect
</visual_requirements>

<code_requirements>
- [ ] Props typed (TypeScript)
- [ ] Edge cases handled
- [ ] Tests written
- [ ] Storybook stories (if using)
</code_requirements>
</component_checklist>

<anti_patterns>
| Pattern | Why It Fails |
|---------|--------------|
| "Close enough to design" | Visual inconsistency, breaks trust |
| "I'll add accessibility later" | 3x harder to retrofit, ships broken |
| Hardcoding values | Design system drift, unmaintainable |
| "Basic keyboard support is fine" | Partial accessibility excludes users |
| Testing only in browser resize | Real devices behave differently |
| Skipping states (loading, error, empty) | Users hit these constantly |
</anti_patterns>

<success_criteria>
Implementation is complete when:
- [ ] Matches design pixel-perfect (verified with overlay)
- [ ] All component states implemented
- [ ] Full keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Automated accessibility tests pass
- [ ] Design system tokens used exclusively
- [ ] Responsive on actual devices
- [ ] Ready for user testing (Iterate workflow)
</success_criteria>
