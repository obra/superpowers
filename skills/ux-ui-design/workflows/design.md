<required_reading>
**Read these reference files as needed:**
1. `references/visual-design.md` - Typography, color, spacing, layout
2. `references/design-systems.md` - Tokens, components, compliance
3. `references/patterns.md` - Common UI patterns
4. `references/accessibility.md` - Accessible design patterns
</required_reading>

<objective>
Create design artifacts (wireframes, mockups, prototypes) in Figma before any implementation. Design solutions in design tools, not in code.

**You cannot skip this phase.** Coding without design artifacts produces inconsistent, unreviewed interfaces.
</objective>

<figma_integration>
**When working with existing Figma designs:**

Extract fileKey and nodeId from Figma URL:
- URL: `https://figma.com/design/ABC123/MyFile?node-id=1-2`
- fileKey: `ABC123`
- nodeId: `1:2` (replace hyphen with colon)

**Available Figma MCP tools:**
```
mcp__figma__get_design_context  → Extract UI code and design tokens
mcp__figma__get_screenshot      → Capture visual reference
mcp__figma__get_variable_defs   → Extract design system variables
mcp__figma__get_metadata        → Get node structure overview
mcp__figma__get_code_connect_map → Map Figma nodes to code components
```

Use these tools to understand existing designs before creating new ones.
</figma_integration>

<process>

<step_1>
**Determine Artifact Complexity**

| Feature Scope | Required Artifacts | Tools |
|---------------|-------------------|-------|
| Simple (< 2 screens) | Wireframes → Mockups | Figma, paper sketches |
| Medium (2-5 screens) | User flow → Wireframes → Mockups | Figma |
| Complex (5+ screens, new patterns) | User flow → Wireframes → Interactive prototype → Mockups | Figma prototyping |

**Always start with lower fidelity:**
1. Paper sketches (fastest ideation)
2. Wireframes (layout, hierarchy, no visual polish)
3. Mockups (colors, typography, final visuals)
4. Prototypes (clickable interactions)

Don't jump to high-fidelity. Explore in low-fidelity first.
</step_1>

<step_2>
**Create User Flow (if multi-screen)**

Before individual screens, map the user journey:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Entry     │────▶│   Action    │────▶│   Result    │
│   Point     │     │   Screen    │     │   Screen    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Error     │
                    │   State     │
                    └─────────────┘
```

**Include in user flow:**
- Entry points (how do users get here?)
- Happy path (ideal flow)
- Error states (what can go wrong?)
- Edge cases (empty states, loading, permissions)
- Exit points (where do users go next?)
</step_2>

<step_3>
**Design Wireframes**

Low-fidelity layouts focusing on:
- Information hierarchy (what's most important?)
- Content placement (where does each element go?)
- Interaction patterns (how do users interact?)
- Responsive considerations (how does it adapt?)

**Wireframe checklist:**
- [ ] Clear visual hierarchy (size, position, weight)
- [ ] Obvious interactive elements (buttons, links, inputs)
- [ ] Appropriate feedback points (loading, success, error)
- [ ] All states represented (empty, loading, error, success)
- [ ] Mobile/responsive considered

**Use design system components** even in wireframes:
- Reference existing component patterns
- Identify gaps (need new components?)
- Stay within system constraints
</step_3>

<step_4>
**Apply Visual Design**

Transform wireframes into high-fidelity mockups:

**Typography:**
- Use design system type scale exclusively
- Establish clear hierarchy (headings vs body)
- Ensure readability (line height, line length)
- Check contrast ratios

**Color:**
- Use design system color tokens
- Semantic color usage (error=red, success=green)
- Don't rely on color alone for meaning
- Verify contrast (4.5:1 text, 3:1 UI elements)

**Spacing:**
- Use design system spacing scale (4px, 8px, 12px, 16px, 24px, 32px...)
- Consistent margins and padding
- Group related elements with closer spacing
- Separate distinct sections with larger spacing

**Layout:**
- Use grid system from design system
- Maintain alignment
- Create visual balance
- Consider scan patterns (F-pattern, Z-pattern)

**No custom values.** If design system lacks what you need:
1. Use closest existing value
2. Propose addition to design system
3. Get approval before using custom value
</step_4>

<step_5>
**Design All States**

Every interactive element needs multiple states:

**Component states:**
```
┌────────────────────────────────────────┐
│  Default  │  Hover  │  Active  │  Focus  │
├───────────┼─────────┼──────────┼─────────┤
│ Disabled  │ Loading │  Error   │ Success │
└────────────────────────────────────────┘
```

**Screen states:**
- **Empty state** - No data yet, guide user to populate
- **Loading state** - Data being fetched, show skeleton/spinner
- **Error state** - Something failed, explain what and how to fix
- **Success state** - Action completed, confirm and guide next steps
- **Edge cases** - Long text, missing images, permissions denied

**Don't ship designs without all states designed.**
</step_5>

<step_6>
**Build Interactive Prototype (if complex)**

For features with multiple screens or complex interactions:

**Figma prototyping:**
- Connect frames with interaction flows
- Add transitions (dissolve, slide, smart animate)
- Include micro-interactions (hover, click feedback)
- Prototype error paths, not just happy path

**What to prototype:**
- User flow from entry to exit
- Key interactions (forms, navigation, modals)
- Error handling and recovery
- Mobile interactions (swipe, tap, long press)

**Use for validation:**
- Walk through with stakeholders
- User testing before implementation
- Developer handoff understanding
</step_6>

<step_7>
**Prepare for Handoff**

Before moving to Review phase:

**Design documentation:**
- Component specifications (sizes, spacing, colors)
- Interaction specifications (animations, transitions)
- Responsive behavior notes
- Accessibility annotations

**In Figma:**
- Organize layers with clear naming
- Use components (not detached copies)
- Add developer annotations where needed
- Link to design system components

**Export assets:**
- Icons as SVG
- Images at 1x, 2x, 3x
- Mark all exportable assets
</step_7>

</process>

<design_system_compliance>
**Before finalizing any design:**

- [ ] All colors from design system tokens
- [ ] All typography from design system type scale
- [ ] All spacing from design system spacing scale
- [ ] Using design system components where available
- [ ] No custom values without documented approval
- [ ] Consistent with other screens in the app
</design_system_compliance>

<accessibility_in_design>
**Build in from the start:**

- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Don't rely on color alone (use icons, text, patterns)
- [ ] Touch targets ≥44x44px on mobile
- [ ] Clear focus indicators designed
- [ ] Form labels visible (not just placeholder text)
- [ ] Error messages specific and helpful
- [ ] Logical reading order
</accessibility_in_design>

<anti_patterns>
| Pattern | Why It Fails |
|---------|--------------|
| "I'll design as I code" | Inconsistent decisions under implementation pressure |
| Jumping straight to mockups | Skips ideation, locks in early decisions |
| "Just make it clean and modern" | Not a design brief, no real requirements |
| Custom colors/spacing "just this once" | Design system drift, maintenance nightmare |
| Designing only happy path | Users hit errors, edge cases are reality |
| Screenshots as design documentation | Retrofitting documentation, not designing |
</anti_patterns>

<success_criteria>
Design phase is complete when:
- [ ] User flow documented (if multi-screen)
- [ ] Wireframes explored layout options
- [ ] Mockups finalized with design system compliance
- [ ] All states designed (empty, loading, error, success)
- [ ] Accessibility built into design (contrast, targets, labels)
- [ ] Interactive prototype created (if complex)
- [ ] Ready for Review phase
</success_criteria>
