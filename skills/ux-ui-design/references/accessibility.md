<overview>
Accessibility (a11y) ensures interfaces work for all users, including those with disabilities. This reference covers WCAG guidelines, testing methods, and implementation patterns.
</overview>

<wcag_aa_requirements>

<perceivable>
**1.1 Text Alternatives**
- All images have descriptive alt text
- Decorative images have empty alt=""
- Complex images have long descriptions

**1.3 Adaptable**
- Information conveyed through structure, not just presentation
- Correct heading hierarchy (h1 → h2 → h3)
- Form labels associated with inputs

**1.4 Distinguishable**
- Color contrast: 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
- UI component contrast: 3:1 against adjacent colors
- Text resizable to 200% without loss of functionality
- No images of text (unless essential)
</perceivable>

<operable>
**2.1 Keyboard Accessible**
- All functionality available via keyboard
- No keyboard traps
- Character key shortcuts have modifier or can be disabled

**2.4 Navigable**
- Skip links for repetitive content
- Descriptive page titles
- Focus order matches visual order
- Link purpose clear from text
- Multiple ways to find pages
- Headings and labels describe content

**2.5 Input Modalities**
- Gestures have alternatives
- Touch targets ≥44x44px
- Label in name matches visible label
</operable>

<understandable>
**3.1 Readable**
- Page language declared
- Unusual words defined

**3.2 Predictable**
- Focus doesn't trigger unexpected changes
- Consistent navigation
- Consistent identification of components

**3.3 Input Assistance**
- Errors identified and described
- Labels and instructions provided
- Error suggestions offered
- Confirmation for legal/financial/data
</understandable>

<robust>
**4.1 Compatible**
- Valid HTML
- Name, role, value available to assistive tech
- Status messages announced without focus change
</robust>

</wcag_aa_requirements>

<keyboard_navigation>

<essential_keys>
| Key | Standard Behavior |
|-----|-------------------|
| Tab | Move to next focusable element |
| Shift+Tab | Move to previous focusable element |
| Enter | Activate buttons, links, submit forms |
| Space | Activate buttons, toggle checkboxes |
| Arrows | Navigate within components (menus, tabs, sliders) |
| Escape | Close modals, cancel, dismiss |
| Home/End | Jump to first/last item in list |
</essential_keys>

<focus_management>
**Focus indicators must be visible:**
```css
/* Never do this */
:focus { outline: none; }

/* Do this instead */
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

**Focus order must be logical:**
- Follows visual reading order
- Modal focus trapped inside modal
- After modal close, focus returns to trigger
</focus_management>

<custom_components>
**Custom interactive elements need:**
```html
<!-- Correct role -->
<div role="button" tabindex="0">Click me</div>

<!-- Keyboard handlers -->
<script>
element.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
});
</script>
```
</custom_components>

</keyboard_navigation>

<aria_patterns>

<landmarks>
```html
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>
```
</landmarks>

<live_regions>
```html
<!-- Polite: announces when idle -->
<div aria-live="polite">Status: Saved</div>

<!-- Assertive: interrupts -->
<div aria-live="assertive">Error: Connection lost</div>

<!-- Status role (implicit polite) -->
<div role="status">Loading...</div>

<!-- Alert role (implicit assertive) -->
<div role="alert">Session expired</div>
```
</live_regions>

<expanded_collapsed>
```html
<button aria-expanded="false" aria-controls="panel-1">
  Show details
</button>
<div id="panel-1" hidden>
  Content here
</div>
```
</expanded_collapsed>

<modal_dialog>
```html
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm deletion</h2>
  <p>Are you sure you want to delete this item?</p>
  <button>Cancel</button>
  <button>Delete</button>
</div>
```
</modal_dialog>

<tabs>
```html
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">Tab 2</button>
</div>
<div role="tabpanel" id="panel-1">Content 1</div>
<div role="tabpanel" id="panel-2" hidden>Content 2</div>
```
</tabs>

</aria_patterns>

<testing_methods>

<automated_testing>
**Tools:**
- axe DevTools (browser extension)
- WAVE (browser extension)
- Lighthouse (Chrome DevTools)
- jest-axe (unit testing)
- Pa11y (CI integration)

**Limitations:**
Automated tools catch ~30% of issues. Manual testing required.
</automated_testing>

<manual_testing>
**Keyboard testing:**
1. Put mouse aside
2. Navigate entire interface with Tab
3. Verify all interactions work with Enter/Space
4. Check focus visibility throughout
5. Verify no focus traps

**Screen reader testing:**
- macOS: VoiceOver (Cmd+F5)
- Windows: NVDA (free) or JAWS
- iOS: VoiceOver (Settings > Accessibility)
- Android: TalkBack (Settings > Accessibility)

**Screen reader checkpoints:**
- [ ] Page title announced on load
- [ ] Headings create logical outline
- [ ] Form labels read correctly
- [ ] Button purposes clear
- [ ] Status changes announced
- [ ] Error messages read aloud
</manual_testing>

<user_testing>
**Include users with disabilities:**
- Screen reader users
- Keyboard-only users
- Users with motor impairments
- Users with cognitive disabilities
- Low vision users

**Recruitment:**
- Disability advocacy organizations
- Accessibility consultancies
- Internal employee resource groups
</user_testing>

</testing_methods>

<common_issues>

<quick_fixes>
| Issue | Fix |
|-------|-----|
| Missing alt text | Add descriptive alt or alt="" for decorative |
| Low contrast | Use design system colors that meet 4.5:1 |
| Missing form labels | Add `<label for="...">` or aria-label |
| No focus indicator | Add :focus-visible styles |
| Missing skip link | Add skip link to main content |
</quick_fixes>

<complex_fixes>
| Issue | Approach |
|-------|----------|
| Custom component not accessible | Add roles, states, keyboard handling |
| Dynamic content not announced | Add aria-live region |
| Focus trapped in modal | Implement focus management |
| Touch targets too small | Increase to ≥44x44px |
| Keyboard trap | Ensure all elements can receive/release focus |
</complex_fixes>

</common_issues>

<resources>
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Inclusive Components**: https://inclusive-components.design/
</resources>
