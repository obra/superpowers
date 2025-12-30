<overview>
Design systems provide consistent, reusable design decisions as tokens, components, and patterns. This reference covers design system principles, token usage, and compliance.
</overview>

<design_tokens>

<what_are_tokens>
Design tokens are the smallest pieces of a design system—named values that replace hardcoded values:

```css
/* Instead of hardcoded values */
color: #0066CC;
font-size: 16px;
padding: 16px;

/* Use design tokens */
color: var(--color-primary);
font-size: var(--font-size-base);
padding: var(--spacing-4);
```
</what_are_tokens>

<token_categories>

<color_tokens>
```css
/* Brand colors */
--color-primary: #0066CC;
--color-primary-light: #3399FF;
--color-primary-dark: #004499;

/* Semantic colors */
--color-text-primary: #1A1A1A;
--color-text-secondary: #666666;
--color-text-disabled: #999999;

/* Feedback colors */
--color-success: #2E7D32;
--color-warning: #ED6C02;
--color-error: #D32F2F;
--color-info: #0288D1;

/* Surface colors */
--color-background: #FFFFFF;
--color-surface: #F5F5F5;
--color-border: #E0E0E0;
```
</color_tokens>

<typography_tokens>
```css
/* Font families */
--font-family-body: 'Inter', sans-serif;
--font-family-heading: 'Inter', sans-serif;
--font-family-mono: 'Fira Code', monospace;

/* Font sizes */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */

/* Font weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Line heights */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```
</typography_tokens>

<spacing_tokens>
```css
/* Base unit: 4px */
--spacing-0: 0;
--spacing-px: 1px;
--spacing-0.5: 2px;
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
--spacing-16: 64px;
--spacing-20: 80px;
--spacing-24: 96px;
```
</spacing_tokens>

<effect_tokens>
```css
/* Border radius */
--radius-none: 0;
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.1);

/* Transitions */
--transition-fast: 150ms ease;
--transition-normal: 300ms ease;
--transition-slow: 500ms ease;
```
</effect_tokens>

</token_categories>

</design_tokens>

<component_patterns>

<component_structure>
**Well-designed components have:**
- Clear API (props/variants)
- Multiple states (default, hover, active, focus, disabled, loading)
- Accessibility built-in
- Design token usage only
- Documentation and examples
</component_structure>

<button_example>
```jsx
// Button component API
<Button
  variant="primary" | "secondary" | "ghost"
  size="sm" | "md" | "lg"
  disabled={boolean}
  loading={boolean}
  leftIcon={ReactNode}
  rightIcon={ReactNode}
>
  Label
</Button>
```

```css
/* Button uses tokens */
.button {
  font-family: var(--font-family-body);
  font-size: var(--font-size-base);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.button-primary {
  background: var(--color-primary);
  color: white;
}

.button-primary:hover {
  background: var(--color-primary-dark);
}
```
</button_example>

<form_components>
**Input fields:**
- Label (visible, not placeholder-only)
- Help text (optional)
- Error state with message
- Disabled state
- Focus state

**Common patterns:**
- Text input
- Select/dropdown
- Checkbox
- Radio group
- Toggle switch
- Textarea
- File upload
</form_components>

</component_patterns>

<compliance>

<rules>
**Design system is law, not guidelines:**

1. **Use tokens exclusively** - No hardcoded colors, fonts, or spacing
2. **Use existing components** - Don't rebuild what exists
3. **Follow interaction patterns** - Consistent behavior across app
4. **Document deviations** - Any exception needs justification
5. **Propose additions** - Missing something? Add to system, don't work around
</rules>

<deviation_process>
When design system doesn't have what you need:

1. **Check twice** - Is there really no existing solution?
2. **Use closest option** - Can existing token/component work?
3. **Propose addition** - Document the gap and proposed solution
4. **Get approval** - Design system owner reviews
5. **Add to system** - Update design system, then use
6. **Never hack** - Don't use custom values "just this once"
</deviation_process>

<compliance_checklist>
Before finalizing design:
- [ ] All colors from token palette
- [ ] All typography from type scale
- [ ] All spacing from spacing scale
- [ ] Using existing components where available
- [ ] Any custom values documented and approved
- [ ] Consistent with rest of application
</compliance_checklist>

</compliance>

<maintaining_systems>

<documentation>
**Every token/component needs:**
- Name and description
- Usage guidelines (when to use, when not to use)
- Code examples
- Visual examples
- Accessibility notes
</documentation>

<versioning>
**Handle updates carefully:**
- Semantic versioning for breaking changes
- Migration guides for major updates
- Deprecation warnings before removal
- Testing across consuming applications
</versioning>

</maintaining_systems>

<tools>
- **Figma Variables** - Design-side token management
- **Style Dictionary** - Token transformation and export
- **Storybook** - Component documentation and testing
- **Chromatic** - Visual regression testing
</tools>
