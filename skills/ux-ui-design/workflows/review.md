<required_reading>
**Read these reference files as needed:**
1. `references/usability-heuristics.md` - Nielsen's 10 heuristics
2. `references/accessibility.md` - WCAG, testing methods
3. `references/design-systems.md` - Compliance checking
4. `references/anti-patterns.md` - Common mistakes to identify
</required_reading>

<objective>
Evaluate designs for usability, accessibility, and design system compliance before implementation. Catch problems while they're cheap to fix (in design) rather than expensive (in code).

**You cannot skip this phase.** Unreviewed designs ship with usability bugs and accessibility violations.
</objective>

<review_modes>
This workflow covers three types of review:

1. **Usability Review** - Does this design work for users?
2. **Accessibility Audit** - Is this design accessible to all users?
3. **Design System Compliance** - Does this follow our standards?

For comprehensive review, run all three. For focused review, choose the relevant mode.
</review_modes>

<process>

<step_1>
**Gather Context**

Before reviewing, understand:
- What problem is this solving? (reference Ideate documentation)
- Who are the users? (context affects evaluation)
- What constraints exist? (tech, timeline, scope)
- What existing patterns should this follow?

**Get the design artifacts:**
- Figma URL (use `mcp__figma__get_screenshot` and `mcp__figma__get_design_context`)
- Prototype link (if interactive)
- Design documentation/specs
</step_1>

<step_2>
**Usability Review (Nielsen's Heuristics)**

Evaluate against each heuristic:

<heuristic name="1. Visibility of system status">
**Does the design keep users informed?**
- [ ] Loading states show progress
- [ ] Actions provide immediate feedback
- [ ] Current location is clear (navigation, breadcrumbs)
- [ ] System state is visible (online/offline, sync status)
</heuristic>

<heuristic name="2. Match between system and real world">
**Does the design speak the user's language?**
- [ ] Uses familiar terms (not technical jargon)
- [ ] Follows real-world conventions
- [ ] Information appears in natural order
- [ ] Icons are recognizable
</heuristic>

<heuristic name="3. User control and freedom">
**Can users undo mistakes easily?**
- [ ] Undo/redo available
- [ ] Cancel option on destructive actions
- [ ] Easy to navigate back
- [ ] "Emergency exit" clearly marked
</heuristic>

<heuristic name="4. Consistency and standards">
**Does the design follow conventions?**
- [ ] Consistent with rest of app
- [ ] Follows platform conventions
- [ ] Same terms/icons mean same things
- [ ] Predictable behavior
</heuristic>

<heuristic name="5. Error prevention">
**Does the design prevent mistakes?**
- [ ] Confirmation on destructive actions
- [ ] Input constraints (validation, disabled states)
- [ ] Clear defaults that prevent errors
- [ ] Guardrails on risky operations
</heuristic>

<heuristic name="6. Recognition rather than recall">
**Is information visible, not memorized?**
- [ ] Labels visible (not just icons)
- [ ] Recent items accessible
- [ ] Clear instructions when needed
- [ ] Context-sensitive help
</heuristic>

<heuristic name="7. Flexibility and efficiency">
**Does the design serve novice and expert users?**
- [ ] Shortcuts for power users
- [ ] Customization options
- [ ] Efficient paths for frequent actions
- [ ] Sensible defaults
</heuristic>

<heuristic name="8. Aesthetic and minimalist design">
**Is the design focused and uncluttered?**
- [ ] No unnecessary elements
- [ ] Visual hierarchy guides attention
- [ ] Information prioritized
- [ ] Whitespace used effectively
</heuristic>

<heuristic name="9. Help users recognize, diagnose, and recover from errors">
**Are error messages helpful?**
- [ ] Plain language (not error codes)
- [ ] Specifically identify the problem
- [ ] Suggest how to fix
- [ ] Don't blame the user
</heuristic>

<heuristic name="10. Help and documentation">
**Is help available when needed?**
- [ ] Contextual help available
- [ ] Tooltips on complex elements
- [ ] Onboarding for new features
- [ ] Searchable documentation
</heuristic>
</step_2>

<step_3>
**Accessibility Audit (WCAG AA)**

<perceivable>
**Can all users perceive the content?**

- [ ] **Color contrast** - Text meets 4.5:1, large text 3:1, UI components 3:1
- [ ] **Color independence** - Information not conveyed by color alone
- [ ] **Text alternatives** - Images have alt text, icons have labels
- [ ] **Captions/transcripts** - Media is accessible
- [ ] **Resize text** - Works at 200% zoom
- [ ] **Text spacing** - Readable line height and letter spacing
</perceivable>

<operable>
**Can all users operate the interface?**

- [ ] **Keyboard accessible** - All functions work with keyboard
- [ ] **Focus visible** - Clear focus indicators on all interactive elements
- [ ] **Focus order** - Logical tab order
- [ ] **Skip links** - Can skip repetitive content
- [ ] **Touch targets** - ≥44x44px on mobile
- [ ] **No keyboard traps** - Can tab out of all components
- [ ] **Timing adjustable** - Timeouts can be extended
- [ ] **No flashing** - Nothing flashes more than 3 times/second
</operable>

<understandable>
**Can all users understand the content?**

- [ ] **Language identified** - Page language set
- [ ] **Consistent navigation** - Same nav in same location
- [ ] **Consistent identification** - Same icons/terms throughout
- [ ] **Error identification** - Errors clearly indicated
- [ ] **Labels/instructions** - Clear labels on all inputs
- [ ] **Error prevention** - Confirm before destructive actions
</understandable>

<robust>
**Does it work with assistive technology?**

- [ ] **Valid HTML** - Semantic, properly nested
- [ ] **Name, role, value** - ARIA correctly used
- [ ] **Status messages** - Announced to screen readers
</robust>

**Quick accessibility check:**
Run axe DevTools or WAVE on Figma prototype export or implementation preview.
</step_3>

<step_4>
**Design System Compliance**

- [ ] **Colors** - Only design system color tokens used
- [ ] **Typography** - Only design system type scale used
- [ ] **Spacing** - Only design system spacing scale used
- [ ] **Components** - Using design system components (not custom)
- [ ] **Icons** - From approved icon set
- [ ] **Patterns** - Following established interaction patterns
- [ ] **Consistency** - Matches similar screens in the app

**Flag deviations:**
- Any custom value = needs justification and approval
- Missing component = proposal to add to design system
- New pattern = needs documentation
</step_4>

<step_5>
**Document Findings**

Categorize issues by severity:

| Severity | Criteria | Example |
|----------|----------|---------|
| **Critical** | Blocks users, accessibility violation, broken functionality | No keyboard access, insufficient contrast |
| **High** | Significant usability problem, design system violation | Confusing flow, custom colors |
| **Medium** | Minor usability issue, polish opportunity | Inconsistent spacing, unclear label |
| **Low** | Nice-to-have, future enhancement | Animation refinement, micro-copy |

**Format findings:**
```
[SEVERITY] Issue Title
Location: [Screen/component name]
Problem: [What's wrong]
Impact: [Who it affects and how]
Recommendation: [Specific fix]
```

**Example:**
```
[HIGH] Primary button contrast insufficient
Location: Sign-up form
Problem: Blue button on blue background has 2.8:1 contrast
Impact: Users with low vision can't distinguish the button
Recommendation: Use design system 'primary-button' color token (#0066CC on white)
```
</step_5>

<step_6>
**Deliver Feedback**

**Be specific and constructive:**
- ❌ "This doesn't look good"
- ✅ "Spacing between items is inconsistent. Use spacing-4 (16px) throughout."

- ❌ "Bad UX"
- ✅ "Users might not see Save button below fold. Consider sticky footer or top-right placement."

- ❌ "Not accessible"
- ✅ "Missing keyboard support. Add onKeyDown handler for Enter/Space on card component."

**Prioritize actionable feedback:**
1. Critical issues (must fix before implementation)
2. High issues (should fix before implementation)
3. Medium issues (fix before shipping)
4. Low issues (can address in iteration)
</step_6>

</process>

<review_checklist>
**Complete review covers:**

<usability_summary>
- [ ] Visibility of system status
- [ ] Match between system and real world
- [ ] User control and freedom
- [ ] Consistency and standards
- [ ] Error prevention
- [ ] Recognition rather than recall
- [ ] Flexibility and efficiency
- [ ] Aesthetic and minimalist design
- [ ] Error recovery
- [ ] Help and documentation
</usability_summary>

<accessibility_summary>
- [ ] Color contrast (4.5:1 text, 3:1 UI)
- [ ] Keyboard accessibility
- [ ] Focus visibility
- [ ] Touch target size
- [ ] Screen reader support
- [ ] Form labels
- [ ] Error messages
</accessibility_summary>

<compliance_summary>
- [ ] Design system colors
- [ ] Design system typography
- [ ] Design system spacing
- [ ] Design system components
- [ ] Consistent patterns
</compliance_summary>
</review_checklist>

<anti_patterns>
| Pattern | Why It Fails |
|---------|--------------|
| "Looks good to me" | Not a review, just an opinion |
| Reviewing without context | Can't evaluate without knowing the problem |
| Only checking happy path | Errors and edge cases matter |
| Skipping accessibility | Excludes users, legal risk |
| Vague feedback | "Not good" doesn't help fix anything |
| Only visual review | Usability and accessibility often invisible |
</anti_patterns>

<success_criteria>
Review is complete when:
- [ ] Usability heuristics evaluated
- [ ] Accessibility audit completed (WCAG AA)
- [ ] Design system compliance verified
- [ ] Findings documented with severity
- [ ] Actionable recommendations provided
- [ ] Critical/high issues require fixes before proceeding
- [ ] Ready for implementation (or return to Design for fixes)
</success_criteria>
