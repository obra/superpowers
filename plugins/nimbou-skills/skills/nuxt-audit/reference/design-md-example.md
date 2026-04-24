# DESIGN.md Example

Fictional project. Use this file as a concrete reference when filling a real `DESIGN.md` via `/design-md`. It shows the expected split between machine-readable tokens and design rationale prose.

Do not copy this as-is. Copy the structure and the level of specificity only.

```md
---
version: alpha
name: Haven
description: Observability UI for SRE teams that should feel precise, quiet, and mechanically trustworthy.
colors:
  primary: "#DCE7F5"
  secondary: "#7B8AA0"
  tertiary: "#72A6FF"
  neutral: "#0E131A"
  on-primary: "#0E131A"
  on-tertiary: "#07131F"
typography:
  h1:
    fontFamily: "GT Sectra Display"
    fontSize: 4.5rem
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: -0.03em
  body-md:
    fontFamily: "Sohne"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  mono-sm:
    fontFamily: "Sohne Mono"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: 10px
  md: 18px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 12px
  inspector-panel:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
---

## Overview

Haven is used by SREs and platform engineers who spend long sessions scanning metrics, incidents, and logs with other tools open nearby. The interface should feel precise, quiet, and mechanically competent. It should not feel aspirational, playful, glossy, or startup-generic.

## Colors

The palette is dark by default for the logged-in workspace and editorial-light on marketing routes. In the product UI, the base surface stays almost black with a cool blue tint so numbers and labels can sit forward without decorative glow. The bright blue accent is reserved for selected state, primary actions, and the smallest possible amount of emphasis.

## Typography

GT Sectra Display appears only where the product wants a deliberate editorial signal: marketing hero, blog titles, and empty states that need composure more than urgency. Sohne handles all body copy, controls, and labels because it stays dense and readable without falling into generic dashboard neutrality. Sohne Mono is reserved for logs, timestamps, and tabular values.

## Layout

The project is hybrid. Marketing routes use a full-bleed hero and a narrow internal text column. Product routes use a restrained shell with left rail navigation, a dense main workspace, and an optional right-side inspector. Spacing follows a 4-point rhythm and avoids floating dashboard mosaics.

## Elevation & Depth

Depth is soft and sparse. Most surfaces are separated by contrast and spacing rather than visible card chrome. Shadows should feel whisper-light and be saved for overlays, inspectors, and temporary UI states rather than routine list rows or dashboard blocks.

## Shapes

Corners are subtly rounded, never bubble-like. Product UI favors quiet rectangles with a small amount of curvature. Pills are reserved for chips and status only, not for major layout containers.

## Components

Primary buttons should read as dense and decisive, never oversized. Tables should feel flat and information-first. Inspectors should feel like a calm extension of the workspace rather than a modal interruption. Inputs should stay restrained and border-light, with state communicated primarily by contrast and accent color discipline.

## Do's and Don'ts

- Do keep the interface quiet enough that the data leads.
- Do reserve the accent color for actions and selected state.
- Do not introduce hero-card SaaS patterns on marketing routes.
- Do not use gradient text or decorative neon accents.
- Do not turn routine product surfaces into repeated floating cards.
```
