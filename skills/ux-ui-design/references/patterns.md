<overview>
UI patterns are reusable solutions to common design problems. This reference covers navigation, forms, data display, feedback, and interaction patterns.
</overview>

<navigation_patterns>

<primary_navigation>
**Top navigation bar**
- Best for: Simple sites with 5-7 main sections
- Contains: Logo, main nav links, user menu, search

**Side navigation**
- Best for: Complex apps with many sections
- Expandable/collapsible sections
- Often combined with top bar for user menu

**Bottom navigation (mobile)**
- Best for: 3-5 primary actions
- Thumb-reachable on mobile
- Icons with labels
</primary_navigation>

<secondary_navigation>
**Breadcrumbs**
```
Home > Products > Category > Item
```
- Shows location in hierarchy
- Allows quick navigation up

**Tabs**
- Best for: 2-7 peer sections of content
- All content at same level
- Immediate switching

**Sidebar navigation**
- Best for: Related actions/filters
- Common in settings, admin panels
</secondary_navigation>

<search_patterns>
**Standard search**
- Search icon or full field in header
- Clear button when has content
- Recent searches dropdown

**Faceted search**
- Filters alongside results
- Category/attribute filtering
- Clear all filters option

**Autocomplete**
- Suggestions as user types
- Highlight matching text
- Keyboard navigation
</search_patterns>

</navigation_patterns>

<form_patterns>

<form_layout>
**Single-column layout**
- One field per line
- Best for most forms
- Easier to scan

**Labels above fields**
- Standard, accessible
- Works for all field sizes
- Clear association

**Inline labels (placeholder)**
- ❌ Avoid as sole label
- Disappears on input
- Accessibility issues
</form_layout>

<input_types>
**Text input** - Short text (name, email)
**Textarea** - Long text (descriptions, comments)
**Select/dropdown** - One choice from many (5-15 options)
**Radio buttons** - One choice from few (2-5 options, all visible)
**Checkboxes** - Multiple choices
**Toggle switch** - Binary on/off
**Date picker** - Date selection with calendar
**File upload** - File selection with preview
</input_types>

<validation_patterns>
**Real-time validation**
- Validate on blur (leave field)
- Show success/error immediately
- Don't validate empty fields until blur

**Error display**
- Red border on field
- Error message below field
- Icon for quick scanning
- Don't clear user input

**Success confirmation**
- Green checkmark
- Subtle, doesn't distract
- Appears after valid input
</validation_patterns>

<multi_step_forms>
**When to use:**
- Form is long (10+ fields)
- Logical groupings exist
- Can save progress between steps

**Best practices:**
- Progress indicator
- Previous/Next navigation
- Save progress automatically
- Clear step labels
- Review before submit
</multi_step_forms>

</form_patterns>

<data_display_patterns>

<lists>
**Simple list**
- Stacked items
- Consistent structure
- Clear action targets

**Card list/grid**
- Visual content
- Multiple pieces of info
- Equal-weight items

**Table**
- Structured data
- Comparison across rows
- Sortable/filterable columns
</list>

<empty_states>
**What to include:**
- Friendly message explaining empty state
- Clear call-to-action to populate
- Helpful illustration (optional)
- Don't show broken/empty UI

**Example:**
```
[Illustration]
No contacts yet
Add your first contact to get started.
[+ Add Contact]
```
</empty_states>

<loading_states>
**Skeleton screens**
- Placeholder shapes for content
- Reduces perceived wait time
- Better than spinner for known layouts

**Spinners**
- For unknown layouts
- Include text for long waits
- Consider progress indicator

**Progressive loading**
- Load critical content first
- Lazy load below-fold content
- Show partial data while loading more
</loading_states>

<pagination>
**Standard pagination**
```
< Previous  1  2  3  ...  10  Next >
```
- Best for SEO, bookmarkable pages
- Clear position in results

**Infinite scroll**
- Best for content browsing (social feeds)
- Bad for finding specific items
- Include "back to top" button

**Load more button**
- User controls when to load
- Better than infinite scroll for findability
- Show remaining count
</pagination>

</data_display_patterns>

<feedback_patterns>

<notifications>
**Toast notifications**
- Brief, auto-dismissing
- Success/info confirmations
- Non-blocking

**Inline notifications**
- Persistent until dismissed
- Errors, warnings
- Contextual to content

**Alert banners**
- Page-level messages
- System status, promotions
- Dismissible or persistent
</notifications>

<progress_indicators>
**Determinate (known duration)**
- Progress bar with percentage
- Step indicators
- File upload progress

**Indeterminate (unknown duration)**
- Spinning loader
- Pulsing animation
- "Loading..." text
</progress_indicators>

<confirmation_dialogs>
**When to use:**
- Destructive actions (delete, remove)
- Irreversible actions
- High-consequence actions

**Best practices:**
- Clear title explaining action
- Consequence explanation
- Descriptive button labels ("Delete contact" not just "OK")
- Cancel as easy escape
</confirmation_dialogs>

</feedback_patterns>

<interaction_patterns>

<modals>
**When to use:**
- Focused task requiring attention
- Confirmation of action
- Quick data entry

**Best practices:**
- Overlay dims background
- Close button (X) top-right
- Escape key closes
- Focus trapped inside
- Focus returns on close
</modals>

<dropdowns>
**Click to reveal**
- Button/trigger opens menu
- Menu closes on selection
- Menu closes on outside click

**Hover to reveal**
- Only on desktop
- Requires delay to prevent accidental open
- Keep accessible via click too
</dropdowns>

<drag_and_drop>
**When to use:**
- Reordering lists
- Moving between columns
- File upload areas

**Best practices:**
- Clear drag affordance (handle)
- Drop zone highlighting
- Keyboard alternative always
- Ghost preview while dragging
</drag_and_drop>

<gestures_mobile>
**Common gestures:**
- Tap: Primary action
- Long press: Context menu
- Swipe: Delete, archive, navigate
- Pull to refresh: Update content
- Pinch: Zoom

**Best practices:**
- Always have button alternative
- Provide discoverability hints
- Match platform conventions
</gestures_mobile>

</interaction_patterns>
