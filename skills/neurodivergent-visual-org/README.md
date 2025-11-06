---
created: 2025-11-02T22:59
updated: 2025-11-02T23:06
---
# Neurodivergent Visual Organization Skill v2.0

Upgraded skill for creating ADHD-friendly visual organizational tools using Mermaid diagrams.

## What's New in v2.0

### Major Enhancements

1. **Comprehensive Mermaid 11.12.1 Coverage**
   - Detailed syntax for all 22 diagram types
   - Working code examples for each type
   - Platform compatibility warnings (GitHub, Obsidian)

2. **Research-Backed Design Principles**
   - Color psychology for ADHD brains
   - Information density management (Miller's Law + ADHD)
   - Cognitive load theory applications
   - Visual hierarchy guidelines

3. **Expanded Diagram Selection**
   - Organized by cognitive need (not just task type)
   - Executive function & task management
   - Decision-making & prioritization
   - Time & energy management
   - Habits & routines
   - Systems & processes

4. **Comprehensive Troubleshooting**
   - Common syntax errors with solutions
   - Version compatibility notes
   - Special character handling
   - Configuration gotchas

5. **Detailed Example Scenarios**
   - 6 complete workflow examples
   - Task initiation paralysis
   - Decision paralysis
   - Multiple task overwhelm
   - Time blindness struggle
   - Habit building difficulty
   - Energy management (spoon theory)

6. **Anti-Patterns Section**
   - Design, language, process, and technical anti-patterns
   - Clear "do not do" guidelines

7. **Scientific Foundation**
   - Documents ADHD neuroscience basis
   - Visual processing research
   - Cognitive load theory
   - WCAG accessibility guidelines

## Installation

### For Claude.ai Desktop (MCP Skills)

1. Locate your skills directory (usually `~/Library/Application Support/Claude/skills/user/`)
2. Backup existing `neurodivergent-visual-org` folder (if present)
3. Copy the `neurodivergent-visual-org-v2` folder contents to:
   - `~/Library/Application Support/Claude/skills/user/neurodivergent-visual-org/`
4. Restart Claude.ai Desktop app
5. Skill will be automatically available

### For Manual Use

Simply reference the `SKILL.md` file when creating ADHD-friendly visualizations. The reference files in the `references/` directory provide additional patterns and examples.

## Package Contents

```
neurodivergent-visual-org-v2/
├── SKILL.md                          # Main skill file with comprehensive guide
├── README.md                         # This file
└── references/                       # Additional pattern libraries
    ├── accountability-support.md      # Body doubling, check-ins, crisis protocols
    ├── current-state-boards.md        # Kanban, priority matrices, context tracking
    ├── decision-tools.md              # Decision trees, weighted matrices
    ├── focus-regulation.md            # Pre-task calm-down, sensory tools, recovery
    ├── habit-building.md              # Tiny habits, routine sequences, stacking
    ├── project-maps.md                # Phase maps, dependency diagrams
    ├── task-breakdowns.md             # Linear timelines, branching breakdowns
    └── time-boxing.md                 # Pomodoro, time-blocked days, energy mapping
```

## Quick Start

The skill activates when users:
- Feel overwhelmed by tasks
- Experience decision paralysis
- Need to break down complex projects
- Struggle with time blindness
- Want to track habits or energy
- Need visual organization tools

### Example Usage

**User:** "I need to clean my apartment but it's so messy I don't know where to start"

**Skill Response:**
1. Recognizes task initiation paralysis
2. Creates flowchart or timeline breaking cleaning into 10-15 minute chunks
3. Starts with "quick wins" for visible progress
4. Uses calming color theme
5. Includes validation and encouragement
6. Renders with Mermaid tool
7. Offers to save to Obsidian

## Key Principles

- **Compassionate language** (never "just" or "should")
- **Realistic time estimates** (1.5-2x normal estimates)
- **Energy awareness** (acknowledge spoon theory)
- **Micro-steps** (3-10 minute tasks)
- **Permission statements** (combat perfectionism)
- **Celebrate starting** (not just finishing)
- **3-5 information chunks** per section (working memory)
- **Calming colors** (blues, greens, muted tones)

## Mermaid Quick Reference

### Most Useful Diagram Types for ADHD

| Need | Diagram Type |
|------|--------------|
| "I don't know where to start" | Flowchart (decision tree) |
| "This is overwhelming" | Timeline or Gantt chart |
| "I can't decide" | Quadrant chart (Eisenhower Matrix) |
| "What should I focus on?" | Quadrant chart or Pie chart |
| "Time disappears" | Timeline (make time visible) |
| "No energy" | Pie or Sankey (spoon theory) |
| "Build a habit" | Flowchart or User journey |

### Cognitive Load Limits

- **Flowcharts**: 15-20 nodes maximum
- **Mindmaps**: 3-4 levels deep
- **Pie charts**: 6-8 slices
- **Lists**: 2 lists × 3-5 items max
- **Sections**: 3-5 per diagram

### Recommended Themes

- `forest` - Calming green-based
- `neutral` - Muted earth tones
- Both reduce visual overstimulation

## Troubleshooting

### Common Issues

**Diagram won't render**
- Check indentation consistency (mindmaps, composites)
- Avoid lowercase "end" as state name (use "End" or "END")
- Verify coordinates are 0-1 for quadrant charts
- Remove `::icon()` syntax for GitHub compatibility

**Colors not working**
- Use YAML frontmatter for Sankey config (not directives)
- Remember pie chart colors assigned by size, not order

**Events missing in timeline**
- All events before first `section` are ignored
- Add section before any timeline events

## Support & Resources

- **Reddit r/ADHD** - Community-shared patterns
- **ADDitude Magazine** - Research-backed strategies  
- **CHADD** - Evidence-based resources
- **Mermaid Live Editor** - mermaid.live for testing

## Version History

- **v2.0** - Comprehensive Mermaid syntax, research-backed design, troubleshooting
- **v1.0** - Initial release with basic patterns

## License

This skill incorporates research from neuroscience, cognitive psychology, and ADHD communities. Use freely and adapt to your needs.

---

**Remember**: Visual tools work WITH ADHD brain wiring, not against it. These diagrams externalize executive function and make the invisible visible.
