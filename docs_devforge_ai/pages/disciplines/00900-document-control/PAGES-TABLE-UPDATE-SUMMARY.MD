# Pages Table Update Summary

## Problem
The pages table in Supabase had an excessive number of records (454) due to duplicates. There should be approximately 154 records.

## Solution
1. **Identified duplicates**: Found records with the same page_prefix, page_name, and organization_id combination.
2. **Cleaned data**: Removed 255 duplicate records, reducing the total from 454 to 199 records.
3. **Created SQL scripts**:
   - `add_missing_columns_to_pages.sql`: Adds missing columns to the pages table
   - `update_pages_table_complete.sql`: Complete script to update the pages table with cleaned data

## Key Changes
- Added missing columns: sector_uuid, is_active, hierarchy_level, is_standard_link, is_virtual
- Removed duplicate records while preserving unique combinations
- Maintained proper structure with prefixes for special pages:
  - D00200 for Document Control pages
  - E for Email Management pages

## Files Created
1. `temp/cleaned_pages.csv` - Cleaned CSV file with 199 records
2. `temp/add_missing_columns_to_pages.sql` - Script to add missing columns
3. `temp/update_pages_table_complete.sql` - Complete update script

## Instructions
To update the pages table in Supabase:

1. Run `temp/add_missing_columns_to_pages.sql` to add missing columns
2. Run `temp/update_pages_table_complete.sql` to update/insert records

This will ensure the pages table has the correct structure and data.
