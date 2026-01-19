# Document-Driven AI Workflow Integration Guide

> **⚠️ DEPRECATED - This document is outdated**
>
> **The bridge integration approach described in this document has been replaced by the Unified Document System.**
>
> **Please use the new Unified Document System:**
> - See [Unified Document System Guide](./unified-document-system.md)
> - Reference [Document Migration Guide](./document-migration-guide.md)
> - Read design document: [docs/plans/2025-01-19-unified-document-system-design.md](./plans/2025-01-19-unified-document-system-design.md)
>
> **Advantages of the Unified Document System:**
> - ✅ No additional configuration or bridge needed, documentation is built directly into horspowers
> - ✅ Automatic status tracking, documents update automatically with workflow
> - ✅ Session recovery, automatically preserves context
> - ✅ Smart archiving, keeps directories clean
> - ✅ Seamless integration with all workflow skills
>
> **This document is kept for historical reference only. New projects should not use the bridge approach.**

---

This document demonstrates how to integrate `document-driven-ai-workflow` into superpowers skills, enabling automatic document generation at key workflow operations.

## 🎯 Integration Overview

```
superpowers skills (workflow orchestration)
         ↓
    Check configuration enabled
         ↓
    Invoke bridge skill
         ↓
document-driven CLI commands
         ↓
    Unified .docs/ directory
```

## 📋 Integration Points Design

### 1. brainstorming Skill Integration

**Integration Location:** After design is complete, before writing design document

**Add code** (in `brainstorming/SKILL.md` around line 37):

```markdown
## After the Design

**Documentation Integration:**

IF `.superpowers-config.yaml` exists AND `documentation.enabled: true`:
  **REQUIRED SUB-SKILL:** Use horspowers:document-driven-bridge
  Run `$DOCS_CLI search "related design decisions"` to check for existing decisions
  Run `$DOCS_CLI create decision "design topic"` to capture technical decisions
  Update context if new architectural patterns discovered

**Documentation (original):**
- Write the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
...
```

**Effects:**
- ✅ Automatically record technical decisions
- ✅ Search related decisions to avoid duplication
- ✅ Build project knowledge base

### 2. writing-plans Skill Integration

**Integration Location:** After plan creation is complete

**Add code** (in `writing-plans/SKILL.md` around line 100):

```markdown
## Execution Handoff

**Documentation Integration:**

IF `.superpowers-config.yaml` exists AND `documentation.enabled: true`:
  **REQUIRED SUB-SKILL:** Use horspowers:document-driven-bridge

  **Create task document:**
  ```bash
  $DOCS_CLI create task "Implement: [feature-name]"
  ```

  Store the returned document path as `$TASK_DOC` for progress tracking.

**Original execution handoff:**
After saving the plan, offer execution choice:
...
```

**Effects:**
- ✅ Automatically create task tracking document
- ✅ Update task status later
- ✅ Form complete task history

### 3. test-driven-development Skill Integration

**Integration Location:** When test fails and debugging is needed

**Add code** (in `test-driven-development/SKILL.md` RED phase):

```markdown
## RED: Write a Failing Test

**Documentation Integration:**

IF test fails unexpectedly (not first run):
  Use horspowers:document-driven-bridge
  Run `$DOCS_CLI create bug "Test failure: [test-name]"` to document investigation

**Original RED step:**
1. Write one test that fails
...
```

**Integration Location:** When bug fix is complete

```markdown
## GREEN: Make the Test Pass

**Documentation Integration:**

IF `$BUG_DOC` is set (from RED phase):
  Run `$DOCS_CLI update "$BUG_DOC" "status:fixed" "progress:[fix-description]"`

**Original GREEN step:**
1. Write the minimal code to make the test pass
...
```

**Effects:**
- ✅ Automatically document bug investigation process
- ✅ Build bug knowledge base
- ✅ Traceable fix history

### 4. finishing-a-development-branch Skill Integration

**Integration Location:** After tests pass, before presenting options

**Add code** (in `finishing-a-development-branch/SKILL.md` around line 39):

```markdown
**If tests pass:**

**Documentation Integration:**

IF `.superpowers-config.yaml` exists AND `documentation.enabled: true`:
  **REQUIRED SUB-SKILL:** Use horspowers:document-driven-bridge

  **Check project status:**
  ```bash
  $DOCS_CLI status
  ```

  **Archive completed documents:**
  ```bash
  # Archive completed tasks and bugs
  find .docs/active -name "*.md" -exec grep -l "status:completed" {} \; | \
    xargs -I {} mv {} .docs/archive/
  ```

  **Update task document:**
  IF `$TASK_DOC` is set:
    Run `$DOCS_CLI update "$TASK_DOC" "status:completed" "progress:Implementation complete, ready to merge"`

Continue to Step 2.
```

**Effects:**
- ✅ Check project status before completion
- ✅ Auto-archive completed documents
- ✅ Update final task status

## 🔧 Configuration File Example

### Complete `.superpowers-config.yaml`

```yaml
# Superpowers Project Configuration
version: "1.0"

# Development mode: personal | team
development_mode: team

# Completion strategy: merge | pr | keep
completion_strategy: pr

# Document-driven workflow integration
documentation:
  enabled: true

  # CLI tool path (adjust according to actual installation location)
  cli_path: "node /path/to/document-driven-ai-workflow/cli.js"
  # If globally installed: cli_path: "docs"

  # Workflow integration configuration
  workflows:
    brainstorming:
      # Search before starting
      pre_search:
        - "project architecture"
        - "related decisions"
      # Create after completion
      create:
        - type: decision
          when: "technical_decisions_made"
          template: "Technical decision record"

    writing-plans:
      # Search before starting
      pre_search:
        - "related features"
        - "similar tasks"
      # Create after completion
      create:
        - type: task
          always: true
          template: "Implementation task"

    test-driven-development:
      # When test fails
      create:
        - type: bug
          when: "test_fails_unexpectedly"
          template: "Bug analysis"
      # When fix is complete
      update:
        - type: bug
          when: "bug_fixed"
          status: "fixed"

    finishing-a-development-branch:
      # Operations before completion
      actions:
        - type: status
          always: true
        - type: archive
          when: "merging_to_main"
        - type: update
          target: "task"
          status: "completed"

  # Auto-archiving settings
  archive:
    enabled: true
    after_days: 30
    keep_active:
      - type: task
        status: ["in_progress", "blocked"]
      - type: bug
        status: ["pending", "investigating"]

  # Document categories
  categories:
    decision:
      directory: ".docs/active"
      archive_after: "merged"
    task:
      directory: ".docs/active"
      archive_after: "completed"
    bug:
      directory: ".docs/active"
      archive_after: "fixed"
    context:
      directory: ".docs/context"
      archive_after: "never"
```

## 🚀 Quick Start

### Step 1: Install document-driven-ai-workflow

```bash
# Clone repository
git clone https://github.com/LouisHors/document-driven-ai-workflow.git
cd document-driven-ai-workflow

# Verify CLI tool
node cli.js --help
```

### Step 2: Create Project Configuration

```bash
# In your project root directory
cat > .superpowers-config.yaml << 'EOF'
documentation:
  enabled: true
  cli_path: "node /path/to/document-driven-ai-workflow/cli.js"
EOF
```

### Step 3: Initialize Documentation Directory

```bash
# Run initialization
node /path/to/document-driven-ai-workflow/cli.js init

# Create initial context
node /path/to/document-driven-ai-workflow/cli.js create context "Project Overview"
```

### Step 4: Start Using

Now when you use superpowers skills, documents will be automatically created and updated:

```bash
# Example workflow
claude "Help me design a user management feature"
# → brainstorming skill runs
# → Automatically creates decision document

claude "Help me write implementation plan"
# → writing-plans skill runs
# → Automatically creates task document

claude "Start implementation"
# → subagent-driven-development skill runs
# → Automatically updates task progress

claude "Done"
# → finishing-a-development-branch skill runs
# → Automatically checks status and archives documents
```

## 📊 Integration Effect Comparison

### Traditional superpowers Workflow

```
brainstorming → Design document (one-time)
                ↓
writing-plans → Implementation plan (one-time)
                ↓
implementation → Code implementation
                ↓
finishing → Merge/PR
```

**Problems:**
- ❌ Documents scattered in `docs/plans/` directory
- ❌ Cannot track task status changes
- ❌ Cannot get context across sessions
- ❌ Missing decision and bug records

### After Document-Driven Workflow Integration

```
brainstorming → Search context → Create decision document
                ↓
writing-plans → Search related tasks → Create task document
                ↓
implementation → Update task progress → Create bug document (if any)
                ↓
finishing → Check status → Archive documents → Update final status
```

**Advantages:**
- ✅ Unified `.docs/` directory structure
- ✅ Complete task status history
- ✅ Cross-session context memory
- ✅ Comprehensive decision and bug knowledge base

## 🎯 Best Practices

### 1. Configuration Management

- **Personal projects**: Use `development_mode: personal`, simplify documentation workflow
- **Team projects**: Use `development_mode: team`, enable complete documentation tracking
- **Temporary experiments**: Set `documentation.enabled: false` to skip document generation

### 2. Document Maintenance

- **Regular archiving**: Auto-archive when using `finishing-a-development-branch`
- **Context first**: Create more `context` documents in early project stages
- **Decision recording**: Record all important technical choices as `decision` documents

### 3. Search Strategy

- **Search before starting**: Use `docs:search` to understand existing work
- **Avoid duplication**: Search before creating new documents
- **Association finding**: Search related documents by keywords

## 🔍 Troubleshooting

### CLI Command Not Found

**Symptom**: `command not found` error

**Solution**:
```yaml
# Use absolute path
documentation:
  cli_path: "/full/path/to/document-driven-ai-workflow/cli.js"
```

### Documents Not Created

**Symptom**: Integration points are skipped

**Check**:
1. Confirm `documentation.enabled: true`
2. Confirm `.superpowers-config.yaml` is in project root directory
3. Check if integration code is correctly added in skills

### Cannot Find Previously Created Documents

**Solution**:
```bash
# Run status check
node cli.js status

# Search documents
node cli.js search "keyword"
```

## 📚 Related Resources

- **[document-driven-bridge skill](../skills/document-driven-bridge/SKILL.md)** - Bridge skill documentation
- **[document-driven-ai-workflow](https://github.com/LouisHors/document-driven-ai-workflow)** - Original repository
- **[superpowers skills system](../README.md)** - Superpowers main documentation

## 🤝 Contributing

Contributions and issue feedback are welcome!

---

**Make AI your long-term project partner!** 🚀
