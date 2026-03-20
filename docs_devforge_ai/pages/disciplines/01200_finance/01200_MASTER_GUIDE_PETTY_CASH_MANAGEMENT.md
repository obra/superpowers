# 1300_01200_MASTER_GUIDE_PETTY_CASH_MANAGEMENT.md - Petty Cash Management Master Guide

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [x] Audit completed

## Version History
- v1.0 (2025-11-27): Comprehensive Petty Cash Management Interface Master Guide

## Overview
The Petty Cash Management Interface (`/petty-cash`) provides a comprehensive web-based solution for managing petty cash requests, approvals, and tracking within the ConstructAI system. It serves as the primary interface for employees to submit expense reimbursement requests and for managers to review, approve, or reject these requests in an efficient, auditable workflow.

## Route Information
**Route:** `/petty-cash`
**Access:** Finance Page → Hash-based routing
**Parent Page:** 01200 Finance
**Navigation:** Hash-based routing (not in main accordion)

## Core Features

### 1. Petty Cash Request Submission
**Purpose:** Streamlined submission process for petty cash reimbursement requests with comprehensive validation and document support

**Key Capabilities:**
- **Request Creation:** User-friendly form for submitting petty cash requests with all required fields
- **Category Classification:** Pre-defined expense categories (Office Supplies, Travel, Meals, Transport, Miscellaneous)
- **Project Association:** Link requests to specific projects and project phases for cost allocation
- **Document Upload:** Multi-file upload support for receipts and supporting documentation (PDF, JPG, PNG)
- **Amount Validation:** Real-time validation of expense amounts with currency formatting
- **Auto-save Drafts:** Automatic saving of incomplete requests to prevent data loss

**Request Workflow:**
- User initiates request through intuitive modal interface
- Form validation ensures all required fields are completed
- Supporting documents are uploaded and processed
- Request is submitted with unique ID generation
- Automatic notification to approvers
- Request enters pending approval queue

### 2. Approval and Review System
**Purpose:** Comprehensive approval workflow with individual and bulk approval capabilities for efficient expense management

**Key Capabilities:**
- **Individual Approval:** Approve or reject requests with optional rejection reasons
- **Bulk Operations:** Select and approve/reject multiple requests simultaneously
- **Approval History:** Complete audit trail of approval actions and timestamps
- **Approver Assignment:** Role-based approval routing based on request amount and category
- **Conditional Approvals:** Automatic approval for requests below threshold amounts
- **Rejection Management:** Detailed rejection reasons and communication to requestors

**Approval Process:**
- Requests automatically route to appropriate approvers
- Approvers receive notifications of pending requests
- Review interface provides complete request details
- Approval/rejection actions are logged with timestamps
- Approved requests update financial records
- Rejected requests return to requestor with feedback

### 3. Request Tracking and Monitoring
**Purpose:** Real-time visibility into petty cash request status and comprehensive reporting capabilities

**Key Capabilities:**
- **Status Dashboard:** Visual dashboard showing request counts by status (pending, approved, rejected)
- **Request History:** Complete chronological history of all requests with filtering
- **Search Functionality:** Advanced search by user, project, category, date range, and keywords
- **Real-time Updates:** Live updates of request status changes without page refresh
- **Notification System:** Toast notifications for all user actions and status changes
- **Export Capabilities:** CSV and Excel export of filtered request data

**Tracking Features:**
- Real-time statistics display (total, pending, approved, rejected amounts)
- Advanced filtering and sorting options
- Request detail view with complete transaction information
- Document viewer for attached receipts and supporting files
- Audit trail for all status changes and user actions

### 4. Document Management
**Purpose:** Secure document upload, storage, and retrieval system for petty cash receipts and supporting documentation

**Key Capabilities:**
- **Multi-format Support:** PDF, JPG, JPEG, PNG file format support
- **Batch Upload:** Upload multiple documents simultaneously
- **Document Preview:** Integrated document viewer for receipt verification
- **File Validation:** Automatic file type and size validation
- **Secure Storage:** Encrypted document storage with access controls
- **Document Linking:** Direct association of documents with specific requests

**Document Processing:**
- Client-side file validation before upload
- Progress indicators for large file uploads
- Automatic file type detection and preview generation
- Secure upload to Supabase storage with authentication
- Document metadata tracking (filename, size, upload date)
- Integration with request approval workflow

## Component Architecture

### Core Components
- **PettyCashPage:** Main container component managing state and routing
- **RequestForm:** Modal component for creating and editing requests
- **ApprovalModal:** Interface for individual request approval/rejection
- **BulkApprovalModal:** Mass approval interface for multiple requests
- **DocumentViewer:** Secure document display and download component
- **StatsDashboard:** Real-time statistics and KPI display

### Supporting Components
- **SearchFilter:** Advanced filtering and search functionality
- **DataTable:** Sortable, paginated request display table
- **ToastSystem:** User notification and feedback system
- **ModalSystem:** Reusable modal framework for all dialogs
- **FileUpload:** Secure document upload with progress tracking

## Technical Implementation

### Database Schema
**Petty Cash Table:**
```javascript
const pettyCashSchema = {
  id: 'uuid (primary key)',
  user_id: 'uuid (foreign key to user_management)',
  project_id: 'uuid (foreign key to projects, nullable)',
  phase_id: 'uuid (foreign key to project_phases, nullable)',
  date: 'date (expense date)',
  amount: 'decimal (expense amount in ZAR)',
  category: 'enum (office-supplies, travel, meals, transport, miscellaneous)',
  description: 'text (detailed expense description)',
  status: 'enum (pending, approved, rejected)',
  receipt_url: 'text (document storage URL, nullable)',
  receipt_filename: 'text (original filename, nullable)',
  submitted_at: 'timestamp (submission timestamp)',
  approved_at: 'timestamp (approval timestamp, nullable)',
  rejected_at: 'timestamp (rejection timestamp, nullable)',
  approver_id: 'uuid (approver user ID, nullable)',
  rejection_reason: 'text (rejection explanation, nullable)',
  created_at: 'timestamp (record creation)',
  updated_at: 'timestamp (last modification)'
};
```

### State Management
**Component State:**
- Request data with real-time updates
- Modal visibility and form states
- Selected requests for bulk operations
- Filter and search parameters
- Upload progress and document states
- User authentication and permissions

### API Integration
**Supabase Operations:**
- Real-time subscriptions for live updates
- Row-level security policies for data access
- File storage integration for documents
- User management integration for approvers
- Project data synchronization

## User Interface

### Main Dashboard
```
┌─────────────────────────────────────────────────┐
│ Petty Cash Management                        │
├─────────────────────────────────────────────────┤
│ [📋 Requests] [📊 Export] [🔄 Refresh]        │
├─────────────────┬───────────────────────────────┤
│ 📊 Statistics   │ 📋 Petty Cash Requests        │
│ • Total: R15,420│ ┌─────────────────────────┐  │
│ • Pending: 8    │ │ Date │ User │ Amount │ ... │
│ • Approved: 12  │ └─────────────────────────┘  │
│ • Rejected: 2   │                              │
├─────────────────┴───────────────────────────────┤
│ 🔍 Search & Filters | Bulk Actions            │
└─────────────────────────────────────────────────┘
```

### Request Submission Form
**Form Fields:**
- **Date:** Expense date with calendar picker
- **Amount:** Currency input with ZAR prefix and validation
- **Category:** Dropdown with predefined expense categories
- **Project:** Optional project selection for cost allocation
- **Project Phase:** Optional phase selection for detailed tracking
- **Description:** Multi-line text area for expense details
- **Documents:** File upload for receipts and supporting documents

### Request Detail View
**Information Display:**
- Complete request information in organized grid layout
- Status badges with color coding
- Document preview and download links
- Approval/rejection history with timestamps
- Rejection reasons when applicable

## Petty Cash Categories

### Office Supplies
**Purpose:** Stationery, printing, and general office expenses
**Examples:** Pens, paper, printer ink, office supplies
**Approval Threshold:** Automatic approval under R500

### Travel Expenses
**Purpose:** Business travel related costs
**Examples:** Taxi fares, parking, tolls, mileage claims
**Approval Threshold:** Manager approval required over R200

### Meals & Entertainment
**Purpose:** Client meetings and business meals
**Examples:** Client lunches, business dinners, refreshments
**Approval Threshold:** Manager approval required over R300

### Transport Costs
**Purpose:** Transportation and delivery expenses
**Examples:** Courier services, postal fees, local transport
**Approval Threshold:** Automatic approval under R150

### Miscellaneous Expenses
**Purpose:** Other legitimate business expenses
**Examples:** Training materials, small tools, miscellaneous items
**Approval Threshold:** Manager approval required over R250

## Approval Workflow

### Automatic Approval Rules
**Low-Value Requests:**
- Office Supplies: ≤ R500
- Transport: ≤ R150
- Travel: ≤ R200
- Meals: ≤ R300
- Miscellaneous: ≤ R250

### Manual Approval Requirements
**High-Value Requests:**
- Amounts exceeding category thresholds
- Requests from new employees (first 3 months)
- Requests with incomplete documentation
- Requests for unusual expense categories

### Approval Routing
**Primary Approvers:**
- Direct supervisors for amounts ≤ R2,000
- Department heads for amounts ≤ R5,000
- Finance managers for amounts > R5,000
- Executive approval for amounts > R10,000

## Security and Compliance

### Data Security
**Access Controls:**
- Role-based access to petty cash functions
- User authentication required for all operations
- Encrypted data transmission and storage
- Secure file upload with virus scanning
- Audit trail for all financial transactions

### Financial Compliance
**Regulatory Requirements:**
- Complete audit trail for all transactions
- Segregation of duties (requestor ≠ approver)
- Approval limits and dual authorization
- Document retention policies
- Financial reporting integration

### Data Privacy
**Personal Information:**
- Minimal personal data collection
- Secure storage of user information
- Access logging for compliance auditing
- Data retention policies aligned with regulations
- User consent for data processing

## Performance and Scalability

### Optimization Features
**Performance Enhancement:**
- Lazy loading of request lists
- Efficient database queries with indexing
- Client-side caching of frequently used data
- Asynchronous file uploads
- Optimized re-renders with React.memo

### Scalability Considerations
**Enterprise Features:**
- Support for multiple currencies (future expansion)
- Multi-company support with data isolation
- High-volume request processing
- Integration with ERP systems
- Mobile-responsive design

## Integration Points

### Finance System Integration
**Accounting Integration:**
- Automatic journal entry creation for approved requests
- Expense account coding and allocation
- Integration with general ledger systems
- Tax calculation and reporting
- Financial statement impact analysis

### Project Management Integration
**Project Cost Tracking:**
- Automatic cost allocation to projects
- Project budget integration and monitoring
- Cost center reporting and analysis
- Project profitability impact assessment
- Resource cost tracking and forecasting

### User Management Integration
**HR System Integration:**
- Employee information synchronization
- Approval hierarchy management
- Department and cost center mapping
- User role and permission management
- Organizational structure integration

## Usage Scenarios

### 1. Employee Expense Submission
**Scenario:** Field engineer submits fuel and meal expenses after site visit
- Access petty cash interface through finance menu
- Select appropriate categories (Transport, Meals)
- Upload fuel receipt and meal invoice
- Link to specific project and phase
- Submit request with detailed descriptions
- Receive automatic approval notification

### 2. Manager Review and Approval
**Scenario:** Department manager reviews pending petty cash requests
- Access approval queue through dashboard
- Review request details and supporting documents
- Apply bulk approval for routine expenses
- Provide rejection reasons for invalid requests
- Monitor approval statistics and trends

### 3. Finance Team Reconciliation
**Scenario:** Finance officer reconciles petty cash transactions
- Export approved requests for accounting
- Verify supporting documentation
- Create journal entries for reimbursement
- Update financial records and budgets
- Generate reconciliation reports

## Future Development Roadmap

### Phase 1: Enhanced Automation
- **OCR Integration:** Automatic receipt scanning and data extraction
- **Policy Engine:** Configurable approval rules and spending limits
- **Mobile App:** Native mobile application for expense submission
- **Email Integration:** Automated expense report generation
- **Smart Categorization:** AI-powered expense categorization

### Phase 2: Advanced Analytics
- **Spending Analytics:** Expense trend analysis and forecasting
- **Budget Integration:** Real-time budget monitoring and alerts
- **Fraud Detection:** Machine learning fraud detection algorithms
- **Compliance Monitoring:** Automated policy compliance checking
- **Predictive Insights:** Expense pattern recognition and recommendations

### Phase 3: Enterprise Integration
- **ERP Integration:** Seamless integration with major ERP systems
- **Multi-currency Support:** Global expense management capabilities
- **Advanced Workflow:** Complex approval workflows and routing
- **Blockchain Auditing:** Immutable audit trails for compliance
- **AI Assistant:** Intelligent expense management recommendations

## Related Documentation

- [1300_01200_MASTER_GUIDE_FINANCE.md](1300_01200_MASTER_GUIDE_FINANCE.md) - Main finance guide
- [1300_01200_MASTER_GUIDE_FINANCIAL_MANAGEMENT_INTERFACE.md](1300_01200_MASTER_GUIDE_FINANCIAL_MANAGEMENT_INTERFACE.md) - Financial management interface
- [1300_01200_MASTER_GUIDE_FINANCIAL_DASHBOARD.md](1300_01200_MASTER_GUIDE_FINANCIAL_DASHBOARD.md) - Financial dashboard
- [1300_01300_MASTER_GUIDE_APPROVAL_MATRIX.md](1300_01300_MASTER_GUIDE_APPROVAL_MATRIX.md) - Approval workflow matrix

## Status
- [x] Request submission implemented
- [x] Approval workflow configured
- [x] Document management deployed
- [x] Security and compliance verified
- [x] Performance optimization completed
- [x] Future development roadmap defined

## Version History
- v1.0 (2025-11-27): Comprehensive Petty Cash Management master guide
