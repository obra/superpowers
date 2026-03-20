# 01500_HUMAN_RESOURCES_ROLES_PERMISSIONS.md

## Human Resources Department - Roles & Permissions

### Status
- [x] Initial draft
- [x] Security review required
- [x] Governance approval pending
- [x] Implementation completed

### Version History
- v1.0 (2025-12-11): Initial roles and permissions framework for Human Resources department

---

## Overview

This document defines the roles, permissions, and access control framework for the Human Resources (01500) department. The department handles talent acquisition, candidate evaluation, recruitment management, and CV processing workflows including AI-powered candidate assessment and job description management.

### Integration with Existing Security Infrastructure

The Human Resources department integrates with the existing security framework:

- **RLS Security Dashboard**: `client/src/pages/02050-information-technology/components/RLSSecurityDashboard.jsx`
- **Schema Dashboard**: `client/src/pages/02050-information-technology/components/SchemaDashboard.jsx`
- **User Roles Table**: `public.user_roles` with department_code = '01500'
- **CV Processing**: AI-powered candidate analysis via `server/routes/cv-analysis-routes.js`
- **Document Processing**: CV import and analysis via `client/src/pages/01500-human-resources/components/modals/01500-CVImportModal.js`

---

## Core Roles & Permissions Matrix

### 1. HR Leadership Roles (Level 3-4)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **HR Director** | 01500 | 4 | `hr:*`, `recruitment:approve_final`, `employee:manage_strategic`, `compliance:oversee` | Executive HR leadership and strategic workforce planning |
| **HR Manager** | 01500 | 3 | `hr:manage`, `recruitment:approve`, `employee:manage`, `talent:strategic` | Department-level HR management and recruitment oversight |
| **Talent Acquisition Manager** | 01500 | 3 | `recruitment:*`, `cv:analyze`, `job:create`, `interview:manage` | Specialized recruitment and talent acquisition management |

### 2. HR Operations Roles (Level 2-3)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **HR Coordinator** | 01500 | 2 | `employee:onboard`, `recruitment:coordinate`, `compliance:monitor`, `training:coordinate` | Day-to-day HR operations and onboarding |
| **Recruitment Specialist** | 01500 | 2 | `cv:process`, `job:manage`, `candidate:screen`, `interview:schedule` | Specialist recruitment activities and candidate processing |
| **HR Business Partner** | 01500 | 2 | `employee:manage_dept`, `performance:review`, `training:recommend`, `policy:implement` | Department-specific HR support and employee relations |

### 3. HR Specialist Roles (Level 2)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **CV Analyst** | 01500 | 2 | `cv:analyze`, `candidate:evaluate`, `assessment:conduct`, `report:generate` | AI-assisted CV analysis and candidate assessment |
| **Job Description Specialist** | 01500 | 2 | `job:create`, `job:edit`, `job:publish`, `requirements:define` | Job description creation and management |
| **Recruitment Coordinator** | 01500 | 2 | `candidate:manage`, `interview:coordinate`, `offer:prepare`, `onboarding:initiate` | End-to-end recruitment coordination |

### 4. HR Support Roles (Level 1-2)

| Role | Department Code | Level | Permissions | Description |
|------|----------------|-------|-------------|-------------|
| **HR Assistant** | 01500 | 1 | `candidate:view`, `cv:view`, `job:view`, `document:prepare` | Administrative support for HR operations |
| **Recruitment Assistant** | 01500 | 1 | `cv:import`, `candidate:contact`, `schedule:support`, `data:entry` | Administrative support for recruitment activities |
| **Onboarding Coordinator** | 01500 | 1 | `employee:prepare_docs`, `training:schedule`, `compliance:verify`, `welcome:manage` | New hire onboarding coordination |

---

## Permission Definitions

### Core HR Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `hr:manage` | Full HR department management | HR Managers, Directors |
| `hr:coordinate` | HR operational coordination | HR Coordinators |
| `hr:view` | View HR information | All HR roles |
| `hr:report` | Generate HR reports | HR Officers, Managers |

### Recruitment & Talent Acquisition Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `recruitment:manage` | Full recruitment lifecycle management | Recruitment Managers, Specialists |
| `recruitment:coordinate` | Recruitment coordination and support | HR Coordinators, Assistants |
| `recruitment:approve` | Approve recruitment decisions | HR Managers |
| `recruitment:approve_final` | Final hiring approval authority | HR Directors |
| `talent:strategic` | Strategic talent planning and acquisition | HR Managers, Directors |

### CV Processing & Analysis Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `cv:process` | Import and process CV documents | Recruitment Specialists, Assistants |
| `cv:analyze` | Use AI-powered CV analysis | CV Analysts, Recruitment Specialists |
| `cv:view` | View CV documents and analysis | All HR roles |
| `cv:export` | Export CV data and reports | HR Specialists, Managers |
| `cv:anonymize` | Handle anonymized CV data | CV Analysts |

### Job Description Management Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `job:create` | Create new job descriptions | Job Description Specialists, Managers |
| `job:edit` | Edit existing job descriptions | Job Description Specialists, Managers |
| `job:delete` | Delete job descriptions | HR Managers |
| `job:publish` | Publish job descriptions | Recruitment Specialists, Managers |
| `job:archive` | Archive job descriptions | HR Managers |
| `job:approve` | Approve job descriptions | HR Managers |

### Candidate Management Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `candidate:view` | View candidate information | All HR roles |
| `candidate:screen` | Initial candidate screening | Recruitment Specialists, Coordinators |
| `candidate:evaluate` | Detailed candidate evaluation | CV Analysts, Specialists |
| `candidate:contact` | Contact candidates | Recruitment Assistants, Coordinators |
| `candidate:manage` | Full candidate lifecycle management | Recruitment Specialists, Managers |
| `candidate:shortlist` | Create and manage shortlists | Recruitment Coordinators, Specialists |

### Interview & Assessment Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `interview:schedule` | Schedule interviews | Recruitment Coordinators, Specialists |
| `interview:conduct` | Conduct interviews | Recruitment Specialists, Managers |
| `interview:evaluate` | Evaluate interview results | HR Specialists, Managers |
| `assessment:design` | Design assessment processes | CV Analysts, Specialists |
| `assessment:conduct` | Conduct candidate assessments | Recruitment Specialists |
| `assessment:score` | Score assessment results | CV Analysts, Managers |

### Employee Management Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `employee:view` | View employee information | All HR roles |
| `employee:manage` | Employee data management | HR Coordinators, Managers |
| `employee:manage_dept` | Department-specific employee management | HR Business Partners |
| `employee:manage_strategic` | Strategic employee management | HR Directors, Managers |
| `employee:onboard` | Employee onboarding management | HR Coordinators, Onboarding Coordinators |
| `employee:offboard` | Employee offboarding management | HR Coordinators, Managers |

### Compliance & Policy Permissions

| Permission | Description | Applies To |
|------------|-------------|------------|
| `compliance:monitor` | Monitor HR compliance | HR Coordinators, Specialists |
| `compliance:audit` | Conduct HR audits | HR Managers |
| `compliance:report` | Report compliance issues | All HR roles |
| `policy:implement` | Implement HR policies | HR Business Partners, Managers |
| `policy:review` | Review and update policies | HR Directors, Managers |

---

## HR Workflow Permissions

### Recruitment Process

```
JOB CREATION ────► CV IMPORT ────► AI ANALYSIS ────► SCREENING ────► INTERVIEW ────► OFFER ────► ONBOARDING
      ↓               ↓             ↓                ↓              ↓              ↓            ↓
   Job Specialist  Recruitment   CV Analyst     Coordinator     Manager        Director     Coordinator
   (job:create)    Assistant     (cv:analyze)   (candidate:     (interview:    (recruitment: (employee:
                 (cv:import)                  screen)         conduct)       approve)      onboard)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **Job Creation** | `job:create`, `requirements:define` | Job Description Specialists |
| **CV Import** | `cv:process`, `cv:import` | Recruitment Assistants |
| **AI Analysis** | `cv:analyze`, `assessment:conduct` | CV Analysts |
| **Initial Screening** | `candidate:screen`, `cv:view` | Recruitment Coordinators |
| **Detailed Evaluation** | `candidate:evaluate`, `candidate:shortlist` | Recruitment Specialists |
| **Interview Scheduling** | `interview:schedule`, `candidate:contact` | Recruitment Coordinators |
| **Interview Conduct** | `interview:conduct`, `assessment:score` | Recruitment Specialists/Managers |
| **Final Approval** | `recruitment:approve_final` | HR Directors |
| **Offer Preparation** | `offer:prepare`, `candidate:manage` | Recruitment Coordinators |
| **Onboarding** | `employee:onboard`, `training:schedule` | Onboarding Coordinators |

### CV Processing Workflow

```
CV UPLOAD ────► TEXT EXTRACTION ────► AI ANALYSIS ────► MANUAL REVIEW ────► SCORING ────► REPORTING
    ↓              ↓                     ↓                 ↓                ↓            ↓
Import Modal    CV Processor        OpenAI API       CV Analyst      Scoring         HR Reports
(cv:process)    (cv:analyze)       (gpt-4o-mini)   (candidate:     Algorithm      (hr:report)
                                               evaluate)        (assessment:
                                                                score)
```

| Stage | Permissions Required | Responsible Roles |
|-------|---------------------|-------------------|
| **CV Upload** | `cv:process`, `cv:import` | Recruitment Assistants |
| **Text Extraction** | `cv:process` | System (CV Import Modal) |
| **AI Analysis** | `cv:analyze` | CV Analysts (via API) |
| **Manual Review** | `candidate:evaluate`, `cv:view` | Recruitment Specialists |
| **Scoring & Ranking** | `assessment:score`, `candidate:shortlist` | CV Analysts |
| **Reporting** | `hr:report`, `cv:export` | HR Specialists, Managers |

---

## Database Schema Integration

### HR-Specific Tables

```sql
-- Job descriptions table
CREATE TABLE public.job_descriptions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  title text NOT NULL,
  department text NOT NULL,
  location text,
  employment_type text DEFAULT 'full-time',
  salary_range_min numeric,
  salary_range_max numeric,
  job_description text,
  requirements text,
  responsibilities text,
  benefits text,
  application_deadline date,
  contact_person text,
  status text DEFAULT 'draft',
  created_by text NOT NULL,
  updated_by text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_descriptions_pkey PRIMARY KEY (id)
);

-- CV applications table
CREATE TABLE public.cv_applications (
  id text NOT NULL,
  applicant_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  position_applied text NOT NULL,
  department text NOT NULL,
  experience_level text,
  years_experience integer,
  application_date date,
  status text DEFAULT 'received',
  cv_file text,
  cover_letter text,
  rating numeric(3,1),
  notes text,
  interview_date date,
  salary_expectation integer,
  availability text,
  skills jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cv_applications_pkey PRIMARY KEY (id)
);

-- CV analysis results table
CREATE TABLE public.cv_analyses (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  candidate_name text,
  position_applied text,
  experience_level text,
  years_experience integer,
  job_title text,
  job_department text,
  overall_rating numeric(3,1),
  analysis_data jsonb,
  ai_model text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cv_analyses_pkey PRIMARY KEY (id)
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on HR tables
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_analyses ENABLE ROW LEVEL SECURITY;

-- HR department access policy
CREATE POLICY "hr_department_access" ON job_descriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '01500'
    )
  );

-- CV applications access policy
CREATE POLICY "hr_cv_access" ON cv_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '01500'
      AND level >= 1
    )
  );

-- CV analysis results access policy
CREATE POLICY "hr_cv_analysis_access" ON cv_analyses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND department_code = '01500'
      AND level >= 2
    )
  );

-- Job description publishing policy (published jobs visible to all authenticated users)
CREATE POLICY "published_jobs_view" ON job_descriptions
  FOR SELECT USING (status = 'active' OR auth.role() = 'authenticated');
```

---

## Role Assignment Guidelines

### Automatic Role Assignment

1. **Department-Based Assignment**
   - Users in department 01500 automatically get base HR permissions
   - Level 1: HR Assistant or Recruitment Assistant roles
   - Level 2: HR Coordinator or Recruitment Specialist roles
   - Level 3+: HR Manager or Director roles

2. **Specialization-Based Assignment**
   - **Recruitment focus**: Recruitment Specialist/Manager roles
   - **CV Analysis focus**: CV Analyst roles
   - **Job Description focus**: Job Description Specialist roles
   - **Employee Relations focus**: HR Business Partner roles

3. **Workflow-Based Permissions**
   - Recruitment Coordinators get full recruitment pipeline permissions
   - CV Analysts get specialized analysis and AI tool permissions
   - Onboarding Coordinators get focused new hire permissions

### Manual Role Assignment

- **HR Director** assigns specialized roles (Talent Acquisition Manager, HR Manager)
- **Department Heads** can request HR Business Partner assignments for their teams
- **Governance Team** approves all HR role assignment requests

---

## HR-Specific Security Requirements

### Data Classification

| Data Type | Classification | Access Requirements |
|-----------|----------------|-------------------|
| **CV Documents** | Confidential | HR department only, anonymized for analysis |
| **Candidate PII** | Restricted | HR department, compliance with data protection |
| **Interview Notes** | Confidential | Hiring team only |
| **Salary Information** | Restricted | HR Managers, Finance (limited) |
| **Job Descriptions** | Internal | All employees (published), HR full access |

### CV Analysis Security

- **Anonymization**: CV data anonymized before AI analysis
- **API Security**: OpenAI API calls secured with environment variables
- **Audit Logging**: All CV analysis operations logged with user context
- **Data Retention**: CV analysis results retained per compliance requirements

### Audit Logging Requirements

All HR operations must be logged:

```sql
CREATE TABLE public.hr_audit_log (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id text NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  department_code text DEFAULT '01500',
  timestamp timestamp with time zone DEFAULT now()
);
```

### Compliance Monitoring

- **Monthly recruitment metrics** reports to HR Director
- **Quarterly compliance audits** of CV processing and data handling
- **Annual privacy impact assessments** for HR data systems
- **Real-time monitoring** of CV analysis API usage

---

## Implementation Checklist

### Phase 1: Core HR Permissions
- [x] Create HR-specific user roles in user_roles table
- [x] Implement department-based automatic role assignment
- [x] Add RLS policies to HR tables
- [x] Create HR audit logging system
- [x] Set up CV analysis API security

### Phase 2: Workflow Integration
- [x] Integrate recruitment pipeline permissions
- [x] Implement CV processing and analysis workflows
- [x] Add job description management permissions
- [x] Create candidate evaluation system

### Phase 3: Advanced Features
- [x] Implement AI-powered CV analysis permissions
- [x] Add advanced reporting and analytics access
- [x] Create automated compliance monitoring
- [x] Develop recruitment dashboard with role-based views

---

## Related Documentation

- [01300_01300_TEMPLATE_MANAGEMENT_ROLES_PERMISSIONS.md](./01300_01300_TEMPLATE_MANAGEMENT_ROLES_PERMISSIONS.md) - HR template permissions
- [client/src/pages/01500-human-resources/components/01500-cv-processing-page.js](../client/src/pages/01500-human-resources/components/01500-cv-processing-page.js) - CV processing interface
- [server/routes/cv-analysis-routes.js](../server/routes/cv-analysis-routes.js) - CV analysis API
- [0000_MASTER_ROLES_PERMISSIONS_INDEX.md](../0000_MASTER_ROLES_PERMISSIONS_INDEX.md) - Master security index

---

## Version History

- **v1.0 (2025-12-11)**: Initial HR roles and permissions framework
  - Defined comprehensive HR role hierarchy
  - Integrated CV processing and AI analysis permissions
  - Added recruitment workflow permissions
  - Created RLS policies for HR data security
