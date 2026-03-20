# Page Builder Agent Plan

## Overview

The **Page Builder Agent (0100)** is a new IT Specialist agent designed to automate the creation of new pages in the ConstructAI system. It follows the standardized 0000_PAGE_IMPLEMENTATION_PROCEDURE.md to generate all necessary files, configurations, and database entries.

## Problem Statement

Creating a new page currently requires:
- **10+ manual steps** across multiple files
- **Knowledge of Template A** standards
- **Accordion configuration** in 3 different files
- **Router integration** in App.js
- **Database entries** for page tracking
- **Following strict naming conventions** (02200-xxxx format)
- **State-based button patterns** for discipline pages

This is time-consuming and error-prone. A Page Builder Agent would automate this entire workflow.

## Proposed Solution: Page Builder Specialist (0100)

### Agent Role
- **Name**: Page Builder Specialist
- **Code**: 0100
- **Reports to**: IT Specialist Orchestrator (0060)
- **Location**: `deep-agents/deep_agents/agents/shared/it_specialists/0100_page_builder.py`

### Core Capabilities

1. **Page Template Generation**
   - Create directory structure
   - Generate index.js, page.js, and CSS files
   - Apply correct Template A standards
   - Include mandatory components (accordion, logout button)

2. **Router Integration**
   - Add imports to App.js
   - Add Route declarations
   - Follow existing code patterns

3. **Accordion Configuration**
   - Update server/src/routes/accordion-sections-routes.js
   - Update client/src/common/js/config/00200-ui-display-mappings.js
   - Add alphabetical link ordering
   - Set correct sector and display_order

4. **Database Integration**
   - Generate SQL for pages table insertion
   - Set correct page_prefix, page_slug, page_path
   - Handle parent_page_id for subsections

5. **API Endpoint Generation** (optional)
   - Create route files if API endpoints needed
   - Add to server/src/app.js

6. **State-Based Button Support**
   - Generate state management for discipline pages
   - Create Agents/Upsert/Workspace state buttons
   - Apply Discipline Page State Pattern fixes

7. **Validation**
   - Verify all files created correctly
   - Check naming conventions
   - Validate accordion integration
   - Generate testing checklist

## Implementation Plan

### Phase 1: Core Generator (Week 1)
- [ ] Create 0100_page_builder.py agent structure
- [ ] Implement page template generation
- [ ] Implement router integration
- [ ] Create basic validation

### Phase 2: Accordion & Database (Week 2)
- [ ] Implement accordion configuration updates
- [ ] Implement database SQL generation
- [ ] Add sector and organization access logic
- [ ] Create alphabetical link ordering

### Phase 3: Advanced Features (Week 3)
- [ ] State-based button pattern support
- [ ] Background image page support
- [ ] API endpoint generation
- [ ] Complex subsection handling

### Phase 4: UI Integration (Week 4)
- [ ] Create PageBuilder React component in DevSettings
- [ ] Form for page parameters (code, name, type, etc.)
- [ ] Preview generated files
- [ ] Execute page creation via API

## Input Parameters

```json
{
  "page_code": "02200",
  "page_name": "quality-assurance",
  "display_name": "Quality Assurance",
  "page_description": "Quality assurance management and tracking",
  "page_type": "discipline|data_management|workflow_processing|landing",
  "has_background": false,
  "has_state_buttons": true,
  "parent_section": "accordion-button-02200",
  "display_order": 2200,
  "sector": "epcm",
  "required_roles": ["user"],
  "subsections": [],
  "api_endpoints": false,
  "create_database_entry": true
}
```

## Output Artifacts

1. **Generated Files**:
   - `client/src/pages/{page_code}-{page_name}/{page_code}-index.js`
   - `client/src/pages/{page_code}-{page_name}/{page_code}-{page_name}-page.js`
   - `client/src/pages/{page_code}-{page_name}/{page_code}-{page_name}-style.css`

2. **Modified Files**:
   - `client/src/App.js` (router integration)
   - `server/src/routes/accordion-sections-routes.js`
   - `client/src/common/js/config/00200-ui-display-mappings.js`

3. **Database SQL**:
   - `sql/0100_page_{page_code}_creation.sql`

4. **Documentation**:
   - `docs/pages/{page_code}-{page_name}.md`
   - Update `1300_00000_PAGE_LIST.md`

## Integration with Existing IT Swarm

The Page Builder Agent integrates with:
- **0060 IT Specialist Orchestrator**: For task delegation
- **0070 Knowledge Sync Specialist**: To follow approved procedures
- **0090 Configuration Validator**: To verify generated configs
- **Documentation Control System**: To access PAGE_IMPLEMENTATION_PROCEDURE.md

## Success Criteria

- [ ] New page created with single command/API call
- [ ] All 10 steps from PAGE_IMPLEMENTATION_PROCEDURE automated
- [ ] Generated code follows Template A standards
- [ ] Accordion integration works immediately
- [ ] Database entries created correctly
- [ ] No manual file editing required
- [ ] Validation passes before completion

## Future Enhancements

1. **Visual Page Builder UI**: Drag-and-drop interface for non-developers
2. **Template Library**: Pre-built page templates for common patterns
3. **Clone Page**: Duplicate existing pages with modifications
4. **Batch Page Creation**: Create multiple related pages at once
5. **AI-Powered Content**: Generate page content from descriptions

## Files to Create

1. `deep-agents/deep_agents/agents/shared/it_specialists/0100_page_builder.py`
2. `client/src/pages/02050-information-technology/components/DevSettings/PageBuilder.jsx`
3. `server/src/routes/page-builder-routes.js`
4. `docs/agents/procedures/0100_PAGE_BUILDER_PROCEDURE.md`

## References

- [0000_PAGE_IMPLEMENTATION_PROCEDURE.md](../../procedures/human-workflows/0000_PAGE_IMPLEMENTATION_PROCEDURE.md)
- [0003_UI_ACCORDION_STANDARDS.md](../../standards/0003_UI_ACCORDION_STANDARDS.md)
- [0002_FILE_NAMING_STANDARDS.md](../../standards/0002_FILE_NAMING_STANDARDS.md)

---

**Status**: Planned
**Priority**: High
**Estimated Effort**: 4 weeks
**Target**: End of February 2026
