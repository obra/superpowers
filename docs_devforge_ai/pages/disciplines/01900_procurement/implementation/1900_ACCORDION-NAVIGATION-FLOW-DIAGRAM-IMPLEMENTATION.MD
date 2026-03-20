# Accordion Navigation Flow Diagram

## Fixed Navigation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              1. USER CLICKS ACCORDION SECTION                   │
│  (e.g., Procurement → "Template & Form Management")             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 2. URL UPDATES                                  │
│  • Procurement: /templates-forms-management?discipline=01900    │
│  • Safety:      /templates-forms-management?discipline=02400    │
│  • Governance:  /templates-forms-management                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            3. URL CHANGE LISTENER DETECTS CHANGE                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Event Types Detected:                                   │    │
│  │ • hashchange (HashRouter)                               │    │
│  │ • popstate (Browser navigation)                         │    │
│  │ • navigate (React Router)                               │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              4. RACE CONDITION PREVENTION                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Check: isHandlingUrlChange                              │    │
│  │ • If true: Skip (already processing)                    │    │
│  │ • If false: Set to true and proceed                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              5. EXTRACT DISCIPLINE PARAMETER                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Helper: extractDisciplineFromUrl()                      │    │
│  │                                                         │    │
│  │ HashRouter Path:                                        │    │
│  │ • Parse window.location.hash.split('?')[1]              │    │
│  │ • Extract 'discipline' parameter                       │    │
│  │                                                         │    │
│  │ Regular Router Path:                                    │    │
│  │ • Parse window.location.search                          │    │
│  │ • Extract 'discipline' parameter                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              6. STATE READINESS CHECK                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Wait for userRole to be determined (max 5 seconds)      │    │
│  │                                                         │    │
│  │ While userRole is 'unknown':                            │    │
│  │   • Log: "Waiting for userRole to be determined..."     │    │
│  │   • Sleep: 100ms                                        │    │
│  │                                                         │    │
│  │ Exit when:                                              │    │
│  │ • userRole is determined, OR                            │    │
│  │ • Timeout reached                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              7. CALL STABLE fetchTemplates()                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Dependencies: [userRole, activeOrganization?.id, ...]   │    │
│  │                                                             │    │
│  │ Process:                                                  │    │
│  │ 1. Build query parameters                                 │    │
│  │ 2. Include discipline parameter if present               │    │
│  │ 3. Make API call to /api/templates                       │    │
│  │ 4. Process response with processTemplatesFromApi()        │    │
│  │ 5. Apply role-based filtering                            │    │
│  │ 6. Update UI state                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                8. TEMPLATE FILTERING                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Role-based Filtering:                                    │    │
│  │                                                         │    │
│  │ Governance User:                                         │    │
│  │ • Show ALL templates from ALL disciplines               │    │
│  │                                                         │    │
│  │ Discipline User:                                         │    │
│  │ • Show ONLY templates from assigned disciplines         │    │
│  │ • Cross-reference with URL parameter if present         │    │
│  │                                                         │    │
│  │ URL Parameter Enhancement:                              │    │
│  │ • If discipline=01900: Additional filtering for Procurement│ │
│  │ • If discipline=02400: Additional filtering for Safety  │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    9. UI UPDATE                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Set filtered templates in state                       │    │
│  │ • TemplateTable component re-renders                    │    │
│  │ • Shows discipline-specific template list               │    │
│  │ • Display discipline label if URL parameter present     │    │
│  │                                                         │    │
│  │ Console Logging:                                         │    │
│  │ • "TEMPLATE_NAVIGATION: URL change detected..."         │    │
│  │ • "TEMPLATE_REQUESTS: Templates fetched successfully"   │    │
│  │ • "TEMPLATE_FILTERING: X templates shown"               │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              10. CLEANUP & FINALIZE                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Set isHandlingUrlChange = false                       │    │
│  │ • Remove event listeners on component unmount           │    │
│  │ • Ready for next navigation event                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER SEES RESULT                             │
│  • Correct discipline-specific template list                   │
│  • URL parameter preserved                                     │
│  • Smooth navigation experience                                │
└─────────────────────────────────────────────────────────────────┘
```

## Key Improvements Made

### Before Fix:
```
❌ Circular dependency: [fetchTemplates]
❌ No race condition prevention
❌ No state readiness waiting
❌ Duplicate URL parsing code
❌ Unstable function references
❌ Poor error handling
```

### After Fix:
```
✅ Stable dependencies: [userRole, activeOrganization?.id]
✅ Race condition prevention: isHandlingUrlChange flag
✅ State readiness waiting: Up to 5 second timeout
✅ Centralized URL parsing: extractDisciplineFromUrl()
✅ Stable function references: useCallback with proper deps
✅ Comprehensive error handling: try-catch with fallbacks
```

## Navigation Examples

### Example 1: Procurement User
1. User clicks "Procurement" → "Template & Form Management"
2. URL becomes: `/templates-forms-management?discipline=01900`
3. System waits for userRole ( Procurement user)
4. Fetches templates with discipline filter
5. Shows only Procurement-related templates

### Example 2: Safety User
1. User clicks "Safety" → "Template & Form Management"
2. URL becomes: `/templates-forms-management?discipline=02400`
3. System waits for userRole (Safety user)
4. Fetches templates with discipline filter
5. Shows only Safety-related templates

### Example 3: Governance User
1. User clicks "Governance" → "Template & Form Management"
2. URL becomes: `/templates-forms-management` (no parameter)
3. System waits for userRole (Governance user)
4. Fetches all templates from all disciplines
5. Shows complete template library

This flow ensures consistent, reliable navigation across all user types and disciplines.