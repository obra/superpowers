# Supplier Directory - Consolidated Documentation

## Overview

The Supplier Directory is a comprehensive supplier management interface that provides full lifecycle management for supplier relationships within the procurement system. Built to mirror the layout and styling patterns of the existing 00200 all documents page, it offers advanced search capabilities, approval workflows, and data import/export functionality.

## Key Features Implemented

### 1. Enhanced Database Schema
**File:** `sql/migrations/enhance-suppliers-table.sql`

Enhanced the `suppliers` table with the following new fields:
- `website` (TEXT) - Supplier website URL with validation and formatting
- `approval_status` (TEXT) - Auto-set to 'pending' with allowed values: pending, approved, rejected, under_review, suspended
- `goods_services` (TEXT) - Description of goods and services provided
- `rating` (DECIMAL(3,2)) - Supplier rating on 0-5 scale with default 0.00
- `completed_projects` (INTEGER) - Number of completed projects with default 0
- `registration_date` (DATE) - Registration date with default to current date
- `last_activity` (TIMESTAMP WITH TIME ZONE) - Last activity timestamp with default to NOW()
- `tax_number` (TEXT) - Tax/VAT registration number
- `compliance_status` (TEXT) - Compliance status with allowed values: compliant, non_compliant, pending_review, under_investigation
- `source_url` (TEXT) - Source URL for traceability
- `scrape_method` (TEXT) - Method used for scraping
- `scraped_at` (TIMESTAMP WITH TIME ZONE) - Scraping timestamp

### 2. Enhanced ContactScraperModal.js

#### URL Validation and Formatting
- Added `validateAndFormatUrl()` method to ensure proper URL formatting
- Automatically adds `https://` prefix if missing
- Validates URL format using JavaScript URL constructor

#### Duplicate Checking Mechanism
- Added `checkForDuplicates()` method with intelligent matching:
  - Fuzzy name matching using normalized comparison
  - Exact website URL matching
  - Case-insensitive company name searches
- Visual indicators for duplicates in chat output with `[DUPLICATE]` flag

#### Enhanced Data Insertion
- Auto-sets `approval_status` to 'pending' for all new suppliers
- Tracks metadata: `source_url`, `scrape_method`, `scraped_at`
- Validates mandatory fields before insertion
- Comprehensive error handling with detailed logging

#### Data Integrity Validation
- Mandatory field validation for company name
- Proper data type handling and default values
- Error categorization and reporting

### 3. Enhanced Chat Interface
- Detailed progress reporting with agent names
- Duplicate detection warnings with clear `[DUPLICATE]` indicators
- Error reporting with specific error messages
- Success summaries with saved record counts

## Visual Design Guidelines

### Background Implementation Rules
⚠️ **CRITICAL REQUIREMENT**: This page should **NOT** include any background images.

- **Reference Standard**: Follows 00200 all documents page visual patterns
- **Background Policy**: Clean, minimal background with CSS variables only
- **Prohibited Elements**:
  - Fixed background images (like those in 00106 timesheet page)
  - Background image URLs or assets
  - Full-screen background overlays
  - Any `backgroundImage` CSS properties

### Visual Style Standards
✅ **APPROVED STYLING APPROACH**:
- CSS custom properties for theming (`--primary-color: #FFA500`)
- Semi-transparent card backgrounds (`rgba(255, 255, 255, 0.95)`)
- Solid color backgrounds only
- Border and shadow effects for visual depth
- Color-coded status indicators and badges

## Navigation & Access

### Accordion Integration
- **Access Path**: Procurement Section → Supplier Directory
- **Navigation Method**: Accordion-based navigation (not modal-based)
- **URL Route**: `/supplier-directory`
- **Integration**: Added to MASTER_TEMPLATE in `accordion-sections-routes.js`

### Route Configuration
```javascript
// Added to client/src/App.js
<Route path="/supplier-directory" element={<SupplierDirectoryPage />} />
```

## Page Structure

### Layout Container
**REQUIRED**: Clean container without background images:
```javascript
<div className="supplier-directory-container">
  {/* NO background image elements */}
  {/* Clean card-based layout only */}
</div>
```

### Header Section
- **Title**: "Supplier Directory" with matching typography from 00200 page
- **Subtitle**: "Comprehensive supplier management and approval system"
- **Icon**: People icon (bi-people) for visual consistency
- **Background**: Semi-transparent white card (`rgba(255, 255, 255, 0.95)`)

### Action Button Row
Located in the header section, providing quick access to primary functions:
- **Import Button**: Upload and import supplier data from files
- **Export Button**: Download supplier data in multiple formats
- **Sync Contacts**: Synchronize with external systems
- **Bulk Approve**: Approve multiple selected suppliers
- **Refresh Button**: Reload supplier data

## Dashboard Features

### Statistics Cards Row
Four key metrics displayed in prominent cards with **card-based backgrounds only**:

1. **Total Suppliers**
   - Icon: bi-people
   - Background: White card with orange border
   - Color: Primary orange theme

2. **Approved Suppliers**
   - Icon: bi-check-circle
   - Background: White card with orange border
   - Color: Success green

3. **Pending Suppliers**
   - Icon: bi-clock-history
   - Background: White card with orange border
   - Color: Warning yellow

4. **Average Rating**
   - Icon: bi-star
   - Background: White card with orange border
   - Color: Info blue

## Search & Filtering System

### Primary Search Bar
- **Multi-field Search**: Searches across name, email, phone, and contact person
- **Real-time Filtering**: Updates results as user types
- **Icon**: Search icon (bi-search) in input group
- **Container**: White card background with orange border

### Advanced Filters

#### Supplier Type Filter
- **Options**: All Types, Contractor, Materials, Services, Equipment, Transport, Professional Services, Utility
- **Index**: Leverages supplier type categorization
- **Icons**: Each type has corresponding Bootstrap icon

#### Approval Status Filter
- **Options**: All Statuses, Pending Approval, Approved, Rejected, Under Review, Suspended
- **Color Coding**: Each status has associated Bootstrap variant colors
- **Visual Indicators**: Badge styling with appropriate colors

#### Project Filter
- **Options**: All Projects, plus specific project selections
- **Relationship**: Uses suppliers_project_id_fkey relation
- **Display**: Shows project names for better UX

### Clear Filters
- **Button**: "Clear Filters" button to reset all search criteria
- **Function**: Resets search term and all filter dropdowns to default "all" state

## Supplier Data Management

### Data Model
Each supplier record contains:
- **Core Information**: ID, name, contact person, email, phone
- **Classification**: Supplier type, approval status
- **Project Association**: Project ID and name through foreign key relationship
- **Performance Metrics**: Rating, completed projects count
- **Compliance Data**: Registration date, last activity, compliance status
- **Business Details**: Address, tax/VAT number

### Mock Data Structure
Includes realistic supplier data with:
- South African companies and contact information
- Various supplier types (contractors, materials, services, etc.)
- Different approval statuses for testing workflows
- Project associations and performance metrics
- Compliance and business registration details

## Approval Workflow System

### Status Hierarchy
1. **Pending**: Initial status for new suppliers
2. **Under Review**: Suppliers being evaluated
3. **Approved**: Active, approved suppliers
4. **Rejected**: Suppliers that didn't meet criteria
5. **Suspended**: Previously approved suppliers temporarily suspended

### Individual Approval Actions
- **Quick Approve/Reject**: Green check and red X buttons for pending suppliers
- **Dropdown Menu**: Additional actions including:
  - View Details
  - Approve/Reject/Mark for Review
  - Edit supplier information

### Bulk Approval System
- **Selection Mode**: Toggle between view and selection modes
- **Multi-select**: Checkbox selection for individual suppliers
- **Select All**: Toggle to select all visible suppliers
- **Bulk Actions Modal**: Centralized modal for bulk operations:
  - Approve All Selected
  - Mark for Review
  - Reject All Selected

### Audit Logging
- **Status Changes**: Tracked with timestamps
- **Last Activity**: Updated on all supplier interactions
- **User Notifications**: Toast notifications for all approval actions

## Import Functionality

### Multi-Step Import Workflow

#### Step 1: File Upload
- **Supported Formats**: CSV (.csv), JSON (.json)
- **File Size Limit**: 10MB maximum
- **Validation**: Format validation on upload
- **User Guidance**: Tips and requirements display

#### Step 2: Field Mapping
- **Auto-Detection**: Intelligent mapping of common field names
- **Manual Override**: User can adjust field mappings
- **Required Fields**: Name and Email marked as mandatory
- **Optional Fields**: Contact person, phone, type, address, tax number
- **Preview**: Shows detected columns and mapping options

#### Step 3: Data Preview
- **Table Display**: Shows first 10 rows of import data
- **Field Validation**: Highlights data quality issues
- **Email Validation**: Checks email format compliance
- **Final Review**: Confirmation before import execution

#### Step 4: Import Processing
- **Progress Bar**: Visual progress indicator
- **Batch Processing**: Handles large datasets efficiently
- **Error Handling**: Comprehensive error reporting
- **Success Feedback**: Toast notification with import summary

## Export Functionality

### Export Options
- **CSV Export**: Comma-separated values for spreadsheet applications
- **JSON Export**: Structured data export for system integration
- **PDF Export**: Printable reports with formatted data
- **Excel Export**: Microsoft Excel compatible format

### Export Customization
- **Column Selection**: Choose which fields to include in export
- **Filter Application**: Export only currently filtered results
- **Data Formatting**: Consistent formatting across all export formats
- **File Naming**: Automatic timestamp-based file naming

## Interactive Table Features

### Column Management
- **Column Visibility**: Toggle individual column display
- **Column Reordering**: Drag-and-drop column arrangement
- **Column Resizing**: Adjustable column widths
- **Persistent Settings**: User preferences saved locally

### Sorting and Pagination
- **Multi-column Sorting**: Sort by multiple criteria
- **Custom Sorting**: Type-specific sorting (numeric, date, text)
- **Pagination Controls**: Page navigation with size selection
- **Jump to Page**: Direct page number input

### Row Actions
- **Inline Editing**: Direct editing of supplier information
- **Quick Actions**: One-click approval and status changes
- **Detailed View**: Modal-based detailed supplier information
- **Delete Protection**: Confirmation dialogs for destructive actions

## Modal Components

### Supplier Details Modal
- **Comprehensive View**: All supplier information in modal format
- **Edit Capabilities**: Inline editing of supplier details
- **Audit Trail**: Historical changes and status updates
- **Document Links**: Associated documents and files

### Bulk Actions Modal
- **Multi-select Operations**: Process multiple suppliers at once
- **Status Updates**: Bulk approval and rejection workflows
- **Project Assignment**: Assign suppliers to projects
- **Export Options**: Export selected suppliers

### Import Wizard Modal
- **Step-by-step Process**: Guided import workflow
- **File Validation**: Real-time file format checking
- **Mapping Interface**: Intuitive field mapping
- **Progress Tracking**: Visual import progress

### Voice Call Modal
- **Voice Call Integration**: Direct supplier calling functionality
- **Call Purpose Selection**: Choose reason for call (price negotiation, contract discussion, etc.)
- **Call Notes**: Document call content and outcomes
- **Document Context for Agents**:
  - **File Upload**: Upload local documents (PDF, DOC, DOCX, TXT, JPG, PNG) for agent reference during calls
  - **URL References**: Add external URLs (sharepoint, portals, cloud documents) for agent access
  - **Upload Progress**: Real-time progress tracking with status indicators (pending, uploading, completed, failed)
  - **File Validation**: 10MB size limit and format validation for uploads
  - **Multiple URL Inputs**: Dynamic URL fields with validation
  - **Document Selection**: Choose from both uploaded files and previously existing documents
- **Database Storage**: All uploaded documents and URLs stored in `a_00900_doccontrol_documents` table
- **Call Recording**: Twilio integration for call recording
- **Call Record Integration**: Documents included in procurement_voice_calls record
- **Status Tracking**: Monitor call progress and completion

## Statistics Dashboard

### Key Metrics Display
- **Total Suppliers**: Overall supplier count with trend indicators
- **Approval Distribution**: Pie chart of approval status breakdown
- **Rating Distribution**: Histogram of supplier ratings
- **Average Rating**: Calculated across all rated suppliers
- **Active Projects**: Unique project count with supplier associations

## Technical Implementation

### React Architecture
- **Functional Components**: Modern React with hooks
- **State Management**: Complex state with useState and useEffect
- **Performance**: Optimized rendering with useCallback
- **Error Boundaries**: Comprehensive error handling

### Dependencies
- **Bootstrap React**: UI components and styling
- **Supabase Integration**: Database connectivity ready
- **File Handling**: FileReader API for import functionality
- **Icons**: Bootstrap Icons for consistent iconography

### State Management
```javascript
// Core state variables
const [suppliers, setSuppliers] = useState([]);
const [searchTerm, setSearchTerm] = useState("");
const [sortField, setSortField] = useState("name");
const [selectedSuppliers, setSelectedSuppliers] = useState(new Set());
const [importData, setImportData] = useState([]);
```

### Data Processing
- **Client-Side Filtering**: Fast, responsive filtering
- **Sorting Algorithms**: Multi-type sorting (string, numeric, date)
- **Search Implementation**: Multi-field text search
- **CSV Parsing**: Custom CSV parser for import functionality
- **Data Validation**: Comprehensive validation rules

## File Structure

### Core Files
```
client/src/pages/01900-procurement/components/
├── 01900-supplier-directory.js          # Main component
├── 01900-supplier-directory-page.js     # Page wrapper
└── css/
    └── 01900-supplier-directory.css     # Styling (NO background images)
```

### Integration Files
```
client/src/App.js                        # Route configuration
server/src/routes/accordion-sections-routes.js  # Navigation integration
```

### Dependencies
```
@modules/accordion/                       # Accordion integration
@components/modal/context/               # Modal system
@common/js/auth/                        # Supabase integration
@common/js/services/voiceCallService.js  # Voice call integration
```

## Styling & Theming

### CRITICAL: Background Styling Rules

#### ✅ APPROVED CSS Patterns
```css
/* CSS Custom Properties - APPROVED */
.supplier-directory-container {
  --primary-color: #FFA500;
  --secondary-color: #FF8C00;
  --text-color: #000000;
  --bg-color: #f8f9fa;
  --card-bg: #ffffff;
  --border-color: #e9ecef;
  --orange-border: #FFA500;
}

/* Card-based backgrounds - APPROVED */
.settings-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-left: 4px solid var(--orange-border);
}

/* Semi-transparent containers - APPROVED */
.supplier-directory-header {
  background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
  color: #ffffff;
}
```

#### ❌ PROHIBITED CSS Patterns
```css
/* NEVER include these patterns */
.page-background {
  backgroundImage: 'url("...")';  /* ❌ PROHIBITED */
  position: "fixed";              /* ❌ PROHIBITED for backgrounds */
}

/* NEVER use asset-based backgrounds */
background: url("/assets/...");   /* ❌ PROHIBITED */
background-image: url("...");     /* ❌ PROHIBITED */
```

### Component Styling Standards
- **Settings Cards**: Consistent card styling with hover effects
- **Button Variants**: Primary, success, danger, info variants
- **Table Styling**: Hover effects and status-based row coloring
- **Modal Styling**: Consistent modal theming
- **Form Elements**: Styled form controls and validation states

### Responsive Design
- **Mobile Optimization**: Responsive breakpoints
- **Table Responsiveness**: Horizontal scrolling on mobile
- **Modal Adaptation**: Mobile-friendly modal sizing
- **Touch Interactions**: Touch-optimized button sizing

## Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical tab progression through interface
- **Enter Key**: Activates buttons and actions
- **Escape Key**: Closes modals and cancels operations
- **Arrow Keys**: Table navigation support

### Screen Reader Support
- **ARIA Labels**: Comprehensive labeling for all interactive elements
- **Role Attributes**: Proper semantic roles
- **Form Labels**: Associated labels for all form elements
- **Status Announcements**: Dynamic content changes announced

### Visual Accessibility
- **Color Contrast**: High contrast ratios for text
- **Focus Indicators**: Clear focus styling
- **Icon Labels**: Text alternatives for icon-only buttons
- **Error States**: Clear error messaging and validation

### Internationalization Ready
- **Text Externalization**: Preparation for multi-language support
- **Date Formatting**: Locale-aware date display
- **Number Formatting**: Consistent numeric formatting

## Implementation Checklist

### Pre-Development Verification
- [ ] Confirm 00200 all documents page as ONLY visual reference
- [ ] Verify NO background image requirements
- [ ] Review prohibited styling patterns
- [ ] Confirm card-based layout approach

### During Development
- [ ] Implement CSS variables for theming
- [ ] Create card-based layout structure
- [ ] Avoid any background image implementations
- [ ] Test visual consistency with 00200 page
- [ ] Verify responsive behavior

### Post-Development Validation
- [ ] Confirm no background images in final implementation
- [ ] Verify visual consistency with reference page
- [ ] Test all responsive breakpoints
- [ ] Validate accessibility compliance

## Usage Scenarios

### Daily Operations
1. **Supplier Search**: Quick lookup of existing suppliers
2. **Status Checks**: Review pending approvals
3. **Contact Information**: Access supplier contact details
4. **Project Associations**: View suppliers per project

### Approval Workflows
1. **Individual Review**: Detailed supplier evaluation
2. **Bulk Processing**: Efficient batch approvals
3. **Status Updates**: Track approval progress
4. **Audit Trail**: Historical approval records

### Data Management
1. **Import Operations**: Bulk supplier data import
2. **Export Reports**: Generate supplier reports
3. **Data Validation**: Ensure data quality
4. **System Integration**: Sync with external systems

### Administrative Tasks
1. **Directory Maintenance**: Keep supplier information current
2. **Compliance Tracking**: Monitor supplier compliance status
3. **Performance Monitoring**: Track supplier ratings and metrics
4. **Project Management**: Associate suppliers with projects

## Performance Considerations

### Optimization Features
- **Client-Side Processing**: Fast filtering and sorting
- **Virtual Scrolling Ready**: Prepared for large datasets
- **Lazy Loading**: Component-level lazy loading
- **Memoization**: Performance optimization with React.memo

### Scalability
- **Pagination Ready**: Infrastructure for large supplier lists
- **Search Indexing**: Prepared for database search optimization
- **Caching Strategy**: Frontend caching implementation
- **API Integration**: Ready for backend data services

## Future Enhancements

### Planned Features
- **Advanced Analytics**: Supplier performance dashboards
- **Integration APIs**: External system connectivity
- **Document Management**: Supplier document storage
- **Communication Tools**: Direct supplier messaging

### Technical Improvements
- **Real-time Updates**: WebSocket integration
- **Advanced Search**: Full-text search capabilities
- **Mobile App**: Native mobile application
- **AI Features**: Intelligent supplier recommendations

## Support & Maintenance

### Development Notes
- **Code Documentation**: Comprehensive inline comments
- **Error Handling**: Robust error management
- **Logging**: Comprehensive logging for debugging
- **Testing Ready**: Infrastructure for unit and integration tests

### Deployment Considerations
- **Environment Configuration**: Development and production settings
- **Database Schema**: Supplier table requirements
- **Security**: Data protection and access control
- **Monitoring**: Performance and error monitoring

## Testing and Verification

The implementation includes:
- Comprehensive error handling for database operations
- Input validation for all critical fields
- Duplicate detection with multiple matching strategies
- Detailed logging for troubleshooting
- Metadata tracking for traceability

## Usage Instructions

1. Run the SQL migration to enhance the suppliers table
2. The enhanced scraper will automatically:
   - Validate and format website URLs
   - Check for duplicates before insertion
   - Set approval status to 'pending' automatically
   - Track metadata for traceability
   - Provide detailed feedback in the chat interface

## Compliance with Requirements

✅ **Extract supplier names and website URLs**: Enhanced extraction with validation
✅ **Validate and format URLs consistently**: Automatic https:// prefix and validation
✅ **Insert data with status auto-set to Pending**: Implemented with default values
✅ **Duplicate-checking mechanism**: Intelligent matching with visual indicators
✅ **Prioritize accuracy in website extraction**: Robust validation and error handling
✅ **Include metadata for traceability**: Source URL, method, and timestamp tracking
✅ **Validate data integrity**: Mandatory field validation and comprehensive error handling

## Links

- **API Server**: http://localhost:3060
- **Client Server**: http://localhost:3001
- **Supplier Directory**: http://localhost:3060/supplier-directory
- **Procurement Section**: http://localhost:3060/procurement

This comprehensive supplier directory provides a complete solution for supplier lifecycle management within the procurement system, offering both powerful functionality and intuitive user experience while maintaining consistency with existing application patterns and **explicitly avoiding background image implementations**.
