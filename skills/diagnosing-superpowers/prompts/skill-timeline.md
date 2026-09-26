Read `prompts/analyst-common.md` first; it gives your role, inputs,
context-safety rules, and the return format. This file adds the dimension.

Dimension: Skill timeline

Build the per-human-turn record of skill and plugin use, then look for gaps.

1. List the human prompts with line numbers and timestamps.
2. Using the skill-invocation and attribution meanings established in the case
   file, list every explicit invocation, active-skill attribution, or read of a
   file named `SKILL.md`. Record the line, the skill name, and the human turn it
   happened in.
3. List every non-superpowers plugin, skill, agent type, MCP server, or
   hook used, and each plugin whose instructions were loaded or injected into
   the relevant session even without a tool call. Distinguish loaded from
   invoked and merely catalog-listed. Use only evidenced tool, attribution,
   injection, agent-dispatch, MCP, and hook meanings from the case file.
4. For each human turn, compare the request text against the trigger
   descriptions of the superpowers skills installed (read
   `<install root>/skills/*/SKILL.md` frontmatter `description` lines; the
   install root is in the case file). Report as findings:
   - a skill invoked, with the request that preceded it (one finding per
     invocation is fine when there are few; group by skill when many);
   - a turn whose request matches a skill's trigger description with no
     invocation in that turn (state which description matched and quote
     the request);
   - a skill invoked one or more turns after the matching request (late);
   - each non-superpowers plugin/skill/tool used, with where; note any loaded
     or injected instructions that could confound the finding without claiming
     they caused it. Record any clean reproduction without them; otherwise
     state the uncertainty.

Do not say whether a missed or late trigger was wrong. Report the match
and the absence; the reader decides.
