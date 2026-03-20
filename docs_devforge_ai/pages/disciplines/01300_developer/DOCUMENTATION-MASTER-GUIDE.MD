### **Recent Updates (2025-12-17)**

- **ACCORDION DOCUMENTATION RATIONALIZATION COMPLETE**: Successfully consolidated 7 accordion-related files into 4 core documents (67% reduction) - merged navigation fixes, performance optimization, and flow diagrams into comprehensive implementation guide, archived redundant files with proper documentation
- **COMPREHENSIVE DOCUMENTATION AUDIT COMPLETE**: Found 400+ markdown files vs ~50 referenced in master guide (85% gap identified)
- **Supabase Documentation Rationalization COMPLETE**: Successfully consolidated 7 Supabase-related documentation files (0500_SUPABASE_*) - eliminated 80% redundant tactical docs, archived planning documents, enhanced master guide with dual system analysis
- **Task Management Migration Success**: Successfully migrated 41 tasks from business object tables (procurement_orders, scope_of_work, sow_appendices) to centralized task management system with proper UUID relationships and HITL support
- **PostgreSQL Migration Fixes**: Resolved all syntax errors including IMMUTABLE function errors, UUID format conflicts, and standalone RAISE NOTICE statements
- **Documentation Consolidation**: Combined documentation guide and reorganization tracking into unified master guide
- **Hybrid Prompt Management System**: Implemented comprehensive developer-only prompt editing with user preference controls across all procedures and documentation
- **Agent Coding Standards Established**: Created comprehensive coding standards for AI agent development at `docs/standards/0000_AGENT_CODING_STANDARDS.md` with standardized prompt key naming conventions
- **Standards Framework Complete**: Established comprehensive standards suite with 4 core standards documents covering agent coding, prompt tagging, file naming, and UI accordion implementation
- **Prompt Key Naming Convention**: Implemented hierarchical `{category}_{subcategory}_{specific}_{variant}` structure for scalable prompt management across 1000s of keys
- **Validation Utility Created**: Developed `PromptKeyValidator` class for automated key naming validation and batch processing
- **Agent Code Refactored**: Updated all correspondence agents with standardized prompt key naming (agent_correspondence_01_document_analysis, etc.)
- **Documentation Reorganization**: Moved AGENTS.md from root to `docs/standards/` and extracted standards content from master guide to dedicated standards documents

---

## **Documentation Directory Structure**

### **📁 Core Documentation Areas**

#### **🔧 Implementation** (`docs/implementation/`)
Technical implementation guides and specifications
- **Implementation Overview** (`docs/implementation/README.md`) - Master implementation guide
- **Implementation Plans** (`docs/implementation/implementation-plans/`) - Strategic implementation roadmaps
- **Modules** (`docs/implementation/modules/`) - Feature module documentation
- **Database Migrations** (`docs/implementation/database-migrations/`) - Database schema changes and migrations
- **Reports** (`docs/implementation/reports/`) - Implementation reporting and analytics
- **Technical Documentation** (`docs/implementation/technical/`) - Technical specifications and architecture
- **Agents** (`docs/implementation/agents/`) - AI agent implementation and configuration

#### **⚡ Procedures** (`docs/procedures/`)
Operational procedures and workflows
- **Procedures Master Guide** (`docs/procedures/0000_PROCEDURES_GUIDE.md`) - Comprehensive procedures overview
- **Documentation Audit Procedure** (`docs/procedures/0000_DOCUMENTATION_AUDIT_PROCEDURE.md`) - Automated documentation quality assurance
- **Agent Development** (`docs/procedures/0000_AGENT_DEVELOPMENT_PROCEDURE.md`) - AI agent development procedures
- **Debugging Guide** (`docs/procedures/0000_DEBUGGING_GUIDE.md`) - Debugging and troubleshooting procedures
- **Privacy Procedure** (`docs/procedures/0000_PRIVACY_PROCEDURE.md`) - Privacy compliance and data handling procedures

#### **📋 Standards** (`docs/standards/`)
Development standards and coding guidelines
- **Agent Coding Standards** (`docs/standards/0000_AGENT_CODING_STANDARDS.md`) - AI agent development standards
- **Prompt Tagging Standards** (`docs/standards/0001_PROMPT_TAGGING_STANDARDS.md`) - Prompt management and tagging conventions
- **File Naming Standards** (`docs/standards/0002_FILE_NAMING_STANDARDS.md`) - File and directory naming conventions
- **UI Accordion Standards** (`docs/standards/0003_UI_ACCORDION_STANDARDS.md`) - User interface accordion implementation standards

#### **📊 Application Logic** (`docs/application-logic/`)
Application business logic and functionality
- **Master Guide** (`docs/application-logic/0100_APPLICATION_LOGIC_MASTER_GUIDE.md`) - Application logic overview
- **Field Detection** (`docs/application-logic/0100_FIELD_DETECTION_RESOLUTION.md`) - Field detection and resolution logic
- **Modal Systems** (`docs/application-logic/1000_CORE_MODAL_SYSTEM_MASTER_GUIDE.md`) - Modal system implementation
- **Document Management** (`docs/application-logic/1000_DOCUMENT_MANAGEMENT_E_SIGNATURE_IMPLEMENTATION.md`) - Document management and e-signature
- **Form Processing** (`docs/application-logic/1600_PDF_UPLOAD_FLOW_TEST_RESULTS.md`) - PDF upload and form processing

#### **🔐 Authentication & Security** (`docs/authentication/`)
Authentication, authorization, and security systems
- **Authentication Overview** (`docs/authentication/0020_AUTHENTICATION_OVERVIEW.md`) - Authentication system overview
- **RLS Implementation** (`docs/authentication/0021_RLS_IMPLEMENTATION_GUIDE.md`) - Row Level Security implementation
- **Security Dashboards** (`docs/authentication/0022_SECURITY_DASHBOARDS.md`) - Security monitoring and dashboards
- **Troubleshooting** (`docs/authentication/0025_TROUBLESHOOTING_GUIDE.md`) - Authentication troubleshooting
- **Chatbot Security** (`docs/authentication/1300_CHATBOT_SECURITY_AUTHENTICATION_GUIDE.md`) - Chatbot security implementation

#### **📈 Data Processing** (`docs/data-processing/`)
Data processing, AI integration, and document analysis
- **Master Guide** (`docs/data-processing/0500_DATA_PROCESSING_MASTER_GUIDE.md`) - Data processing overview
- **Supabase Integration** (`docs/data-processing/0500_SUPABASE_SYSTEM_MASTER_GUIDE.md`) - Supabase integration and storage
- **AI Auto-Detection** (`docs/data-processing/0500_AI_AUTO_DETECTION_WORKFLOW_SOLUTION.md`) - AI-powered document processing
- **Document Analysis** (`docs/data-processing/1370_DOCUMENT_VIEW_FUNCTIONALITY.md`) - Document viewing and analysis
- **File Upload** (`docs/data-processing/1380_UNIFIED_FILE_UPLOADER_LANGCHAIN_INTEGRATION.md`) - File upload and processing systems

#### **🗄️ Database Systems** (`docs/database-systems/`)
Database architecture, migrations, and management
- **Master Guide** (`docs/database-systems/0300_SUPABASE_MASTER_GUIDE.md`) - Database system overview
- **Migration Guide** (`docs/database-systems/0300_MIGRATION_README.md`) - Database migration procedures
- **Security Guide** (`docs/database-systems/0300_SUPABASE_SECURITY_MASTER_GUIDE.md`) - Database security implementation
- **SQLite System** (`docs/database-systems/0305_SQLITE_SYSTEM_MASTER_GUIDE.md`) - SQLite database management
- **Batch Implementation** (`docs/database-systems/0300_BATCH_17_EXECUTION_GUIDE.md`) - Batch processing and implementation

#### **🚨 Error Tracking** (`docs/error-tracking/`)
Error monitoring, debugging, and issue resolution
- **Correspondence Agent Errors** (`docs/error-tracking/1300_00435_CORRESPONDENCE_AGENT_LLM_EXTRACTION_ERRORS.md`) - Agent-specific error tracking and resolution

#### **📄 Pages & Disciplines** (`docs/pages-disciplines/`)
Page-specific documentation and domain expertise
- **Contracts Post-Award** (`docs/pages-disciplines/1300_00435_MASTER_GUIDE_CONTRACTS_POST_AWARD.md`) - Contract management documentation
- **LangChain System** (`docs/pages-disciplines/1300_02052_LANGCHAIN_LANGGRAPH_SYSTEM.md`) - LangChain/LangGraph orchestration system

#### **🔧 Development Tools** (`docs/dev-tools/`)
Development tools, utilities, and workflows

#### **🚀 Deployment** (`docs/deployment/`)
Deployment procedures, configuration, and operations
- **Deployment Guide** (`DEPLOYMENT_GUIDE.md`) - Application deployment procedures

#### **📋 Role Permissions** (`docs/role-permissions/`)
User roles, permissions, and access control documentation

#### **🎨 User Interface** (`docs/user-interface/`)
User interface design, components, and interaction patterns

#### **🔄 Workflows** (`docs/workflows/`)
Business process workflows and automation
- **Procurement Document Generation** (`docs/workflows/01900_PROCUREMENT_DOCUMENT_GENERATION_WORKFLOW/`) - Complete procurement order creation workflow with 5-phase wizard and SOW generation
  - **User Guide** (`01900_PROCUREMENT_WORKFLOW_USER_GUIDE.md`) - User-facing workflow navigation and system integration
  - **Technical Specification** (`01900_PROCUREMENT_WORKFLOW_TECHNICAL_SPEC.md`) - Component architecture, database schemas, and API endpoints
  - **Implementation Guide** (`01900_PROCUREMENT_WORKFLOW_IMPLEMENTATION.md`) - Code implementation, custom hooks, and phase components
  - **Configuration Guide** (`01900_PROCUREMENT_WORKFLOW_CONFIGURATION.md`) - System setup, limits of authority, and performance tuning
  - **Troubleshooting Guide** (`01900_PROCUREMENT_WORKFLOW_TROUBLESHOOTING.md`) - Common issues, debugging procedures, and error patterns
  - **Maintenance Guide** (`01900_PROCUREMENT_WORKFLOW_MAINTENANCE.md`) - Version history, monitoring, and future enhancements
- **Correspondence Agent Orchestration** (`docs/workflows/00435_WORKFLOW_CORRESPONDENCE_AGENT_ORCHESTRATION/`) - 7-agent system for contractual correspondence analysis with HITL integration
  - **User Guide** (`00435_CORRESPONDENCE_WORKFLOW_USER_GUIDE.md`) - Workflow overview, agent orchestration, and user navigation
  - **Technical Specification** (`00435_CORRESPONDENCE_WORKFLOW_TECHNICAL_SPEC.md`) - Agent architecture, database keys, and parallel processing
  - **Implementation Guide** (`00435_CORRESPONDENCE_WORKFLOW_IMPLEMENTATION.md`) - Database migration, HITL integration, and system deployment
  - **Configuration Guide** (`00435_CORRESPONDENCE_WORKFLOW_CONFIGURATION.md`) - HITL setup, agent tuning, and performance metrics
  - **Troubleshooting Guide** (`00435_CORRESPONDENCE_WORKFLOW_TROUBLESHOOTING.md`) - HITL issues, agent failures, and debugging procedures
  - **Maintenance Guide** (`00435_CORRESPONDENCE_WORKFLOW_MAINTENANCE.md`) - Version history, monitoring, and enhancement roadmap
- **Correspondence Agent Orchestration (Original)** (`1300_00435_WORKFLOW_CORRESPONDENCE_AGENT_ORCHESTRATION.md`) - Original monolithic workflow documentation

#### **📚 Schema** (`docs/schema/`)
Data schema definitions and documentation

#### **🔗 External Services** (`docs/external-services/`)
Third-party integrations and external service documentation

#### **📊 Reports & Analytics** (`docs/reports/`)
Reporting systems and analytics documentation

### **📁 Specialized Documentation**

#### **📄 Pages Documentation**
- **Agents Pages** (`docs/pages-agents/`) - Agent-specific page documentation
- **Chatbots Pages** (`docs/pages-chatbots/`) - Chatbot interface documentation
- **Forms & Templates** (`docs/pages-forms-templates/`) - Form and template page documentation

#### **📚 Legacy Files** (`docs/legacy-files/`)
Archived and legacy documentation for reference

#### **📊 Mermaid Diagrams** (`docs/mermaid/`)
System architecture and flow diagrams

#### **📋 Other Documentation** (`docs/other/`)
Miscellaneous documentation and resources

---

## **Development Standards & Guidelines**

**📁 Standards Directory**: `docs/standards/` - Centralized location for all development standards

### **Available Standards:**

#### **Agent Coding Standards** (`docs/standards/0000_AGENT_CODING_STANDARDS.md`)
- **Prompt Key Naming Convention**: Hierarchical `{category}_{subcategory}_{specific}_{variant}` structure
- **JavaScript/Node.js Standards**: ES6+ syntax, camelCase/PascalCase conventions, error handling patterns
- **Architectural Patterns**: Express server, React frontend, database design standards
- **AI Agent Guidelines**: Prompt validation, testing requirements, deployment procedures

#### **Prompt Tagging Standards** (`docs/standards/0001_PROMPT_TAGGING_STANDARDS.md`)
- **Tagging Pattern**: `domain:function:variant` hierarchical structure
- **Filtering**: Wildcard support for scalable prompt management
- **Usage Examples**: Correspondence agents, procurement, governance, and safety prompts

#### **File Naming Standards** (`docs/standards/0002_FILE_NAMING_STANDARDS.md`)
- **Naming Convention**: `{category}/{prefix}_{descriptive_name}.{extension}` structure
- **Directory Patterns**: Specific conventions for docs/, client/src/, server/src/, etc.
- **Numeric Prefixing**: Systematic file ordering and categorization
- **Validation**: Automated checking and maintenance procedures

#### **UI Accordion Standards** (`docs/standards/0003_UI_ACCORDION_STANDARDS.md`)
- **Navigation Standards**: Hierarchical organization and alphabetical link ordering
- **Implementation Procedures**: 3-tier fallback system synchronization requirements
- **URL Pattern Standards**: React Router format and routing conventions
- **Section Hierarchy Patterns**: Standardized structures for contracts, directors, design sections

### **Standards Maintenance:**
- All standards are versioned and maintained in the `docs/standards/` directory
- Standards are referenced from this master guide for easy discovery
- Regular updates ensure standards evolve with project requirements

---

## **Quick Reference**

### **🔍 Most Frequently Used Documentation:**

1. **Implementation Overview** → `docs/implementation/README.md`
2. **Procedures Guide** → `docs/procedures/0000_PROCEDURES_GUIDE.md`
3. **Agent Development** → `docs/procedures/0000_AGENT_DEVELOPMENT_PROCEDURE.md`
4. **Database Systems** → `docs/database-systems/0300_SUPABASE_MASTER_GUIDE.md`
5. **Authentication** → `docs/authentication/0020_AUTHENTICATION_OVERVIEW.md`
6. **Data Processing** → `docs/data-processing/0500_DATA_PROCESSING_MASTER_GUIDE.md`

### **🚨 Critical Documentation:**

- **Error Tracking** → `docs/error-tracking/1300_00435_CORRESPONDENCE_AGENT_LLM_EXTRACTION_ERRORS.md`
- **Security Implementation** → `docs/database-systems/0300_SUPABASE_SECURITY_MASTER_GUIDE.md`
- **Privacy Compliance** → `docs/procedures/0000_PRIVACY_PROCEDURE.md`

### **📊 System Architecture:**

- **LangChain Orchestration** → `docs/pages-disciplines/1300_02052_LANGCHAIN_LANGGRAPH_SYSTEM.md`
- **Modal Systems** → `docs/application-logic/1000_CORE_MODAL_SYSTEM_MASTER_GUIDE.md`
- **File Processing** → `docs/data-processing/1380_UNIFIED_FILE_UPLOADER_LANGCHAIN_INTEGRATION.md`

---

## **Documentation Maintenance**

### **File Organization:**
- Documentation follows hierarchical `{category}/{prefix}_{descriptive_name}.{extension}` naming convention
- Numeric prefixes ensure proper ordering within directories
- Related documents are grouped in dedicated subdirectories

### **Update Procedures:**
- Major updates are documented in the Recent Updates section above
- New documentation areas are added to the directory structure section
- Cross-references are maintained between related documents

### **Quality Assurance:**
- All documentation is version-controlled and peer-reviewed
- Links are validated for accuracy and functionality
- Regular audits ensure comprehensive coverage of system components
=======
### **Recent Updates (2025-12-29)**

- **Standardized Prompt Tagging Convention**: Implemented hierarchical `domain:function:variant` tagging system for scalable prompt management across 1000s of prompts - documented in relevant guides
- **Correspondence Agent Prompt Segregation**: Successfully segregated monolithic 1200+ word composite prompt into 7 specialized agent prompts with proper workflow orchestration - complete documentation at prompt management guides
- **LangChain/LangGraph Multi-Agent Orchestration System**: Revolutionary AI workflow architecture with 15 specialized agents across 3 orchestrated workflows - comprehensive documentation at `docs/pages-disciplines/1300_02052_LANGCHAIN_LANGGRAPH_SYSTEM.md`
- **ACCORDION DOCUMENTATION RATIONALIZATION COMPLETE**: Successfully consolidated 7 accordion-related files into 4 core documents (67% reduction) - merged navigation fixes, performance optimization, and flow diagrams into comprehensive implementation guide, archived redundant files with proper documentation
- **COMPREHENSIVE DOCUMENTATION AUDIT COMPLETE**: Found 400+ markdown files vs ~50 referenced in master guide (85% gap identified)
- **Supabase Documentation Rationalization COMPLETE**: Successfully consolidated 7 Supabase-related documentation files (0500_SUPABASE_*) - eliminated 80% redundant tactical docs, archived planning documents, enhanced master guide with dual system analysis
- **Task Management Migration Success**: Successfully migrated 41 tasks from business object tables (procurement_orders, scope_of_work, sow_appendices) to centralized task management system with proper UUID relationships and HITL support
- **PostgreSQL Migration Fixes**: Resolved all syntax errors including IMMUTABLE function errors, UUID format conflicts, and standalone RAISE NOTICE statements
- **Documentation Consolidation**: Combined documentation guide and reorganization tracking into unified master guide
- **Hybrid Prompt Management System**: Implemented comprehensive developer-only prompt editing with user preference controls across all procedures and documentation
+++++++ REPLACE</diff>
</replace_in_file>
