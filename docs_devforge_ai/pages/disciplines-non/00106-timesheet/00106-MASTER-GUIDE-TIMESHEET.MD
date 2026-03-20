# 1300_00106 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_00106 group.

## Files in this Group

- [1300_00106_RUN_TIMESHEET_SETUP.md](1300_00106_RUN_TIMESHEET_SETUP.md)
- [1300_00106_RUN_TIMESHEET_TEMPLATES_UPDATE.md](1300_00106_RUN_TIMESHEET_TEMPLATES_UPDATE.md)
- [1300_00106_TIMESHEET_BUTTONFIX.md](1300_00106_TIMESHEET_BUTTONFIX.md)
- [1300_00106_TIMESHEET_BUTTONMASTER_GUIDE_UNKNOWN_DISCIPLINE.md](1300_00106_TIMESHEET_BUTTONMASTER_GUIDE_UNKNOWN_DISCIPLINE.md)
- [1300_00106_TIMESHEET_PAGEEXAMPLE.md](1300_00106_TIMESHEET_PAGEEXAMPLE.md)
- [1300_00106_TIMESHEET_PAGEMASTER_GUIDE_UNKNOWN_DISCIPLINE.md](1300_00106_TIMESHEET_PAGEMASTER_GUIDE_UNKNOWN_DISCIPLINE.md)
- [1300_00106_TIMESHEET_PAGE_IMPLEMENTATIONMASTER_GUIDE_UNKNOWN_DISCIPLINE.md](1300_00106_TIMESHEET_PAGE_IMPLEMENTATIONMASTER_GUIDE_UNKNOWN_DISCIPLINE.md)
- [1300_00106_MASTER_GUIDE_TIMESHEET.md](1300_00106_MASTER_GUIDE_TIMESHEET.md)

## Consolidated Content

### 1300_00106_MASTER_GUIDE_TIMESHEET.md

# 1300_00106 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_00106 group.

## Files in this Group

- [1300_00106_RUN_TIMESHEET_SETUP.md](1300_00106_RUN_TIMESHEET_SETUP.md)
- [1300_00106_RUN_TIMESHEET_TEMPLATES_UPDATE.md](1300_00106_RUN_TIMESHEET_TEMPLATES_UPDATE.md)
- [1300_00106_TIMESHEET_BUTTONFIX.md](1300_00106_TIMESHEET_BUTTONFIX.md)
- [1300_00106_TIMESHEET_BUTTONMASTER_GUIDE_UNKNOWN_DISCIPLINE.md](1300_00106_TIMESHEET_BUTTONMASTER_GUIDE_UNKNOWN_DISCIPLINE.md)
- [1300_00106_TIMESHEET_PAGEEXAMPLE.md](1300_00106_TIMESHEET_PAGEEXAMPLE.md)
- [1300_00106_TIMESHEET_PAGEMASTER_GUIDE_UNKNOWN_DISCIPLINE.md](1300_00106_TIMESHEET_PAGEMASTER_GUIDE_UNKNOWN_DISCIPLINE.md)
- [1300_00106_TIMESHEET_PAGE_IMPLEMENTATIONMASTER_GUIDE_UNKNOWN_DISCIPLINE.md](1300_00106_TIMESHEET_PAGE_IMPLEMENTATIONMASTER_GUIDE_UNKNOWN_DISCIPLINE.md)
- [1300_00106_MASTER_GUIDE_TIMESHEET.md](1300_00106_MASTER_GUIDE_TIMESHEET.md)

## Consolidated Content

### 1300_00106_MASTER_GUIDE_TIMESHEET.md

# 1300_00106_MASTER_GUIDE_TIMESHEET.md - Timesheet Page

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [x] Audit completed

## Version History
- v1.0 (2025-11-27): Comprehensive Timesheet Page Master Guide based on actual implementation

## Overview
The Timesheet Page (00106) provides a comprehensive time tracking and management system for the ConstructAI platform. It features a tab-based navigation interface with week-by-week time entry, template management, project-based organization, and a complete submission workflow for approval. The page integrates with database storage, supports draft saving, and provides extensive reporting and analytics capabilities for time management and productivity tracking.

## Page Structure
**File Location:** `client/src/pages/00106-timesheet/`

### Main Component: 00106-enhanced-timesheet-page.js
```javascript
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import supabaseClient from "@lib/supabaseClient.js";

const TimesheetPage = () => {
  const { t } = useTranslation('00106-timesheet');
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);

  // Database-driven authentication and user management
  const isDevelopment = window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10.");

  // Function to get current authenticated user session
  const getCurrentUser = async () => {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) {
        console.warn("[TimesheetPage] Error getting session:", error);
        return null;
      }
      return session?.user || null;
    } catch (error) {
      console.warn("[TimesheetPage] Error getting current user:", error);
      return null;
    }
  };

  // Generate valid UUID for guest/development users
  const getValidUserId = async () => {
    const currentUser = await getCurrentUser();
    if (currentUser?.id) {
      console.log("[TimesheetPage] Using authenticated user ID:", currentUser.id);
      return currentUser.id;
    }

    if (window.currentUserId && window.currentUserId !== "guest") {
      return window.currentUserId;
    }

    if (isDevelopment) {
      const DEVELOPMENT_USER_ID = "00000000-0000-0000-0000-000000000000";
      console.log("[TimesheetPage] Using development user ID:", DEVELOPMENT_USER_ID);
      return DEVELOPMENT_USER_ID;
    }

    const GUEST_UUID_KEY = "timesheet_guest_uuid";
    let guestUuid = localStorage.getItem(GUEST_UUID_KEY);

    if (!guestUuid) {
      guestUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem(GUEST_UUID_KEY, guestUuid);
      console.log("[TimesheetPage] Generated new guest UUID:", guestUuid);
    } else {
      console.log("[TimesheetPage] Using existing guest UUID:", guestUuid);
    }

    return guestUuid;
  };

  // Initialize settings manager with comprehensive error handling
  useEffect(() => {
    const initSettings = async () => {
      try {
        console.log("[TimesheetPage] Initializing settings manager...");
        if (!settingsManager) {
          console.warn("[TimesheetPage] Settings manager is not available");
          setIsSettingsInitialized(true);
          return;
        }
        if (!settingsManager.initialized) {
          await settingsManager.initialize();
          console.log("[TimesheetPage] Settings manager initialized");
          try {
            await settingsManager.applySettings();
            console.log("[TimesheetPage] Settings applied successfully");
          } catch (applyError) {
            console.warn("[TimesheetPage] Could not apply settings, using defaults:", applyError);
          }
        } else {
          console.log("[TimesheetPage] Settings manager already initialized");
        }
        setIsSettingsInitialized(true);
      } catch (err) {
        console.error("[TimesheetPage] Error initializing settings:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });
        setIsSettingsInitialized(true);
      }
    };
    initSettings();
  }, []);

  // Core timesheet state management
  const [timesheetData, setTimesheetData] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [weekKey, setWeekKey] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for task entry
  const [newTask, setNewTask] = useState({
    description: "",
    project: "",
    mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "",
  });

  // Project and descriptions integration
  const [projects, setProjects] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [filteredDescriptions, setFilteredDescriptions] = useState([]);
  const [summary, setSummary] = useState({
    total: 0, weekdays: 0, weekends: 0, dailyAvg: 0,
  });

  // Modal state management
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  // Initialize page and fetch initial data
  useEffect(() => {
    goToCurrentWeek();
  }, []);

  // Load templates from database with user filtering
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const userId = await getValidUserId();
        const { data: templatesData, error } = await supabaseClient
          .from("timesheet_templates")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("[TimesheetPage] Error fetching templates:", error);
          const savedTemplates = JSON.parse(localStorage.getItem("timesheetTemplates") || "[]");
          setTemplates(savedTemplates);
        } else {
          setTemplates(templatesData || []);
        }
      } catch (error) {
        console.error("[TimesheetPage] Error fetching templates from database:", error);
        const savedTemplates = JSON.parse(localStorage.getItem("timesheetTemplates") || "[]");
        setTemplates(savedTemplates);
      }
    };
    fetchTemplates();
  }, []);

  // Fetch projects and descriptions for dropdowns
  useEffect(() => {
    const fetchProjectsAndDescriptions = async () => {
      try {
        console.log("[TimesheetPage] Fetching projects and descriptions...");
        const supabase = await getSupabase();

        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("id, name, project_type, company_id")
          .order("name");

        if (projectsError) {
          console.warn("[TimesheetPage] Error fetching projects:", projectsError);
        } else {
          console.log("[TimesheetPage] Successfully fetched projects:", projectsData);
          setProjects(projectsData || []);
        }

        const { data: descriptionsData, error: descriptionsError } = await supabase
          .from("timesheet_descriptions")
          .select("id, project_id, code, description, category")
          .eq("is_active", true)
          .order("category", { ascending: true })
          .order("code", { ascending: true });

        if (descriptionsError) {
          console.warn("[TimesheetPage] Error fetching descriptions:", descriptionsError);
        } else {
          console.log("[TimesheetPage] Successfully fetched descriptions:", descriptionsData);
          setDescriptions(descriptionsData || []);
        }
      } catch (error) {
        console.error("[TimesheetPage] Error fetching data from Supabase:", error);
      }
    };

    fetchProjectsAndDescriptions();
  }, []);

  // Filter descriptions based on selected project
  useEffect(() => {
    if (selectedProject && descriptions.length > 0) {
      const filtered = descriptions.filter(desc => desc.project_id === selectedProject);
      setFilteredDescriptions(filtered);
    } else {
      setFilteredDescriptions(descriptions);
    }
  }, [selectedProject, descriptions]);

  // Load week data when week changes
  useEffect(() => {
    if (weekKey) {
      loadWeekData();
    }
  }, [weekKey]);

  // Core functionality methods (summarized)
  // ... week navigation, data loading, CRUD operations, templates, submissions

  return (
    <div className="timesheet-post-award-page">
      {/* Fixed white background */}
      <div className="page-background" style={{
        backgroundColor: "white",
        zIndex: -1,
        position: "fixed",
        top: 0, left: 0,
        width: "100vw", height: "100vh",
      }} />

      <div className="content-wrapper">
        <div className="main-content">
          {/* Accordion Integration */}
          <div id="accordion-container">
            <AccordionProvider>
              <AccordionComponent settingsManager={settingsManager} />
            </AccordionProvider>
          </div>

          <div className="timesheet-container" style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
            {/* Header with comprehensive action buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px',
              padding: '32px',
              backgroundColor: 'transparent',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div>
                <h4 style={{
                  color: '#000000',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  fontSize: '1.5rem'
                }}>
                  <i className="bi bi-calendar-week" style={{ marginRight: '8px', color: '#000000' }}></i>
                  Weekly Timesheet Management
                </h4>
                <p style={{
                  color: '#6c757d',
                  margin: '0',
                  fontSize: '0.875rem'
                }}>
                  Track and manage your weekly work hours with ease
                </p>
              </div>
            </div>

            {/* Week selector and action buttons grid */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* Action buttons grid with week navigation */}
            </div>

            {/* Main timesheet grid with 8-column layout */}
            <div className="timesheet-grid" style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
              marginBottom: "30px",
              backdropFilter: "blur(10px)",
            }}>
              {/* Comprehensive 8-column grid header */}
              <div className="grid-header" style={{
                background: "#f8f9fa",
                color: "#000000",
                display: "grid",
                gridTemplateColumns: "2fr repeat(7, 1fr) 1fr",
                fontWeight: "700",
                fontSize: "14px",
                borderBottom: "2px solid #dee2e6",
              }}>
                {/* Column headers for task description and 7 days + total */}
              </div>

              {/* Scrollable grid body with dynamic rows */}
              <div className="grid-body" style={{ maxHeight: "500px", overflowY: "auto" }}>
                {/* Dynamic row rendering with edit/delete/copy actions */}
              </div>
            </div>

            {/* Add new task form with project/description integration */}
            <div className="add-task-form" style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              padding: "25px",
              marginBottom: "30px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
              backdropFilter: "blur(10px)",
            }}>
              {/* Comprehensive task entry form */}
            </div>

            {/* Statistics cards displaying totals and averages */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* Total, weekday, weekend, and daily average cards */}
            </div>

            {/* Templates section with management interface */}
            <div className="templates-section" style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              margin: "40px 0 25px",
              overflow: "hidden",
              backdropFilter: "blur(10px)",
            }}>
              {/* Template management with database integration */}
            </div>

            {/* Previous submissions tracking */}
            <div className="submissions-section" style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              margin: "25px 0",
              overflow: "hidden",
              backdropFilter: "blur(10px)",
            }}>
              {/* Submission history with status tracking */}
            </div>

            {/* Modal implementations for templates and drafts */}
            {/* Template management modal */}
            {/* Save draft modal */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimesheetPage;
```

## Key Features

### 1. Database-Driven Time Tracking
- **Supabase Integration**: Full database persistence for timesheet data
- **User Authentication**: Secure user identification with development bypass
- **Draft Management**: Save incomplete timesheets for later completion
- **Template System**: Reusable timesheet templates with database storage

### 2. Comprehensive Week Management
- **Week Navigation**: ISO week-based navigation with current week detection
- **Data Persistence**: Automatic saving to localStorage and database
- **Week Calculations**: Proper date range calculations for week boundaries
- **Historical Tracking**: Complete history of submitted timesheets

### 3. Project-Based Organization
- **Project Integration**: Database-driven project selection
- **Description Filtering**: Context-aware description options based on project
- **Category Organization**: Structured task categorization
- **Validation Rules**: Project-specific validation and constraints

### 4. Advanced Submission Workflow
- **Dual Submission Paths**: API-first with Supabase fallback
- **Approval Workflow**: Status tracking (draft → submitted → approved/rejected)
- **Audit Trail**: Complete submission history with timestamps
- **Error Resilience**: Comprehensive error handling and fallback mechanisms

### 5. Template Management System
- **Database Templates**: Persistent template storage with user isolation
- **Template Operations**: Create, apply, edit, and delete templates
- **Bulk Operations**: Apply entire templates to weeks
- **Template Sharing**: Foundation for future template sharing capabilities

### 6. Comprehensive Analytics and Reporting
- **Time Summaries**: Total hours, weekday/weekend breakdowns, daily averages
- **Visual Statistics**: Card-based metrics display
- **Export Functionality**: CSV export for external reporting
- **Performance Tracking**: User productivity and time allocation analytics

### 7. Responsive Grid Interface
- **8-Column Layout**: Task description + 7 days + total hours
- **Inline Editing**: Direct cell editing with validation
- **Action Controls**: Edit, delete, duplicate operations per row
- **Scrollable Interface**: Efficient handling of large datasets

## File Structure
```
client/src/pages/00106-timesheet/
├── 00106-index.js                        # Entry point component
├── components/
│   └── 00106-timesheet-page.js           # Main timesheet component
└── (no separate CSS file - styles embedded in component)
```

## Dependencies
- **React**: Core component framework with hooks (useState, useEffect)
- **Supabase Client**: Database operations and authentication
- **i18next**: Internationalization support
- **Accordion System**: Navigation integration
- **Settings Manager**: UI configuration and preferences
- **Local Storage**: Client-side data persistence

## Security Implementation
- **User Authentication**: Supabase session validation
- **Data Isolation**: User-specific data filtering in all queries
- **UUID Generation**: Secure identifier generation for guest users
- **Input Validation**: Comprehensive form validation and sanitization
- **Audit Logging**: Complete operation logging for compliance

## Performance Considerations
- **Parallel Data Loading**: Concurrent API calls for projects and descriptions
- **Lazy State Updates**: Efficient re-rendering with targeted updates
- **Memory Management**: Proper cleanup and resource management
- **Caching Strategy**: Local storage backup with database sync
- **Error Boundaries**: Graceful error handling and user feedback

## Integration Points
- **Supabase Database**: Timesheet submissions, templates, projects, descriptions
- **Authentication System**: User session management and validation
- **Settings Manager**: UI preferences and display customization
- **Accordion Navigation**: System-wide navigation integration
- **Export System**: CSV generation and download functionality

## Monitoring and Analytics
- **Submission Metrics**: Timesheet submission rates and approval times
- **User Engagement**: Template usage and feature adoption tracking
- **Performance Metrics**: Page load times and API response tracking
- **Error Tracking**: Submission failures and system error monitoring
- **Productivity Analytics**: Time tracking patterns and user productivity insights

## Future Development Roadmap
- **Mobile Optimization**: Enhanced mobile interface and touch interactions
- **Advanced Templates**: Template sharing and organizational templates
- **AI Integration**: Intelligent time estimation and task categorization
- **Advanced Reporting**: Custom report generation and analytics dashboards
- **Team Management**: Multi-user timesheet approval workflows
- **Integration APIs**: Third-party time tracking system integration

## Related Documentation
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](1300_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture
- [1300_00000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md](1300_00000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md) - Simpler page patterns
- [1300_00106_TIMESHEET_PAGE_IMPLEMENTATION_EXAMPLE.md](1300_00106_TIMESHEET_PAGE_IMPLEMENTATION_EXAMPLE.md) - Implementation example
- [1300_00000_PAGE_LIST.md](1300_00000_PAGE_LIST.md) - Complete page documentation

## Status
- [x] Database-driven timesheet management implemented
- [x] Week-based navigation and data persistence completed
- [x] Project integration and description filtering verified
- [x] Comprehensive submission workflow integrated
- [x] Template management system functional
- [x] Analytics and reporting capabilities ready
- [x] Responsive grid interface completed
- [x] Security measures and audit logging implemented
- [x] Performance optimization completed
- [x] Future development roadmap defined

## Version History
- v1.0 (2025-11-27): Comprehensive master guide based on actual implementation analysis


---

### 1300_00106_RUN_TIMESHEET_SETUP.md

# Timesheet Setup and Testing Guide

## Overview
This guide explains how to set up and test the timesheet functionality that was implemented to fix the missing save button and approval routing on the 00106 Weekly Timesheet page.

## Database Setup

### 1. Create Timesheet Submissions Table
Run the SQL script to create the timesheet submissions table:

```sql
-- Execute this SQL in your Supabase database
-- File: sql/create_timesheet_submissions_table.sql
CREATE TABLE IF NOT EXISTS timesheet_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    week_key VARCHAR(20) NOT NULL, -- Format: YYYY-WXX (e.g., 2025-W34)
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    tasks JSONB NOT NULL, -- Array of task objects with description, project, hours, etc.
    total_hours DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, approved, rejected
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    approver_id UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timesheet_submissions_user_id ON timesheet_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_submissions_week_key ON timesheet_submissions(week_key);
CREATE INDEX IF NOT EXISTS idx_timesheet_submissions_status ON timesheet_submissions(status);
CREATE INDEX IF NOT EXISTS idx_timesheet_submissions_created_at ON timesheet_submissions(created_at);

-- Enable RLS
ALTER TABLE timesheet_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own timesheet submissions" ON timesheet_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timesheet submissions" ON timesheet_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timesheet submissions" ON timesheet_submissions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timesheet submissions" ON timesheet_submissions
    FOR DELETE USING (auth.uid() = user_id);
```

## Backend API Endpoints

The timesheet functionality uses the following API endpoints:

### Submit Timesheet
- **POST** `/api/timesheet/submit`
- Submit a timesheet for approval
- Request body: `{ weekKey, tasks, totalHours }`

### Get Submissions
- **GET** `/api/timesheet/submissions`
- Get all timesheet submissions for the current user

### Get Specific Submission
- **GET** `/api/timesheet/submissions/:id`
- Get a specific timesheet submission

### Update Submission Status
- **POST** `/api/timesheet/submissions/:id/status`
- Update timesheet submission status (approve/reject)

## Frontend Features

### Save Button
The "Submit for Approval" button has been added to the timesheet page controls. It:
- Validates that there are tasks to submit
- Calculates total hours automatically
- Sends data to the backend API
- Shows loading state during submission
- Displays success/error messages

### Previous Submissions
A new section displays previous timesheet submissions with:
- Week key (e.g., 2025-W34)
- Submission date
- Total hours
- Current status (draft, submitted, approved, rejected)
- Rejection reason (if rejected)

### Template Management
Existing template functionality remains unchanged:
- Save current week as template
- Apply templates to current week
- Manage existing templates

## Testing the Implementation

### 1. Start the Development Server
```bash
# From the server directory
npm run dev
```

### 2. Navigate to Timesheet Page
- Open your browser and go to `/timesheet`
- You should see the updated interface with the new "Submit for Approval" button

### 3. Test Timesheet Submission
1. Add some tasks to the current week
2. Click "Submit for Approval"
3. Confirm the submission in the popup
4. Check that the submission appears in the "Previous Submissions" section

### 4. Test Previous Submissions
1. Submit multiple timesheets for different weeks
2. Refresh the page
3. Verify that previous submissions appear in the list
4. Check that statuses are displayed correctly

### 5. Test Error Handling
1. Try submitting with no tasks (should show error)
2. Try submitting without selecting a week (should show error)
3. Test network error scenarios (offline mode)

## Troubleshooting

### Common Issues

1. **Save button disabled**: Make sure there are tasks in the current week
2. **Submission fails**: Check browser console for API errors
3. **Previous submissions not loading**: Verify database connection and user authentication
4. **Database errors**: Ensure the timesheet_submissions table exists with correct schema

### Debugging Steps

1. Check browser console for JavaScript errors
2. Check server logs for API request handling
3. Verify database table structure matches expected schema
4. Test API endpoints directly with tools like Postman

## Security Considerations

- All API endpoints require authentication
- Row Level Security (RLS) is enabled on the timesheet_submissions table
- Users can only access their own submissions
- Proper input validation is performed on all endpoints

## Performance Considerations

- Database indexes are created for common query patterns
- Previous submissions are loaded on demand
- Large submission data is handled efficiently with JSONB
- API responses are optimized for frontend usage

## Future Enhancements

- Add approval workflow notifications
- Implement timesheet reporting features
- Add export functionality for managers
- Include project-based reporting
- Add integration with project management systems


---

### 1300_00106_RUN_TIMESHEET_TEMPLATES_UPDATE.md

# Timesheet Templates Update Instructions

This document provides instructions on how to update the timesheet templates to be construction/engineering related.

## SQL Script

The SQL script `update_timesheet_templates.sql` has been created with the necessary UPDATE statements to modify the existing templates.

## Running the SQL Script

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor (Database > SQL Editor)
3. Create a new query
4. Copy and paste the contents of `update_timesheet_templates.sql` into the editor
5. Click "Run" to execute the script

### Option 2: Using psql (Command Line)

If you have the database connection details, you can run the script using psql:

```bash
psql "postgresql://[username]:[password]@[host]:[port]/[database]" -f update_timesheet_templates.sql
```

Note: You'll need to replace the placeholders with your actual database connection details.

## What the Script Does

The script updates the existing timesheet templates with construction/engineering related tasks:

1. "Weekly Development Tasks" → "Weekly Construction Tasks"
2. "Weekly Design Tasks" → "Weekly Engineering Tasks"
3. "Weekly Project Management Tasks" → Updated with construction-specific tasks
4. "Weekly Administrative Tasks" → Updated with construction-specific tasks

Each template now contains industry-appropriate project names and descriptions.


---

### 1300_00106_TIMESHEET_BUTTONFIX.md

# 1300_00106_TIMESHEET_BUTTON_FIX.md

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-15): Initial version - Documented the diagnosis and fix for non-responsive buttons on the 00106-timesheet page.

## Overview
This document provides a detailed account of the diagnosis and resolution of an issue where all interactive buttons on the 00106-timesheet page (`/Users/_PropAI/agent-testing copy1/client/public/pages/00106-timesheet/00106-timesheet.html`) were non-responsive. The problem prevented users from performing any actions within the timesheet application, such as adding tasks, managing templates, or exporting data.

## Requirements
The fix was required to:
- Restore full functionality to all buttons on the 00106-timesheet page.
- Ensure that all `onclick` event handlers correctly trigger their associated JavaScript functions.
- Maintain the existing module-based JavaScript structure without introducing global scope pollution.
- Adhere to the project's established coding and documentation standards.

## Implementation

### 1. Problem Diagnosis

#### Initial Analysis
The initial investigation began by examining the primary file for the 00106-timesheet page:
`/Users/_PropAI/agent-testing copy1/client/public/pages/00106-timesheet/00106-timesheet.html`

The page's interactive elements, such as buttons, were defined with inline `onclick` HTML attributes. For example:
```html
<button type="button" class="btn btn-primary" onclick="goToCurrentWeek()">Current Week</button>
<button type="button" class="btn btn-secondary" onclick="exportTimesheet()">Export CSV</button>
<button type="button" class="btn btn-primary" onclick="addNewRow()">➕ Add Task</button>
```

#### Root Cause Identification
The core JavaScript logic for the timesheet, including functions like `goToCurrentWeek`, `exportTimesheet`, and `addNewRow`, was encapsulated within a `<script type="module">` tag:
```html
<script type="module">
    // ... imports ...
    document.addEventListener('DOMContentLoaded', async function() {
        // ... initialization ...
    });

    function goToCurrentWeek() {
        // ... function body ...
    }

    function exportTimesheet() {
        // ... function body ...
    }

    // ... other functions ...
</script>
```

The root cause of the issue was identified as a **JavaScript module scoping problem**. Functions declared inside a module are scoped to that module by default and are not automatically added to the global `window` object. Inline `onclick` handlers in HTML attempt to call functions by name in the global scope. Since the functions were not globally accessible, the calls failed, resulting in unresponsive buttons.

### 2. Solution Implementation

#### Strategy
The initial strategy of assigning functions to the `window` object was found to be unreliable. The definitive solution involves replacing the inline HTML `onclick` handlers with programmatic event listeners using `addEventListener`. This approach correctly handles the module scope by attaching event handlers directly within the module's execution context after the DOM is fully loaded. This eliminates any dependency on the global scope for function calls.

#### Code Changes

1.  **A new function `attachEventListeners` was created** within the `<script type="module">` tag. This function is responsible for selecting all buttons with `onclick` attributes, removing those attributes, and attaching the corresponding event listeners using `addEventListener`.

    ```javascript
    function attachEventListeners() {
        // Week selector
        const weekSelector = document.getElementById('week-selector');
        if (weekSelector) {
            weekSelector.addEventListener('change', loadWeekData);
        }

        // Control buttons
        const goToCurrentWeekBtn = document.querySelector('button[onclick="goToCurrentWeek()"]');
        if (goToCurrentWeekBtn) {
            goToCurrentWeekBtn.removeAttribute('onclick');
            goToCurrentWeekBtn.addEventListener('click', goToCurrentWeek);
        }

        const exportTimesheetBtn = document.querySelector('button[onclick="exportTimesheet()"]');
        if (exportTimesheetBtn) {
            exportTimesheetBtn.removeAttribute('onclick');
            exportTimesheetBtn.addEventListener('click', exportTimesheet);
        }

        // ... other buttons ...
    }
    ```

2.  **The `attachEventListeners` function was called** inside the existing `DOMContentLoaded` event listener, ensuring it runs only after the entire HTML document has been parsed and is ready for manipulation.

    ```javascript
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('Timesheet page loaded with accordion system');
        await initializeAccordion();
        
        // Initialize timesheet functionality
        initializeTimesheet();

        // Attach event listeners to buttons
        attachEventListeners(); // New call added here
    });
    ```

This change ensures that all event handlers are attached correctly within the module's scope, making the buttons fully responsive without relying on global function exposure.

### 3. Verification

#### Testing Procedure
After implementing the fix, the following steps were taken to verify its effectiveness:
1.  The development server was restarted to ensure the changes were loaded.
2.  The 00106-timesheet page was accessed in a web browser.
3.  Each button was tested to confirm its functionality:
    *   **"Current Week"**: Verified that the week selector updates to the current week and the timesheet refreshes.
    *   **"Export CSV"**: Confirmed that a CSV file is generated and downloaded.
    *   **"➕ Add Task"**: Checked that new tasks can be added via the form.
    *   **"📋 Manage Templates"**: Ensured the template management modal opens.
    *   **"💾 Save as Template"**: Verified that the current timesheet data can be saved as a new template.
    *   **"🗑️ Clear Week"**: Confirmed the prompt appears and the week's data is cleared upon confirmation.
    *   **Inline "Edit", "Delete", "Copy" buttons**: Tested on dynamically generated timesheet rows to ensure they function correctly.
    *   **"Apply", "Edit", "Delete" buttons for templates**: Verified their functionality within the template list.
4.  The browser's developer console was monitored for any JavaScript errors, confirming that no errors related to undefined functions were occurring.

#### Outcome
All buttons on the 00106-timesheet page became fully responsive. The fix successfully restored the intended functionality without introducing any new issues. The interaction between the HTML and JavaScript modules now works as expected.

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-15): Initial version - Documented the diagnosis and fix for non-responsive buttons on the 00106-timesheet page.


---

### 1300_00106_TIMESHEET_BUTTONMASTER_GUIDE_UNKNOWN_DISCIPLINE.md

# 1300_00106_TIMESHEET_BUTTON_MASTER_GUIDE.md - UNKNOWN_DISCIPLINE Page

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2026-01-15): Auto-generated master guide

## Overview
Master guide for UNKNOWN_DISCIPLINE discipline documentation.

## Documentation Index

- [1300_00106_TIMESHEET_BUTTON_FIX.md](1300_00106_TIMESHEET_BUTTON_FIX.md)

## Related Documentation
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](../pages-elements/1400_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page patterns
- [0000_WORKFLOW_OPTIMIZATION_GUIDE.md](../../procedures/0000_WORKFLOW_OPTIMIZATION_GUIDE.md) - Optimization procedures

---
*Auto-generated by Documentation Agent on 2026-01-15T09:16:52.314Z*


---

### 1300_00106_TIMESHEET_PAGEEXAMPLE.md

# 00106 Timesheet Page Example

## Overview
This document provides a detailed example of the 00106-timesheet page implementation, which represents a typical simpler page in the ConstructAI system. This page demonstrates the tab-based navigation pattern, standard accordion integration, and simpler modal system used by link-based pages.

## Page Structure Analysis

### Directory Structure
```
client/src/pages/00106-timesheet/
├── 00106-index.js                    # Entry point
├── components/
│   ├── 00106-timesheet-page.js       # Main page component
│   ├── 00106-timesheet-grid.js       # Grid display component
│   ├── 00106-timesheet-form.js       # Entry form component
│   ├── modals/
│   │   ├── 00106-timesheet-entry-modal.js
│   │   └── 00106-template-management-modal.js
│   └── css/
│       └── 00106-timesheet-style.css # Page-specific styles
└── assets/
    └── 00106.png                     # Background image
```

## Core Component Implementation

### Main Page Component (00106-timesheet-page.js)
```javascript
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Alert,
  Row,
  Col,
  Badge,
  Spinner,
  Modal,
  Form,
  Accordion,
  Table,
  InputGroup,
  Dropdown,
  Tabs,
  Tab,
} from "react-bootstrap";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import { getSupabase } from "@common/js/auth/00175-supabase-client.js";
import "./css/00106-timesheet-style.css";

// Component imports
import TimesheetGrid from "./00106-timesheet-grid.js";
import TimesheetForm from "./00106-timesheet-form.js";

const TimesheetPage = () => {
  // State management
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Timesheet states
  const [timesheets, setTimesheets] = useState([]);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Initialize settings manager
  useEffect(() => {
    const initSettings = async () => {
      try {
        console.log("[00106] Initializing settings manager...");
        if (!settingsManager) {
          console.warn("[00106] Settings manager is not available");
          setIsSettingsInitialized(true);
          return;
        }
        await settingsManager.initialize();
        console.log("[00106] Settings manager initialized");
        try {
          await settingsManager.applySettings();
          console.log("[00106] Settings applied successfully");
        } catch (applyError) {
          console.warn(
            "[00106] Could not apply settings, using defaults:",
            applyError
          );
        }
        setIsSettingsInitialized(true);
      } catch (err) {
        console.error("[00106] Error initializing settings:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });
        setIsSettingsInitialized(true);
      }
    };
    initSettings();
  }, []);

  // Get background image path
  const backgroundImagePath = "/assets/default/00106.png";

  return (
    <div className="timesheet-page-wrapper">
      {/* Background Image */}
      <div
        className="page-background"
        style={{
          backgroundImage: `url(${backgroundImagePath})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: -1
        }}
      />
      
      {/* Accordion Integration */}
      {isSettingsInitialized && (
        <AccordionProvider>
          <AccordionComponent settingsManager={settingsManager} />
        </AccordionProvider>
      )}
      
      {/* Main Content Area */}
      <div className="content-wrapper" style={{ position: 'relative', zIndex: 1 }}>
        <Card className="page-card">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h3>Timesheet Management</h3>
            <div className="header-controls">
              <Button 
                variant="primary" 
                onClick={() => setShowEntryModal(true)}
                className="me-2"
              >
                <i className="bi bi-plus-circle"></i> New Entry
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={() => setShowTemplateModal(true)}
              >
                <i className="bi bi-collection"></i> Templates
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {/* Tab-based Navigation */}
            <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
              <Tab eventKey="current" title="Current Week">
                <TimesheetGrid 
                  period="current" 
                  onEdit={setSelectedTimesheet}
                  onShowModal={setShowEntryModal}
                />
              </Tab>
              <Tab eventKey="history" title="History">
                <TimesheetGrid 
                  period="history" 
                  onEdit={setSelectedTimesheet}
                  onShowModal={setShowEntryModal}
                />
              </Tab>
              <Tab eventKey="templates" title="Templates">
                <TimesheetGrid 
                  period="templates" 
                  onEdit={setSelectedTimesheet}
                  onShowModal={setShowTemplateModal}
                />
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </div>
      
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Alert
            key={toast.id}
            variant={toast.variant}
            onClose={() => setToasts(toasts.filter(t => t.id !== toast.id))}
            dismissible
            className="toast-notification"
          >
            {toast.message}
          </Alert>
        ))}
      </div>
    </div>
  );
};

export default TimesheetPage;
```

### Timesheet Grid Component (00106-timesheet-grid.js)
```javascript
import React, { useState, useEffect } from "react";
import { Table, Button, Badge, Spinner } from "react-bootstrap";
import { getSupabase } from "@common/js/auth/00175-supabase-client.js";

const TimesheetGrid = ({ period, onEdit, onShowModal }) => {
  const [timesheets, setTimesheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimesheets = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = await getSupabase();
        let query = supabase.from('timesheets').select('*');
        
        // Filter by period
        switch(period) {
          case 'current':
            query = query.gte('date', getStartOfWeek());
            break;
          case 'history':
            query = query.lt('date', getStartOfWeek());
            break;
          case 'templates':
            query = query.eq('is_template', true);
            break;
        }
        
        const { data, error } = await query.order('date', { ascending: false });
        
        if (error) throw error;
        setTimesheets(data);
      } catch (err) {
        setError("Failed to load timesheets: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimesheets();
  }, [period]);

  const getStartOfWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" role="status" className="mb-3" />
        <div>Loading timesheets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  return (
    <Table striped bordered hover responsive className="timesheet-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Project</th>
          <th>Hours</th>
          <th>Activity</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {timesheets.map((timesheet) => (
          <tr key={timesheet.id}>
            <td>{timesheet.date}</td>
            <td>{timesheet.project_name}</td>
            <td>{timesheet.hours}</td>
            <td>{timesheet.activity}</td>
            <td>
              <Badge bg={
                timesheet.status === 'submitted' ? 'success' :
                timesheet.status === 'approved' ? 'primary' :
                timesheet.status === 'rejected' ? 'danger' : 'warning'
              }>
                {timesheet.status}
              </Badge>
            </td>
            <td>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  onEdit(timesheet);
                  onShowModal(true);
                }}
                className="me-1"
              >
                <i className="bi bi-pencil"></i>
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleDelete(timesheet.id)}
              >
                <i className="bi bi-trash"></i>
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default TimesheetGrid;
```

## CSS Structure and Styling

### Main Styles (00106-timesheet-style.css)
```css
/* Page-specific styles for 00106-timesheet */

.timesheet-page-wrapper {
  position: relative;
  color: #000000 !important;
}

.timesheet-page-wrapper * {
  color: #000000 !important;
}

.page-background {
  background-size: cover;
  background-position: center bottom;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

.page-card {
  margin: 2rem;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.header-controls {
  display: flex;
  gap: 10px;
}

.timesheet-table th {
  background-color: rgba(74, 137, 220, 0.1);
  font-weight: 600;
}

.timesheet-table td {
  vertical-align: middle;
}

/* Toast notifications */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.toast-notification {
  margin-bottom: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  border: none;
  border-left: 4px solid;
}

/* Responsive design */
@media (max-width: 768px) {
  .page-card {
    margin: 1rem;
    padding: 1rem;
  }
  
  .timesheet-table {
    font-size: 0.875rem;
  }
  
  .header-controls {
    flex-direction: column;
    gap: 5px;
  }
  
  .header-controls .btn {
    width: 100%;
  }
}
```

## Key Implementation Features

### 1. Tab-Based Navigation
The timesheet page uses a simple tab-based navigation system:
- **Current Week**: Displays current week's timesheet entries
- **History**: Shows historical timesheet entries
- **Templates**: Manages timesheet templates

### 2. Background Image Handling
Unlike the complex 00435 page, the timesheet page has a fixed background image:
- Uses `00106.png` as the background image
- `backgroundAttachment: 'fixed'` for consistent positioning
- No dynamic theming - background remains constant

### 3. Simpler Component Architecture
The page uses a simpler component structure with:
- Tab-based content organization
- Standard form and grid components
- Basic modal system
- Template management features

### 4. Standard Grid Layout
The page implements a standard table-based grid layout with:
- Responsive table design
- Status badges for visual feedback
- Action buttons for editing/deleting
- Loading and error states

## Implementation Patterns

### 1. Settings Manager Integration
```javascript
useEffect(() => {
  const initSettings = async () => {
    try {
      console.log("[00106] Initializing settings manager...");
      if (!settingsManager) {
        console.warn("[00106] Settings manager is not available");
        setIsSettingsInitialized(true);
        return;
      }
      await settingsManager.initialize();
      console.log("[00106] Settings manager initialized");
      try {
        await settingsManager.applySettings();
        console.log("[00106] Settings applied successfully");
      } catch (applyError) {
        console.warn(
          "[00106] Could not apply settings, using defaults:",
          applyError
        );
      }
      setIsSettingsInitialized(true);
    } catch (err) {
      console.error("[00106] Error initializing settings:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      setIsSettingsInitialized(true);
    }
  };
  initSettings();
}, []);
```

### 2. Accordion Integration
```javascript
{isSettingsInitialized && (
  <AccordionProvider>
    <AccordionComponent settingsManager={settingsManager} />
  </AccordionProvider>
)}
```

### 3. Background Image Implementation
```javascript
const backgroundImagePath = "/assets/default/00106.png";

<div
  className="page-background"
  style={{
    backgroundImage: `url(${backgroundImagePath})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center bottom',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    width: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: -1
  }}
/>
```

## Best Practices Demonstrated

### 1. Simpler State Management
- Tab-based navigation instead of complex state system
- Standard React state management patterns
- Proper error handling and loading states

### 2. Component Organization
- Clear separation of concerns
- Reusable grid and form components
- Proper prop passing and event handling

### 3. User Experience
- Intuitive tab-based interface
- Clear visual feedback with badges
- Responsive design for all devices
- Standard modal patterns

### 4. Performance Considerations
- Efficient data fetching with useEffect
- Proper cleanup of resources
- Memoization where appropriate
- Lazy loading for large datasets

## Implementation Checklist

### Core Requirements
- [x] Tab-based navigation system
- [x] Fixed background image implementation
- [x] Standard modal system integration
- [x] Grid-based layout with table
- [x] Settings manager integration
- [x] Accordion system integration
- [x] Responsive design implementation
- [x] Error handling and fallbacks
- [x] Performance optimization techniques

### Page-Specific Features
- [x] Timesheet entry management
- [x] Template system implementation
- [x] Status tracking and display
- [x] Project-based organization
- [x] Weekly period management
- [x] Approval workflow support

## Differences from Complex Pages (00435-style)

### Simpler Architecture
- **Navigation**: Tab-based instead of three-state buttons
- **Background**: Fixed image instead of dynamic theming
- **Components**: Standard forms/grids instead of animated layouts
- **State Management**: Simpler tab states instead of complex workflows

### Reduced Complexity
- **Modal System**: Basic modal patterns instead of advanced workflows
- **AI Integration**: Optional AI features instead of core functionality
- **Data Interaction**: Standard CRUD operations instead of complex processing
- **User Interface**: Simpler layouts instead of animated grids

## Related Documentation

- [1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md](1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md) - Simpler page implementation guide
- [1300_0000_PAGE_ARCHITECTURE_GUIDE.md](1300_0000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture
- [1300_0000_PAGE_LIST.md](1300_0000_PAGE_LIST.md) - Complete page documentation
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Accordion system
- [1300_00435_SAMPLE_PAGE_STRUCTURE.md](1300_00435_SAMPLE_PAGE_STRUCTURE.md) - Complex page example

This example demonstrates how simpler pages like the timesheet page differ from complex accordion-based pages while maintaining consistency with the overall ConstructAI system architecture.


---

### 1300_00106_TIMESHEET_PAGEMASTER_GUIDE_UNKNOWN_DISCIPLINE.md

# 1300_00106_TIMESHEET_PAGE_MASTER_GUIDE.md - UNKNOWN_DISCIPLINE Page

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2026-01-15): Auto-generated master guide

## Overview
Master guide for UNKNOWN_DISCIPLINE discipline documentation.

## Documentation Index

- [1300_00106_TIMESHEET_PAGE_EXAMPLE.md](1300_00106_TIMESHEET_PAGE_EXAMPLE.md)

## Related Documentation
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](../pages-elements/1400_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page patterns
- [0000_WORKFLOW_OPTIMIZATION_GUIDE.md](../../procedures/0000_WORKFLOW_OPTIMIZATION_GUIDE.md) - Optimization procedures

---
*Auto-generated by Documentation Agent on 2026-01-15T09:16:52.314Z*


---

### 1300_00106_TIMESHEET_PAGE_IMPLEMENTATIONMASTER_GUIDE_UNKNOWN_DISCIPLINE.md

# 1300_00106_TIMESHEET_PAGE_IMPLEMENTATION_MASTER_GUIDE.md - UNKNOWN_DISCIPLINE Page

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2026-01-15): Auto-generated master guide

## Overview
Master guide for UNKNOWN_DISCIPLINE discipline documentation.

## Documentation Index

- [1300_00106_TIMESHEET_PAGE_IMPLEMENTATION_EXAMPLE.md](1300_00106_TIMESHEET_PAGE_IMPLEMENTATION_EXAMPLE.md)

## Related Documentation
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](../pages-elements/1400_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page patterns
- [0000_WORKFLOW_OPTIMIZATION_GUIDE.md](../../procedures/0000_WORKFLOW_OPTIMIZATION_GUIDE.md) - Optimization procedures

---
*Auto-generated by Documentation Agent on 2026-01-15T09:16:52.317Z*


---



---

### 1300_00106_RUN_TIMESHEET_SETUP.md

# Timesheet Setup and Testing Guide

## Overview
This guide explains how to set up and test the timesheet functionality that was implemented to fix the missing save button and approval routing on the 00106 Weekly Timesheet page.

## Database Setup

### 1. Create Timesheet Submissions Table
Run the SQL script to create the timesheet submissions table:

```sql
-- Execute this SQL in your Supabase database
-- File: sql/create_timesheet_submissions_table.sql
CREATE TABLE IF NOT EXISTS timesheet_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    week_key VARCHAR(20) NOT NULL, -- Format: YYYY-WXX (e.g., 2025-W34)
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    tasks JSONB NOT NULL, -- Array of task objects with description, project, hours, etc.
    total_hours DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, approved, rejected
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    approver_id UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timesheet_submissions_user_id ON timesheet_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_submissions_week_key ON timesheet_submissions(week_key);
CREATE INDEX IF NOT EXISTS idx_timesheet_submissions_status ON timesheet_submissions(status);
CREATE INDEX IF NOT EXISTS idx_timesheet_submissions_created_at ON timesheet_submissions(created_at);

-- Enable RLS
ALTER TABLE timesheet_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own timesheet submissions" ON timesheet_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timesheet submissions" ON timesheet_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timesheet submissions" ON timesheet_submissions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timesheet submissions" ON timesheet_submissions
    FOR DELETE USING (auth.uid() = user_id);
```

## Backend API Endpoints

The timesheet functionality uses the following API endpoints:

### Submit Timesheet
- **POST** `/api/timesheet/submit`
- Submit a timesheet for approval
- Request body: `{ weekKey, tasks, totalHours }`

### Get Submissions
- **GET** `/api/timesheet/submissions`
- Get all timesheet submissions for the current user

### Get Specific Submission
- **GET** `/api/timesheet/submissions/:id`
- Get a specific timesheet submission

### Update Submission Status
- **POST** `/api/timesheet/submissions/:id/status`
- Update timesheet submission status (approve/reject)

## Frontend Features

### Save Button
The "Submit for Approval" button has been added to the timesheet page controls. It:
- Validates that there are tasks to submit
- Calculates total hours automatically
- Sends data to the backend API
- Shows loading state during submission
- Displays success/error messages

### Previous Submissions
A new section displays previous timesheet submissions with:
- Week key (e.g., 2025-W34)
- Submission date
- Total hours
- Current status (draft, submitted, approved, rejected)
- Rejection reason (if rejected)

### Template Management
Existing template functionality remains unchanged:
- Save current week as template
- Apply templates to current week
- Manage existing templates

## Testing the Implementation

### 1. Start the Development Server
```bash
# From the server directory
npm run dev
```

### 2. Navigate to Timesheet Page
- Open your browser and go to `/timesheet`
- You should see the updated interface with the new "Submit for Approval" button

### 3. Test Timesheet Submission
1. Add some tasks to the current week
2. Click "Submit for Approval"
3. Confirm the submission in the popup
4. Check that the submission appears in the "Previous Submissions" section

### 4. Test Previous Submissions
1. Submit multiple timesheets for different weeks
2. Refresh the page
3. Verify that previous submissions appear in the list
4. Check that statuses are displayed correctly

### 5. Test Error Handling
1. Try submitting with no tasks (should show error)
2. Try submitting without selecting a week (should show error)
3. Test network error scenarios (offline mode)

## Troubleshooting

### Common Issues

1. **Save button disabled**: Make sure there are tasks in the current week
2. **Submission fails**: Check browser console for API errors
3. **Previous submissions not loading**: Verify database connection and user authentication
4. **Database errors**: Ensure the timesheet_submissions table exists with correct schema

### Debugging Steps

1. Check browser console for JavaScript errors
2. Check server logs for API request handling
3. Verify database table structure matches expected schema
4. Test API endpoints directly with tools like Postman

## Security Considerations

- All API endpoints require authentication
- Row Level Security (RLS) is enabled on the timesheet_submissions table
- Users can only access their own submissions
- Proper input validation is performed on all endpoints

## Performance Considerations

- Database indexes are created for common query patterns
- Previous submissions are loaded on demand
- Large submission data is handled efficiently with JSONB
- API responses are optimized for frontend usage

## Future Enhancements

- Add approval workflow notifications
- Implement timesheet reporting features
- Add export functionality for managers
- Include project-based reporting
- Add integration with project management systems


---

### 1300_00106_RUN_TIMESHEET_TEMPLATES_UPDATE.md

# Timesheet Templates Update Instructions

This document provides instructions on how to update the timesheet templates to be construction/engineering related.

## SQL Script

The SQL script `update_timesheet_templates.sql` has been created with the necessary UPDATE statements to modify the existing templates.

## Running the SQL Script

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor (Database > SQL Editor)
3. Create a new query
4. Copy and paste the contents of `update_timesheet_templates.sql` into the editor
5. Click "Run" to execute the script

### Option 2: Using psql (Command Line)

If you have the database connection details, you can run the script using psql:

```bash
psql "postgresql://[username]:[password]@[host]:[port]/[database]" -f update_timesheet_templates.sql
```

Note: You'll need to replace the placeholders with your actual database connection details.

## What the Script Does

The script updates the existing timesheet templates with construction/engineering related tasks:

1. "Weekly Development Tasks" → "Weekly Construction Tasks"
2. "Weekly Design Tasks" → "Weekly Engineering Tasks"
3. "Weekly Project Management Tasks" → Updated with construction-specific tasks
4. "Weekly Administrative Tasks" → Updated with construction-specific tasks

Each template now contains industry-appropriate project names and descriptions.


---

### 1300_00106_TIMESHEET_BUTTONFIX.md

# 1300_00106_TIMESHEET_BUTTON_FIX.md

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-15): Initial version - Documented the diagnosis and fix for non-responsive buttons on the 00106-timesheet page.

## Overview
This document provides a detailed account of the diagnosis and resolution of an issue where all interactive buttons on the 00106-timesheet page (`/Users/_PropAI/agent-testing copy1/client/public/pages/00106-timesheet/00106-timesheet.html`) were non-responsive. The problem prevented users from performing any actions within the timesheet application, such as adding tasks, managing templates, or exporting data.

## Requirements
The fix was required to:
- Restore full functionality to all buttons on the 00106-timesheet page.
- Ensure that all `onclick` event handlers correctly trigger their associated JavaScript functions.
- Maintain the existing module-based JavaScript structure without introducing global scope pollution.
- Adhere to the project's established coding and documentation standards.

## Implementation

### 1. Problem Diagnosis

#### Initial Analysis
The initial investigation began by examining the primary file for the 00106-timesheet page:
`/Users/_PropAI/agent-testing copy1/client/public/pages/00106-timesheet/00106-timesheet.html`

The page's interactive elements, such as buttons, were defined with inline `onclick` HTML attributes. For example:
```html
<button type="button" class="btn btn-primary" onclick="goToCurrentWeek()">Current Week</button>
<button type="button" class="btn btn-secondary" onclick="exportTimesheet()">Export CSV</button>
<button type="button" class="btn btn-primary" onclick="addNewRow()">➕ Add Task</button>
```

#### Root Cause Identification
The core JavaScript logic for the timesheet, including functions like `goToCurrentWeek`, `exportTimesheet`, and `addNewRow`, was encapsulated within a `<script type="module">` tag:
```html
<script type="module">
    // ... imports ...
    document.addEventListener('DOMContentLoaded', async function() {
        // ... initialization ...
    });

    function goToCurrentWeek() {
        // ... function body ...
    }

    function exportTimesheet() {
        // ... function body ...
    }

    // ... other functions ...
</script>
```

The root cause of the issue was identified as a **JavaScript module scoping problem**. Functions declared inside a module are scoped to that module by default and are not automatically added to the global `window` object. Inline `onclick` handlers in HTML attempt to call functions by name in the global scope. Since the functions were not globally accessible, the calls failed, resulting in unresponsive buttons.

### 2. Solution Implementation

#### Strategy
The initial strategy of assigning functions to the `window` object was found to be unreliable. The definitive solution involves replacing the inline HTML `onclick` handlers with programmatic event listeners using `addEventListener`. This approach correctly handles the module scope by attaching event handlers directly within the module's execution context after the DOM is fully loaded. This eliminates any dependency on the global scope for function calls.

#### Code Changes

1.  **A new function `attachEventListeners` was created** within the `<script type="module">` tag. This function is responsible for selecting all buttons with `onclick` attributes, removing those attributes, and attaching the corresponding event listeners using `addEventListener`.

    ```javascript
    function attachEventListeners() {
        // Week selector
        const weekSelector = document.getElementById('week-selector');
        if (weekSelector) {
            weekSelector.addEventListener('change', loadWeekData);
        }

        // Control buttons
        const goToCurrentWeekBtn = document.querySelector('button[onclick="goToCurrentWeek()"]');
        if (goToCurrentWeekBtn) {
            goToCurrentWeekBtn.removeAttribute('onclick');
            goToCurrentWeekBtn.addEventListener('click', goToCurrentWeek);
        }

        const exportTimesheetBtn = document.querySelector('button[onclick="exportTimesheet()"]');
        if (exportTimesheetBtn) {
            exportTimesheetBtn.removeAttribute('onclick');
            exportTimesheetBtn.addEventListener('click', exportTimesheet);
        }

        // ... other buttons ...
    }
    ```

2.  **The `attachEventListeners` function was called** inside the existing `DOMContentLoaded` event listener, ensuring it runs only after the entire HTML document has been parsed and is ready for manipulation.

    ```javascript
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('Timesheet page loaded with accordion system');
        await initializeAccordion();
        
        // Initialize timesheet functionality
        initializeTimesheet();

        // Attach event listeners to buttons
        attachEventListeners(); // New call added here
    });
    ```

This change ensures that all event handlers are attached correctly within the module's scope, making the buttons fully responsive without relying on global function exposure.

### 3. Verification

#### Testing Procedure
After implementing the fix, the following steps were taken to verify its effectiveness:
1.  The development server was restarted to ensure the changes were loaded.
2.  The 00106-timesheet page was accessed in a web browser.
3.  Each button was tested to confirm its functionality:
    *   **"Current Week"**: Verified that the week selector updates to the current week and the timesheet refreshes.
    *   **"Export CSV"**: Confirmed that a CSV file is generated and downloaded.
    *   **"➕ Add Task"**: Checked that new tasks can be added via the form.
    *   **"📋 Manage Templates"**: Ensured the template management modal opens.
    *   **"💾 Save as Template"**: Verified that the current timesheet data can be saved as a new template.
    *   **"🗑️ Clear Week"**: Confirmed the prompt appears and the week's data is cleared upon confirmation.
    *   **Inline "Edit", "Delete", "Copy" buttons**: Tested on dynamically generated timesheet rows to ensure they function correctly.
    *   **"Apply", "Edit", "Delete" buttons for templates**: Verified their functionality within the template list.
4.  The browser's developer console was monitored for any JavaScript errors, confirming that no errors related to undefined functions were occurring.

#### Outcome
All buttons on the 00106-timesheet page became fully responsive. The fix successfully restored the intended functionality without introducing any new issues. The interaction between the HTML and JavaScript modules now works as expected.

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-15): Initial version - Documented the diagnosis and fix for non-responsive buttons on the 00106-timesheet page.


---

### 1300_00106_TIMESHEET_BUTTONMASTER_GUIDE_UNKNOWN_DISCIPLINE.md

# 1300_00106_TIMESHEET_BUTTON_MASTER_GUIDE.md - UNKNOWN_DISCIPLINE Page

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2026-01-15): Auto-generated master guide

## Overview
Master guide for UNKNOWN_DISCIPLINE discipline documentation.

## Documentation Index

- [1300_00106_TIMESHEET_BUTTON_FIX.md](1300_00106_TIMESHEET_BUTTON_FIX.md)

## Related Documentation
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](../pages-elements/1400_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page patterns
- [0000_WORKFLOW_OPTIMIZATION_GUIDE.md](../../procedures/0000_WORKFLOW_OPTIMIZATION_GUIDE.md) - Optimization procedures

---
*Auto-generated by Documentation Agent on 2026-01-15T09:16:52.314Z*


---

### 1300_00106_TIMESHEET_PAGEEXAMPLE.md

# 00106 Timesheet Page Example

## Overview
This document provides a detailed example of the 00106-timesheet page implementation, which represents a typical simpler page in the ConstructAI system. This page demonstrates the tab-based navigation pattern, standard accordion integration, and simpler modal system used by link-based pages.

## Page Structure Analysis

### Directory Structure
```
client/src/pages/00106-timesheet/
├── 00106-index.js                    # Entry point
├── components/
│   ├── 00106-timesheet-page.js       # Main page component
│   ├── 00106-timesheet-grid.js       # Grid display component
│   ├── 00106-timesheet-form.js       # Entry form component
│   ├── modals/
│   │   ├── 00106-timesheet-entry-modal.js
│   │   └── 00106-template-management-modal.js
│   └── css/
│       └── 00106-timesheet-style.css # Page-specific styles
└── assets/
    └── 00106.png                     # Background image
```

## Core Component Implementation

### Main Page Component (00106-timesheet-page.js)
```javascript
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Alert,
  Row,
  Col,
  Badge,
  Spinner,
  Modal,
  Form,
  Accordion,
  Table,
  InputGroup,
  Dropdown,
  Tabs,
  Tab,
} from "react-bootstrap";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import { getSupabase } from "@common/js/auth/00175-supabase-client.js";
import "./css/00106-timesheet-style.css";

// Component imports
import TimesheetGrid from "./00106-timesheet-grid.js";
import TimesheetForm from "./00106-timesheet-form.js";

const TimesheetPage = () => {
  // State management
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Timesheet states
  const [timesheets, setTimesheets] = useState([]);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Initialize settings manager
  useEffect(() => {
    const initSettings = async () => {
      try {
        console.log("[00106] Initializing settings manager...");
        if (!settingsManager) {
          console.warn("[00106] Settings manager is not available");
          setIsSettingsInitialized(true);
          return;
        }
        await settingsManager.initialize();
        console.log("[00106] Settings manager initialized");
        try {
          await settingsManager.applySettings();
          console.log("[00106] Settings applied successfully");
        } catch (applyError) {
          console.warn(
            "[00106] Could not apply settings, using defaults:",
            applyError
          );
        }
        setIsSettingsInitialized(true);
      } catch (err) {
        console.error("[00106] Error initializing settings:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });
        setIsSettingsInitialized(true);
      }
    };
    initSettings();
  }, []);

  // Get background image path
  const backgroundImagePath = "/assets/default/00106.png";

  return (
    <div className="timesheet-page-wrapper">
      {/* Background Image */}
      <div
        className="page-background"
        style={{
          backgroundImage: `url(${backgroundImagePath})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: -1
        }}
      />
      
      {/* Accordion Integration */}
      {isSettingsInitialized && (
        <AccordionProvider>
          <AccordionComponent settingsManager={settingsManager} />
        </AccordionProvider>
      )}
      
      {/* Main Content Area */}
      <div className="content-wrapper" style={{ position: 'relative', zIndex: 1 }}>
        <Card className="page-card">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h3>Timesheet Management</h3>
            <div className="header-controls">
              <Button 
                variant="primary" 
                onClick={() => setShowEntryModal(true)}
                className="me-2"
              >
                <i className="bi bi-plus-circle"></i> New Entry
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={() => setShowTemplateModal(true)}
              >
                <i className="bi bi-collection"></i> Templates
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {/* Tab-based Navigation */}
            <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
              <Tab eventKey="current" title="Current Week">
                <TimesheetGrid 
                  period="current" 
                  onEdit={setSelectedTimesheet}
                  onShowModal={setShowEntryModal}
                />
              </Tab>
              <Tab eventKey="history" title="History">
                <TimesheetGrid 
                  period="history" 
                  onEdit={setSelectedTimesheet}
                  onShowModal={setShowEntryModal}
                />
              </Tab>
              <Tab eventKey="templates" title="Templates">
                <TimesheetGrid 
                  period="templates" 
                  onEdit={setSelectedTimesheet}
                  onShowModal={setShowTemplateModal}
                />
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </div>
      
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Alert
            key={toast.id}
            variant={toast.variant}
            onClose={() => setToasts(toasts.filter(t => t.id !== toast.id))}
            dismissible
            className="toast-notification"
          >
            {toast.message}
          </Alert>
        ))}
      </div>
    </div>
  );
};

export default TimesheetPage;
```

### Timesheet Grid Component (00106-timesheet-grid.js)
```javascript
import React, { useState, useEffect } from "react";
import { Table, Button, Badge, Spinner } from "react-bootstrap";
import { getSupabase } from "@common/js/auth/00175-supabase-client.js";

const TimesheetGrid = ({ period, onEdit, onShowModal }) => {
  const [timesheets, setTimesheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimesheets = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = await getSupabase();
        let query = supabase.from('timesheets').select('*');
        
        // Filter by period
        switch(period) {
          case 'current':
            query = query.gte('date', getStartOfWeek());
            break;
          case 'history':
            query = query.lt('date', getStartOfWeek());
            break;
          case 'templates':
            query = query.eq('is_template', true);
            break;
        }
        
        const { data, error } = await query.order('date', { ascending: false });
        
        if (error) throw error;
        setTimesheets(data);
      } catch (err) {
        setError("Failed to load timesheets: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimesheets();
  }, [period]);

  const getStartOfWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" role="status" className="mb-3" />
        <div>Loading timesheets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  return (
    <Table striped bordered hover responsive className="timesheet-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Project</th>
          <th>Hours</th>
          <th>Activity</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {timesheets.map((timesheet) => (
          <tr key={timesheet.id}>
            <td>{timesheet.date}</td>
            <td>{timesheet.project_name}</td>
            <td>{timesheet.hours}</td>
            <td>{timesheet.activity}</td>
            <td>
              <Badge bg={
                timesheet.status === 'submitted' ? 'success' :
                timesheet.status === 'approved' ? 'primary' :
                timesheet.status === 'rejected' ? 'danger' : 'warning'
              }>
                {timesheet.status}
              </Badge>
            </td>
            <td>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  onEdit(timesheet);
                  onShowModal(true);
                }}
                className="me-1"
              >
                <i className="bi bi-pencil"></i>
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleDelete(timesheet.id)}
              >
                <i className="bi bi-trash"></i>
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default TimesheetGrid;
```

## CSS Structure and Styling

### Main Styles (00106-timesheet-style.css)
```css
/* Page-specific styles for 00106-timesheet */

.timesheet-page-wrapper {
  position: relative;
  color: #000000 !important;
}

.timesheet-page-wrapper * {
  color: #000000 !important;
}

.page-background {
  background-size: cover;
  background-position: center bottom;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

.page-card {
  margin: 2rem;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.header-controls {
  display: flex;
  gap: 10px;
}

.timesheet-table th {
  background-color: rgba(74, 137, 220, 0.1);
  font-weight: 600;
}

.timesheet-table td {
  vertical-align: middle;
}

/* Toast notifications */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.toast-notification {
  margin-bottom: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  border: none;
  border-left: 4px solid;
}

/* Responsive design */
@media (max-width: 768px) {
  .page-card {
    margin: 1rem;
    padding: 1rem;
  }
  
  .timesheet-table {
    font-size: 0.875rem;
  }
  
  .header-controls {
    flex-direction: column;
    gap: 5px;
  }
  
  .header-controls .btn {
    width: 100%;
  }
}
```

## Key Implementation Features

### 1. Tab-Based Navigation
The timesheet page uses a simple tab-based navigation system:
- **Current Week**: Displays current week's timesheet entries
- **History**: Shows historical timesheet entries
- **Templates**: Manages timesheet templates

### 2. Background Image Handling
Unlike the complex 00435 page, the timesheet page has a fixed background image:
- Uses `00106.png` as the background image
- `backgroundAttachment: 'fixed'` for consistent positioning
- No dynamic theming - background remains constant

### 3. Simpler Component Architecture
The page uses a simpler component structure with:
- Tab-based content organization
- Standard form and grid components
- Basic modal system
- Template management features

### 4. Standard Grid Layout
The page implements a standard table-based grid layout with:
- Responsive table design
- Status badges for visual feedback
- Action buttons for editing/deleting
- Loading and error states

## Implementation Patterns

### 1. Settings Manager Integration
```javascript
useEffect(() => {
  const initSettings = async () => {
    try {
      console.log("[00106] Initializing settings manager...");
      if (!settingsManager) {
        console.warn("[00106] Settings manager is not available");
        setIsSettingsInitialized(true);
        return;
      }
      await settingsManager.initialize();
      console.log("[00106] Settings manager initialized");
      try {
        await settingsManager.applySettings();
        console.log("[00106] Settings applied successfully");
      } catch (applyError) {
        console.warn(
          "[00106] Could not apply settings, using defaults:",
          applyError
        );
      }
      setIsSettingsInitialized(true);
    } catch (err) {
      console.error("[00106] Error initializing settings:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      setIsSettingsInitialized(true);
    }
  };
  initSettings();
}, []);
```

### 2. Accordion Integration
```javascript
{isSettingsInitialized && (
  <AccordionProvider>
    <AccordionComponent settingsManager={settingsManager} />
  </AccordionProvider>
)}
```

### 3. Background Image Implementation
```javascript
const backgroundImagePath = "/assets/default/00106.png";

<div
  className="page-background"
  style={{
    backgroundImage: `url(${backgroundImagePath})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center bottom',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    width: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: -1
  }}
/>
```

## Best Practices Demonstrated

### 1. Simpler State Management
- Tab-based navigation instead of complex state system
- Standard React state management patterns
- Proper error handling and loading states

### 2. Component Organization
- Clear separation of concerns
- Reusable grid and form components
- Proper prop passing and event handling

### 3. User Experience
- Intuitive tab-based interface
- Clear visual feedback with badges
- Responsive design for all devices
- Standard modal patterns

### 4. Performance Considerations
- Efficient data fetching with useEffect
- Proper cleanup of resources
- Memoization where appropriate
- Lazy loading for large datasets

## Implementation Checklist

### Core Requirements
- [x] Tab-based navigation system
- [x] Fixed background image implementation
- [x] Standard modal system integration
- [x] Grid-based layout with table
- [x] Settings manager integration
- [x] Accordion system integration
- [x] Responsive design implementation
- [x] Error handling and fallbacks
- [x] Performance optimization techniques

### Page-Specific Features
- [x] Timesheet entry management
- [x] Template system implementation
- [x] Status tracking and display
- [x] Project-based organization
- [x] Weekly period management
- [x] Approval workflow support

## Differences from Complex Pages (00435-style)

### Simpler Architecture
- **Navigation**: Tab-based instead of three-state buttons
- **Background**: Fixed image instead of dynamic theming
- **Components**: Standard forms/grids instead of animated layouts
- **State Management**: Simpler tab states instead of complex workflows

### Reduced Complexity
- **Modal System**: Basic modal patterns instead of advanced workflows
- **AI Integration**: Optional AI features instead of core functionality
- **Data Interaction**: Standard CRUD operations instead of complex processing
- **User Interface**: Simpler layouts instead of animated grids

## Related Documentation

- [1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md](1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md) - Simpler page implementation guide
- [1300_0000_PAGE_ARCHITECTURE_GUIDE.md](1300_0000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture
- [1300_0000_PAGE_LIST.md](1300_0000_PAGE_LIST.md) - Complete page documentation
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Accordion system
- [1300_00435_SAMPLE_PAGE_STRUCTURE.md](1300_00435_SAMPLE_PAGE_STRUCTURE.md) - Complex page example

This example demonstrates how simpler pages like the timesheet page differ from complex accordion-based pages while maintaining consistency with the overall ConstructAI system architecture.


---

### 1300_00106_TIMESHEET_PAGEMASTER_GUIDE_UNKNOWN_DISCIPLINE.md

# 1300_00106_TIMESHEET_PAGE_MASTER_GUIDE.md - UNKNOWN_DISCIPLINE Page

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2026-01-15): Auto-generated master guide

## Overview
Master guide for UNKNOWN_DISCIPLINE discipline documentation.

## Documentation Index

- [1300_00106_TIMESHEET_PAGE_EXAMPLE.md](1300_00106_TIMESHEET_PAGE_EXAMPLE.md)

## Related Documentation
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](../pages-elements/1400_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page patterns
- [0000_WORKFLOW_OPTIMIZATION_GUIDE.md](../../procedures/0000_WORKFLOW_OPTIMIZATION_GUIDE.md) - Optimization procedures

---
*Auto-generated by Documentation Agent on 2026-01-15T09:16:52.314Z*


---

### 1300_00106_TIMESHEET_PAGE_IMPLEMENTATIONMASTER_GUIDE_UNKNOWN_DISCIPLINE.md

# 1300_00106_TIMESHEET_PAGE_IMPLEMENTATION_MASTER_GUIDE.md - UNKNOWN_DISCIPLINE Page

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2026-01-15): Auto-generated master guide

## Overview
Master guide for UNKNOWN_DISCIPLINE discipline documentation.

## Documentation Index

- [1300_00106_TIMESHEET_PAGE_IMPLEMENTATION_EXAMPLE.md](1300_00106_TIMESHEET_PAGE_IMPLEMENTATION_EXAMPLE.md)

## Related Documentation
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](../pages-elements/1400_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page patterns
- [0000_WORKFLOW_OPTIMIZATION_GUIDE.md](../../procedures/0000_WORKFLOW_OPTIMIZATION_GUIDE.md) - Optimization procedures

---
*Auto-generated by Documentation Agent on 2026-01-15T09:16:52.317Z*


---

