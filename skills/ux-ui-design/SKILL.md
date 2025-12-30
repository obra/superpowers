---
name: ux-ui-design
description: |
  Comprehensive UX/UI design lifecycle: user research, wireframes, mockups, prototypes,
  design review, and frontend implementation. Applies when user mentions UI, UX, user interface,
  user experience, Figma, wireframes, mockups, usability, accessibility audits, or visual design.
  NOT for system architecture, API design, or database design - this is specifically for
  user-facing interface design. Integrates with Figma MCP for design context extraction.
---

<essential_principles>

<design_first_law>
**Design before implementation, every time. No exceptions.**

User interface work follows a strict order: understand users → design solution → review quality → implement. Skipping steps produces unusable interfaces that cost 3x more to fix than doing it right the first time.

**Violating the letter of this workflow is violating the spirit of good design.**
</design_first_law>

<accessibility_first>
**Accessibility is not optional. It's not a "nice to have". It's not a follow-up ticket.**

Build accessible from the start. 10% more time upfront vs 300% more time to retrofit. Every workflow includes accessibility considerations because accessibility is design, not an afterthought.
</accessibility_first>

<design_system_compliance>
**Design systems are law, not guidelines.**

If your project has a design system:
- Use design system tokens exclusively (colors, typography, spacing, components)
- Never create custom values - not "just this once", not "designer is OOO"
- Missing what you need? Propose addition to design system, get approval, update system

If no design system exists:
- Create one as you go (document colors, typography, spacing used)
- Maintain consistency (reuse same values across the design)
</design_system_compliance>

<figma_integration>
**Use Figma MCP for design context when available.**

When working with Figma designs:
- Use `mcp__figma__get_design_context` to extract UI code and design tokens
- Use `mcp__figma__get_screenshot` to capture visual reference
- Use `mcp__figma__get_variable_defs` to extract design system variables
- Use `mcp__figma__get_metadata` for node structure overview

Extract the fileKey and nodeId from Figma URLs:
- URL format: `https://figma.com/design/:fileKey/:fileName?node-id=:int1-:int2`
- nodeId becomes `:int1::int2` (replace hyphen with colon)
</figma_integration>

</essential_principles>

<intake>
**What UX/UI work are you doing?**

1. **Ideate** - Understand users, define problems, explore solutions before designing
2. **Design** - Create wireframes, mockups, or prototypes in Figma
3. **Review** - Evaluate existing designs for usability, accessibility, consistency
4. **Implement** - Translate approved designs into code
5. **Iterate** - Incorporate user feedback, refine existing designs

**Wait for response before proceeding.**
</intake>

<routing>
| Response | Workflow | Description |
|----------|----------|-------------|
| 1, "ideate", "research", "understand", "explore", "users", "problem" | `workflows/ideate.md` | User research, problem definition, solution exploration |
| 2, "UI design", "UX design", "wireframe", "mockup", "prototype", "figma", "visual design" | `workflows/design.md` | Creating design artifacts in Figma |
| 3, "review", "audit", "evaluate", "critique", "usability", "accessibility" | `workflows/review.md` | Heuristic evaluation, accessibility audit, design critique |
| 4, "implement", "frontend", "component", "CSS", "styling" | `workflows/implement.md` | Design-to-code translation |
| 5, "iterate", "refine", "user testing", "feedback" | `workflows/iterate.md` | User testing, incorporating feedback |

**Disambiguation - this skill is for USER INTERFACE design:**
- "UI", "UX", "user interface", "user experience" → This skill
- "system design", "architecture", "API design", "database design" → NOT this skill
- "design" alone is ambiguous → Ask: "Are you designing a user interface, or system architecture?"

**Intent-based routing (if context provides clear intent):**
- Starting new UI/UX feature → `workflows/ideate.md`
- Have Figma URL → `workflows/design.md` (extract and implement)
- "Review this UI/mockup/design" → `workflows/review.md`
- "Make this accessible" → `workflows/review.md` (accessibility audit)
- UI design approved, ready to code → `workflows/implement.md`
- User testing results → `workflows/iterate.md`

**After reading the workflow, follow it exactly.**
</routing>

<quick_reference>

<design_lifecycle>
```
┌─────────────────────────────────────────────────────────────────┐
│                     UX/UI DESIGN LIFECYCLE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│   │  IDEATE  │───▶│  DESIGN  │───▶│  REVIEW  │───▶│IMPLEMENT │  │
│   │          │    │          │    │          │    │          │  │
│   │ Research │    │ Wireframe│    │ Usability│    │ Code it  │  │
│   │ Define   │    │ Mockup   │    │ A11y     │    │ Test it  │  │
│   │ Explore  │    │ Prototype│    │ System   │    │ Ship it  │  │
│   └──────────┘    └──────────┘    └────┬─────┘    └──────────┘  │
│                         ▲              │                         │
│                         │      ┌───────▼───────┐                 │
│                         │      │   ITERATE     │                 │
│                         │      │               │                 │
│                         └──────┤ User Testing  │                 │
│                                │ Refine Design │                 │
│                                └───────────────┘                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```
</design_lifecycle>

<phase_summary>
| Phase | Deliverable | Don't proceed without |
|-------|-------------|----------------------|
| **Ideate** | User research, problem definition | Answers to "who, what, why, success?" |
| **Design** | Wireframes, mockups, prototypes | Design artifact in Figma |
| **Review** | Quality checklist passed | Usability + accessibility + consistency verified |
| **Implement** | Working code matching design | Pixel-perfect match, full accessibility |
| **Iterate** | Refined design based on feedback | User testing insights documented |
</phase_summary>

<accessibility_quick_check>
**WCAG AA Minimums:**
- Color contrast: 4.5:1 text, 3:1 large text, 3:1 UI components
- Touch targets: ≥44x44px on mobile
- Keyboard: Tab/Enter/Arrows/Escape for all interactions
- Focus: Visible focus indicators
- Screen readers: Proper labels, roles, states
</accessibility_quick_check>

</quick_reference>

<red_flags>
**STOP and follow the workflow if you think:**

| Thought | Reality |
|---------|---------|
| "No time for design phase" | Fixing bad UI later takes 3x longer. Design saves time. |
| "I'll design as I code" | You'll make inconsistent decisions under implementation pressure. |
| "It's a simple feature" | Simple features still need design. Takes 15 minutes. |
| "Just make it clean and modern" | That's not a design brief. Define actual requirements. |
| "Screenshots can serve as mockups" | That's documentation theater. Design first. |
| "Accessibility can be a follow-up" | Retrofitting is 3x harder. Build it right now. |
| "Design system is guidelines not law" | Consistency is law. Follow system or update system. |
| "Users will figure it out" | If users have to figure it out, design failed. |
| "Being pragmatic not dogmatic" | Skipping design is cutting corners, not pragmatism. |

**All of these mean: Stop. Follow the workflow.**
</red_flags>

<reference_index>

**Accessibility:** `references/accessibility.md` - WCAG, testing, screen readers
**Design Systems:** `references/design-systems.md` - Tokens, components, compliance
**Usability Heuristics:** `references/usability-heuristics.md` - Nielsen's 10 heuristics
**Visual Design:** `references/visual-design.md` - Typography, color, spacing, layout
**User Research:** `references/user-research.md` - Interviews, personas, journey maps
**UI Patterns:** `references/patterns.md` - Common patterns and when to use them
**Anti-Patterns:** `references/anti-patterns.md` - Design mistakes to avoid
**Tools:** `references/tools.md` - Figma, accessibility testing, component libraries

</reference_index>

<workflows_index>
| Workflow | Purpose |
|----------|---------|
| `ideate.md` | User research, problem definition, solution exploration |
| `design.md` | Creating wireframes, mockups, prototypes in Figma |
| `review.md` | Heuristic evaluation, accessibility audit, design critique |
| `implement.md` | Translating approved designs into accessible code |
| `iterate.md` | User testing, incorporating feedback, design refinement |
</workflows_index>

<success_criteria>
A well-executed UX/UI design process:
- [ ] User needs understood and documented before designing
- [ ] Design artifacts created before implementation
- [ ] Designs reviewed for usability, accessibility, consistency
- [ ] Implementation matches design pixel-perfect
- [ ] Full keyboard navigation and screen reader support
- [ ] Design system tokens used exclusively (no custom values)
- [ ] User feedback incorporated through iteration
</success_criteria>
