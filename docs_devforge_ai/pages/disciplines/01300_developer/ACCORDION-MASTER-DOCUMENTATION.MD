# Accordion System - Master Documentation

## ⚡ Quick Start Guide

**Need to implement accordion quickly?**
1. Import: `import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";`
2. Wrap in provider: `<AccordionProvider><AccordionComponent settingsManager={settingsManager} /></AccordionProvider>`
3. Structure source: `server/src/routes/accordion-sections-routes.js` (templates, not database)
4. API endpoint: `GET /api/accordion-sections?organization_name=...`

## 🚨 Critical Implementation Warnings

- ⚠️ **Structure is template-based, NOT database-driven**
- ⚠️ **3-TIER FALLBACK SYSTEM: Changes must be synchronized across multiple files**
- ⚠️ **Server/Production template: `server/src/routes/accordion-sections-routes.js` (MASTER_TEMPLATE)**
- ⚠️ **Client fallback: `client/src/common/js/config/00200-ui-display-mappings.js` (sectionMappings)**
- ⚠️ **Emergency fallback: Hardcoded in accordion-component.js**
- ⚠️ **Supabase stores only org/collaboration config, not structure**

---

### 🚨 Critical URL Pattern Warning (RECURRING ISSUE)

**⚠️ URL Patterns In Accordion Links:**

**❌ NEVER use:** `{ title: 'Link Name', url: '/#/route-name' }` (Causes double-hash routing!)

**✅ ALWAYS use:** `{ title: 'Link Name', url: '/route-name' }` (React Router handles # automatically)

**Real-World Consequence:**
- Manual `/#/` inclusion → **Broken navigation** (double-hash routing)
- Results in "Page Not Found" errors in dev/prod environments
- This issue has occurred multiple times and causes significant debugging time
- **Fix:** Remove manual `/#/` prefixes from all accordion link URLs

---

## 📋 Common Task Checklist

- [ ] Need new section? → Edit MASTER_TEMPLATE in accordion-sections-routes.js **AND** sectionMappings in 00200-ui-display-mappings.js
- [ ] Organization mapping? → Update ORGANIZATION_TEMPLATES
- [ ] Collaboration issue? → Check organization_collaborations table
- [ ] Not loading? → Verify AccordionComponent import path
- [ ] Wrong template? → Check ORGANIZATION_TEMPLATES mapping
- [ ] Dev/prod differences? → Check 3-tier fallback system synchronization

## 🔄 3-Tier Fallback System Explained

**The accordion system uses a hierarchical 3-tier fallback approach:**

### 1. Primary: Server API (Production)
**File:** `server/src/routes/accordion-sections-routes.js`
**Method:** `GET /api/accordion-sections` with organization filtering
**Variable:** `MASTER_TEMPLATE`
**Used when:** Production environment, normal operation
**Contains:** Complete 51-section accordion structure

### 2. Secondary: Client Fallback (Development)
**File:** `client/src/common/js/config/00200-ui-display-mappings.js`
**Variable:** `sectionMappings`
**Used when:** API unavailable, development environment, fallback mode
**Contains:** ~20 sections (currently **INCOMPLETE** - needs synchronization)

### 3. Tertiary: Emergency Hardcoded Fallback
**File:** `client/src/modules/accordion/00200-accordion-component.js`
**Method:** Hardcoded fallback array in component
**Used when:** All other methods fail
**Contains:** Minimal critical sections only

### ⚠️ Critical Synchronization Requirements

**When adding/modifying accordion sections:**
1. ✅ **Update server template** (`accordion-sections-routes.js`)
2. ✅ **Update client fallback** (`sectionMappings` in `00200-ui-display-mappings.js`)
3. ✅ **Test 3-tier fallback** - ensure all levels work and are consistent
4. ✅ **Verify section parity** - server should have all sections in client fallback

**Common sync issues:**
- ❌ **Missing sections in client fallback** → Incomplete navigation in development
- ❌ **Different section IDs** → Broken organization mapping
- ❌ **Wrong optionId values** → Incorrect display ordering
- ❌ **Missing subsections** → Incomplete hierarchy structure

### 🛠️ Synchronization Update Workflow

1. **Identify the change needed** (add section, modify links, etc.)
2. **Update server template** in `accordion-sections-routes.js`
3. **Update sectionMappings** in `00200-ui-display-mappings.js`
4. **Transform server format** to client format (objects → string arrays for links)
5. **Verify section IDs match** across both files
6. **Test local development** - confirm fallback works correctly
7. **Test production** - verify API serves complete structure
8. **Document the synchronization** requirement

## Overview

This is the consolidated master documentation for the Simandou AI Bundle accordion navigation system. This document replaces and consolidates multiple previous accordion documentation files to provide a single source of truth.

Status: ✅ FULLY FUNCTIONAL - Core accordion issues resolved as of July 28, 2025.

⚠️ **URGENT: Documentation corrections needed** - The previous documentation incorrectly described a "dual template system". The system actually uses a **3-tier fallback system** with significant synchronization gaps.

## Source of Truth for Accordion Structure

The accordion structure is constructed from server-side templates, not from Supabase page queries.

Primary source:
- server/src/routes/accordion-sections-routes.js
  - MASTER_TEMPLATE: complete EPCM (~51 sections)
  - Template variations: minimal, contractor, judicial
  - Organization-to-template mappings (ORGANIZATION_TEMPLATES)
  - Template inheritance (TEMPLATE_INHERITANCE)

Collaboration integration:
- server/src/routes/accordion-collaboration-routes.js
- Merged into /api/accordion-sections response with page precedence rules

Supabase usage (supporting role only):
- Stores organizations and collaboration records
- Does not define or generate the accordion structure
- The structure returned to the client is derived from templates and collaboration merge logic

### ⚠️ CRITICAL SYNCHRONIZATION ISSUE

**Client fallback is severely incomplete:**
- ❌ **Server template**: 51 sections
- ❌ **Client fallback** (`sectionMappings`): ~20 sections (**60% MISSING**)
- ❌ **Development navigation**: Broken and incomplete
- ❌ **User experience**: Different experiences across environments

## 3-Tier Fallback Data Flow

**1. Primary (Production):**
```
GET /api/accordion-sections
  ↓
server/src/routes/accordion-sections-routes.js (MASTER_TEMPLATE)
  ↓
51 complete sections with full hierarchy
```

**2. Secondary (Development Fallback):**
```
API unavailable
  ↓
client/src/common/js/config/00200-ui-display-mappings.js (sectionMappings)
  ↓
~20 incomplete sections (**CRITICAL GAP**)
```

**3. Tertiary (Emergency):**
```
All methods fail
  ↓
Hardcoded fallback in accordion-component.js
  ↓
Minimal critical sections only
```

The Home page imports the template-aware component:
```javascript
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
```

## Related Documentation

This document references and consolidates information from the following key documentation files:
- [0000_DOCUMENTATION_GUIDE.md](./0000_DOCUMENTATION_GUIDE.md) - **Main Documentation Guide with Accordion Architecture Section**
- [ACCORDION_HIERARCHY_FINAL_FIX_SUMMARY.md](../ACCORDION_HIERARCHY_FINAL_FIX_SUMMARY.md) - Final structure fixes for all sections
- [CONTRACTS_ACCORDION_FIX_SUMMARY.md](../CONTRACTS_ACCORDION_FIX_SUMMARY.md) - Detailed contracts section implementation
- [IT_SECTION_HIERARCHY_ENHANCEMENT_SUMMARY.md](../IT_SECTION_HIERARCHY_ENHANCEMENT_SUMMARY.md) - IT section enhancement details
- [DIRECTORS_ACCORDION_FIX_IMPLEMENTATION_SUMMARY.md](../DIRECTORS_ACCORDION_FIX_IMPLEMENTATION_SUMMARY.md) - Directors section fix implementation
- [ACCORDION_HIERARCHY_FIXES_SUMMARY.md](../ACCORDION_HIERARCHY_FIXES_SUMMARY.md) - Standard links fixes for all sections
- [ACCORDION_COLLABORATION_INTEGRATION.md](./0975_ACCORDION_COLLABORATION_INTEGRATION.md) - Collaboration system integration

## Table of Contents

1. System Architecture
2. Current Implementation
3. Configuration and Mappings
4. Filtering System
5. Recent Major Changes
6. Integration Guide
7. Troubleshooting
8. Migration History
9. Test Code and Production Integration
10. API Record-Finding Issue Resolution
11. 🔴 SYNCHRONIZATION GAPS (CRITICAL)

## System Architecture

### Component Structure

```
client/src/modules/accordion/
├── 00200-accordion-component.js   # React component with 3-tier fallback logic
├── 00200-accordion-manager.js     # Core accordion functionality
├── context/
│   └── 00200-accordion-context.js # Shared state management
└── hooks/
```

### Data Flow Architecture

**Authoritative structure** (Primary):
- server/src/routes/accordion-sections-routes.js
  - MASTER_TEMPLATE + org mappings + collab merge → GET /api/accordion-sections
  - ✅ Complete 51-section structure

**Supporting data** (Supabase):
- Organizations, collaboration definitions (no structure generation)

**Client fallback** (Secondary - INCOMPLETE):
- client/src/common/js/config/00200-ui-display-mappings.js (sectionMappings)
- ❌ Only ~20 sections (60% missing from primary)
- ❌ Broken navigation in development

## Current Implementation

For detailed technical implementation of the dynamic accordion system, see:
[0975_DYNAMIC_ACCORDION_IMPLEMENTATION_SUMMARY.md](./0975_DYNAMIC_ACCORDION_IMPLEMENTATION_SUMMARY.md)

---

## 🚨 Critical Link Ordering Guidelines

### **SECTION LINK SEQUENCE REQUIREMENTS**

**⚠️ MANDATORY STANDARD: All links within each accordion section MUST follow this exact ordering pattern:**

1. **First Link:** Section title (main page link)
2. **Subsequent Links:** Alphabetically ordered (A-Z)

---

### **✅ CORRECT EXAMPLE:**

```javascript
{
  id: 'accordion-button-02400',
  title: 'Safety',
  display_order: 2400,
  sector: 'global',
  links: [
    { title: 'Safety', url: '/safety' },                    // ← 1. Section title link first
    { title: 'Contractor Vetting', url: '/contractor-vetting' }, // ← 2. Alphabetical order
    { title: 'Documents', url: '/all-documents' },         // ← 3. C before E, I, S
    { title: 'Email Management', url: '/email-management' }, // ← 4. E before I, S
    { title: 'Inspections', url: '/inspections' }           // ← 5. I before S
  ],
  subsections: {}
}
```

### **❌ INCORRECT EXAMPLE:**

```javascript
{
  id: 'accordion-button-02400',
  title: 'Safety',
  display_order: 2400,
  sector: 'global',
  links: [
    { title: 'Safety', url: '/safety' },                    // ✓ Correct position
    { title: 'Inspections', url: '/inspections' },          // ✗ Should be after Email Management
    { title: 'Contractor Vetting', url: '/contractor-vetting' }, // ✗ Should be before Documents
    { title: 'Documents', url: '/all-documents' },         // ✗ Wrong alphabetical position
    { title: 'Email Management', url: '/email-management' } // ✗ Wrong alphabetical position
  ],
  subsections: {}
}
```

---

### **📋 IMPLEMENTATION REQUIREMENTS:**

**When adding/modifying accordion sections:**

1. ✅ **Section Title First:** Always start with the section's main page link
2. ✅ **Alphabetical Sort:** Secondary links MUST be sorted A-Z
3. ✅ **Case-Insensitive:** Sorting ignores case differences
4. ✅ **Ignore Special Characters:** Pure alphabetical sorting
5. ✅ **Consistent Across Templates:** Apply to both server and client templates

**Alphabetical Ordering Example:**
- "Contractor Vetting" (C)
- "Documents" (D)
- "Email Management" (E)
- "Inspections" (I)
- "Safety" (S)

---

### **🚨 WHY THIS MATTERS:**

**Inconsistent ordering creates:**
- ❌ **Poor User Experience:** Users can't find links predictably
- ❌ **Confusion:** Different sections with different ordering patterns
- ❌ **Maintenance Issues:** Hard to spot when changes introduce inconsistency
- ❌ **Professional Appearance:** Inconsistent navigation feels unpolished

**Consistent alphabetical ordering provides:**
- ✅ **Predictable Navigation:** Users know where to look for links
- ✅ **Professional Interface:** Uniform, organized appearance
- ✅ **Easy Maintenance:** Simple rules to follow when adding/modifying links
- ✅ **Better UX:** Users can scan sections efficiently

---

### **🛠️ IMMEDIATE ACTION REQUIRED:**

**Review ALL existing accordion sections and:**
1. **Verify:** Section title is first link
2. **Check:** Remaining links are in perfect alphabetical order
3. **Fix:** Any sections with incorrect ordering (see problematic section above)
4. **Apply:** To both templates (server + client)

**This guideline MUST be followed for ALL future link additions and modifications.**

### Contracts Hierarchy Structure

The Contracts section follows this standardized hierarchy pattern for sections that require sub-sections:

```
00400 - Contracts (main button)
  ├── 00400 - Contracts (direct link)
  ├── 00200 - All Documents (standard link)
  └── 03010 - Email Management (standard link)
  └── 00425 - Contracts Pre Award (sub-button)
      ├── 00425 - Contracts Pre Award (self-link)
      ├── 00200 - All Documents (standard link)
      └── 03010 - Email Management (standard link)
  └── 00435 - Contracts Post Award (sub-button)
      ├── 00435 - Contracts Post Award (self-link)
      ├── 00200 - All Documents (standard link)
      └── 03010 - Email Management (standard link)
```

This structure ensures that:

1. The main Contracts section contains the primary Contracts page plus standard links
2. Pre-award and Post-award are organized as dedicated sub-buttons
3. Each sub-button contains its specific page plus standard links
4. Standard links (All Documents, Email Management) are included at all levels

Key implementation notes:

- The main Contracts page (00400) serves as the parent for both sub-buttons
- Pre-award sub-button (00425) contains pre-award specific documents and tools
- Post-award sub-button (00435) contains post-award specific documents and tools
- Standard links (All Documents, Email Management) are included at the main section level and each sub-button level

### Directors Hierarchy Structure

The Directors section follows a specialized hierarchy pattern where individual Director roles are organized as sub-buttons under the main Directors section:

```
00876 - Directors (main button)
  ├── 00876 - Directors (direct link)
  ├── 00200 - All Documents (standard link)
  └── 03010 - Email Management (standard link)
  ├── 00880 - Board of Directors (sub-button)
  │   ├── 00880 - Board of Directors (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00882 - Director Construction (sub-button)
  │   ├── 00882 - Director Construction (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00883 - Director Contracts (sub-button)
  │   ├── 00883 - Director Contracts (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00884 - Director Engineering (sub-button)
  │   ├── 00884 - Director Engineering (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00889 - Director Finance (sub-button)
  │   ├── 00889 - Director Finance (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00885 - Director HSE (sub-button)
  │   ├── 00885 - Director HSE (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00886 - Director Logistics (sub-button)
  │   ├── 00886 - Director Logistics (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00888 - Director Procurement (sub-button)
  │   ├── 00888 - Director Procurement (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00890 - Director Projects (sub-button)
  │   ├── 00890 - Director Projects (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  └── 00895 - Director Project (sub-button)
      ├── 00895 - Director Project (self-link)
      ├── 00200 - All Documents (standard link)
      └── 03010 - Email Management (standard link)
```

This structure ensures that:
- The main Directors section includes its own direct link plus the two standard links.
- Each Director sub-button includes its self-link plus the two standard links, consistently mirroring the Contracts example.

### Design Hierarchy Structure

The Design section follows a specialized hierarchy pattern where engineering disciplines are organized as sub-buttons under the main Design section. Each level includes its own self-link plus the two standard links:

```
00800 - Design (main button)
  ├── 00800 - Design (direct link)
  ├── 00200 - All Documents (standard link)
  └── 03010 - Email Management (standard link)
  ├── 00825 - Architectural (sub-button)
  │   ├── 00825 - Architectural (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00835 - Chemical Engineering (sub-button)
  │   ├── 00835 - Chemical Engineering (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00850 - Civil Engineering (sub-button)
  │   ├── 00850 - Civil Engineering (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00860 - Electrical Engineering (sub-button)
  │   ├── 00860 - Electrical Engineering (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  └── 00870 - Mechanical Engineering (sub-button)
      ├── 00870 - Mechanical Engineering (self-link)
      ├── 00200 - All Documents (standard link)
      └── 03010 - Email Management (standard link)
  ├── 00871 - Process Engineering (sub-button)
  │   ├── 00871 - Process Engineering (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
```

### Main Button Hierarchy Structure

For main buttons without sub-buttons:
```
00300 - Construction (main button)
  ├── 00300 - Construction (direct link)
  ├── 00200 - All Documents (link)
  └── 03010 - Email Management (link)
```

### Project Controls Hierarchy Structure

Project Controls uses a dedicated hierarchy with sub-buttons. Each level includes its own self-link plus the two standard links:

```
02000 - Project Controls (main button)
  ├── 02000 - Project Controls (direct link)
  ├── 00200 - All Documents (standard link)
  └── 03010 - Email Management (standard link)
  ├── 02025 - Quantity Surveying (sub-button)
  │   ├── 02025 - Quantity Surveying (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  └── 02035 - Scheduling (sub-button)
      ├── 02035 - Scheduling (self-link)
      ├── 00200 - All Documents (standard link)
      └── 03010 - Email Management (standard link)
```

### Information Technology (IT) Hierarchy Structure

The IT section uses a dedicated hierarchy for developer and user settings. Each sub-button lists its functional links (no “All Documents/Email” unless explicitly included by design):

```
02050 - Information Technology (main button)
  ├── 02050 - Information Technology (direct link)
  ├── 00200 - All Documents (standard link)
  └── 03010 - Email Management (standard link)
  ├── 02051 - Developer settings (sub-button)
  │   ├── Chatbot management (self-link)
  │   ├── Contributor hub (self-link)
  │   ├── UI settings (self-link)
  │   ├── Modal Management (self-link)
  │   ├── Accordion Management (self-link)
  │   ├── Prompts Management (self-link)
  │   └── Pages Management (self-link)
  └── 02052 - User settings (sub-button)
      ├── Password reset (self-link)
      ├── Pages (self-link)
      ├── UserManagement (self-link)
      └── User signup (self-link)
```

Note: IT is function-oriented. If required, “All Documents” and “Email Management” may be included per sub-button, but the canonical template includes them at the main IT level only.

## Template-Based Content System

The accordion uses a template-based approach with organization-specific mappings:
- Templates and mappings defined in server/src/routes/accordion-sections-routes.js
- Collaborations merged from server/src/routes/accordion-collaboration-routes.js when present
- Supabase stores org and collaboration configuration only

## Test Code and Production Integration

### Backend Services
- `/api/accordion-sections` (complete template structure + collaborations)

### Frontend Components
- `AccordionComponent` (renders API response with 3-tier fallback)
- **Primary**: Server API (`/api/accordion-sections`)
- **Secondary**: `settingsManager.getAccordionSections()` → `sectionMappings`
- **Tertiary**: Hardcoded emergency fallback

### ⚠️ Synchronization Status
- ❌ **Server template**: 51 complete sections
- ❌ **Client fallback**: ~20 sections (**60% MISSING**)
- ❌ **Impact**: Development navigation incomplete

Performance and stability
- Template-first approach ensures consistent structure across orgs
- Collaboration merge prevents duplication and respects precedence

## API Record-Finding Issue Resolution

Note: Prior “database-driven” approaches are superseded here for structure. Any previous references implying that Supabase page rows construct the accordion structure should be read as historical context. The live structure is generated from templates and collaboration merge logic on the server.

## Configuration and Mappings

Core sections, numbering, and ordering are maintained in MASTER_TEMPLATE with display_order guiding visible order. Organization-to-template mappings live in accordion-sections-routes.js.

## Filtering System

Filtering by organization and collaboration occurs server-side when composing the template-derived sections. Sector/user filters are applied at the client as needed for UI concerns; they do not change the authoritative structure source.

## Recent Major Changes

- ✅ **Jul 28, 2025**: Core accordion functionality fully operational
- ✅ **Documentation corrected**: Dual template myth debunked, 3-tier system documented
- ❌ **URGENT: Client fallback incomplete**: 60% of sections missing from development
- ❌ **CRITICAL: Synchronization gaps**: Server has 51 sections, client fallback has ~20

## 🔴 SYNCHRONIZATION GAPS (CRITICAL)

### ⚠️ CURRENT STATUS: SYSTEM FAILURE

| Component | Server Template | Client Fallback | Gap | Impact |
|-----------|----------------|-----------------|-----|---------|
| **Total Sections** | 51 | ~20 | **-31** | Severe |
| **Missing Sections** | - | Commercial, Ethics, Health, Human Resources, Local Content, Operations, Other Parties, Inspection, Public Relations, Quality Assurance, Quality Control, Security, Landscaping | - | Critical |
| **Directors Subsections** | 10 | 3 | **-7** | Major |
| **Engineering Subsections** | 6 | 5 | -1 | Minor |
| **Synchronization** | 100% | ~40% | **-60%** | **BROKEN** |

### 🚨 IMMEDIATE SYNCHRONIZATION REQUIRED

**Action Items (High Priority):**
1. **Complete sectionMappings** in `00200-ui-display-mappings.js` - add all 31 missing sections
2. **Complete Directors hierarchy** - add 7 missing director positions
3. **Verify subsection parity** - ensure all substructures match server template
4. **Test development environment** - confirm all sections accessible locally
5. **Validate production behavior** - ensure consistency across environments

**Business Impact:**
- ❌ **Development Velocity**: **BLOCKED** - developers cannot test 60% of sections
- ❌ **User Experience**: **INCONSISTENT** - different navigation in dev vs prod
- ❌ **Testing Coverage**: **INCOMPLETE** - cannot test full navigation structure
- ❌ **Deployment Risk**: **HIGH** - untested sections may have runtime issues

**Next Steps:**
- Toggle to **Act Mode** to initiate synchronization process
- Update `sectionMappings` with all missing sections from server template
- Test local development environment for complete navigation
- Validate production deployment consistency

## Integration Guide

1. ✅ **To add/change section structure**: edit MASTER_TEMPLATE in accordion-sections-routes.js
2. ✅ **To map organization to a template**: update ORGANIZATION_TEMPLATES in the same file
3. ❌ **CRITICAL MISSING**: update sectionMappings in 00200-ui-display-mappings.js (currently BROKEN)
4. ✅ **To manage collaborations**: use server/src/routes/accordion-collaboration-routes.js

## Troubleshooting

- No sections showing: ensure the page uses "@modules/accordion/00200-accordion-component.js", and check /api/accordion-sections is reachable in Network tab
- Wrong template: verify ORGANIZATION_TEMPLATES mapping
- Collaboration conflicts: review page_precedence and shared_sections in organization_collaborations

## Migration History

This document supersedes earlier docs describing fully database-driven structure composition. The authoritative model is template-first with optional collaboration merges, persisted in code under server/src/routes.

## Related Documentation

**📋 Quick Implementation References:**
- [0050_QUICK_REFERENCE_CARDS.md](0050_QUICK_REFERENCE_CARDS.md) - **30-second implementation guides, troubleshooting, and decision trees**
- [1300_0000_PAGE_ARCHITECTURE_GUIDE.md](1300_0000_PAGE_ARCHITECTURE_GUIDE.md) - **Complete page architecture patterns and standards**

**📚 Technical Implementation Details:**
- [0975_DYNAMIC_ACCORDION_IMPLEMENTATION_SUMMARY.md](./0975_DYNAMIC_ACCORDION_IMPLEMENTATION_SUMMARY.md)
- [0975_ACCORDION_SYSTEM_FIX_SUMMARY.md](./0975_ACCORDION_SYSTEM_FIX_SUMMARY.md)
- [0975_MULTI_ORGANIZATION_ACCORDION_SYSTEM_COMPLETE.md](./0975_MULTI_ORGANIZATION_ACCORDION_SYSTEM_COMPLETE.md)
- [0975_ACCORDION_HIERARCHY_FIX_COMPLETE.md](./0975_ACCORDION_HIERARCHY_FIX_COMPLETE.md)
