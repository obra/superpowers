# Accordion Relationships Analysis and Fix Summary

## Problem Identified

After analyzing the provided CSV table and comparing it with the UI display mappings and accordion structure shown in the images, I identified significant discrepancies between the expected accordion hierarchy and the actual database relationships.

## Key Issues Found

### Missing Email Management (03010) and Document Control (00900) Relationships

The UI mappings show that most accordion sections should have links to:
- `0200-all-documents.html` (corresponds to Document Control - page_prefix 00900)
- `03010-email-management.html` (corresponds to Email Management - page_prefix 03010)

However, the CSV data shows these relationships are missing from the database.

### Affected Sections

**Main Sections Missing Both Email Management and Document Control:**
1. Administration (00102)
2. Commercial (00200) 
3. Construction (00300)
4. Environmental (01000)
5. Ethics (01100)
6. Finance (01200)
7. Governance (01300)
8. Health (01400)
9. Human Resources (01500)
10. Local Content (01600)
11. Logistics (01700)
12. Legal (01750)
13. Operations (01800)
14. Other Parties (01850)
15. Procurement (01900)
16. Information Technology (02050)
17. Inspection (02075)
18. Public Relations (02100)
19. Quality Assurance (02200)
20. Quality Control (02250)
21. Safety (02400)
22. Security (02500)
23. Landscaping (03000)

**Subsections Missing Both Email Management and Document Control:**
- Design subsections: Architectural (00825), Chemical Engineering (00835), Civil Engineering (00850), Electrical Engineering (00860), Mechanical Engineering (00870)
- Director subsections: Board of Directors (00880), Director Construction (00882), Director Contracts (00883), Director Engineering (00884), Director HSE (00885), Director Logistics (00886), Director Procurement (00888), Director Finance (00889), Director Projects (00890), Director Project (00895)
- Contract subsections: Pre-award (00425), Post-award (00435)
- Developer subsections: Developer (00873), Sales (00875)

## Solution Provided

I have created a comprehensive SQL script that will:

1. **Add Email Management (03010) as a child** to all the sections listed above
2. **Add Document Control (00900) as a child** to all the sections listed above
3. **Use appropriate display_order values** (10 for Email Management, 11 for Document Control)
4. **Handle conflicts gracefully** using `ON CONFLICT DO NOTHING` to prevent duplicate entries
5. **Maintain data integrity** by copying sector_id and organization_id from parent pages

## Files Created

1. **`sql/fix_accordion_relationships_analysis.sql`** - Detailed analysis of the issues
2. **`sql/fix_accordion_relationships_complete.sql`** - Complete SQL script to fix all relationships

## Instructions for Execution

### Step 1: Review the SQL Script
Before executing, review the file `sql/fix_accordion_relationships_complete.sql` to ensure it matches your requirements.

### Step 2: Execute the SQL Script
Run the following command in your PostgreSQL database:

```bash
psql -h your-host -U your-username -d your-database -f sql/fix_accordion_relationships_complete.sql
```

Or execute the SQL directly in your database management tool.

### Step 3: Verify the Results
After execution, you can verify the relationships were created by running:

```sql
-- Check Email Management relationships
SELECT p1.page_prefix as parent_prefix, p1.page_name as parent_name, 
       p2.page_prefix as child_prefix, p2.page_name as child_name,
       p2.display_order
FROM pages p1 
JOIN pages p2 ON p1.page_id = p2.parent_page_id 
WHERE p2.page_prefix = '03010'
ORDER BY p1.page_prefix;

-- Check Document Control relationships  
SELECT p1.page_prefix as parent_prefix, p1.page_name as parent_name,
       p2.page_prefix as child_prefix, p2.page_name as child_name,
       p2.display_order
FROM pages p1 
JOIN pages p2 ON p1.page_id = p2.parent_page_id 
WHERE p2.page_prefix = '00900'
ORDER BY p1.page_prefix;
```

### Step 4: Test the Accordion Menu
After executing the SQL script:
1. Rebuild and serve the application
2. Navigate to any of the affected sections
3. Verify that "Email Management" and "Document Control" links now appear in the accordion menu

## Expected Results

After executing this SQL script, the accordion menu should display the correct hierarchical structure with Email Management and Document Control links appearing under all appropriate parent sections, matching the structure shown in the UI mappings and the provided images.

## Safety Features

- Uses `BEGIN` and `COMMIT` for transaction safety
- Includes `ON CONFLICT DO NOTHING` to prevent duplicate entries
- Preserves existing data integrity
- Can be safely re-run if needed

## Notes

- The script creates new page entries rather than updating existing ones
- Each Email Management and Document Control entry will have its own unique page_id
- The parent_page_id relationships establish the accordion hierarchy
- Display order values ensure proper ordering within each section
