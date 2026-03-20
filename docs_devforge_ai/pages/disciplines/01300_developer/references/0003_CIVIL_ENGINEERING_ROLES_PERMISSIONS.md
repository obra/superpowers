# 00850_CIVIL_ENGINEERING_ROLES_PERMISSIONS.md

## Civil Engineering Department - Roles & Permissions

### Status
- [x] Initial draft
- [x] Security review required
- [ ] Governance approval pending
- [ ] Implementation completed

### Version History
- v1.0 (2025-12-11): Initial roles and permissions framework for Civil Engineering department

---

## Overview

This document defines the roles, permissions, and access control framework for the Civil Engineering (00850) department. The department handles all civil engineering activities including infrastructure design, construction management, quality assurance, surveying, geotechnical engineering, and civil works coordination across construction projects.

### Integration with Existing Security Infrastructure

The Civil Engineering department integrates with the existing security framework:

- **RLS Security Dashboard**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`
- **Schema Dashboard**: `client/src/pages/02050-information-technology/components/SchemaDashboard.jsx`
- **User Roles Table**: `public.user_roles` with department_code = '00850'
- **Template Management**: Civil engineering templates managed through governance

---

## Core Roles & Permissions Matrix

### 1. Civil Engineering Leadership Roles (Level 3-4)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Chief Civil Engineer** | 00850 | 4 | `civil:*`, `design:approve_final`, `construction:supervise`, `qa:certify`, `audit:conduct` | Executive civil engineering leadership and oversight |
| **Civil Engineering Manager** | 00850 | 3 | `civil:manage`, `design:approve`, `construction:coordinate`, `qa:supervise`, `report:departmental` | Department-level civil engineering management |
| **Project Civil Engineer** | 00850 | 3 | `project:lead`, `design:review`, `construction:manage`, `qa:implement` | Project-level civil engineering leadership |
| **Geotechnical Manager** | 00850 | 3 | `geotechnical:*`, `foundation:design`, `soil:analyze`, `stability:certify` | Geotechnical engineering management |

### 2. Civil Engineering Technical Roles (Level 2-3)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Senior Civil Engineer** | 00850 | 3 | `design:lead`, `calculation:approve`, `specification:develop`, `construction:supervise` | Senior technical civil engineering |
| **Civil Engineer** | 00850 | 2 | `design:create`, `calculation:perform`, `drawing:produce`, `site:inspect` | Core civil engineering design and construction |
| **Structural Engineer** | 00850 | 2 | `structural:design`, `analysis:perform`, `reinforcement:specify`, `loading:verify` | Structural engineering specialization |
| **Surveyor** | 00850 | 2 | `survey:conduct`, `measurement:record`, `stakeout:perform`, `asbuilt:verify` | Land surveying and measurement |

### 3. Civil Engineering Specialist Roles (Level 2)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Geotechnical Engineer** | 00850 | 2 | `geotechnical:assess`, `soil:test`, `foundation:recommend`, `stability:analyze` | Geotechnical investigations and analysis |
| **Materials Engineer** | 00850 | 2 | `materials:test`, `quality:verify`, `specification:materials`, `compliance:materials` | Construction materials testing and quality |
| **Quantity Surveyor** | 00850 | 2 | `quantity:measure`, `cost:estimate`, `variation:assess`, `payment:certify` | Quantity surveying and cost management |
| **QA/QC Engineer** | 00850 | 2 | `qa:plan`, `inspection:conduct`, `nonconformance:identify`, `quality:certify` | Quality assurance and quality control |

### 4. Civil Engineering Support Roles (Level 1-2)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **Civil Engineering Technician** | 00850 | 1 | `drawing:assist`, `calculation:support`, `site:monitor`, `documentation:maintain` | Technical support for civil engineering activities |
| **Survey Technician** | 00850 | 1 | `survey:assist`, `measurement:support`, `data:record`, `equipment:maintain` | Surveying technical support |
| **Materials Technician** | 00850 | 1 | `testing:assist`, `sample:collect`, `data:record`, `equipment:calibrate` | Materials testing technical support |
| **Site Inspector** | 00850 | 1 | `inspection:assist`, `observation:record`, `compliance:verify`, `report:submit` | Construction site inspection support |

---

## Permission Definitions

### Civil Engineering Core Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `civil:manage` | Full civil engineering department management | Civil Engineering Managers, Chief Engineers |
| `civil:coordinate` | Civil engineering operational coordination | Senior Civil Engineers |
| `civil:view` | View civil engineering information | All civil engineering roles |
| `civil:report` | Generate civil engineering reports | Civil Engineers, Managers |

### Design & Engineering Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `design:create` | Create civil engineering designs | Civil Engineers |
| `design:review` | Review and approve designs | Senior Civil Engineers, Managers |
| `design:approve` | Final design approval authority | Civil Engineering Managers, Chief Engineers |
| `design:approve_final` | Ultimate design approval authority | Chief Civil Engineers |
| `calculation:perform` | Perform engineering calculations | Civil Engineers |
| `calculation:approve` | Approve engineering calculations | Senior Civil Engineers |
| `drawing:produce` | Produce engineering drawings | Civil Engineers, Technicians |
| `specification:develop` | Develop technical specifications | Senior Civil Engineers |

### Construction Management Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `construction:coordinate` | Coordinate construction activities | Civil Engineering Managers |
| `construction:supervise` | Supervise construction work | Senior Civil Engineers, Project Engineers |
| `construction:manage` | Manage construction projects | Project Civil Engineers |
| `site:inspect` | Conduct site inspections | Civil Engineers, QA Engineers |
| `site:monitor` | Monitor construction progress | Civil Engineering Technicians |
| `method:approve` | Approve construction methods | Senior Civil Engineers |

### Quality Assurance Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `qa:plan` | Develop QA/QC plans | QA/QC Engineers |
| `qa:implement` | Implement QA/QC procedures | QA/QC Engineers, Civil Engineers |
| `qa:supervise` | Supervise QA/QC activities | Civil Engineering Managers |
| `qa:certify` | Issue quality certifications | QA/QC Engineers, Managers |
| `inspection:conduct` | Conduct quality inspections | QA/QC Engineers, Civil Engineers |
| `nonconformance:identify` | Identify nonconformances | QA/QC Engineers |
| `quality:certify` | Certify quality compliance | QA/QC Engineers, Managers |

### Surveying & Measurement Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `survey:conduct` | Conduct land surveys | Surveyors |
| `survey:assist` | Assist with surveying activities | Survey Technicians |
| `measurement:record` | Record survey measurements | Surveyors, Survey Technicians |
| `stakeout:perform` | Perform construction stakeout | Surveyors |
| `asbuilt:verify` | Verify as-built conditions | Surveyors, Civil Engineers |
| `control:establish` | Establish survey control points | Surveyors |

### Geotechnical Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `geotechnical:assess` | Conduct geotechnical assessments | Geotechnical Engineers |
| `geotechnical:manage` | Manage geotechnical department | Geotechnical Managers |
| `soil:test` | Perform soil testing | Geotechnical Engineers, Materials Technicians |
| `soil:analyze` | Analyze soil conditions | Geotechnical Engineers |
| `foundation:design` | Design foundations | Geotechnical Engineers, Structural Engineers |
| `foundation:recommend` | Recommend foundation solutions | Geotechnical Engineers |
| `stability:analyze` | Analyze slope stability | Geotechnical Engineers |
| `stability:certify` | Certify stability conditions | Geotechnical Managers |

### Materials & Testing Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `materials:test` | Test construction materials | Materials Engineers, Technicians |
| `materials:certify` | Certify material compliance | Materials Engineers |
| `testing:assist` | Assist with materials testing | Materials Technicians |
| `sample:collect` | Collect material samples | Materials Technicians, QA Engineers |
| `specification:materials` | Develop material specifications | Materials Engineers |
| `compliance:materials` | Verify material compliance | Materials Engineers, QA Engineers |

---

## Civil Engineering Workflow Permissions

### Design Development Process

```
CONCEPT DESIGN ────► PRELIMINARY DESIGN ────► DETAILED DESIGN ────► CONSTRUCTION DOCS
      ↓                      ↓                        ↓                     ↓
  Requirements         Technical Review         QA Review           Final Approval
  (Civil Engineer)     (Senior Engineer)        (QA Engineer)       (Manager)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **Concept Design** | `design:create`, `requirement:analyze` | Civil Engineers |
| **Preliminary Design** | `design:develop`, `calculation:perform` | Civil Engineers, Senior Engineers |
| **Technical Review** | `design:review`, `calculation:approve` | Senior Civil Engineers |
| **QA Review** | `qa:review`, `compliance:verify` | QA/QC Engineers |
| **Detailed Design** | `design:finalize`, `drawing:produce` | Civil Engineers |
| **Construction Documents** | `specification:develop`, `approval:route` | Senior Civil Engineers |
| **Final Approval** | `design:approve_final` | Civil Engineering Managers, Chief Engineers |

### Construction Supervision Process

```
MOBILIZATION ────► CONSTRUCTION ────► INSPECTION ────► COMPLETION ────► HANDOVER
      ↓               ↓                 ↓              ↓              ↓
  Site Setup     Progress Monitoring   QA Checks    Final Inspection  Documentation
  (Site Engineer) (Civil Engineer)     (QA Engineer) (Manager)       (Coordinator)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **Mobilization** | `site:setup`, `equipment:verify` | Civil Engineers, Site Inspectors |
| **Construction** | `construction:supervise`, `method:verify` | Senior Civil Engineers, Project Engineers |
| **Progress Monitoring** | `progress:monitor`, `reporting:submit` | Civil Engineers, Technicians |
| **Quality Inspection** | `inspection:conduct`, `nonconformance:document` | QA/QC Engineers, Civil Engineers |
| **Completion** | `completion:certify`, `asbuilt:verify` | Civil Engineers, Surveyors |
| **Handover** | `handover:approve`, `documentation:finalize` | Civil Engineering Managers |

### Quality Assurance Process

```
PLANNING ────► IMPLEMENTATION ────► MONITORING ────► CORRECTIVE ACTION ────► CERTIFICATION
    ↓             ↓                     ↓                ↓                     ↓
  QA Plan      Procedures Setup      Inspection       Nonconformance       Final Approval
  (QA Engineer) (QA Engineer)        (Inspector)      (QA Engineer)         (Manager)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **QA Planning** | `qa:plan`, `procedure:develop` | QA/QC Engineers |
| **Implementation** | `qa:implement`, `training:conduct` | QA/QC Engineers, Civil Engineers |
| **Monitoring** | `inspection:conduct`, `data:collect` | QA/QC Engineers, Site Inspectors |
| **Corrective Action** | `nonconformance:identify`, `action:implement` | QA/QC Engineers, Civil Engineers |
| **Certification** | `quality:certify`, `compliance:verify` | QA/QC Engineers, Managers |

---

## Database Schema Integration

### Civil Engineering-Specific Tables

```sql
-- Civil engineering design records
CREATE TABLE public.civil_engineering_designs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  project_id uuid NOT NULL,
  design_type text NOT NULL,
  designer_id text NOT NULL,
  reviewer_id text,
  approver_id text,
  design_status text DEFAULT 'draft',
  revision_number integer DEFAULT 0,
  drawing_numbers text[],
  specification_reference text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT civil_engineering_designs_pkey PRIMARY KEY (id)
);

-- Civil engineering inspections
CREATE TABLE public.civil_engineering_inspections (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  project_id uuid NOT NULL,
  inspection_type text NOT NULL,
  inspector_id text NOT NULL,
  location text,
  inspection_date timestamp with time zone,
  findings jsonb,
  recommendations jsonb,
  severity_level text,
  corrective_action_required boolean DEFAULT false,
  follow_up_date date,
  status text DEFAULT 'open',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT civil_engineering_inspections_pkey PRIMARY KEY (id)
);

-- Civil engineering survey records
CREATE TABLE public.civil_engineering_surveys (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  project_id uuid NOT NULL,
  survey_type text NOT NULL,
  surveyor_id text NOT NULL,
  survey_date timestamp with time zone,
  control_points jsonb,
  measurements jsonb,
  accuracy_achieved numeric,
  equipment_used text,
  weather_conditions text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT civil_engineering_surveys_pkey PRIMARY KEY (id)
);

-- Civil engineering materials testing
CREATE TABLE public.civil_engineering_materials_testing (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  project_id uuid NOT NULL,
  material_type text NOT NULL,
  test_type text NOT NULL,
  technician_id text NOT NULL,
  sample_id text NOT NULL,
  test_date timestamp with time zone,
  test_results jsonb,
  specification_reference text,
  compliance_status text,
  approved_by text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT civil_engineering_materials_testing_pkey PRIMARY KEY (id)
);

-- Civil engineering quality assurance
CREATE TABLE public.civil_engineering_qa_records (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  project_id uuid NOT NULL,
  qa_activity text NOT NULL,
  qa_engineer_id text NOT NULL,
  activity_date timestamp with time zone,
  checklist_used text,
  findings jsonb,
  nonconformance_count integer DEFAULT 0,
  corrective_actions jsonb,
  approval_status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT civil_engineering_qa_records_pkey PRIMARY KEY (id)
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on civil engineering tables
ALTER TABLE civil_engineering_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE civil_engineering_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE civil_engineering_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE civil_engineering_materials_testing ENABLE ROW LEVEL SECURITY;
ALTER TABLE civil_engineering_qa_records ENABLE ROW LEVEL SECURITY;

-- Civil engineering department access policy
CREATE POLICY "civil_engineering_department_access" ON civil_engineering_designs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '00850'
    )
  );

-- Project-based access for designs
CREATE POLICY "design_project_access" ON civil_engineering_designs
  FOR SELECT USING (
    designer_id = auth.uid()::text OR
    reviewer_id = auth.uid()::text OR
    approver_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '00850'
      AND level >= 2
    )
  );

-- Inspection access policy
CREATE POLICY "inspection_access" ON civil_engineering_inspections
  FOR ALL USING (
    inspector_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '00850'
    )
  );

-- Survey access policy
CREATE POLICY "survey_access" ON civil_engineering_surveys
  FOR ALL USING (
    surveyor_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '00850'
    )
  );

-- Materials testing access policy
CREATE POLICY "materials_testing_access" ON civil_engineering_materials_testing
  FOR ALL USING (
    technician_id = auth.uid()::text OR
    approved_by = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '00850'
    )
  );

-- QA records access policy
CREATE POLICY "qa_records_access" ON civil_engineering_qa_records
  FOR ALL USING (
    qa_engineer_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '00850'
      AND level >= 2
    )
  );
```

---

## Role Assignment Guidelines

### Automatic Role Assignment

1. **Department-Based Assignment**
   - Users in department 00850 automatically get base civil engineering permissions
   - Level 1: Civil Engineering Technician or Site Inspector roles
   - Level 2: Civil Engineer or Specialist roles
   - Level 3+: Civil Engineering Manager or Chief Engineer roles

2. **Specialization-Based Assignment**
   - **Structural focus**: Structural Engineer roles
   - **Geotechnical focus**: Geotechnical Engineer roles
   - **Surveying focus**: Surveyor roles
   - **QA focus**: QA/QC Engineer roles
   - **Materials focus**: Materials Engineer roles

3. **Project-Based Permissions**
   - Project civil engineers get additional project-specific permissions
   - Site inspectors get location-specific access
   - Surveyors get project area access

### Manual Role Assignment

- **Chief Civil Engineer** assigns specialized roles (Project Civil Engineer, Geotechnical Manager)
- **Department Heads** can request civil engineering role elevations for their team members
- **Governance Team** approves all civil engineering role assignment requests

---

## Civil Engineering-Specific Security Requirements

### Data Classification

| Data Type | Classification | Access Requirements |
|-----------|----------------|-------------------|
| **Engineering Designs** | Restricted | Civil Engineering department + project team |
| **Survey Data** | Internal | Civil Engineering department |
| **Materials Test Results** | Internal | Civil Engineering + Quality departments |
| **QA/QC Records** | Internal | Civil Engineering department |
| **Geotechnical Reports** | Restricted | Civil Engineering + management |

### Audit Logging Requirements

All civil engineering operations must be logged:

```sql
CREATE TABLE public.civil_engineering_audit_log (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id text NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  project_id uuid,
  ip_address inet,
  user_agent text,
  timestamp timestamp with time zone DEFAULT now()
);
```

### Compliance Monitoring

- **Weekly design review reports** to Civil Engineering Manager
- **Monthly QA/QC compliance reports** to Chief Civil Engineer
- **Quarterly surveying accuracy audits**
- **Annual materials testing certification reviews**
- **Real-time monitoring** of critical design approvals

---

## Implementation Checklist

### Phase 1: Core Civil Engineering Permissions
- [ ] Create civil engineering-specific user roles in user_roles table
- [ ] Implement department-based automatic role assignment
- [ ] Add RLS policies to civil engineering tables
- [ ] Create civil engineering audit logging system

### Phase 2: Workflow Integration
- [ ] Integrate design development permissions
- [ ] Implement construction supervision workflows
- [ ] Add QA/QC process permissions
- [ ] Create surveying and measurement access controls

### Phase 3: Advanced Features
- [ ] Implement geotechnical analysis permissions
- [ ] Add materials testing automation
- [ ] Create structural analysis access controls
- [ ] Develop civil engineering performance dashboards

---

## Related Documentation

- [create_project_engineering_templates_table.sql](../sql/create_project_engineering_templates_table.sql) - Civil engineering templates
- [00850 Civil Engineering Standards](./00850-civil-engineering-standards.md) - Department standards
- [00000_MASTER_ROLES_PERMISSIONS_INDEX.md](../00000_MASTER_ROLES_PERMISSIONS_INDEX.md) - Master security index

---

## Version History

- **v1.0 (2025-12-11)**: Initial civil engineering roles and permissions framework
  - Defined comprehensive civil engineering role hierarchy
  - Integrated design, construction, and QA permissions
  - Added RLS policies for civil engineering data security
  - Created workflow-based permission assignments
