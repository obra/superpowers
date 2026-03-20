# Contributor Classification & Organization Collaboration System

## Overview

This document establishes the business logic for contributor classification and the organization collaboration system that enables controlled cross-organizational access within the Construct.AI enterprise platform.

## Table of Contents

1. [Contributor Classification Framework](#contributor-classification-framework)
2. [Organization Collaboration Architecture](#organization-collaboration-architecture)
3. [Security Model & Access Control](#security-model--access-control)
4. [Implementation Patterns](#implementation-patterns)
5. [External Party Evaluation Integration](#external-party-evaluation-integration)

---

## Contributor Classification Framework

### Definition & Purpose

**Contributors** are users who require controlled access to functionality across multiple organizations within the Construct.AI ecosystem. Unlike regular employees who work within a single organization, contributors represent external stakeholders who need cross-organizational access for collaborative work.

### Contributor Classification Criteria

#### ✅ SHOULD BE CONTRIBUTORS:
- **External Contractors**: Working on projects across multiple organizations
- **Consultants & Partners**: Providing services to multiple client organizations
- **Audit & Inspection Teams**: External assessors accessing systems they evaluate
- **Vendor Representatives**: Supplier teams requiring cross-organization access
- **Regulatory Assessors**: External compliance and regulatory evaluators
- **Inter-Organization Teams**: Cross-functional teams spanning multiple organizations

#### ❌ SHOULD NOT BE CONTRIBUTORS (Use employee tables instead):
- **Internal Full-time Employees**: Work for single organization, use `user_management` + `personnel_records`
- **Organization-specific Staff**: No cross-organization access requirements
- **Single-organization Contractors**: Work exclusively within one organization

### Database Architecture

#### Primary Contributor Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **`contributors`** | Core contributor registry | `id`, `organization_id`, `email`, `role`, `is_active` |
| **`organization_collaborations`** | Cross-org relationship definitions | `primary_organization_id`, `collaborating_organization_id`, `shared_sections`, `page_precedence` |
| **`user_management`** | Employee user profiles | `user_id`, `department`, `role`, `job_title` |
| **`personnel_records`** | Employee personnel data | `user_id`, `employee_id`, `employment_type` |

#### Access Pattern Hierarchy

```javascript
// Contributor Authentication Flow
const contributorAuth = async (userId) => {
  // 1. Primary Organization Affiliation (Security Boundary)
  const { organization_id } = await supabase
    .from('contributors')
    .select('organization_id')
    .eq('id', userId);

  // 2. Extended Collaboration Access
  const collaborations = await supabase
    .from('organization_collaborations')
    .select('*')
    .or(`primary_organization_id.eq.${organization_id},collaborating_organization_id.eq.${organization_id}`);

  // 3. Combined Permissions
  return {
    primaryAffiliation: organization_id,
    extendedAccess: collaborations.map(c => c.shared_sections).flat(),
    canAccessVetting: true  // Contributors typically need evaluation access
  };
};
```

---

## Organization Collaboration Architecture

### Collaboration Relationship Model

#### Collaboration Definition Structure

```json
{
  "primary_organization_id": "90cd635a-380f-4586-a3b7-a09103b6df94",
  "collaborating_organization_id": "8965e2e0-47c3-47c4-b6a4-1157508430e1",
  "shared_sections": [
    "00300",  // Construction & Contractor Vetting
    "02400",  // Safety & HSE
    "01900"   // Procurement & Suppliers
  ],
  "page_precedence": "host",
  "collaboration_purpose": "Joint construction project evaluation",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "is_active": true
}
```

#### Page Precedence Rules

| Precedence | Behavior |
|------------|----------|
| **"host"** | Primary organization's pages take precedence |
| **"collaborator"** | Collaborating organization's pages override host |
| **"merge"** | Combine pages from both organizations |

### Collaboration Types

#### Type 1: Bidirectional Collaborations
```
Org A ⟷ Org B
├── Both can access each other's shared sections
├── Symmetric page precedence rules
└── Mutual evaluation capabilities
```

#### Type 2: Hub-and-Spoke Collaborations
```
Primary Org (Hub)
├── Collaborator A (Spoke)
├── Collaborator B (Spoke)
└── Collaborator C (Spoke)
```

#### Type 3: Linear Supply Chain Collaborations
```
Client ← Consultant ← Subcontractor ← Supplier
├── Downstream access to client requirements
├── Upstream access to supplier capabilities
└── Controlled information flow
```

### Dynamic Accordion Generation

The collaboration system dynamically modifies accordion navigation based on user permissions:

```javascript
// Accordion Section Resolution (from accordion-sections-routes.js)
const getCollaborativeSections = async (orgId, templateSections) => {
  // Get user's collaboration relationships
  const collaborations = await supabase
    .from('organization_collaborations')
    .select('*')
    .or(`primary_organization_id.eq.${orgId},collaborating_organization_id.eq.${orgId}`)
    .eq('is_active', true);

  let finalSections = [...templateSections];

  for (const collab of collaborations) {
    const sharedSections = collab.shared_sections || [];
    const collaboratingSections = getTemplateSections(getOrganizationTemplate(collab.collaborating_organization_id));

    // Filter to shared sections only
    const filteredSections = collaboratingSections.filter(section => {
      const sectionId = section.id.replace('accordion-button-', '');
      return sharedSections.includes(sectionId);
    });

    // Apply precedence rules
    if (collab.page_precedence === 'host') {
      // Host sections take precedence - merge
      finalSections = [...finalSections, ...filteredSections];
    } else if (collab.page_precedence === 'collaborator') {
      // Replace host sections with collaborator versions
      filteredSections.forEach(collabSection => {
        const existingIndex = finalSections.findIndex(s => s.id === collabSection.id);
        if (existingIndex >= 0) {
          finalSections[existingIndex] = collabSection;
        }
      });
    }
  }

  return finalSections;
};
```

---

## Security Model & Access Control

### Multi-Layer Security Architecture

#### Layer 1: Primary Organization Affiliation (Immutable)
- **Source**: `contributors.organization_id`
- **Purpose**: Core security boundary and primary access control
- **Immutability**: Cannot be changed through collaborations

#### Layer 2: Collaboration-Based Permissions
- **Source**: `organization_collaborations.shared_sections`
- **Purpose**: Controlled extension of access beyond primary organization
- **Granularity**: Section-level access control

#### Layer 3: Role-Based Filtering
- **Source**: `contributors.role` + `user_management.department`
- **Purpose**: Function-specific access control within shared sections
- **Example**: Safety engineers see HSE evaluation tabs, procurement sees supplier evaluation

### Security Validation Example

```javascript
// Permission Validation for External Party Evaluation
const validateCollaborationAccess = async (userId, requiredSection) => {
  // Verify user exists as contributor
  const contributor = await supabase
    .from('contributors')
    .select('organization_id, role')
    .eq('id', userId)
    .single();

  if (!contributor) {
    throw new Error('User not found in contributor registry');
  }

  // Get collaborations where user can access target section
  const collaborations = await supabase
    .from('organization_collaborations')
    .select('*')
    .or(`primary_organization_id.eq.${contributor.organization_id},collaborating_organization_id.eq.${contributor.organization_id}`)
    .eq('is_active', true);

  // Check if any collaboration grants access to required section
  const hasAccess = collaborations.some(collab =>
    collab.shared_sections?.includes(requiredSection)
  );

  // Role-based filtering within approved access
  const rolePermissions = getRolePermissions(contributor.role);

  return {
    hasAccess: hasAccess && rolePermissions.includes(requiredSection),
    primaryOrg: contributor.organization_id,
    extendedOrgs: collaborations.map(c => c.primary_organization_id),
    restrictions: rolePermissions
  };
};
```

### Audit Logging

All collaboration access is logged for compliance and security monitoring:

```javascript
// Collaboration Access Audit Log
const logCollaborationAccess = async (accessEvent) => {
  await supabase
    .from('collaboration_audit_log')
    .insert({
      user_id: accessEvent.userId,
      primary_organization_id: accessEvent.primaryOrg,
      collaborating_organization_id: accessEvent.collaboratingOrg,
      accessed_section: accessEvent.sectionId,
      action: accessEvent.action,
      justification: accessEvent.businessPurpose,
      timestamp: new Date(),
      ip_address: accessEvent.clientIP,
      user_agent: accessEvent.userAgent
    });
};
```

---

## Implementation Patterns

### Contributor Onboarding Process

#### 1. Organization Setup
```sql
-- Add organization to collaborations
INSERT INTO organization_collaborations (
  primary_organization_id,
  collaborating_organization_id,
  shared_sections,
  page_precedence,
  collaboration_purpose
) VALUES (
  '90cd635a-380f-4586-a3b7-a09103b6df94', -- Main org
  'abc-construct-ltd-org-id',            -- External org
  ARRAY['00300', '02400', '01900'],     -- Construction, Safety, Procurement
  'host',
  'Joint infrastructure project evaluation'
);
```

#### 2. User Registration as Contributor
```sql
-- Register external user as contributor
INSERT INTO contributors (
  id,
  organization_id,
  email,
  role,
  created_at,
  is_active
) VALUES (
  'external-user-uuid',
  'abc-construct-ltd-org-id',  -- Their actual employer
  'user@abc-construct.com',
  'senior-safety-engineer',
  NOW(),
  true
);

-- optional: Add user_management entry for enhanced profile
INSERT INTO user_management (
  user_id,
  department,
  role,
  job_title
) VALUES (
  'external-user-uuid',
  'safety',
  'senior-safety-engineer',
  'Lead HSE Consultant'
);
```

#### 3. Permission Validation
```javascript
// User can now access:
// ✅ Their primary organization (abc-construct-ltd)
// ✅ Shared sections in main org (00300, 02400, 01900)
// ❌ Non-shared sections remain inaccessible
```

### Contributor vs Employee Decision Matrix

| Scenario | User Type | Table | Access Pattern | Business Purpose |
|----------|-----------|-------|----------------|------------------|
| **Internal Safety Manager** | Employee | `user_management` | Single-org access | Daily operations |
| **External HSE Consultant** | Contributor | `contributors` | Multi-org via collaborations | Project evaluation |
| **Full-time Procurement Officer** | Employee | `user_management` | Single-org access | Procurement workflows |
| **Supplier Quality Auditor** | Contributor | `contributors` | Multi-org via collaborations | Supplier assessments |
| **Contract Project Manager** | Contributor | `contributors` | Multi-org via collaborations | Cross-org coordination |

---

## External Party Evaluation Integration

### Contributor Role in Evaluations

Contributors are the primary users of external party evaluation systems:

#### Evaluation Workflow Permissions
```javascript
// Contributor External Party Evaluation Access
const contributorEvaluationPermissions = async (contributorId) => {
  const permissions = await getUserPermissions(contributorId);

  return {
    canCreateEvaluationPackage: permissions.companyAffiliations?.length > 1, // Multi-org access
    canAccessEvaluationTemplates: permissions.discipline !== 'unknown',
    canPerformExternalAssessments: true, // Contributors are external assessors
    canViewCollaborationScope: permissions.accessibleProjects?.length > 0,
    primaryOrganization: permissions.companyAffiliations?.[0], // Security boundary
    collaborationScope: permissions.companyAffiliations?.slice(1) // Extended access
  };
};
```

#### Evaluation Package Creation
- **Primary Org**: Designates the evaluation package owner
- **Collaborating Orgs**: Define scope of external parties to evaluate
- **Shared Sections**: Determine which evaluation templates are available
- **Role-based Access**: Contributors see evaluation interfaces appropriate to their discipline

### Security Considerations for Evaluations

#### 1. Evaluation Scope Containment
```javascript
const validateEvaluationScope = async (evaluationPackage) => {
  // Ensure all collaborating organizations permit the evaluation
  const collaborations = await supabase
    .from('organization_collaborations')
    .select('*')
    .or(`primary_organization_id.eq.${evaluationPackage.primaryOrg},collaborating_organization_id.eq.${evaluationPackage.primaryOrg}`);

  // Verify evaluation scope doesn't exceed collaboration permissions
  const permittedOrgs = collaborations.map(c => c.collaborating_organization_id);
  const requestedOrgs = evaluationPackage.collaboratingOrganizations;

  const scopeValidation = requestedOrgs.every(org =>
    permittedOrgs.includes(org) || org === evaluationPackage.primaryOrg
  );

  return scopeValidation;
};
```

#### 2. Evaluation Result Segregation
- **Primary Org Access**: Full evaluation results across all parties
- **Contributor Org Access**: Only evaluation results for their organization
- **Audit Trail**: All evaluation actions logged with user context

### External Party Evaluation Service Integration

Contributors interact with evaluation services through controlled API access:

```javascript
// ExternalPartyEvaluationService with Contributor Context
class ContributorAwareEvaluationService extends ExternalPartyEvaluationService {

  async createDocumentInstance(templateId, context, assignment) {
    // Verify contributor has permission for this collaboration
    const contributorValidation = await this.validateContributorAccess(
      assignment.userId,
      assignment.collaborationId
    );

    if (!contributorValidation.hasAccess) {
      throw new Error('Contributor lacks access to create evaluation documents in this collaboration');
    }

    // Create document instance with contributor context
    return super.createDocumentInstance(templateId, {
      ...context,
      contributorId: assignment.userId,
      contributorOrg: contributorValidation.primaryOrg,
      collaborationScope: contributorValidation.collaborationScope
    }, assignment);
  }

  async submitDocumentInstance(documentId, responses) {
    // Log contributor evaluation submission for audit
    await this.logContributorSubmission(documentId, responses);
    return super.submitDocumentInstance(documentId, responses);
  }
}
```

### Evaluation Access Control Matrix

| User Type | Create Evaluation Package | View Evaluation Results | Submit Evaluation Responses | Modify Evaluation Templates |
|-----------|--------------------------|------------------------|----------------------------|-----------------------------|
| **Primary Org Employee** | ✅ Full Access | ✅ All Results | ✅ As Assigned | ✅ Full Access |
| **Contributor (Collaborating Org)** | ❌ Cannot Create | ✅ Own Org Results Only | ✅ As Assigned | ❌ Cannot Modify |
| **External Party (Being Evaluated)** | ❌ Cannot Create | ❌ No Access | ✅ Response Submission Only | ❌ Cannot Modify |

---

## Conclusion

The contributor classification and organization collaboration system provides a robust framework for managing controlled cross-organizational access within the Construct.AI platform. By clearly defining contributor roles versus internal employees, the system enables secure collaboration while maintaining appropriate security boundaries and audit trails.

### Key Takeaways

1. **Contributors** = Users needing cross-organizational access (external consultants, contractors, auditors)
2. **Employees** = Users working within their single organization (internal staff)
3. **Organization Collaborations** = Legal agreements defining what can be shared between organizations
4. **Security Model** = Multi-layer access control respecting organizational boundaries
5. **External Party Evaluations** = Primary use case for contributors in collaborative workflows

### Future Enhancements

- **Dynamic Collaboration Management**: Self-service collaboration request and approval workflows
- **Granular Permission Templates**: Pre-defined collaboration templates for common scenarios
- **Advanced Audit Reporting**: Detailed analytics on collaboration usage and security events
- **Integration APIs**: Programmatic collaboration setup for automated partner onboarding

---

## Status

- [x] Initial analysis and documentation
- [x] Business logic framework established
- [x] Security model defined
- [x] Implementation patterns documented
- [x] External Party Evaluation integration specified
- [ ] Integration testing completed
- [ ] User training materials developed

## Version History

- v1.0 (2025-10-21): Initial documentation of contributor classification and organization collaboration system
