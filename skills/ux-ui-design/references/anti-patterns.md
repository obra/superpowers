<overview>
Design anti-patterns are common mistakes that hurt usability, accessibility, or user trust. Learn to recognize and avoid these patterns.
</overview>

<dark_patterns>

<definition>
**Dark patterns** are deceptive design choices that trick users into actions they didn't intend. These damage user trust and may be illegal in some jurisdictions.
</definition>

<examples>
**Trick questions**
- Confusing double-negatives in opt-outs
- "Uncheck to not receive emails"

**Hidden costs**
- Fees revealed only at checkout
- Subscription costs buried in fine print

**Roach motel**
- Easy to sign up, hard to cancel
- Hidden cancellation flow

**Confirm shaming**
- "No thanks, I don't want to save money"
- Guilt-tripping rejection buttons

**Forced continuity**
- Auto-renewing subscriptions without warning
- Hard to find cancellation

**Misdirection**
- Drawing attention away from important info
- Bright button for upsell, grey for decline

**Bait and switch**
- Promising one thing, delivering another
- Changed terms after signup
</examples>

<why_avoid>
- Erodes user trust
- Increases support requests
- Damages brand reputation
- Legal risk (GDPR, FTC)
- Higher churn in the long run
</why_avoid>

</dark_patterns>

<usability_anti_patterns>

<mystery_meat_navigation>
**Problem:** Icons without labels, unclear what things do
**Fix:** Add text labels, use recognizable icons, include tooltips
</mystery_meat_navigation>

<infinite_scroll_for_everything>
**Problem:** Can't find position, can't reach footer, SEO issues
**Fix:** Use pagination for structured content, infinite scroll only for feeds
</infinite_scroll_for_everything>

<carousel_overuse>
**Problem:** Users rarely interact past first slide, content gets missed
**Fix:** Static hero, prioritize single strong message, remove carousel
</carousel_overuse>

<modal_bombardment>
**Problem:** Popups on page load, interrupt user flow
**Fix:** Delay popups, limit frequency, trigger based on behavior not time
</modal_bombardment>

<form_over_function>
**Problem:** Beautiful but unusable, unclear interactions
**Fix:** Usability testing, follow conventions, prioritize function
</form_over_function>

<dropdown_for_few_options>
**Problem:** Hiding 2-3 options in dropdown
**Fix:** Show radio buttons for 2-5 options
</dropdown_for_few_options>

<placeholder_as_label>
**Problem:** Labels disappear when typing, can't verify correct field
**Fix:** Visible labels above fields, placeholder for examples only
</placeholder_as_label>

<auto_advancing_forms>
**Problem:** Moving focus after character limit
**Fix:** Manual progression, let users control pace
</auto_advancing_forms>

<disabled_submit_without_feedback>
**Problem:** Submit button disabled with no explanation
**Fix:** Show what's missing/invalid, enable button and show errors on click
</disabled_submit_without_feedback>

<pagination_in_tables_without_persistence>
**Problem:** Selecting row then changing page loses selection
**Fix:** Persist selection across pages, show selection count
</pagination_in_tables_without_persistence>

</usability_anti_patterns>

<accessibility_anti_patterns>

<div_button>
**Problem:** Using `<div>` or `<span>` instead of `<button>`
```html
<!-- ❌ Wrong -->
<div class="button" onclick="submit()">Submit</div>

<!-- ✅ Correct -->
<button type="submit">Submit</button>
```
**Why:** Divs lack keyboard access, ARIA roles, focus management
</div_button>

<color_only_meaning>
**Problem:** Red/green only distinguishes error/success
**Fix:** Add icons, text, or patterns alongside color
</color_only_meaning>

<low_contrast_aesthetics>
**Problem:** Light gray text for "clean" look
**Fix:** Meet 4.5:1 contrast minimum, test with contrast checker
</low_contrast_aesthetics>

<removing_focus_outline>
**Problem:** `:focus { outline: none }` for aesthetics
**Fix:** Style focus, don't remove it
```css
/* ❌ Never */
:focus { outline: none; }

/* ✅ Instead */
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```
</removing_focus_outline>

<keyboard_traps>
**Problem:** Tab enters component but can't leave
**Fix:** Test keyboard navigation, ensure escape routes
</keyboard_traps>

<auto_playing_media>
**Problem:** Video/audio starts without user action
**Fix:** Require user action, mute by default if essential
</auto_playing_media>

<missing_alt_text>
**Problem:** Images without alt text
**Fix:** Descriptive alt for informative images, alt="" for decorative
</missing_alt_text>

<tabindex_manipulation>
**Problem:** Arbitrary tabindex values creating confusing order
**Fix:** Use natural DOM order, only tabindex="0" or tabindex="-1"
</tabindex_manipulation>

</accessibility_anti_patterns>

<visual_design_anti_patterns>

<inconsistent_spacing>
**Problem:** Random padding/margins throughout
**Fix:** Use spacing scale (4, 8, 12, 16, 24, 32px)
</inconsistent_spacing>

<too_many_fonts>
**Problem:** 4+ font families creating visual chaos
**Fix:** 1-2 font families maximum
</too_many_fonts>

<competing_focal_points>
**Problem:** Multiple elements screaming for attention
**Fix:** Single primary action, clear hierarchy
</competing_focal_points>

<trapped_white_space>
**Problem:** Awkward gaps in layout that feel unintentional
**Fix:** Consistent margins, intentional grouping
</trapped_white_space>

<rainbow_colors>
**Problem:** Using full spectrum without purpose
**Fix:** Limited palette, semantic color usage
</rainbow_colors>

<centered_long_text>
**Problem:** Paragraphs of centered text, hard to read
**Fix:** Left-align body text, center only headlines
</centered_long_text>

</visual_design_anti_patterns>

<process_anti_patterns>

<designing_for_stakeholders>
**Problem:** Making decisions based on what boss/PM likes
**Fix:** User research, usability testing, data-driven decisions
</designing_for_stakeholders>

<pixel_perfect_too_early>
**Problem:** High-fidelity before validating concept
**Fix:** Wireframes first, iterate cheap before investing in polish
</pixel_perfect_too_early>

<designing_for_edge_cases_first>
**Problem:** Overcomplicating for rare scenarios
**Fix:** Design for 80% use case, handle edge cases gracefully
</designing_for_edge_cases_first>

<never_testing_with_users>
**Problem:** Assuming you know what users need
**Fix:** Regular usability testing, 5 users find 85% of issues
</never_testing_with_users>

<accessibility_as_afterthought>
**Problem:** "We'll make it accessible later"
**Fix:** Build in from start, 10% more time vs 300% retrofit
</accessibility_as_afterthought>

<custom_values_everywhere>
**Problem:** Ignoring design system for one-off values
**Fix:** Use design system exclusively, propose additions when needed
</custom_values_everywhere>

</process_anti_patterns>
