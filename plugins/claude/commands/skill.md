---
description: Skill Lifecycle with Learning
---

# /ace-skill - Skill Lifecycle with Learning

Create, find, test, and evolve ACE skills with accumulated knowledge context. Argument: `$ARGUMENTS`

## Determine Action

Parse `$ARGUMENTS`:
- `create <description>` → Create a new ACE skill
- `find [query]` → Discover available skills relevant to a task
- `improve <skill_name>` → Improve an existing skill using knowledge + eureka moments
- `test <skill_name>` → Test a skill with generated eval cases
- `list` → List all ACE skills with descriptions
- No arguments → Show available actions

## Action: create

### 1. Capture Intent

Interview the user to understand:
1. What should this skill enable? (what ACE operation does it automate?)
2. When should it trigger? (what user phrases/contexts?)
3. What knowledge should it consult? (traces, L2 knowledge, eureka moments?)
4. Does it compose with other skills? (e.g., runs after `/ace-node create`)

### 2. Search for Duplicates

Check existing ACE skills to prevent overlap:
```bash
ls -la .claude/commands/ace-*.md | while read line; do
  file=$(echo "$line" | awk '{print $NF}')
  name=$(head -1 "$file" | sed 's/# //')
  desc=$(head -3 "$file" | tail -1)
  echo "  $file: $name — $desc"
done
```

### 3. Gather Knowledge Context

Search accumulated knowledge for relevant domain patterns:
```bash
python -c "
import asyncio
from src.core.knowledge.manager import KnowledgeManager
from src.core.storage.file_storage import FileStorage
async def search():
    km = KnowledgeManager(FileStorage())
    results = await km.search_knowledge('<skill_domain>', limit=10)
    if results:
        print('Relevant knowledge:')
        for r in results:
            print(f'  {r.get(\"name\", \"\")}: {r.get(\"description\", \"\")[:80]}')
asyncio.run(search())
"
```

Also check eureka moments for breakthrough patterns relevant to the skill:
```bash
python -c "
from pathlib import Path
knowledge_dir = Path('.ace/insights')
if knowledge_dir.exists():
    for f in sorted(knowledge_dir.glob('*.md')):
        content = f.read_text()
        if 'EUREKA' in content:
            print(f'  {f.name}: {content.count(\"EUREKA\")} eureka moment(s)')
"
```

### 4. Write the Skill

Create `.claude/commands/ace-<name>.md` following the ACE skill pattern:

**Structure:**
```markdown
# /ace:<name> - <Title>

<One-line description>. Argument: `$ARGUMENTS`

## Determine Action
Parse `$ARGUMENTS` to determine the action...

## Action: <action_name>
### 1. <Step with knowledge context>
### 2. <Step with trace awareness>
### 3. <Step with composition>
```

**ACE skill conventions:**
- Always gather knowledge context before acting (check warnings, guidelines, eureka insights)
- Include trace emission — actions should produce traces for learning
- Follow Accumulate (trace) → Composable (typed I/O) → Evolve (knowledge-driven) pattern
- Reference Python APIs from `src/core/` where appropriate
- Keep skills domain-agnostic in the core (product-specific skills go elsewhere)

### 5. Invoke Skill Creator for Testing (Optional)

If the user wants rigorous evaluation, delegate to the skill-creator plugin:

Use `/anthropic-skills:skill-creator` for:
- Writing test cases (eval prompts)
- Running the skill against test prompts
- Benchmarking with variance analysis
- Optimizing the skill description for better triggering

### 6. Emit Creation Trace

Record that a new skill was created for the learning pipeline:
```bash
python -c "
from src.core.evolution.trace import TraceStore, create_trace
store = TraceStore()
store.append(create_trace(
    entity_type='skill_creation',
    entity_id='<skill_name>',
    inputs={'description': '<description>'},
    outputs={'path': '.claude/commands/ace-<name>.md'},
    status='success',
    duration=0.0,
))
print('Skill creation traced')
"
```

## Action: find

### 1. Search ACE Skills

List all ACE-specific skills:
```bash
echo "=== ACE Skills ==="
for f in .claude/commands/ace-*.md; do
  name=$(basename "$f" .md | sed 's/ace-//')
  title=$(head -1 "$f" | sed 's/# \/ace://' | sed 's/ -.*//')
  desc=$(grep -m1 "^[A-Z]" "$f" | head -1)
  echo "  /ace:$name — $title"
done
```

### 2. Search Superpowers Skills

Find relevant skills from the broader ecosystem:
```bash
echo "=== Superpowers Skills ==="
for d in ~/.claude/plugins/cache/*/superpowers/*/skills/*/; do
  if [ -f "$d/SKILL.md" ]; then
    name=$(basename "$d")
    desc=$(grep "^description:" "$d/SKILL.md" | head -1 | sed 's/description: //')
    echo "  /superpowers:$name — ${desc:0:80}"
  fi
done
```

### 3. Search Plugin Skills

Find skills from installed plugins:
```bash
echo "=== Plugin Skills ==="
for d in ~/.claude/plugins/marketplaces/*/plugins/*/skills/*/; do
  if [ -f "$d/SKILL.md" ]; then
    plugin=$(echo "$d" | grep -o 'plugins/[^/]*' | tail -1 | sed 's/plugins\///')
    name=$(basename "$d")
    desc=$(grep "^description:" "$d/SKILL.md" | head -1 | sed 's/description: //')
    echo "  /$plugin:$name — ${desc:0:80}"
  fi
done
```

### 4. Match to Query

If `$ARGUMENTS` includes a query after `find`, filter results:
- Match skill names and descriptions against the query
- Rank by relevance: ACE skills first, then superpowers, then plugins
- Show top 5 matches with how to invoke each

## Action: improve

### 1. Read Current Skill

Read the target skill file:
```bash
cat .claude/commands/ace-$SKILL_NAME.md
```

### 2. Gather Improvement Evidence

Check what knowledge and eureka moments relate to this skill's domain:

```bash
python -c "
from pathlib import Path
import json

# Check traces for skill-related activity
from src.core.evolution.trace import TraceStore
store = TraceStore()
traces = store.query(entity_type='skill_call', limit=50)
relevant = [t for t in traces if '<skill_name>' in t.entity_id]
if relevant:
    successes = sum(1 for t in relevant if t.status == 'success')
    failures = sum(1 for t in relevant if t.status == 'failed')
    print(f'Usage: {len(relevant)} calls ({successes} success, {failures} failed)')

# Check philosophy for guiding principles
phil_path = Path('.ace/philosophy.json')
if phil_path.exists():
    data = json.loads(phil_path.read_text())
    principles = data.get('principles', [])
    if principles:
        print('Engineering principles to consider:')
        for p in principles[:5]:
            print(f'  • {p[\"title\"]}')
"
```

### 3. Check Knowledge for Patterns

```bash
python -c "
import asyncio
from src.core.knowledge.manager import KnowledgeManager
from src.core.storage.file_storage import FileStorage
async def check():
    km = KnowledgeManager(FileStorage())
    # Search for failure patterns related to this skill
    results = await km.search_knowledge('<skill_name>', limit=10)
    for r in results:
        polarity = r.get('polarity', 'positive')
        marker = '✗' if polarity == 'negative' else '✓'
        print(f'  {marker} {r.get(\"name\", \"\")}: {r.get(\"description\", \"\")[:80]}')
asyncio.run(check())
"
```

### 4. Propose Improvements

Based on evidence gathered:
- **From failure traces** → Add error handling, precondition checks, or warnings
- **From eureka moments** → Add breakthrough patterns as recommended approaches
- **From negative knowledge** → Add explicit "don't do X" guidance
- **From philosophy principles** → Align skill with project wisdom
- **From usage patterns** → Simplify common paths, add shortcuts

### 5. Apply Improvements

Edit the skill file with evidence-backed changes. For each change, cite the source:
```
<!-- Improvement: Added based on eureka moment e-2026-03-19 (type mismatch resolution) -->
```

### 6. Optionally Run Skill Creator Eval Loop

If improvements are significant, use `/anthropic-skills:skill-creator` to:
- Run before/after comparison
- Benchmark improvement with variance analysis
- Validate skill description still triggers correctly

## Action: test

### 1. Generate Test Cases

Based on the skill's description and actions, generate 3-5 test prompts:
- Happy path (basic usage)
- Edge case (unusual input)
- Error case (invalid arguments)
- Composition case (used with other ACE skills)

### 2. Run Tests

For each test case, invoke the skill with the test prompt and evaluate:
- Did it execute the right action?
- Did it gather knowledge context?
- Did it produce traces?
- Did it follow ACE conventions?

### 3. Optionally Delegate to Skill Creator

For rigorous testing, use `/anthropic-skills:skill-creator` to run the full eval loop with:
- Quantitative benchmarks
- Assertion-based grading
- Variance analysis across multiple runs

## Action: list

```bash
echo "ACE Skills:"
echo ""
printf "%-20s %-60s\n" "Command" "Description"
printf "%-20s %-60s\n" "-------" "-----------"
for f in .claude/commands/ace-*.md; do
  name=$(basename "$f" .md)
  cmd="/ace:${name#ace-}"
  title=$(head -1 "$f" | sed 's/# \/ace:[^ ]* - //')
  printf "%-20s %-60s\n" "$cmd" "$title"
done
echo ""
echo "Use '/ace-skill find <query>' to search all available skills (ACE + superpowers + plugins)"
```
