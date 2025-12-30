<overview>
Visual design principles create aesthetically pleasing, functional interfaces. This reference covers typography, color, spacing, layout, and visual hierarchy.
</overview>

<typography>

<type_scale>
**Establish a type scale:**
```
Base size: 16px (1rem)
Scale ratio: 1.25 (major third)

12px (0.75rem)  - Caption, labels
14px (0.875rem) - Secondary text, inputs
16px (1rem)     - Body text (base)
18px (1.125rem) - Large body
20px (1.25rem)  - H5
24px (1.5rem)   - H4
30px (1.875rem) - H3
36px (2.25rem)  - H2
48px (3rem)     - H1
```
</type_scale>

<hierarchy>
**Create clear hierarchy:**
- Headings: Larger, bolder
- Body: Comfortable reading size
- Secondary: Smaller, lighter color
- Captions: Smallest, often gray

**Use 2-3 weights maximum:**
- Regular (400) for body
- Medium (500) for emphasis
- Bold (700) for headings
</hierarchy>

<readability>
**Line length:** 45-75 characters optimal
**Line height:** 1.5 for body text, 1.2-1.3 for headings
**Paragraph spacing:** 1.5x line height

**Don't:**
- Use too many fonts (stick to 2 max)
- Make body text too small (min 14px)
- Reduce contrast for aesthetics
- Center long text blocks
</readability>

</typography>

<color>

<color_theory>
**Color has meaning:**
- Blue: Trust, professionalism, calm
- Green: Success, growth, go
- Red: Error, danger, stop, urgency
- Yellow/Orange: Warning, attention
- Purple: Luxury, creativity
- Gray: Neutral, disabled, secondary
</color_theory>

<color_usage>
**Semantic colors:**
```css
/* Feedback colors */
--color-success: #2E7D32;  /* Green - positive actions/states */
--color-warning: #ED6C02;  /* Orange - caution needed */
--color-error: #D32F2F;    /* Red - errors, destructive */
--color-info: #0288D1;     /* Blue - informational */
```

**Don't rely on color alone:**
- Add icons to color meanings
- Use text labels with colors
- Include patterns if colorblind users affected
</color_usage>

<contrast>
**WCAG contrast requirements:**
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum
- Decorative elements: No requirement

**Check contrast:**
- WebAIM Contrast Checker
- Figma plugins (Stark, Contrast)
- Chrome DevTools color picker
</contrast>

<color_palette>
**Build a palette:**
- Primary: Brand color
- Secondary: Supporting brand color
- Neutral: Grays for text, backgrounds, borders
- Semantic: Success, warning, error, info

**Create shades:**
- 50-900 scale (Tailwind-style)
- Lighter for backgrounds
- Darker for hover states
</color_palette>

</color>

<spacing>

<spacing_scale>
**Use consistent spacing scale:**
```
4px  (spacing-1)  - Tight grouping
8px  (spacing-2)  - Related elements
12px (spacing-3)  - Between related groups
16px (spacing-4)  - Standard spacing
24px (spacing-6)  - Section spacing
32px (spacing-8)  - Major sections
48px (spacing-12) - Page sections
```
</spacing_scale>

<spacing_principles>
**Proximity:** Related items closer together
**Grouping:** Similar spacing within groups
**Breathing room:** Don't cram elements
**Consistency:** Same spacing for same purposes

**Example:**
```
Card padding: 16px (spacing-4)
Between cards: 24px (spacing-6)
Section margins: 48px (spacing-12)
```
</spacing_principles>

</spacing>

<layout>

<grid_systems>
**12-column grid:**
- Flexible division (1/2, 1/3, 1/4, 1/6, 1/12)
- Standard container max-width: 1200px
- Gutter: 24-32px

**CSS Grid example:**
```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--spacing-6);
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}
```
</grid_systems>

<alignment>
**Align everything:**
- Left-align text (except centered headlines)
- Align elements to grid columns
- Align form labels and inputs
- Align icons with text baselines

**Create invisible lines:**
- Elements should align with others
- Consistent margins create cohesion
- Use guides in design tools
</alignment>

<visual_balance>
**Achieve balance:**
- Symmetrical: Formal, stable
- Asymmetrical: Dynamic, interesting
- Radial: Focus toward center

**Weight distribution:**
- Large elements are "heavier"
- Dark colors are "heavier"
- Balance heavy with light
</visual_balance>

</layout>

<visual_hierarchy>

<creating_hierarchy>
**Guide the eye:**
1. Size - Bigger = more important
2. Color - Bright/saturated draws attention
3. Contrast - High contrast stands out
4. Position - Top-left (in LTR) noticed first
5. Whitespace - Isolation = importance
6. Typography - Bold, larger = emphasis
</creating_hierarchy>

<scanning_patterns>
**F-pattern (content pages):**
- Users scan horizontally across top
- Move down, scan shorter lines
- Left side gets most attention

**Z-pattern (landing pages):**
- Eye moves top-left to top-right
- Down diagonally to bottom-left
- Across to bottom-right

**Place important elements on these paths**
</scanning_patterns>

<primary_actions>
**One primary action per view:**
- Make it visually dominant
- Use primary color
- Give it space
- Secondary actions less prominent

**Button hierarchy:**
```
Primary:   Solid color, stands out
Secondary: Outlined or ghost
Tertiary:  Text-only link style
```
</primary_actions>

</visual_hierarchy>

<responsive_design>

<breakpoints>
**Common breakpoints:**
```css
/* Mobile first */
@media (min-width: 640px) { /* sm: Tablets */ }
@media (min-width: 768px) { /* md: Small laptops */ }
@media (min-width: 1024px) { /* lg: Desktops */ }
@media (min-width: 1280px) { /* xl: Large desktops */ }
```
</breakpoints>

<responsive_patterns>
**Adapt layout:**
- Stack columns on mobile
- Reduce margins/padding
- Simplify navigation
- Adjust typography scale
- Hide non-essential content
- Use touch-friendly targets (44px+)
</responsive_patterns>

</responsive_design>
