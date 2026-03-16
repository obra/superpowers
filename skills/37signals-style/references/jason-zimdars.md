# Jason Zimdars' Design & Product Patterns

> 📝 **A note on attribution**: We created these personal pattern files to give credit to individual developers whose review style we found instructive. This content was compiled with AI assistance by analyzing PR comments, so take it with a grain of salt—some patterns may be misattributed or misinterpreted. When in doubt, check the linked PRs.

> Extracted from PRs by [@jzimdars](https://github.com/jzimdars) (Lead Designer at 37signals) in [basecamp/fizzy](https://github.com/basecamp/fizzy)
> Focus: UX-first development, prototype shipping, visual coherence, CSS patterns

---

**Referenced PRs**: [#305](https://github.com/basecamp/fizzy/pull/305), [#131](https://github.com/basecamp/fizzy/pull/131), [#335](https://github.com/basecamp/fizzy/pull/335), [#265](https://github.com/basecamp/fizzy/pull/265), [#608](https://github.com/basecamp/fizzy/pull/608)

---

## UX-First Decision Making

### Perceived Performance > Technical Performance
**From PR [#131](https://github.com/basecamp/fizzy/pull/131) - New filtering UI**

Jason challenged the Turbo Streams approach not because it was technically wrong, but because of how it *felt*:

> "I'd imagined this as a single form in the sense that you'd make all of your selections and then 'apply' the filter rather than it updating the view after every new choice. Some shopping websites do that latter and it always feels/is slow."

**The Pattern:**
- User perception matters more than server response time
- Even if technically fast locally, if it *feels* slow in real conditions, it needs rethinking
- Compare to familiar patterns users encounter elsewhere ("shopping websites")

**Transferable Lesson:**
When reviewing implementations, ask: "Does this feel instant to the user?" Not just "Is the server response under 200ms?"

### Simplify by Removing, Not Just Hiding
**From PR [#131](https://github.com/basecamp/fizzy/pull/131)**

When the filter UI became complex with live-updating chips, Jason proposed:

> "One thing we could try if it were to simplify things is to not show the chips while the form is open. Then there wouldn't be anything to update live on the page."

**The Pattern:**
- If real-time updates add complexity, question whether they're needed
- Reduce what's visible during interaction, not just what's rendered
- Simpler UI states = fewer edge cases = more reliable UX

**Example Application:**
```ruby
# Instead of live-updating summaries while editing
# Show simple form → Apply → Show updated summary
# Less JS, fewer round-trips, clearer mental model
```

---

## Prototype Quality Shipping

### Explicitly Label Implementation Quality
**From PR [#335](https://github.com/basecamp/fizzy/pull/335) - Two column Collection design**

Jason's guidance to the reviewer:

> "This is an unproven feature built with prototype quality code so I would suggest factoring your appetite accordingly."

**The Pattern:**
- Communicate implementation quality expectations upfront
- "Prototype quality" is a valid shipping standard when validating
- Different features deserve different polish levels based on uncertainty

**Key Quote:**
> "The goal is to get this onto our production instance as soon as possible so we can vet the design with real work."

### Ship to Validate, But Document Known Issues
**From PR [#335](https://github.com/basecamp/fizzy/pull/335)**

Jason merged with explicit areas for improvement:

1. Performance issues: "un-holy things with Bubble collections"
2. Missing features: "no pagination in the new view"
3. Technical debt acknowledged: "mess we haven't cleaned up since we moved to the cards design"

**The Pattern:**
- Ship with known flaws if they don't block validation
- Enumerate specific areas needing attention
- Distinguish between "needs real data to know" vs "clearly broken"

**Transferable Application:**
```ruby
# In PR description template:
## Known Limitations (acceptable for validation)
- [ ] Performance not optimized (works locally, needs prod data)
- [ ] No pagination (start without to test core UX)
- [ ] Old partials not removed (cleanup after validation)

## Blockers (must fix before merge)
- [ ] Data loss potential
- [ ] Security issues
```

---

## Real Usage Trumps Speculation

### Prefer Production Validation Over Local Perfection
**From PR [#335](https://github.com/basecamp/fizzy/pull/335)**

> "A concern is that it currently runs slowly on our beta instance which may be simply because the Digital Ocean droplet doesn't have sufficient specs. It's quite fast on local dev so this might not be an issue at all on our production instance."

**The Pattern:**
- Different environments tell different stories
- Production behavior with real data > development behavior with fixtures
- "Could be that you just merge it as is and there's no problem"

**Decision Framework:**
1. Is it fast enough locally? → Suggests architectural approach is sound
2. Is it slow in staging? → Could be infrastructure, not code
3. Ship to prod to know for sure (with monitoring ready)

### Name Technical Debt, Don't Block on It
**From PR [#335](https://github.com/basecamp/fizzy/pull/335)**

> "There is also some mess here that we haven't cleaned up since we moved to the cards design... the whole `Bubble` namespace doesn't really make sense anymore but we haven't done anything about it. I'm only pointing that out because it's probably confusing!"

**The Pattern:**
- Acknowledge confusing code without demanding immediate fixes
- Context for reviewers: "this exists in main, too"
- Prevents blocking valuable features on cleanup

---

## Incremental Feature Addition

### Add Escape Hatches Without Removing Primary Path
**From PR [#608](https://github.com/basecamp/fizzy/pull/608) - Create and add another**

The PR added a "Create and add another" button without changing the primary "Create card" flow.

**Code Pattern:**
```ruby
# Before: Single action
<%= button_to "Create card", card_publish_path(card) %>

# After: Primary + escape hatch
<%= button_to "Create card", card_publish_path(card),
    name: "creation_type", value: "add" %>
<%= button_to "Create and add another", card_publish_path(card),
    name: "creation_type", value: "add_another" %>
```

**The Pattern:**
- Don't replace existing behavior, extend it
- Use form parameters to branch: `params[:creation_type]`
- Keeps both paths working, no feature flags needed

**Controller Implementation:**
```ruby
def create
  @card.publish
  redirect_to add_another_param? ? @collection.cards.create! : @card
end

private
  def add_another_param?
    params[:creation_type] == "add_another"
  end
```

**Transferable Lesson:**
When adding workflows, branch with parameters rather than replacing routes or creating separate endpoints.

---

## Visual Polish Through Iteration

### Ship Visual Redesigns Big
**From PR [#305](https://github.com/basecamp/fizzy/pull/305) - New visual design**

This was a massive visual overhaul (95 files changed):
- Complete CSS restructuring
- New card-based layouts
- Pinning system
- New color schemes

**The Pattern:**
- Visual redesigns are better done wholesale than piecemeal
- Easier to evaluate coherence when everything updates together
- Screenshots in PR (not just code) for visual review

**Why This Matters:**
Incremental visual changes create inconsistent UX. Better to:
1. Design the new vision completely
2. Implement it all at once
3. Validate with real usage
4. Iterate on the new baseline

---

## Feature Design Principles

### Reuse Robust Systems for New Features
**From PR [#335](https://github.com/basecamp/fizzy/pull/335)**

> "The whole thing runs through the `Filter` system. It's quite robust and resilient so I got a lot of mileage out of breaking it out into individual forms to get the various sorting and filtering in place."

**The Pattern:**
- Identify "robust and resilient" existing systems
- Leverage them creatively for new features
- Even if "there are certainly better ways" - ship with what works

**Example:**
```ruby
# Instead of building new sorting UI from scratch
# Use existing filter system with different params
<%= form_with url: bubbles_path, method: :get do %>
  <%= hidden_field_tag :indexed_by, "newest" %>
<% end %>

<%= form_with url: bubbles_path, method: :get do %>
  <%= hidden_field_tag :indexed_by, "oldest" %>
<% end %>
```

---

## Feedback Style

### Give Product Context, Not Implementation Mandates
**From PR [#131](https://github.com/basecamp/fizzy/pull/131)**

Jason didn't say "use a single form" or "remove the Turbo Streams". He said:

> "I'd imagined this as a single form in the sense that you'd make all of your selections and then 'apply'..."

**The Pattern:**
- Share the product vision ("I'd imagined...")
- Explain the UX concern ("feels/is slow")
- Suggest an approach ("One thing we could try...")
- Let the implementer figure out how

**Not:**
- "Change this to use X technology"
- "The performance is unacceptable"
- "You must do Y"

### Trust, Then Verify in Production
**From PR [#335](https://github.com/basecamp/fizzy/pull/335)**

> "It could be that you just merge it as is and there's no problem. If you do choose to dig more deeply, here are a few areas to look into..."

**The Pattern:**
- Default to shipping
- Provide investigation paths if reviewer wants to dig deeper
- "Factor your appetite accordingly" - let reviewer decide effort level

---

## CSS Container Query Patterns

### Use Container Queries for Responsive Cards
**From PR [#305](https://github.com/basecamp/fizzy/pull/305), [#335](https://github.com/basecamp/fizzy/pull/335)**

```css
.card {
  container-type: inline-size;
  font-size: 1.8cqi;  /* Container query units */
}

.card__title {
  font-size: 2.5em;  /* Relative to container */
}
```

**The Pattern:**
- Components size themselves based on container, not viewport
- `cqi` units (container query inline size)
- Cards work anywhere because they're self-contained

**Why This Matters:**
Cards can appear in:
- Grid layouts (3 columns)
- List layouts (single column)
- Sidebars (narrow)
- Modals (medium)

All without media queries.

---

## Data-Driven Development

### List Specific Investigation Areas
**From PR [#335](https://github.com/basecamp/fizzy/pull/335)**

When shipping for validation, enumerate what to watch:

> "If you do choose to dig more deeply, here are a few areas to look into:
> 1. The `Bubbles#Index` view is doing a lot of un-holy things...
> 2. There's also no pagination...
> 3. The whole thing runs through the `Filter` system...
> 4. Look for cases that might cause data loss..."

**The Pattern:**
- Number specific areas of concern
- Point to exact code locations
- Note what's "un-holy" vs what's intentional-but-rough
- Call out data safety specifically

---

## Key Takeaways

1. **Feel > Metrics**: User perception beats benchmarks
2. **Ship to Learn**: "Prototype quality" is a valid standard for validation
3. **Context Over Criticism**: Explain the mess without blocking the feature
4. **Extend, Don't Replace**: Add new paths via parameters, keep old paths working
5. **Production Truth**: Real data reveals what local testing can't
6. **Leverage What Works**: Reuse robust systems even if not "perfect" for new use case
7. **Visual Coherence**: Ship visual redesigns wholesale, not piecemeal
8. **Enumerate Concerns**: List specific areas to investigate, not vague "needs work"

---

## Application to Your Projects

### PR Template Addition
```markdown
## Shipping Standard
- [ ] Production quality - polished and complete
- [ ] Prototype quality - validating approach, known limitations below
- [ ] Experimental - testing feasibility only

## If Prototype Quality
### What We're Validating
-

### Known Limitations (acceptable for validation)
-

### Will Investigate After Real Usage
-
```

### Code Review Questions
1. Does this feel fast to users? (not just: is it fast?)
2. Are we shipping to learn or shipping to finish?
3. What will real data tell us that fixtures can't?
4. Are we extending or replacing? (prefer extending)
5. If there's mess, is it documented? Is it blocking?
