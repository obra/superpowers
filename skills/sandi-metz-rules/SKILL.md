---
name: sandi-metz-rules
description: This skill should be used when users request code review, refactoring, or code quality improvements for Ruby codebases. Apply Sandi Metz's four rules for writing maintainable object-oriented code - classes under 100 lines, methods under 5 lines, no more than 4 parameters, and controllers instantiate only one object. Use when users mention "Sandi Metz", "code quality", "refactoring", or when reviewing Ruby code for maintainability.
---

# Sandi Metz Rules

## Overview

This skill helps apply Sandi Metz's four rules for writing maintainable object-oriented code to Ruby codebases. These rules are heuristics that encourage good design practices, making code easier to understand, test, and maintain.

## The Four Rules

1. **Classes can be no longer than 100 lines of code**
2. **Methods can be no longer than 5 lines of code**
3. **Pass no more than 4 parameters into a method**
4. **Controllers can instantiate only one object**

## When to Use This Skill

Apply this skill when:
- Users explicitly request applying Sandi Metz's rules
- Reviewing Ruby code for maintainability and code quality
- Refactoring existing Ruby code to improve design
- Users ask about "code smells" or improving object-oriented design
- Analyzing Ruby code for complexity or maintainability issues
- Users mention terms like "POODR" or reference Sandi Metz's work

## Code Review Workflow

### 1. Analyze the Code

When reviewing code against Sandi Metz's rules:

**Read the reference document:**
First, load the detailed rules documentation:
```
Read references/rules.md
```

**Measure accurately:**
- For classes: Count lines of actual code (exclude blank lines, comments, class definition, and `end` statements)
- For methods: Count lines of actual code (exclude blank lines, comments, method definition, and `end` statements)
- For parameters: Count all explicit parameters including keyword arguments (but not `&block`)
- For controllers: Count object instantiations in each action (excluding finding existing objects)

**Identify violations:**
Scan the codebase for violations of each rule. Use grep or file searching to find classes and methods, then analyze them systematically.

### 2. Prioritize Issues

Not all violations are equal:

**High priority:**
- Classes over 200 lines (severe violations)
- Methods over 10 lines (severe violations)
- Methods with 6+ parameters
- Controllers with complex business logic

**Medium priority:**
- Classes between 100-200 lines
- Methods between 5-10 lines
- Methods with 5 parameters

**Low priority:**
- Borderline cases (e.g., 6-line methods)
- Violations in test files, configuration, or DSLs

### 3. Suggest Specific Refactorings

For each violation, provide concrete refactoring strategies:

**Long classes:**
- Extract related methods into new classes
- Identify separate responsibilities using Single Responsibility Principle
- Use composition or modules to share behavior
- Apply patterns: Strategy, Decorator, Command, Facade

**Long methods:**
- Extract sub-methods with descriptive names
- Replace conditionals with polymorphism
- Use guard clauses to reduce nesting
- Apply Composed Method pattern (keep methods at one level of abstraction)
- Extract complex expressions into well-named methods

**Too many parameters:**
- Introduce Parameter Object for related parameters
- Use Builder pattern for complex construction
- Replace parameters with method calls (use instance variables)
- Consider if the method belongs in a different class

**Fat controllers:**
- Extract service objects or use cases
- Apply Command or Interactor patterns
- Create Facade objects for complex orchestration
- Move business logic to domain layer

### 4. Provide Code Examples

When suggesting refactorings:
- Show before and after code examples
- Explain why the refactored version is better
- Name any patterns used
- Highlight how the change improves testability and clarity

### 5. Consider Context

Remember that rules can be broken with good reason:
- Configuration files (e.g., routes.rb)
- Test files (though they should still be readable)
- DSL definitions
- Generated code or database migrations
- When following the rule would make code less clear

Always note when a violation might be acceptable and explain why.

## Usage Patterns

### Pattern 1: Full Codebase Review

When reviewing an entire codebase:

1. Search for Ruby files using glob patterns
2. Identify the largest classes and methods first
3. Check controllers for business logic
4. Prioritize violations by severity
5. Provide a summary of findings with specific file locations and line numbers
6. Suggest refactorings for the most critical issues

### Pattern 2: Specific File or Class Review

When reviewing a specific file:

1. Load the file
2. Measure each class and method
3. Identify all rule violations
4. Provide specific refactoring suggestions with code examples
5. Explain the benefits of each suggested change

### Pattern 3: Refactoring Assistance

When actively refactoring code:

1. Load references/rules.md for detailed guidance
2. Apply the specific refactoring patterns from the reference
3. Ensure refactored code follows all four rules
4. Verify that tests still pass
5. Explain the design improvements made

## Code Counting Rules

Use these precise counting rules to ensure consistency:

**Class lines:**
```ruby
class MyClass  # Don't count
  def method   # Count: 1
    body       # Count: 2
  end          # Don't count
end            # Don't count
```

**Method lines:**
```ruby
def my_method        # Don't count
  line_1             # Count: 1
  line_2             # Count: 2
                     # Don't count (blank line)
  # comment          # Don't count
  line_3             # Count: 3
end                  # Don't count
```

**Parameters:**
```ruby
def method(a, b, c, d)              # 4 parameters - OK
def method(a, b, c, d, e)           # 5 parameters - Violation
def method(a:, b:, c:, d:)          # 4 parameters - OK
def method(a, b = nil, c = {})      # 3 parameters - OK (defaults still count)
def method(a, *rest)                # 2 parameters - OK
def method(a, &block)               # 1 parameter (blocks don't count)
```

## Automation

Suggest using static analysis tools to enforce these rules:
- **RuboCop:** Configure `Metrics/MethodLength`, `Metrics/ClassLength`, `Metrics/ParameterLists`
- **Reek:** Detects code smells including LongMethod, LargeClass, LongParameterList
- **flog:** Measures method complexity
- **flay:** Detects code duplication

Example RuboCop configuration:
```yaml
Metrics/ClassLength:
  Max: 100

Metrics/MethodLength:
  Max: 5

Metrics/ParameterLists:
  Max: 4
  MaxOptionalParameters: 3
```

## Resources

This skill includes a comprehensive reference document with:
- Detailed explanation of each rule
- Rationale and benefits
- Common violations and their causes
- Specific refactoring strategies with examples
- Guidance on when to break the rules
- Related design principles and patterns

Load this reference when doing detailed code analysis or explaining refactoring approaches:
```
Read references/rules.md
```
