# 📊 Schema Part 4: Tables 430-461 (U-W alphabetically)

**Database schema documentation for Construct AI - Part 4 of 3.**

## 📋 Overview

This document contains detailed schema information for tables 430-461 (alphabetically ordered).

## 📊 Part Statistics

- **Tables in Part**: 32
- **Total Tables**: 461
- **Generated**: 2026-03-12T03:45:30.579Z

## 📖 Table Documentation

### 430. `user_emails`

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
| created_at | string | timestamp with time zone | ✗ | - |
| thread_id | string | text | ✓ | Unique identifier for email thread |
| cc_recipients | array | text[] | ✓ | Array of CC email addresses |
| bcc_recipients | array | text[] | ✓ | Array of BCC email addresses |
| body_html | string | text | ✓ | HTML formatted email body content |
| status | string | text | ✓ | Current status of the email |
| is_starred | boolean | boolean | ✓ | Flag for starred/important emails |
| is_important | boolean | boolean | ✓ | Flag for priority emails |
| folder | string | text | ✓ | Current folder location of email |
| attachments | unknown | jsonb | ✓ | JSON array of attachment metadata |
| raw_headers | string | text | ✓ | Complete email headers in raw format |
| in_reply_to | string | text | ✓ | Message-ID this email is replying to |
| message_references | array | text[] | ✓ | Array of Message-IDs in thread |
| user_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 431. `user_langchain_settings`

**Description:** Secure storage for user-specific LangChain AI configurations with encrypted API keys

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
| user_id | string | uuid | ✓ | - |
| organization_id | string | text | ✓ | - |
| openai_api_key | string | text | ✓ | Encrypted OpenAI API key |
| anthropic_api_key | string | text | ✓ | Encrypted Anthropic API key |
| cohere_api_key | string | text | ✓ | - |
| llm_provider | string | text | ✓ | Primary LLM provider (openai, anthropic, etc.) |
| llm_model | string | text | ✓ | - |
| embeddings_provider | string | text | ✓ | - |
| embeddings_model | string | text | ✓ | - |
| temperature | number | numeric | ✓ | AI creativity/randomness setting (0.0-2.0) |
| max_tokens | integer | integer | ✓ | - |
| dimensions | integer | integer | ✓ | - |
| chunk_size | integer | integer | ✓ | - |
| chunk_overlap | integer | integer | ✓ | - |
| langsmith_enabled | boolean | boolean | ✓ | - |
| langsmith_project | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 432. `user_management`

**Description:** Comprehensive user management table with profile, contact, auth, and business fields

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

**Columns:** 80

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| user_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| email | string | text | ✗ | - |
| role | string | text | ✓ | - |
| active | boolean | boolean | ✓ | - |
| status | string | character varying | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| employer | string | text | ✓ | - |
| first_name | string | character varying | ✓ | - |
| last_name | string | character varying | ✓ | - |
| display_name | string | character varying | ✓ | User preferred display name, overrides full_name |
| full_name | string | character varying | ✓ | Auto-generated from first_name + last_name via trigger |
| preferred_name | string | character varying | ✓ | - |
| phone | string | character varying | ✓ | - |
| mobile | string | character varying | ✓ | - |
| address | string | text | ✓ | - |
| city | string | character varying | ✓ | - |
| state_province | string | character varying | ✓ | - |
| postal_code | string | character varying | ✓ | - |
| country | string | character varying | ✓ | - |
| job_title | string | character varying | ✓ | - |
| department | string | character varying | ✓ | - |
| division | string | character varying | ✓ | - |
| cost_center | string | character varying | ✓ | - |
| manager_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| employee_id | string | character varying | ✓ | - |
| hire_date | string | date | ✓ | - |
| employment_type | string | character varying | ✓ | employee, contractor, consultant, intern, etc. |
| security_clearance | string | character varying | ✓ | - |
| password_hash | string | character varying | ✓ | - |
| password_salt | string | character varying | ✓ | - |
| last_login | string | timestamp with time zone | ✓ | - |
| login_count | integer | integer | ✓ | - |
| failed_login_attempts | integer | integer | ✓ | - |
| account_locked_until | string | timestamp with time zone | ✓ | - |
| password_reset_token | string | character varying | ✓ | - |
| password_reset_expires | string | timestamp with time zone | ✓ | - |
| email_verified | boolean | boolean | ✓ | - |
| email_verification_token | string | character varying | ✓ | - |
| two_factor_enabled | boolean | boolean | ✓ | - |
| two_factor_secret | string | character varying | ✓ | - |
| avatar_url | string | text | ✓ | - |
| bio | string | text | ✓ | - |
| timezone | string | character varying | ✓ | - |
| locale | string | character varying | ✓ | - |
| theme_preference | string | character varying | ✓ | - |
| notification_preferences | unknown | jsonb | ✓ | JSON object for email/push notification settings |
| user_preferences | unknown | jsonb | ✓ | JSON object for user UI/UX preferences |
| last_activity | string | timestamp with time zone | ✓ | - |
| session_token | string | character varying | ✓ | - |
| session_expires | string | timestamp with time zone | ✓ | - |
| terms_accepted_at | string | timestamp with time zone | ✓ | - |
| privacy_policy_accepted_at | string | timestamp with time zone | ✓ | - |
| data_retention_policy | string | character varying | ✓ | - |
| account_deletion_requested_at | string | timestamp with time zone | ✓ | - |
| contractor_company | string | character varying | ✓ | - |
| consultant_rate | number | numeric | ✓ | - |
| billing_currency | string | character varying | ✓ | - |
| project_access_level | string | character varying | ✓ | standard, elevated, restricted, admin |
| disciplines | unknown | jsonb | ✓ | JSON array of engineering disciplines user works in |
| certifications | unknown | jsonb | ✓ | - |
| emergency_contact | unknown | jsonb | ✓ | - |
| passport_number | string | character varying | ✓ | Primary passport number for international travel |
| passport_expiry_date | string | date | ✓ | Passport expiry date - must be validated before booking flights |
| passport_issue_date | string | date | ✓ | - |
| passport_issuing_country | string | character varying | ✓ | - |
| alternative_travel_docs | unknown | jsonb | ✓ | JSON array of alternative travel documents (visa, green card, resident permit, etc.) |
| date_of_birth | string | date | ✓ | - |
| gender | string | character varying | ✓ | - |
| nationality | string | character varying | ✓ | - |
| residence_country | string | character varying | ✓ | - |
| title | string | character varying | ✓ | - |
| visa_requirements | unknown | jsonb | ✓ | JSON array of visa requirements for different destinations |
| frequent_flyer_programs | unknown | jsonb | ✓ | JSON array of frequent flyer program memberships and account numbers |
| medical_info | unknown | jsonb | ✓ | - |
| dietary_restrictions | array | text[] | ✓ | - |
| special_assistance | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 433. `user_organization_access`

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
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | text | ✗ | - |
| organization_id | string | text | ✗ | - |
| is_primary | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 434. `user_organizations`

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
| organization_id | string | uuid | ✗ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| role | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 435. `user_profiles`

**Description:** User profile data for SOW Association Modal and user management

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
| user_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✓ | - |
| role | string | text | ✓ | User role (Technical Director, Project Manager, etc.) |
| project_site | string | text | ✓ | - |
| citizenship | string | character varying | ✓ | - |
| security_clearance | string | character varying | ✓ | - |
| frequent_traveler | boolean | boolean | ✓ | - |
| frequent_flyer_numbers | array | text[] | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| email | string | text | ✓ | - |
| first_name | string | text | ✓ | - |
| last_name | string | text | ✓ | - |
| avatar_url | string | text | ✓ | - |
| id | string | uuid | ✓ | Unique user identifier |
| company_id | string | uuid | ✓ | Company/organization identifier |
| settings | unknown | jsonb | ✓ | User settings and profile data as JSONB |
| last_login | string | timestamp with time zone | ✓ | Timestamp of last login |

---

### 436. `user_project_access`

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
| project_id | string | text | ✗ | - |
| role | string | text | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 437. `user_project_assignments`

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
| project_id | string | uuid | ✗ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| assigned_role | string | text | ✗ | - |
| phases_access | unknown | jsonb | ✓ | - |
| assigned_by | string | uuid | ✓ | - |
| assigned_at | string | timestamp without time zone | ✓ | - |
| expires_at | string | timestamp without time zone | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

### 438. `user_role_assignments`

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
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | - |
| role_name | string | character varying | ✗ | Note:
This is a Foreign Key to `role_definitions.role_name`.<fk table='role_definitions' column='role_name'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| company_id | string | uuid | ✓ | - |
| assigned_at | string | timestamp without time zone | ✓ | - |
| assigned_by | string | uuid | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 439. `user_roles`

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
| user_id | string | text | ✗ | - |
| role | string | text | ✗ | - |
| department_code | string | text | ✓ | - |
| level | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 440. `user_vetting_permissions`

**Description:** Cached user permissions to improve performance and reduce database load. Auto-expires after 1 hour.

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
| permissions | unknown | jsonb | ✗ | - |
| last_updated | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 441. `v_chat_issues`

**Description:** Identifies chat sessions with performance or satisfaction issues

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
| session_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | character varying | ✓ | - |
| chatbot_type | string | character varying | ✓ | - |
| company_name | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| performance_issue | string | text | ✓ | - |
| avg_response_time_ms | integer | integer | ✓ | - |
| total_messages | integer | integer | ✓ | - |
| avg_rating | number | numeric | ✓ | - |
| error_message_count | integer | bigint | ✓ | - |

---

### 442. `v_chat_session_summary`

**Description:** Summary of chat sessions with project context for IT dashboard

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
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| chatbot_type | string | character varying | ✓ | - |
| company_name | string | character varying | ✓ | - |
| organisation_name | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| project_phase_name | string | character varying | ✓ | - |
| session_title | string | character varying | ✓ | - |
| total_messages | integer | integer | ✓ | - |
| total_documents_referenced | integer | integer | ✓ | - |
| avg_response_time_ms | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| last_activity_at | string | timestamp with time zone | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| session_duration_minutes | number | numeric | ✓ | - |
| latest_message | string | text | ✓ | - |
| avg_user_rating | number | numeric | ✓ | - |

---

### 443. `v_company_project_chat_usage`

**Description:** Chat usage analytics grouped by company and project

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
| company_name | string | character varying | ✓ | - |
| organisation_name | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| project_phase_name | string | character varying | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| chatbot_type | string | character varying | ✓ | - |
| total_sessions | integer | bigint | ✓ | - |
| total_messages | integer | bigint | ✓ | - |
| total_documents_referenced | integer | bigint | ✓ | - |
| avg_response_time_ms | number | numeric | ✓ | - |
| unique_users | integer | bigint | ✓ | - |
| last_activity | string | timestamp with time zone | ✓ | - |
| sessions_last_7_days | integer | bigint | ✓ | - |
| sessions_previous_7_days | integer | bigint | ✓ | - |

---

### 444. `v_daily_chat_stats`

**Description:** Daily aggregated chat statistics by discipline and project

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
| date | string | date | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| chatbot_type | string | character varying | ✓ | - |
| company_name | string | character varying | ✓ | - |
| organisation_name | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| sessions_count | integer | bigint | ✓ | - |
| total_messages | integer | bigint | ✓ | - |
| total_documents_referenced | integer | bigint | ✓ | - |
| avg_response_time_ms | number | numeric | ✓ | - |
| unique_users | integer | bigint | ✓ | - |

---

### 445. `v_discipline_performance`

**Description:** Performance metrics for each discipline chatbot type

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
| discipline_code | string | character varying | ✓ | - |
| chatbot_type | string | character varying | ✓ | - |
| total_sessions | integer | bigint | ✓ | - |
| total_messages | integer | bigint | ✓ | - |
| avg_messages_per_session | number | numeric | ✓ | - |
| total_documents_referenced | integer | bigint | ✓ | - |
| avg_documents_per_session | number | numeric | ✓ | - |
| avg_response_time_ms | number | numeric | ✓ | - |
| unique_users | integer | bigint | ✓ | - |
| unique_companies | integer | bigint | ✓ | - |
| unique_projects | integer | bigint | ✓ | - |
| avg_user_satisfaction | number | numeric | ✓ | - |
| last_activity | string | timestamp with time zone | ✓ | - |
| active_today | integer | bigint | ✓ | - |
| active_this_week | integer | bigint | ✓ | - |

---

### 446. `v_document_types_lookup`

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
| document_type_code | string | character varying | ✓ | - |
| document_type | string | character varying | ✓ | - |
| numbering_pattern | string | text | ✓ | - |
| description | string | text | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| discipline_name | string | character varying | ✓ | - |
| company_id | string | uuid | ✓ | Note:
This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> |

---

### 447. `v_document_usage_analytics`

**Description:** Analytics on which documents are most referenced in chats

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
| discipline_code | string | character varying | ✓ | - |
| company_name | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| document_reference | string | text | ✓ | - |
| reference_count | integer | bigint | ✓ | - |
| sessions_referencing | integer | bigint | ✓ | - |
| users_referencing | integer | bigint | ✓ | - |
| avg_rating_when_referenced | number | numeric | ✓ | - |
| last_referenced | string | timestamp with time zone | ✓ | - |

---

### 448. `v_financial_overdue`

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
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| reference | string | character varying | ✓ | - |
| description | string | text | ✓ | - |
| amount | number | numeric | ✓ | - |
| due_date | string | date | ✓ | - |
| vendor | string | character varying | ✓ | - |
| project | string | character varying | ✓ | - |
| category | string | character varying | ✓ | - |
| days_overdue | integer | integer | ✓ | - |

---

### 449. `v_financial_summary`

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
| type | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| record_count | integer | bigint | ✓ | - |
| total_amount | number | numeric | ✓ | - |
| avg_amount | number | numeric | ✓ | - |
| min_amount | number | numeric | ✓ | - |
| max_amount | number | numeric | ✓ | - |
| categories | string | text | ✓ | - |
| earliest_date | string | date | ✓ | - |
| latest_date | string | date | ✓ | - |

---

### 450. `v_realtime_chat_activity`

**Description:** Real-time view of active chat sessions

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
| session_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| chatbot_type | string | character varying | ✓ | - |
| company_name | string | character varying | ✓ | - |
| project_name | string | character varying | ✓ | - |
| session_title | string | character varying | ✓ | - |
| last_activity_at | string | timestamp with time zone | ✓ | - |
| minutes_since_last_activity | number | numeric | ✓ | - |
| activity_status | string | text | ✓ | - |
| latest_message_role | string | character varying | ✓ | - |
| latest_message_preview | string | text | ✓ | - |
| total_messages | integer | integer | ✓ | - |
| avg_response_time_ms | integer | integer | ✓ | - |

---

### 451. `vector_deletion_audit`

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
| vector_id | string | uuid | ✗ | - |
| table_name | string | text | ✗ | - |
| deleted_by | string | uuid | ✓ | - |
| deletion_reason | string | text | ✓ | - |
| deletion_type | string | text | ✓ | - |
| restored_at | string | timestamp with time zone | ✓ | - |
| restored_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 452. `vector_deletion_policies`

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
| policy_name | string | text | ✗ | - |
| applies_to_scope | string | text | ✓ | - |
| retention_period | string | interval | ✓ | - |
| auto_delete | boolean | boolean | ✓ | - |
| requires_approval | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 453. `vector_search_criteria`

**Description:** Stores dynamic search criteria for vector similarity searches across all disciplines

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
| discipline | string | text | ✗ | Discipline identifier (e.g., contracts_post_award, civil_engineering) |
| table_name | string | text | ✗ | Name of the vector table to search (e.g., a_00435_contracts_post_vector) |
| search_name | string | text | ✗ | Unique identifier for this search configuration within the discipline |
| description | string | text | ✓ | - |
| filter_criteria | unknown | jsonb | ✗ | JSONB object containing the filter criteria for the search |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 454. `vector_system_health`

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

**Columns:** 2

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| component | string | text | ✓ | - |
| total_tables | integer | bigint | ✓ | - |

---

### 455. `vector_workspaces`

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
| name | string | text | ✗ | - |
| description | string | text | ✓ | - |
| workspace_type | string | text | ✓ | - |
| created_by | string | uuid | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| discipline_restrictions | array | text[] | ✓ | - |
| auto_cleanup_after | string | interval | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |
| is_active | boolean | boolean | ✓ | - |

---

### 456. `vessels`

**Description:** Stores vessel/ship information from VesselFinder API

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
| imo | string | character varying | ✓ | - |
| mmsi | string | character varying | ✓ | - |
| vessel_name | string | character varying | ✗ | - |
| call_sign | string | character varying | ✓ | - |
| vessel_type | string | character varying | ✓ | - |
| vessel_class | string | character varying | ✓ | - |
| flag_country | string | character varying | ✓ | - |
| gross_tonnage | integer | integer | ✓ | - |
| deadweight_tonnage | integer | integer | ✓ | - |
| length_overall | number | numeric | ✓ | - |
| beam | number | numeric | ✓ | - |
| draught | number | numeric | ✓ | - |
| built_year | integer | integer | ✓ | - |
| latitude | number | numeric | ✓ | - |
| longitude | number | numeric | ✓ | - |
| speed_knots | number | numeric | ✓ | - |
| course | number | numeric | ✓ | - |
| heading | number | numeric | ✓ | - |
| status | string | character varying | ✓ | - |
| destination | string | character varying | ✓ | - |
| eta | string | timestamp with time zone | ✓ | - |
| vesselfinder_id | string | character varying | ✓ | - |
| last_position_update | string | timestamp with time zone | ✓ | - |
| api_data | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| company_id | string | uuid | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 457. `vetting_access_log`

**Description:** Audit log for all user access attempts to contractor vetting functionality. Used for security compliance and monitoring.

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
| user_id | string | uuid | ✗ | - |
| contractor_id | string | uuid | ✓ | - |
| action | string | character varying | ✗ | - |
| resource | string | character varying | ✗ | - |
| access_granted | boolean | boolean | ✓ | - |
| reason_denied | string | text | ✓ | - |
| discipline | string | character varying | ✓ | - |
| company_count | integer | integer | ✓ | - |
| project_count | integer | integer | ✓ | - |
| ip_address | string | inet | ✓ | - |
| user_agent | string | text | ✓ | - |
| session_id | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |

---

### 458. `vetting_access_summary`

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
| access_date | string | timestamp with time zone | ✓ | - |
| discipline | string | character varying | ✓ | - |
| action | string | character varying | ✓ | - |
| access_granted | boolean | boolean | ✓ | - |
| access_count | integer | bigint | ✓ | - |
| unique_users | integer | bigint | ✓ | - |

---

### 459. `vetting_evaluation_audit`

**Description:** Detailed audit trail for vetting evaluation actions, linking evaluations with user permissions at time of action.

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
| evaluation_id | string | uuid | ✗ | - |
| user_id | string | uuid | ✗ | - |
| action | string | character varying | ✗ | - |
| section | string | character varying | ✓ | - |
| changes | unknown | jsonb | ✓ | - |
| user_discipline | string | character varying | ✓ | - |
| user_company_affiliations | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| ip_address | string | inet | ✓ | - |
| session_id | string | text | ✓ | - |

---

### 460. `workflow_routing_steps`

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
| step_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `routing_template_steps.id`.<fk table='routing_template_steps' column='id'/> |
| step_order | integer | integer | ✗ | - |
| step_name | string | character varying | ✗ | - |
| step_status | string | character varying | ✓ | - |
| routing_mode | string | character varying | ✓ | - |
| required_actions | integer | integer | ✓ | - |
| completed_actions | integer | integer | ✓ | - |
| deadline | string | timestamp with time zone | ✓ | - |
| started_at | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| esculated_at | string | timestamp with time zone | ✓ | - |
| escalated_to | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 461. `workspace_members`

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
| workspace_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/>
This is a Foreign Key to `vector_workspaces.id`.<fk table='vector_workspaces' column='id'/> |
| user_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| access_level | string | text | ✓ | - |
| added_by | string | uuid | ✓ | - |
| added_at | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |

---


**📝 Generated**: 2026-03-12T03:45:30.579Z
**📊 Tables Documented**: 32
**🏗️ System**: Construct AI Database Schema - Part 4
