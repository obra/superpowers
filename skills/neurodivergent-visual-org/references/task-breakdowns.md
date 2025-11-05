---
created: 2025-11-02T22:59
updated: 2025-11-02T23:06
---
# Task Breakdown Patterns

## Overview

Task breakdowns help transform overwhelming tasks into manageable micro-steps with clear sequencing and time estimates.

## When to Use

- User says a task feels overwhelming or they don't know where to start
- User needs to see all the steps involved in something
- User mentions procrastination or executive dysfunction around a task
- User wants time estimates for planning

## Pattern: Linear Task Timeline

Use for tasks with a clear sequential order (cleaning, cooking, admin work).

```mermaid
gantt
    title Clean Messy Bedroom (1 hour)
    dateFormat mm:ss
    section Phase 1: Quick Wins
    Bin obvious rubbish           :00:00, 04:00
    Grab dirty dishes/cups        :04:00, 03:00
    section Phase 2: Surfaces
    Remove clutter from bed       :07:00, 05:00
    Remove clutter from desk      :12:00, 05:00
    Put clean clothes away        :17:00, 08:00
    section Phase 3: Floor
    Pick up items from floor      :25:00, 10:00
    Quick vacuum                  :35:00, 08:00
    section Phase 4: Final Pass
    Make bed                      :43:00, 05:00
    Straighten desk               :48:00, 04:00
    Final look-around             :52:00, 03:00
```

**Key features:**
- Starts with easiest/"quick win" tasks to build momentum
- Groups related micro-tasks into phases
- Shows realistic time estimates (not "it should only take 10 minutes")
- Each step is 3-10 minutes maximum

## Pattern: Branching Task Breakdown

Use for tasks with multiple possible approaches or conditional steps.

```mermaid
flowchart TD
    Start[Process unread emails] --> Check{How many emails?}
    Check -->|< 20 emails| Batch[Do all at once<br/>15-20 min]
    Check -->|20-50 emails| Triage[Triage first<br/>Quick skim: 5 min<br/>Flag urgent: 2 min<br/>Then process: 20 min]
    Check -->|> 50 emails| Declare[Declare email bankruptcy<br/>Archive all<br/>Start fresh: 2 min]
    
    Batch --> Done[Take break]
    Triage --> Process[Process flagged first<br/>10 min]
    Process --> Remaining[Batch remaining<br/>15 min]
    Remaining --> Done
    Declare --> Notify[Send note to key people<br/>if needed: 5 min]
    Notify --> Done
    
    style Start fill:#e1f5ff
    style Done fill:#d4f1d4
    style Declare fill:#fff3cd
```

**Key features:**
- Acknowledges different scenarios require different approaches
- Includes the "give yourself permission to not do it perfectly" option
- Shows decision points clearly
- Gives time estimates for each path

## Pattern: Energy-Aware Task Sequence

Use when user mentions energy levels, burnout, or needs to pace themselves.

```mermaid
flowchart LR
    subgraph Low Energy
        L1[Check calendar<br/>2 min<br/>⚡]
        L2[Reply to 1 easy email<br/>3 min<br/>⚡]
        L3[Water plants<br/>5 min<br/>⚡]
    end
    
    subgraph Medium Energy  
        M1[Write draft of doc<br/>20 min<br/>⚡⚡]
        M2[Review teammate's work<br/>15 min<br/>⚡⚡]
        M3[Organize files<br/>15 min<br/>⚡⚡]
    end
    
    subgraph High Energy
        H1[Deep work on project<br/>45 min<br/>⚡⚡⚡]
        H2[Lead team meeting<br/>30 min<br/>⚡⚡⚡]
        H3[Complex problem-solving<br/>60 min<br/>⚡⚡⚡]
    end
    
    Start[Assess current energy] --> Choose{What's your<br/>energy level?}
    Choose -->|Low| L1
    Choose -->|Medium| M1
    Choose -->|High| H1
    
    style Start fill:#e1f5ff
    style Choose fill:#fff3cd
```

**Key features:**
- Sorts tasks by energy cost, not just priority
- Gives permission to match tasks to current capacity
- Includes actual time estimates
- Uses clear energy indicators (⚡)

## Language Guidelines

**Use compassionate, neurodivergent-friendly language:**

✅ DO:
- "Quick win tasks to build momentum"
- "If this feels like too much, try..."
- "Take a 5-minute break after this"
- "This is the minimum viable version"
- "You can skip/modify this if needed"

❌ DON'T:
- "This should only take..."
- "Just do it"
- "Stop procrastinating"
- "It's easy"
- "Anyone can..."

## Time Estimate Guidelines

**Be realistic and generous:**
- Add buffer time (if something takes 10 minutes, say 15)
- Include transition time between tasks
- Account for getting started (the hardest part)
- Remember: estimates are not deadlines

**Example format:**
- "Sort laundry: 7 min" (not "5 min" even if that's technically enough)
- "Clear desk: 10 min + 2 min to find a home for mystery items"
- "Write email: 5 min to draft, 2 min to edit, 1 min to send"
