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
