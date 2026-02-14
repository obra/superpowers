# Troubleshooting Skills

> From Anthropic's [Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)

## Skill won't upload

**Error: "Could not find SKILL.md"** — File not named exactly SKILL.md (case-sensitive). Verify with `ls -la`.

**Error: "Invalid frontmatter"** — YAML formatting issue. Common mistakes:
```yaml
# Wrong - missing delimiters
name: my-skill
description: Does things

# Wrong - unclosed quotes
---
name: my-skill
description: "Does things
---

# Correct
---
name: my-skill
description: Does things
---
```

**Error: "Invalid skill name"** — Name has spaces or capitals. Use kebab-case: `my-cool-skill` not `My Cool Skill`.

## Skill doesn't trigger

**Symptom:** Skill never loads automatically.

**Fix:** Revise your description field. Quick checklist:
* Is it too generic? ("Helps with projects" won't work)
* Does it include trigger phrases users would actually say?
* Does it mention relevant file types if applicable?

**Debugging approach:** Ask Claude: "When would you use the [skill name] skill?" Claude will quote the description back. Adjust based on what's missing.

## Skill triggers too often

**Symptom:** Skill loads for unrelated queries.

**Solutions:**
1. **Add negative triggers:**
   ```
   description: Advanced data analysis for CSV files. Use for statistical modeling,
   regression, clustering. Do NOT use for simple data exploration (use data-viz skill instead).
   ```
2. **Be more specific:**
   ```
   # Too broad
   description: Processes documents
   # More specific
   description: Processes PDF legal documents for contract review
   ```
3. **Clarify scope:**
   ```
   description: PayFlow payment processing for e-commerce. Use specifically for online
   payment workflows, not for general financial queries.
   ```

## Instructions not followed

**Symptom:** Skill loads but Claude doesn't follow instructions.

**Common causes:**

1. **Instructions too verbose** — Keep concise, use bullet points and numbered lists, move detailed reference to separate files
2. **Instructions buried** — Put critical instructions at the top, use `## Important` or `## Critical` headers, repeat key points if needed
3. **Ambiguous language:**
   ```
   # Bad
   Make sure to validate things properly

   # Good
   CRITICAL: Before calling create_project, verify:
   - Project name is non-empty
   - At least one team member assigned
   - Start date is not in the past
   ```
4. **Model "laziness"** — Add explicit encouragement:
   ```
   ## Performance Notes
   - Take your time to do this thoroughly
   - Quality is more important than speed
   - Do not skip validation steps
   ```
   Note: Adding this to user prompts is more effective than in SKILL.md

**Advanced technique:** For critical validations, consider bundling a script that performs the checks programmatically rather than relying on language instructions. Code is deterministic; language interpretation isn't.

## MCP connection issues

**Symptom:** Skill loads but MCP calls fail.

**Checklist:**
1. **Verify MCP server is connected** — Claude.ai: Settings > Extensions > [Your Service], should show "Connected" status
2. **Check authentication** — API keys valid and not expired, proper permissions/scopes granted, OAuth tokens refreshed
3. **Test MCP independently** — Ask Claude to call MCP directly (without skill): "Use [Service] MCP to fetch my projects". If this fails, issue is MCP not skill.
4. **Verify tool names** — Skill references correct MCP tool names, check MCP server documentation, tool names are case-sensitive

## Large context issues

**Symptom:** Skill seems slow or responses degraded.

**Causes:** Skill content too large, too many skills enabled simultaneously, all content loaded instead of progressive disclosure.

**Solutions:**
1. **Optimize SKILL.md size** — Move detailed docs to references/, link instead of inline, keep SKILL.md under 5,000 words
2. **Reduce enabled skills** — Evaluate if you have more than 20-50 skills enabled simultaneously, recommend selective enablement, consider skill "packs" for related capabilities

## Iteration signals

**Undertriggering signals:** Skill doesn't load when it should, users manually enabling it, support questions about when to use it.
**Solution:** Add more detail and nuance to the description — include keywords particularly for technical terms.

**Overtriggering signals:** Skill loads for irrelevant queries, users disabling it, confusion about purpose.
**Solution:** Add negative triggers, be more specific.

**Execution issues:** Inconsistent results, API call failures, user corrections needed.
**Solution:** Improve instructions, add error handling.
