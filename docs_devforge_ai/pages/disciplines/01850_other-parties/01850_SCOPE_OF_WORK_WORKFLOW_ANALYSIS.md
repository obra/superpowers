# Scope of Work Page Workflow Analysis

## Overview
This document analyzes the workflow sequence and UI data display for the Scope of Work Management page (`01900-scope-of-work-page.js`). The workflow follows a typical CRUD (Create, Read, Update, Delete) pattern with additional features for document transfer and chatbot integration.

## Sequence of Events

### 1. Component Initialization
**Trigger:** Component mounts
**Actions Performed:**
- Sets document title to "Scope of Work Management - Procurement"
- Initializes data loading for scopes, projects, and users
- Sets up initial state variables
- Logs component mounting

**Data Loading Process:**
- `fetchScopes()`: Retrieves all scope of work records from `scope_of_work` table
- `fetchProjects()`: Gets project names/IDs from `projects` table
- `fetchUsers()`: Attempts to load users from `personnel_records`, falls back to `user_management`

### 2. Data Loading Phase
**Screen State:** Shows loading spinner with "Loading Scope of Work Management..." message
**Display Elements:**
```
Loading State:
- Orange spinner animation
- Loading text
- Full-page loading overlay
```

**Database Queries Executed:**
```sql
-- Scopes table query
SELECT * FROM scope_of_work ORDER BY created_at DESC;

-- Projects table query
SELECT id, name FROM projects ORDER BY name;

-- Users (Primary)
SELECT user_id, full_name, email FROM personnel_records ORDER BY full_name;
-- Users (Fallback)
SELECT user_id, email FROM user_management ORDER BY email;
```

### 3. Main Dashboard Display
**Trigger:** Data loading completes successfully
**Screen Elements Displayed:**

#### Header Section
```
Page Title: "Scope of Work Management"
Subtitle: "Manage project scopes, assignments, and deliverables"
```

#### Dashboard Statistics Cards
```
Card 1: Total Scopes
- Value: {total scopes count}
- Trend: "Active projects"
- CSS Background: Default

Card 2: Draft Scopes
- Value: {draft scopes count}
- Trend: "In preparation"
- CSS Background: Positive/green

Card 3: In Progress
- Value: {in_progress scopes count}
- Trend: "Active work"
- CSS Background: Positive/green

Card 4: Completed
- Value: {completed scopes count}
- Trend: "Delivered"
- CSS Background: Positive/green
```

#### Navigation Tabs
```
Active Tab: "All Scopes"
Available Tabs: [All Scopes] (single tab currently)
```

### 4. Search and Filter Section
**Location:** Below tabs, above table
**Filter Controls:**
```
Search Input Field:
- Placeholder: "Search by title or description..."
- Icon: Search icon (bi-search)
- Controls: Filtered scopes based on title/description

Type Filter Dropdown:
- Options: ["All Types", "Purchase Order", "Work Order", "Service Order"]
- Default: "all"
- Property filtered: scope.scope_type

Status Filter Dropdown:
- Options: ["All Statuses", "Draft", "Pending Approval", "Approved", "In Progress", "Completed", "Cancelled"]
- Default: "all"
- Property filtered: scope.status

Clear Filters Button:
- Style: Outline secondary
- Text: "Clear"
- Action: Resets all filters to default
```

### 5. Scopes Table Display
**Table Structure:**
```
Headers: [Title, Type, Project, Status, Priority, Actions]

Title Column:
- Main: {scope.title}
- Sub: {scope.created_at} formatted as date
- Layout: Title on top, date below in muted color

Type Column:
- Badge: {scope.scope_type}
- Style: Primary badge
- Labels: Display friendly names ("Purchase Order" instead of "purchase_order")

Project Column:
- Display: {project.name} where project.id = scope.project_id
- Fallback: "Unassigned" if no matching project

Status Column:
- Badge: {scope.status}
- Styles:
  - "approved": success/green
  - "pending_approval": warning/yellow
  - "completed": primary/blue
  - "cancelled": danger/red
  - default: secondary
- Text formatting: Converts "_" to spaces

Priority Column:
- Badge: {scope.priority}
- Styles:
  - "critical": danger/red
  - "high": warning/yellow
  - "medium": info/blue
  - default: secondary

Actions Column:
- Button Group with 4 buttons:
  1. View (eye icon) - Shows basic scope details in alert
  2. Edit (pencil icon) - Opens edit modal
  3. Transfer (file icon) - Opens transfer modal
  4. Delete (trash icon) - Confirmed delete action
```

### 6. User Interactions

#### View Scope Details
**Trigger:** Click View button
**Action:** Displays alert with basic information
```
Alert Shows:
- Title
- Status
- Scope Type
- Associated Project Name
```

#### Edit Scope
**Trigger:** Click Edit button
**Action:** Opens ScopeOfWorkModal
```
Modal State:
- showModal: true
- editingId: {scope.id}
- initialData: Full scope object
- projects: Available projects array
- users: Available users array
```

#### Transfer to Document
**Trigger:** Click Transfer button
**Action:** Opens SowTransferModal
```
Modal State:
- showTransferModal: true
- transferringScope: {full scope object}
```

#### Delete Scope
**Trigger:** Click Delete button
**Sequence:**
1. Confirm dialog: "Are you sure you want to delete this scope of work?"
2. API call: DELETE from scope_of_work WHERE id = {id}
3. Success handling: Show success message, refresh scopes
4. Error handling: Show error message

#### Create New Scope

##### **Current Workflow** (As Implemented)
**Trigger:** Click "New Scope" button
**Action:** Opens ScopeOfWorkModal with 5-step wizard process
```
Modal State:
- showModal: true
- editingId: null
- initialData: null
- projects: Available projects array
- users: Available users array
```

**Complete New SOW Workflow Process (Current Implementation):**

##### Step 1: Category Selection (Progress: 25%)
**Visual Elements:**
- Wizard header with progress bar
- Step navigation showing current step
- Category grid with hierarchical procurement categories
- Search functionality
- Back/forward navigation buttons

**User Actions:**
1. Browse hierarchical procurement categories (loaded from database)
2. Search categories by code/name
3. Select main category from Excel-imported hierarchy
4. Select sub-category for more specific templates
5. Auto-progress to next step when both selections made

**Data Sources:**
- Categories: `procurementCategoryService.loadCategories()`
- Display: Category cards with name, code, template count
- Search: Real-time filtering with database integration

##### Step 2: Template Selection (Progress: 40%)
**Prerequisites:** Category and sub-category must be selected
**Visual Elements:**
- Template cards showing name, description, usage statistics
- Last updated dates
- Auto-loaded templates based on selected category

**Available Templates:**
- Standard Purchase Order
- Equipment Procurement
- Service Agreement
- Construction Materials
- Templates display usage badges (High/Medium/Low)

**User Actions:**
- Review template descriptions and usage statistics
- Select appropriate template for scope type
- Auto-progress to draft creation step

##### Step 3: Draft Creation (Progress: 55%)
**Purpose:** Basic information collection before AI enhancement
**Required Fields:**
```
Title: Text input (required)
Description: Rich textarea (required) - provides context for AI
Scope Type: Dropdown (Purchase Order, Work Order, Service Order)
Target Completion Date: Date picker
Priority Level: Dropdown (Low, Medium, High, Urgent)
```

**Visual Elements:**
- Form validation with required field indicators
- Draft preview showing entered information
- Progress indicator showing current completion status
- Contextual help text

**Business Logic:**
- Form validation prevents progression without title/description
- Auto-progress disabled until required fields complete
- Draft can be saved at any point with "Save Draft" button

##### Step 4: AI Enhancement (Progress: 75%)
**Purpose:** Generate comprehensive content using AI
**Input Sections:**
```
Basic Details: Enhanced form fields
Requirements: Detailed requirements text
Line Items: Table data input (CSV, Excel, Markdown supported)
Context & References:
  - Reference URLs (one per line)
  - Document uploads (temporary disabled)
  - Project specifications
  - Compliance requirements
  - Additional context
Schedule & Timeline: Generated automatically
```

**AI Generation Process:**
```
1. Content Generation Trigger:
   - Click "Generate Content with Magic Wand" button
   - Shows: "**Generating content with AI...**"

2. AI Processing:
   - Calls: scopeOfWorkGenerationService.generateScopeOfWork()
   - Parameters: Title, description, category, template, line items, context
   - Generates structured sections with professional content

3. Content Output:
   - Markdown formatted sections
   - Includes equipment specs, safety protocols, compliance
   - Appends line items data to generated content

4. Post-Processing:
   - Real-time display of generated content
   - Copy to clipboard functionality
   - Download as .txt file option
   - Sections appended with line items if provided
```

**Visual Elements:**
- Tabbed interface for different input sections
- Generation progress spinner
- Success/error alerts with content preview
- Copy/download buttons for generated content
- Enhanced context summary showing all provided inputs

##### Step 5: Review & Save (Progress: 100%)
**Purpose:** Final review and database submission
**Visual Elements:**
```
Summary Cards: Category, Template, Status badges
Details Review: All entered information
Generated Content: Full preview of AI content
Validation Checks: Complete workflow confirmation
```

**Database Submission Process:**
```
1. Validation: Required fields check (title, description)
2. Data Preparation:
   - Separate database fields from AI context fields
   - Format content with line items if present
   - Set default status: "pending_approval"

3. Database Insertion:
   - Table: scope_of_work
   - Fields: title, description, content, scope_type, category, etc.
   - Success: Status becomes "pending_approval"

4. Post-Submission Actions:
   - Create project templates if project_id exists
   - Refresh parent page scopes list
   - Show success message
   - Auto-close modal (1.5 second delay)
   - Redirect to updated scopes list
```

**Error Handling:**
- Validation errors prevent submission
- Database errors show specific messages
- AI generation failures with fallback options
- Network timeout handling
- Automatic cleanup on failure

---

##### **New Workflow** (Proposed Changes)
**Status:** Planning Phase - Document changes needed here as workflow redesign progresses

**Planned Improvements:**

**🎯 Target Changes:**
- [ ] List specific workflow changes needed
- [ ] Define new user experience requirements
- [ ] Specify technical enhancements
- [ ] Outline UI/UX improvements

**💡 Change Rationale:**
- Document the reasoning for each proposed change
- Include user feedback and business requirements
- Reference performance or usability issues

**🚀 Implementation Approach:**
- Define technical approach for each change
- Consider backward compatibility requirements
- Plan for user migration/transition

**📋 Change Tracking:**
- [ ] Step-by-step changes required
- [ ] Timeline and milestones
- [ ] Dependencies and prerequisites
- [ ] Testing and validation steps

**Note:** This section will be populated as the workflow redesign process advances.

### 7. Modal Operations

#### ScopeOfWorkModal
**Purpose:** Create/Edit scope of work records
**Triggers:**
- New Scope: editingId = null, initialData = null
- Edit Scope: editingId = scope.id, initialData = scope object

**Data Passed:**
- projects: Array of {id, name}
- users: Array of user objects
- show: Boolean modal state
- onHide: Callback to close modal and refresh data

#### SowTransferModal
**Purpose:** Transfer scope of work to HTML document
**Trigger:** Transfer button clicked
**Data Passed:**
- sowData: Complete scope object
- show: Boolean modal state
- onHide: Callback to close modal

### 8. Chatbot Integration
**Component:** Document Chatbot
**Configuration:**
```
pageId: "01900-scope-of-work"
disciplineCode: "01900"
userId: "user123" // Currently hardcoded, should be dynamic
```

### 9. Success/Error Handling
**Success Messages:** Green alert displayed at top of content area
**Error Messages:** Red alert displayed at top of content area

**Message Examples:**
- Success: "Scope of work deleted successfully"
- Error: Failed formatting includes operation + error message

### 10. Logout Button
**Location:** Fixed position (bottom-right corner)
**Styling:** Round orange gradient button with logout icon
**Functionality:** Calls global window.handleLogout()

## Data Flow Architecture

### State Management
```
Core State Variables:
- scopes[]: Array of scope objects from database
- projects[]: Project lookup data
- users[]: User lookup data
- loading: Loading states
- error/success: Status messages
- showModal/showTransferModal: Modal visibility
- searchTerm: Search input value
- statusFilter/typeFilter: Filter selections
- activeTab: Current tab selection
```

### API Interactions
```
Read Operations:
- fetchScopes: GET /scope_of_work
- fetchProjects: GET /projects
- fetchUsers: GET /personnel_records (fallback user_management)

Write Operations:
- deleteScope: DELETE /scope_of_work (via handleDelete)
- createScope: Handled in ScopeOfWorkModal (not shown in this file)
- updateScope: Handled in ScopeOfWorkModal (not shown in this file)
```

### Filtering Logic
```javascript
filteredScopes = scopes.filter(scope => {
  matchesSearch: scope.title/description includes searchTerm (case-insensitive)
  matchesType: scope.scope_type equals typeFilter OR typeFilter === "all"
  matchesStatus: scope.status equals statusFilter OR statusFilter === "all"
});
```

## Navigation and URL Structure
- **Page URL:** /01900-procurement (implied)
- **Modal URLs:** None (modals are overlay components)
- **Breadcrumbs:** None shown in component

## Browser History Integration
- **Browser Title:** "Scope of Work Management - Procurement"
- **Back Button Support:** Standard browser behavior

## Performance Considerations
- **Loading State:** Shows spinner only when no data exists
- **Data Refresh:** fetchScopes called after delete operations
- **Table Rendering:** Uses mapped arrays for dynamic rows
- **Search/Filtering:** Client-side implementation

## Areas for Improvement (Based on Analysis)
1. **User Context:** userId is hardcoded ("user123")
2. **Error Boundaries:** No specific error boundaries implemented
3. **Loading States:** Could differentiate between initial load and re-fetch loading
4. **Pagination:** No pagination for large datasets
5. **Sorting:** Table only sorted by created_at (descending)
6. **Notification System:** Basic alert system, could be more sophisticated
7. **Modal Management:** Modal state could be more cohesive
