# AGENTS.md — Build VIN Mapping System

All coding agents working on this project must use the following resources from the parent repository as the default frontend/design/testing workflow.

## Required skills and tools

### 1. design-taste-frontend
Use for art direction, page composition, hierarchy, typography, palette, and anti-generic UI review. Avoid generic AI/SaaS patterns, decorative card overload, unnecessary gradients, and invented vanity metrics.

### 2. Impeccable
Use for UI critique, polish, accessibility, responsive behavior, hierarchy, layout quality, edge cases, onboarding/empty states, and final shipping checks.

### 3. designlang
Use when extracting or comparing a design system from a live reference, producing tokens, Tailwind/shadcn variables, responsive behavior, contrast checks, component anatomy, or design-language documentation.

### 4. React Bits
Use selectively for React UI details, micro-interactions, animated components, backgrounds, and text effects. Prefer subtle enterprise-appropriate components; do not add decorative animation without UX value.

### 5. GSAP Skills
Use for purposeful advanced motion, timelines, ScrollTrigger, SplitText, FLIP, framework-safe React integration, cleanup, and performance. Respect reduced-motion preferences.

### 6. transitions.dev
Use for state transitions such as dropdowns, modals, validation feedback, panel reveals, icon swaps, status changes, and other compact interaction patterns. Always preserve reduced-motion handling.

### 7. Playwright CLI
Use for browser verification and E2E testing of critical flows. Test success, validation, permissions, loading, error and empty states. Capture screenshots where useful.

## Product design principles
- Enterprise internal application, not a marketing landing page.
- Desktop-first responsive design.
- English first; architecture must be RTL-ready for Arabic later.
- Dense data screens should prioritize scanability and operational speed.
- Use clear status semantics: MAPPED green, UNMAPPED amber, INACTIVE gray, ERROR red.
- Avoid excessive motion in tables, filters, audit logs, and operations workflows.
- Use animation only when it clarifies hierarchy, state, feedback, or navigation.
- Accessibility and keyboard operation are required.

## Application modules
- Login
- Dashboard
- Vehicle Verification
- VIN Master Sheet
- Mapping Management
- Unmapped Vehicles
- Reports
- Audit Trail
- User Management

## Data rules
- VIN_MASTER_SHEET is read-only.
- VIN_MAKE and VIN_MODEL hold VIN master data.
- VIN_ESKA_MAPPING holds mapping data.
- Never create duplicate active VIN_MAKE_ID + VIN_MODEL_ID mappings.
- Deactivation is a soft delete using STATUS = INACTIVE.
- Audit every create, edit, deactivate and reactivate action.
- Vehicle verification reads the master sheet.
- Unmapped VIN_MODEL rows remain visible in the master sheet.

## Required delivery loop
1. Shape the screen and workflow before implementation.
2. Apply design-taste-frontend / Impeccable principles.
3. Build with React/TypeScript/Tailwind and existing project patterns.
4. Use React Bits, GSAP or transitions.dev only where they improve UX.
5. Run accessibility/responsive/edge-case review.
6. Verify critical flows with Playwright CLI.
7. Polish before considering the screen complete.

## Critical flows to test
- Login and role-based routing.
- VIN verification: MAPPED / UNMAPPED / INACTIVE / ERROR.
- Add mapping from unmapped vehicle.
- Duplicate active mapping prevention.
- Edit mapping.
- Deactivate/reactivate mapping.
- Read-only enforcement on VIN Master Sheet.
- Filters, pagination, sorting and export.
- Audit trail visibility.
- Role restrictions for ADMIN / MAPPING_MANAGER / VIEWER.
