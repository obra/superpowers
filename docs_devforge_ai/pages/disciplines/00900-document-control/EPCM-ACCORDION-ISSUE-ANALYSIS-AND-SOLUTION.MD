# EPCM Accordion Issue - Root Cause Analysis and Solution

## Issue Summary
EPCM-related buttons are not appearing in the accordion despite the EPCM organization being properly configured and having 78 pages in the database.

## Root Cause Analysis

### 1. **Data Flow Issue**
The problem lies in the disconnect between how the UI expects sections to be structured and how the database stores page information.

### 2. **Key Findings from Investigation**

#### Organizations in Database:
- ✅ EPCM Organization exists: `90cd635a-380f-4586-a3b7-a09103b6df94`
- ✅ Name: "Organisations - EPCM"
- ✅ Active: true
- ✅ Sector: "Engineering Procurement Construction Management"

#### Pages in Database:
- ✅ 78 EPCM pages exist in the database
- ✅ Pages have proper structure: `page_name`, `page_slug`, `organization_id`, etc.
- ❌ **CRITICAL**: Pages lack `section` and `subsection` information
- ❌ **CRITICAL**: No mapping between pages and accordion sections

#### Current UI Display Mappings:
- ✅ Contains shared/core sections (Home, Document Control, IT, Settings)
- ❌ **MISSING**: EPCM-specific sections
- ❌ **MISSING**: Database-driven section loading

### 3. **The Missing Link**
The UI display settings manager expects sections to be defined in the static mappings file, but EPCM sections should be dynamically loaded from the database based on the pages table.

## Current Architecture Problems

### 1. **Static vs Dynamic Content**
```javascript
// Current: Static mappings only
export const sectionMappings = {
  'accordion-home': { /* static config */ },
  'accordion-document-control': { /* static config */ },
  // Missing: Dynamic sections from database
};
```

### 2. **Missing Section-Page Relationship**
The pages table has:
- `page_name`: "Procurement", "Health", "Environmental", etc.
- `organization_id`: Links to EPCM organization
- **MISSING**: `section` field to group pages into accordion sections
- **MISSING**: `subsection` field for hierarchical organization

### 3. **UI Settings Manager Gap**
The `UIDisplaySettingsManager` only processes static mappings and doesn't:
- Query the database for organization-specific pages
- Group pages into logical sections
- Create dynamic accordion structure

## Solution Implementation

### Phase 1: Database Schema Enhancement

#### 1.1 Add Section Fields to Pages Table
```sql
-- Add section and subsection columns to pages table
ALTER TABLE pages 
ADD COLUMN section VARCHAR(100),
ADD COLUMN subsection VARCHAR(100),
ADD COLUMN section_order INTEGER DEFAULT 0,
ADD COLUMN subsection_order INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX idx_pages_section ON pages(section);
CREATE INDEX idx_pages_organization_section ON pages(organization_id, section);
```

#### 1.2 Populate EPCM Pages with Section Information
```sql
-- Group EPCM pages into logical sections
UPDATE pages 
SET section = 'Construction Management',
    section_order = 100
WHERE organization_id = '90cd635a-380f-4586-a3b7-a09103b6df94'
  AND page_name IN ('Procurement', 'Design', 'Construction');

UPDATE pages 
SET section = 'Health & Safety',
    section_order = 200
WHERE organization_id = '90cd635a-380f-4586-a3b7-a09103b6df94'
  AND page_name IN ('Health', 'Environmental');

UPDATE pages 
SET section = 'Administration',
    section_order = 300
WHERE organization_id = '90cd635a-380f-4586-a3b7-a09103b6df94'
  AND page_name IN ('Document Control', 'Email Management', 'Legal');

UPDATE pages 
SET section = 'Leadership',
    section_order = 400
WHERE organization_id = '90cd635a-380f-4586-a3b7-a09103b6df94'
  AND page_name IN ('Directors');
```

### Phase 2: Enhanced UI Settings Manager

#### 2.1 Create Database-Driven Section Loader
```javascript
// Add to UIDisplaySettingsManager
async fetchOrganizationSections(organizationId) {
  try {
    const response = await fetch(`/api/pages/sections/${organizationId}`);
    const data = await response.json();
    return this.transformPagesToSections(data.pages);
  } catch (error) {
    console.error('Error fetching organization sections:', error);
    return [];
  }
}

transformPagesToSections(pages) {
  const sections = {};
  
  pages.forEach(page => {
    if (!page.section) return;
    
    const sectionId = `accordion-${slugify(page.section)}`;
    
    if (!sections[sectionId]) {
      sections[sectionId] = {
        title: page.section,
        optionId: page.section_order || 1000,
        order: page.section_order || 1000,
        sector: 'epcm',
        allowedOrganizations: [page.organization_id],
        links: [],
        subsections: {}
      };
    }
    
    // Add page to section
    sections[sectionId].links.push({
      url: page.page_slug,
      title: page.page_name
    });
    
    // Handle subsections if needed
    if (page.subsection) {
      const subsectionId = `accordion-${slugify(page.subsection)}`;
      if (!sections[sectionId].subsections[subsectionId]) {
        sections[sectionId].subsections[subsectionId] = {
          title: page.subsection,
          optionId: page.subsection_order || 1001,
          order: page.subsection_order || 1001,
          links: []
        };
      }
      sections[sectionId].subsections[subsectionId].links.push({
        url: page.page_slug,
        title: page.page_name
      });
    }
  });
  
  return sections;
}
```

#### 2.2 Update getAccordionSections Method
```javascript
async getAccordionSections() {
  console.log('🔍 [UIDisplaySettingsManager] Getting accordion sections');
  
  // Get static sections
  const staticSections = [];
  for (const [key, section] of Object.entries(this.sectionMappings)) {
    if (this.isVisible(section)) {
      staticSections.push({
        id: key,
        ...section,
        subsections: this.processSubsections(section.subsections),
      });
    }
  }
  
  // Get dynamic sections for active organization
  const activeOrg = organizationConfig.getActiveOrganization();
  const dynamicSections = [];
  
  if (activeOrg && activeOrg.length > 0) {
    for (const org of activeOrg) {
      const orgSections = await this.fetchOrganizationSections(org.organization_id);
      dynamicSections.push(...Object.values(orgSections));
    }
  }
  
  // Combine and sort sections
  const allSections = [...staticSections, ...dynamicSections];
  const sortedSections = allSections.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  console.log('✅ [UIDisplaySettingsManager] Processed sections:', 
    sortedSections.map((s) => s.title));
  
  return sortedSections;
}
```

### Phase 3: Server-Side API Enhancement

#### 3.1 Create Organization Sections Endpoint
```javascript
// Add to server/src/routes/organizations.js
router.get('/:id/sections', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseServerClient(req);
    
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('organization_id', id)
      .not('section', 'is', null)
      .order('section_order, subsection_order, page_name');
    
    if (error) {
      console.error('Error fetching organization sections:', error);
      return res.status(500).json({ error: 'Failed to fetch sections' });
    }
    
    res.json({ pages: data || [] });
  } catch (error) {
    console.error('Error in organization sections endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Phase 4: Organization Config Enhancement

#### 4.1 Fix Organization ID Mismatch
The investigation revealed a mismatch in organization IDs:
- Database organization ID: `90cd635a-380f-4586-a3b7-a09103b6df94`
- Pages reference different organization ID: `3cb504bb-0699-44a7-b0f3-6771e7efab3a`

```sql
-- Fix organization ID mismatch
UPDATE pages 
SET organization_id = '90cd635a-380f-4586-a3b7-a09103b6df94'
WHERE organisation_id = '90cd635a-380f-4586-a3b7-a09103b6df94';
```

#### 4.2 Update Organization Config
```javascript
// Update client/src/common/js/config/00200-organization-config.js
// Ensure EPCM organization uses correct ID
{
  organization_id: '90cd635a-380f-4586-a3b7-a09103b6df94',
  organization_name: 'Organizations - EPCM',
  is_active: true,
  sector_id: 'd823e44c-844b-4a2e-9b10-9356d497dc2b',
  is_template: false
}
```

## Implementation Steps

### Step 1: Database Updates
1. Run the SQL commands to add section columns
2. Populate EPCM pages with section information
3. Fix organization ID mismatches

### Step 2: Server-Side Changes
1. Add organization sections API endpoint
2. Update organizations controller
3. Test API endpoints

### Step 3: Client-Side Changes
1. Update UIDisplaySettingsManager with database-driven section loading
2. Modify getAccordionSections to combine static and dynamic sections
3. Update organization config with correct IDs

### Step 4: Testing
1. Test EPCM organization selection
2. Verify accordion sections appear
3. Test section filtering and navigation

## Expected Outcome

After implementation:
1. ✅ EPCM organization will have dynamic accordion sections
2. ✅ Sections will be: "Construction Management", "Health & Safety", "Administration", "Leadership"
3. ✅ Each section will contain relevant EPCM pages
4. ✅ Accordion will update when switching between organizations
5. ✅ Static sections (Home, IT, etc.) will still work for all organizations

## Files to Modify

### Database
- `pages` table schema
- EPCM pages data

### Server
- `server/src/routes/organizations.js`
- `server/src/controllers/organizations.js`

### Client
- `client/src/common/js/config/00200-ui-display-settings.js`
- `client/src/common/js/config/00200-organization-config.js`
- `client/src/modules/accordion/00200-accordion-component.js` (if needed)

This solution addresses the root cause by creating a proper bridge between the database pages and the UI accordion structure, enabling dynamic section loading based on organization selection.
