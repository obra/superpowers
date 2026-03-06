---
name: prompt-optimizer
description: Automatically analyses the user’s original prompt, generates 3 optimised variants based on prompt-engineering best practices, presents them with clear explanations, and lets the user select the preferred version before the AI executes the task. This ensures higher-quality inputs and more accurate, useful responses.
---

# Prompt Optimizer

## Overview
This skill transforms raw user prompts into highly effective instructions. It automatically analyses the original prompt, generates 3 meaningfully improved versions, explains the key enhancements of each, and asks the user to choose one. This collaborative refinement step helps users send better prompts and enables the AI to understand their true intent more accurately.

## Activation Triggers
The skill activates automatically on any new user query that would benefit from refinement, or explicitly via:
- “Optimize this prompt…”
- “Improve my request…”
- “Give me better versions of this…”
- Any vague, broad, multi-part, or tool-building request where greater precision would help.

## Step-by-Step Workflow
1. **Extract Original Intent**  
   Identify the core objective, context, constraints, and desired outcome without altering the user’s goal.

2. **Analyse Opportunities**  
   Evaluate the prompt for clarity, specificity, role definition, structure, output format, reasoning instructions, examples, and success criteria.

3. **Generate Variants**  
   Create **3 to 4** distinct, complete, ready-to-use improved prompts. Each variant must preserve 100 % of the original intent while applying complementary enhancements.

4. **Present Choices**  
   Display the options professionally:
   - Numbered list (Option 1, Option 2, Option 3)
   - Short title for each
   - 1–2 sentence explanation of the key improvements
   - Full improved prompt inside a markdown code block

5. **Solicit Selection**  
   Explicitly ask the user to reply with the number of their choice (1–3), “0” to keep the original, request modifications, or provide a custom version.

6. **Execute Chosen Prompt**  
   Confirm the selection, apply the chosen (or adapted) prompt immediately, and deliver the final response. Briefly note the benefit of the selected improvement when appropriate.

## Prompt Engineering Guidelines
When generating variants, apply these proven techniques:
- Assign the most suitable expert role (e.g. Senior Software Developer, Technical Architect, Product Designer)
- Add specific details, constraints, and realistic examples
- Request chain-of-thought or step-by-step reasoning when beneficial
- Define precise output format (tables, JSON, bullet points, code structure, etc.)
- Include evaluation criteria or quality standards
- Maintain appropriate tone, length, and audience level
- Preserve every user-provided detail and preference

## Example

**User Original Prompt:**  
“Make me a tool that tracks my daily expenses.”

**Skill Response (excerpt):**

The original prompt is functional but quite broad. Below are four optimised variants that preserve your core intent while significantly increasing clarity and effectiveness.

**Option 1: Senior Python Developer + Modular CLI Tool**  
*Improvements: Assigns expert role, specifies Python and CLI interface, adds clear commands, JSON persistence, validation, and summary reporting.*

```markdown
You are a senior Python developer with 12+ years of experience building reliable command-line tools and personal finance utilities.

Create a complete, standalone Python script named expense_tracker.py that functions as a simple command-line expense tracker. The tool must support these commands:

- add YYYY-MM-DD "description" amount category
- list [--month MM-YYYY] [--category Food]
- summary [--month MM-YYYY]
- delete ID

Requirements:
- Store data persistently in expenses.json
- Use only standard library + argparse
- Include inline comments and a short README-style header

Output only the complete, ready-to-run Python code.

**Option 2: Chain-of-Thought + Detailed Feature Specification**
*Improvements: Forces step-by-step reasoning, separates must-have vs nice-to-have features, defines success criteria, and includes usage examples.*

```markdown
You are an expert software engineer specialising in user-centric personal productivity tools.

I want to build a daily expense tracking tool. Follow chain-of-thought reasoning…

**Option 3: Privacy-Focused Desktop Application**
*Improvements: Emphasises data privacy and local storage, chooses lightweight GUI, adds practical constraints for easy deployment.*

```markdown
Act as a privacy-focused full-stack developer experienced with lightweight desktop applications.

Design and implement a small, cross-platform desktop expense tracker…

Please reply with the number of the prompt you prefer (1, 2, or 3), 0 to keep your original prompt, or describe any modifications you would like.

**Best Practices**

Never override the user’s core intent.
Keep improvement explanations brief and actionable.
If the original prompt is already excellent, acknowledge it and offer only minor polish or proceed directly.
Combine seamlessly with other domain-specific skills.
Maintain full conversation context to avoid redundant optimisations.

**Success Criteria**

High user selection rate of improved prompts
Measurable increase in response quality and relevance
Positive feedback on the refinement experience

*This skill empowers users to collaborate more effectively with AI systems by systematically elevating prompt quality before execution.*