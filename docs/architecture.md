# Superpowers Architecture Visualization

## Complete System Flow

```mermaid

graph TB
    User([User]) --> CC[Claude Code CLI]

    %% Plugin Loading
    CC -->|loads at startup| Plugin[.claude-plugin/plugin.json]
    CC -->|SessionStart event| Hook[hooks/session-start.sh]
    Hook -->|injects content| UsingSuperpowers[using-superpowers skill]
    User -->|/brainstorm| CmdBrainstorm["/brainstorm command"]
    User -->|/write-plan| CmdWritePlan["/write-plan command"]
    User -->|/execute-plan| CmdExecutePlan["/execute-plan command"]

    %% Skill Discovery
    CC -->|uses| SkillsCore["lib/skills-core.js<br/>• findSkillsInDir<br/>• resolveSkillPath<br/>• extractFrontmatter"]
    SkillsCore -->|discovers| SkillsLib[(skills/ directory)]

    %% Commands to Skills Mapping
    CmdBrainstorm -.->|invokes| Brainstorming
    CmdWritePlan -.->|invokes| WritingPlans
    CmdExecutePlan -.->|invokes| ExecutingPlans

    %% Skills organized by phase
    subgraph DesignPhase[Design & Planning Skills]
        Brainstorming[brainstorming<br/>design exploration]
        WritingPlans[writing-plans<br/>implementation plan]
    end

    subgraph SetupPhase[Setup Skills]
        GitWorktrees[using-git-worktrees<br/>isolated workspace]
    end

    subgraph ExecutionPhase[Execution Skills]
        ExecutingPlans[executing-plans<br/>batch with checkpoints]
        SubagentDev[subagent-driven-development<br/>parallel task execution]
        TDD[test-driven-development<br/>RED-GREEN-REFACTOR]
    end

    subgraph QualityPhase[Quality Skills]
        SystematicDebug[systematic-debugging<br/>4-phase process]
        RequestingReview[requesting-code-review<br/>pre-review checklist]
        ReceivingReview[receiving-code-review<br/>feedback verification]
        Verification[verification-before-completion<br/>ensure it works]
    end

    subgraph CompletionPhase[Completion Skills]
        Documenting[documenting-completed-implementation<br/>update docs/plan/commit]
        FinishingBranch[finishing-a-development-branch<br/>invokes documenting + git workflow]
    end

    subgraph MetaSkills[Meta Skills]
        WritingSkills[writing-skills<br/>TDD for documentation]
    end

    %% Main Workflow Chain
    Brainstorming ==>|1. after design approval| GitWorktrees
    GitWorktrees ==>|2. in clean workspace| WritingPlans
    WritingPlans ==>|3a. current session| SubagentDev
    WritingPlans ==>|3b. or batch mode| ExecutingPlans
    SubagentDev ==>|enforces during impl| TDD
    ExecutingPlans ==>|enforces during impl| TDD
    TDD ==>|before commit| RequestingReview
    RequestingReview ==>|all tasks done| FinishingBranch
    FinishingBranch -->|invokes if plan exists| Documenting

    %% Agent System
    SubagentDev -->|spawns for review| CodeReviewer[agents/code-reviewer.md<br/>2-stage review:<br/>1. spec compliance<br/>2. code quality]

    %% Supporting Files
    SystematicDebug -.->|references| SupportingFiles["Supporting Files:<br/>• condition-based-waiting.md<br/>• root-cause-tracing.md<br/>• defense-in-depth.md<br/>• example scripts"]

    %% Debugging Flow
    SystematicDebug -->|after fix| Verification

    %% Testing System
    WritingSkills -.->|uses for TDD| TestRunner[tests/run-skill-tests.sh]
    TestRunner -->|invokes headless| CC
    TestRunner -->|runs| FastTests["Fast Tests<br/>skill verification<br/>~2 minutes"]
    TestRunner -->|--integration flag| IntegrationTests[Integration Tests<br/>full workflow<br/>10-30 minutes]

    %% Styling
    classDef userClass fill:#87CEEB,stroke:#333,stroke-width:2px
    classDef pluginClass fill:#FFE4B5,stroke:#333,stroke-width:2px
    classDef skillClass fill:#E6E6FA,stroke:#333,stroke-width:2px
    classDef agentClass fill:#FFB6C1,stroke:#333,stroke-width:2px
    classDef testClass fill:#B0C4DE,stroke:#333,stroke-width:2px
    classDef workflowClass fill:#98FB98,stroke:#333,stroke-width:3px

    class User,CC userClass
    class Plugin,Hook,UsingSuperpowers pluginClass
    class Brainstorming,WritingPlans,GitWorktrees,ExecutingPlans,SubagentDev,TDD,SystematicDebug,RequestingReview,ReceivingReview,Verification,Documenting,FinishingBranch,WritingSkills skillClass
    class CodeReviewer agentClass
    class TestRunner,FastTests,IntegrationTests testClass
```

## Workflow Sequence (Typical Development Session)

```mermaid
sequenceDiagram
    participant U as User
    participant CC as Claude Code
    participant H as Session Hook
    participant S as Skills System
    participant A as Subagent

    U->>CC: Start Claude Code
    CC->>H: Trigger SessionStart
    H->>CC: Inject using-superpowers skill
    Note over CC: Now aware of skills framework

    U->>CC: "Let's build feature X"
    CC->>S: Load brainstorming skill
    S-->>CC: Skill content
    CC->>U: Ask clarifying questions
    U->>CC: Answer questions
    CC->>U: Present design in sections
    U->>CC: Approve design

    CC->>S: Load using-git-worktrees skill
    S-->>CC: Skill content
    CC->>CC: Create isolated workspace

    CC->>S: Load writing-plans skill
    S-->>CC: Skill content
    CC->>U: Present implementation plan
    U->>CC: Approve plan

    CC->>S: Load subagent-driven-development skill
    S-->>CC: Skill content

    loop For each task
        CC->>A: Spawn subagent with task
        A->>A: Load test-driven-development skill
        A->>A: Write test (RED)
        A->>A: Write code (GREEN)
        A->>A: Self-review
        A-->>CC: Report completion

        CC->>A: Spawn code-reviewer (spec compliance)
        A->>A: Read spec + code independently
        A-->>CC: Spec compliance review

        CC->>A: Spawn code-reviewer (code quality)
        A->>A: Review code quality
        A-->>CC: Quality review

        alt Issues found
            CC->>A: Spawn subagent to fix issues
            A-->>CC: Fixed
        end
    end

    CC->>S: Load finishing-a-development-branch skill
    S-->>CC: Skill content
    CC->>U: Present completion options<br/>(merge/PR/keep/discard)
    U->>CC: Choose option
    CC->>CC: Execute completion
```

## File Organization Structure

```mermaid
graph TB
    subgraph Repository["superpowers/"]
        subgraph Plugin[".claude-plugin/"]
            P1[plugin.json]
            P2[marketplace.json]
        end

        subgraph Hooks["hooks/"]
            H1[hooks.json]
            H2[session-start.sh]
            H3[run-hook.cmd]
        end

        subgraph Lib["lib/"]
            L1[skills-core.js]
        end

        subgraph Commands["commands/"]
            C1[brainstorm.md]
            C2[write-plan.md]
            C3[execute-plan.md]
        end

        subgraph Skills["skills/"]
            S1[using-superpowers/SKILL.md]
            S2[brainstorming/SKILL.md]
            S3[writing-plans/SKILL.md]
            S4[test-driven-development/SKILL.md]
            S5[systematic-debugging/<br/>SKILL.md + supporting files]
            S6[subagent-driven-development/SKILL.md]
            S7[... more skills]
        end

        subgraph Agents["agents/"]
            A1[code-reviewer.md]
        end

        subgraph Tests["tests/claude-code/"]
            T1[run-skill-tests.sh]
            T2[test-helpers.sh]
            T3[test-*.sh files]
        end
    end

    Plugin -.->|loaded by| CC[Claude Code]
    Hooks -.->|triggered by| CC
    Lib -.->|used by| CC
    Commands -.->|invoke| Skills
    Skills -.->|spawn| Agents
    Tests -.->|verify| Skills
```

## Skill Discovery & Loading (CSO)

```mermaid
graph LR
    User[User: I need to fix a bug] --> Claude[Claude Code]

    Claude --> Search{Search Skills<br/>via CSO}

    Search --> Desc[Check Descriptions<br/>for triggers]
    Search --> Keywords[Scan for Keywords<br/>error messages, symptoms]
    Search --> Names[Match Skill Names<br/>verb-first patterns]

    Desc --> Match{Match Found?}
    Keywords --> Match
    Names --> Match

    Match -->|Yes| Load[Load Skill via<br/>skills-core.js]
    Match -->|No| Continue[Continue without skill]

    Load --> Parse[Parse YAML Frontmatter]
    Parse --> Strip[Strip Frontmatter]
    Strip --> Inject[Inject Content to Claude]

    Inject --> Follow[Follow Skill Instructions]

    subgraph Namespace[Namespace Resolution]
        Load --> CheckPersonal{"Personal Skill<br/>~/.claude/skills?"}
        CheckPersonal -->|Yes| UsePersonal[Use Personal]
        CheckPersonal -->|No| CheckSuperpowers{Superpowers Skill?}
        CheckSuperpowers -->|Yes| UseSuperpowers[Use Superpowers]
        CheckSuperpowers -->|No| NotFound[Not Found]
    end
```

## Testing Workflow (TDD for Skills)

```mermaid
graph TB
    Start([Creating/Editing Skill]) --> RED

    subgraph RED[RED Phase: Write Failing Test]
        R1[Create pressure scenarios]
        R2[Run WITHOUT skill]
        R3[Document baseline behavior<br/>capture rationalizations]
        R1 --> R2 --> R3
    end

    RED --> GREEN

    subgraph GREEN[GREEN Phase: Write Minimal Skill]
        G1[Write SKILL.md with<br/>YAML frontmatter]
        G2[Address specific failures<br/>from baseline]
        G3[Run scenarios WITH skill]
        G4{Agent complies?}
        G1 --> G2 --> G3 --> G4
    end

    G4 -->|No| G2
    G4 -->|Yes| REFACTOR

    subgraph REFACTOR[REFACTOR Phase: Close Loopholes]
        RF1[Identify new rationalizations]
        RF2[Add explicit counters]
        RF3[Build rationalization table]
        RF4[Create red flags list]
        RF5[Re-test]
        RF6{Bulletproof?}
        RF1 --> RF2 --> RF3 --> RF4 --> RF5 --> RF6
    end

    RF6 -->|No| RF1
    RF6 -->|Yes| Deploy[Deploy Skill]

    Deploy --> Commit[Commit to git]
    Commit --> End([Skill Ready])
```

## Legend

- **Solid thick arrows (==>)**: Main workflow sequence
- **Solid arrows (-->)**: Direct usage/invocation
- **Dashed arrows (-.->)**: References/points to
- **User layer**: Light blue
- **Plugin/Hook system**: Light orange
- **Skills**: Lavender
- **Agents**: Pink
- **Testing**: Steel blue
