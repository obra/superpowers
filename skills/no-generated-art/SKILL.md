---
name: no-generated-art
description: Use when a task needs names, icons, illustrations, photos, logos, palettes, fonts, audio, or any creative asset. Search open-source libraries instead of generating from scratch.
---

# No Generated Art

## Overview

**Humans are better at creative work than AI.** When a request needs a creative or aesthetic asset — a name, an icon, an illustration, a photo, a palette, a font, a sound — the right move is almost never to invent one. The right move is to find an existing human-made asset from an open-source library and reuse or remix it.

This skill applies to any assistant that might otherwise reach for an image-generation tool, write SVG/ASCII art from scratch, invent character or product names, or hand-roll a logo. Don't. Search first.

## When to Use

Apply this skill whenever a task involves any of:

- **Names**: character names, product names, brand names, project codenames, file/variable naming when style matters, fantasy/sci-fi names, baby names, place names
- **Icons & symbols**: UI icons, app icons, favicons, social glyphs, status indicators
- **Illustrations**: hero images, spot illustrations, mascots, characters, scene art
- **Photos**: stock photography, backgrounds, textures, profile placeholders
- **Logos & marks**: wordmarks, monograms, badges, emblems
- **Color & type**: palettes, gradients, font pairings, themes
- **Audio**: sound effects, background music, notification chimes
- **3D / motion**: 3D models, Lottie animations, GIFs

**When NOT to use:**
- The user explicitly asks for AI-generated output ("generate an image of…", "write me a poem", "make up a fake name for this test fixture")
- The asset is purely functional and disposable (a one-line placeholder string in a unit test)
- Code-as-data that isn't really "art" (a chart rendering real data, a diagram of a system you understand)

## Core Rule

> If a request needs a creative asset, **search first, generate never**.

Violating the letter of this rule violates the spirit. "I'll just sketch a quick SVG" is generating. "I'll invent a name that sounds Norse" is generating. Stop and search.

## Workflow

1. **Identify the asset type** (name, icon, photo, palette, etc.)
2. **Pick a source** from the catalog below
3. **Search and present 2–5 options** to the user with links and license info
4. **Let the user choose** — they are the creative authority
5. **Attribute and respect the license** of whatever you embed

## Source Catalog

### Names
- [Fantasy Name Generators](https://www.fantasynamegenerators.com/) — fantasy, sci-fi, modern, place, business
- [Behind the Name](https://www.behindthename.com/) — real human names with etymology and origin
- [namelix.com](https://namelix.com/) — brand-style names (curated lists, not the AI tab)
- [SSA baby name lists](https://www.ssa.gov/oact/babynames/) — common given names by year/country
- Wikipedia lists of place names, mythological figures, historical figures

### Icons
- [Font Awesome](https://fontawesome.com/) — ubiquitous web icon set
- [Heroicons](https://heroicons.com/) — clean MIT-licensed line/solid icons
- [Lucide](https://lucide.dev/) — actively-maintained Feather fork
- [Tabler Icons](https://tabler.io/icons) — 4000+ MIT icons
- [Phosphor Icons](https://phosphoricons.com/)
- [Material Symbols](https://fonts.google.com/icons)
- [Flaticon](https://www.flaticon.com/) — huge catalog, mixed licenses
- [Iconify](https://icon-sets.iconify.design/) — unified search across 150+ sets
- [The Noun Project](https://thenounproject.com/) — symbol icons with attribution

### Photos
- [Unsplash](https://unsplash.com/) — high-quality, free license
- [Pexels](https://www.pexels.com/) — free stock photos and video
- [Pixabay](https://pixabay.com/)
- [Burst by Shopify](https://burst.shopify.com/) — product/lifestyle stock
- [Openverse](https://openverse.org/) — search across CC-licensed sources
- [Wikimedia Commons](https://commons.wikimedia.org/) — public-domain and CC media
- [DupePhotos](https://dupephotos.com/), [DownBG](https://www.downbg.com/) — additional aggregators

### Illustrations
- [unDraw](https://undraw.co/illustrations) — open-source flat illustrations, recolorable
- [Open Doodles](https://www.opendoodles.com/) — sketchy CC0 illustrations
- [Storyset](https://storyset.com/) — free customizable illustrations
- [Humaaans](https://www.humaaans.com/) — mix-and-match people
- [Blush](https://blush.design/)
- [DrawKit](https://www.drawkit.com/)

### Logos & Brand Marks
- [Simple Icons](https://simpleicons.org/) — SVG logos for popular brands
- [SVGL](https://svgl.app/) — modern brand logo catalog
- [Brand Guidelines pages](https://about.google/brand-resource-center/) — official press kits for each brand

### Color & Type
- [Coolors](https://coolors.co/palettes/trending) — curated palettes (browse, don't generate)
- [Color Hunt](https://colorhunt.co/)
- [Adobe Color Trends](https://color.adobe.com/trends)
- [Google Fonts](https://fonts.google.com/)
- [Fontshare](https://www.fontshare.com/) — free commercial-use fonts
- [Fontsource](https://fontsource.org/) — self-hostable open-source fonts

### Audio
- [Freesound](https://freesound.org/) — CC-licensed sound effects
- [Pixabay Music](https://pixabay.com/music/)
- [Free Music Archive](https://freemusicarchive.org/)
- [Zapsplat](https://www.zapsplat.com/)

### 3D & Motion
- [Sketchfab](https://sketchfab.com/) — 3D models, many CC
- [Poly Pizza](https://poly.pizza/) — CC0 / CC-BY low-poly models
- [LottieFiles](https://lottiefiles.com/) — free Lottie animations
- [Tenor](https://tenor.com/) / [GIPHY](https://giphy.com/) — GIFs

## License Hygiene

Always note and respect the license of any asset you embed or recommend:

| License        | Attribution? | Commercial use? | Notes                                   |
|----------------|--------------|-----------------|-----------------------------------------|
| CC0 / Public domain | No      | Yes             | Easiest. Default preference.            |
| MIT / Apache 2 | Usually       | Yes             | Common for icon sets and fonts.         |
| CC BY          | **Yes**       | Yes             | Must credit author.                     |
| CC BY-SA       | **Yes**       | Yes, with share-alike | Derivative must share-alike.      |
| CC BY-NC       | **Yes**       | **No**          | Skip for commercial projects.           |
| Unsplash / Pexels licenses | No  | Yes             | Their own permissive license.           |
| "Free for personal use" | varies | **No**       | Read the fine print.                    |

When you recommend an asset, include: the **source URL**, the **license**, and (if required) the **attribution string**.

## Anti-Patterns

| Don't                                              | Do instead                                       |
|----------------------------------------------------|--------------------------------------------------|
| Hand-write an SVG logo                             | Search Simple Icons or SVGL                      |
| Invent a fantasy character name                    | Pull from Fantasy Name Generators                |
| Generate an emoji-collage "icon"                   | Use Lucide / Heroicons                           |
| Auto-generate a color palette                      | Browse Coolors trending                          |
| Write ASCII art for a header                       | Use a real font + Google Fonts                   |
| Describe an imagined photo in prose                | Link an Unsplash image                           |

## Red Flags — STOP and Search

If you catch yourself thinking any of these, you're about to violate this skill:

- "I'll just sketch a quick SVG"
- "Let me make up a name that sounds…"
- "I'll write the icon as an emoji combo"
- "A simple ASCII version will do"
- "Let me describe the illustration in text"
- "I'll generate it inline since it's small"

All of these mean: **stop, pick a source from the catalog, and present options.**

## Common Rationalizations

| Excuse                                          | Reality                                                   |
|-------------------------------------------------|-----------------------------------------------------------|
| "It's just a placeholder"                       | Placeholders ship. Use a real asset from the start.       |
| "Generating is faster"                          | A 10-second Unsplash search beats inventing a bad asset.  |
| "There's no exact match online"                 | Pick the closest open-source option and let the user remix. |
| "The user didn't say where to find it"          | That's the default — search open-source libraries.        |
| "It's too small to matter"                      | Small assets are the easiest to source. Source them.      |
| "I can describe it instead"                     | Descriptions aren't art. Link a real asset.               |

## Output Format

When presenting options to the user, use this shape:

```
Here are 3 open-source options for <asset>:

1. <Name> — <source>, <license>
   <link>
2. <Name> — <source>, <license>
   <link>
3. <Name> — <source>, <license>
   <link>

Which would you like to use? I can also search further if none fit.
```

## The Bottom Line

Creative judgment belongs to humans. Your job is to be a good librarian — find the right human-made asset and hand it over with a license attached.
