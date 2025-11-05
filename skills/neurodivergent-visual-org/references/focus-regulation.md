---
created: 2025-11-02T22:59
updated: 2025-11-02T23:06
---
# Focus & Regulation Tools

## Overview

Focus and regulation patterns help manage ADHD symptoms in the moment through pre-task preparation, mid-work regulation, and recovery protocols. These are "in the moment" tools for when the brain needs support.

## When to Use

- User mentions racing thoughts or can't settle to work
- User asks how to calm down before focusing
- User is in hyperfocus crash and needs recovery
- User mentions overstimulation or sensory overwhelm
- User asks "how do I focus better?"
- User needs help with emotional regulation
- User mentions anxiety preventing work

## Pattern: Pre-Task Calm-Down Protocol

Use when user needs to regulate before starting focused work.

```mermaid
flowchart TD
    Start[Need to focus but<br/>brain is racing] --> Check{Current state check}
    
    Check --> Anxious[Anxious/<br/>Overwhelmed/<br/>Wound up]
    Check --> Scattered[Scattered/<br/>Can't settle/<br/>Restless]
    Check --> Low[Low energy/<br/>Foggy/<br/>Unmotivated]
    
    Anxious --> A1[Regulation menu:<br/>Pick 1-2 things]
    Scattered --> S1[Grounding menu:<br/>Pick 1-2 things]
    Low --> L1[Activation menu:<br/>Pick 1-2 things]
    
    A1 --> A2[• Box breathing 2 min<br/>• Progressive muscle relaxation<br/>• Splashing cold water<br/>• 5-4-3-2-1 grounding<br/>• Write worry list]
    
    S1 --> S2[• Brain dump for 3 min<br/>• Physical movement<br/>• Touch different textures<br/>• Name 10 things you see<br/>• Heavy work proprioception]
    
    L1 --> L2[• Cold shower/splash<br/>• Upbeat music 1 song<br/>• Quick movement<br/>• Caffeine if you use it<br/>• Change location]
    
    A2 --> After[After regulation:<br/>Try to start work]
    S2 --> After
    L2 --> After
    
    After --> Works{Can you focus now?}
    
    Works -->|Yes| Go[Great! Set timer<br/>Start working<br/>You prepared well]
    Works -->|Somewhat| Try[Try for 10 min<br/>Reassess after<br/>Progress > perfect]
    Works -->|No| Honor[Honor your limits today<br/>Maybe this is a rest day<br/>Or do low-energy tasks]
    
    style Start fill:#fff3cd
    style Check fill:#e1f5ff
    style Go fill:#d4f1d4
    style Honor fill:#fef3c7
```

**Key insight:** Not every state can be regulated into focus. Sometimes the answer is "not today."

**Create your own regulation menu:** Track what actually helps YOU, not what "should" work.

## Pattern: Mid-Work Regulation Check-In

Use when user is working but struggling to maintain focus.

```mermaid
flowchart TD
    Working[Working on task] --> Struggle[Noticing difficulty<br/>focusing]
    
    Struggle --> Pause[PAUSE for 2 min<br/>Don't push through]
    
    Pause --> What{What's happening?}
    
    What --> Physical[Physical discomfort:<br/>Hungry<br/>Thirsty<br/>Need bathroom<br/>Uncomfortable position]
    What --> Mental[Mental fatigue:<br/>Been working too long<br/>Task too hard<br/>Brain tired]
    What --> Emotional[Emotional dysregulation:<br/>Frustrated<br/>Anxious<br/>Bored<br/>Understimulated]
    What --> Environment[Environment issues:<br/>Too loud<br/>Too quiet<br/>Wrong temperature<br/>Bad lighting]
    
    Physical --> Fix1[Fix immediately:<br/>Drink water<br/>Eat snack<br/>Use bathroom<br/>Adjust position<br/>2-5 min]
    
    Mental --> Fix2[Take a real break:<br/>10-15 min<br/>Away from workspace<br/>Movement preferred<br/>Then reassess]
    
    Emotional --> Fix3[Regulate first:<br/>2 min breathing<br/>Name the feeling<br/>Quick movement<br/>Change sensory input]
    
    Environment --> Fix4[Adjust now:<br/>Headphones/earplugs<br/>Adjust temp<br/>Better lighting<br/>Move locations<br/>2 min]
    
    Fix1 --> Resume[Resume work]
    Fix2 --> Resume
    Fix3 --> Resume
    Fix4 --> Resume
    
    Resume --> Better{Improvement?}
    
    Better -->|Yes| Continue[Keep working<br/>Check in again<br/>in 20-30 min]
    Better -->|No| Stop[Stop for now<br/>This task isn't happening<br/>Switch to something else<br/>OR<br/>Call it a day]
    
    style Pause fill:#fff3cd
    style Resume fill:#e1f5ff
    style Continue fill:#d4f1d4
    style Stop fill:#fef3c7
```

**Don't push through:** Pushing = burnout. Pausing = sustainable.

**Track patterns:** Notice WHEN focus breaks. Morning? After lunch? After 45 min? Adjust accordingly.

## Pattern: Hyperfocus Crash Recovery

Use when user has crashed after hyperfocus session.

```mermaid
flowchart LR
    Crash[After hyperfocus:<br/>Exhausted<br/>Depleted<br/>Can't function] --> First[First 10 min:<br/>Just breathe<br/>You're not broken<br/>This is normal]
    
    First --> Needs[Check basic needs:<br/>IMMEDIATELY]
    
    Needs --> N1[• Drink water<br/>• Eat something<br/>• Use bathroom<br/>• Change position<br/>• Blink/rest eyes]
    
    N1 --> Rest[Rest period:<br/>30-60 min minimum]
    
    Rest --> R1[Recovery activities:<br/>• Lie down<br/>• Close eyes<br/>• Gentle stretching<br/>• Quiet space<br/>• No screens if possible]
    
    R1 --> After{After rest:}
    
    After --> Assess[Assess capacity:<br/>What can you do now?]
    
    Assess --> Options[Options:<br/>Low: Rest more, minimal tasks<br/>Medium: Light admin, easy wins<br/>High: Unusual, but okay to continue]
    
    Options --> Prevent[Prevention for next time:<br/>• Set hyperfocus alarm<br/>• Scheduled breaks<br/>• Someone to interrupt you<br/>• Post-it notes<br/>• Better than recovery]
    
    style Crash fill:#fecaca
    style First fill:#fff3cd
    style Rest fill:#fef3c7
    style Prevent fill:#e1f5ff
```

**Hyperfocus is NOT a superpower:** It's a regulation difficulty. The crash costs more than the productivity gained.

**Prevention > recovery:** Set alarms every 45-60 min when hyperfocusing. Interrupt yourself.

## Pattern: Sensory Regulation Toolkit

Use when user needs to adjust sensory input to support focus.

```mermaid
flowchart TD
    Need[Need sensory adjustment] --> What{What's the issue?}
    
    What --> Over[Overstimulated:<br/>Too much input<br/>Overwhelmed<br/>Irritated by sounds/lights]
    What --> Under[Understimulated:<br/>Bored<br/>Restless<br/>Can't focus<br/>Need more input]
    What --> Mix[Mixed:<br/>Some things too much<br/>Some not enough]
    
    Over --> Reduce[Reduce input:]
    Under --> Increase[Increase input:]
    Mix --> Balance[Balance carefully:]
    
    Reduce --> R1[• Noise-canceling headphones<br/>• Earplugs<br/>• Dim lights<br/>• Sunglasses indoors if needed<br/>• Remove visual clutter<br/>• Quiet space<br/>• Soft textures]
    
    Increase --> I1[• White noise or music<br/>• Fidget tools<br/>• Gum or crunchy snacks<br/>• Movement breaks<br/>• Textured objects<br/>• Standing desk<br/>• Weighted items]
    
    Balance --> B1[• Headphones + instrumental music<br/>• Bright workspace + dim surroundings<br/>• Fidget + quiet environment<br/>• Movement breaks + focused sessions]
    
    R1 --> Try[Try adjustments<br/>Notice what helps]
    I1 --> Try
    B1 --> Try
    
    Try --> Track[Track what works:<br/>Keep a list<br/>Your sensory profile<br/>is unique to YOU]
    
    Track --> Kit[Build your toolkit:<br/>Items you can access<br/>at home and work<br/>Portable options]
    
    style Over fill:#fecaca
    style Under fill:#fed7aa
    style Mix fill:#fef3c7
    style Kit fill:#d4f1d4
```

**Common ADHD sensory needs:**
- Background noise (can't focus in silence)
- Fidgeting (helps concentration, not distraction)
- Movement (standing/walking while thinking)
- Oral stimulation (gum, crunchy snacks)
- Proprioception (weighted blanket, tight clothing)

**Your needs ≠ stereotypes:** You know what helps. Trust yourself.

## Pattern: Emotional Regulation for Focus

Use when user's emotional state is blocking ability to focus.

```mermaid
flowchart TD
    Emotional[Strong emotion<br/>preventing focus] --> Name[Step 1:<br/>Name the emotion<br/>1 min]
    
    Name --> Examples[Anxious?<br/>Frustrated?<br/>Sad?<br/>Angry?<br/>Ashamed?<br/>Overwhelmed?<br/>Excited?]
    
    Examples --> Accept[Step 2:<br/>Accept it's there<br/>'I'm feeling X<br/>and that's okay'<br/>1 min]
    
    Accept --> Body[Step 3:<br/>Where in your body?<br/>Notice physical sensations<br/>1 min]
    
    Body --> Choose{Step 4:<br/>Choose response}
    
    Choose --> Express[Express it:<br/>• Write it out 3 min<br/>• Voice memo to self<br/>• Draw/scribble<br/>• Tell someone<br/>• Move it through body]
    
    Choose --> Regulate[Regulate it:<br/>• Box breathing 2 min<br/>• Cold water on face<br/>• Progressive relaxation<br/>• Bilateral stimulation<br/>• Self-havening]
    
    Choose --> Park[Park it for later:<br/>• Acknowledge: 'Not now'<br/>• Write 'Will address at 3pm'<br/>• Set reminder<br/>• Promise to come back<br/>• Then refocus]
    
    Express --> After[After 5-10 min:]
    Regulate --> After
    Park --> After
    
    After --> Can{Can you focus now?}
    
    Can -->|Yes| Work[Proceed with work<br/>Emotion doesn't have to<br/>be gone completely<br/>Just manageable]
    Can -->|No| Honor[The emotion needs<br/>attention now<br/>Not a work moment<br/>Take care of yourself]
    
    style Emotional fill:#fff3cd
    style Accept fill:#fef3c7
    style Work fill:#d4f1d4
    style Honor fill:#e1f5ff
```

**ADHD & emotions:** Emotional regulation difficulty is core ADHD symptom. Not a character flaw.

**Emotions aren't enemies:** They're information. Listen, then choose response.

## Pattern: Decision Fatigue Recovery

Use when user has made too many decisions and can't focus.

```mermaid
flowchart LR
    Tired[Decision fatigue:<br/>Can't make choices<br/>Everything feels hard<br/>Indecisive] --> Stop[STOP deciding<br/>for rest of day]
    
    Stop --> Auto[Switch to<br/>autopilot mode]
    
    Auto --> Choices[Pre-made choices:<br/>No new decisions]
    
    Choices --> C1[• Eat usual meal<br/>• Wear comfortable clothes<br/>• Do routine tasks only<br/>• Follow existing plan<br/>• Say no to options<br/>• Pick first available]
    
    C1 --> Rest[Decision rest period:<br/>2-24 hours<br/>depending on depletion]
    
    Rest --> Prevent[Prevention:<br/>Reduce daily decisions]
    
    Prevent --> P1[Strategies:<br/>• Meal rotation<br/>• Capsule wardrobe<br/>• Default routines<br/>• Pre-made plans<br/>• Batch decisions<br/>• Decision-free times]
    
    P1 --> Protect[Protect decision energy<br/>for what matters:<br/>Not breakfast choice]
    
    style Tired fill:#fecaca
    style Stop fill:#fff3cd
    style Protect fill:#d4f1d4
```

**ADHD note:** Executive function includes decision-making. When depleted, everything becomes harder.

**Decision budget:** You have limited daily decisions. Spend wisely.

## Pattern: Energy Recovery Protocol

Use when user needs to recover energy to refocus.

```mermaid
flowchart TD
    Depleted[Energy depleted:<br/>Can't focus<br/>Brain fog<br/>Everything is hard] --> How{How depleted?}
    
    How -->|Slightly| Quick[Quick recovery:<br/>10-15 min]
    How -->|Moderately| Medium[Medium recovery:<br/>30-60 min]
    How -->|Severely| Long[Long recovery:<br/>Rest of day]
    
    Quick --> Q1[• Close eyes 5 min<br/>• Drink water<br/>• Eat protein snack<br/>• Walk outside<br/>• Stretch<br/>• Change location]
    
    Medium --> M1[• 20-min nap<br/>• Proper meal<br/>• Shower<br/>• Exercise or yoga<br/>• Nature time<br/>• Social break]
    
    Long --> L1[• Actual sleep<br/>• Full meal rest<br/>• No screens<br/>• Gentle activities only<br/>• Early bedtime<br/>• Tomorrow is new day]
    
    Q1 --> Return1[Try to return<br/>to work<br/>Adjusted expectations]
    M1 --> Return2[Return if possible<br/>Lower intensity tasks<br/>OR call it a day]
    L1 --> Done[Accept: Done for today<br/>Rest is productive<br/>Recovery = investment]
    
    Return1 --> Sustain[To sustain energy:<br/>Regular breaks<br/>Don't deplete fully<br/>Prevention > recovery]
    Return2 --> Sustain
    Done --> Sustain
    
    style Depleted fill:#fecaca
    style Quick fill:#fff3cd
    style Medium fill:#fed7aa
    style Long fill:#fef3c7
    style Sustain fill:#d4f1d4
```

**Energy is NOT unlimited:** Working through depletion = bigger crash later.

**Rest is work:** Recovery time IS productive time.

## Language Guidelines

**Use body-affirming, permission-giving language:**

✅ DO:
- "Your brain needs what it needs"
- "Sensory needs are real and valid"
- "Emotions are information, not obstacles"
- "Rest is part of the work process"
- "You're not broken, you're dysregulated"
- "Regulation tools are for everyone"

❌ DON'T:
- "Just focus harder"
- "Push through it"
- "You're being too sensitive"
- "Stop making excuses"
- "Everyone deals with this"
- "You should be able to handle this"

## Regulation Principles for ADHD

**What's different:**
- Harder to self-regulate without external support
- More sensitive to sensory input
- Difficulty recognizing depletion until severe
- Longer recovery time after dysregulation
- Need for more frequent breaks
- Higher baseline stimulation needs

**Design accordingly:**
- External cues (timers, reminders)
- Sensory toolkit easily accessible
- Regular check-ins built into schedule
- Permission to stop before breaking
- Lower expectations during recovery
- Diverse regulation strategies (not just "breathe")

## Building Your Regulation Practice

**Start with:**
1. Notice when dysregulated (tracking)
2. Try one regulation tool at a time
3. Track what actually helps
4. Build accessible toolkit
5. Practice in calm, not just crisis
6. Share tools with support people
7. Adjust as needed

**Remember:** What works for one person may not work for you. Your regulation toolkit is personal.
