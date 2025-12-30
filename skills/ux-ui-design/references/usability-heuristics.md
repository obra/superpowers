<overview>
Nielsen's 10 usability heuristics are time-tested principles for evaluating interface usability. This reference provides deep guidance on each heuristic with examples.
</overview>

<heuristics>

<heuristic_1>
**1. Visibility of System Status**

The system should always keep users informed about what is going on, through appropriate feedback within reasonable time.

<good_examples>
- Loading spinners with progress indication
- "Saving..." → "Saved" confirmation
- Upload progress bar with percentage
- Form field validation as user types
- Navigation highlighting current location
- Connection status indicators
</good_examples>

<bad_examples>
- Button clicked with no feedback
- Long operation with no progress indicator
- Unclear if action succeeded or failed
- No indication of current step in wizard
- Silent background operations
</bad_examples>

<implementation>
- Acknowledge all user actions immediately
- Show progress for operations > 1 second
- Confirm completion of actions
- Display system state visibly
- Use loading skeletons for content
</implementation>
</heuristic_1>

<heuristic_2>
**2. Match Between System and Real World**

The system should speak the users' language, with words, phrases and concepts familiar to the user, rather than system-oriented terms.

<good_examples>
- "Shopping Cart" not "Item Queue"
- "Contacts" not "User Records"
- Calendar uses days/weeks like physical calendars
- Trash can icon for deletion
- Familiar metaphors (folders, documents)
</good_examples>

<bad_examples>
- "Error 500: Internal Server Error"
- "Null pointer exception"
- Technical IDs shown to users
- Jargon-heavy interface
- Developer terminology in user-facing copy
</bad_examples>

<implementation>
- Research user vocabulary
- Use plain language
- Follow real-world conventions
- Present information logically
- Use recognizable icons and metaphors
</implementation>
</heuristic_2>

<heuristic_3>
**3. User Control and Freedom**

Users often choose system functions by mistake and need a clearly marked "emergency exit" to leave the unwanted state without having to go through an extended dialogue.

<good_examples>
- Undo/Redo functionality
- Cancel button on all dialogs
- Easy navigation back
- Draft auto-save
- Confirmation before destructive actions
- "You can restore this from Trash for 30 days"
</good_examples>

<bad_examples>
- No way to cancel operation
- Can't undo actions
- Forced to complete wizard
- Immediate permanent deletion
- Deep navigation with no back button
</bad_examples>

<implementation>
- Provide undo for destructive actions
- Allow cancellation at any point
- Make navigation reversible
- Auto-save work
- Offer recovery options
</implementation>
</heuristic_3>

<heuristic_4>
**4. Consistency and Standards**

Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform conventions.

<good_examples>
- "Save" means save everywhere
- Same icon always means same action
- Consistent button placement
- Following OS conventions (Cmd+S, Ctrl+S)
- Same navigation in same location
</good_examples>

<bad_examples>
- "Submit" vs "Save" vs "Confirm" for same action
- Inconsistent icon meanings
- Navigation moves between pages
- Non-standard keyboard shortcuts
- Different button styles for same action type
</bad_examples>

<implementation>
- Use design system components
- Follow platform conventions
- Use consistent terminology
- Maintain visual consistency
- Test cross-platform behavior
</implementation>
</heuristic_4>

<heuristic_5>
**5. Error Prevention**

Even better than good error messages is a careful design which prevents a problem from occurring in the first place.

<good_examples>
- Form validation before submission
- Confirmation dialogs for destructive actions
- Disabling invalid options
- Suggestions/autocomplete
- Constraints on input (date picker vs text field)
- "Did you mean...?" corrections
</good_examples>

<bad_examples>
- Free text where structured input needed
- No confirmation before deletion
- Allowing invalid data entry
- Silent failures
- Easy to accidentally trigger destructive actions
</bad_examples>

<implementation>
- Validate input in real-time
- Use appropriate input types
- Confirm destructive actions
- Disable impossible actions
- Provide guardrails
</implementation>
</heuristic_5>

<heuristic_6>
**6. Recognition Rather Than Recall**

Minimize the user's memory load by making objects, actions, and options visible. The user should not have to remember information from one part of the dialogue to another.

<good_examples>
- Recently used items visible
- Visible menu labels (not just icons)
- Search suggestions
- Form fields with visible labels
- Context-sensitive help
- Dropdown shows all options
</good_examples>

<bad_examples>
- Icon-only interfaces with no tooltips
- Requiring users to remember codes
- Hidden actions
- Placeholder-only form labels
- Memorizing keyboard shortcuts to function
</bad_examples>

<implementation>
- Show recently used items
- Use descriptive labels
- Provide search with suggestions
- Keep relevant info visible
- Use recognition over recall
</implementation>
</heuristic_6>

<heuristic_7>
**7. Flexibility and Efficiency of Use**

Accelerators—unseen by the novice user—may often speed up the interaction for the expert user such that the system can cater to both inexperienced and experienced users.

<good_examples>
- Keyboard shortcuts for power users
- Command palettes (Cmd+K)
- Custom workflows/macros
- Personalization options
- Touch gestures as shortcuts
- Bulk actions
</good_examples>

<bad_examples>
- No keyboard shortcuts
- Can only do one item at a time
- No customization options
- Forced to use slow workflows
- Expert and novice paths identical
</bad_examples>

<implementation>
- Provide keyboard shortcuts
- Allow bulk operations
- Enable customization
- Support multiple input methods
- Progressive disclosure of advanced features
</implementation>
</heuristic_7>

<heuristic_8>
**8. Aesthetic and Minimalist Design**

Dialogues should not contain information which is irrelevant or rarely needed. Every extra unit of information competes with relevant information and diminishes visibility.

<good_examples>
- Clean, focused interfaces
- Clear visual hierarchy
- Whitespace creating breathing room
- Progressive disclosure
- Information prioritization
- Single primary action
</good_examples>

<bad_examples>
- Cluttered interfaces
- Every feature visible at once
- No visual hierarchy
- Competing calls to action
- Information overload
- Decoration over function
</bad_examples>

<implementation>
- Prioritize essential content
- Use visual hierarchy
- Apply progressive disclosure
- Remove unnecessary elements
- Focus on primary actions
</implementation>
</heuristic_8>

<heuristic_9>
**9. Help Users Recognize, Diagnose, and Recover from Errors**

Error messages should be expressed in plain language (no codes), precisely indicate the problem, and constructively suggest a solution.

<good_examples>
```
✅ "Email address format invalid. Example: name@company.com"
✅ "Password must be at least 8 characters"
✅ "Could not connect. Check your internet connection and try again."
✅ "Card declined. Please try a different payment method."
```
</good_examples>

<bad_examples>
```
❌ "Error 400"
❌ "Invalid input"
❌ "Request failed"
❌ "Something went wrong"
❌ "null pointer exception at line 42"
```
</bad_examples>

<implementation>
- Use plain language
- Be specific about the problem
- Suggest how to fix
- Don't blame the user
- Offer recovery path
</implementation>
</heuristic_9>

<heuristic_10>
**10. Help and Documentation**

Even though it is better if the system can be used without documentation, it may be necessary to provide help and documentation. Such information should be easy to search, focused on the user's task, list concrete steps, and not be too large.

<good_examples>
- Contextual help tooltips
- Searchable help center
- Onboarding for new features
- Inline documentation
- Task-focused tutorials
- Video walkthroughs for complex features
</good_examples>

<bad_examples>
- No help available
- Help hidden deep in menus
- Technical documentation for end users
- Outdated help content
- No search in help
</bad_examples>

<implementation>
- Provide contextual help
- Make help searchable
- Focus on user tasks
- Keep documentation current
- Offer multiple formats (text, video)
</implementation>
</heuristic_10>

</heuristics>

<conducting_heuristic_evaluation>

<process>
1. **Prepare** - Gather designs, define scope, identify evaluators
2. **Individual evaluation** - Each evaluator reviews independently
3. **Document findings** - Note issues with heuristic, severity, location
4. **Aggregate results** - Combine findings, remove duplicates
5. **Prioritize** - Rank by severity and frequency
6. **Report** - Present actionable recommendations
</process>

<severity_scale>
| Rating | Description |
|--------|-------------|
| 0 | Not a usability problem |
| 1 | Cosmetic - fix if time allows |
| 2 | Minor - low priority fix |
| 3 | Major - high priority fix |
| 4 | Catastrophic - must fix before release |
</severity_scale>

</conducting_heuristic_evaluation>
