---
created: 2025-11-02T22:59
updated: 2025-11-02T23:06
---
# Accountability & Support Planning

## Overview

Accountability patterns help create external support systems that work WITH neurodivergent brains. Includes body doubling, check-ins, and knowing when/how to reach out.

## When to Use

- User mentions working alone feels impossible
- User asks about accountability partners or body doubling
- User struggles to start tasks without external pressure
- User mentions isolation or needing company
- User asks "how do I stay accountable?"
- User needs help knowing when to ask for support

## Pattern: Body Doubling Session Plan

Use when user wants to try body doubling (working alongside someone).

```mermaid
flowchart TD
    Start[Want to try body doubling?] --> Why[Why it works:<br/>Presence = external regulation<br/>Mirror neurons = motivation<br/>Parallel play for adults]
    
    Why --> Find{Find a body double}
    
    Find -->|Friend/partner| Personal[In person OR video call<br/>They work on their thing<br/>You work on yours]
    Find -->|Online community| Virtual[Body doubling apps:<br/>Focusmate<br/>Flow Club<br/>Caveday<br/>Study streams]
    Find -->|No one available| Self[Self-doubling:<br/>Work in cafe<br/>Library<br/>Public space]
    
    Personal --> Setup[Setup the session]
    Virtual --> Setup
    Self --> Setup
    
    Setup --> Rules[Session rules:<br/>5 min: Check in<br/>Share what you're working on<br/>45-50 min: Work silently<br/>5 min: Check out<br/>Share what you did]
    
    Rules --> During[During session:<br/>• No chatting during work time<br/>• Camera on if virtual<br/>• Minimal interaction<br/>• Parallel presence only]
    
    During --> Works{Does it help?}
    
    Works -->|Yes| Regular[Schedule regular sessions<br/>Works best with consistency]
    Works -->|Not sure| Try[Try 3 sessions<br/>before deciding]
    Works -->|No| Other[Try other support:<br/>Time-boxing<br/>Accountability check-ins<br/>Working in public]
    
    Regular --> Tips[Tips for success:<br/>• Same time helps<br/>• Match energy levels<br/>• Okay to do different tasks<br/>• End on time]
    
    style Start fill:#e1f5ff
    style Why fill:#fff3cd
    style Tips fill:#d4f1d4
```

**What body doubling is NOT:**
- Not collaboration (you work separately)
- Not socializing (minimal talking)
- Not teaching/helping (just presence)
- Not pressure (gentle accountability)

**What it IS:**
- Parallel work
- Borrowed motivation
- External regulation
- Warm companionship

## Pattern: Accountability Check-In Schedule

Use when user wants regular check-ins but not constant body doubling.

```mermaid
flowchart LR
    subgraph Monday[" Monday Morning"]
        M1[Plan week<br/>10 min]
        M2[Share plan with<br/>accountability partner<br/>5 min]
    end
    
    subgraph Daily[" Each Day"]
        D1[Morning:<br/>What's the ONE thing<br/>for today?<br/>Text or post<br/>2 min]
        D2[Evening:<br/>Did you do it?<br/>What got in the way?<br/>Text or post<br/>2 min]
    end
    
    subgraph Friday[" Friday Evening"]
        F1[Weekly review:<br/>What worked?<br/>What didn't?<br/>Adjust next week<br/>15 min]
        F2[Share with partner<br/>Or journal<br/>5 min]
    end
    
    Monday --> Daily --> Daily --> Daily --> Daily --> Friday
    
    Partner[Accountability partner<br/>checks your posts<br/>You check theirs<br/>No judgment,<br/>just presence] -.-> Monday
    
    style Monday fill:#e1f5ff
    style Daily fill:#fff3cd
    style Friday fill:#fef3c7
```

**Accountability partner guidelines:**
- NOT a manager or supervisor
- Someone also working on their goals
- Reciprocal support
- Check in on schedule
- Celebrate wins together
- No shame about struggles

**Where to find accountability partners:**
- ADHD online communities
- Friends with similar goals
- Coworkers (if appropriate)
- Paid accountability coaches
- Group programs

## Pattern: When to Reach Out Decision Tree

Use when user struggles knowing when to ask for help vs. figure it out alone.

```mermaid
flowchart TD
    Stuck[Feeling stuck/<br/>struggling] --> Try{Have you tried<br/>solving it yourself?}
    
    Try -->|No| Quick[Try for 10-15 min<br/>first]
    Try -->|Yes| How{How long have<br/>you been stuck?}
    
    Quick --> Tried[Tried for 10-15 min]
    
    Tried --> How
    
    How -->|< 30 min| Wait[Try a different approach<br/>Take a break<br/>Come back to it]
    How -->|30 min - 2 hours| Check{Is this time-sensitive<br/>OR blocking other work?}
    How -->|> 2 hours| Reach[Reach out now<br/>You've done your part]
    
    Check -->|Yes| Reach
    Check -->|No| Post[Post in async channel<br/>or scheduled check-in<br/>Continue other work]
    
    Reach --> Who[Who to reach out to?]
    
    Who --> List[Options:<br/>• Teammate who knows this<br/>• Manager if unsure who<br/>• Online community<br/>• Friend who gets it<br/>• Professional if serious]
    
    List --> How2[How to ask:<br/>'I'm stuck on X<br/>I've tried Y and Z<br/>Still not working<br/>Can you help?']
    
    How2 --> After[After getting help:<br/>Say thank you<br/>Document solution<br/>Offer help back later]
    
    style Stuck fill:#fff3cd
    style Reach fill:#d4f1d4
    style After fill:#e1f5ff
```

**Important mindset shifts:**
- Asking for help = strength, not weakness
- 2 hours stuck = too long alone
- Documenting = helping future you
- Reciprocal support = healthy

**ADHD-specific note:** "I should figure this out" can trap you for hours. Set a timer when starting.

## Pattern: Support Network Map

Use when user needs to identify their support system.

```mermaid
flowchart TD
    You[You] --> Types{Types of support<br/>you need}
    
    Types --> Task[Task/Work Support]
    Types --> Emotional[Emotional Support]
    Types --> Social[Social Connection]
    Types --> Practical[Practical Help]
    
    Task --> T1[Who can help with:<br/>• Coworking/body doubling<br/>• Technical questions<br/>• Accountability<br/>• Feedback on work]
    
    Emotional --> E1[Who can help with:<br/>• Listening when overwhelmed<br/>• Validation<br/>• Encouragement<br/>• Non-judgmental presence]
    
    Social --> S1[Who can help with:<br/>• Hanging out<br/>• Shared activities<br/>• Fun without pressure<br/>• Belonging]
    
    Practical --> P1[Who can help with:<br/>• Emergency childcare<br/>• Ride if car breaks down<br/>• Advice on life stuff<br/>• Practical problem-solving]
    
    T1 --> Map1[Map your people:<br/>Name each person<br/>What they're good for<br/>How to reach them]
    E1 --> Map1
    S1 --> Map1
    P1 --> Map1
    
    Map1 --> Gaps{Notice any gaps?}
    
    Gaps -->|Big gap| Build[How to build this:<br/>Join communities<br/>Take a class<br/>Reach out to acquaintances<br/>Try new spaces]
    Gaps -->|Pretty covered| Great[You have a network!<br/>Reach out regularly<br/>Don't wait for crisis]
    
    style You fill:#e1f5ff
    style Map1 fill:#fff3cd
    style Great fill:#d4f1d4
```

**Key insight:** No one person = all support types. That's too much pressure. Different people for different needs.

**How to build support:**
- Start with ONE type of support
- Online communities count as real support
- Reciprocal support = sustainable
- Regular check-ins > crisis-only

## Pattern: Async Accountability System

Use when user can't find real-time accountability but still needs external structure.

```mermaid
flowchart LR
    subgraph Setup[" Setup (One Time)"]
        S1[Choose platform:<br/>Discord<br/>Slack<br/>Notion<br/>Bullet journal<br/>Voice memos]
        S2[Create daily template:<br/>Today's goal:<br/>Progress updates:<br/>Blockers:<br/>Done for the day:]
    end
    
    subgraph Morning[" Each Morning"]
        M1[Fill in goal<br/>2 min]
        M2[Post/write it<br/>1 min]
    end
    
    subgraph Throughout[" Throughout Day"]
        W1[Update as you work<br/>Optional, not required]
        W2[If stuck:<br/>Post blocker<br/>Ask for async help]
    end
    
    subgraph Evening[" Each Evening"]
        E1[Mark what got done<br/>2 min]
        E2[Note what didn't<br/>No judgment<br/>Just data<br/>1 min]
        E3[Read own posts<br/>from past week<br/>Notice patterns<br/>3 min]
    end
    
    Setup --> Morning --> Throughout --> Evening
    
    Note[The act of writing<br/>creates accountability<br/>even if no one reads it] -.-> Morning
    
    style Setup fill:#e1f5ff
    style Morning fill:#fff3cd
    style Evening fill:#fef3c7
```

**Why async works:**
- No scheduling required
- Works across time zones
- Reduces social pressure
- Creates documentation
- Private or public (your choice)

**Bonus:** Reading your own history = see progress you'd otherwise forget.

## Pattern: Crisis Support Protocol

Use when user needs to define support plan for bad days/burnout.

```mermaid
flowchart TD
    Normal[Normal functioning] --> Watch{Early warning signs}
    
    Watch -->|Seeing signs| Yellow[Yellow Alert:<br/>Missing habits<br/>Increased irritability<br/>Avoiding people<br/>Sleep disrupted]
    
    Yellow --> Act1[Actions:<br/>• Tell one person<br/>• Clear tomorrow's calendar<br/>• Lower expectations<br/>• Do minimum viable routine<br/>• Rest]
    
    Act1 --> Check1{Getting worse?}
    
    Check1 -->|No, stabilizing| Back1[Continue yellow actions<br/>Monitor daily]
    Check1 -->|Yes| Orange[Orange Alert:<br/>Can't work effectively<br/>Feeling overwhelmed<br/>Struggling with basics<br/>Isolation increasing]
    
    Orange --> Act2[Actions:<br/>• Reach out to 2-3 people<br/>• Take sick day if needed<br/>• Cancel non-essentials<br/>• Ask for practical help<br/>• See therapist if you have one]
    
    Act2 --> Check2{Crisis level?}
    
    Check2 -->|No| Back2[Continue orange actions<br/>Check in daily with someone]
    Check2 -->|Yes| Red[Red Alert:<br/>Thoughts of harm<br/>Can't function<br/>Need immediate help]
    
    Red --> Emergency[CALL SOMEONE NOW:<br/>• Therapist<br/>• Crisis hotline: 988<br/>• Trusted person<br/>• Emergency services<br/><br/>This is what they're for]
    
    Back1 --> Monitor[Keep monitoring<br/>Slowly resume normal]
    Back2 --> Monitor
    
    style Yellow fill:#fef3c7
    style Orange fill:#fed7aa
    style Red fill:#fecaca
    style Emergency fill:#f87171
```

**Set up BEFORE crisis:**
- List your warning signs
- List your support people + contact info
- List what helps when struggling
- Review every 6 months

**Share this plan with:** One trusted person who can check on you.

## Language Guidelines

**Use connection-affirming, shame-reducing language:**

✅ DO:
- "Asking for help is a skill"
- "You don't have to do everything alone"
- "Support is for everyone, not just crisis"
- "Different people for different needs"
- "Reciprocal support is healthy"
- "Connection is as important as productivity"

❌ DON'T:
- "You should be able to handle this"
- "Don't be a burden"
- "You're asking for help too much"
- "Figure it out yourself"
- "Stop being needy"

## Building Support Capacity

**For ADHD specifically:**
- Isolation worsens symptoms
- External regulation helps executive function
- Body doubling = borrowed motivation
- Regular check-ins = external memory
- Shame prevents asking for help

**Start small:**
- One accountability partner
- One body doubling session
- One support person identified
- One async check-in system
- Build from there
