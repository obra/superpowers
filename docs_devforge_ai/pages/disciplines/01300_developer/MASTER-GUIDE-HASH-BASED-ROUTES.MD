# 1300_00000_MASTER_GUIDE_HASH_BASED_ROUTES.md - Complete Hash-Based Routes Master Guide

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [x] Audit completed

## Version History
- v1.0 (2025-11-27): Comprehensive Hash-Based Routes Master Guide

## Overview
The ConstructAI system includes extensive hash-based routing functionality (`#/page-name`) that provides specialized functionality not included in the main accordion navigation. These routes offer direct access to advanced features, sub-systems, and specialized tools across all disciplines. This master guide documents all hash-based routes and their technical implementations.

## Navigation Architecture

### Hash-Based Routing System
**Routing Pattern:** `/#/{discipline}/{sub-function}`
- **Advantages:** Direct URL access, bookmarkable, browser history support
- **Implementation:** Client-side routing with hash change detection
- **Integration:** Accessible via main discipline pages or direct URL navigation

### Access Methods
1. **Main Page Integration:** Discipline pages provide buttons linking to hash routes
2. **Direct URL Access:** Users can bookmark and directly access hash routes
3. **Cross-Navigation:** Routes can link to each other for workflow continuity
4. **Mobile Access:** Responsive design for mobile and tablet access

## Procurement Hash-Based Routes

### 1. Purchase Orders (`#/purchase-orders`)
**Route:** `/purchase-orders`  
**Purpose:** Comprehensive purchase order management system

**Key Features:**
- **PO Creation:** Automated purchase order generation and approval
- **Vendor Management:** Supplier database and performance tracking
- **Approval Workflows:** Multi-level approval processes and escalations
- **Integration:** Connection to ERP systems and financial software
- **Reporting:** Purchase order analytics and spend analysis

### 2. Supplier Directory (`#/supplier-directory`)
**Route:** `/supplier-directory`  
**Purpose:** Centralized supplier management and evaluation platform

**Key Features:**
- **Supplier Profiles:** Comprehensive supplier information and documentation
- **Performance Tracking:** Supplier performance metrics and KPIs
- **Contract Management:** Supplier contract tracking and renewal alerts
- **Compliance Monitoring:** Supplier compliance and certification tracking
- **Search and Filtering:** Advanced supplier search and categorization

### 3. Scope of Work (`#/scope-of-work`)
**Route:** `/scope-of-work`  
**Purpose:** Scope of work generation and management system

**Key Features:**
- **SOW Templates:** Pre-configured scope of work templates
- **Dynamic Generation:** AI-powered SOW creation based on project requirements
- **Approval Workflows:** Multi-stakeholder approval and sign-off processes
- **Version Control:** SOW versioning and change tracking
- **Integration:** Connection to project management and contract systems

### 4. Procurement Templates (`#/01900-procurement-templates`)
**Route:** `/01900-procurement-templates`  
**Purpose:** Procurement document template management

**Key Features:**
- **Template Library:** Comprehensive procurement document templates
- **Customization:** Template customization for specific procurement needs
- **Compliance:** Regulatory compliance and standard requirement templates
- **Collaboration:** Team-based template development and approval

## Safety Hash-Based Routes

### 1. Safety Document Templates (`#/safety-document-templates`)
**Route:** `/safety-document-templates`  
**Purpose:** HSE document template management system

**Key Features:**
- **HSE Templates:** Safety document templates for various scenarios
- **Risk Assessment:** Automated risk assessment template generation
- **Compliance:** Regulatory compliance document templates
- **Training Materials:** Safety training and briefing templates

### 2. Inspections (`#/inspections`)
**Route:** `/inspections`  
**Purpose:** Safety inspection management and reporting

**Key Features:**
- **Inspection Checklists:** Digital inspection checklists and forms
- **Photo Documentation:** Evidence collection and photo documentation
- **Non-Conformance Tracking:** Issue identification and corrective action tracking
- **Reporting:** Inspection reports and compliance documentation

### 3. Contractor Vetting (`#/contractor-vetting`)
**Route:** `/contractor-vetting`  
**Purpose:** Contractor safety qualification and assessment

**Key Features:**
- **Safety Assessments:** Contractor safety capability evaluations
- **Documentation Review:** Contractor safety documentation verification
- **Performance Tracking:** Historical safety performance analysis
- **Certification Management:** Safety certification tracking and renewal

### 4. Form Completion (`#/form-completion`)
**Route:** `/form-completion`  
**Purpose:** Safety form completion and submission system

**Key Features:**
- **Dynamic Forms:** Context-aware safety form generation
- **Guided Completion:** Step-by-step form completion assistance
- **Validation:** Real-time form validation and error checking
- **Digital Signatures:** Electronic signature capture and verification

## Finance Hash-Based Routes

### 1. Financial Dashboard (`#/financial-dashboard`)
**Route:** `/financial-dashboard`  
**Purpose:** Comprehensive financial performance dashboard

**Key Features:**
- **KPI Monitoring:** Real-time financial metrics and KPIs
- **Budget Tracking:** Budget vs actual spending analysis
- **Cash Flow:** Cash flow forecasting and management
- **Financial Reporting:** Automated financial report generation

### 2. Petty Cash (`#/petty-cash`)
**Route:** `/petty-cash`  
**Purpose:** Petty cash management and tracking system

**Key Features:**
- **Expense Tracking:** Petty cash expense recording and categorization
- **Reimbursement:** Automated expense reimbursement workflows
- **Approval Processes:** Multi-level approval for petty cash requests
- **Audit Trail:** Complete transaction history and audit logging

### 3. Financial Management (`#/financial-management`)
**Route:** `/financial-management`  
**Purpose:** Advanced financial management and analysis platform

**Key Features:**
- **Financial Planning:** Budget planning and forecasting tools
- **Cost Analysis:** Project cost analysis and variance reporting
- **Financial Controls:** Financial control and compliance monitoring
- **Integration:** Connection to accounting systems and ERP

## Governance Hash-Based Routes

### 1. Document Approval (`#/01300-document-approval`)
**Route:** `/01300-document-approval`  
**Purpose:** Enterprise document approval workflow system

**Key Features:**
- **Approval Workflows:** Configurable multi-level approval processes
- **Document Routing:** Automated document routing based on type and value
- **Escalation Rules:** Automatic escalation for overdue approvals
- **Audit Logging:** Complete approval history and decision tracking

### 2. Approval Matrix (`#/01300-approval-matrix`)
**Route:** `/01300-approval-matrix`  
**Purpose:** Approval matrix configuration and management

**Key Features:**
- **Matrix Configuration:** Dynamic approval matrix setup and management
- **Role-Based Routing:** Approval routing based on user roles and permissions
- **Delegation:** Approval delegation and substitute assignment
- **Compliance:** Regulatory compliance and audit requirements

### 3. Form Creation (`#/form-creation`)
**Route:** `/form-creation`  
**Purpose:** Dynamic form creation and management platform

**Key Features:**
- **Form Builder:** Drag-and-drop form creation interface
- **Field Types:** Comprehensive field types and validation rules
- **Workflow Integration:** Form integration with approval workflows
- **Template Library:** Reusable form templates and components

### 4. Form Management (`#/01300-form-management`)
**Route:** `/01300-form-management`  
**Purpose:** Form lifecycle management and analytics

**Key Features:**
- **Form Analytics:** Form usage analytics and performance metrics
- **Version Control:** Form versioning and change management
- **Access Control:** Form access permissions and security
- **Integration:** Connection to data systems and reporting tools

## Operations Hash-Based Routes

### 1. Stock Management (`#/stock-management`)
**Route:** `/stock-management`  
**Purpose:** Inventory and stock management system

**Key Features:**
- **Inventory Tracking:** Real-time inventory levels and movements
- **Stock Alerts:** Low stock alerts and reorder point management
- **Location Management:** Multi-location inventory tracking
- **Reporting:** Inventory reports and analytics

### 2. Maintenance Management (`#/maintenance-management`)
**Route:** `/maintenance-management`  
**Purpose:** Equipment maintenance scheduling and tracking

**Key Features:**
- **Preventive Maintenance:** Scheduled maintenance planning and tracking
- **Work Orders:** Maintenance work order generation and management
- **Asset Management:** Equipment asset tracking and lifecycle management
- **Performance Analytics:** Maintenance effectiveness and cost analysis

### 3. Fuel Lubricants Management (`#/fuel-lubricants-management`)
**Route:** `/fuel-lubricants-management`  
**Purpose:** Fuel and lubricant inventory management

**Key Features:**
- **Fuel Tracking:** Fuel consumption and inventory management
- **Lubricant Management:** Lubricant type tracking and usage analysis
- **Supplier Management:** Fuel and lubricant supplier performance
- **Compliance:** Environmental compliance and reporting

## Human Resources Hash-Based Routes

### 1. Job Descriptions (`#/01500-human-resources/job-descriptions`)
**Route:** `/01500-human-resources/job-descriptions`  
**Purpose:** Job description management and development

**Key Features:**
- **JD Templates:** Standardized job description templates
- **Skill Mapping:** Job skill requirements and competency mapping
- **Career Progression:** Career path development and planning
- **Compliance:** Employment law compliance and equal opportunity

### 2. CV Processing (`#/cv-processing`)
**Route:** `/cv-processing`  
**Purpose:** Resume/CV processing and candidate evaluation

**Key Features:**
- **AI Processing:** Automated CV parsing and data extraction
- **Candidate Matching:** Job-candidate matching algorithms
- **Evaluation Tools:** Standardized candidate evaluation frameworks
- **Diversity Analytics:** Diversity and inclusion analytics

## Other Specialized Routes

### 1. Document Version Management (`#/document-version-management`)
**Route:** `/document-version-management`  
**Purpose:** Enterprise document version control system

**Key Features:**
- **Version Tracking:** Complete document version history
- **Concurrent Editing:** Real-time collaborative document editing
- **Conflict Resolution:** Automatic conflict detection and resolution
- **Audit Trail:** Complete document change history and approvals

### 2. Templates Forms Management (`#/templates-forms-management`)
**Route:** `/templates-forms-management`  
**Purpose:** Unified templates and forms management platform

**Key Features:**
- **Template Library:** Centralized template repository
- **Form Integration:** Seamless integration between templates and forms
- **Customization:** Template and form customization tools
- **Governance:** Template and form lifecycle governance

### 3. Accordion Management (`#/accordion-management`)
**Route:** `/accordion-management`  
**Purpose:** Accordion navigation system management

**Key Features:**
- **Navigation Configuration:** Dynamic navigation menu configuration
- **User Permissions:** Role-based navigation access control
- **Analytics:** Navigation usage analytics and optimization
- **A/B Testing:** Navigation effectiveness testing and improvement

### 4. User Management (`#/user-management`)
**Route:** `/user-management`  
**Purpose:** Comprehensive user management and administration

**Key Features:**
- **User Lifecycle:** User onboarding, management, and offboarding
- **Role Management:** Role-based access control and permissions
- **Bulk Operations:** Bulk user operations and data management
- **Compliance:** User data privacy and compliance management

### 5. Schema Dashboard (`#/schema-dashboard`)
**Route:** `/schema-dashboard`  
**Purpose:** Database schema visualization and management

**Key Features:**
- **Schema Visualization:** Interactive database schema diagrams
- **Relationship Mapping:** Table relationship visualization and management
- **Performance Monitoring:** Database performance metrics and optimization
- **Migration Tracking:** Schema migration planning and execution

### 6. RLS Security Dashboard (`#/rls-security-dashboard`)
**Route:** `/rls-security-dashboard`  
**Purpose:** Row Level Security monitoring and management

**Key Features:**
- **Security Policy Monitoring:** RLS policy effectiveness tracking
- **Access Analytics:** User access patterns and security analytics
- **Policy Management:** Dynamic security policy creation and modification
- **Compliance Reporting:** Security compliance and audit reporting

## Utility and Development Routes

### 1. Auth Callback (`#/auth-callback`)
**Route:** `/auth-callback`  
**Purpose:** Authentication callback handler for external auth providers

**Key Features:**
- **OAuth Integration:** Support for multiple OAuth providers
- **Token Management:** Secure token storage and refresh
- **Error Handling:** Authentication error handling and user feedback
- **Security:** Secure authentication flow and data protection

### 2. Final Onboarding (`#/00102-final-onboarding`)
**Route:** `/00102-final-onboarding`  
**Purpose:** Final user onboarding and system introduction

**Key Features:**
- **Guided Tour:** Interactive system introduction and tutorials
- **Setup Completion:** Final account setup and configuration
- **Training Modules:** Role-specific training and certification
- **Progress Tracking:** Onboarding completion tracking and analytics

### 3. Logistics Tracking (`#/logistics-tracking`)
**Route:** `/logistics-tracking`  
**Purpose:** Logistics and supply chain tracking system

**Key Features:**
- **Shipment Tracking:** Real-time shipment location and status
- **Route Optimization:** AI-powered delivery route optimization
- **Performance Analytics:** Logistics performance metrics and KPIs
- **Integration:** Connection to transportation and logistics providers

## Technical Implementation

### Shared Architecture
**Framework:** React-based single-page application with hash routing
**State Management:** Redux/Context API for application state
**Data Layer:** Supabase for database operations and real-time updates
**Authentication:** Role-based access control with JWT tokens
**API Integration:** RESTful APIs with GraphQL for complex queries

### Performance Optimization
- **Code Splitting:** Route-based code splitting for faster loading
- **Lazy Loading:** Component lazy loading for improved performance
- **Caching:** Intelligent caching strategies for data and assets
- **CDN Integration:** Global content delivery for static assets

### Security Implementation
- **Authentication:** Multi-factor authentication support
- **Authorization:** Granular permission system with RBAC
- **Encryption:** End-to-end encryption for sensitive data
- **Audit Logging:** Comprehensive security event logging
- **Compliance:** GDPR, SOC-II, and industry-specific compliance

### Monitoring and Analytics
- **Performance Monitoring:** Real-time application performance tracking
- **User Analytics:** Usage patterns and feature adoption metrics
- **Error Tracking:** Automated error detection and alerting
- **Business Intelligence:** ROI tracking and business value measurement

## Integration Points

### Enterprise Systems
- **ERP Integration:** SAP, Oracle, Microsoft Dynamics connectivity
- **CRM Integration:** Salesforce, HubSpot, and custom CRM systems
- **HR Systems:** Workday, ADP, and HR information systems
- **Financial Systems:** QuickBooks, Xero, and accounting software

### Cloud Services
- **AWS Integration:** S3, Lambda, and other AWS services
- **Azure Integration:** Azure AD, Blob Storage, and Functions
- **Google Cloud:** BigQuery, Cloud Storage, and AI services
- **Multi-Cloud:** Hybrid cloud architecture support

### Third-Party APIs
- **Payment Processing:** Stripe, PayPal integration
- **Communication:** Twilio, SendGrid for messaging
- **Analytics:** Google Analytics, Mixpanel integration
- **Monitoring:** DataDog, New Relic integration

## Future Development Roadmap

### Phase 1: Enhanced User Experience
- **Progressive Web App:** PWA capabilities for offline functionality
- **Mobile Optimization:** Native mobile app development
- **Voice Interfaces:** Voice-activated commands and responses
- **AI Assistants:** Intelligent user guidance and automation

### Phase 2: Advanced Analytics
- **Machine Learning:** Predictive analytics and AI-driven insights
- **Real-time Dashboards:** Live data visualization and monitoring
- **Custom Reporting:** Self-service reporting and analytics
- **Data Science Platform:** Advanced data analysis and modeling

### Phase 3: Enterprise Integration
- **API Marketplace:** Third-party integration marketplace
- **Blockchain Integration:** Immutable audit trails and smart contracts
- **IoT Integration:** Connected device monitoring and management
- **Edge Computing:** Distributed computing and processing

### Phase 4: Global Expansion
- **Multi-Language Support:** Internationalization and localization
- **Multi-Currency:** Global financial management capabilities
- **Regional Compliance:** Country-specific regulatory compliance
- **Global Collaboration:** Cross-border team collaboration tools

## Related Documentation

- [1300_00000_PAGE_LIST.md](1300_00000_PAGE_LIST.md) - Complete page catalog with hash routes
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](1300_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture
- [1300_02050_MASTER_GUIDE_INFORMATION_TECHNOLOGY_HASH_ROUTES.md](1300_02050_MASTER_GUIDE_INFORMATION_TECHNOLOGY_HASH_ROUTES.md) - IT hash routes detail

## Status
- [x] All hash-based routes documented
- [x] Technical implementations outlined
- [x] Security and performance considerations addressed
- [x] Integration points identified
- [x] Future development roadmap planned

## Version History
- v1.0 (2025-11-27): Comprehensive hash-based routes master guide
