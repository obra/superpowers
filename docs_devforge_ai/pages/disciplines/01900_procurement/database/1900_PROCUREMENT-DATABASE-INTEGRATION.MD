# Procurement Database Integration Guide

## Overview
This document describes the database integration for the procurement module, including the contractors, suppliers, and consultants tables that store contact information scraped by the enhanced ContactScraperModal with advanced filtering capabilities.

## Database Schema

### Contractors Table
```sql
CREATE TABLE IF NOT EXISTS public.contractors (
  id SERIAL PRIMARY KEY,
  name CHARACTER VARYING(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  address TEXT,
  email TEXT,
  phone TEXT,
  contact_person TEXT,
  project_id UUID,
  contractor_type TEXT,
  construction_type TEXT,
  sector TEXT,
  CONSTRAINT contractors_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id)
) TABLESPACE pg_default;

COMMENT ON TABLE public.contractors IS 'Table to store contractor information for projects';
COMMENT ON COLUMN public.contractors.contractor_type IS 'Type of contractor (e.g., general, electrical, plumbing)';
COMMENT ON COLUMN public.contractors.construction_type IS 'Type of construction (EPCM, EPC, Construction Only, Design-Build)';
COMMENT ON COLUMN public.contractors.sector IS 'Industry sector (Mining, Oil & Gas, Power Generation, etc)';
```

### Suppliers Table
```sql
CREATE TABLE IF NOT EXISTS public.suppliers (
  id SERIAL PRIMARY KEY,
  name CHARACTER VARYING(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  address TEXT,
  email TEXT,
  phone TEXT,
  contact_person TEXT,
  project_id UUID,
  supplier_type TEXT,
  CONSTRAINT suppliers_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id)
) TABLESPACE pg_default;

COMMENT ON TABLE public.suppliers IS 'Table to store supplier information for procurement';
COMMENT ON COLUMN public.suppliers.supplier_type IS 'Type of supplier (e.g., materials, equipment, services)';
```

### Consultants Table
```sql
CREATE TABLE IF NOT EXISTS public.consultants (
  id SERIAL PRIMARY KEY,
  name CHARACTER VARYING(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  address TEXT,
  email TEXT,
  phone TEXT,
  contact_person TEXT,
  project_id UUID,
  consultant_type TEXT,
  CONSTRAINT consultants_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id)
) TABLESPACE pg_default;

COMMENT ON TABLE public.consultants IS 'Table to store consultant information for projects';
COMMENT ON COLUMN public.consultants.consultant_type IS 'Type of consultant (e.g., engineering, architectural, legal)';
```

## Enhanced ContactScraperModal Features

The enhanced ContactScraperModal provides advanced filtering capabilities for each entity type:

### Suppliers
- **Product-based search**: Search by specific products/materials with checkbox selection
- **Multiple product selection**: Select multiple products to search for suppliers that handle all selected items
- **Add new products**: Ability to add products not currently in the predefined list
- **Automatic supplier_type population**: Supplier type is automatically set based on selected products

### Contractors
- **Contractor Type**: Filter by specialization (General Contractor, Electrical Contractor, etc.)
- **Construction Type**: Filter by project delivery method (EPCM, EPC, Construction Only, Design-Build)
- **Sector**: Filter by industry sector (Mining, Oil & Gas, Power Generation, etc.)
- **Enhanced categorization**: All contractor-specific fields are automatically populated

### Consultants
- **Consultant Type**: Filter by area of expertise (Civil Engineer, Architect, Project Manager, etc.)
- **Specialization tracking**: Automatic consultant_type population based on selection

## Data Flow

1. User selects entity type (Suppliers/Contractors/Consultants) in ContactScraperModal
2. User applies specific filters based on entity type:
   - Suppliers: Select products from checkbox list or add new products
   - Contractors: Select contractor type, construction type, and sector from dropdowns
   - Consultants: Select consultant type from dropdown
3. User enters common search criteria (country, number of results, email, etc.)
4. LangChain agent scrapes web for contact information using enhanced search parameters
5. Results are automatically saved to appropriate Supabase table with contextual metadata
6. Data is available for reporting and project assignment with enhanced filtering capabilities

## Migration Scripts

To create the tables, run the migration script:
`sql/create-suppliers-consultants-tables.sql`

This script is safe to run on both new and existing installations as it uses `IF NOT EXISTS` clauses and will add the enhanced fields to existing tables automatically.

If you prefer to run a separate script to add the enhanced fields to existing tables, run:
`sql/alter-contractors-add-enhanced-fields.sql`

Both scripts are idempotent and can be run multiple times without causing errors.

## Document Control System (DCS) Integration

### Overview
The procurement system integrates with the centralized Document Control System (DCS) for engineering document discovery and linking. This enables procurement teams to reference approved engineering documents without duplication while maintaining separation between procurement-generated and engineering-generated content.

### Architecture Design

#### Table Separation Strategy
**Procurement-Specific Tables** (Retained in procurement system):
- `procurement_orders` - Purchase/Service/Work orders
- `procurement_templates` - SOW generation templates
- `scope_of_work` - Generated SOW documents
- `suppliers` - Supplier directory
- `contractors` - Contractor directory
- `consultants` - Consultant directory

**DCS Tables** (Centralized document management):
- `a_00900_doccontrol_documents` - All engineering documents
- `a_00850_civil_data` - Civil engineering specific metadata
- `a_00900_doccontrol_document_versions` - Version control

#### Cross-System Linking
```sql
CREATE TABLE procurement_document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_order_id UUID REFERENCES procurement_orders(id),
  procurement_template_id UUID REFERENCES procurement_templates(id),
  scope_of_work_id UUID REFERENCES scope_of_work(id),

  -- DCS document reference
  dcs_document_id UUID REFERENCES a_00900_doccontrol_documents(id),
  dcs_document_number VARCHAR(50), -- Cached for performance

  -- Link metadata
  link_type VARCHAR(50), -- 'reference', 'supersedes', 'related', 'supporting'
  link_purpose TEXT,    -- Why this document is linked
  linked_by UUID REFERENCES auth.users(id),
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(procurement_order_id, dcs_document_id, link_type)
);
```

### Data Flow Integration

#### SOW Generation Workflow (Procurement System)
```
1. Template Selection → procurement_templates table
2. AI Generation → scope_of_work table
3. Document Linking → procurement_document_links table
4. Order Creation → procurement_orders table
```

#### Engineering Document Discovery (DCS Integration)
```
1. Civil Engineer Creates → a_00900_doccontrol_documents (draft)
2. Approval Workflow → status: 'approved', procurement_relevant: true
3. Procurement Access → Available via procurement_document_links
```

### API Integration Points

#### Engineering Document Discovery
```javascript
// GET /api/procurement/documents/engineering
const engineeringDocs = await supabase
  .from('a_00900_doccontrol_documents')
  .select(`
    *,
    a_00850_civil_data(*)
  `)
  .eq('discipline_code', '00850')
  .eq('approval_status', 'approved')
  .eq('procurement_relevant', true)
  .order('created_at', { ascending: false });
```

#### Document Linking
```javascript
// POST /api/procurement-orders/:id/link-engineering-doc
const linkData = {
  procurement_order_id: orderId,
  dcs_document_id: engineeringDocId,
  link_type: 'reference',
  link_purpose: 'Technical specifications reference'
};
```

## Multi-Source Tender Integration System

### Overview
The procurement module now includes a comprehensive multi-source tender integration system that connects to three major South African government tender platforms:

- **OCDS API** (Open Contracting Data Standard) - RESTful API integration
- **eTenders National Treasury Portal** - Web scraping integration
- **CSD (Central Supplier Database)** - Supplier verification integration

### Integration Architecture

#### System Components
- **Integration Service** (`server/src/services/tender-integration-service.js`)
- **API Routes** (`server/src/routes/tender-integration-routes.js`)
- **Dashboard UI** (`client/src/pages/01900-procurement/components/01900-integration-management-page.js`)
- **Database Schema** (`sql/create_tender_integration_tables.sql`)
- **Setup Script** (`setup-tender-integration.sh`)

#### Database Tables
The integration system uses 9 specialized tables:

1. **integration_sources** - Configuration for each data source
2. **integration_sync_history** - Audit trail of all sync operations
3. **integration_metrics** - Performance and usage metrics
4. **integration_error_logs** - Error tracking and debugging
5. **multi_source_tenders** - Normalized tender data from all sources
6. **supplier_verifications** - CSD verification records
7. **tender_attachments** - Document management
8. **integration_config** - System-wide configuration
9. **integration_notifications** - User notification preferences

#### Integration Types
- **API Integration**: Direct RESTful API calls with authentication
- **Web Scraping**: Automated browser-based data extraction
- **Real-time Updates**: Webhook support for live data updates

### Integration Sources Configuration

#### OCDS API Integration
```javascript
{
  source_id: 'ocds_api',
  name: 'OCDS API',
  integration_type: 'api',
  base_url: 'https://api.data.gov.za/v1/ocds',
  api_key_encrypted: 'encrypted_api_key',
  sync_interval_minutes: 15,
  rate_limit_per_minute: 60,
  timeout_seconds: 30
}
```

#### eTenders Portal Integration
```javascript
{
  source_id: 'etenders_portal',
  name: 'eTenders National Treasury',
  integration_type: 'web_scraping',
  base_url: 'https://www.etenders.gov.za',
  username: 'encrypted_username',
  password_encrypted: 'encrypted_password',
  sync_interval_minutes: 30,
  rate_limit_per_minute: 10,
  timeout_seconds: 60
}
```

#### CSD Supplier Database Integration
```javascript
{
  source_id: 'csd_database',
  name: 'Central Supplier Database',
  integration_type: 'api',
  base_url: 'https://secure.csd.gov.za',
  api_key_encrypted: 'encrypted_api_key',
  sync_interval_minutes: 60,
  rate_limit_per_minute: 30,
  timeout_seconds: 45
}
```

### API Endpoints

#### Integration Management
- `GET /api/tender-integration/health` - System health check
- `POST /api/tender-integration/initialize` - Initialize integration service
- `GET /api/tender-integration/sources` - List all integration sources
- `PUT /api/tender-integration/sources/:sourceId` - Update source configuration
- `POST /api/tender-integration/sources/:sourceId/test` - Test connection
- `POST /api/tender-integration/sources/:sourceId/sync` - Trigger manual sync

#### Data Access
- `GET /api/tender-integration/sync-history` - Get sync history
- `GET /api/tender-integration/metrics` - Get performance metrics
- `GET /api/tender-integration/errors` - Get error logs
- `GET /api/tender-integration/tenders` - Get multi-source tenders
- `GET /api/tender-integration/suppliers/verifications` - Get supplier verifications

#### Bulk Operations
- `POST /api/tender-integration/bulk/sync` - Bulk sync multiple sources
- `POST /api/tender-integration/webhooks/:sourceId` - Webhook endpoints

### Dashboard Features

#### Real-time Monitoring
- Integration status indicators (Active/Inactive/Error/Syncing)
- Performance metrics and statistics
- Sync history with detailed logs
- Error tracking and notifications

#### Management Controls
- Configure integration parameters
- Test connections to data sources
- Trigger manual synchronization
- Enable/disable integrations
- View detailed sync reports

#### Filtering and Search
- Filter by integration status
- Filter by integration type (API/Web Scraping)
- Search across integration sources
- Sort by last sync time, success rate, etc.

### Setup and Configuration

#### Automated Setup Script
```bash
# Run the setup script
./setup-tender-integration.sh

# This will:
# 1. Create database tables
# 2. Set up environment variables
# 3. Configure integration sources
# 4. Initialize the integration service
# 5. Start scheduled sync processes
```

#### Environment Variables
```bash
# OCDS API Configuration
OCDS_API_BASE_URL=https://api.data.gov.za/v1/ocds
OCDS_API_KEY=your_api_key_here

# eTenders Configuration
ETENDERS_BASE_URL=https://www.etenders.gov.za
ETENDERS_USERNAME=your_username
ETENDERS_PASSWORD=your_password

# CSD Configuration
CSD_BASE_URL=https://secure.csd.gov.za
CSD_API_KEY=your_api_key_here

# Integration Service Configuration
INTEGRATION_SYNC_INTERVAL_MINUTES=15
INTEGRATION_MAX_RETRIES=3
INTEGRATION_RETRY_DELAY_SECONDS=5
```

### Data Flow and Processing

#### Automated Sync Process
1. **Initialization**: Integration service starts with configured sources
2. **Scheduling**: Each source has its own sync interval (15-60 minutes)
3. **Data Fetching**: API calls or web scraping based on source type
4. **Transformation**: Raw data normalized to common schema
5. **Deduplication**: Remove duplicate records across sources
6. **Storage**: Save to multi_source_tenders table
7. **Notification**: Update dashboard and send alerts

#### Error Handling and Recovery
- **Retry Logic**: Exponential backoff for failed requests
- **Error Logging**: Detailed error tracking in integration_error_logs
- **Health Monitoring**: Continuous health checks for all sources
- **Alert System**: Email/SMS notifications for critical failures
- **Recovery Procedures**: Automatic retry with manual override options

### Security and Compliance

#### Authentication
- API key encryption for sensitive credentials
- JWT token validation for admin operations
- Row Level Security (RLS) policies on all tables
- Organization-based data isolation

#### Data Protection
- Encrypted storage of API keys and passwords
- Audit logging for all data access
- GDPR compliance for personal data handling
- South African POPIA compliance

#### Access Control
- Admin-only configuration management
- User-based data access permissions
- Integration-specific access controls
- Audit trail for all operations

### Performance Optimization

#### Caching Strategy
- Redis caching for frequently accessed data
- Database query optimization with indexes
- Connection pooling for API calls
- Batch processing for large datasets

#### Monitoring and Analytics
- Real-time performance metrics
- Success rate tracking per integration
- Response time monitoring
- Resource usage analytics

### Testing and Validation

#### Integration Testing
- Connection testing for each source
- Data validation against schemas
- Performance benchmarking
- Error scenario testing

#### User Acceptance Testing
- End-to-end workflow testing
- Data accuracy verification
- UI/UX testing
- Performance testing under load

### Troubleshooting Guide

#### Common Issues
1. **API Connection Failures**
   - Check API credentials and endpoints
   - Verify network connectivity
   - Review rate limiting settings

2. **Web Scraping Issues**
   - Check website structure changes
   - Verify login credentials
   - Monitor for anti-bot measures

3. **Database Performance**
   - Optimize queries with proper indexing
   - Monitor connection pool usage
   - Check for long-running transactions

4. **Sync Failures**
   - Review error logs in integration_error_logs table
   - Check integration source status
   - Verify data transformation logic

#### Debug Mode
Enable debug logging by setting:
```javascript
const DEBUG_MODE = process.env.NODE_ENV === 'development';
```

### Future Enhancements

- **AI-Powered Data Matching**: Machine learning for better data correlation
- **Advanced Analytics**: Predictive analytics for tender success rates
- **Mobile Integration**: Mobile app for on-the-go access
- **Multi-language Support**: Support for additional African languages
- **Blockchain Integration**: Immutable audit trail for tender processes
- **Advanced Reporting**: Business intelligence dashboards
- **Workflow Automation**: Automated tender response generation
- **Supplier Portal**: Direct supplier communication platform

#### Integration with Existing Systems
- Seamless integration with current tender management system
- Shared authentication and user management
- Unified dashboard and reporting
- Consistent UI/UX patterns
- Shared data models where applicable

## Form Processing System Database Integration

### Overview
The Form Processing System provides comprehensive document processing capabilities for the procurement module, enabling users to upload PDFs and automatically generate interactive HTML forms. The system includes database schema for template management, form instances, and processing analytics, integrated with existing organizations and disciplines tables.

### Database Schema

### Form Templates Table
```sql
CREATE TABLE public.form_templates (
    id uuid not null default gen_random_uuid (),
    organization_id uuid null,
    organization_name text null,
    discipline_id uuid null,
    discipline_name text null,
    template_name text not null,
    template_slug text null,
    html_content text null,
    json_schema jsonb null,
    form_metadata jsonb null default '{}'::jsonb,
    source_file_name text null,
    source_file_type text null, -- 'pdf', 'excel', 'word', 'pages', 'odt', 'rtf', 'text'
    extracted_fields_count integer null default 0,
    extraction_method text null, -- 'pdf-extraction', 'excel-parse', 'document-fallback'
    processing_status text null default 'draft'::text, -- 'draft', 'published', 'archived'
    version integer null default 1,
    parent_template_id uuid null,
    is_default boolean null default false,
    is_active boolean null default true,
    created_by text null,
    updated_by text null,
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    deleted_at timestamp with time zone null,
    CONSTRAINT form_templates_pkey PRIMARY KEY (id),
    CONSTRAINT form_templates_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL,
    CONSTRAINT form_templates_discipline_id_fkey
        FOREIGN KEY (discipline_id) REFERENCES disciplines (id) ON DELETE SET NULL,
    CONSTRAINT chk_template_source_file_type
        CHECK (source_file_type is null OR source_file_type IN ('pdf', 'excel', 'word', 'pages', 'odt', 'rtf', 'text')),
    CONSTRAINT chk_template_processing_status
        CHECK (processing_status IN ('draft', 'published', 'archived'))
) TABLESPACE pg_default;
```

**Table Purpose**: Stores reusable form templates generated from uploaded documents, with full integration to organization's disciplines and categories.

### Form Instances Table
```sql
CREATE TABLE public.form_instances (
    id uuid not null default gen_random_uuid (),
    template_id uuid null,
    organization_name text null,
    instance_name text not null,
    instance_slug text null,
    source_file_name text not null,
    source_file_type text null,
    source_file_size integer null,
    processed_data jsonb null default '{}'::jsonb,
    submission_data jsonb null default '{}'::jsonb,
    html_form text null,
    json_form jsonb null,
    processing_status text null default 'processed'::text, -- 'processing', 'processed', 'submitted', 'error'
    version integer null default 1,
    is_submitted boolean null default false,
    submitted_by text null,
    submitted_at timestamp with time zone null,
    created_by text null,
    updated_by text null,
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    deleted_at timestamp with time zone null,
    CONSTRAINT form_instances_pkey PRIMARY KEY (id),
    CONSTRAINT form_instances_template_id_fkey
        FOREIGN KEY (template_id) REFERENCES form_templates (id) ON DELETE SET NULL,
    CONSTRAINT chk_instance_source_file_type
        CHECK (source_file_type is null OR source_file_type IN ('pdf', 'excel', 'word', 'pages', 'odt', 'rtf', 'text')),
    CONSTRAINT chk_instance_processing_status
        CHECK (processing_status IN ('processing', 'processed', 'submitted', 'error'))
) TABLESPACE pg_default;
```

**Table Purpose**: Stores individual form instances with user-submitted data and processing status.

### Document Processing Log Table
```sql
CREATE TABLE public.document_processing_log (
    id uuid not null default gen_random_uuid (),
    instance_id uuid null,
    template_id uuid null,
    file_name text not null,
    file_type text null,
    organization_name text null,
    discipline_name text null,
    processing_type text not null, -- 'upload', 'extraction', 'template_creation', 'validation', 'error'
    processing_status text not null, -- 'started', 'in_progress', 'completed', 'failed'
    processing_message text null,
    processing_details jsonb null default '{}'::jsonb,
    processing_time_ms integer null,
    file_size integer null,
    extracted_fields_count integer null,
    error_details jsonb null,
    stack_trace text null,
    user_agent text null,
    user_ip text null,
    created_by text null,
    created_at timestamp with time zone null default now(),
    CONSTRAINT document_processing_log_pkey PRIMARY KEY (id),
    CONSTRAINT document_processing_log_instance_id_fkey
        FOREIGN KEY (instance_id) REFERENCES form_instances (id) ON DELETE SET NULL,
    CONSTRAINT document_processing_log_template_id_fkey
        FOREIGN KEY (template_id) REFERENCES form_templates (id) ON DELETE SET NULL,
    CONSTRAINT chk_log_processing_type
        CHECK (processing_type IN ('upload', 'extraction', 'template_creation', 'validation', 'error')),
    CONSTRAINT chk_log_processing_status
        CHECK (processing_status IN ('started', 'in_progress', 'completed', 'failed'))
) TABLESPACE pg_default;
```

**Table Purpose**: Comprehensive audit trail for all document processing activities, supporting analytics and troubleshooting.

### Processing Statistics View
```sql
CREATE OR REPLACE VIEW public.processing_statistics AS
SELECT
    organization_name,
    processing_type,
    processing_status,
    file_type,
    count(*) as total_count,
    avg(processing_time_ms) as avg_processing_time,
    avg(extracted_fields_count) as avg_extracted_fields,
    min(created_at) as earliest_entry,
    max(created_at) as latest_entry
FROM public.document_processing_log
GROUP BY organization_name, processing_type, processing_status, file_type
ORDER BY organization_name, processing_type, processing_status;
```

**View Purpose**: Analytics dashboard providing processing statistics and performance metrics.

## System Integration

### Foreign Key Relationships
- **organizations.id** → `form_templates.organization_id` - Links forms to organizations
- **disciplines.id** → `form_templates.discipline_id` - Categorizes forms by discipline
- **form_templates.id** → `form_instances.template_id` - Connects instances to templates
- **form_templates.id** → `document_processing_log.template_id` - Links audit logs to templates
- **form_instances.id** → `document_processing_log.instance_id` - Links audit logs to instances

### Data Flow Architecture

1. **Document Upload**: User uploads PDF/Excel/Word document via governance form creation page
2. **Template Creation**: System extracts form structure and creates reusable HTML template
3. **Instance Generation**: Populated form data creates new form instance record
4. **Audit Logging**: All processing steps logged in document_processing_log
5. **Analytics Update**: Processing statistics automatically updated for reporting

## Migration Scripts

To deploy the form processing system, run:
```bash
# Execute the complete setup script
psql -f form-processing-system-setup.sql
```

This script will:
- Create all 3 tables with proper constraints and indexes
- Add foreign key relationships to existing organizations/disciplines tables
- Seed sample form templates for immediate testing
- Create processing analytics view
- Set up update triggers using your custom `update_organisations_updated_at()` function

## Integration with Procurement Workflow

### Procurement Form Templates
The system pre-seeds several procurement-specific templates:

1. **Construction Permit Application** - Multi-section permit form with validation
2. **Equipment Specification Form** - Technical specification collection
3. **Generic Procurement Document** - Flexible multi-purpose form

### Enhanced ContactScraperModal Integration
Form processing integrates with existing ContactScraperModal to:
- Auto-populate supplier/contractor information in generated forms
- Enable filtered form distribution based on supplier categories
- Support bulk form processing for multiple vendors

## Security and Performance

### Row Level Security Design
Basic table access implemented (RLS policies removed for initial deployment, can be added later based on authentication architecture).

### Performance Optimizations
- **Indexes**: Optimized for common query patterns (organization, discipline, processing_status)
- **JSON Storage**: Efficient storage of form metadata and processing details
- **Foreign Keys**: Cascading deletes to maintain data integrity
- **Text Search**: Full-text search across template and document names
- **Analytics View**: Pre-computed statistics for dashboard performance

## Testing and Validation

### Automated Test Suite
Run comprehensive tests with:
```bash
node test-form-processing-system.cjs
```

**Test Coverage:**
- ✅ Database connectivity and table creation
- ✅ Foreign key relationships and integrity
- ✅ CRUD operations on all tables
- ✅ Form processing workflow (Template → Instance → Log)
- ✅ Analytics view functionality
- ✅ Basic security and access control

### Manual Testing Steps
1. Upload PDF document through form creation modal
2. Verify template creation in form_templates table
3. Check form instance creation with processed data
4. Review processing logs for complete audit trail
5. Monitor processing_statistics view for analytics

## Troubleshooting

### Common Issues and Solutions

#### Foreign Key Constraint Errors
```
ERROR: insert or update on table "form_templates" violates foreign key constraint
```
**Solution:**
- Verify organizations and disciplines tables exist
- Check that referenced organization_id/discipline_id values exist
- Run test suite to validate foreign key relationships

#### Template Processing Failures
- Check document_processing_log for error details
- Verify uploaded file format is supported
- Review document_processing_log.stack_trace for technical details

#### Performance Issues
- Monitor processing_statistics for timing analysis
- Check indexes with EXPLAIN ANALYZE queries
- Review processing_time_ms in audit logs

## API Integration Points

### Backend Services
- **Form Processing Service**: `server/src/services/formProcessingService.js`
- **Document Upload Handler**: `server/src/routes/form-upload-routes.js`
- **Template Management**: `server/src/controllers/formTemplateController.js`

### Frontend Components
- **Upload Modal**: `client/src/pages/01300-governance/components/01300-pdf-upload-modal.js`
- **Form Management**: `client/src/pages/01300-governance/components/01300-form-creation-page.js`
- **Processing Dashboard**: Analytics views and monitoring interfaces

## Future Enhancements

- **Organization-based RLSA**: User authentication and organization-level access control
- **Advanced Processing**: AI-powered form field extraction and validation
- **Bulk Operations**: Batch processing of multiple documents
- **Template Versioning**: Historical template management and rollbacks
- **Integration APIs**: RESTful endpoints for external system integration
- **Real-time Monitoring**: Live processing status and progress tracking

## Support and Maintenance

### Monitoring Commands
```sql
-- Check processing statistics
SELECT * FROM processing_statistics ORDER BY latest_entry DESC LIMIT 10;

-- Monitor failed processes
SELECT * FROM document_processing_log
WHERE processing_status = 'failed'
ORDER BY created_at DESC;

-- Check template utilization
SELECT template_name, COUNT(*) as instance_count
FROM form_templates ft
JOIN form_instances fi ON ft.id = fi.template_id
GROUP BY ft.id, ft.template_name
ORDER BY instance_count DESC;
```

### Health Check Queries
```sql
-- System health overview
SELECT
    (SELECT COUNT(*) FROM form_templates) as total_templates,
    (SELECT COUNT(*) FROM form_instances) as total_instances,
    (SELECT COUNT(*) FROM document_processing_log WHERE created_at > NOW() - INTERVAL '24 hours') as recent_processes,
    (SELECT AVG(processing_time_ms) FROM document_processing_log WHERE created_at > NOW() - INTERVAL '24 hours') as avg_processing_time;

-- Table size monitoring
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename IN ('form_templates', 'form_instances', 'document_processing_log')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Recent Updates and Improvements

### UI Enhancements (December 2025)
The procurement system has received significant UI improvements for better user experience:

#### Discipline Assignment Interface
- **Alphabetical Grid Layout**: Disciplines now display in a responsive grid sorted A-Z
- **Clean Discipline Names**: Removed discipline codes (e.g., "Architectural" instead of "Architectural(00825)")
- **Professional Card Design**: Each discipline in its own bordered card with hover effects
- **Visual Feedback**: Selected disciplines highlighted with blue borders and backgrounds

#### SOW Template Display Fixes
- **Duplicate Header Removal**: Eliminated redundant "SOW Template:" prefixes
- **Accurate Discipline Counts**: Fixed counting logic for assigned disciplines
- **Form Validation**: Added proper form IDs for Create Order modal submission

#### Create Order Workflow Improvements
- **5-Phase Guided Process**: Info → Template → Assignment → Approval → Review
- **Form Submission Fix**: Resolved Create Order functionality issues
- **Progressive Validation**: Real-time validation at each workflow phase
- **Enhanced UX**: Clear phase indicators and navigation controls

### Database Schema Updates
#### Consultants Table Enhancement
The consultants table was updated to support the full procurement entity workflow:

**Added Fields:**
- `contact_person` TEXT - Primary contact information
- `services_offered` TEXT - Services provided by consultant
- `license_number` TEXT - Professional licensing information
- `insurance_status` TEXT DEFAULT 'pending' - Insurance verification status
- `address` TEXT - Consultant business address
- `registration_date` DATE DEFAULT CURRENT_DATE - Registration timestamp
- `approval_status` TEXT DEFAULT 'pending' - Approval workflow status
- `compliance_status` TEXT DEFAULT 'pending_review' - Compliance check status
- `last_activity` TIMESTAMP WITH TIME ZONE DEFAULT NOW() - Activity tracking
- `scraped_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW() - Data source timestamp

**Schema Compatibility:**
- Now matches suppliers/contractors table structure
- Supports procurement approval workflows
- Enables consultant qualification and vetting processes

### Test Data Population
#### Comprehensive Test Dataset
- **57 Sectors**: Complete sector categorization
- **11 Organizations**: Multi-tenant organization support
- **36 User Profiles**: Comprehensive user management
- **32 Contractors**: Construction and service provider data
- **10 Consultants**: Professional services and consulting firms
- **14 Procurement Orders**: Complete order lifecycle examples
- **50 External API Configurations**: Integration setup examples

#### Automated Population Scripts
- `server/check-existing-data.js` - Database audit and gap analysis
- `server/populate-consultants.js` - Consultant data population
- `server/sql/fix-consultants-schema.sql` - Schema migration utilities

### Real Database Integration
#### Mock Data Bypass Implementation
- **DEV_UI_ONLY_BYPASS=false** - Enables real database queries in development
- **Production-Ready Queries** - All API endpoints use live database connections
- **Performance Optimization** - Efficient query patterns and indexing
- **Error Handling** - Comprehensive error recovery and logging

**Status**: **PRODUCTION READY** ✅ - Form Processing System fully integrated with procurement database schema, tested and validated for production deployment. UI enhancements completed and documented.
