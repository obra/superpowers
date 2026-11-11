# Brainstorming rebuild: intent

## Why this exists

Coding agents are very good at building. They build what they believe the
human wants, and they rarely ask enough or look around enough before they
start. The brainstorming skill exists to close that gap: draw the human's
real intent out of them, including the parts they haven't worked out yet,
before anything gets built.

The original superpowers prompt did this well in about forty words: "I've
got an idea in my head. I'd like you to ask me lots of questions about it.
As you think you understand what I really want, describe it to me in
chunks of about 200-300 words. Once we're dialed in, write out an informal
spec." The current skill has grown to about 2,600 words, almost all of it
about routing (spike / bounded / architectural), approval gates, and the
spec-to-plan handoff. Intent got squeezed into one paragraph whose default
move is "ask one focused question about purpose", which doesn't work on
people.

This is a rewrite from scratch, not an edit.

## Goals

- The agent understands the *why* behind anything non-trivial, because an
  agent that knows the why makes the hundred unstated decisions well.
- The human ends up thinking through what they actually want. Good
  questions help them flesh out an idea they haven't finished forming.
- Works for any domain: software, a talk, a renovation, a small business.
- Ends with a document a talented builder in that domain could plan from
  without going back to the human.

## How a session should feel

**Start with a private check.** The agent asks itself: what do I actually
know about what they want, and why? If the answer is "nearly everything"
("make the icon cornflower blue"), it confirms and moves on. If anything
non-trivial is missing, it starts asking.

**Ask, one question at a time.** Plain language by default, pitched just a
little above the human's level. Questions should help the human think, not
quiz them.

- Get them describing first. Open questions beat menus because menus
  garden-path people toward the agent's assumptions.
- Offer a menu only when they're struggling.
- If they say "just guess" or "what do you think", always propose.
- Ground questions in real moments ("walk me through the last time...")
  and concrete tradeoffs ("if it could only do one of these well...").
- Ask about prior art and current state: what exists elsewhere, what
  exists now.
- Ask which parts of the *how* they want to decide, and which they'd
  rather hand to the builder.

The ground to cover, loosely in order: what kind of thing this is, what
makes it special, goals, non-goals, anti-goals, the details they care
about, and what they want to delegate. These are territory, not a script.
The agent never reads them out as literal questions.

**Offer recon.** Once there's some grounding, the agent offers to go look:
the codebase or project, the human's own files and data, or the web. The
human decides whether it goes.

**Show, don't tell, once things get concrete.** Use the visual companion
for diagrams, mockups, and throwaway prototypes where seeing beats reading.

**Spike to feel things out.** Agentic development is waterfall, but very,
very fast. A quick throwaway build is often the cheapest way to find out
what the human wants or whether something works, and the agent should
offer one when it would help. When the human just wants to spike, the
agent gets out of the way. Spikes have no tests or minimal ones, aren't
bulletproof, and don't go through the full plan, implementation, and
review process. What a spike teaches feeds back into the conversation.

**Think wide internally.** Before proposing anything, the agent generates
several ideas and discards the weak ones. It shows the human the comparison
only when that helps them decide.

**Play it back.** Once the agent thinks it understands, it describes its
understanding in chunks of roughly 200-300 words and adjusts after each.

## What it produces

A plain written document covering:

- intent and the why
- goals, non-goals, anti-goals
- constraints
- the parts of the how the human cares about, as they decided them
- what's explicitly left to the builder

**Done test:** before the human reviews it, a fresh subagent playing a
talented builder in the domain reads the document and lists what it would
still need to ask. Those questions go back to the human. The document is
done when the builder has nothing important left to ask.

**Sizing the work.** Once intent is clear, the agent sorts the work into
one of three sizes, says which out loud, and lets the human override:

- **A quick, clear task.** Intent was clear from the start. Confirm and do it.
- **A small change.** The full description lives in chat. No document file.
- **A project with a written design.** The full description is the
  document above, followed by a full plan (for software, the writing-plans
  skill).

This is where the old spike / bounded / architectural choice lives now:
after intent, not before it, with plain names.

**Approval.** Whatever the size, the human approves the full description
before anything gets built: in chat for a small change, by reading the
document for a project.

**Opting out.** Early in the session, the agent mentions once that if the
human doesn't want to go through this process, they can just say so.

## Non-goals

- Designing architecture the human didn't ask to decide. The doc records
  the how the human cares about; the rest belongs to the builder.
- Being software-specific.
- Ceremony for trivial requests.

## Anti-goals

- Interrogation: a checklist of questions read at the human.
- Garden-pathing: steering the human into the agent's preferred idea with
  leading menus.
- "What are you actually trying to do?" style questions that ask the human
  to do the agent's thinking.
- Small asks inflating into multi-phase projects.
- Building before the human agrees with the playback.

## Decisions

- The skill keeps the name `brainstorming`. Other skills and the README
  point at it.
- The visual companion and its server scripts stay as they are.
- `spec-document-reviewer-prompt.md` is replaced by the builder-check prompt.
- The agent screens the builder check's questions before bringing them to
  the human: it answers what it can from context and drops questions about
  delegated details. Without a subagent tool, it runs the check itself.
- A short hard gate stays: nothing gets built until the human approves the
  full description. One exception: a spike the human said yes to. It stays
  labeled throwaway. Keeping what it produced is a new request and goes
  through the gate.
- The builder check runs only on the written document. Small changes stay
  in chat.
- The trigger description keeps the strong "use before any creative work"
  wording. The opening check keeps trivial asks cheap.
- The todo-list example from the old skill goes. The evals that encode the
  old routing (`brainstorming-todo-purpose-discovery`,
  `brainstorming-todo-shared-intent`) get rewritten to match.
- Software projects keep `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
  as the default location for the document.

## Left to the builder

- Section structure and wording of the skill.
- Exact prompts for the builder check.
- Where non-software documents get saved, absent a human preference.

## Will be tuned after first use

Jesse expects to tune the skill after real sessions. Ship something small
and sharp rather than complete.
