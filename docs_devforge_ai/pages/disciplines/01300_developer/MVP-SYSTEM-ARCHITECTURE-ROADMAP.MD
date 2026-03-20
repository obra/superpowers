# MVP System Architecture Roadmap - Procurement + Safety Focus

## Status
- [x] Initial draft created (2025-09-13)
- [ ] Technical review pending
- [ ] Implementation planning
- [ ] MVP execution

## Executive Summary

This document outlines the minimal viable product (MVP) roadmap for transforming the Scope of Work system from hardcoded content to a dynamic, database-driven architecture with role-based access control. The MVP focuses on procurement and safety disciplines while building scalable foundations for enterprise-wide expansion.

## 🎯 MVP Scope & Success Criteria

### **Primary Objectives**
- ✅ **Zero Hardcoded Content**: Eliminate hardcoded templates in SowTransferModal.js
- ✅ **Dynamic Template Loading**: Database-driven procurement templates
- ✅ **Role-Based Access Control**: Developer/IT Admin/IT User/End User permissions
- ✅ **Safety Prompt Management**: Dynamic safety analysis prompts
- ✅ **Production Deployment**: Working system in production environment

### **MVP Success Metrics**
- 📊 **Procurement**: 100% templates loaded from database
- 🔐 **Security**: Proper role-based access implemented
- ⚡ **Performance**: < 2 second template loading
- 🎯 **User Experience**: Intuitive prompt management interface
- 📈 **Scalability**: Architecture supports adding new disciplines

---

## 🏗️ MVP Architecture Overview

### **Core System Components**

#### **1. Enhanced Database Schema**
```sql
-- MVP Database Extensions (Week 1)
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) DEFAULT 'end_user';
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS discipline VARCHAR(50);
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS component_type VARCHAR(50) DEFAULT 'prompt';
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS mandatory BOOLEAN DEFAULT false;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS allowed_roles JSONB DEFAULT '["end_user"]';

-- Row Level Security for access control
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Role-based access" ON prompts FOR SELECT USING (...);
```

#### **2. Discipline-Specific Services**
```javascript
// client/src/common/js/services/disciplinePromptService.js
class DisciplinePromptService {
  async getProcurementTemplate(templateName, variables = {}) {
    return await this.getDisciplineTemplate('procurement', templateName, variables);
  }

  async getSafetyPrompt(promptName, context = {}) {
    return await this.getDisciplinePrompt('safety', promptName, context);
  }
}

// Role-based access control service
class RoleBasedPromptService {
  constructor(userRole) {
    this.userRole = userRole;
    this.permissions = ROLE_HIERARCHY[userRole];
  }

  async getAccessiblePrompts() {
    // Return prompts user can access based on role
  }
}
```

#### **3. Enhanced PromptsManagement UI**
```javascript
// Enhanced filtering and role-based access
function PromptsManagement() {
  const [userRole] = useState('it_admin'); // Would come from auth
  const [selectedDiscipline, setSelectedDiscipline] = useState('procurement');

  // Role-based filtering
  const accessiblePrompts = useMemo(() => {
    return filterPromptsByRole(prompts, userRole);
  }, [prompts, userRole]);

  return (
    <div>
      {/* Role indicator */}
      <UserRoleIndicator role={userRole} />

      {/* Discipline selector */}
      <DisciplineSelector value={selectedDiscipline} onChange={setSelectedDiscipline} />

      {/* Filtered prompt list */}
      <PromptList prompts={accessiblePrompts} userRole={userRole} />
    </div>
  );
}
```

---

## 📋 MVP Implementation Phases

### **Phase 1: Foundation (Week 1)**
- [x] ✅ Database schema enhancements
- [x] ✅ Role definitions and permissions
- [x] ✅ Basic service layer setup
- [x] ✅ Documentation updates

#### **Deliverables**
- ✅ Enhanced prompts table with role and discipline columns
- ✅ Row Level Security policies implemented
- ✅ Basic role hierarchy defined
- ✅ Core service classes created

### **Phase 2: Procurement Migration (Week 2)**
- [ ] ⏳ Extract hardcoded SowTransferModal templates
- [ ] ⏳ Create procurement database records
- [ ] ⏳ Refactor SowTransferModal to use dynamic templates
- [ ] ⏳ Implement template variable substitution

#### **Deliverables**
- ✅ SowTransferModal.js templates extracted and stored in database
- ✅ Dynamic procurement template loading working
- ✅ Company info and pricing configs database-driven
- ✅ All hardcoded procurement content eliminated

### **Phase 3: Safety Migration + UI (Week 3)**
- [ ] ⏳ Migrate safety modal prompts to database
- [ ] ⏳ Update safety components to use dynamic prompts
- [ ] ⏳ Enhance PromptsManagement UI with role filtering
- [ ] ⏳ Implement action-based permissions

#### **Deliverables**
- ✅ Safety analysis prompts database-driven
- ✅ UI shows prompts accessible to user role
- ✅ Edit/delete actions respect role permissions
- ✅ Discipline-specific filtering working

### **Phase 4: Testing & Deployment (Week 3-4)**
- [ ] ⏳ Comprehensive testing of role permissions
- [ ] ⏳ Performance optimization
- [ ] ⏳ Production deployment preparation
- [ ] ⯐ User acceptance testing

#### **Deliverables**
- ✅ Performance meets < 2 second requirement
- ✅ Security testing completed
- ✅ Production deployment successful
- ✅ User training completed

---

## 🎛️ Role-Based Access Control Implementation

### **User Role Hierarchy**
```javascript
const ROLE_HIERARCHY = {
  developer: {
    level: 4,
    canAccess: ['developer', 'it_admin', 'it_user', 'end_user'],
    canCreate: ['developer', 'it_admin', 'it_user', 'end_user'],
    canEdit: ['developer', 'it_admin', 'it_user', 'end_user'],
    canDelete: ['developer', 'it_admin', 'it_user', 'end_user']
  },
  it_admin: {
    level: 3,
    canAccess: ['it_admin', 'it_user', 'end_user'],
    canCreate: ['it_admin', 'it_user', 'end_user'],
    canEdit: ['it_admin', 'it_user', 'end_user'],
    canDelete: ['it_admin', 'it_user', 'end_user']
  },
  it_user: {
    level: 2,
    canAccess: ['it_user', 'end_user'],
    canCreate: ['it_user', 'end_user'],
    canEdit: ['it_user', 'end_user'],
    canDelete: [] // No delete permissions
  },
  end_user: {
    level: 1,
    canAccess: ['end_user'],
    canCreate: ['end_user'],
    canEdit: [], // Can only edit own prompts
    canDelete: [] // No delete permissions
  }
};
```

### **Access Control Examples**

#### **Developer Role**
- **Views**: All prompts across all disciplines
- **Creates**: Any type of prompt or template
- **Edits**: All prompts and system configurations
- **Deletes**: All prompts including system-critical ones

#### **IT Administrator Role**
- **Views**: IT and user-level prompts
- **Creates**: IT and user templates/prompts
- **Edits**: IT-managed prompts and configurations
- **Deletes**: IT-managed prompts (but not developer-level)

#### **IT User Role**
- **Views**: IT user and end-user prompts
- **Creates**: Limited user-level prompts
- **Edits**: Own prompts only
- **Deletes**: None

#### **End User Role**
- **Views**: End-user prompts only
- **Creates**: Personal user-level prompts
- **Edits**: Own prompts only
- **Deletes**: None

---

## 📊 Discipline-Specific Architecture

### **Procurement Discipline**
```javascript
const PROCUREMENT_CONFIG = {
  component_types: ['templates', 'configs', 'prompts'],
  default_access_level: 'it_user',
  allowed_roles: ['developer', 'it_admin', 'it_user', 'end_user'],
  templates: {
    'purchase_order_template': {
      variables: ['documentId', 'companyName', 'vendorName'],
      access_level: 'it_user'
    },
    'service_order_template': {
      variables: ['documentId', 'projectName'],
      access_level: 'it_user'
    }
  },
  configs: {
    'company_config': { access_level: 'it_admin' },
    'pricing_config': { access_level: 'it_admin' }
  }
};
```

### **Safety Discipline**
```javascript
const SAFETY_CONFIG = {
  component_types: ['prompts', 'templates'],
  default_access_level: 'end_user',
  allowed_roles: ['developer', 'it_admin', 'it_user', 'end_user'],
  prompts: {
    'image_analysis_prompt': {
      access_level: 'end_user',
      context: ['image_files', 'project_location']
    },
    'risk_assessment_prompt': {
      access_level: 'end_user',
      context: ['scenario_description', 'risk_categories']
    }
  }
};
```

---

## 🔄 Migration Strategy

### **Procurement Content Migration**
1. **Extract Hardcoded Templates**
   ```javascript
   const procurementTemplates = extractFromSowTransferModal();
   // Purchase Order, Service Order, Work Order HTML templates
   ```

2. **Create Database Records**
   ```sql
   INSERT INTO prompts (name, type, category, discipline, component_type, content, access_level)
   VALUES
   ('procurement_purchase_order_template', 'document', 'procurement', 'procurement', 'template', $htmlContent, 'it_user'),
   ('procurement_company_config', 'config', 'procurement', 'procurement', 'config', $jsonConfig, 'it_admin');
   ```

3. **Refactor Source Code**
   ```javascript
   // BEFORE (hardcoded)
   const html = `<!DOCTYPE html><html><head>...`;
   
   // AFTER (dynamic)
   const html = await procurementService.getProcurementTemplate('purchase_order_template', variables);
   ```

### **Safety Content Migration**
1. **Extract Modal Prompts**
   ```javascript
   const safetyPrompts = extractFromSafetyModals();
   // Image analysis, risk assessment, video analysis prompts
   ```

2. **Database Migration**
   ```sql
   INSERT INTO prompts (name, type, category, discipline, component_type, content, access_level)
   VALUES
   ('safety_image_analysis_prompt', 'analysis', 'safety', 'safety', 'prompt', $promptContent, 'end_user');
   ```

3. **Component Updates**
   ```javascript
   // Update safety modals to use dynamic prompts
   const prompt = await safetyService.getSafetyPrompt('image_analysis_prompt');
   ```

---

## 📈 Post-MVP Expansion Roadmap

### **Phase 5: Contracts Discipline (Future)**
- Migrate contracts analysis and correspondence prompts
- Add document templates for contract management
- Implement approval workflow prompts

### **Phase 6: HR Discipline (Future)**
- Migrate recruitment and evaluation prompts
- Add HR document templates
- Implement compliance and policy prompts

### **Phase 7: Advanced Features (Future)**
- Multi-step workflow prompts
- Conditional prompt execution
- Organization-specific prompt overrides
- Advanced audit trails and versioning

---

## ✅ Success Metrics & Validation

### **Technical Success**
- [ ] Database queries < 2 seconds
- [ ] Role-based filtering working correctly
- [ ] Template variable substitution functioning
- [ ] No hardcoded content in target components

### **Security Success**
- [ ] Row Level Security policies enforced
- [ ] Role permissions correctly implemented
- [ ] Audit logging capturing all operations
- [ ] No privilege escalation vulnerabilities

### **Business Success**
- [ ] Procurement templates load dynamically
- [ ] Safety prompts managed through UI
- [ ] User roles appropriately restricted
- [ ] System performance meets requirements

---

## 🚀 MVP Timeline Summary

| Week | Phase | Focus | Deliverables |
|------|-------|-------|--------------|
| 1 | Foundation | Database schema, role definitions, core services | ✅ **COMPLETED** |
| 2 | Procurement | SowTransferModal migration, template extraction | 🔄 **IN PROGRESS** |
| 3 | Safety + UI | Safety prompts migration, UI enhancements | ⏳ **PLANNED** |
| 3-4 | Testing & Deploy | Performance optimization, production deployment | ⏳ **PLANNED** |

### **Current Status: Phase 1 Complete, Phase 2 In Progress**
- ✅ Database schema enhanced
- ✅ Documentation updated
- ✅ Architecture designed
- 🔄 Procurement migration started

---

## 📋 Implementation Checklist

### **Foundation (✅ COMPLETED)**
- [x] Enhanced database schema with role/discipline columns
- [x] Row Level Security policies implemented
- [x] Role hierarchy and permissions defined
- [x] Core service classes created
- [x] Documentation updated with new architecture

### **Procurement Migration (🔄 IN PROGRESS)**
- [x] SowTransferModal template extraction identified
- [ ] Database migration scripts created
- [ ] Template loading service implemented
- [ ] Variable substitution logic working
- [ ] Fallback mechanisms in place

### **Safety Migration (⏳ PLANNED)**
- [ ] Safety modal prompts extracted
- [ ] Safety prompts database migration
- [ ] Safety components updated
- [ ] Role-based safety prompt filtering

### **UI Enhancements (⏳ PLANNED)**
- [ ] Role filtering in PromptsManagement UI
- [ ] Discipline-specific tabs
- [ ] Action-based permissions
- [ ] User role indicators

### **Testing & Deployment (⏳ PLANNED)**
- [ ] Unit tests for role permissions
- [ ] Integration tests for template loading
- [ ] Performance testing
- [ ] Security testing
- [ ] Production deployment

---

## 🔧 Technical Implementation Details

### **Key Files to Modify/Create**

#### **New Service Files**
- `client/src/common/js/services/disciplinePromptService.js`
- `client/src/common/js/services/roleBasedPromptService.js`
- `client/src/common/js/services/componentRegistryService.js`

#### **Enhanced Components**
- `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`
- `client/src/pages/01900-procurement/components/modals/01900-SowTransferModal.js`
- `client/src/pages/02400-safety/components/modals/02400-SafetyImageAnalysisModal.js`

#### **Database Scripts**
- `sql/mvp_prompt_schema_enhancements.sql`
- `sql/procurement_template_migration.sql`
- `sql/safety_prompt_migration.sql`

### **API Endpoints**
```javascript
// Enhanced prompt endpoints for MVP
GET  /api/prompts/discipline/:discipline
GET  /api/prompts/role-access/:userRole
POST /api/prompts/validate-access
```

---

## 🎯 Conclusion

This MVP roadmap provides a focused, achievable path to transform the hardcoded "magic wand" system into a dynamic, secure, and scalable architecture. By focusing on procurement and safety disciplines while building enterprise-ready foundations, the MVP delivers immediate value while enabling future system-wide expansion.

**The architecture ensures:**
- **Security**: Role-based access control prevents unauthorized access
- **Scalability**: Component-based design supports adding new disciplines
- **Performance**: Optimized database queries and caching
- **Maintainability**: Centralized prompt management through UI
- **Compliance**: Complete audit trails for regulatory requirements

**Status**: Phase 1 complete, ready to proceed with procurement migration implementation.
