<overview>
Tools for UX/UI design, prototyping, accessibility testing, and implementation. This reference covers design tools, development libraries, and testing utilities.
</overview>

<design_tools>

<figma>
**Figma** - Industry standard for UI design
https://figma.com

**Features:**
- Browser-based, collaborative
- Design systems (components, variables)
- Prototyping and animations
- Developer handoff (inspect, export)
- Plugins ecosystem

**Integration with Claude:**
```
mcp__figma__get_design_context  → Extract UI code from designs
mcp__figma__get_screenshot      → Capture visual reference
mcp__figma__get_variable_defs   → Get design tokens
mcp__figma__get_metadata        → Get structure overview
```

**Best practices:**
- Use components (not detached)
- Name layers descriptively
- Organize with pages and frames
- Use variables for tokens
</figma>

<other_design_tools>
**Sketch** - macOS design tool
- Native Mac app, fast
- Good plugin ecosystem
- Limited collaboration

**Adobe XD** - Adobe's design tool
- Integrates with Creative Cloud
- Good prototyping
- Voice prototyping

**Framer** - Design + code
- React-based components
- Advanced interactions
- Can deploy live sites
</other_design_tools>

<whiteboarding>
**FigJam** - Figma's whiteboard
- Brainstorming, workshops
- Real-time collaboration

**Miro** - Visual collaboration
- Workshops, journey mapping
- Template library

**Excalidraw** - Quick sketching
- Hand-drawn style
- Open source, simple
</whiteboarding>

</design_tools>

<prototyping>

<figma_prototyping>
**Figma prototyping features:**
- Click/hover interactions
- Smart animate between states
- Scroll overflow
- Component variants for states
- Conditional logic (beta)
</figma_prototyping>

<advanced_prototyping>
**ProtoPie** - Advanced interactions
- Complex conditional logic
- Device sensors
- Multi-screen interactions

**Principle** - Animation-focused
- macOS app
- Smooth animations
- Quick iterations

**Origami Studio** - Meta's tool
- Complex state machines
- Design + code integration
</advanced_prototyping>

</prototyping>

<accessibility_testing>

<browser_extensions>
**axe DevTools**
https://www.deque.com/axe/devtools/
- Automated accessibility testing
- Chrome, Firefox, Edge
- Detailed issue reports

**WAVE**
https://wave.webaim.org/
- Visual overlay of issues
- Structural outline view
- Contrast checking

**Lighthouse**
Built into Chrome DevTools
- Accessibility score
- Performance, SEO, PWA audits
</browser_extensions>

<contrast_checkers>
**WebAIM Contrast Checker**
https://webaim.org/resources/contrastchecker/
- Input foreground/background colors
- Shows WCAG compliance levels

**Stark** (Figma plugin)
- Check contrast in designs
- Color blindness simulation
- Focus order visualization
</contrast_checkers>

<screen_readers>
**VoiceOver** (macOS/iOS)
- Built-in, Cmd+F5 to toggle
- Rotor for navigation
- Good for Safari testing

**NVDA** (Windows)
- Free, open source
- Good for Chrome/Firefox testing
- Widely used

**JAWS** (Windows)
- Enterprise standard
- Paid license
- Most comprehensive
</screen_readers>

<testing_libraries>
**jest-axe**
```javascript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('accessible', async () => {
  const { container } = render(<Component />);
  expect(await axe(container)).toHaveNoViolations();
});
```

**Pa11y**
```bash
pa11y https://example.com
```
- CLI accessibility testing
- CI integration
- Multiple output formats

**Playwright a11y**
```javascript
await expect(page).toBeAccessible();
```
</testing_libraries>

</accessibility_testing>

<component_libraries>

<headless_ui>
**Radix UI**
https://www.radix-ui.com/
- Unstyled, accessible primitives
- Full keyboard support
- ARIA compliant
- React only

**Headless UI**
https://headlessui.com/
- By Tailwind team
- React and Vue
- Accessible, unstyled

**React Aria**
https://react-spectrum.adobe.com/react-aria/
- Adobe's accessibility library
- Hooks for any component
- Internationalization
</headless_ui>

<styled_libraries>
**Chakra UI**
- Accessible defaults
- Theming system
- React

**Material UI (MUI)**
- Google's Material Design
- Comprehensive components
- React

**Ant Design**
- Enterprise-focused
- Rich component library
- React
</styled_libraries>

</component_libraries>

<development_tools>

<design_tokens>
**Style Dictionary**
https://amzn.github.io/style-dictionary/
- Transform design tokens
- Export to CSS, JS, iOS, Android
- Single source of truth

**Tokens Studio** (Figma plugin)
- Figma variables to tokens
- Git sync
- Multi-file support
</design_tokens>

<documentation>
**Storybook**
https://storybook.js.org/
- Component documentation
- Interactive playground
- Visual testing
- Accessibility addon

**Chromatic**
- Visual regression testing
- Storybook hosting
- Review workflow
</documentation>

<css_tools>
**Tailwind CSS**
- Utility-first CSS
- Design token integration
- JIT compilation

**CSS Variables**
```css
:root {
  --color-primary: #0066CC;
}
.button {
  background: var(--color-primary);
}
```
</css_tools>

</development_tools>

<research_tools>

<user_testing>
**Maze**
- Unmoderated testing
- Task-based studies
- Heat maps and metrics

**UserTesting**
- Moderated and unmoderated
- Participant recruitment
- Video recordings

**Lookback**
- Live interviews
- Session recording
- Note-taking tools
</user_testing>

<analytics>
**Hotjar**
- Session recordings
- Heatmaps
- Surveys

**FullStory**
- Session replay
- Rage clicks detection
- Funnel analysis

**Mixpanel / Amplitude**
- Event tracking
- User journeys
- A/B testing
</analytics>

</research_tools>
