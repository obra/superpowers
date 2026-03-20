# 📊 Schema Part 3: Tables 287-429 (Q-Z alphabetically)

**Database schema documentation for Construct AI - Part 3 of 3.**

## 📋 Overview

This document contains detailed schema information for tables 287-429 (alphabetically ordered).

## 📊 Part Statistics

- **Tables in Part**: 143
- **Total Tables**: 461
- **Generated**: 2026-03-12T03:45:30.579Z

## 📖 Table Documentation

### 287. `organisations_backup`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✓ | - |
| name | string | character varying | ✓ | - |
| sector_id | string | uuid | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| is_template | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| uuid | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 288. `organization_collaborations`

**Description:** Defines collaborations between organizations for cross-organizational accordion sharing

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| primary_organization_id | string | uuid | ✗ | The organization that owns the primary accordion structure

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| collaborating_organization_id | string | uuid | ✗ | The organization that collaborates with the primary organization

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| shared_sections | array | text[] | ✓ | Array of section IDs that are shared between organizations |
| agent_sharing_permissions | array | text[] | ✓ | Array of agent IDs that can be shared between organizations |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| primary_org_supabase_config | unknown | jsonb | ✓ | Supabase configuration for the primary organization (cached for performance) |
| context_mapping | unknown | jsonb | ✓ | Mapping of sections to database contexts for this collaboration |
| page_precedence | string | text | ✓ | Determines which organization's pages take precedence when there are conflicts: 'host' or 'collaborator' |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 289. `organization_db_configs`

**Description:** View of organizations with valid Supabase database configurations for multi-database context switching

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✓ | - |
| supabase_url | string | text | ✓ | - |
| supabase_anon_key | string | text | ✓ | - |
| supabase_service_key | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

### 290. `organization_users`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✗ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| discipline_id | string | uuid | ✗ | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| role | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

### 291. `organizations`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| name | string | character varying | ✗ | - |
| sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| is_active | boolean | boolean | ✓ | - |
| is_template | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| supabase_url | string | text | ✓ | Supabase project URL for this organization |
| supabase_anon_key | string | text | ✓ | Supabase anonymous key for this organization |
| supabase_service_key | string | text | ✓ | Supabase service key for this organization (server-side operations) |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 292. `page_permissions`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| page_path | string | text | ✗ | - |
| role_id | integer | integer | ✗ | Note:
This is a Foreign Key to `role_definitions.id`.<fk table='role_definitions' column='id'/> |
| has_access | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | text | ✓ | - |
| updated_by | string | text | ✓ | - |

---

### 293. `pages`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 20

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| page_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| page_prefix | string | character varying | ✗ | Page prefix - up to 6 characters (e.g., 00100, E00200, D00300) |
| page_name | string | character varying | ✗ | - |
| page_slug | string | character varying | ✗ | - |
| sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| organization_id | string | uuid | ✓ | UUID of the organization this page belongs to (references organizations.id)

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organisation_name | string | character varying | ✓ | - |
| sector_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |
| display_order | integer | integer | ✓ | - |
| parent_page_id | string | uuid | ✓ | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| organisation_id | string | uuid | ✓ | DEPRECATED: Contains sector UUID - use sector_uuid instead

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| sector_uuid | string | uuid | ✓ | UUID of the sector for this page

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| is_active | boolean | boolean | ✓ | Whether this page is active |
| hierarchy_level | integer | integer | ✓ | Level in the hierarchy (0 = top level, 1 = subsection, etc.) |
| is_standard_link | boolean | boolean | ✓ | Whether this is a standard link (e.g., All Documents, Email Management) |
| is_virtual | boolean | boolean | ✓ | Whether this is a virtual page (not directly linked to a folder) |
| organisation_ids | array | text[] | ✓ | Array of organization IDs that this page belongs to - supports multi-organization access control |
| page_type | string | text | ✓ | Page type according to Page Implementation Procedure (discipline_pages, data_management, workflow_processing, etc.) |

---

### 294. `pages_directors_backup_20250726`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| page_id | string | uuid | ✓ | - |
| page_prefix | string | character varying | ✓ | - |
| page_name | string | character varying | ✓ | - |
| page_slug | string | character varying | ✓ | - |
| sector_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| organisation_name | string | character varying | ✓ | - |
| sector_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| display_order | integer | integer | ✓ | - |
| parent_page_id | string | uuid | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| sector_uuid | string | uuid | ✓ | - |
| is_active | boolean | boolean | ✓ | - |

---

### 295. `pages_with_clear_columns`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| page_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| page_prefix | string | character varying | ✓ | - |
| page_name | string | character varying | ✓ | - |
| page_slug | string | character varying | ✓ | - |
| sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| sector_uuid | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| old_sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organisation_name | string | character varying | ✓ | - |
| sector_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| display_order | integer | integer | ✓ | - |
| parent_page_id | string | uuid | ✓ | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| data_consistency | string | text | ✓ | - |

---

### 296. `pages_with_organization_mapping`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| page_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| page_prefix | string | character varying | ✓ | - |
| page_name | string | character varying | ✓ | - |
| page_slug | string | character varying | ✓ | - |
| sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| sector_uuid | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| old_sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organisation_name | string | character varying | ✓ | - |
| sector_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| display_order | integer | integer | ✓ | - |
| parent_page_id | string | uuid | ✓ | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| organization_name | string | character varying | ✓ | - |
| sector_name_clear | string | character varying | ✓ | - |

---

### 297. `path_configurations`

**Description:** Template configurations for generating document storage paths per organization

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| name | string | text | ✗ | - |
| components | unknown | jsonb | ✗ | JSON array defining path structure with placeholders for dynamic values |
| is_default | boolean | boolean | ✓ | Whether this is the default path configuration for the organization |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 298. `performance_alerts`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| alert_type | string | text | ✗ | - |
| severity | string | text | ✗ | - |
| title | string | text | ✗ | - |
| description | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✗ | - |
| discipline_code | string | text | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| resolved_at | string | timestamp with time zone | ✓ | - |
| resolved_by | string | uuid | ✓ | - |

---

### 299. `performance_metrics`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| metric_type | string | text | ✗ | - |
| value | number | numeric | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| user_id | string | uuid | ✓ | - |
| discipline_code | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 300. `personnel_records`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| employee_id | string | character varying | ✓ | - |
| department | string | character varying | ✓ | - |
| position | string | character varying | ✓ | - |
| hire_date | string | date | ✓ | - |
| termination_date | string | date | ✓ | - |
| manager_id | string | uuid | ✓ | - |
| salary | number | numeric | ✓ | - |
| employment_type | string | character varying | ✓ | - |
| location | string | character varying | ✓ | - |
| phone | string | character varying | ✓ | - |
| emergency_contact_name | string | character varying | ✓ | - |
| emergency_contact_phone | string | character varying | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 301. `petty_cash`

**Description:** Petty cash reimbursement requests with approval workflow

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 21

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | text | ✗ | Unique identifier for petty cash request

Note:
This is a Primary Key.<pk/> |
| project_id | string | text | ✓ | Associated project identifier |
| user_id | string | uuid | ✓ | User who submitted the request

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| date | string | date | ✗ | Date when the expense occurred |
| amount | number | numeric | ✗ | Amount in local currency (ZAR) |
| category | string | character varying | ✗ | Expense category for reporting |
| description | string | text | ✗ | Detailed description of the expense |
| receipt_url | string | text | ✓ | URL to uploaded receipt document |
| receipt_filename | string | character varying | ✓ | - |
| status | string | character varying | ✓ | Current approval status of the request |
| submitted_at | string | timestamp with time zone | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| rejected_at | string | timestamp with time zone | ✓ | - |
| approver_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| rejection_reason | string | text | ✓ | Reason provided when request is rejected |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| project_name | string | character varying | ✓ | - |
| user_name | string | character varying | ✓ | - |
| phase_id | string | uuid | ✓ | References project_phases table, defaults to FEED phase when not provided

Note:
This is a Foreign Key to `project_phases.id`.<fk table='project_phases' column='id'/> |
| organization_id | string | uuid | ✓ | - |

---

### 302. `ports`

**Description:** Reference table for ports and terminals

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 21

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| port_code | string | character varying | ✗ | - |
| port_name | string | character varying | ✗ | - |
| country_code | string | character varying | ✓ | - |
| country_name | string | character varying | ✓ | - |
| latitude | number | numeric | ✓ | - |
| longitude | number | numeric | ✓ | - |
| time_zone | string | character varying | ✓ | - |
| port_type | string | character varying | ✓ | - |
| facilities | array | text[] | ✓ | - |
| max_vessel_length | number | numeric | ✓ | - |
| max_vessel_beam | number | numeric | ✓ | - |
| max_draft | number | numeric | ✓ | - |
| working_hours | string | character varying | ✓ | - |
| customs_hours | string | character varying | ✓ | - |
| services | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 303. `processing_statistics`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| organization_name | string | text | ✓ | - |
| processing_type | string | text | ✓ | - |
| processing_status | string | text | ✓ | - |
| file_type | string | text | ✓ | - |
| total_count | integer | bigint | ✓ | - |
| avg_processing_time | number | numeric | ✓ | - |
| avg_extracted_fields | number | numeric | ✓ | - |
| earliest_entry | string | timestamp with time zone | ✓ | - |
| latest_entry | string | timestamp with time zone | ✓ | - |

---

### 304. `procurement_approvals`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | uuid | ✗ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| approver_role | string | character varying | ✗ | - |
| user_id | string | uuid | ✓ | - |
| status | string | character varying | ✓ | - |
| approval_level | integer | integer | ✗ | - |
| comments | string | text | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 305. `procurement_categories`

**Description:** Hierarchical procurement categories system with i18n support (English/French)

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| level1_code | string | character varying | ✓ | Main category code (A-M) as defined in Excel |
| level1_name | string | character varying | ✓ | English name for main category |
| level1_name_fr | string | character varying | ✓ | French translation for main category |
| level2_code | string | character varying | ✓ | Subcategory code (e.g., A00, B01, C06) |
| level2_name | string | character varying | ✓ | English name for subcategory |
| level2_name_fr | string | character varying | ✓ | French translation for subcategory |
| level3_code | string | character varying | ✓ | Detailed category code (e.g., C0601 for Engine Oil) |
| level3_name | string | character varying | ✓ | English name for detailed category |
| level3_name_fr | string | character varying | ✓ | French translation for detailed category |
| is_active | boolean | boolean | ✓ | - |
| display_order | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 306. `procurement_contributions`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | uuid | ✗ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| appendix_key | string | character varying | ✗ | - |
| discipline_id | string | uuid | ✗ | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| user_id | string | uuid | ✗ | - |
| content | string | text | ✓ | - |
| status | string | character varying | ✓ | - |
| assigned_at | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 307. `procurement_order_documents`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | uuid | ✗ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| document_id | string | uuid | ✗ | - |
| document_type | string | character varying | ✗ | - |
| reference_type | string | character varying | ✗ | - |
| project_phase | string | character varying | ✓ | - |
| procurement_category | string | character varying | ✓ | - |
| added_at | string | timestamp with time zone | ✓ | - |
| added_by | string | uuid | ✗ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| notes | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |
| template_reference_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| appendix_order | integer | integer | ✓ | - |
| generated_html | string | text | ✓ | - |
| version_number | integer | integer | ✓ | - |

---

### 308. `procurement_orders`

**Description:** Dedicated table for actual procurement orders (separate from reusable templates)

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 43

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| order_number | string | character varying | ✓ | Auto-generated unique order number (PO-2025-001, SO-2025-001, WO-2025-001) |
| order_type | string | character varying | ✗ | Type of procurement order: purchase_order, service_order, work_order |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| department | string | character varying | ✓ | - |
| priority | string | character varying | ✓ | - |
| estimated_value | number | numeric | ✓ | - |
| currency | string | character varying | ✓ | - |
| supplier_name | string | character varying | ✓ | - |
| supplier_contact | string | character varying | ✓ | - |
| project_id | string | uuid | ✓ | Reference to projects table for project context awareness

Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| project_phase | string | character varying | ✓ | Current project phase for document filtering and suggestions |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| linked_documents | unknown | jsonb | ✓ | JSON array of linked documents with metadata for document integration feature |
| approval_status | string | character varying | ✓ | - |
| delivery_date | string | date | ✓ | - |
| special_requirements | string | text | ✓ | - |
| created_by | string | uuid | ✗ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| sow_id | string | uuid | ✓ | - |
| sow_template_id | string | uuid | ✓ | Reference to the SOW template used for this order

Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| appendix_a_content | string | text | ✓ | - |
| appendix_b_content | string | text | ✓ | - |
| appendix_c_content | string | text | ✓ | - |
| appendix_d_content | string | text | ✓ | - |
| appendix_e_content | string | text | ✓ | - |
| appendix_f_content | string | text | ✓ | - |
| approval_cover_content | string | text | ✓ | - |
| main_order_content | string | text | ✓ | - |
| discipline_assignments | unknown | jsonb | ✓ | JSON mapping of disciplines to SOW appendices |
| contribution_status | unknown | jsonb | ✓ | - |
| approval_matrix | unknown | jsonb | ✓ | JSON object defining approval workflow matrix |
| approval_routing_type | string | character varying | ✓ | - |
| approval_config | unknown | jsonb | ✓ | JSON configuration for approval workflow settings |
| user_assignments | unknown | jsonb | ✓ | JSON mapping of users to specific appendix sections |
| task_sequence | unknown | jsonb | ✓ | - |
| template_variation | string | character varying | ✓ | - |
| sequence_override_id | string | uuid | ✓ | - |
| estimated_completion_time | string | interval | ✓ | - |
| sequence_execution_id | string | uuid | ✓ | - |

---

### 309. `procurement_signatures`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| contract_id | string | uuid | ✓ | - |
| signature_document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `signature_documents.id`.<fk table='signature_documents' column='id'/> |
| procurement_phase | string | character varying | ✗ | - |
| procurement_stage | string | character varying | ✗ | - |
| required_signatories | integer | integer | ✗ | - |
| collected_signatures | integer | integer | ✓ | - |
| deadline | string | timestamp with time zone | ✓ | - |
| status | string | character varying | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| expired_at | string | timestamp with time zone | ✓ | - |
| initiated_by | string | uuid | ✓ | - |
| business_case | string | text | ✓ | - |
| special_conditions | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| created_by | string | uuid | ✓ | - |

---

### 310. `procurement_templates`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 47

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✓ | - |
| organization_id | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| template_name | string | text | ✗ | - |
| template_description | string | text | ✓ | - |
| template_type | string | text | ✗ | - |
| template_category | string | text | ✓ | - |
| level1_code | string | text | ✓ | - |
| level2_code | string | text | ✓ | - |
| level3_code | string | text | ✓ | - |
| template_content | unknown | jsonb | ✓ | - |
| field_protection | unknown | jsonb | ✓ | - |
| protection_enabled | boolean | boolean | ✓ | - |
| is_latest | boolean | boolean | ✓ | - |
| version_number | integer | integer | ✓ | - |
| approval_status | string | text | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| related_documents | unknown | jsonb | ✓ | - |
| compliance_requirements | unknown | jsonb | ✓ | - |
| lifecycle_stage | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| access_level | string | character varying | ✓ | - |
| discipline | string | character varying | ✓ | - |
| allowed_roles | unknown | jsonb | ✓ | - |
| component_type | string | character varying | ✓ | - |
| mandatory | boolean | boolean | ✓ | - |
| approval_workflow | unknown | jsonb | ✓ | JSONB containing approval workflow configuration including required approvals, hierarchy, and notification settings |
| html_content | string | text | ✓ | Generated HTML content from template fields for document processing. Indexed using MD5 hash for performance. |
| document_type | string | text | ✓ | Document type copied from governance template (e.g., PO, Contract, SOW) |
| document_type_label | string | text | ✓ | Human-readable label for the document type |
| discipline_code | string | text | ✓ | Discipline code (e.g., 00850 for Civil Engineering) for discipline-aware template filtering |
| appendix_letter | string | character | ✓ | - |
| sow_integration_enabled | boolean | boolean | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| source_governance_template_id | string | uuid | ✓ | - |
| source_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| source_project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| populated_data | unknown | jsonb | ✓ | - |
| variable_fields | unknown | jsonb | ✓ | - |
| derivation_metadata | unknown | jsonb | ✓ | - |
| derivation_confidence | number | numeric | ✓ | - |

---

### 311. `procurement_templates_backup_20251121`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 41

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | - |
| document_id | string | uuid | ✓ | - |
| organization_id | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| template_name | string | text | ✓ | - |
| template_description | string | text | ✓ | - |
| template_type | string | text | ✓ | - |
| template_category | string | text | ✓ | - |
| level1_code | string | text | ✓ | - |
| level2_code | string | text | ✓ | - |
| level3_code | string | text | ✓ | - |
| template_content | unknown | jsonb | ✓ | - |
| field_protection | unknown | jsonb | ✓ | - |
| protection_enabled | boolean | boolean | ✓ | - |
| is_latest | boolean | boolean | ✓ | - |
| version_number | integer | integer | ✓ | - |
| approval_status | string | text | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| related_documents | unknown | jsonb | ✓ | - |
| compliance_requirements | unknown | jsonb | ✓ | - |
| lifecycle_stage | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| access_level | string | character varying | ✓ | - |
| discipline | string | character varying | ✓ | - |
| allowed_roles | unknown | jsonb | ✓ | - |
| component_type | string | character varying | ✓ | - |
| mandatory | boolean | boolean | ✓ | - |
| approval_workflow | unknown | jsonb | ✓ | - |
| html_content | string | text | ✓ | - |
| document_type | string | text | ✓ | - |
| document_type_label | string | text | ✓ | - |
| discipline_code | string | text | ✓ | - |
| appendix_letter | string | character | ✓ | - |
| sow_integration_enabled | boolean | boolean | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| source_governance_template_id | string | uuid | ✓ | - |

---

### 312. `progress_logs`

**Description:** Comprehensive audit trail of all workflow progress updates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| order_id | string | uuid | ✗ | - |
| progress_data | unknown | jsonb | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |
| agent_id | string | character varying | ✓ | - |
| operation | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| message | string | text | ✓ | - |

---

### 313. `project_engineering_templates`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✗ | Note:
This is a Foreign Key to `master_engineering_templates.id`.<fk table='master_engineering_templates' column='id'/> |
| project_id | string | uuid | ✗ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| custom_name | string | character varying | ✓ | - |
| custom_description | string | text | ✓ | - |
| custom_html_content | string | text | ✓ | - |
| custom_json_content | unknown | jsonb | ✓ | - |
| is_required | boolean | boolean | ✓ | - |
| required_by | string | date | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| completed_by | string | uuid | ✓ | - |
| project_approval_status | string | character varying | ✓ | - |
| project_approved_by | string | uuid | ✓ | - |
| project_approved_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| company_id | string | uuid | ✗ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 314. `project_permissions`

**Description:** User-based project access control with phase-level permissions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| project_id | string | uuid | ✗ | Project ID reference |
| user_id | string | character varying | ✗ | User ID (UUID as text) |
| has_access | boolean | boolean | ✗ | Whether user has project access |
| phases_access | unknown | jsonb | ✓ | Array of accessible phase IDs |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | text | ✓ | - |
| updated_by | string | text | ✓ | - |

---

### 315. `project_phase_assignments`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| phase_id | string | uuid | ✓ | Note:
This is a Foreign Key to `project_phases.id`.<fk table='project_phases' column='id'/> |
| custom_name | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| start_date | string | date | ✓ | - |
| end_date | string | date | ✓ | - |
| sort_order | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 316. `project_phases`

**Description:** Standard project phases used across all projects

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Unique identifier for the project phase

Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | Human-readable name of the project phase |
| description | string | text | ✓ | Detailed description of the project phase |
| phase_code | string | character varying | ✓ | Unique code for the project phase |
| sort_order | integer | integer | ✓ | Order in which phases should be displayed/executed |
| is_active | boolean | boolean | ✓ | Whether this phase is currently active/available for use |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 317. `project_procurement_templates`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 51

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✓ | - |
| organization_id | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| template_name | string | text | ✗ | - |
| template_description | string | text | ✓ | - |
| template_type | string | text | ✗ | - |
| template_category | string | text | ✓ | - |
| level1_code | string | text | ✓ | - |
| level2_code | string | text | ✓ | - |
| level3_code | string | text | ✓ | - |
| template_content | unknown | jsonb | ✓ | - |
| field_protection | unknown | jsonb | ✓ | - |
| protection_enabled | boolean | boolean | ✓ | - |
| is_latest | boolean | boolean | ✓ | - |
| version_number | integer | integer | ✓ | - |
| approval_status | string | text | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| related_documents | unknown | jsonb | ✓ | - |
| compliance_requirements | unknown | jsonb | ✓ | - |
| lifecycle_stage | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| access_level | string | character varying | ✓ | - |
| discipline | string | character varying | ✓ | - |
| allowed_roles | unknown | jsonb | ✓ | - |
| component_type | string | character varying | ✓ | - |
| mandatory | boolean | boolean | ✓ | - |
| project_id | string | uuid | ✗ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| prepared_by | string | uuid | ✓ | - |
| prepared_at | string | timestamp with time zone | ✓ | - |
| template_scope | string | text | ✓ | - |
| approval_workflow | unknown | jsonb | ✓ | - |
| html_content | string | text | ✓ | - |
| document_type | string | text | ✓ | - |
| document_type_label | string | text | ✓ | - |
| discipline_code | string | text | ✓ | - |
| appendix_letter | string | character | ✓ | - |
| sow_integration_enabled | boolean | boolean | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| source_governance_template_id | string | uuid | ✓ | - |
| source_order_id | string | uuid | ✓ | - |
| source_project_id | string | uuid | ✓ | - |
| populated_data | unknown | jsonb | ✓ | - |
| variable_fields | unknown | jsonb | ✓ | - |
| derivation_metadata | unknown | jsonb | ✓ | - |
| derivation_confidence | number | numeric | ✓ | - |

---

### 318. `project_template_preparation`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| project_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| prepared_at | string | timestamp with time zone | ✓ | - |
| prepared_by | string | uuid | ✓ | - |
| disciplines_prepared | array | text[] | ✓ | - |
| total_templates | integer | integer | ✓ | - |
| status | string | text | ✓ | - |
| agent_notifications_sent | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 319. `project_templates`

**Description:** Project-specific template copies with auto-populated data from SOW

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 30

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| project_id | string | uuid | ✗ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| master_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `master_templates.id`.<fk table='master_templates' column='id'/> |
| template_name | string | character varying | ✗ | - |
| template_type | string | character varying | ✗ | - |
| category | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| content | unknown | jsonb | ✓ | - |
| populated_data | unknown | jsonb | ✓ | - |
| sow_reference | string | uuid | ✓ | Note:
This is a Foreign Key to `scope_of_work.id`.<fk table='scope_of_work' column='id'/> |
| auto_populated_at | string | timestamp with time zone | ✓ | - |
| reviewed_at | string | timestamp with time zone | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| executed_at | string | timestamp with time zone | ✓ | - |
| total_value | number | numeric | ✓ | - |
| currency | string | character varying | ✓ | - |
| vendor_id | string | uuid | ✓ | - |
| contract_number | string | character varying | ✓ | - |
| notes | string | text | ✓ | - |
| priority | string | character varying | ✓ | - |
| requires_technical_review | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| form_template_id | string | uuid | ✓ | - |
| customized_content | unknown | jsonb | ✓ | - |
| deployment_rules | unknown | jsonb | ✓ | - |
| deployed_to_doc_control | boolean | boolean | ✓ | - |
| deployed_at | string | timestamp without time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |

---

### 320. `projects`

**Description:** Projects belonging to companies

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| company_id | integer | integer | ✓ | - |
| name | string | character varying | ✗ | - |
| project_type | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| project_number | string | text | ✓ | - |
| project_description | string | text | ✓ | - |
| site_location | string | text | ✓ | - |
| delivery_date | string | date | ✓ | - |
| completion_date | string | date | ✓ | - |
| cost_center | string | text | ✓ | - |
| budget_code | string | text | ✓ | - |
| workflow_status | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 321. `prompt_usage_audit`

**Description:** Detailed audit trail of prompt usage by scripts and services for analytics and debugging

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| prompt_id | string | uuid | ✗ | Note:
This is a Foreign Key to `prompts.id`.<fk table='prompts' column='id'/> |
| script_name | string | text | ✗ | - |
| operation_type | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| response_time_ms | integer | integer | ✓ | - |
| success | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 322. `prompt_usage_summary`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| prompt_name | string | text | ✓ | - |
| prompt_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| is_active | boolean | boolean | ✓ | - |
| total_calls | integer | bigint | ✓ | - |
| successful_calls | integer | bigint | ✓ | - |
| avg_response_time_ms | number | numeric | ✓ | - |
| last_used | string | timestamp with time zone | ✓ | - |
| unique_scripts | integer | bigint | ✓ | - |
| scripts_using | string | text | ✓ | - |

---

### 323. `prompts`

**Description:** Stores AI prompts and templates used throughout the system for various AI-powered features

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 31

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Unique identifier for the prompt

Note:
This is a Primary Key.<pk/> |
| name | string | text | ✗ | Human-readable name for the prompt |
| content | string | text | ✗ | The actual prompt text/template |
| description | string | text | ✓ | Brief description of the prompt purpose |
| organization_id | string | uuid | ✓ | Associated organization (optional) |
| sector_id | string | uuid | ✓ | Associated sector (optional) |
| type | string | text | ✓ | Type of prompt (coding, analysis, chat, etc.) |
| category | string | text | ✓ | Category of prompt (development, legal, etc.) |
| tags | array | text[] | ✓ | Array of tags for categorization and search |
| is_active | boolean | boolean | ✓ | Whether the prompt is currently active/available |
| metadata | unknown | jsonb | ✓ | Additional metadata stored as JSON |
| created_at | string | timestamp with time zone | ✓ | Timestamp when prompt was created |
| updated_at | string | timestamp with time zone | ✓ | Timestamp when prompt was last updated |
| key | string | text | ✓ | - |
| role_type | string | text | ✓ | Type of prompt: system (dev-only) or user (accessible to end users) |
| access_permissions | unknown | jsonb | ✓ | JSON object defining granular access permissions for different user roles |
| created_by | string | text | ✓ | User ID of the prompt creator (for ownership tracking) |
| cross_reference_id | string | uuid | ✓ | - |
| pages_used | array | text[] | ✓ | - |
| date_added | string | timestamp with time zone | ✓ | - |
| date_modified | string | timestamp with time zone | ✓ | - |
| script_usage | unknown | jsonb | ✓ | JSONB tracking which scripts/services use this prompt with usage statistics |
| usage_statistics | unknown | jsonb | ✓ | Aggregated metrics including total usage, success rates, and performance data |
| workflow_context | unknown | jsonb | ✓ | Workflow integration context including triggers, dependencies, and outputs |
| performance_requirements | unknown | jsonb | ✓ | Performance expectations including accuracy targets and processing time limits |
| agent_capabilities | unknown | jsonb | ✓ | Agent capabilities including supported disciplines and document types |
| integration_points | unknown | jsonb | ✓ | System integration points including pages, APIs, and databases |
| success_criteria | unknown | jsonb | ✓ | Success criteria and quality metrics for prompt evaluation |
| prompt_version | string | text | ✓ | Version identifier for prompt versioning and tracking |
| last_tested | string | timestamp with time zone | ✓ | Timestamp of last testing/validation of the prompt |
| test_results | unknown | jsonb | ✓ | Latest test results and performance metrics |

---

### 324. `prompts_enhanced`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 48

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| name | string | text | ✓ | - |
| content | string | text | ✓ | - |
| description | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| sector_id | string | uuid | ✓ | - |
| type | string | text | ✓ | - |
| category | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| key | string | text | ✓ | - |
| role_type | string | text | ✓ | - |
| access_permissions | unknown | jsonb | ✓ | - |
| created_by | string | text | ✓ | - |
| cross_reference_id | string | uuid | ✓ | - |
| pages_used | array | text[] | ✓ | - |
| date_added | string | timestamp with time zone | ✓ | - |
| date_modified | string | timestamp with time zone | ✓ | - |
| script_usage | unknown | jsonb | ✓ | - |
| usage_statistics | unknown | jsonb | ✓ | - |
| workflow_context | unknown | jsonb | ✓ | - |
| performance_requirements | unknown | jsonb | ✓ | - |
| agent_capabilities | unknown | jsonb | ✓ | - |
| integration_points | unknown | jsonb | ✓ | - |
| success_criteria | unknown | jsonb | ✓ | - |
| prompt_version | string | text | ✓ | - |
| last_tested | string | timestamp with time zone | ✓ | - |
| test_results | unknown | jsonb | ✓ | - |
| workflow_triggers | string | text | ✓ | - |
| workflow_dependencies | string | text | ✓ | - |
| workflow_outputs | string | text | ✓ | - |
| target_accuracy | number | numeric | ✓ | - |
| max_processing_time | integer | integer | ✓ | - |
| expected_field_count | integer | integer | ✓ | - |
| supported_disciplines | string | text | ✓ | - |
| supported_document_types | string | text | ✓ | - |
| supports_multi_agent | boolean | boolean | ✓ | - |
| integrated_pages | string | text | ✓ | - |
| integrated_apis | string | text | ✓ | - |
| integrated_databases | string | text | ✓ | - |
| accuracy_threshold | number | numeric | ✓ | - |
| quality_score_min | number | numeric | ✓ | - |
| last_success_rate | number | numeric | ✓ | - |
| avg_processing_time | number | numeric | ✓ | - |
| total_tests_run | integer | integer | ✓ | - |

---

### 325. `prompts_with_rbac`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 22

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| name | string | text | ✓ | - |
| content | string | text | ✓ | - |
| description | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| sector_id | string | uuid | ✓ | - |
| type | string | text | ✓ | - |
| category | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| key | string | text | ✓ | - |
| role_type | string | text | ✓ | - |
| access_permissions | unknown | jsonb | ✓ | - |
| created_by | string | text | ✓ | - |
| role_description | string | text | ✓ | - |
| dev_can_access | boolean | boolean | ✓ | - |
| user_can_edit | boolean | boolean | ✓ | - |
| user_can_create | boolean | boolean | ✓ | - |
| user_can_delete | boolean | boolean | ✓ | - |

---

### 326. `push_notifications`

**Description:** Stores push notifications sent to users about workflow updates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| order_id | string | uuid | ✓ | - |
| title | string | character varying | ✗ | - |
| body | string | text | ✗ | - |
| notification_type | string | character varying | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| read | boolean | boolean | ✓ | - |
| read_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 327. `quality_checks`

**Description:** Quality inspection and validation tasks across projects

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| check_type | string | character varying | ✓ | - |
| severity | string | character varying | ✓ | - |
| location | string | text | ✓ | - |
| status | string | character varying | ✓ | - |
| assigned_to | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| due_date | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |

---

### 328. `rate_limits`

**Description:** Rate limiting data to prevent abuse and ensure fair usage

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| api_config_id | string | uuid | ✓ | - |
| discipline_code | string | text | ✓ | - |
| limit_type | string | text | ✗ | - |
| request_count | integer | integer | ✗ | - |
| limit_value | integer | integer | ✗ | - |
| window_start | string | timestamp with time zone | ✗ | - |
| window_end | string | timestamp with time zone | ✗ | - |
| blocked_until | string | timestamp with time zone | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |

---

### 329. `recent_audit_activity`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| user_email | string | text | ✓ | - |
| action | string | text | ✓ | - |
| resource_type | string | text | ✓ | - |
| resource_id | string | text | ✓ | - |
| discipline_code | string | text | ✓ | - |
| ip_address | string | inet | ✓ | - |
| user_agent | string | text | ✓ | - |
| success | boolean | boolean | ✓ | - |
| error_message | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 330. `record _manager`

**Description:** to manage records within the database

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 4

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| created_at | string | timestamp with time zone | ✗ | - |
| group_id | string | text | ✓ | - |
| source_id_key | string | text | ✓ | - |

---

### 331. `resource_documentation`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| resource_id | string | uuid | ✗ | - |
| resource_type | string | public.resource_type | ✗ | - |
| storage_service | string | public.storage_service_type | ✗ | - |
| storage_url | string | text | ✗ | - |
| document_id | string | character varying | ✗ | - |
| sections | unknown | jsonb | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 332. `resource_prompts`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 5

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| resource_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| resource_type | string | public.resource_type | ✗ | Note:
This is a Primary Key.<pk/> |
| prompt_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `prompts.id`.<fk table='prompts' column='id'/> |
| applicable_sections | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 333. `risk_assessments`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| risk_id | string | character varying | ✗ | - |
| inspection_id | string | character varying | ✗ | Note:
This is a Foreign Key to `inspections.inspection_id`.<fk table='inspections' column='inspection_id'/> |
| project_id | string | character varying | ✗ | - |
| risk_level | string | character varying | ✗ | - |
| probability | number | numeric | ✓ | - |
| impact | number | numeric | ✓ | - |
| description | string | text | ✓ | - |
| mitigation_plan | string | text | ✓ | - |
| assigned_to | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| review_date | string | date | ✓ | - |
| closed_date | string | date | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| created_by | string | character varying | ✓ | - |
| updated_by | string | character varying | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 334. `role_definitions`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| role_name | string | character varying | ✗ | - |
| permissions | unknown | jsonb | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| description | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |

---

### 335. `routing_notifications`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| workflow_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `document_routing_workflows.id`.<fk table='document_routing_workflows' column='id'/> |
| routing_step_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `workflow_routing_steps.id`.<fk table='workflow_routing_steps' column='id'/> |
| recipient_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| recipient_role | string | character varying | ✓ | - |
| notification_type | string | character varying | ✗ | - |
| notification_priority | string | character varying | ✓ | - |
| subject | string | character varying | ✓ | - |
| message | string | text | ✓ | - |
| notification_data | unknown | jsonb | ✓ | - |
| sent | boolean | boolean | ✓ | - |
| sent_at | string | timestamp with time zone | ✓ | - |
| read_at | string | timestamp with time zone | ✓ | - |
| response_url | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 336. `routing_step_actions`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| routing_step_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `workflow_routing_steps.id`.<fk table='workflow_routing_steps' column='id'/> |
| participant_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| participant_role | string | character varying | ✓ | - |
| action_type | string | character varying | ✗ | - |
| action_status | string | character varying | ✓ | - |
| action_comment | string | text | ✓ | - |
| action_data | unknown | jsonb | ✓ | - |
| deadline | string | timestamp with time zone | ✓ | - |
| reminded_at | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 337. `routing_step_participants`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| step_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `routing_template_steps.id`.<fk table='routing_template_steps' column='id'/> |
| participant_type | string | character varying | ✗ | - |
| participant_identifier | string | character varying | ✓ | - |
| required | boolean | boolean | ✓ | - |
| notification_enabled | boolean | boolean | ✓ | - |
| notification_priority | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 338. `routing_template_steps`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `document_routing_templates.id`.<fk table='document_routing_templates' column='id'/> |
| step_order | integer | integer | ✗ | - |
| step_name | string | character varying | ✗ | - |
| step_description | string | text | ✓ | - |
| step_type | string | character varying | ✗ | - |
| routing_mode | string | character varying | ✗ | - |
| required_approvals | integer | integer | ✓ | - |
| deadline_hours | integer | integer | ✓ | - |
| escalate_after_hours | integer | integer | ✓ | - |
| escalate_to_role | string | character varying | ✓ | - |
| is_optional | boolean | boolean | ✓ | - |
| auto_advance | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 339. `safety_incidents`

**Description:** Safety incidents requiring investigation and resolution

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 17

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| incident_type | string | character varying | ✓ | - |
| severity | string | character varying | ✓ | - |
| location | string | text | ✓ | - |
| status | string | character varying | ✓ | - |
| assigned_to | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| reported_by | string | uuid | ✓ | - |
| incident_date | string | timestamp with time zone | ✓ | - |
| due_date | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |

---

### 340. `safety_template_categories`

**Description:** Categorization system for safety templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| category_code | string | character varying | ✗ | - |
| category_name | string | character varying | ✗ | - |
| category_description | string | text | ✓ | - |
| parent_category_id | string | uuid | ✓ | Note:
This is a Foreign Key to `safety_template_categories.id`.<fk table='safety_template_categories' column='id'/> |
| is_active | boolean | boolean | ✓ | - |
| sort_order | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 341. `safety_template_dependencies`

**Description:** Relationships and dependencies between safety templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| parent_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `safety_templates.id`.<fk table='safety_templates' column='id'/> |
| dependent_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `safety_templates.id`.<fk table='safety_templates' column='id'/> |
| dependency_type | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| applies_to_sites | array | text[] | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| valid_from | string | date | ✓ | - |
| valid_to | string | date | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 342. `safety_template_usage`

**Description:** Audit trail and analytics for safety template usage

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `safety_templates.id`.<fk table='safety_templates' column='id'/> |
| user_id | string | text | ✓ | - |
| action_type | string | character varying | ✗ | - |
| site_location | string | character varying | ✓ | - |
| contractor_name | string | character varying | ✓ | - |
| session_id | string | character varying | ✓ | - |
| user_agent | string | text | ✓ | - |
| ip_address | string | inet | ✓ | - |
| timestamp | string | timestamp with time zone | ✓ | - |

---

### 343. `safety_templates`

**Description:** Standardized HSE Safety Templates - HTML content in html_content TEXT, schema in content_schema JSONB

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 32

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_id | string | uuid | ✓ | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| template_name | string | character varying | ✗ | - |
| template_description | string | text | ✓ | - |
| template_type | string | character varying | ✗ | - |
| template_category | string | character varying | ✓ | - |
| template_content | unknown | jsonb | ✓ | DEPRECATED: Use html_content for HTML, content_metadata for structured data. Remove post-migration. |
| form_schema | unknown | jsonb | ✓ | - |
| html_content | string | text | ✓ | - |
| risk_level | string | character varying | ✓ | - |
| applicable_sites | array | text[] | ✓ | - |
| required_certifications | array | text[] | ✓ | - |
| review_frequency | string | interval | ✓ | - |
| status | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| approval_status | string | character varying | ✓ | - |
| version | string | character varying | ✓ | - |
| is_latest | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_at | string | timestamp with time zone | ✓ | - |
| approved_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approved_at | string | timestamp with time zone | ✓ | - |
| content_schema | unknown | jsonb | ✓ | - |
| content_metadata | unknown | jsonb | ✓ | - |
| document_type | string | text | ✓ | Document type copied from governance template (e.g., Risk Assessment, Safety Inspection, Incident Report) |
| document_type_label | string | text | ✓ | Human-readable label for the document type |
| organization_name | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| source_governance_template_id | string | uuid | ✓ | - |

---

### 344. `safety_templates_backup_20251121`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 32

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| discipline_id | string | uuid | ✓ | - |
| template_name | string | character varying | ✓ | - |
| template_description | string | text | ✓ | - |
| template_type | string | character varying | ✓ | - |
| template_category | string | character varying | ✓ | - |
| template_content | unknown | jsonb | ✓ | - |
| form_schema | unknown | jsonb | ✓ | - |
| html_content | string | text | ✓ | - |
| risk_level | string | character varying | ✓ | - |
| applicable_sites | array | text[] | ✓ | - |
| required_certifications | array | text[] | ✓ | - |
| review_frequency | string | interval | ✓ | - |
| status | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| approval_status | string | character varying | ✓ | - |
| version | string | character varying | ✓ | - |
| is_latest | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| content_schema | unknown | jsonb | ✓ | - |
| content_metadata | unknown | jsonb | ✓ | - |
| document_type | string | text | ✓ | - |
| document_type_label | string | text | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| source_governance_template_id | string | uuid | ✓ | - |

---

### 345. `schema_migrations`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 3

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| version | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| applied_at | string | timestamp with time zone | ✓ | - |
| description | string | text | ✓ | - |

---

### 346. `scope_of_work`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 22

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| status | string | character varying | ✓ | - |
| priority | string | character varying | ✓ | - |
| estimated_cost | number | numeric | ✓ | - |
| target_completion_date | string | date | ✓ | - |
| assigned_to | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| scope_type | string | character varying | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| additional_context | string | text | ✓ | - |
| project_specifications | string | text | ✓ | - |
| compliance_requirements | string | text | ✓ | - |
| reference_urls | string | text | ✓ | - |
| reference_documents | string | text | ✓ | - |
| content | string | text | ✓ | - |
| draft_saved | boolean | boolean | ✓ | - |
| category | string | character varying | ✓ | - |
| discipline_id | string | uuid | ✓ | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 347. `scope_of_work_relationships`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| scope_of_work_id | string | uuid | ✓ | - |
| related_document_id | string | uuid | ✓ | - |
| relationship_type | string | text | ✓ | - |
| procurement_code | string | text | ✓ | - |
| description | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 348. `section_hierarchy`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| parent_section_key | string | text | ✓ | Note:
This is a Foreign Key to `accordion_sections.section_key`.<fk table='accordion_sections' column='section_key'/> |
| child_section_key | string | text | ✓ | Note:
This is a Foreign Key to `accordion_sections.section_key`.<fk table='accordion_sections' column='section_key'/> |
| display_order | integer | integer | ✓ | - |
| is_virtual | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

### 349. `section_organization_mapping`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| section_key | string | character varying | ✗ | Note:
This is a Foreign Key to `accordion_sections.section_key`.<fk table='accordion_sections' column='section_key'/> |
| organization_id | string | uuid | ✗ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| is_visible | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 350. `section_pages`

**Description:** Maps pages to sections using section_key

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| section_key | string | character varying | ✗ | - |
| page_id | string | uuid | ✗ | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| display_order | integer | integer | ✗ | - |
| is_subsection | boolean | boolean | ✓ | - |
| parent_page_id | string | uuid | ✓ | Note:
This is a Foreign Key to `pages.page_id`.<fk table='pages' column='page_id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 351. `sections`

**Description:** Defines accordion sections with metadata, linked by section_key

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| section_key | string | character varying | ✗ | - |
| section_name | string | character varying | ✗ | - |
| section_description | string | text | ✓ | - |
| section_icon | string | character varying | ✓ | - |
| display_order | integer | integer | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 352. `sectors`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| sector_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| sector_name | string | character varying | ✗ | - |
| is_active | boolean | boolean | ✗ | - |
| page_number_prefix_start | integer | integer | ✗ | - |
| page_number_prefix_end | integer | integer | ✗ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |

---

### 353. `security_alerts`

**Description:** Security alerts and incidents requiring attention

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| alert_type | string | text | ✗ | - |
| severity | string | text | ✗ | - |
| title | string | text | ✗ | - |
| description | string | text | ✗ | - |
| user_id | string | uuid | ✓ | - |
| api_config_id | string | uuid | ✓ | - |
| ip_address | string | inet | ✓ | - |
| user_agent | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| acknowledged | boolean | boolean | ✗ | - |
| acknowledged_by | string | uuid | ✓ | - |
| acknowledged_at | string | timestamp with time zone | ✓ | - |
| resolved | boolean | boolean | ✗ | - |
| resolved_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |

---

### 354. `security_audit_log`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| audit_type | string | text | ✗ | - |
| audit_date | string | date | ✗ | - |
| results | unknown | jsonb | ✗ | - |
| execution_time | string | interval | ✓ | - |
| tables_scanned | integer | integer | ✓ | - |
| policies_found | integer | integer | ✓ | - |
| critical_issues | integer | integer | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |

---

### 355. `sequence_overrides`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| template_variation_id | string | uuid | ✓ | Note:
This is a Foreign Key to `template_variation_sequences.id`.<fk table='template_variation_sequences' column='id'/> |
| original_sequence | unknown | jsonb | ✗ | - |
| overridden_sequence | unknown | jsonb | ✗ | - |
| override_reason | string | text | ✗ | - |
| override_type | string | character varying | ✗ | - |
| overridden_by | string | uuid | ✓ | - |
| approval_status | string | character varying | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| approval_notes | string | text | ✓ | - |
| validation_results | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 356. `shipment_containers`

**Description:** Junction table linking shipments to containers

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| shipment_id | string | uuid | ✓ | Note:
This is a Foreign Key to `logistics_shipments.id`.<fk table='logistics_shipments' column='id'/> |
| container_id | string | uuid | ✓ | Note:
This is a Foreign Key to `containers.id`.<fk table='containers' column='id'/> |
| sequence_number | integer | integer | ✓ | - |
| loading_order | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 357. `signature_audit_trail`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| signature_document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `signature_documents.id`.<fk table='signature_documents' column='id'/> |
| signature_request_id | string | uuid | ✓ | Note:
This is a Foreign Key to `signature_requests.id`.<fk table='signature_requests' column='id'/> |
| action_type | string | character varying | ✗ | - |
| action_description | string | text | ✓ | - |
| actor_id | string | uuid | ✓ | - |
| actor_email | string | character varying | ✓ | - |
| actor_ip_address | string | inet | ✓ | - |
| actor_user_agent | string | text | ✓ | - |
| previous_status | string | character varying | ✓ | - |
| new_status | string | character varying | ✓ | - |
| additional_data | unknown | jsonb | ✓ | - |
| compliance_flags | unknown | jsonb | ✓ | - |
| blockchain_hash | string | character varying | ✓ | - |
| performed_at | string | timestamp with time zone | ✓ | - |

---

### 358. `signature_documents`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| documenso_document_id | string | character varying | ✗ | - |
| status | string | character varying | ✓ | - |
| workflow_type | string | character varying | ✓ | - |
| document_name | string | text | ✗ | - |
| document_url | string | text | ✓ | - |
| file_path | string | text | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | integer | bigint | ✓ | - |
| contract_id | integer | bigint | ✓ | - |
| procurement_phase | string | character varying | ✓ | - |

---

### 359. `signature_requests`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 14

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| signature_document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `signature_documents.id`.<fk table='signature_documents' column='id'/> |
| signer_email | string | character varying | ✗ | - |
| signer_name | string | character varying | ✓ | - |
| signer_role | string | character varying | ✓ | - |
| signing_order | integer | integer | ✓ | - |
| signature_status | string | character varying | ✓ | - |
| signed_at | string | timestamp with time zone | ✓ | - |
| declined_at | string | timestamp with time zone | ✓ | - |
| decline_reason | string | text | ✓ | - |
| documenso_recipient_id | string | character varying | ✓ | - |
| signature_field_id | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 360. `signature_templates`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 15

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | integer | bigint | ✓ | - |
| template_name | string | character varying | ✗ | - |
| template_description | string | text | ✓ | - |
| applicable_msic_codes | array | text[] | ✓ | - |
| applicable_contract_types | array | text[] | ✓ | - |
| applicable_procurement_phases | array | text[] | ✓ | - |
| required_signers | unknown | jsonb | ✓ | - |
| default_deadline_hours | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| is_default_for_msic | array | text[] | ✓ | - |
| created_by | string | uuid | ✓ | - |
| version | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 361. `signature_webhooks`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| webhook_provider | string | character varying | ✓ | - |
| webhook_event_type | string | character varying | ✓ | - |
| webhook_id | string | character varying | ✓ | - |
| webhook_data | unknown | jsonb | ✓ | - |
| processed | boolean | boolean | ✓ | - |
| processed_at | string | timestamp with time zone | ✓ | - |
| processing_errors | unknown | jsonb | ✓ | - |
| signature_document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `signature_documents.id`.<fk table='signature_documents' column='id'/> |
| contract_id | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 362. `sow_appendices`

**Description:** SOW appendices that require contribution and review from different disciplines

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| sow_id | string | uuid | ✓ | Note:
This is a Foreign Key to `scope_of_work.id`.<fk table='scope_of_work' column='id'/> |
| appendix_type | string | character varying | ✗ | - |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| status | string | character varying | ✓ | - |
| assigned_to | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |

---

### 363. `sow_document_transfers`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 23

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| scope_of_work_id | string | uuid | ✗ | Note:
This is a Foreign Key to `scope_of_work.id`.<fk table='scope_of_work' column='id'/> |
| document_type | string | character varying | ✗ | - |
| document_title | string | text | ✗ | - |
| document_version | string | character varying | ✓ | - |
| html_content | string | text | ✓ | - |
| css_styles | string | text | ✓ | - |
| generated_pdf_url | string | text | ✓ | - |
| cloud_storage_url | string | text | ✓ | - |
| generated_at | string | timestamp with time zone | ✓ | - |
| last_modified_at | string | timestamp with time zone | ✓ | - |
| generated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approved_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approval_status | string | character varying | ✓ | - |
| routed_for_signature | boolean | boolean | ✓ | - |
| signature_status | string | character varying | ✓ | - |
| route_id | string | uuid | ✓ | - |
| transfer_status | string | character varying | ✓ | - |
| processing_errors | string | text | ✓ | - |
| file_size_bytes | integer | integer | ✓ | - |
| content_hash | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 364. `sow_templates`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| order_type | string | character varying | ✗ | - |
| appendix_definitions | unknown | jsonb | ✗ | - |
| discipline_defaults | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 365. `sql_file_tracking`

**Description:** Tracks SQL files and their corresponding Supabase table versions

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 4

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| file_path | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| supabase_table | string | character varying | ✗ | - |
| last_validated | string | timestamp with time zone | ✓ | - |
| schema_hash | string | character | ✗ | - |

---

### 366. `supplier_verifications`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| supplier_id | integer | integer | ✓ | Note:
This is a Foreign Key to `suppliers.id`.<fk table='suppliers' column='id'/> |
| source_id | string | uuid | ✓ | Note:
This is a Foreign Key to `integration_sources.id`.<fk table='integration_sources' column='id'/> |
| external_supplier_id | string | character varying | ✗ | - |
| source_system | string | character varying | ✗ | - |
| verification_data | unknown | jsonb | ✗ | - |
| verification_status | string | character varying | ✓ | - |
| bbbee_level | string | character varying | ✓ | - |
| tax_compliant | boolean | boolean | ✓ | - |
| bbbee_compliant | boolean | boolean | ✓ | - |
| cidb_registered | boolean | boolean | ✓ | - |
| expiry_date | string | date | ✓ | - |
| last_verified_at | string | timestamp with time zone | ✓ | - |
| verification_certificate_url | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 367. `suppliers`

**Description:** Table to store supplier information for procurement

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 24

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| address | string | text | ✓ | - |
| email | string | text | ✓ | - |
| phone | string | text | ✓ | - |
| contact_person | string | text | ✓ | - |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| supplier_type | string | text | ✓ | Type of supplier (e.g., materials, equipment, services) |
| website | string | text | ✓ | Supplier website URL |
| approval_status | string | text | ✓ | Current approval status of the supplier |
| goods_services | string | text | ✓ | Description of goods and services provided |
| rating | number | numeric | ✓ | Supplier rating (0-5 scale) |
| completed_projects | integer | integer | ✓ | Number of completed projects |
| registration_date | string | date | ✓ | Date when supplier was registered |
| last_activity | string | timestamp with time zone | ✓ | Timestamp of last activity/update |
| tax_number | string | text | ✓ | Tax/VAT registration number |
| compliance_status | string | text | ✓ | Current compliance status |
| source_url | string | text | ✓ | URL where supplier information was scraped from |
| scrape_method | string | text | ✓ | Method used for scraping (e.g., tavily_search, manual) |
| scraped_at | string | timestamp with time zone | ✓ | Timestamp when supplier was scraped |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 368. `sync_history`

**Description:** History of synchronization activities with external tender sources

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| source | string | character varying | ✓ | - |
| sync_type | string | character varying | ✓ | - |
| sync_completed_at | string | timestamp with time zone | ✓ | - |
| tenders_found | integer | integer | ✓ | - |
| tenders_new | integer | integer | ✓ | - |
| errors | unknown | jsonb | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |

---

### 369. `task_attachments`

**Description:** File attachments associated with tasks

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| task_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| filename | string | character varying | ✗ | - |
| file_path | string | text | ✗ | - |
| file_size | integer | bigint | ✓ | - |
| mime_type | string | character varying | ✓ | - |
| uploaded_by | string | uuid | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 370. `task_comments`

**Description:** Comments and notes added to tasks for collaboration

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| task_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| user_id | string | uuid | ✗ | - |
| comment | string | text | ✗ | - |
| is_internal | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 371. `task_history`

**Description:** Audit trail of all changes made to tasks

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| task_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| user_id | string | uuid | ✗ | - |
| action | string | character varying | ✗ | - |
| old_value | unknown | jsonb | ✓ | - |
| new_value | unknown | jsonb | ✓ | - |
| notes | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 372. `task_messages`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| task_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| message | string | text | ✗ | - |
| message_type | string | text | ✓ | - |
| from_discipline | string | text | ✗ | - |
| to_discipline | string | text | ✗ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 373. `task_sequence_execution`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 22

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| template_variation | string | character varying | ✗ | - |
| template_variation_id | string | uuid | ✓ | Note:
This is a Foreign Key to `template_variation_sequences.id`.<fk table='template_variation_sequences' column='id'/> |
| planned_sequence | unknown | jsonb | ✗ | - |
| actual_sequence | unknown | jsonb | ✓ | - |
| sequence_adherence | number | numeric | ✓ | - |
| total_tasks | integer | integer | ✓ | - |
| completed_tasks | integer | integer | ✓ | - |
| current_task_position | integer | integer | ✓ | - |
| parallel_groups_active | integer | integer | ✓ | - |
| estimated_completion_time | string | timestamp with time zone | ✓ | - |
| actual_completion_time | string | timestamp with time zone | ✓ | - |
| deviations | unknown | jsonb | ✓ | - |
| bottlenecks | unknown | jsonb | ✓ | - |
| performance_metrics | unknown | jsonb | ✓ | - |
| status | string | character varying | ✓ | - |
| started_at | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 374. `tasks`

**Description:** Central repository for all tasks across the procurement and project management system

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 30

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Unique identifier for the task

Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✗ | Organization context for multi-tenant isolation - references organizations(id)

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| task_type | string | character varying | ✗ | Type of task (procurement_review, appendix_contribution, hitl, etc.) |
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| business_object_type | string | character varying | ✓ | Type of business object this task relates to |
| business_object_id | string | uuid | ✓ | ID of the specific business object |
| assigned_to | string | uuid | ✓ | User currently assigned to complete this task - references auth.users(id) |
| assigned_by | string | uuid | ✓ | User who assigned this task - references auth.users(id) |
| discipline | string | character varying | ✓ | Discipline this task belongs to (engineering, procurement, etc.) |
| priority | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| due_date | string | timestamp with time zone | ✓ | - |
| is_hitl | boolean | boolean | ✓ | Whether this task requires human intervention |
| intervention_type | string | character varying | ✓ | Type of human intervention required |
| chatbot_session_id | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| escalated_at | string | timestamp with time zone | ✓ | - |
| metadata | unknown | jsonb | ✓ | Flexible storage for task-specific additional data |
| sequence_position | integer | integer | ✓ | - |
| sequence_group | string | character varying | ✓ | - |
| sequence_dependencies | unknown | jsonb | ✓ | - |
| sequence_execution_id | string | uuid | ✓ | - |
| estimated_duration_minutes | integer | integer | ✓ | - |
| actual_duration_minutes | integer | integer | ✓ | - |
| assigned_to_discipline | string | text | ✓ | - |
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| created_by | string | uuid | ✓ | - |

---

### 375. `technical_document_categories`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| category_code | string | character varying | ✗ | - |
| category_name | string | character varying | ✗ | - |
| category_description | string | text | ✓ | - |
| discipline | string | character varying | ✗ | - |
| document_type | string | character varying | ✗ | - |
| template_count | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| sort_order | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 376. `template_analytics`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| date | string | date | ✗ | - |
| total_uses | integer | integer | ✓ | - |
| successful_uses | integer | integer | ✓ | - |
| failed_uses | integer | integer | ✓ | - |
| unique_users | integer | integer | ✓ | - |
| average_generation_time | number | numeric | ✓ | - |
| total_tokens_used | integer | integer | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

### 377. `template_approval_rules`

**Description:** Workflow rules for template approvals based on type and value

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_type | string | character varying | ✗ | - |
| category | string | character varying | ✓ | - |
| value_threshold | number | numeric | ✓ | - |
| required_roles | array | text[] | ✓ | - |
| requires_technical_review | boolean | boolean | ✓ | - |
| requires_legal_review | boolean | boolean | ✓ | - |
| approval_order | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 378. `template_approval_workflows`

**Description:** Approval workflow instances for procurement templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| workflow_type | unknown | jsonb | ✓ | - |
| status | string | text | ✓ | - |
| current_step | integer | integer | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| rejected_at | string | timestamp with time zone | ✓ | - |
| required_approvals | unknown | jsonb | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 379. `template_assignments`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✗ | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| assigned_to_type | string | character varying | ✗ | - |
| assigned_to_id | string | uuid | ✗ | - |
| assigned_by | string | uuid | ✓ | - |
| assigned_at | string | timestamp without time zone | ✓ | - |
| status | string | character varying | ✓ | - |
| due_date | string | date | ✓ | - |
| priority | string | character varying | ✓ | - |
| submitted_data | unknown | jsonb | ✓ | - |
| submitted_at | string | timestamp without time zone | ✓ | - |
| contractor_comments | string | text | ✓ | - |
| reviewed_by | string | uuid | ✓ | - |
| reviewed_at | string | timestamp without time zone | ✓ | - |
| review_status | string | character varying | ✓ | - |
| reviewer_comments | string | text | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

### 380. `template_categories`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| count | integer | integer | ✓ | - |
| category_type | string | character varying | ✓ | - |
| parent_category_id | string | character varying | ✓ | Note:
This is a Foreign Key to `template_categories.id`.<fk table='template_categories' column='id'/> |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 381. `template_customization_rules`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_category | string | text | ✗ | - |
| customization_type | string | text | ✗ | - |
| field_name | string | text | ✗ | - |
| field_type | string | text | ✗ | - |
| is_required | boolean | boolean | ✓ | - |
| validation_rules | unknown | jsonb | ✓ | - |
| auto_populate_from | string | text | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 382. `template_dependencies`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | - |
| parent_template_id | string | uuid | ✓ | - |
| dependent_template_id | string | uuid | ✓ | - |
| dependency_type | string | text | ✓ | - |
| dependency_condition | unknown | jsonb | ✓ | - |
| is_required | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 383. `template_deployments`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| project_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `project_templates.id`.<fk table='project_templates' column='id'/> |
| deployment_type | string | text | ✗ | - |
| source_system | string | text | ✗ | - |
| target_system | string | text | ✗ | - |
| status | string | text | ✓ | - |
| error_message | string | text | ✓ | - |
| executed_at | string | timestamp without time zone | ✓ | - |

---

### 384. `template_derivations`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| parent_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| derived_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| derivation_type | string | character varying | ✓ | - |
| derivation_date | string | timestamp without time zone | ✓ | - |
| derived_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| derivation_reason | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 385. `template_document_structures`

**Description:** Links templates to their hierarchical document structures

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✗ | - |
| discipline_table | string | text | ✗ | - |
| hierarchy_definition_id | string | uuid | ✓ | Note:
This is a Foreign Key to `document_hierarchy_definitions.id`.<fk table='document_hierarchy_definitions' column='id'/> |
| structure_data | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 386. `template_relationships`

**Description:** Links templates together for complex document assemblies

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| parent_template_id | string | uuid | ✗ | - |
| child_template_id | string | uuid | ✗ | - |
| relationship_type | string | text | ✗ | - |
| section_path | string | text | ✓ | - |
| is_required | boolean | boolean | ✓ | - |
| sort_order | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 387. `template_reviews`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| user_id | string | uuid | ✓ | - |
| rating | integer | integer | ✓ | - |
| review_text | string | text | ✓ | - |
| is_helpful | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |

---

### 388. `template_usage_logs`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| template_type | string | character varying | ✗ | - |
| user_id | string | uuid | ✓ | - |
| session_id | string | character varying | ✓ | - |
| generation_time | integer | integer | ✓ | - |
| success | boolean | boolean | ✓ | - |
| error_message | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |

---

### 389. `template_usage_stats`

**Description:** Analytics and usage statistics for templates

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_type | string | character varying | ✗ | - |
| category | string | character varying | ✓ | - |
| usage_count | integer | integer | ✓ | - |
| last_used | string | timestamp with time zone | ✓ | - |
| average_population_time | string | interval | ✓ | - |
| success_rate | number | numeric | ✓ | - |
| common_populations | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 390. `template_usage_tracking`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| template_id | string | uuid | ✓ | - |
| action_type | string | text | ✗ | - |
| procurement_code | string | text | ✓ | - |
| department_code | string | character varying | ✓ | - |
| session_id | string | text | ✓ | - |
| user_agent | string | text | ✓ | - |
| ip_address | string | inet | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 391. `template_variation_sequences`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 21

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_code | string | character varying | ✗ | - |
| template_variation | string | character varying | ✗ | - |
| variation_name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| complexity_level | string | character varying | ✗ | - |
| sequence_definition | unknown | jsonb | ✗ | - |
| parallel_groups | unknown | jsonb | ✓ | - |
| dependencies | unknown | jsonb | ✓ | - |
| estimated_duration_minutes | integer | integer | ✓ | - |
| estimated_duration_display | string | character varying | ✓ | - |
| appendices_included | unknown | jsonb | ✓ | - |
| skip_tasks | unknown | jsonb | ✓ | - |
| business_rules | unknown | jsonb | ✓ | - |
| is_default | boolean | boolean | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 392. `template_versions`

**Description:** Version history for master template changes

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `master_templates.id`.<fk table='master_templates' column='id'/> |
| version_number | integer | integer | ✗ | - |
| changes | string | text | ✗ | - |
| content | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 393. `templates`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 33

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| type | string | character varying | ✗ | Template type (form_template, questionnaire, etc.) - not unique since same types can be used across disciplines |
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| version | string | character varying | ✓ | - |
| prompt_template | string | text | ✗ | - |
| validation_config | unknown | jsonb | ✓ | - |
| ui_config | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| is_public | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| usage_count | integer | integer | ✓ | - |
| success_rate | number | numeric | ✓ | - |
| average_generation_time | integer | integer | ✓ | - |
| tags | array | text[] | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| discipline_code | string | character varying | ✓ | EPCM discipline code (01300=Governance, 00850=Civil, 01900=Procurement, 02400=HSSE) |
| document_type | string | character varying | ✓ | Specific document type within the discipline (questionnaire, form, assessment, etc.) |
| discipline | string | character varying | ✓ | - |
| copied_from_template_id | string | uuid | ✓ | References the original template this was copied from

Note:
This is a Foreign Key to `templates.id`.<fk table='templates' column='id'/> |
| template_scope | string | character varying | ✓ | Indicates if template is original, copied, or project-specific |
| target_discipline | string | character varying | ✓ | The discipline this template was copied to (for copied templates) |
| copy_metadata | unknown | jsonb | ✓ | Additional metadata about the copy operation |
| processing_status | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| suitable_for_document_types | array | text[] | ✓ | Array of document types this template is suitable for (purchase_order, work_order, service_order) |
| category | string | character varying | ✓ | - |
| deleted_at | string | timestamp without time zone | ✓ | - |
| deleted_by | string | uuid | ✓ | - |
| deletion_reason | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | Discipline-specific metadata and configuration (e.g., procurement codes, category mappings, protection settings) |

---

### 394. `temporary_uploads`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| organization_id | string | uuid | ✓ | - |
| company_id | string | uuid | ✓ | - |
| file_name | string | text | ✗ | - |
| file_path | string | text | ✗ | - |
| file_size | integer | integer | ✗ | - |
| file_type | string | character varying | ✗ | - |
| document_type | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✗ | - |

---

### 395. `tender_approvals`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| approval_level | integer | integer | ✗ | - |
| approver_id | string | uuid | ✓ | - |
| approver_name | string | text | ✓ | - |
| approver_role | string | text | ✓ | - |
| approval_status | string | character varying | ✓ | - |
| approval_date | string | timestamp without time zone | ✓ | - |
| comments | string | text | ✓ | - |
| approval_document_url | string | text | ✓ | - |
| delegation_to | string | uuid | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

### 396. `tender_documents`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 18

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_id | string | uuid | ✗ | - |
| document_type | string | character varying | ✗ | - |
| document_name | string | text | ✗ | - |
| document_category | string | character varying | ✓ | - |
| file_path | string | text | ✗ | - |
| file_url | string | text | ✓ | - |
| file_size | integer | integer | ✓ | - |
| mime_type | string | character varying | ✓ | - |
| original_url | string | text | ✓ | - |
| original_filename | string | text | ✓ | - |
| download_status | string | character varying | ✓ | - |
| checksum_hash | string | text | ✓ | - |
| processing_status | string | character varying | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_by | string | text | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

### 397. `tender_evaluation`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| criterion_name | string | text | ✗ | - |
| criterion_description | string | text | ✓ | - |
| weightage | number | numeric | ✗ | - |
| max_score | number | numeric | ✗ | - |
| evaluation_method | string | character varying | ✓ | - |
| is_mandatory | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |

---

### 398. `tender_items`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 13

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| item_number | string | character varying | ✗ | - |
| description | string | text | ✗ | - |
| quantity | number | numeric | ✗ | - |
| unit | string | character varying | ✗ | - |
| estimated_unit_price | number | numeric | ✓ | - |
| estimated_total_price | number | numeric | ✓ | - |
| specifications | string | text | ✓ | - |
| delivery_timeline | string | text | ✓ | - |
| quality_standards | string | text | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

### 399. `tender_monitors`

**Description:** Stores automated tender monitoring configurations with filter criteria

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| frequency | string | character varying | ✓ | Check frequency: hourly, daily, or weekly |
| filters | unknown | jsonb | ✓ | JSON object containing filter criteria for matched tenders |
| is_active | boolean | boolean | ✓ | - |
| created_by_user_id | string | character varying | ✓ | - |
| user_ids | unknown | jsonb | ✓ | JSON array of user IDs to notify (in addition to created_by_user_id) |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 400. `tender_notification_logs`

**Description:** Logs all notifications sent to users about new tenders

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| monitor_id | string | uuid | ✓ | Note:
This is a Foreign Key to `tender_monitors.id`.<fk table='tender_monitors' column='id'/> |
| tender_id | string | character varying | ✓ | - |
| tender_title | string | character varying | ✓ | - |
| tender_number | string | character varying | ✓ | - |
| issuing_organization | string | character varying | ✓ | - |
| estimated_value | number | numeric | ✓ | - |
| currency | string | character varying | ✓ | - |
| location | string | text | ✓ | - |
| notification_sent_at | string | timestamp with time zone | ✓ | - |

---

### 401. `tender_suppliers`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 25

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_id | string | uuid | ✗ | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| supplier_id | string | uuid | ✓ | - |
| supplier_name | string | text | ✗ | - |
| contact_person | string | text | ✓ | - |
| contact_email | string | text | ✓ | - |
| contact_phone | string | text | ✓ | - |
| bid_amount | number | numeric | ✓ | - |
| bid_currency | string | character varying | ✓ | - |
| bid_validity_period | integer | integer | ✓ | - |
| technical_score | number | numeric | ✓ | - |
| financial_score | number | numeric | ✓ | - |
| overall_score | number | numeric | ✓ | - |
| bid_status | string | character varying | ✓ | - |
| submission_date | string | timestamp without time zone | ✓ | - |
| bid_document_url | string | text | ✓ | - |
| technical_proposal | string | text | ✓ | - |
| financial_proposal | string | text | ✓ | - |
| clarifications_requested | array | text[] | ✓ | - |
| clarifications_provided | array | text[] | ✓ | - |
| evaluation_notes | string | text | ✓ | - |
| ranking | integer | integer | ✓ | - |
| is_preferred | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

### 402. `tenders`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 54

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| tender_number | string | character varying | ✗ | - |
| title | string | text | ✗ | - |
| description | string | text | ✓ | - |
| tender_type | string | character varying | ✗ | - |
| procurement_method | string | character varying | ✗ | - |
| status | string | character varying | ✗ | - |
| priority | string | character varying | ✗ | - |
| estimated_value | number | numeric | ✓ | - |
| currency | string | character varying | ✓ | - |
| budget_allocated | number | numeric | ✓ | - |
| issue_date | string | date | ✗ | - |
| pre_bid_meeting_date | string | date | ✓ | - |
| bid_submission_deadline | string | date | ✗ | - |
| bid_opening_date | string | date | ✓ | - |
| evaluation_completion_date | string | date | ✓ | - |
| award_date | string | date | ✓ | - |
| contract_start_date | string | date | ✓ | - |
| contract_end_date | string | date | ✓ | - |
| location | string | text | ✓ | - |
| scope_of_work | string | text | ✓ | - |
| technical_specifications | string | text | ✓ | - |
| evaluation_criteria | string | text | ✓ | - |
| procurement_officer_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| department_id | string | uuid | ✓ | - |
| approval_status | string | character varying | ✓ | - |
| approval_workflow_id | string | uuid | ✓ | - |
| current_approval_level | integer | integer | ✓ | - |
| number_of_bids | integer | integer | ✓ | - |
| awarded_supplier_id | string | uuid | ✓ | - |
| awarded_supplier_name | string | text | ✓ | - |
| contract_value | number | numeric | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| version | integer | integer | ✓ | - |
| eligibility_requirements | string | text | ✓ | - |
| bid_security_amount | number | numeric | ✓ | - |
| bid_security_currency | string | character varying | ✓ | - |
| performance_security_percentage | number | numeric | ✓ | - |
| payment_terms | string | text | ✓ | - |
| delivery_timeline | string | text | ✓ | - |
| warranty_requirements | string | text | ✓ | - |
| tender_document_url | string | text | ✓ | - |
| addendum_urls | unknown | jsonb | ✓ | - |
| clarification_responses | unknown | jsonb | ✓ | - |
| compliance_requirements | string | text | ✓ | - |
| legal_requirements | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| tags | array | text[] | ✓ | - |
| notes | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 403. `timesheet_amendments`

**Description:** Amendments to timesheet entries

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 11

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| timesheet_id | string | uuid | ✓ | Timesheet this amendment is for

Note:
This is a Foreign Key to `timesheets.id`.<fk table='timesheets' column='id'/> |
| requested_by | string | uuid | ✓ | User who requested the amendment

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| reason | string | text | ✗ | Reason for the amendment |
| status | string | character varying | ✓ | Status of the amendment |
| approved_by | string | uuid | ✓ | User who approved the amendment

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approved_at | string | timestamp with time zone | ✓ | When the amendment was approved |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 404. `timesheet_audit_logs`

**Description:** Audit logs for timesheet changes

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| timesheet_id | string | uuid | ✓ | Timesheet this log entry is for

Note:
This is a Foreign Key to `timesheets.id`.<fk table='timesheets' column='id'/> |
| user_id | string | uuid | ✓ | User who made the change

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| action | string | character varying | ✗ | Action performed |
| old_values | unknown | jsonb | ✓ | Old values before the change |
| new_values | unknown | jsonb | ✓ | New values after the change |
| ip_address | string | inet | ✓ | IP address of the user |
| user_agent | string | text | ✓ | User agent of the request |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 405. `timesheet_descriptions`

**Description:** Timesheet task descriptions and codes per project

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Unique identifier for the description

Note:
This is a Primary Key.<pk/> |
| project_id | string | uuid | ✓ | Reference to the project

Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| code | string | character varying | ✗ | Task code for timesheet entry |
| description | string | text | ✗ | Detailed task description |
| category | string | character varying | ✓ | Task category for grouping |
| is_active | boolean | boolean | ✓ | Whether the description is active for use |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |

---

### 406. `timesheet_entries`

**Description:** Timesheet entries for user work hours tracking (new implementation)

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | User who owns this timesheet entry |
| week_start_date | string | date | ✗ | Start date of the week (Monday) for this timesheet |
| description | string | character varying | ✗ | Description of the task or work performed |
| project | string | character varying | ✓ | Project associated with this task |
| monday_hours | number | numeric | ✓ | Hours worked on Monday |
| tuesday_hours | number | numeric | ✓ | Hours worked on Tuesday |
| wednesday_hours | number | numeric | ✓ | Hours worked on Wednesday |
| thursday_hours | number | numeric | ✓ | Hours worked on Thursday |
| friday_hours | number | numeric | ✓ | Hours worked on Friday |
| saturday_hours | number | numeric | ✓ | Hours worked on Saturday |
| sunday_hours | number | numeric | ✓ | Hours worked on Sunday |
| total_hours | number | numeric | ✓ | Total hours calculated automatically |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 407. `timesheet_submissions`

**Description:** Timesheet submissions for approval workflow

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 16

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Unique identifier for the submission

Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | Reference to the user who submitted |
| week_key | string | character varying | ✗ | Week identifier in YYYY-WXX format |
| week_start_date | string | date | ✗ | Start date of the week |
| week_end_date | string | date | ✗ | End date of the week |
| tasks | unknown | jsonb | ✗ | JSON array of tasks for the week |
| total_hours | number | numeric | ✓ | Total hours for the week |
| status | string | character varying | ✓ | Current status: draft, submitted, approved, rejected |
| submitted_at | string | timestamp with time zone | ✓ | When the timesheet was submitted |
| approved_at | string | timestamp with time zone | ✓ | When the timesheet was approved |
| rejected_at | string | timestamp with time zone | ✓ | When the timesheet was rejected |
| approver_id | string | uuid | ✓ | Reference to the approver |
| rejection_reason | string | text | ✓ | Reason for rejection if rejected |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 408. `timesheet_templates`

**Description:** Templates for creating timesheet entries

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | User who owns this template |
| name | string | character varying | ✗ | Name of the template |
| tasks | unknown | jsonb | ✓ | JSON array of task templates |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 409. `timesheets`

**Description:** Timesheet entries for employee work hours tracking

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 19

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| employee_id | string | uuid | ✗ | Employee who owns this timesheet entry

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| date | string | date | ✗ | Date of the work |
| hours | number | numeric | ✗ | Hours worked on this date |
| project | string | character varying | ✗ | Project associated with this work |
| task | string | character varying | ✓ | Task associated with this work |
| client | string | character varying | ✓ | Client associated with this work |
| comments | string | text | ✓ | Comments about this work |
| currency | string | character varying | ✓ | Currency for any monetary values |
| status | string | character varying | ✓ | Status of this timesheet entry |
| template_id | string | uuid | ✓ | Template used to create this entry |
| approved_by | string | uuid | ✓ | User who approved this entry

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| approved_at | string | timestamp with time zone | ✓ | When this entry was approved |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| locked | boolean | boolean | ✓ | Whether this entry is locked from editing |
| locked_at | string | timestamp with time zone | ✓ | When this entry was locked |
| user_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 410. `tracking_events`

**Description:** Historical tracking events for vessels and containers

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 23

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| event_type | string | character varying | ✗ | - |
| event_category | string | character varying | ✗ | - |
| vessel_id | string | uuid | ✓ | Note:
This is a Foreign Key to `vessels.id`.<fk table='vessels' column='id'/> |
| container_id | string | uuid | ✓ | Note:
This is a Foreign Key to `containers.id`.<fk table='containers' column='id'/> |
| event_timestamp | string | timestamp with time zone | ✗ | - |
| event_description | string | text | ✓ | - |
| event_location | string | character varying | ✓ | - |
| latitude | number | numeric | ✓ | - |
| longitude | number | numeric | ✓ | - |
| status_code | string | character varying | ✓ | - |
| status_description | string | character varying | ✓ | - |
| port_code | string | character varying | ✓ | - |
| port_name | string | character varying | ✓ | - |
| facility_name | string | character varying | ✓ | - |
| event_data | unknown | jsonb | ✓ | - |
| data_source | string | character varying | ✓ | - |
| api_reference | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| company_id | string | uuid | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |

---

### 411. `training_materials`

**Description:** Training materials for procurement processes with full compliance and certification tracking

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 27

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| purpose | string | text | ✗ | Primary purpose and objective of the training material |
| target_audience | string | text | ✗ | Target audience for the training material |
| description | string | text | ✓ | - |
| content | string | text | ✓ | - |
| status | string | text | ✗ | - |
| priority | string | text | ✗ | - |
| certification | unknown | jsonb | ✓ | Certification details including type and issuing authority |
| compliance_requirements | unknown | jsonb | ✓ | Specific compliance requirements that must be met |
| regulatory_standards | array | text[] | ✓ | Array of regulatory standards this training material addresses |
| estimated_duration | string | interval | ✓ | - |
| scheduled_date | string | timestamp with time zone | ✓ | - |
| completion_deadline | string | timestamp with time zone | ✓ | - |
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| scope_of_work_id | string | uuid | ✓ | Note:
This is a Foreign Key to `scope_of_work.id`.<fk table='scope_of_work' column='id'/> |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| assigned_to | string | uuid | ✓ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| approved_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| category | string | text | ✓ | - |
| subcategory | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| metadata | unknown | jsonb | ✓ | Additional metadata for tracking test data, versions, etc. |
| notes | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 412. `training_pipeline_dashboard`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 12

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| discipline_code | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| training_examples_count | integer | integer | ✓ | - |
| local_scan_status | string | text | ✓ | - |
| hf_upload_status | string | text | ✓ | - |
| runpod_training_status | string | text | ✓ | - |
| production_deployment_status | string | text | ✓ | - |
| training_duration_hours | number | numeric | ✓ | - |
| estimated_cost_usd | number | numeric | ✓ | - |
| improvement_percentage | number | numeric | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| pipeline_status | string | text | ✓ | - |

---

### 413. `training_pipeline_status`

**Description:** Tracks training data pipeline status from local storage through production deployment

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 30

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | text | ✗ | Unique identifier for the discipline (e.g., procurement, safety) |
| discipline_name | string | text | ✓ | - |
| training_examples_count | integer | integer | ✓ | Number of training examples in the dataset |
| file_size_bytes | integer | integer | ✓ | - |
| file_hash | string | text | ✓ | SHA256 hash for file integrity verification |
| quality_score_min | number | numeric | ✓ | - |
| quality_score_max | number | numeric | ✓ | - |
| quality_score_avg | number | numeric | ✓ | - |
| file_last_modified | string | timestamp with time zone | ✓ | - |
| local_scan_status | string | text | ✓ | - |
| local_scan_timestamp | string | timestamp with time zone | ✓ | - |
| hf_upload_status | string | text | ✓ | - |
| hf_upload_timestamp | string | timestamp with time zone | ✓ | - |
| hf_repository_url | string | text | ✓ | - |
| runpod_training_status | string | text | ✓ | - |
| runpod_training_timestamp | string | timestamp with time zone | ✓ | - |
| training_duration_hours | number | numeric | ✓ | - |
| estimated_cost_usd | number | numeric | ✓ | - |
| runpod_job_id | string | text | ✓ | - |
| production_deployment_status | string | text | ✓ | - |
| production_deployment_timestamp | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| last_updated_by | string | text | ✓ | - |
| notes | string | text | ✓ | - |
| tags | array | text[] | ✓ | - |
| baseline_accuracy | number | numeric | ✓ | - |
| trained_accuracy | number | numeric | ✓ | - |
| improvement_percentage | number | numeric | ✓ | - |

---

### 414. `travel_airports`

**Description:** List of airports for travel routing

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| code | string | character varying | ✗ | - |
| hazards | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 415. `travel_equipment_filters`

**Description:** Equipment filters for travel routes

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| required_for | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 416. `travel_ground_routes`

**Description:** List of ground routes for travel routing

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| type | string | character varying | ✗ | - |
| hazards | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 417. `travel_hazard_alerts`

**Description:** Hazard alerts for travel routes

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| type | string | character varying | ✗ | - |
| message | string | text | ✗ | - |
| routes | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 418. `travel_helipads`

**Description:** List of helipads for travel routing

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| coordinates | string | character varying | ✓ | - |
| equipment | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 419. `travel_requests`

**Description:** Travel requests submitted by users

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 34

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | User who submitted the request |
| purpose | string | character varying | ✗ | Purpose of the travel |
| destination | string | character varying | ✗ | Travel destination |
| start_date | string | date | ✗ | Start date of travel |
| end_date | string | date | ✗ | End date of travel |
| travelers | array | text[] | ✓ | List of travelers |
| transport_mode | string | character varying | ✗ | Type of transport (domestic, international, project-specific) |
| domestic_transport | string | character varying | ✓ | Specific domestic transport type |
| international_transport | string | character varying | ✓ | Specific international transport type |
| project_transport | string | character varying | ✓ | Specific project transport type |
| accommodation | string | character varying | ✓ | Accommodation details |
| special_requirements | string | text | ✓ | Special requirements for the trip |
| citizenship | string | character varying | ✓ | Citizenship of the traveler |
| security_clearance | string | character varying | ✓ | Security clearance level |
| frequent_traveler | boolean | boolean | ✓ | Whether the user is a frequent traveler |
| frequent_flyer_numbers | array | text[] | ✓ | Frequent flyer numbers |
| project_site | string | character varying | ✓ | Project site location |
| visa_required | boolean | boolean | ✓ | Whether a visa is required |
| visa_check_completed | boolean | boolean | ✓ | Whether visa check is completed |
| departure_location | string | character varying | ✓ | Departure location |
| arrival_location | string | character varying | ✓ | Arrival location |
| route_preferences | array | text[] | ✓ | Preferred routes and equipment |
| status | string | character varying | ✓ | Request status (pending, approved, rejected) |
| submitted_at | string | timestamp with time zone | ✓ | When the request was submitted |
| approved_at | string | timestamp with time zone | ✓ | When the request was approved |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| flight_segments | unknown | jsonb | ✓ | - |
| has_return_leg | boolean | boolean | ✓ | - |
| return_segments | unknown | jsonb | ✓ | - |
| health_check_required | boolean | boolean | ✓ | - |
| health_check_passed | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 420. `travel_templates`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 30

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| name | string | character varying | ✗ | - |
| purpose | string | character varying | ✓ | - |
| destination | string | character varying | ✓ | - |
| travelers | array | text[] | ✓ | - |
| transport_mode | string | character varying | ✓ | - |
| domestic_transport | string | character varying | ✓ | - |
| international_transport | string | character varying | ✓ | - |
| project_transport | string | character varying | ✓ | - |
| accommodation | string | character varying | ✓ | - |
| special_requirements | string | text | ✓ | - |
| citizenship | string | character varying | ✓ | - |
| security_clearance | string | character varying | ✓ | - |
| frequent_traveler | boolean | boolean | ✓ | - |
| frequent_flyer_numbers | array | text[] | ✓ | - |
| project_site | string | character varying | ✓ | - |
| visa_required | boolean | boolean | ✓ | - |
| visa_check_completed | boolean | boolean | ✓ | - |
| departure_location | string | character varying | ✓ | - |
| arrival_location | string | character varying | ✓ | - |
| route_preferences | array | text[] | ✓ | - |
| flight_segments | unknown | jsonb | ✓ | - |
| has_return_leg | boolean | boolean | ✓ | - |
| return_segments | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| health_check_required | boolean | boolean | ✓ | - |
| health_check_passed | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 421. `ui_button_settings`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 9

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| company_id | integer | integer | ✗ | - |
| button_option_id | integer | integer | ✓ | Note:
This is a Foreign Key to `button_options.id`.<fk table='button_options' column='id'/> |
| is_visible | boolean | boolean | ✓ | - |
| user_type | string | character varying | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 422. `ui_display_settings`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| company_id | integer | integer | ✗ | - |
| accordion_option_id | integer | integer | ✓ | - |
| is_visible | boolean | boolean | ✓ | - |
| user_type | string | character varying | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 423. `user_accordion_settings`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 8

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| user_type | string | character varying | ✗ | - |
| accordion_id | integer | integer | ✓ | - |
| is_visible | boolean | boolean | ✓ | - |
| contractor_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 424. `user_companies`

**Description:** Maps users to their assigned companies

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 4

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| user_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| company_id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 425. `user_company_access`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 7

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| company_id | string | text | ✗ | - |
| role | string | text | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 426. `user_department_access`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | text | ✗ | - |
| department_code | string | text | ✗ | - |
| role_level | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 427. `user_discipline_access`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 10

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_code | string | character varying | ✗ | - |
| access_level | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

### 428. `user_email_accounts`

**Description:** User email account configurations and credentials

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 24

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| provider_id | string | uuid | ✗ | Note:
This is a Foreign Key to `email_providers.id`.<fk table='email_providers' column='id'/> |
| email_address | string | character varying | ✗ | - |
| display_name | string | character varying | ✓ | - |
| is_primary | boolean | boolean | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| access_token | string | text | ✓ | - |
| refresh_token | string | text | ✓ | - |
| token_expires_at | string | timestamp with time zone | ✓ | - |
| imap_host | string | character varying | ✓ | - |
| imap_port | integer | integer | ✓ | - |
| imap_username | string | character varying | ✓ | - |
| imap_password_encrypted | string | text | ✓ | - |
| smtp_host | string | character varying | ✓ | - |
| smtp_port | integer | integer | ✓ | - |
| smtp_username | string | character varying | ✓ | - |
| smtp_password_encrypted | string | text | ✓ | - |
| last_sync_at | string | timestamp with time zone | ✓ | - |
| sync_enabled | boolean | boolean | ✓ | - |
| sync_frequency_minutes | integer | integer | ✓ | - |
| settings | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 429. `user_email_aliases`

**Scripts Using This Table:** None found

**Referenced By:** No other tables

**Foreign Keys:** None found

**Constraints:** None found

**Indexes:** None found

**RLS Policies:** 1

**Policy 1:** RLS Enabled (cached)
- **Operations:** ALL
- **Roles:** authenticated
- **Condition:** `RLS policies active (from cached data)`

**Columns:** 6

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| email | string | public.citext | ✗ | - |
| normalized_email | string | public.citext | ✗ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| organization_id | string | uuid | ✓ | - |

---


**📝 Generated**: 2026-03-12T03:45:30.579Z
**📊 Tables Documented**: 143
**🏗️ System**: Construct AI Database Schema - Part 3
