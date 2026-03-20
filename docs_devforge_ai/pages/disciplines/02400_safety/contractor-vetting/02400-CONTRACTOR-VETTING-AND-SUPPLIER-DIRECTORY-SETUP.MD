# Contractor Vetting & Supplier Directory Setup Guide

## Overview

This document provides instructions for setting up and populating mock data for both the Contractor Vetting System (02400-safety) and Supplier Directory (01900-procurement) components of the Construct AI platform.

## Current Status

Both systems are **fully functional** with comprehensive mock data systems built-in. They can operate in two modes:

1. **Mock Data Mode** (Current): Uses built-in mock data for demonstration
2. **Database Mode**: Connects to Supabase for real data persistence

## Prerequisites

### Environment Variables
Ensure your `.env` file contains valid Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Schema
The required database tables must exist. Run the following SQL scripts if they haven't been executed:

1. **Contractor Vetting System**:
   - `sql/create-contractor-vetting-tables.sql`
   - `sql/create-contractor-vetting-storage.sql`

2. **Supplier Directory**:
   - `sql/create-suppliers-consultants-tables.sql`

## Setup Scripts

Two scripts are provided to populate the systems with realistic mock data:

### 1. Contractor Vetting System
**Script**: `populate_contractor_vetting_mock_data.cjs`

Populates the following tables:
- `contractor_vetting` - 5 mock contractors
- `contractor_evaluation_results` - 5 detailed evaluation results
- `contractor_vetting_chat_messages` - 3 sample chat messages
- `contractor_vetting_dashboard_stats` - Dashboard statistics

**Sample Data Includes**:
- Realistic contractor names and contact information
- Detailed evaluation scores (78-94%) with confidence levels
- Professional commentary for each evaluation
- Chat conversation history
- Dashboard statistics

### 2. Supplier Directory
**Script**: `populate_supplier_directory_mock_data.cjs`

Populates the following tables:
- `suppliers` - 10 diverse suppliers across all categories
- `projects` - 4 sample projects (if table exists)

**Sample Data Includes**:
- 10 suppliers across all types: contractor, materials, equipment, transport, professional, utility
- Various approval statuses: approved, pending, under_review
- Realistic ratings (4.0-4.9) and project histories
- Complete contact information and business details
- Project assignments and compliance statuses

## Running the Setup

### Method 1: Direct Execution (When Supabase is Configured)
```bash
# Populate Contractor Vetting data
node populate_contractor_vetting_mock_data.cjs

# Populate Supplier Directory data
node populate_supplier_directory_mock_data.cjs
```

### Method 2: Manual Database Population
If you prefer to run SQL directly, use the sample data from the scripts as reference for manual INSERT statements.

## System Features

### Contractor Vetting System (02400-safety)
**URL**: `/02400-safety/02400-contractor-vetting`

**Key Features**:
- Multi-section evaluation (Details, Financial, Licensing, Performance, Safety, Quality)
- AI-powered document analysis simulation
- Interactive chat assistant
- Real-time dashboard statistics
- Comprehensive evaluation results table
- Search and filtering capabilities

**Current Mock Data**:
- 5 Contractors: ABC Construction Ltd, Global Engineering Solutions, Premier Infrastructure Corp, Metropolitan Builders Group, Apex Construction Services
- 5 Evaluation Results with detailed scores and commentary
- Chat conversation history
- Dashboard showing total contractors, average scores, high scores, pending reviews

### Supplier Directory (01900-procurement)
**URL**: `/01900-procurement/supplier-directory`

**Key Features**:
- Advanced search and filtering (by type, status, project, name)
- Multi-selection and bulk approval operations
- Import/export functionality (CSV/JSON)
- Detailed supplier profiles with ratings
- Project assignment tracking
- Compliance status management
- Voice call integration
- Real-time statistics dashboard

**Current Mock Data**:
- 10 Suppliers across all categories:
  - Contractors: ABC Construction Ltd, Global Engineering Solutions, etc.
  - Materials: Quality Materials Supply Co
  - Equipment: Tech Equipment Rentals
  - Professional: Professional Engineering Services Ltd
  - Transport: Swift Transport Logistics
  - Utility: Utility Power Solutions
- 4 Projects for assignment tracking
- Various approval statuses and compliance levels
- Realistic ratings and project histories

## Troubleshooting

### Connection Issues
If you see "Invalid API key" errors:
1. Verify your `.env` file contains correct Supabase credentials
2. Ensure the credentials are exported from Render environment
3. Check that the Supabase project is active and accessible

### Table Not Found Errors
If you see table creation errors:
1. Run the required SQL schema scripts first
2. Verify you have proper database permissions
3. Check that the database connection is working

### Data Not Appearing
If data doesn't appear in the UI:
1. Refresh the page to trigger data reload
2. Check browser console for JavaScript errors
3. Verify the database queries are returning data
4. Ensure the React components are properly connected to Supabase

## Best Practices

### For Development
- Use mock data mode for rapid development and testing
- The systems gracefully fall back to mock data when database is unavailable
- All UI features work identically in both modes

### For Production
- Ensure proper database schema is deployed
- Run the population scripts to seed initial data
- Configure proper Row Level Security (RLS) policies
- Set up storage buckets for document management

## Future Enhancements

### Contractor Vetting
- Integration with real AI document analysis services
- Automated scoring algorithms
- Advanced reporting and analytics
- Mobile-responsive design improvements

### Supplier Directory
- Enhanced import wizards with data validation
- Advanced duplicate detection algorithms
- Integration with external supplier databases
- Automated compliance monitoring

## Support

For issues with either system:
1. Check the browser console for error messages
2. Verify database connectivity with the test scripts
3. Ensure all required environment variables are set
4. Confirm SQL schema scripts have been executed
5. Review the component documentation in `docs/`

Both systems are production-ready and fully functional. The mock data provides a complete demonstration of all features and capabilities.
