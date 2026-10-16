---
name: brainstorming
description: "Elicit requirements, calibrate project scope, and validate design specifications prior to executing feature creation, component construction, behavior modification, or project planning."
---

# Brainstorming

## Request Evaluation and Initialization

- Evaluate the input request to determine the completeness of target objectives, operational constraints, and acceptance criteria.
- Execute the task via the standard workflow and report the completed action when the input request specifies complete execution parameters.
- Emit an initial response containing 2 sequential elements when the input request omits target objectives, operational constraints, or acceptance criteria:
  + Initial element 1 ➔ State in 1 sentence the option to bypass requirement elicitation for immediate execution, and upon user confirmation of bypass, declare each autonomous implementation choice regarding platform, language, or medium in 1 sentence prior to executing the standard workflow.
  + Initial element 2 ➔ Pose 1 open single-sentence question anchored in a concrete usage scenario or target stakeholder context, isolated from example answer lists.

## Requirement Elicitation Protocol

- Conclude each elicitation message with 1 open single-sentence question isolated from example answer lists.
- Align terminology with the user's domain vocabulary using concise declarative statements, isolated from internal process jargon and procedural meta-explanations.
- Present primary findings at the opening of each status report and offer supplementary details upon user request.
- Prioritize open-ended descriptive questions to capture user intent in native phrasing, present a compact option menu exclusively when the user remains stalled, and propose 1 concrete recommendation when the user delegates the choice.
- Identify early in the dialogue which implementation parameters regarding platform, programming language, libraries, medium, tools, and materials the user defines versus which parameters the user delegates.
- Inherit existing architectural patterns, tools, and dependencies when an established codebase or project exists.
- Declare each autonomous default selection explicitly to the user during the dialogue and record each autonomous selection in the design document as a builder call.
- Extract requirement attributes across 6 operational dimensions through situational inquiry and falsifiable hypotheses, isolated from direct recitation of the dimension labels:
  + Artifact classification ➔ Core entity type and differentiating attributes
  + Temporal and outcome framing ➔ Triggering context and measurable success criteria
  + Boundary definition ➔ Target goals, non-goals, and anti-goals defining failure states despite technical functionality
  + Comparative baseline ➔ Reference implementations and prior art preferences
  + System state ➔ Existing assets and prior implementation attempts
  + Granular constraints ➔ Priority domain details and failure-sensitive parameters
- Propose targeted reconnaissance of the local codebase, project files, user data, or web sources by specifying the exact target information prior to inspection, and execute the inspection upon user approval.
- Generate multiple candidate approaches internally, filter out candidates that conflict with stated user objectives, and present comparative trade-offs exclusively when comparison aids user decision-making.
- Propose a rapid throwaway spike with minimal test coverage and bypassed formal planning when empirical prototyping clarifies requirement ambiguity or technical feasibility, and integrate the resulting empirical findings back into the elicitation dialogue.

## Iterative Playback and Visual Companion

- Synthesize each validated requirement component regarding purpose, target users, or behavioral logic into a 200-to-300-word playback summary upon reaching functional clarity, alternating between playback summaries and single-question inquiries across each remaining component.
- Label each inferred assumption explicitly as an agent hypothesis distinct from user-stated specifications, and conclude each playback summary with 1 question prompting the user to identify discrepancies or omitted details.
- Evaluate prior to transmitting each playback summary or inquiry whether the target content involves 1 of 5 visual structures:
  + Visual interfaces ➔ Screens, pages, printouts, or signage
  + Spatial arrangements ➔ Screen layouts, room plans, or schedules
  + Sequential workflows ➔ Multi-step process flows
  + Comparative variants ➔ Side-by-side design alternatives
  + Structural representations ➔ Diagrams, timelines, or maps
- Transmit a standalone message containing the exact string "This might be easier if I show you. Want me to open a browser tab with some mockups?" upon the first occurrence of a visual structure while holding the pending playback summary for the subsequent turn.
- Read visual-companion.md in the current skill directory prior to initializing the display server upon user acceptance, and pair subsequent visual playback summaries or layout inquiries with browser-based mockups, side-by-side options, or clickable prototypes while maintaining conceptual, scope, and trade-off inquiries in text.
- Maintain text-only communication across subsequent turns when the user declines the visual companion, activating browser rendering exclusively upon a subsequent explicit user request.

## Scope Classification and Design Specification

- Classify the validated requirement into 1 of 3 execution scopes and state the selected scope to the user while permitting user override:
  + Self-contained single-step request ➔ Quick, clear task: treat the input request as the complete specification and execute immediately
  + Localized modification within existing structure ➔ Small change: validate the specification in chat and execute via the standard workflow
  + Multi-component system or new architecture ➔ Project with a written design: compile a formal design document and transition to a full implementation plan (invoke superpowers:writing-plans for software projects)
- Halt execution, notify the user, and escalate the scope classification to the next tier when task complexity expands beyond the active tier during execution.
- Partition multi-project requests into independent sub-projects, establish a sequential execution order with the user, and execute the brainstorming workflow for 1 sub-project at a time.
- Compile the design document for project-tier work with sufficient technical precision for independent implementation planning across 5 mandatory sections:
  + Intent and rationale ➔ Core problem statement and operational why
  + Boundary conditions ➔ Target goals, non-goals, and anti-goals
  + System constraints ➔ Technical, environmental, and resource limits
  + User decisions ➔ Implementation parameters explicitly selected by the user
  + Builder scope ➔ Delegated implementation choices and autonomous builder calls
- Commit the design document to docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md for software repository projects, query the user for the target storage path in external project contexts, and apply a user-specified storage preference as the overriding target.

## Builder Verification and Execution Gate

- Notify the user prior to drafting the design document that a builder verification pass will precede document delivery and may generate 1 follow-up question round.
- Dispatch a fresh subagent with builder-check-prompt.md from the current skill directory to audit the draft design document, or execute the builder verification pass directly when subagent dispatch is unavailable, holding document delivery until verification completes.
- Categorize each builder inquiry generated during verification into 1 of 3 resolution buckets:
  + Answered inquiry ➔ Integrate the existing answer from the prior dialogue or project context directly into the design document
  + Minor technical detail ➔ Resolve autonomously while preserving target behavior and record the decision as a builder call in the design document
  + User-owned decision ➔ Consolidate inquiries that alter target behavior into 1 message ordered by impact priority for user resolution
- Update the design document with the user's responses from the single verification round and deliver the finalized design document alongside a summary list of autonomous builder calls for user review.

<HARD-GATE>
- Enforce a strict execution lock prior to writing production code, scaffolding files, installing dependencies, creating projects, or invoking implementation skills until the user explicitly approves the complete specification (in-chat specification for a small change, or finalized design document for a project), separating preliminary agreement on an initial concept from formal specification approval.
- Permit read-only exploration and user-approved throwaway spikes during requirement elicitation, isolate each throwaway spike as disposable code, and route each request to retain spike artifacts back through the specification approval gate as a new request.
- Release the execution gate immediately when the user opts out of requirement elicitation during session initialization.
- Transition exclusively to the planning phase upon user approval of a project design document by invoking superpowers:writing-plans for software projects.
</HARD-GATE>

- Resolve operational conflicts in descending order of precedence: Explicit user opt-out or storage override > Hard-gate specification approval > Just-in-time visual companion offer > Iterative playback and single-question elicitation > Autonomous builder defaults.
