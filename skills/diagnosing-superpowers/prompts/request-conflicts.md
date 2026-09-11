Read `prompts/analyst-common.md` first; it gives your role, inputs,
context-safety rules, and the return format. This file adds the dimension.

Dimension: Request conflicts

1. List every human prompt with line and turn. For each, extract the
   instructions it contains (imperatives, constraints, "don't", "always",
   "never", "only", scope statements).
2. Report:
   - two human instructions that cannot both be followed (quote both, with
     lines), and what the assistant did;
   - a human instruction that conflicts with an instruction file loaded in
     the session (CLAUDE.md, AGENTS.md, GEMINI.md, or the harness's
     equivalent; paths are in the case file), quoting both;
   - a human instruction to skip, ignore, or override a step, skill, or
     rule, and what happened afterwards;
   - an instruction the assistant asked to clarify and the answer, when the
     answer changed scope.
3. Do not judge whether your human partner was right. Report the conflict
   and the assistant's resolution.
