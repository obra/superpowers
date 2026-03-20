# Scope of Work (SOW) Generation - Template Integration Plan

## 📋 **How the SOW Creation Wizard Modifies Templates for User Categories**

### **🐵 Stage 1: Draft Creation (`draft` step)**
**Purpose:** Creates the basic SOW structure with user inputs before AI processing.

**Key Functionality:**
- User provides title, description, scope type, target completion date, and basic requirements
- Captures foundational data that the AI will build upon
- Displays current template and category selection context
- Includes field protection settings that prevent certain fields from being modified

### **📄 Stage 2: Additional Context (`additional_context` step)**
**Purpose:** Gathers supplementary information to enhance AI generation context.

**Key Functionality:**
- Upload reference documents (PDF, Word, Excel, Text, CSV)
- Add reference URLs for external specifications
- Provide additional context in free-form text
- Include project specifications, compliance requirements, and additional background
- All contextual data is passed to the AI along with the draft description

### **🤖 Stage 3: AI Enhancement (`content` step) - The Core Modification Process**
**Purpose:** Uses AI to transform the template content to match user's selected category/sub-category.

## 🔧 **How AI Enhancement Modifies Templates**

The `scopeOfWorkGenerationService.generateScopeOfWork()` method handles the core template modification:

### **Template Processing Instructions:**
When a user selects a different category/sub-category than what the template was originally designed for, the service includes a **"TEMPLATE PROCESSING INSTRUCTIONS"** section in the AI prompt that:

1. **Provides the Original Template Content:** Full template content is included in the prompt
2. **Applies Template Adaptation Rules:**
   ```javascript
   // Template adaptation directives
   - Replace domain-specific terms with those appropriate for selected category/sub-category
   - Adapt examples and specifications to new procurement context
   - Preserve template's professional structure and formatting
   - Maintain procurement terminology and tone
   ```

3. **Field Protection Integration:**
   ```javascript
   // Reads templateProtectionSettings to know which fields are:
   - Read-only (preserve exactly as in template)
   - Editable (adapt content for new category)
   - AI-generated (replace completely with fresh content)
   ```

### **Category-Specific Content Adaptation**
The AI prompt includes comprehensive **"CATEGORY-SPECIFIC DIRECTIVES"** that modify the content based on:
- Industrial Equipment (B category): Safety certifications, maintenance requirements
- Industrial Supplies (C category): Product specifications, quality parameters
- Engineering Services (J/K/L/M categories): Qualifications, performance clauses

## ✅ **Confirmation: Template Modification Process**

**Yes, the three steps collectively ensure templates are modified to suit user-selected categories/sub-categories:**

1. **Draft Creation** provides the context and data points that need adaptation
2. **Additional Context** supplies specialized information for category-specific requirements
3. **AI Enhancement** actively modifies the template content through:
   - **Template Processing Instructions** that explicitly tell the AI to change category-specific terminology
   - **Category Context Integration** that includes details of the selected category for informed generation
   - **Field-Level Adaptation** respecting protection rules while modifying content for new contexts
   - **Comprehensive Prompting** that includes original template + adaptation rules + user context

The system is specifically designed to handle the scenario where template categories differ from user selections, using AI-powered content transformation to reconcile these differences.

## 📊 **Prompt Storage in Supabase with Categories/Tags**

The system stores AI prompts in a **`prompts`** table with the following schema:

```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT, -- 'analysis', 'document', 'template', etc.
  category TEXT,
  tags TEXT[] DEFAULT '{}',    -- Array of tags for searching
  pages_used TEXT[] DEFAULT '{}', -- Pages where prompt is used
  role_type TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  -- Other metadata fields...
);
```

### **Category and Tag Assignment:**
- **Category Field:** Discipline-based categories like "Agent, HR", "Document, Procurement"
- **Tags Array:** Content-based tags like `["sow", "technical_specifications", "procurement"]`
- **67 total prompts** with true multi-category support
- **11 disciplines** represented across 27 actively used agent prompts

### **Prompt Resolution:**
The service calls prompts via `/api/prompts` with filtering like:
```javascript
/api/prompts?category=document&type=document
```

---

## 🎯 Project Overview

**Status:** 📋 **PLANNING PHASE - DETAILED ANALYSIS COMPLETE**

Enhance the SOW Creation Wizard to properly handle procurement templates with field classification:
- **Read-only fields**: Preserve template content exactly as-is
- **AI-generated fields**: Allow complete replacement by AI generation
- **Editable fields**: Enhance existing template content to fit new category/sub-category

## 📋 Current Implementation Analysis

**Status:** ✅ **ANALYSIS COMPLETE**

### Template Selection & Protection ✅ IMPLEMENTED
- Templates selected in wizard with `field_protection` settings
- Field types: `read-only`, `AI-generated`, `editable`
- UI enforces protection (disabled/locked input fields)
- Protection checked via `isFieldProtected(fieldName)` function

### AI Generation Process ⚠️ PARTIALLY IMPLEMENTED
- `ContentGenerationStep` calls `onGenerate()` callback from modal
- `scopeOfWorkGenerationService.generateScopeOfWork()` handles generation
- `_buildGenerationPrompt()` creates AI prompts - **CURRENTLY IGNORES TEMPLATES**
- **❌ MISSING**: Template content used as base for generation vs. starting from scratch

### Field Protection Data Structure ✅ UNDERSTOOD
- Templates have `field_protection` object mapping field IDs to rules
- Each field has protection type (`read-only`, `ai-generated`, `editable`) and reason
- UI enforces via `field_protection` object lookups

### Discipline Tracking Integration ✅ RECENTLY IMPLEMENTED
- **NEW**: SOW table now includes `discipline_id` foreign key to track which discipline created each SOW
- Automatically assigns Procurement discipline (01900) to all existing and new SOW records
- Supports distinguishing SOW origin: procurement, civil engineering, etc.

## 🛠️ Implementation Plan

**Status:** 📝 **READY FOR EXECUTION**

### Phase 1: Core Template Integration

#### 🎯 **Objective**: Integrate template content into AI generation process

**🔧 Technical Changes Required:**

```javascript
// In scopeOfWorkGenerationService.js:
// 1. Modify generateScopeOfWork() to accept template parameters
// 2. Update _buildGenerationPrompt() to include template content context
// 3. Add template field processing instructions in AI prompt

// In ScopeOfWorkModal.js:
// 1. Pass selectedTemplate.content and selectedTemplate.field_protection to generation service
// 2. Ensure template data flows through to AI generation
```

**📊 Detailed Implementation:**

1. **Modify Generation Parameters:**
   ```javascript
   // Add to generationParams in modal:
   templateContent: selectedTemplate?.template_content || selectedTemplate?.content,
   fieldProtection: selectedTemplate?.field_protection,
   category: selectedCategory,
   subcategory: selectedSubCategory
   ```

2. **Enhance AI Prompt Structure:**
   ```javascript
   _buildGenerationPrompt(params) {
     const {
       templateContent,
       fieldProtection,
       category,
       subcategory,
       // ... existing params
     } = params;

     // Add new section: TEMPLATE FIELD PROCESSING CONTEXT
     const templateSection = this._buildTemplateProcessingInstructions(
       templateContent,
       fieldProtection,
       category,
       subcategory
     );
   }
   ```

3. **Template Processing Instructions:**
   ```javascript
   _buildTemplateProcessingInstructions(templateContent, fieldProtection, category, subcategory) {
     if (!templateContent) return "";

     return `
TEMPLATE CONTENT BASE & FIELD PROCESSING RULES:

BASE TEMPLATE CONTENT:
${templateContent}

FIELD PROCESSING INSTRUCTIONS:
- READ-ONLY FIELDS: Preserve content exactly as it appears in the template
- AI-GENERATED FIELDS: Replace completely with new generated content
- EDITABLE FIELDS: Enhance and adapt existing template content to fit category="${category}" and sub-category="${subcategory}"

SPECIFIC FIELD RULES:
${Object.entries(fieldProtection || {}).map(([fieldId, rules]) =>
  `- ${fieldId}: ${rules.protectionType} (${rules.protectionReason})`
).join('\n')}

ADAPTATION REQUIREMENTS:
Adapt all editable content to be specific to procurement category "${category}" and sub-category "${subcategory}".
Modify references from any previous categories (e.g., change from "lubricant" to current category).
Ensure all content remains appropriate for scope of work generation.
`;
}
```

### Phase 2: Template Adaptation Logic

#### 🎯 **Objective**: Ensure templates adapt properly to new procurement categories

**🔧 Key Changes:**

1. **Template Variable Processing:**
   ```javascript
   _processTemplateVariables(templateContent, category, subcategory) {
     return templateContent
       .replace(/\{\{CATEGORY\}\}/g, category)
       .replace(/\{\{SUBCATEGORY\}\}/g, subcategory)
       .replace(/\{\{CATEGORY_DISPLAY\}\}/g, this._getCategoryDisplayName(category))
       .replace(/lubricant|lubricants/gi, this._getCategoryEquivalent(category));
   }
   ```

2. **Content Enhancement Instructions:**
   ```javascript
   TEMPLATE ENHANCEMENT GUIDELINES:
   - Expand generic descriptions with category-specific details
   - Update industry references to match current category
   - Adapt compliance requirements for category-specific regulations
   - Include industry-standard terminology for ${category}
   - Maintain professional procurement language throughout
   ```

### Phase 3: Field Protection Integration

#### 🎯 **Objective**: Properly handle field-level protection during generation

**🔧 Implementation:**

1. **Field Processing Metadata:**
   ```javascript
   const fieldProcessingMetadata = {
     readOnlyFields: [],
     aiGeneratedFields: [],
     editableFields: []
   };

   Object.entries(fieldProtection).forEach(([fieldId, rules]) => {
     switch(rules.protectionType) {
       case 'read-only': fieldProcessingMetadata.readOnlyFields.push(fieldId); break;
       case 'ai-generated': fieldProcessingMetadata.aiGeneratedFields.push(fieldId); break;
       case 'editable': fieldProcessingMetadata.editableFields.push(fieldId); break;
     }
   });
   ```

2. **AI Instructions Enhancement:**
   ```javascript
   // Add to prompt:
   IMPORTANT FIELD PROTECTION RULES:
   - NEVER modify content in these fields: ${readOnlyFields.join(', ')}
   - COMPLETELY replace these fields with fresh content: ${aiGeneratedFields.join(', ')}
   - ENHANCE these existing fields while preserving structure: ${editableFields.join(', ')}
   ```

### Phase 4: Testing & Validation

#### 🎯 **Objective**: Ensure template integration works correctly

**🧪 Testing Scenarios:**

1. **Template Selection & Loading:**
   - ✅ Templates load with `field_protection` settings
   - ✅ Template content is passed to generation service
   - ✅ Field protection rules are applied

2. **Template Adaptation:**
   - ✅ Read-only fields preserved exactly
   - ✅ AI-generated fields replaced completely
   - ✅ Editable fields enhanced appropriately
   - ✅ Category/sub-category adaptation works

3. **Category-Specific Validation:**
   - ✅ Templates adapt from original category (lubricants) to new categories
   - ✅ Procurement terminology used consistently
   - ✅ Compliance requirements match target category

## 🚨 Known Issues & Dependencies

**Status:** ⚠️ **REQUIRES ATTENTION**

### Issue 1: Template Content Structure
**Location:** `procurement_templates` table
**Problem:** Need to verify `template_content` and `field_protection` column structure
**Impact:** Cannot implement without proper data structure
**Solution:** Verify with existing template data before implementation

### Issue 2: Field Mapping Confusion
**Location:** AI generation prompt interpretation
**Problem:** AI may misunderstand which content belongs to which "field"
**Impact:** Incorrect field processing
**Solution:** Clear field demarcation in template content and prompt instructions

### Issue 3: Category Adaptation Logic
**Location:** Template variable replacement
**Problem:** Generic adaptation may not be category-specific enough
**Impact:** Poor template adaptation quality
**Solution:** Add category-specific adaptation rules

## 📊 Success Metrics

**Status:** 🎯 **DEFINED**

- ✅ **Template Content Integration**: Templates used as starting points vs. scratch generation
- ✅ **Field Protection Compliance**: Read-only preserved, AI-generated replaced, editable enhanced
- ✅ **Category Adaptation**: Templates properly adapt to target procurement categories
- ✅ **User Experience**: Wizard provides better SOW outcomes with less manual effort
- ✅ **Data Integrity**: No loss of template content or protection rules

## 📝 Implementation Timeline

**Status:** 📅 **ESTIMATED**

### Week 1: Core Integration
- [ ] **Day 1-2**: Modify `scopeOfWorkGenerationService.js` to accept template parameters
- [ ] **Day 3**: Update `_buildGenerationPrompt()` with template processing sections
- [ ] **Day 4-5**: Implement field protection handling in AI instructions

### Week 2: Template Adaptation
- [ ] **Day 6-7**: Add category-specific template adaptation logic
- [ ] **Day 8**: Improve template variable processing for procurement context
- [ ] **Day 9-10**: Testing template adaptation across different categories

### Week 3: Testing & Refinement
- [ ] **Day 11-12**: End-to-end testing with various template-field combinations
- [ ] **Day 13**: Performance optimization and edge case handling
- [ ] **Day 14-15**: User acceptance testing and documentation

## 🔗 Related Files & Dependencies

**Status:** 📋 **MAPPED**

### Core Implementation Files:
```javascript
// Primary files to modify:
- client/src/services/scopeOfWorkGenerationService.js          // Core AI generation logic
- client/src/pages/01900-procurement/components/modals/01900-ScopeOfWorkModal.js  // Parameter passing
- client/src/pages/01900-procurement/components/modals/ContentGenerationStep.jsx // UI integration
```

### Supporting Files:
```javascript
// Template handling:
- client/src/services/TemplateSelectorService.js               // Template loading (read-only)
- client/src/services/procurementTemplateService.js            // Template operations

// Data structure verification:
- docs/1300_01300_GOVERNANCE_PAGE.md                           // Template structure reference
- server/src/routes/procurement-template-routes.js             // API endpoints

// Discipline tracking integration:
- sql/create-scope-of-work-table.sql                          // Updated SOW table with discipline_id
- sql/migrate-scope-of-work-assign-procurement-discipline.sql // Migration to assign existing records to procurement
- client/src/pages/01900-procurement/components/modals/01900-ScopeOfWorkModal.js // Now includes discipline_id for new SOWs
- recreate_discipline_record.sql                               // Discipline table management
```

### Test Files:
```javascript
// Validation scripts:
- verify_sow_template_integration.js                           // Integration testing
- analyze_template_schema_consistency.cjs                      // Schema validation
```

## ⚡ Implementation Priority

**Status:** 🚨 **CRITICAL - REQUIRED FOR SOW WORKFLOW**

**Business Impact:**
- HIGH: SOW creation workflow currently incomplete without template integration
- Users cannot leverage existing procurement templates during SOW generation
- Manual template adaptation required, reducing efficiency

**Technical Risk:**
- MEDIUM: Requires understanding of template data structures and AI prompt engineering
- Well-defined interfaces reduce integration complexity

**Dependencies:**
- procurement_templates table must have consistent template_content and field_protection data
- Template selection and field protection UI must be functional (✅ already implemented)

---

**📋 Current Status:** Ready for implementation

**🛠️ Next Steps:**
1. Begin implementation in `scopeOfWorkGenerationService.js`
2. Update modal parameter passing
3. Test with existing template data
4. Validate category adaptation logic

**👥 Stakeholders:**
- Procurement team: Template functionality validation
- Development team: Code review and testing
- QA team: End-to-end testing and user acceptance

**📞 Support Contacts:**
- Technical: Development team
- Functional: Procurement business analysts
- Testing: QA automation team
