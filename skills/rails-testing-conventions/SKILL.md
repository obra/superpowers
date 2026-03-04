---
name: rails-testing-conventions
description: Use when creating or modifying RSpec tests — request, system, model, policy, or component specs
---

# Rails Testing Conventions

Tests verify behavior, not implementation. Real data, real objects, pristine output.

## Core Principles

1. **Never test mocked behavior** - If you mock it, you're not testing it
2. **No mocks in integration tests** - Request/system specs use real data. WebMock for external APIs only
3. **Pristine test output** - Capture and verify expected errors, don't let them pollute output
4. **All failures are your responsibility** - Even pre-existing. Never ignore failing tests
5. **Coverage cannot decrease** - Never delete a failing test, fix the root cause
6. **System specs test through the UI** - Every user action must use Capybara interactions, never direct model/controller calls

## Spec Types

| Type | Location | Use For |
|------|----------|---------|
| Request | `spec/requests/` | Single action (CRUD, redirects). Never test auth here |
| System | `spec/system/` | Multi-step user flows through the UI. Every action via Capybara (clicks, fills, navigates) |
| Model | `spec/models/` | Public interface + Shoulda matchers |
| Policy | `spec/policies/` | ALL authorization tests belong here |
| Component | `spec/components/` | ViewComponent rendering |

## Factory Rules

- **Explicit attributes** - `create(:company_user, role: :mentor)` not `create(:user)`
- **Use traits** - `:published`, `:draft` for variations
- **`let` by default** - `let!` only when record must exist before test
- **Create in final state** - No `update!` in before blocks

## Quick Reference

| Do | Don't |
|----|-------|
| Test real behavior | Test mocked behavior |
| WebMock for external APIs | Mock internal classes |
| Explicit factory attributes | Rely on factory defaults |
| `let` by default | `let!` everywhere |
| Capture expected errors | Let errors pollute output |
| Wait for elements | Use `sleep` |
| Assert content in index tests | Only check HTTP status |
| Click/fill/navigate in system specs | Replace user actions with model calls |
| `accept_confirm { click_button }` | Skip confirmation dialogs |

## Common Mistakes

1. **Testing mocks** - You're testing nothing
2. **Mocking policies** - Use real authorized users
3. **Auth tests in request specs** - Move to policy specs
4. **`sleep` in system specs** - Use Capybara's waiting
5. **Deleting failing tests** - Fix the root cause
6. **Bypassing UI in system specs** - `record.do_thing!` + `visit result_path` is not a system spec. Click the button

## System Specs (Non-Negotiable)

System specs test the **full user journey through the browser**. If a user would click it, the spec clicks it.

**NEVER replace UI interactions with direct model calls.** Setting up state via code (e.g., `record.reserve!(user)`) then visiting the result page is a request spec pretending to be a system spec. It skips the UI being tested.

| User does this | Spec does this | NEVER this |
|----------------|----------------|------------|
| Clicks "Assign to me" | `click_button('Assign to me')` | `record.reserve!(user)` |
| Navigates via menu | `click_link('Reviews')` | `visit reviews_path` directly |
| Confirms a dialog | `accept_confirm { click_button(...) }` | Skip the dialog |
| Fills a form | `fill_in 'Name', with: 'value'` | `Record.create!(name: 'value')` |

**Factory setup** (creating the preconditions: users, records, associations) is fine. An **initial `visit`** to start the flow is fine. **Replacing user actions** (navigation, clicks, form fills that the test actually verifies) is not.

If a UI interaction is hard to automate (confirmation dialogs, JS-heavy flows), use Capybara's tools (`accept_confirm`, `accept_alert`, `execute_script`) — don't bypass the UI.

**Remember:** Tests verify behavior, not implementation.
