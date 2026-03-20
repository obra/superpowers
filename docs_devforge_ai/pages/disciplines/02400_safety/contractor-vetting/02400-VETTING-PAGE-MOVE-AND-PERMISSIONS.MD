# 1300_02400_VETTING_PAGE_MOVE_AND_PERMISSIONS.md

## Contractor Vetting Page Relocation and User Permissions Implementation

**Owner:** System Architect
**Date:** October 2025
**Review Cycle:** Monthly
**Status:** Implementation Planning Complete

---

## 🎯 Executive Summary

This document outlines the comprehensive plan to implement Contractor Vetting functionality as a discipline-specific feature accessible through each department's accordion section, with safety maintaining central coordination while enabling cross-disciplinary access with appropriate restrictions.

**Key Objectives:**
- Create discipline-specific accordion access points for vetting functionality
- Implement company affiliation-based dropdown filtering across all disciplines
- Add discipline-based tab access restrictions (safety gets full access, others get limited views)
- Filter evaluation results by project access rights and user permissions
- Enable multiple disciplines to access vetting while maintaining safety as the authoritative controller
- Keep centralized vetting system at `/02400-safety` with distributed access points

---

## 📋 Current System Analysis

### Discipline Form Compilation Workflow
**Internal disciplines FIRST compile evaluation forms/questions before contractors complete them:**

**Discipline Form-Building Phase:**
- **Safety Team**: Creates HSSE questionnaires (91 questions), safety checklists, hazard assessments
- **Finance Team**: Compiles financial requirements, bonding criteria, credit evaluations
- **Procurement Team**: Builds performance history requirements, compliance matrices, capability assessments
- **Operations Team**: Creates operational safety protocols, equipment certifications
- **Quality Team**: Develops quality control standards, inspection protocols
- **Construction Team**: Builds site-specific safety requirements, method statements
- **Contracts Team**: Compiles contract compliance requirements, legal documentation needs
- **Project Controls Team**: Develops project management evaluation criteria, scheduling requirements

**Then Contractors Complete Pre-Compiled Forms:**

**The 01850 "Other Parties" section serves as the contractor response point** where external contractors:

- **Receive pre-compiled evaluation forms** from multiple disciplines
- **Provide company information and complete tailored questionnaires**
- **Answer discipline-specific evaluation criteria** (HSSE safety questions, financial documentation, etc.)
- **Upload required supporting documents** (licenses, certifications, policies, financial statements)
- **Respond to specific requirements** set by each discipline's evaluation team
- **Track completion status** across all compiled evaluation forms

**Complete Vetting Workflow:**
1. **Discipline Compilation** - Each discipline creates their evaluation requirements via their accordion access
2. **Form Assembly** - System combines all discipline requirements into contractor-specific package and stores templates in discipline-specific Supabase tables for reusability and standardization

#### **📚 Discipline-Specific Template Storage & Functionality Architecture**

### **How The Vetting System Functions:**

**1. Template Creation Phase - Discipline Experts Build Evaluation Frameworks**
Each discipline team creates standardized evaluation templates that become the foundation for contractor assessments:

| **Status** | **Discipline** | **Template Table Name** | **Results Table Name** | **Functionality** |
|------------|----------------|------------------------|----------------------|-------------------|
| ✅ **Exists** | **Procurement** | `procurement_templates` | `procurement_evaluation_results` | • Performance history templates<br>• Compliance matrices<br>• Capability assessment forms<br>• Procurement-specific questionnaires<br>• Templates copied to results for processing |
| 🚧 **To Create** | **Safety** | `safety_evaluation_templates` | `safety_evaluation_results` | • HSSE questionnaires (91 questions)<br>• Safety checklists<br>• Hazard assessment protocols<br>• Templates copied to results table for scoring |
| 🚧 **To Create** | **Finance** | `finance_evaluation_templates` | `finance_evaluation_results` | • Financial requirements templates<br>• Bonding criteria forms<br>• Credit evaluation checklists<br>• Results table contains scoring/analysis |
| 🚧 **To Create** | **Operations** | `operations_evaluation_templates` | `operations_evaluation_results` | • Operational safety protocols<br>• Equipment certification checklists<br>• Operational compliance assessments in results |
| 🚧 **To Create** | **Quality** | `quality_evaluation_templates` | `quality_evaluation_results` | • Quality control standards<br>• Inspection protocols<br>• Assurance criteria evaluations stored in results |
| 🚧 **To Create** | **Construction** | `construction_evaluation_templates` | `construction_evaluation_results` | • Site-specific safety requirements<br>• Method statement templates<br>• Construction compliance scoring in results |
| 🚧 **To Create** | **Contracts** | `contracts_evaluation_templates` | `contracts_evaluation_results` | • Contract compliance requirements<br>• Legal documentation templates<br>• Contract terms verification in results |
| 🚧 **To Create** | **Project Controls** | `project_controls_evaluation_templates` | `project_controls_evaluation_results` | • Project management criteria<br>• Resource scheduling requirements<br>• Project control compliance results |

**Template Functionality:**
- **🔧 Building Tools**: Disciplines create reusable evaluation frameworks (questions, requirements, scoring criteria)
- **📝 Structured Content**: Each template contains JSON-defined evaluation structures specific to discipline expertise
- **🔄 Version Control**: Templates support versioning for updates while maintaining audit trails
- **📂 Organization**: Templates organized by discipline, type, and evaluation category

**2. Accordion-Based Vetting Access - Discipline-Specific Entry Points**
Internal users access vetting through their discipline's accordion sections, automatically loading their authorized templates:

```javascript
// Example: Finance team accessing vetting
const accessPath = '/finance';  // finance accordion section
const templates = await supabase.from('finance_evaluation_templates').select('*');

// Finance team sees:
// - Details tab (company info)
// - Financial tab (bonding, credit analysis, fiscal health)
// Templates loaded from finance_evaluation_templates table
```

**3. Template Assembly & Distribution - Creating Contractor Packages**
The system assembles discipline-appropriate evaluation packages for specific contractors:

```javascript
// Automated template selection based on contractor profile
const contractorRequirements = await calculateContractorRequirements(contractor);
const templates = await assembleDisciplineTemplates(contractorRequirements);

// Result: Combined evaluation package containing:
// - Safety: HSSE questionnaire from safety_evaluation_templates
// - Finance: Financial assessment from finance_evaluation_templates
// - Operations: Safety protocols from operations_evaluation_templates
// Generated contractor-specific evaluation package
```

**4. Contractor Completion Interface - External Access Through 01850**
Contractors receive pre-compiled evaluation packages and complete them:

```javascript
// Contractor access flow at /other-parties (01850)
const contractorAccess = {
  evaluationPackage: await loadContractorPackage(inviteToken),
  // Package contains all required discipline evaluations
  // Safety questionnaires, financial requirements, operational checklists, etc.

  sections: {
    safety: '91-question HSSE evaluation',
    finance: 'Financial documentation and bonding',
    operations: 'Safety protocols and certifications',
    // Based on assembled templates from all discipline tables
  }
};
```

**5. Discipline Review & Evaluation - Collaborative Assessment**
After contractor completion, disciplines review responses through their access points:

```javascript
// Safety team reviews at /safety (02400)
const safetyReviews = await supabase
  .from('safety_evaluation_responses')
  .select('*')
  .eq('contractor_id', contractorId);

/* Safety team evaluates:
   - HSSE questionnaire responses
   - Safety checklist compliance
   - Risk assessment results
   - Based on templates from 02400_safety_evaluation_templates
*/
```

**Template Table Structure & Naming Convention:**

```sql
-- Each discipline table follows consistent pattern:
CREATE TABLE discipline_evaluation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,           -- Human readable name
  discipline VARCHAR(50) NOT NULL,               -- safety, finance, procurement, etc.
  template_type VARCHAR(100),                    -- hsse_questionnaire, financial_requirements, etc.
  content JSONB NOT NULL,                        -- Complete template structure, questions, scoring
  version INTEGER DEFAULT 1,                     -- Template versioning for updates
  is_active BOOLEAN DEFAULT true,                -- Template status
  created_by UUID REFERENCES user_management(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Results table pattern for contractor responses:
CREATE TABLE discipline_evaluation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractors(id),
  template_id UUID REFERENCES discipline_evaluation_templates(id),
  discipline VARCHAR(50) NOT NULL,               -- Links responses to discipline
  responses JSONB NOT NULL,                      -- Contractor's answers to template questions
  status VARCHAR(50) DEFAULT 'pending',          -- pending, completed, reviewed
  score JSONB,                                   -- Discipline-specific scoring (if applicable)
  reviewed_by UUID REFERENCES user_management(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example: Contracts discipline tables
CREATE TABLE contracts_evaluation_templates (...); -- Template authoring
CREATE TABLE contracts_evaluation_results (...);    -- Contractor responses and reviews

-- Templates are authored in *_evaluation_templates tables
-- Contractor responses are stored/copied to *_evaluation_results tables for review/scoring
```

**6. System Benefits & Scalability:**

- **🎯 Discipline Autonomy**: Each team manages their evaluation expertise independently
- **🔄 Template Reusability**: Standardized templates reduce duplicate work and ensure consistency
- **📊 Audit Trail**: Complete tracking of template versions, reviewer actions, and evaluation history
- **🏗️ Scalability**: New disciplines easily added following established naming and structure conventions
- **🔒 Security**: Role-based access ensures teams only see relevant evaluation content
- **📈 Standardization**: Consistent evaluation methodology across all construction disciplines

**7. Complete Integration Architecture:**

```
CLIENT SIDE:
├── Disciplines access via accordion sections (/finance, /safety, /procurement, etc.)
├── Templates loaded from discipline-specific tables
├── Contractor responses collected and stored
└── Real-time collaboration between disciplines

SERVER SIDE:
├── Discipline template tables (safety, finance, procurement, etc.)
├── Template assembly service (combines discipline requirements)
├── Contractor evaluation packages (distributed via 01850)
├── Response storage and retrieval systems
└── Security and audit logging middleware

DATABASE:
├── Discipline template libraries (organized by subject matter expertise)
├── Contractor evaluation responses (linked to templates)
├── Audit trails (who created, reviewed, evaluated what and when)
└── Version control (template updates while maintaining response validity)
```

This architecture creates a **comprehensive, collaborative vetting ecosystem** where discipline experts define evaluation standards, contractors provide comprehensive responses through structured templates, and multi-disciplinary review ensures thorough contractor qualification. 📋🏗️🔧
3. **Contractor Invitation** - Contractor receives invitation with compiled evaluation package
4. **Contractor Completion** - Contractor accesses `/other-parties` to complete all requirements
5. **Discipline Review** - Each discipline reviews contractor responses via their access points
6. **Final Approval** - Safety (as coordinator) makes final vetting determination

### Existing Vetting Page Structure
**Current Location:** `/client/src/pages/02400-safety/02400-contractor-vetting/`

**Core Components:**
- `02400-contractor-vetting-page.js` - Main page component
- `02400-ContractorDetailsModal.js` - Contractor details management
- `02400-DocumentUploadModal.js` - Document upload functionality
- `02400-HSSEEvaluationModal.js` - 91-question HSSE evaluation system
- `02400-financial-analysis-agent.js` - Financial analysis agents
- `contractor_evaluation_results` table - Database storage

**Key Features:**
- Tabbed interface (Details, Financial, Licensing, Performance, Safety, Quality)
- HSSE evaluation with 91 questions across 9 sections
- Full database integration with Supabase
- Document upload and processing capabilities
- Real-time chat assistant interface

### User Management System Analysis
**Primary Tables:**
- `user_management` - Core user profiles
- `user_companies` - Company affiliation mapping via `company_id`
- `projects` - Project definitions for access filtering
- `project_members` - User project participation

**Access Control Structure:**
```javascript
// User company affiliation query
const userCompanies = await supabase
  .from('user_companies')
  .select('company_id')
  .eq('user_id', currentUser.id);
```

---

## 🏗️ Implementation Plan

### Phase 1: Component Relocation

#### Step 1.1: Directory Structure Creation
```bash
# Create new accordion-integrated directory
mkdir -p client/src/pages/01850-other-parties/01850-contractor-vetting/

# Copy all vetting components
cp -r client/src/pages/02400-safety/02400-contractor-vetting/components/* \
  client/src/pages/01850-other-parties/01850-contractor-vetting/components/

# Update component imports and references
find client/src/pages/01850-other-parties/01850-contractor-vetting/ \
  -name "*.js" -exec sed -i 's/02400-safety/01850-other-parties/g' {} \;
```

#### Step 1.2: Accordion Integration
**File:** `client/src/pages/01850-other-parties/components/01850-other-parties-page.js`

**Add Vetting Section to Accordion:**
```javascript
// Add to accordion click handler in OtherPartiesPageComponent
const handleAccordionClick = (sectionId) => {
  if (sectionId === 'contractor-vetting') {
    setActiveAccordionSection('contractor-vetting');
    // Load vetting component dynamically
    import('../01850-contractor-vetting/components/02400-contractor-vetting-page.js')
      .then(module => setVettingComponent(module.default));
  }
};
```

### Phase 2: User Authentication & Permissions

#### Step 2.1: Company Affiliation Query
**Create New Service:** `client/src/services/vettingPermissionsService.js`

```javascript
export const getUserPermissions = async (userId) => {
  // Get user's company affiliations
  const { data: companyAffiliations } = await supabase
    .from('user_companies')
    .select('company_id')
    .eq('user_id', userId);

  // Get user's discipline/department
  const { data: userProfile } = await supabase
    .from('user_management')
    .select('department, role')
    .eq('user_id', userId)
    .single();

  // Get user's project access rights
  const { data: projectAccess } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId);

  return {
    companyAffiliations: companyAffiliations.map(c => c.company_id),
    discipline: userProfile.department,
    accessibleProjects: projectAccess.map(p => p.project_id)
  };
};
```

#### Step 2.2: Dropdown Filtering Implementation
**Modify:** `02400-contractor-vetting-page.js`

```javascript
// Add permission-based contractor filtering
const loadAccessibleContractors = async () => {
  const permissions = await getUserPermissions(currentUser.id);

  let contractorsQuery = supabase.from('contractors');

  if (permissions.companyAffiliations.length > 0) {
    // Filter contractors to only show those from user's affiliated companies
    contractorsQuery = contractorsQuery.in('company_id', permissions.companyAffiliations);
  }

  const { data: contractors } = await contractorsQuery.select('*');
  setContractors(contractors);
};
```

### Phase 3: Discipline-Based Tab Access

#### Step 3.1: Tab Access Logic
**Create Utility Function:** `vettingPermissionsService.js`

```javascript
export const getAccessibleTabs = (userDiscipline) => {
  const allTabs = [
    { key: 'details', title: 'Contractor Details' },
    { key: 'financial', title: 'Financial Info', discipline: 'finance' },
    { key: 'licensing', title: 'Licensing', discipline: 'compliance' },
    { key: 'performance', title: 'Performance', discipline: 'operations' },
    { key: 'safety', title: 'Safety', discipline: 'safety' },
    { key: 'quality', title: 'Quality', discipline: 'quality' }
  ];

  const disciplineAccess = {
    'safety': allTabs,              // Full access for safety team
    'finance': allTabs.filter(tab => ['details', 'financial'].includes(tab.key)),
    'procurement': allTabs.filter(tab => ['details', 'performance', 'compliance'].includes(tab.key)),
    'operations': allTabs.filter(tab => ['details', 'safety', 'performance'].includes(tab.key)),
    'management': allTabs.filter(tab => tab.key === 'details') // Limited access
  };

  return disciplineAccess[userDiscipline] || [{ key: 'details', title: 'Contractor Details' }];
};
```

#### Step 3.2: Tab Rendering Update
**Modify Tab Navigation in Vetting Page:**

```javascript
// In ContractorVettingPageComponent render method
const accessibleTabs = getAccessibleTabs(userPermissions.discipline);

// Update tab rendering
{accessibleTabs.map(tab => (
  <button
    key={tab.key}
    className={`state-button ${activeTab === tab.key ? "active" : ""}`}
    onClick={() => setActiveTab(tab.key)}
  >
    {tab.title}
  </button>
))}
```

### Phase 4: Project Access Filtering

#### Step 4.1: Evaluation Results Filtering
**Enhance Database Query in Vetting Page:**

```javascript
const loadEvaluationResults = async () => {
  const permissions = await getUserPermissions(currentUser.id);

  let evaluationQuery = supabase
    .from('contractor_evaluation_results')
    .select('*')
    .order('created_at', { ascending: false });

  // Filter by user's project access rights
  if (permissions.accessibleProjects.length > 0) {
    // Join with project-related tables to filter evaluations
    evaluationQuery = evaluationQuery
      .in('project_id', permissions.accessibleProjects);
  }

  const { data: evaluations } = await evaluationQuery;
  setEvaluationResults(evaluations);
};
```

#### Step 4.2: Project Context Integration
**Add Project Selection Dropdown:**

```javascript
// Add project selector for focused filtering
const [selectedProject, setSelectedProject] = useState(null);

const loadUserProjects = async () => {
  const permissions = await getUserPermissions(currentUser.id);

  if (permissions.accessibleProjects.length > 0) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, project_code')
      .in('id', permissions.accessibleProjects);

    setUserProjects(projects);
  }
};
```

### Phase 5: Accordion Section Integration

#### Step 5.1: Accordion Provider Integration
**Update Accordion Section Rendering:**

```javascript
// In AccordionComponent, add vetting section
const renderContractorVetting = () => {
  const permissions = useVettingPermissions();

  if (!permissions.canAccessVetting) {
    return <div>Access restricted - insufficient permissions</div>;
  }

  return <ContractorVettingPageComponent
    userPermissions={permissions}
    isAccordionMode={true}
  />;
};
```

#### Step 5.2: State Management Integration
**Connect Vetting State to Accordion State:**

```javascript
// Use accordion context for state management
const { activeSection, setActiveSection } = useAccordionContext();

useEffect(() => {
  if (activeSection === 'contractor-vetting') {
    // Initialize vetting page with permissions
    initializeVettingWithPermissions();
  }
}, [activeSection]);
```

### Phase 6: Database Schema Updates

#### Step 6.1: Permission Audit Logging
**Add Audit Table for Permission Checks:**

```sql
CREATE TABLE vetting_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_management(user_id),
  contractor_id UUID REFERENCES contractors(id),
  action VARCHAR(100) NOT NULL, -- 'view', 'edit', 'evaluate', 'access_denied'
  tab_accessed VARCHAR(50),
  project_id UUID REFERENCES projects(id),
  company_affiliation_id UUID REFERENCES companies(id),
  discipline VARCHAR(100),
  access_granted BOOLEAN DEFAULT false,
  reason_denied TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Step 6.2: Enhanced User Permissions Caching
**Add Permissions Cache Table:**

```sql
CREATE TABLE user_vetting_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_management(user_id),
  permissions JSONB NOT NULL, -- Cached permission object
  last_updated TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP GENERATED ALWAYS AS (last_updated + interval '1 hour') STORED
);
```

### Phase 7: Testing & Validation

#### Step 7.1: Permission Test Scenarios
```javascript
const testScenarios = [
  {
    user: 'safety_manager',
    discipline: 'safety',
    expectedTabs: ['details', 'financial', 'licensing', 'performance', 'safety', 'quality'],
    expectedContractors: 'all from affiliated companies'
  },
  {
    user: 'finance_user',
    discipline: 'finance',
    expectedTabs: ['details', 'financial'],
    expectedContractors: 'filtered by company affiliation'
  },
  {
    user: 'procurement_officer',
    discipline: 'procurement',
    expectedTabs: ['details', 'performance', 'compliance'],
    expectedContractors: 'filtered by company affiliation'
  }
];
```

#### Step 7.2: Integration Testing Checklist
- [ ] Accordion navigation triggers vetting page load
- [ ] User permissions load correctly on page initialization
- [ ] Contractor dropdown filters by company affiliation
- [ ] Tab visibility respects discipline permissions
- [ ] Evaluation results filter by project access
- [ ] HSSE evaluation modal maintains full functionality
- [ ] Database updates work with permission checks
- [ ] Error handling for insufficient permissions

---

## 🔧 Technical Implementation Details

### File Structure Changes
```
client/src/pages/
├── 00300-construction/                       # Construction discipline vetting access
│   ├── 00300-construction-vetting-access.js  # Construction-specific vetting integration
│   └── components/
│       └── 00300-construction-page.js        # Construction main page with vetting access
├── 00425-contracts-pre-award/               # Contracts discipline vetting location
│   ├── 00425-contractor-vetting-integration.js  # Contracts-specific vetting integration
│   └── components/
│       └── 00425-contracts-pre-award-page.js     # Contracts pre-award main page
├── 01200-finance/                            # Finance discipline vetting access
│   ├── 01200-finance-vetting-access.js       # Finance-specific vetting integration
│   └── components/
│       └── 01200-finance-page.js
├── 01900-procurement/                        # Procurement discipline vetting access
│   ├── 01900-procurement-vetting-access.js   # Procurement-specific vetting integration
│   └── components/
│       └── 01900-procurement-page.js
├── 02000-project-controls/                   # Operations discipline vetting access
│   ├── 02000-operations-vetting-access.js    # Operations-specific vetting integration
│   └── components/
│       └── 02000-project-controls-page.js    # Project controls main page with operations vetting access
│       # Note: Operations discipline uses main project controls page as their vetting entry point
├── 02200-quality-assurance/                  # Quality discipline vetting access
│   ├── 02200-quality-vetting-access.js       # Quality-specific vetting integration
│   └── components/
│       └── 02200-quality-assurance-page.js
├── 02400-safety/                             # Safety discipline (central controller)
│   ├── 02400-contractor-vetting-page.js      # Full vetting administration
│   ├── components/
│   │   ├── modals/
│   │   │   ├── 02400-ContractorDetailsModal.js
│   │   │   └── 02400-HSSEEvaluationModal.js
│   │   └── agents/
│   └── css/
└── 00425-contracts-pre-award/                # Contracts discipline vetting location
```

### API Route Updates
**File:** `server/routes/contractor-vetting-routes.js`

```javascript
// Add permission-based filtering to routes
router.get('/contractors', authenticateToken, async (req, res) => {
  const userPermissions = await getUserPermissions(req.user.id);
  const contractors = await getAccessibleContractors(userPermissions);
  res.json(contractors);
});

router.get('/evaluations', authenticateToken, async (req, res) => {
  const userPermissions = await getUserPermissions(req.user.id);
  const evaluations = await getAccessibleEvaluations(userPermissions);
  res.json(evaluations);
});
```

### Error Handling & Security
**Add Permission Denied Handling:**

```javascript
export const checkVettingAccess = (permissions, action) => {
  const errors = [];

  if (!permissions.companyAffiliations?.length) {
    errors.push('No company affiliations found - cannot access contractor vetting');
  }

  if (action === 'hsse-evaluation' && permissions.discipline !== 'safety') {
    errors.push('HSSE evaluation requires safety department access');
  }

  return {
    hasAccess: errors.length === 0,
    errors,
    auditEntry: {
      user_id: permissions.userId,
      action,
      access_granted: errors.length === 0,
      reason_denied: errors.join(', ')
    }
  };
};
```

---

## 📊 Implementation Timeline & Milestones

### Week 1-2: Foundation
- [ ] Complete component relocation to accordion structure
- [ ] Update import paths and component references
- [ ] Basic accordion integration testing

### Week 3-4: Permissions Core
- [ ] Implement user permission service
- [ ] Add company affiliation filtering to contractor dropdowns
- [ ] Testing permission-based contractor access

### Week 5-6: Discipline Access
- [ ] Implement tab visibility logic by discipline
- [ ] Add project access filtering for evaluation results
- [ ] Full integration testing across user types

### Week 7-8: Optimization & Deployment
- [ ] Performance optimization for permission queries
- [ ] Security audit and penetration testing
- [ ] Production deployment and monitoring

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ Vetting page accessible via `/01850-other-parties` accordion
- ✅ Contractor dropdowns filter by user's company affiliations
- ✅ Tab access restricted by user's discipline/department
- ✅ Evaluation results show only user-accessible project documents
- ✅ HSSE evaluation maintains 91-question functionality
- ✅ Maintain same page structure across contractor/discipline contexts

### Performance Requirements
- ✅ Page load time < 3 seconds with permission checks
- ✅ Database queries optimized with proper indexing
- ✅ Client-side filtering avoids excessive re-renders
- ✅ Permission caching reduces API calls by 60%

### Security Requirements
- ✅ User access logged for audit compliance
- ✅ Permission checks on all sensitive operations
- ✅ No data leakage between different company affiliations
- ✅ Secure error messages (no information disclosure)

### User Experience Requirements
- ✅ Seamlessly integrated into accordion navigation
- ✅ Clear visual indicators for access restrictions
- ✅ Intuitive permission-based interface adjustments
- ✅ Consistent behavior across different user roles

---

## 🚨 Risk Assessment & Mitigation

### High-Risk Items
| Risk | Impact | Mitigation |
|------|--------|------------|
| Permission query performance | High (slow page loads) | Database indexing + caching + query optimization |
| User confusion with access restrictions | Medium | Clear UI indicators + help tooltips + training |
| Data leakage between companies | Critical | Multi-layer permission checks + audit logging + RLS policies |

### Technical Dependencies
- Supabase RLS policies must be updated for new access patterns
- Accordion state management integration requires careful testing
- Component relocation may require extensive path updates

### Rollback Plan
- Original vetting page remains functional during transition
- Feature flags allow gradual rollout with instant rollback capability
- Database schema changes are backward compatible
- Component imports maintain backward compatibility during migration

---

## 📈 Monitoring & Analytics

### Key Metrics to Track
- **Access Success Rate**: Percentage of successful vetting page accesses
- **Permission Load Time**: Average time for user permission resolution
- **Tab Access Distribution**: Which discipline accesses which tabs
- **Evaluation Completion Rate**: Percentage of started evaluations completed
- **Error Rate by User Type**: Permission denied vs system errors

### Logging Requirements
```javascript
// Audit logging for all permission checks
const auditLog = {
  timestamp: new Date().toISOString(),
  user_id: userId,
  action: 'vetting_page_access',
  resource: 'contractor_vetting',
  permission_granted: hasAccess,
  discipline: userDiscipline,
  company_count: companyAffiliations.length,
  project_count: accessibleProjects.length,
  ip_address: req.ip,
  user_agent: req.headers['user-agent']
};
```

### Alert Conditions
- Permission query failures > 5% of requests
- Page load time > 5 seconds
- Access denied rate > 10% for valid users
- Database connection failures

---

## 🔄 Future Enhancements

### Phase 2 Features (Post-Implementation)
- **Advanced Filtering**: Multi-company management for enterprise users
- **Bulk Operations**: Batch evaluation processing for efficiency
- **Analytics Dashboard**: Vetting performance metrics and trends
- **Mobile Optimization**: Responsive design for field access
- **Integration APIs**: External system connectivity for contractor data

### Technical Debt Cleanup
- **Code Consolidation**: Merge common permission logic across modules
- **Component Optimization**: Reduce bundle size with lazy loading
- **Database Optimization**: Add composite indexes for permission queries
- **Test Coverage**: Comprehensive test suite for permission logic

---

## 📚 Documentation Updates Required

### Files to Update
- `0000_DOCUMENTATION_GUIDE.md` - Add vetting relocation reference
- `0975_ACCORDION_MASTER_DOCUMENTATION.md` - Update accordion integration patterns
- Database schema documentation - Add permission tables
- API documentation - Update vetting endpoints
- User guide - Add accordion-based access instructions

### Training Materials
- User training for accordion navigation changes
- Administrator guide for permission configuration
- Developer documentation for permission system integration
- Security team guide for audit log monitoring

---

## ✅ Quality Assurance Checklist

### Pre-Deployment Checks
- [ ] All import paths updated and tested
- [ ] Permission queries work across all user types
- [ ] Accordion integration functional on all devices
- [ ] HSSE evaluation modal maintains full functionality
- [ ] Database migration scripts tested and verified
- [ ] Performance benchmarks meet requirements

### Post-Deployment Validation
- [ ] Real user testing completed across disciplines
- [ ] Performance monitoring active and alerting configured
- [ ] Security audit completed with sign-off
- [ ] Rollback procedures documented and tested
- [ ] Support team trained on new functionality

---

## 🏁 Conclusion

This implementation plan provides a comprehensive roadmap for relocating the Contractor Vetting page to accordion accessibility with robust user permission controls. The phased approach ensures minimal disruption while delivering enhanced security and usability.

**Total Implementation Time Estimate:** 8 weeks
**Risk Level:** Medium (mitigations identified)
**Business Impact:** High (enhanced access control and user experience)

**Approval Status:**
- [x] Technical Specification Complete
- [x] Implementation Plan Approved
- [ ] Development Ready
- [ ] User Acceptance Testing Pending
- [ ] Production Deployment Pending

---

**Document Version:** 1.0
**Created:** October 2025
**Review Date
