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
