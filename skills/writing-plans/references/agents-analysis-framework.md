# Agents Analysis Framework

Use this framework to define the scope, boundaries, and capabilities of an agent or autonomous system.

## Core Dimensions
Define these for every agent:
- **Purpose**: The specific goal or outcome the agent is responsible for.
- **Capability**: Explicit in-scope functions and out-of-scope limitations.
- **Perception**: What the agent can "see" (APIs, events, user input).
- **Action**: What the agent can "do" (outputs, API calls, side effects).
- **Environment**: Constraints, policies, and available tools.

## Capability Ladder
Assess the required intelligence level:
1. **Reflex**: Simple trigger-response (if X then Y).
2. **Representation**: Maintains internal state or models of the world.
3. **Reasoning/Planning**: Evaluates multiple paths to achieve a goal.
4. **Anticipation**: Predicts external changes or other agents' behaviors.
