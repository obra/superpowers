---
name: article-summarizer
description: Use when summarizing a technical article, tutorial, blog post, or concept explainer the user shares as URL, file, or pasted text, especially when they want terms defined, the problem framed, and the solution mapped with a mind map.
---

# Article Summarizer

Produce a structured summary of **technical concept / tutorial** articles. Output always has three sections: **Terms**, **Problem**, **Solution**. See `output-template.md` for format.

## Hard Rules

- **Read the full article** (or the user-provided excerpt) before writing. If only a URL is given and fetch fails, ask for paste or file — do not invent content.
- **Terms answer WHAT** — one-line definition per term; no implementation walkthrough here.
- **Problem answers WHY this article exists** — the gap, pain, or question the author addresses; not a repeat of the solution.
- **Solution** — mind map first (required), then a bullet list of key decisions / takeaways. Do not skip the map for “short” articles.
- **Stay faithful to the source** — distinguish author claims from your inference; mark inference as such.
- **Language:** match the article (Chinese article → Chinese summary) unless the user asks otherwise.

## Inputs

Accept any of:

- Article URL (fetch when possible),
- Local file path,
- Pasted text in chat.

Optional from user: focus areas, depth (brief vs detailed), audience (e.g. “for a backend dev new to Kafka”).

## Workflow

1. **Ingest** — load full text; note title, author, date if visible.
2. **Extract Terms** — concepts, tools, acronyms, frameworks named in the article; define each in plain language (WHAT only).
3. **Extract Problem** — what situation or limitation motivates the article; who cares; what goes wrong without the ideas here.
4. **Extract Solution** — how the article proposes to solve it: architecture, steps, patterns, trade-offs; build mind map from root → major branches → leaves; list 3–10 key decisions or actionable points below the map.
5. **Deliver** using the template in `output-template.md`.

## Mind Map Rules

- Use **Mermaid `mindmap`** in the Solution section (see template).
- Root node = core solution or main thesis (short phrase).
- Branches = major components, phases, or alternatives; leaves = concrete mechanisms, APIs, or constraints from the article.
- If the article compares options, branch under “Options” or “Approaches” rather than flattening.
- Add a **one-paragraph text summary** under the map when the flow is sequential (tutorial steps).

## Quality Bar

| Section | Good | Bad |
|---------|------|-----|
| Terms | “gRPC: RPC framework using HTTP/2 and Protobuf for service-to-service calls.” | Long tutorial steps under Terms |
| Problem | “Teams hit ambiguous REST contracts when 20+ services evolve independently.” | Restating the solution as the problem |
| Solution | Map + bullets tied to article sections | Generic advice not in the article |

## Common Mistakes

- Dumping the whole article into Terms.
- Mind map with only one level (use at least two levels when the article has structure).
- Bullets that duplicate the map verbatim — bullets should highlight **decisions, trade-offs, and must-remember points**.
- Summarizing marketing fluff as technical fact.
