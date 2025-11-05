---
created: 2025-11-02T22:59
updated: 2025-11-02T23:06
---
# Decision Tools Patterns

## Overview

Decision tools help navigate complex choices, reduce decision paralysis, and externalize decision-making processes that can loop endlessly in neurodivergent minds.

## When to Use

- User feels stuck between options
- User is overthinking a decision
- User mentions analysis paralysis or decision fatigue
- User needs to weigh multiple factors
- User asks "should I...?"

## Pattern: Simple Decision Tree

Use for yes/no decisions or choices with clear criteria.

```mermaid
flowchart TD
    Start[Should I go to this social event?] --> Energy{Do I have<br/>enough energy?}
    Energy -->|No| Rest[Skip it<br/>Rest is valid]
    Energy -->|Maybe| Check{Will there be<br/>people I like?}
    Energy -->|Yes| Check
    
    Check -->|Yes| Commit[Go for 1-2 hours<br/>Give yourself permission<br/>to leave early]
    Check -->|Not sure| Info{Can I find out<br/>who's going?}
    Check -->|No| Benefit{Is there another<br/>benefit?}
    
    Info -->|Yes| Ask[Ask organizer<br/>Make informed choice]
    Info -->|No| Gut{Does your gut<br/>say go?}
    
    Gut -->|Yes| Trial[Try it for 1 hour<br/>You can always leave]
    Gut -->|No| Rest
    
    Benefit -->|Yes| Weigh[List pros & cons<br/>See matrix pattern]
    Benefit -->|No| Rest
    
    style Start fill:#e1f5ff
    style Rest fill:#f8d7da
    style Commit fill:#d4f1d4
    style Trial fill:#fff3cd
```

**Key features:**
- Acknowledges "no" is a valid answer
- Includes energy level as primary factor
- Gives permission to change mind / leave early
- No judgment for any path

## Pattern: Weighted Decision Matrix

Use for complex decisions with multiple factors.

```mermaid
graph TD
    subgraph Options
        A[Option A:<br/>Current Job]
        B[Option B:<br/>New Company]
        C[Option C:<br/>Freelance]
    end
    
    subgraph "Factors (1-5 scale)"
        F1[Mental Health Impact]
        F2[Financial Stability]
        F3[Growth Opportunity]
        F4[Work-Life Balance]
        F5[Team/Culture Fit]
    end
    
    A --> Score1[Total: 16/25<br/>✓ Stable, known<br/>⚠ Limited growth<br/>⚠ Burnout risk]
    B --> Score2[Total: 19/25<br/>✓ Better pay<br/>✓ Growth opportunity<br/>⚠ Unknown culture]
    C --> Score3[Total: 17/25<br/>✓ Flexibility<br/>✓ Control<br/>⚠ Income uncertainty]
    
    Score1 --> Think[Reflect:<br/>Which tradeoffs<br/>matter most to you<br/>RIGHT NOW?]
    Score2 --> Think
    Score3 --> Think
    
    style Think fill:#fff3cd
```

**Template for actual use:**
Create a table with:
- Rows: Your options
- Columns: Important factors (rate each 1-5)
- Total scores + key pros/cons

Then visualize the decision with the graph above.

**Key features:**
- Externalizes internal deliberation
- Makes tradeoffs explicit
- No "right answer" - shows what matters to YOU
- Acknowledges context (what matters "right now")

## Pattern: "If This, Then That" Logic

Use when decision depends on future unknowns or requires contingency planning.

```mermaid
flowchart LR
    Start[Accept freelance project?] --> Try[Try it for 1 month]
    
    Try --> Month1{After 1 month<br/>check-in}
    
    Month1 -->|Loving it| Cont1[Continue<br/>Set another check-in<br/>for month 3]
    Month1 -->|It's okay| Assess1[List what's working<br/>and what's not<br/>Decide if worth it]
    Month1 -->|Hating it| Exit1[Finish current work<br/>Don't renew<br/>No shame]
    
    Cont1 --> Month3{After 3 months<br/>check-in}
    Month3 -->|Still good| Cont2[Keep going<br/>You found something<br/>that works!]
    Month3 -->|Declining| Assess2[Time to reassess<br/>or pivot]
    
    style Start fill:#e1f5ff
    style Cont2 fill:#d4f1d4
    style Exit1 fill:#f8d7da
    style Assess1 fill:#fff3cd
    style Assess2 fill:#fff3cd
```

**Key features:**
- Removes pressure to know the future
- Built-in check-in points
- Permission to change your mind
- "Try it and see" instead of "commit forever"

## Pattern: Elimination Decision

Use when overwhelmed by too many options (restaurants, vacation spots, job offers).

```mermaid
flowchart TD
    Start[8 vacation options] --> Must[Filter by<br/>must-haves]
    
    Must --> List1[4 options remain]
    
    List1 --> Deal[Remove any<br/>deal-breakers]
    
    Deal --> List2[2 options remain]
    
    List2 --> Gut{Which one makes<br/>you more excited?}
    
    Gut -->|Option A| Pick1[Book Option A<br/>Stop researching]
    Gut -->|Option B| Pick2[Book Option B<br/>Stop researching]
    Gut -->|Both seem equal| Coin[Flip a coin<br/>If you feel disappointed,<br/>pick the other one]
    
    Coin --> Done[Decision made!<br/>No more second-guessing]
    Pick1 --> Done
    Pick2 --> Done
    
    style Start fill:#e1f5ff
    style Done fill:#d4f1d4
```

**Key features:**
- Reduces decision fatigue through filtering
- Uses gut-check method for final tie-breaker
- Coin flip trick reveals true preference
- Explicit "stop researching" boundary

## Language Guidelines

**Use reassuring, permission-giving language:**

✅ DO:
- "There's no perfect answer"
- "You can change your mind later"
- "What matters most to you *right now*?"
- "Trust your gut"
- "You can try it and see"
- "Not deciding is deciding - and that's okay too"

❌ DON'T:
- "Make the right choice"
- "Think it through more carefully"
- "You should know by now"
- "Just pick one"
- "Everyone else would..."

## Anti-Perfectionism Reminders

Include these where relevant:
- "Done is better than perfect"
- "You can course-correct later"
- "Most decisions are reversible"
- "Your future self will figure it out"
- "Good enough is actually good enough"
