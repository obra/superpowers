# Contractors and Consultants Category Structure Proposal

## Executive Summary

This document proposes restructuring the `contractors` and `consultants` tables to follow the same hierarchical category pattern established for `suppliers` with `procurement_categories`. This will create a unified, scalable approach for managing all external service providers across the Construct AI platform.

## Current State Analysis

### Suppliers Table (Current Implementation)
```sql
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    vat_number VARCHAR(50),
    company_registration VARCHAR(50),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    account_holder VARCHAR(255),
    swift_code VARCHAR(50),
    iban VARCHAR(100),
    approval_status VARCHAR(20) DEFAULT 'pending',
    organization_id UUID NOT NULL,
    category_id UUID,  -- Links to procurement_categories
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT fk_suppliers_category FOREIGN KEY (category_id) 
        REFERENCES procurement_categories(id) ON DELETE SET NULL
);
```

**Key Features:**
- Single `category_id` field linking to `procurement_categories`
- Hierarchical category system (4 levels)
- Organization-scoped
- Approval workflow support

### Contractors Table (Current Implementation)
```sql
-- From create_test_data.sql
INSERT INTO contractors (
    id, name, contact_person, email, phone, website, 
    services_offered, license_number, insurance_status, 
    address, registration_date, approval_status, 
    compliance_status, last_activity, organization_id, scraped_at
)
```

**Issues:**
- No category relationship
- `services_offered` is free-text (not structured)
- No hierarchical classification
- Difficult to filter/search by service type
- No standardization across organizations

### Consultants Table (Current Implementation)
```sql
-- From fix-consultants-schema-fixed.sql
ALTER TABLE consultants
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS services_offered TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS insurance_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS certifications TEXT,
...
```

**Issues:**
- Similar to contractors - no category relationship
- `services_offered` and `certifications` are free-text
- No hierarchical classification
- Inconsistent with suppliers pattern

## Proposed Solution

### 1. Create Contractor Categories Table

```sql
-- Contractor Categories (similar to procurement_categories)
CREATE TABLE IF NOT EXISTS contractor_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID,
    hierarchy_level INTEGER NOT NULL CHECK (hierarchy_level IN (1, 2, 3, 4)),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255),  -- French translation for i18n
    description TEXT,
    
    -- Contractor-specific fields
    requires_license BOOLEAN DEFAULT false,
    requires_insurance BOOLEAN DEFAULT true,
    requires_safety_certification BOOLEAN DEFAULT false,
    cidb_registration_required BOOLEAN DEFAULT false,  -- South African CIDB
    minimum_cidb_level INTEGER,  -- Minimum CIDB grading level
    
    -- Standard fields
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Foreign keys
    CONSTRAINT fk_contractor_categories_parent 
        FOREIGN KEY (parent_id) 
        REFERENCES contractor_categories(id) ON DELETE CASCADE,
    CONSTRAINT fk_contractor_categories_organization 
        FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Unique constraint for code per organization
    CONSTRAINT uq_contractor_category_code_org 
        UNIQUE (code, organization_id)
);

-- Indexes
CREATE INDEX idx_contractor_categories_parent ON contractor_categories(parent_id);
CREATE INDEX idx_contractor_categories_org ON contractor_categories(organization_id);
CREATE INDEX idx_contractor_categories_level ON contractor_categories(hierarchy_level);
CREATE INDEX idx_contractor_categories_code ON contractor_categories(code);
CREATE INDEX idx_contractor_categories_active ON contractor_categories(is_active);

-- Comments
COMMENT ON TABLE contractor_categories IS 'Hierarchical contractor service categories with CIDB and licensing requirements';
COMMENT ON COLUMN contractor_categories.cidb_registration_required IS 'Whether CIDB registration is required for this category (South African Construction Industry Development Board)';
COMMENT ON COLUMN contractor_categories.minimum_cidb_level IS 'Minimum CIDB grading level required (1-9)';
```

### 2. Create Consultant Categories Table

```sql
-- Consultant Categories (similar to procurement_categories)
CREATE TABLE IF NOT EXISTS consultant_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID,
    hierarchy_level INTEGER NOT NULL CHECK (hierarchy_level IN (1, 2, 3, 4)),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255),  -- French translation for i18n
    description TEXT,
    
    -- Consultant-specific fields
    requires_professional_registration BOOLEAN DEFAULT true,
    registration_body VARCHAR(100),  -- e.g., 'ECSA', 'SACPCMP', 'SACNASP'
    requires_professional_indemnity BOOLEAN DEFAULT true,
    minimum_years_experience INTEGER DEFAULT 0,
    requires_cpd_compliance BOOLEAN DEFAULT true,  -- Continuing Professional Development
    
    -- Standard fields
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Foreign keys
    CONSTRAINT fk_consultant_categories_parent 
        FOREIGN KEY (parent_id) 
        REFERENCES consultant_categories(id) ON DELETE CASCADE,
    CONSTRAINT fk_consultant_categories_organization 
        FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Unique constraint for code per organization
    CONSTRAINT uq_consultant_category_code_org 
        UNIQUE (code, organization_id)
);

-- Indexes
CREATE INDEX idx_consultant_categories_parent ON consultant_categories(parent_id);
CREATE INDEX idx_consultant_categories_org ON consultant_categories(organization_id);
CREATE INDEX idx_consultant_categories_level ON consultant_categories(hierarchy_level);
CREATE INDEX idx_consultant_categories_code ON consultant_categories(code);
CREATE INDEX idx_consultant_categories_active ON consultant_categories(is_active);

-- Comments
COMMENT ON TABLE consultant_categories IS 'Hierarchical consultant service categories with professional registration requirements';
COMMENT ON COLUMN consultant_categories.registration_body IS 'Professional registration body (e.g., ECSA, SACPCMP, SACNASP)';
COMMENT ON COLUMN consultant_categories.requires_cpd_compliance IS 'Whether Continuing Professional Development compliance is required';
```

### 3. Update Contractors Table

```sql
-- Update contractors table to add category relationship
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD COLUMN IF NOT EXISTS cidb_registration VARCHAR(50),
ADD COLUMN IF NOT EXISTS cidb_level INTEGER CHECK (cidb_level BETWEEN 1 AND 9),
ADD COLUMN IF NOT EXISTS safety_certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'::jsonb;

-- Add foreign key to contractor_categories
ALTER TABLE contractors
ADD CONSTRAINT fk_contractors_category 
    FOREIGN KEY (category_id) 
    REFERENCES contractor_categories(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contractors_category ON contractors(category_id);
CREATE INDEX IF NOT EXISTS idx_contractors_cidb_level ON contractors(cidb_level);
CREATE INDEX IF NOT EXISTS idx_contractors_org_category ON contractors(organization_id, category_id);

-- Comments
COMMENT ON COLUMN contractors.category_id IS 'Links to contractor_categories for hierarchical service classification';
COMMENT ON COLUMN contractors.cidb_registration IS 'CIDB registration number (South African Construction Industry Development Board)';
COMMENT ON COLUMN contractors.cidb_level IS 'CIDB grading level (1-9, where 9 is highest)';
COMMENT ON COLUMN contractors.safety_certifications IS 'Array of safety certifications (e.g., ISO 45001, OHSAS 18001)';
COMMENT ON COLUMN contractors.specializations IS 'Array of specialized services within the category';
```

### 4. Update Consultants Table

```sql
-- Update consultants table to add category relationship
ALTER TABLE consultants
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD COLUMN IF NOT EXISTS professional_registration VARCHAR(100),
ADD COLUMN IF NOT EXISTS registration_body VARCHAR(100),
ADD COLUMN IF NOT EXISTS professional_indemnity_value DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpd_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS technical_expertise JSONB DEFAULT '[]'::jsonb;

-- Add foreign key to consultant_categories
ALTER TABLE consultants
ADD CONSTRAINT fk_consultants_category 
    FOREIGN KEY (category_id) 
    REFERENCES consultant_categories(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consultants_category ON consultants(category_id);
CREATE INDEX IF NOT EXISTS idx_consultants_registration_body ON consultants(registration_body);
CREATE INDEX IF NOT EXISTS idx_consultants_org_category ON consultants(organization_id, category_id);
CREATE INDEX IF NOT EXISTS idx_consultants_years_experience ON consultants(years_experience);

-- Comments
COMMENT ON COLUMN consultants.category_id IS 'Links to consultant_categories for hierarchical service classification';
COMMENT ON COLUMN consultants.professional_registration IS 'Professional registration number (e.g., ECSA, SACPCMP)';
COMMENT ON COLUMN consultants.registration_body IS 'Professional body (e.g., ECSA, SACPCMP, SACNASP, SAICE)';
COMMENT ON COLUMN consultants.professional_indemnity_value IS 'Professional indemnity insurance coverage amount';
COMMENT ON COLUMN consultants.cpd_status IS 'Continuing Professional Development compliance status';
COMMENT ON COLUMN consultants.technical_expertise IS 'Array of technical expertise areas within the category';
```

### 5. Create Many-to-Many Relationship Tables

Since contractors and consultants may offer services across multiple categories:

```sql
-- Contractor-Category Junction Table
CREATE TABLE IF NOT EXISTS contractor_category_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL,
    category_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    certification_status VARCHAR(50) DEFAULT 'pending',
    certification_date DATE,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_contractor_assignment_contractor 
        FOREIGN KEY (contractor_id) 
        REFERENCES contractors(id) ON DELETE CASCADE,
    CONSTRAINT fk_contractor_assignment_category 
        FOREIGN KEY (category_id) 
        REFERENCES contractor_categories(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate assignments
    CONSTRAINT uq_contractor_category_assignment 
        UNIQUE (contractor_id, category_id)
);

CREATE INDEX idx_contractor_assignments_contractor ON contractor_category_assignments(contractor_id);
CREATE INDEX idx_contractor_assignments_category ON contractor_category_assignments(category_id);
CREATE INDEX idx_contractor_assignments_primary ON contractor_category_assignments(is_primary);

COMMENT ON TABLE contractor_category_assignments IS 'Many-to-many relationship between contractors and service categories';

-- Consultant-Category Junction Table
CREATE TABLE IF NOT EXISTS consultant_category_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultant_id UUID NOT NULL,
    category_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    expertise_level VARCHAR(50) DEFAULT 'intermediate',  -- basic, intermediate, advanced, expert
    certification_status VARCHAR(50) DEFAULT 'pending',
    certification_date DATE,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_consultant_assignment_consultant 
        FOREIGN KEY (consultant_id) 
        REFERENCES consultants(id) ON DELETE CASCADE,
    CONSTRAINT fk_consultant_assignment_category 
        FOREIGN KEY (category_id) 
        REFERENCES consultant_categories(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate assignments
    CONSTRAINT uq_consultant_category_assignment 
        UNIQUE (consultant_id, category_id),
    
    -- Check constraint for expertise level
    CONSTRAINT chk_expertise_level 
        CHECK (expertise_level IN ('basic', 'intermediate', 'advanced', 'expert'))
);

CREATE INDEX idx_consultant_assignments_consultant ON consultant_category_assignments(consultant_id);
CREATE INDEX idx_consultant_assignments_category ON consultant_category_assignments(category_id);
CREATE INDEX idx_consultant_assignments_primary ON consultant_category_assignments(is_primary);
CREATE INDEX idx_consultant_assignments_expertise ON consultant_category_assignments(expertise_level);

COMMENT ON TABLE consultant_category_assignments IS 'Many-to-many relationship between consultants and service categories';
```

## Hierarchical Category Structure Examples

### Contractor Categories Hierarchy

```
Level 1: Construction Services (00100)
├── Level 2: Building Construction (00110)
│   ├── Level 3: Residential Construction (00111)
│   │   ├── Level 4: Single Family Homes (00111-SF)
│   │   ├── Level 4: Multi-Family Units (00111-MF)
│   │   └── Level 4: Townhouses (00111-TH)
│   └── Level 3: Commercial Construction (00112)
│       ├── Level 4: Office Buildings (00112-OF)
│       ├── Level 4: Retail Spaces (00112-RT)
│       └── Level 4: Industrial Facilities (00112-IN)
├── Level 2: Civil Engineering (00120)
│   ├── Level 3: Roads and Highways (00121)
│   │   ├── Level 4: Road Construction (00121-RC)
│   │   ├── Level 4: Bridge Construction (00121-BC)
│   │   └── Level 4: Pavement Rehabilitation (00121-PR)
│   └── Level 3: Water Infrastructure (00122)
│       ├── Level 4: Water Treatment Plants (00122-WT)
│       ├── Level 4: Sewerage Systems (00122-SS)
│       └── Level 4: Stormwater Drainage (00122-SD)
└── Level 2: Specialized Trades (00130)
    ├── Level 3: Electrical (00131)
    │   ├── Level 4: Power Distribution (00131-PD)
    │   ├── Level 4: Lighting Systems (00131-LS)
    │   └── Level 4: Emergency Systems (00131-ES)
    └── Level 3: Mechanical (00132)
        ├── Level 4: HVAC Systems (00132-HV)
        ├── Level 4: Plumbing (00132-PL)
        └── Level 4: Fire Protection (00132-FP)
```

### Consultant Categories Hierarchy

```
Level 1: Engineering Services (01000)
├── Level 2: Civil Engineering (01100)
│   ├── Level 3: Structural Engineering (01110)
│   │   ├── Level 4: Building Structures (01110-BS)
│   │   ├── Level 4: Bridge Design (01110-BD)
│   │   └── Level 4: Seismic Analysis (01110-SA)
│   └── Level 3: Geotechnical Engineering (01120)
│       ├── Level 4: Soil Investigation (01120-SI)
│       ├── Level 4: Foundation Design (01120-FD)
│       └── Level 4: Slope Stability (01120-SS)
├── Level 2: Mechanical Engineering (01200)
│   ├── Level 3: HVAC Design (01210)
│   │   ├── Level 4: Commercial HVAC (01210-CH)
│   │   ├── Level 4: Industrial HVAC (01210-IH)
│   │   └── Level 4: Clean Room Systems (01210-CR)
│   └── Level 3: Plumbing Design (01220)
│       ├── Level 4: Water Supply (01220-WS)
│       ├── Level 4: Drainage Systems (01220-DS)
│       └── Level 4: Fire Protection (01220-FP)
└── Level 2: Electrical Engineering (01300)
    ├── Level 3: Power Systems (01310)
    │   ├── Level 4: Distribution Design (01310-DD)
    │   ├── Level 4: Substation Design (01310-SD)
    │   └── Level 4: Renewable Energy (01310-RE)
    └── Level 3: Control Systems (01320)
        ├── Level 4: Building Automation (01320-BA)
        ├── Level 4: Industrial Control (01320-IC)
        └── Level 4: Security Systems (01320-SS)

Level 1: Professional Services (02000)
├── Level 2: Architecture (02100)
│   ├── Level 3: Building Design (02110)
│   │   ├── Level 4: Residential Architecture (02110-RA)
│   │   ├── Level 4: Commercial Architecture (02110-CA)
│   │   └── Level 4: Industrial Architecture (02110-IA)
│   └── Level 3: Interior Design (02120)
│       ├── Level 4: Office Interiors (02120-OI)
│       ├── Level 4: Retail Interiors (02120-RI)
│       └── Level 4: Hospitality Interiors (02120-HI)
└── Level 2: Project Management (02200)
    ├── Level 3: Construction Management (02210)
    │   ├── Level 4: Residential Projects (02210-RP)
    │   ├── Level 4: Commercial Projects (02210-CP)
    │   └── Level 4: Infrastructure Projects (02210-IP)
    └── Level 3: Program Management (02220)
        ├── Level 4: Multi-Project Coordination (02220-MP)
        ├── Level 4: Portfolio Management (02220-PM)
        └── Level 4: Strategic Planning (02220-SP)
```

## Sample Data Population

### Contractor Categories

```sql
-- Level 1: Construction Services
INSERT INTO contractor_categories (code, name, name_fr, hierarchy_level, description, requires_license, requires_insurance, cidb_registration_required, minimum_cidb_level, is_active, organization_id) VALUES
('00100', 'Construction Services', 'Services de Construction', 1, 'General construction and building services', true, true, true, 1, true, NULL);

-- Level 2: Building Construction
INSERT INTO contractor_categories (parent_id, code, name, name_fr, hierarchy_level, description, requires_license, requires_insurance, cidb_registration_required, minimum_cidb_level, is_active, organization_id)
SELECT id, '00110', 'Building Construction', 'Construction de Bâtiments', 2, 'Residential and commercial building construction', true, true, true, 3, true, NULL
FROM contractor_categories WHERE code = '00100';

-- Level 3: Residential Construction
INSERT INTO contractor_categories (parent_id, code, name, name_fr, hierarchy_level, description, requires_license, requires_insurance, cidb_registration_required, minimum_cidb_level, is_active, organization_id)
SELECT id, '00111', 'Residential Construction', 'Construction Résidentielle', 3, 'Single and multi-family residential construction', true, true, true, 4, true, NULL
FROM contractor_categories WHERE code = '00110';

-- Level 4: Single Family Homes
INSERT INTO contractor_categories (parent_id, code, name, name_fr, hierarchy_level, description, requires_license, requires_insurance, cidb_registration_required, minimum_cidb_level, is_active, organization_id)
SELECT id, '00111-SF', 'Single Family Homes', 'Maisons Unifamiliales', 4, 'Construction of single family residential homes', true, true, true, 4, true, NULL
FROM contractor_categories WHERE code = '00111';
```

### Consultant Categories

```sql
-- Level 1: Engineering Services
INSERT INTO consultant_categories (code, name, name_fr, hierarchy_level, description, requires_professional_registration, registration_body, requires_professional_indemnity, minimum_years_experience, is_active, organization_id) VALUES
('01000', 'Engineering Services', 'Services d''Ingénierie', 1, 'Professional engineering consulting services', true, 'ECSA', true, 5, true, NULL);

-- Level 2: Civil Engineering
INSERT INTO consultant_categories (parent_id, code, name, name_fr, hierarchy_level, description, requires_professional_registration, registration_body, requires_professional_indemnity, minimum_years_experience, is_active, organization_id)
SELECT id, '01100', 'Civil Engineering', 'Génie Civil', 2, 'Civil engineering design and consulting', true, 'ECSA', true, 7, true, NULL
FROM consultant_categories WHERE code = '01000';

-- Level 3: Structural Engineering
INSERT INTO consultant_categories (parent_id, code, name, name_fr, hierarchy_level, description, requires_professional_registration, registration_body, requires_professional_indemnity, minimum_years_experience, is_active, organization_id)
SELECT id, '01110', 'Structural Engineering', 'Ingénierie Structurelle', 3, 'Structural design and analysis services', true, 'ECSA', true, 10, true, NULL
FROM consultant_categories WHERE code = '01100';

-- Level 4: Building Structures
INSERT INTO consultant_categories (parent_id, code, name, name_fr, hierarchy_level, description, requires_professional_registration, registration_body, requires_professional_indemnity, minimum_years_experience, is_active, organization_id)
SELECT id, '01110-BS', 'Building Structures', 'Structures de Bâtiments', 4, 'Structural design for buildings', true, 'ECSA', true, 10, true, NULL
FROM consultant_categories WHERE code = '01110';
```

## Benefits of This Approach

### 1. **Consistency Across Entity Types**
- Suppliers, contractors, and consultants all use the same hierarchical pattern
- Unified data model makes development and maintenance easier
- Consistent UI/UX across all entity management screens

### 2. **Improved Search and Filtering**
- Filter contractors by service category hierarchy
- Search consultants by professional specialization
- Advanced queries using category relationships

### 3. **Better Compliance Management**
- Category-specific requirements (licenses, certifications, insurance)
- Automated compliance checking based on category rules
- Audit trails for regulatory compliance

### 4. **Scalability**
- Easy to add new categories without schema changes
- Support for organization-specific categories
- Multi-level hierarchy supports complex classification needs

### 5. **Enhanced Reporting**
- Category-based analytics and reporting
- Service provider distribution by category
- Compliance status by category

### 6. **Integration with Workflows**
- NANOBOT outreach workflows can target specific categories
- Automated matching of requirements to service providers
- Category-based approval workflows

## Migration Strategy

### Phase 1: Create New Tables (Week 1)
1. Create `contractor_categories` table
2. Create `consultant_categories` table
3. Create junction tables for many-to-many relationships
4. Populate with initial category hierarchy

### Phase 2: Update Existing Tables (Week 2)
1. Add `category_id` columns to contractors and consultants
2. Add category-specific fields (CIDB, professional registration, etc.)
3. Create indexes for performance
4. Update triggers and functions

### Phase 3: Data Migration (Week 3)
1. Parse existing `services_offered` text fields
2. Map to appropriate categories
3. Create category assignments
4. Validate data integrity

### Phase 4: Update Application Code (Week 4)
1. Update API endpoints to support category filtering
2. Modify UI components for category selection
3. Update search and filter logic
4. Implement category-based validation

### Phase 5: Testing and Rollout (Week 5)
1. Comprehensive testing of new structure
2. User acceptance testing
3. Documentation updates
4. Production deployment

## API Endpoint Examples

### Get Contractors by Category
```javascript
GET /api/contractors?category_id=00111-SF&organization_id=org-123
GET /api/contractors?category_code=00111-SF&include_subcategories=true
```

### Get Consultants by Professional Registration
```javascript
GET /api/consultants?registration_body=ECSA&category_id=01110
GET /api/consultants?category_code=01110-BS&min_experience=10
```

### Get Category Hierarchy
```javascript
GET /api/contractor-categories/hierarchy
GET /api/consultant-categories/hierarchy?parent_id=01000
```

### Search with Category Filters
```javascript
POST /api/contractors/search
{
  "category_codes": ["00111-SF", "00111-MF"],
  "cidb_level_min": 4,
  "approval_status": "approved",
  "organization_id": "org-123"
}
```

## Conclusion

This proposal creates a unified, scalable approach for managing suppliers, contractors, and consultants using hierarchical category structures. The implementation:

1. **Maintains consistency** with the existing suppliers/procurement_categories pattern
2. **Adds domain-specific fields** for contractors (CIDB) and consultants (professional registration)
3. **Supports many-to-many relationships** for entities offering multiple services
4. **Enables advanced filtering and search** capabilities
5. **Facilitates compliance management** through category-specific requirements
6. **Integrates seamlessly** with existing NANOBOT workflows

The phased migration approach ensures minimal disruption while delivering significant long-term benefits for the platform.

---

**Document Version:** 1.0  
**Date:** 2026-03-17  
**Author:** Construct AI Development Team  
**Status:** Proposal - Awaiting Review
