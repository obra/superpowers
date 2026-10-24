---
name: writing-specs
description: "Use after brainstorming reaches an approved design, or when your human partner asks for a spec directly or hands you written requirements. Writes, reviews, and gates the spec document before planning starts."
---

# Writing Specs

<ENTRY-GATE>
You normally arrive from brainstorming with a design your human partner approved section by section. Arriving from interactive-design with a reconciled contract ledger is an equivalent entry. Direct entry is allowed when your human partner asks for a spec or supplies written requirements; skipping brainstorming is their call, never yours.
</ENTRY-GATE>

## 1. Gather context

On direct entry, have background subagents explore prior art, the affected surfaces, and relevant docs. Ask your human partner only what they alone know. When an open decision changes what gets built, ask one question per message. If several are open, use the brainstorming skill instead.

Whether you entered directly or arrived from brainstorming, delegate searches for what the app already shows or does through agent-routing. Send a narrow question to `lookup`, and tell it to stop at the first complete answer. Send a wide question to `explorer`. The first time you delegate, tell your human partner in one line which routes you are using and that they can name a different model. Do not wait for a reply.

## 2. Write the spec

Commit it to `docs/toolbelt/specs/YYYY-MM-DD-<topic>-design.md`, or where your human partner names. Cover architecture, components, data flow, error handling, and testing, each scaled to its complexity.

- Put global constraints at the top, verbatim: version floors, dependency limits, naming and copy rules, platform requirements. Every task inherits them.
- Split the design into units with one purpose and defined interfaces.
- Cut anything the design does not need. Fix existing problems only where they affect this work.
- Leave no placeholders such as "TBD", "add error handling", or "similar to the above". A deferred decision only moves into the plan.

Every spec has a **What already exists** section. For each piece of information the feature shows and each calculation or decision it makes, name where the app already shows or does it, by screen, the shared piece that owns it, or that none exists. When the same thing will appear in more than one place, say whether it is shared from the start, what has to stay the same everywhere, and what each place may do differently. This section names screens and concepts, not files; paths and symbols belong to the plan.

## 3. Review

Check the spec once for placeholders, contradictions, requirements open to two readings, and scope too large for one plan. Fix what you find inline. Then ask your human partner:

> "Spec written and committed to `<path>`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan."

Wait. Make any requested changes; proceed only once they approve.

After approval, route a `reviewer` with specialty `spec` through toolbelt:agent-routing, on a different harness from yours. If none exists, stop and tell your human partner. The reviewer checks for gaps, ambiguity, and poor design, and answers: "Where would you have to guess, and what would you build that probably already exists?" Fix small technical gaps and proceed. Take a rework that changes the idea, or any doubt, to your human partner.

Then invoke the writing-plans skill. Do NOT invoke any other skill.
