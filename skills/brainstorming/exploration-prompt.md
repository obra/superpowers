# Brainstorming Exploration Prompt Template

Use this template when dispatching the codebase exploration subagent in Phase 0.5.

## Purpose

Medium-depth exploration of codebase structure and patterns to inform brainstorming questions. Runs AFTER issue context capture (if any) and BEFORE clarifying questions.

## Task for Subagent

```
You are exploring a codebase to provide context for a brainstorming session.

## Brainstorming Topic
[user's brainstorming topic from initial request]

## Issue Context (if available)
[issue title and body from Phase 0, or "None provided"]

## Your Task
Perform a medium-depth exploration (30-45 seconds max) focusing on what's relevant to the brainstorming topic.

## What to Find

1. **Project Structure**
   - Top-level directory organization
   - Key directories and their purposes
   - Where similar features currently live

2. **Relevant Patterns**
   - Naming conventions observed
   - Architectural patterns (MVC, layered, etc.)
   - How similar functionality is organized

3. **Topic-Relevant Code**
   - Files/modules related to the topic or issue
   - Existing implementations that might be extended
   - Relevant utilities or helpers

## Search Strategy
1. Glob for root config files to identify project type
2. List and explore key directories
3. Grep for keywords from the brainstorming topic
4. Read 2-3 most relevant files to understand patterns

## Output Format

CODEBASE EXPLORATION RESULTS
============================

Project Type: [e.g., "Node.js TypeScript", "Python FastAPI", "Rust CLI"]

Key Directories:
- [dir] - [purpose]
- [dir] - [purpose]

Where Similar Features Live:
- [path] - [what lives there]

Relevant Patterns:
- [pattern observed]
- [convention to follow]

Topic-Relevant Files:
- [file path] - [relevance to topic]
- [file path] - [relevance to topic]

Recommendations for Design Questions:
- [suggestion for what to ask about based on findings]
- [potential conflict or decision point discovered]

============================
```

## Usage

Dispatch with Task tool:
```
Task(
  description: "Explore codebase for brainstorming",
  prompt: [this template with placeholders filled],
  model: "haiku",
  subagent_type: "Explore"
)
```

Use returned findings to:
1. Ground clarifying questions in actual project structure
2. Reference real file paths and patterns when asking about placement
3. Identify potential conflicts with existing patterns early
