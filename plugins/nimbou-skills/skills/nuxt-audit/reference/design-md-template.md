# Nuxt Frontend DESIGN.md Template

Use this file as the starting point for a project- or app-level `DESIGN.md`.

This template is intentionally aligned to the Google `design.md` format:

- YAML front matter holds machine-readable visual tokens
- markdown sections hold the human rationale and application guidance

Keep implementation and review rules out of this file. Put those in `GUIDELINES.md`.

```md
---
version: alpha
name: Project Name
description: Short visual identity summary
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
  tertiary: "#B8422E"
  neutral: "#F7F5F2"
  on-primary: "#FFFFFF"
typography:
  h1:
    fontFamily: "Your Display Font"
    fontSize: 3rem
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  body-md:
    fontFamily: "Your Body Font"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: 8px
  md: 16px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 12px
---

## Overview

- Audience and product context
- Primary register: brand, product, or hybrid with one default emphasis
- Intended tone and emotional register
- What the interface should explicitly avoid feeling like

## Colors

- Explain the palette in semantic roles, not raw swatches only
- Name the dominant accent and where it is allowed to appear
- Clarify how neutral surfaces are tinted and how contrast is preserved

## Typography

- Describe the display/body pair and why it fits the product
- Note whether scale is fluid, fixed, or mixed by route type
- Mention important constraints such as tabular numbers or uppercase label use

## Layout

- Describe the dominant composition mode: landing, product UI, or hybrid
- Note spacing rhythm, page width, and hero or shell constraints
- Keep this visual and spatial, not architectural

## Elevation & Depth

- Describe whether the UI is flat, softly layered, or high-contrast
- Note how shadows, overlays, and surface separation should behave

## Shapes

- Describe the corner language and overall geometry
- Note any strict bans or exceptions on pill shapes, hard corners, or ornamental framing

## Components

- Summarize the visual contract for key UI elements such as primary buttons, cards, fields, tables, and inspectors
- Keep this at the level of appearance and interaction feel, not file ownership

## Do's and Don'ts

- List the strongest visual guardrails
- Include anti-genericity rules that matter to this app
- Keep the list concrete enough that another agent can follow it
```
