# Defense-in-Depth Validation

## Overview

When you fix a bug caused by invalid data, adding validation at one place feels sufficient. But that single check can be bypassed by different code paths, refactoring, or mocks.

**Core principle:** Validate at EVERY layer data passes through. Make the bug structurally impossible.

## Why Multiple Layers

Single validation: "We fixed the bug"
Multiple layers: "We made the bug impossible"

Different layers catch different cases:
- Entry validation catches most bugs
- Business logic catches edge cases
- Environment guards prevent context-specific dangers
- Debug logging helps when other layers fail

## The Four Layers

### Layer 1: Entry Point Validation
**Purpose:** Reject obviously invalid input at API boundary

```ruby
def create_project(name, working_directory)
  raise ArgumentError, "working_directory cannot be empty" if working_directory.blank?
  raise ArgumentError, "working_directory does not exist: #{working_directory}" unless Dir.exist?(working_directory)
  raise ArgumentError, "working_directory is not a directory: #{working_directory}" unless File.directory?(working_directory)
  # ... proceed
end
```

### Layer 2: Business Logic Validation
**Purpose:** Ensure data makes sense for this operation

```ruby
def initialize_workspace(project_dir, session_id)
  raise ArgumentError, "project_dir required for workspace initialization" if project_dir.blank?
  # ... proceed
end
```

### Layer 3: Environment Guards
**Purpose:** Prevent dangerous operations in specific contexts

```ruby
def git_init(directory)
  # In tests, refuse git init outside temp directories
  if Rails.env.test?
    tmp = Rails.root.join("tmp").to_s
    unless File.expand_path(directory).start_with?(tmp)
      raise "Refusing git init outside tmp/ during tests: #{directory}"
    end
  end
  # ... proceed
end
```

### Layer 4: Debug Instrumentation
**Purpose:** Capture context for forensics

```ruby
def git_init(directory)
  Rails.logger.debug("About to git init", {
    directory: directory,
    cwd: Dir.pwd,
    caller: caller.first(5)
  })
  # ... proceed
end
```

## Applying the Pattern

When you find a bug:

1. **Trace the data flow** - Where does bad value originate? Where used?
2. **Map all checkpoints** - List every point data passes through
3. **Add validation at each layer** - Entry, business, environment, debug
4. **Test each layer** - Try to bypass layer 1, verify layer 2 catches it

## Example from Session

Bug: Empty `projectDir` caused `git init` in source code

**Data flow:**
1. Test setup → empty string
2. `Project.create(name, '')`
3. `WorkspaceManager.createWorkspace('')`
4. `git init` runs in `process.cwd()`

**Four layers added:**
- Layer 1: `Project.create()` validates not empty/exists/writable
- Layer 2: `WorkspaceManager` validates projectDir not empty
- Layer 3: `WorktreeManager` refuses git init outside tmpdir in tests
- Layer 4: Stack trace logging before git init

**Result:** All 1847 tests passed, bug impossible to reproduce

## Key Insight

All four layers were necessary. During testing, each layer caught bugs the others missed:
- Different code paths bypassed entry validation
- Mocks bypassed business logic checks
- Edge cases on different platforms needed environment guards
- Debug logging identified structural misuse

**Don't stop at one validation point.** Add checks at every layer.
