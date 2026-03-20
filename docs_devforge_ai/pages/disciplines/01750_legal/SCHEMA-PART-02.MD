# 📊 Schema Part 2: Tables 144-286 (D-P alphabetically)

**Database schema documentation for Construct AI - Part 2 of 3.**

## 📋 Overview

This document contains detailed schema information for tables 144-286 (alphabetically ordered).

## 📊 Part Statistics

- **Tables in Part**: 143
- **Total Tables**: 461
- **Generated**: 2026-03-12T03:45:30.579Z

## 📖 Table Documentation

### 144. `contractor_vetting_dashboard_stats`

**Description:** Dashboard statistics for contractor vetting

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
| stat_date | string | date | ✓ | Date for which statistics are recorded |
| total_contractors | integer | integer | ✓ | Total number of contractors in system |
| average_score | integer | integer | ✓ | Average vetting score |
| high_scores_count | integer | integer | ✓ | Count of contractors with high scores (85+) |
| pending_reviews_count | integer | integer | ✓ | Count of pending reviews |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 145. `contractor_vetting_document_hashes`

**Description:** Document hashes for deduplication and incremental ingestion per 1300_00220

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
| document_id | string | uuid | ✓ | Reference to main document

Note:
This is a Foreign Key to `a_02400_contractor_vetting_documents.id`.<fk table='a_02400_contractor_vetting_documents' column='id'/> |
| version | string | text | ✗ | Document version for hash uniqueness |
| document_hash | string | text | ✗ | SHA-256 hash of entire document for deduplication |
| content_hash | string | text | ✗ | SHA-256 hash of content for incremental ingestion |
| chunk_id | string | text | ✓ | Chunk identifier for vector store deduplication |
| file_size | integer | bigint | ✓ | - |
| mime_type | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| source_path | string | text | ✓ | Original file path for tracking |
| department_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 146. `contractor_vetting_document_parts`

**Description:** Document parts for discrete additions per 1300_00220

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
| document_id | string | uuid | ✓ | Reference to main document

Note:
This is a Foreign Key to `a_02400_contractor_vetting_documents.id`.<fk table='a_02400_contractor_vetting_documents' column='id'/> |
| part_number | string | text | ✗ | Part identifier |
| part_title | string | text | ✓ | - |
| content_hash | string | text | ✗ | Hash of this specific part |
| part_content | string | text | ✓ | Extracted content for this part |
| start_page | integer | integer | ✓ | - |
| end_page | integer | integer | ✓ | - |
| word_count | integer | integer | ✓ | - |
| character_count | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| version | string | text | ✓ | - |
| parent_part_id | string | uuid | ✓ | Parent part for hierarchical structure

Note:
This is a Foreign Key to `contractor_vetting_document_parts.id`.<fk table='contractor_vetting_document_parts' column='id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 147. `contractor_vetting_documents`

**Description:** Uploaded documents for contractor vetting

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
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| vetting_id | integer | integer | ✓ | Reference to the vetting record

Note:
This is a Foreign Key to `contractor_vetting.id`.<fk table='contractor_vetting' column='id'/> |
| section_id | integer | integer | ✓ | Reference to the specific section this document belongs to

Note:
This is a Foreign Key to `contractor_vetting_sections.id`.<fk table='contractor_vetting_sections' column='id'/> |
| file_name | string | character varying | ✗ | Stored file name |
| original_file_name | string | character varying | ✓ | Original uploaded file name |
| file_path | string | text | ✓ | Path to the stored file |
| file_size | integer | bigint | ✓ | File size in bytes |
| mime_type | string | character varying | ✓ | MIME type of the file |
| upload_timestamp | string | timestamp with time zone | ✓ | - |
| document_type | string | character varying | ✓ | Type of document (financial, license, etc.) |
| processing_status | string | text | ✓ | Status of document processing |
| processing_result | string | text | ✓ | Results from document processing |
| extracted_data | unknown | jsonb | ✓ | JSON data extracted from the document |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 148. `contractor_vetting_ingestion_registry`

**Description:** Registry for tracking document ingestion status per 1300_00220

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
| document_hash | string | text | ✗ | Document hash for deduplication |
| content_hash | string | text | ✗ | Content hash for incremental processing |
| ingestion_status | string | text | ✓ | Current ingestion status |
| ingestion_timestamp | string | timestamp with time zone | ✓ | - |
| completion_timestamp | string | timestamp with time zone | ✓ | - |
| error_message | string | text | ✓ | - |
| retry_count | integer | integer | ✓ | - |
| vector_store_id | string | text | ✓ | Reference to vector store record |
| metadata | unknown | jsonb | ✓ | Additional ingestion metadata |
| department_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 149. `contractor_vetting_sections`

**Description:** Individual sections of the contractor vetting process

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
| vetting_id | integer | integer | ✓ | Note:
This is a Foreign Key to `contractor_vetting.id`.<fk table='contractor_vetting' column='id'/> |
| section_name | string | character varying | ✗ | Internal section identifier (details, financial, licensing, etc.) |
| section_title | string | character varying | ✗ | Display title for the section |
| status | string | text | ✓ | Status of this section |
| score | integer | integer | ✓ | Score for this section (0-100) |
| analysis_text | string | text | ✓ | AI analysis output for this section |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 150. `contractors`

**Description:** Table to store contractor information for projects

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
| name | string | character varying | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| address | string | text | ✓ | Physical address of the contractor. |
| email | string | text | ✓ | Primary contact email address for the contractor. |
| phone | string | text | ✓ | Primary contact phone number for the contractor. |
| contact_person | string | text | ✓ | Name of the primary contact person at the contractor. |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| contractor_type | string | text | ✓ | Type of contractor (e.g., general, electrical, plumbing) |
| construction_type | string | text | ✓ | Type of construction (EPCM, EPC, Construction Only, Design-Build) |
| sector | string | text | ✓ | Industry sector (Mining, Oil & Gas, Power Generation, etc) |
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 151. `contractors_backup_before_uuid_migration`

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
| id | integer | integer | ✓ | - |
| name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| address | string | text | ✓ | - |
| email | string | text | ✓ | - |
| phone | string | text | ✓ | - |
| contact_person | string | text | ✓ | - |
| project_id | string | uuid | ✓ | - |
| contractor_type | string | text | ✓ | - |
| construction_type | string | text | ✓ | - |
| sector | string | text | ✓ | - |

---

### 152. `contracts`

**Description:** Contracts associated with contractors on projects

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
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| contractor_id | integer | integer | ✓ | - |
| contract_number | string | character varying | ✗ | - |
| contract_type | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| contract_type_id | string | uuid | ✓ | Note:
This is a Foreign Key to `dropdown_options.id`.<fk table='dropdown_options' column='id'/> |
| category | string | text | ✓ | Category associated with the contract, e.g., Contracts information. |
| working_zones | array | text[] | ✓ | Array of working zones or areas applicable to the contract. |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |
| assigned_to | string | character varying | ✓ | - |

---

### 153. `contracts_post_summary`

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
| contract_status | string | character varying | ✓ | - |
| contract_count | integer | bigint | ✓ | - |
| total_value | number | numeric | ✓ | - |
| avg_progress | number | numeric | ✓ | - |
| total_documents | integer | bigint | ✓ | - |
| latest_contract | string | timestamp with time zone | ✓ | - |

---

### 154. `contributor_assignments`

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
| contributor_id | string | uuid | ✓ | Note:
This is a Foreign Key to `contributors.id`.<fk table='contributors' column='id'/> |
| page_id | string | uuid | ✓ | - |
| branch_name | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| assigned_at | string | timestamp without time zone | ✓ | - |
| completed_at | string | timestamp without time zone | ✓ | - |
| modal_configuration_id | string | uuid | ✓ | - |
| github_branch_url | string | text | ✓ | - |
| auto_generated_files | unknown | jsonb | ✓ | - |
| notes | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 155. `contributors`

**Description:** Enhanced contributors table with full GitHub integration

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
| name | string | text | ✗ | - |
| github_username | string | text | ✓ | - |
| email | string | text | ✓ | - |
| avatar_url | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| bio | string | text | ✓ | - |
| github_id | integer | integer | ✓ | GitHub user ID (unique identifier) |
| github_login | string | text | ✓ | GitHub username/login |
| display_name | string | text | ✓ | Display name (GitHub name or fallback to login) |
| company | string | text | ✓ | Company from GitHub profile |
| location | string | text | ✓ | Location from GitHub profile |
| blog | string | text | ✓ | Blog/website URL from GitHub profile |
| twitter_username | string | text | ✓ | Twitter username from GitHub profile |
| public_repos | integer | integer | ✓ | - |
| public_gists | integer | integer | ✓ | - |
| followers | integer | integer | ✓ | - |
| following | integer | integer | ✓ | - |
| hireable | boolean | boolean | ✓ | Whether user is available for hire |
| github_created_at | string | timestamp with time zone | ✓ | When GitHub account was created |
| github_updated_at | string | timestamp with time zone | ✓ | When GitHub profile was last updated |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 156. `correspondence_training_data`

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
| simulation_id | string | text | ✗ | - |
| step_id | string | text | ✗ | - |
| specialist | string | text | ✗ | - |
| correspondence_text | string | text | ✗ | - |
| extracted_identifiers | unknown | jsonb | ✓ | - |
| retrieved_documents | unknown | jsonb | ✓ | - |
| specialist_analysis | string | text | ✗ | - |
| confidence | number | numeric | ✓ | - |
| citations | unknown | jsonb | ✓ | - |
| quality_score | integer | integer | ✓ | - |
| domain_relevance_score | number | numeric | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| model_version | string | text | ✓ | - |
| training_status | string | text | ✓ | - |

---

### 157. `credential_rotation_logs`

**Description:** Audit trail for API credential rotation activities

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
| api_config_id | string | uuid | ✗ | - |
| rotation_type | string | text | ✗ | - |
| old_key_hash | string | text | ✓ | - |
| new_key_hash | string | text | ✓ | - |
| rotated_by | string | uuid | ✓ | - |
| rotated_at | string | timestamp with time zone | ✗ | - |
| reason | string | text | ✓ | - |
| success | boolean | boolean | ✗ | - |
| error_message | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |

---

### 158. `custom_assignments`

**Description:** Stores custom discipline assignments for SOW templates, replacing localStorage usage

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
| template_id | string | uuid | ✗ | Reference to sow_templates.id |
| order_type | string | text | ✗ | Order type (purchase_order, work_order, service_order) |
| organization_id | string | uuid | ✗ | Organization that owns these custom assignments |
| assignments | unknown | jsonb | ✗ | JSON object containing appendix-to-discipline mappings |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 159. `custom_document_types`

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
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_code | string | text | ✗ | - |
| document_type | string | character varying | ✗ | - |
| document_type_code | string | character varying | ✗ | - |
| category | string | character varying | ✓ | - |
| description | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 160. `customized`

**Description:** App-wide dropdown options shared across multiple modals

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
| dropdown_id | string | character varying | ✗ | - |
| options | string | text | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 161. `cv_analyses`

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
| candidate_name | string | text | ✓ | - |
| position_applied | string | text | ✓ | - |
| experience_level | string | text | ✓ | - |
| years_experience | integer | integer | ✓ | - |
| job_title | string | text | ✓ | - |
| job_department | string | text | ✓ | - |
| overall_rating | number | numeric | ✓ | - |
| analysis_data | unknown | jsonb | ✓ | - |
| ai_model | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 162. `cv_application_stats`

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
| total_applications | integer | bigint | ✓ | - |
| pending_count | integer | bigint | ✓ | - |
| under_review_count | integer | bigint | ✓ | - |
| interview_scheduled_count | integer | bigint | ✓ | - |
| approved_count | integer | bigint | ✓ | - |
| rejected_count | integer | bigint | ✓ | - |
| on_hold_count | integer | bigint | ✓ | - |
| average_rating | number | numeric | ✓ | - |
| applications_this_week | integer | bigint | ✓ | - |
| applications_this_month | integer | bigint | ✓ | - |

---

### 163. `cv_applications`

**Description:** Stores CV/job application data for HR CV Processing system

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

**Columns:** 66

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| applicant_name | string | character varying | ✗ | - |
| email | string | character varying | ✗ | - |
| phone | string | character varying | ✓ | - |
| position_applied | string | character varying | ✗ | - |
| status | string | character varying | ✗ | Application status: pending, under_review, interview_scheduled, approved, rejected, on_hold |
| years_experience | integer | integer | ✓ | - |
| education_level | string | character varying | ✓ | - |
| skills | array | text[] | ✓ | Array of candidate skills and competencies |
| certifications | array | text[] | ✓ | Professional certifications data |
| salary_expectation | number | numeric | ✓ | - |
| currency | string | character varying | ✓ | - |
| availability_date | string | date | ✓ | - |
| employment_type | string | character varying | ✓ | Type of employment: full_time, part_time, contract, freelance, internship |
| location | string | character varying | ✓ | - |
| remote_work_preference | string | character varying | ✓ | Remote work preference: on_site, remote, hybrid |
| cv_file_url | string | text | ✓ | - |
| cover_letter_url | string | text | ✓ | - |
| portfolio_url | string | text | ✓ | - |
| additional_documents_urls | array | text[] | ✓ | - |
| interview_stage | string | character varying | ✓ | - |
| interview_date | string | timestamp with time zone | ✓ | Scheduled interview date |
| interview_notes | string | text | ✓ | - |
| interviewer_id | string | uuid | ✓ | - |
| technical_score | integer | integer | ✓ | - |
| communication_score | integer | integer | ✓ | - |
| culture_fit_score | integer | integer | ✓ | - |
| overall_rating | number | numeric | ✓ | - |
| hr_notes | string | text | ✓ | - |
| feedback | string | text | ✓ | - |
| rejection_reason | string | text | ✓ | - |
| application_source | string | character varying | ✓ | - |
| referral_source | string | character varying | ✓ | - |
| priority_level | string | character varying | ✓ | Priority level for processing: low, normal, high, urgent |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| applied_date | string | date | ✓ | - |
| last_contact_date | string | date | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| additional_info | unknown | jsonb | ✓ | Additional flexible information stored as JSON |
| custom_fields | unknown | jsonb | ✓ | Custom fields for organization-specific data |
| discipline | string | character varying | ✓ | Applicant's discipline or department (formerly department) |
| address | string | text | ✓ | - |
| scoring_details | unknown | jsonb | ✓ | - |
| analysis_type | string | character varying | ✓ | - |
| analysis_timestamp | string | timestamp with time zone | ✓ | - |
| original_notes | string | text | ✓ | - |
| openai_feedback | string | text | ✓ | AI-generated feedback |
| date_of_birth | string | date | ✓ | Candidate date of birth |
| professional_summary | string | text | ✓ | Professional summary from CV |
| work_experience | unknown | jsonb | ✓ | Structured work history data |
| education | unknown | jsonb | ✓ | Education history data |
| projects | unknown | jsonb | ✓ | Key projects from resume |
| extracted_emails | string | text | ✓ | - |
| extracted_phones | string | text | ✓ | - |
| application_date | string | date | ✓ | When the application was submitted |
| linkedin | string | character varying | ✓ | - |
| cv_file | string | character varying | ✓ | - |
| availability | string | character varying | ✓ | Available start date or notice period |
| cover_letter | string | text | ✓ | Cover letter content if provided |
| experience_level | string | character varying | ✓ | Entry, mid, or senior level |
| notes | string | text | ✓ | - |
| rating | number | numeric | ✓ | - |
| opennai_feedback | string | text | ✓ | OpenAI feedback (typo from CV processing code) |

---

### 164. `dashboard_progress`

**Description:** Stores progress data displayed on user dashboards

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
| user_id | string | uuid | ✗ | - |
| order_id | string | uuid | ✓ | - |
| progress_data | unknown | jsonb | ✗ | - |
| last_updated | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 165. `data_sheet_specifications`

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
| template_id | string | uuid | ✓ | - |
| spec_type | string | text | ✓ | - |
| spec_code | string | text | ✓ | - |
| spec_name | string | text | ✓ | - |
| specifications | unknown | jsonb | ✓ | - |
| compliance_standards | array | text[] | ✓ | - |
| safety_requirements | array | text[] | ✓ | - |
| supplier_name | string | text | ✓ | - |
| manufacturer | string | text | ✓ | - |
| model_number | string | text | ✓ | - |
| serial_number | string | text | ✓ | - |
| issue_date | string | date | ✓ | - |
| expiry_date | string | date | ✓ | - |
| revision_number | integer | integer | ✓ | - |
| procurement_code | string | text | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 166. `defects`

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
| defect_id | string | character varying | ✗ | - |
| inspection_item_id | string | character varying | ✗ | Note:
This is a Foreign Key to `inspection_items.item_id`.<fk table='inspection_items' column='item_id'/> |
| defect_type | string | character varying | ✗ | - |
| severity | string | character varying | ✓ | - |
| description | string | text | ✗ | - |
| location | string | character varying | ✓ | - |
| assigned_to | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| priority | string | character varying | ✓ | - |
| due_date | string | date | ✓ | - |
| resolved_date | string | date | ✓ | - |
| resolution_notes | string | text | ✓ | - |
| cost_estimate | number | numeric | ✓ | - |
| media_urls | unknown | jsonb | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| created_by | string | character varying | ✓ | - |
| updated_by | string | character varying | ✓ | - |

---

### 167. `discipline_document_paths`

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
| organisation_id | string | uuid | ✗ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| discipline_id | string | uuid | ✗ | - |
| document_type_id | string | uuid | ✗ | Note:
This is a Foreign Key to `document_types_by_discipline.id`.<fk table='document_types_by_discipline' column='id'/> |
| path_configuration | unknown | jsonb | ✗ | - |
| path_template | string | character varying | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| is_default | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 168. `discipline_document_sections`

**Description:** Flexible document sections system allowing disciplines to define their own appendix, schedule, and attachment structures

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
| discipline_code | string | character varying | ✗ | - |
| organization_id | string | uuid | ✗ | - |
| section_code | string | character varying | ✗ | Unique code within discipline (e.g., appendix_a, schedule_1) |
| section_name | string | character varying | ✗ | - |
| section_type | string | character varying | ✗ | Type of section: appendix, schedule, attachment, exhibit, policy, procedure |
| display_order | integer | integer | ✗ | - |
| required | boolean | boolean | ✓ | - |
| allows_multiple_types | boolean | boolean | ✓ | - |
| available_document_types | unknown | jsonb | ✓ | JSON array of allowed document types for this section |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| contract_type | string | character varying | ✓ | Contract type for filtering: po (procurement orders), wo (work orders), so (service orders), general (general sections) |
| default_document_type | string | character varying | ✓ | - |
| parent_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `discipline_document_sections.id`.<fk table='discipline_document_sections' column='id'/> |

---

### 169. `discipline_evaluation_weights`

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
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| evaluation_context | string | character varying | ✗ | - |
| discipline_code | string | character varying | ✗ | - |
| discipline_name | string | character varying | ✗ | - |
| weight_percentage | number | numeric | ✗ | - |
| scoring_criteria | unknown | jsonb | ✓ | - |
| max_score | integer | integer | ✓ | - |
| passing_score | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

### 170. `discipline_extraction_prompts`

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
| discipline_code | string | character varying | ✗ | - |
| display_name | string | character varying | ✗ | - |
| system_prompt | string | text | ✗ | - |
| extraction_fields | unknown | jsonb | ✗ | - |
| extraction_focus | unknown | jsonb | ✗ | - |
| document_types | unknown | jsonb | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| version | integer | integer | ✓ | - |
| created_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 171. `discipline_template_config`

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
| discipline | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| allowed_template_types | array | text[] | ✗ | - |
| requires_approval | boolean | boolean | ✓ | - |
| max_templates_per_user | integer | integer | ✓ | - |
| description | string | text | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |

---

### 172. `discipline_template_constraints`

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
| discipline_name | string | text | ✗ | - |
| table_name | string | text | ✗ | - |
| allowed_template_types | array | text[] | ✓ | - |
| description | string | text | ✓ | - |
| is_active | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 173. `disciplines`

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
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| page_id | string | uuid | ✗ | - |
| name | string | text | ✗ | - |
| code | string | text | ✗ | - |
| slug | string | text | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| organization_name | string | text | ✓ | - |
| sector_id | string | uuid | ✓ | - |
| sector_name | string | text | ✓ | - |
| parent_discipline_id | string | uuid | ✓ | - |
| hierarchy_level | integer | integer | ✓ | - |
| display_order | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| is_standard_link | boolean | boolean | ✓ | - |
| is_virtual | boolean | boolean | ✓ | - |
| organization_ids | array | uuid[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

### 174. `document_access_logs`

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
| document_id | string | uuid | ✗ | - |
| user_id | string | text | ✓ | - |
| tender_id | string | uuid | ✗ | - |
| access_type | string | character varying | ✗ | - |
| accessed_at | string | timestamp without time zone | ✓ | - |

---

### 175. `document_ai_analysis`

**Description:** Stores AI analysis results for uploaded documents including confidence scores and human corrections

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
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| analysis_results | unknown | jsonb | ✗ | JSON containing AI extracted metadata, document type, entities, etc. |
| confidence_scores | unknown | jsonb | ✗ | JSON containing confidence scores for each AI prediction |
| human_corrections | unknown | jsonb | ✓ | JSON containing any manual corrections made by users |
| processing_status | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 176. `document_analysis_feedback`

**Description:** Tracks AI learning from user corrections and feedback

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
| user_id | string | uuid | ✗ | - |
| original_analysis | unknown | jsonb | ✓ | - |
| user_correction | unknown | jsonb | ✓ | - |
| document_content | string | text | ✓ | - |
| feedback_type | string | text | ✓ | - |
| confidence_score | number | numeric | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 177. `document_analysis_prompts`

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
| prompt_type | string | character varying | ✗ | - |
| document_type | string | character varying | ✗ | - |
| discipline_id | string | character varying | ✓ | - |
| prompt_text | string | text | ✗ | - |
| model_parameters | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 178. `document_categories`

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
| category_code | string | character varying | ✗ | - |
| category_name | string | text | ✗ | - |
| description | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 179. `document_comparisons`

**Description:** Table for storing document comparison results

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
| id | string | uuid | ✗ | Unique identifier for each comparison

Note:
This is a Primary Key.<pk/> |
| document_ids | array | uuid[] | ✗ | Array of document IDs that were compared |
| mode | string | text | ✗ | Comparison mode: pairwise or consolidated |
| result | unknown | jsonb | ✓ | JSON result of the comparison |
| created_at | string | timestamp with time zone | ✓ | Timestamp when comparison was created |
| created_by | string | uuid | ✓ | User ID who created the comparison |
| options | unknown | jsonb | ✓ | Options used for the comparison |

---

### 180. `document_download_queue`

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
| tender_id | string | uuid | ✗ | - |
| document_url | string | text | ✗ | - |
| document_type | string | character varying | ✗ | - |
| source_name | string | character varying | ✓ | - |
| priority | integer | integer | ✓ | - |
| status | string | character varying | ✓ | - |
| queue_order | integer | integer | ✓ | - |
| download_options | unknown | jsonb | ✓ | - |
| expected_file_size | integer | integer | ✓ | - |
| retry_count | integer | integer | ✓ | - |
| max_retries | integer | integer | ✓ | - |
| error_message | string | text | ✓ | - |
| started_at | string | timestamp without time zone | ✓ | - |
| scheduled_at | string | timestamp without time zone | ✓ | - |
| completed_at | string | timestamp without time zone | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| created_by | string | text | ✓ | - |
| user_ip | string | text | ✓ | - |
| user_agent | string | text | ✓ | - |
| document_name | string | text | ✓ | - |
| source | string | character varying | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 181. `document_embeddings`

**Description:** Direct embeddings storage bypassing Flowise document store system

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
| content | string | text | ✗ | - |
| embedding | string | extensions.vector(1536) | ✓ | Vector embedding (1536 dimensions for OpenAI text-embedding-ada-002) |
| metadata | unknown | jsonb | ✓ | JSON metadata including pagePrefix, discipline, security level, etc. |
| source | string | text | ✓ | - |
| page | integer | integer | ✓ | - |
| section | string | text | ✓ | - |
| chunk_id | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| document_store_id | string | uuid | ✓ | UUID reference to document_stores table for department routing

Note:
This is a Foreign Key to `document_stores.id`.<fk table='document_stores' column='id'/> |
| discipline_code | string | text | ✓ | Page prefix/discipline code for department-specific routing |
| flowise_store_id | string | text | ✓ | Flowise store ID for integration when available |

---

### 182. `document_hashes`

**Description:** Table for storing document content hashes to prevent duplication during ingestion

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
| id | string | uuid | ✗ | Unique identifier for each hash record

Note:
This is a Primary Key.<pk/> |
| doc_id | string | uuid | ✗ | Reference to the document this hash belongs to |
| version | string | text | ✗ | Version of the document (semver-like format) |
| hash | string | text | ✗ | SHA-256 hash of document content |
| chunk_id | string | text | ✓ | Identifier for document chunk (if applicable) |
| timestamp | string | timestamp with time zone | ✓ | Timestamp when hash was created |
| source_path | string | text | ✓ | Original path of the document source |
| department_id | string | uuid | ✓ | Department associated with this document |

---

### 183. `document_hierarchy_definitions`

**Description:** Defines hierarchical structures for different document types (Part/Section/Clause/etc.)

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
| discipline_id | string | text | ✗ | - |
| document_type | string | text | ✗ | - |
| hierarchy_levels | unknown | jsonb | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 184. `document_number_audit_log`

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
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| discipline_code | string | text | ✗ | - |
| document_type | string | text | ✗ | - |
| organization_id | string | text | ✗ | - |
| company_id | integer | integer | ✗ | - |
| generated_number | string | text | ✗ | - |
| sequence_number | integer | integer | ✗ | - |
| context | unknown | jsonb | ✓ | - |
| generated_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 185. `document_number_sequences`

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
| discipline_code | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| document_type | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| current_value | integer | integer | ✗ | - |

---

### 186. `document_numbering_methodologies`

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
| organization_id | string | character varying | ✗ | - |
| company_id | integer | integer | ✓ | - |
| methodology_name | string | character varying | ✗ | - |
| methodology_description | string | text | ✓ | - |
| default_pattern | string | text | ✗ | - |
| pattern_variables | unknown | jsonb | ✓ | - |
| is_default | boolean | boolean | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |

---

### 187. `document_numbering_sequences`

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
| document_type_id | string | uuid | ✓ | Note:
This is a Foreign Key to `document_types_by_discipline.id`.<fk table='document_types_by_discipline' column='id'/> |
| sequence_key | string | character varying | ✗ | - |
| current_number | integer | integer | ✓ | - |
| last_generated_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 188. `document_processing_history`

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
| tender_id | string | uuid | ✗ | - |
| document_id | string | uuid | ✓ | - |
| document_url | string | text | ✗ | - |
| operation_type | string | character varying | ✗ | - |
| status | string | character varying | ✗ | - |
| error_message | string | text | ✓ | - |
| processing_time_ms | integer | integer | ✓ | - |
| file_size_processed | integer | integer | ✓ | - |
| metadata_collected | unknown | jsonb | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |

---

### 189. `document_processing_log`

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
| instance_id | string | uuid | ✓ | Note:
This is a Foreign Key to `form_instances.id`.<fk table='form_instances' column='id'/> |
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `governance_document_templates.id`.<fk table='governance_document_templates' column='id'/> |
| file_name | string | text | ✗ | - |
| file_type | string | text | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_name | string | text | ✓ | - |
| processing_type | string | text | ✗ | - |
| processing_status | string | text | ✗ | - |
| processing_message | string | text | ✓ | - |
| processing_details | unknown | jsonb | ✓ | - |
| processing_time_ms | integer | integer | ✓ | - |
| file_size | integer | integer | ✓ | - |
| extracted_fields_count | integer | integer | ✓ | - |
| error_details | unknown | jsonb | ✓ | - |
| stack_trace | string | text | ✓ | - |
| user_agent | string | text | ✓ | - |
| user_ip | string | text | ✓ | - |
| created_by | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 190. `document_processing_queue`

**Description:** Queue for tracking document processing status and progress

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
| file_id | string | text | ✗ | Unique identifier for the file being processed (before document creation) |
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| status | string | text | ✓ | - |
| progress | integer | integer | ✓ | Processing progress percentage (0-100) |
| metadata | unknown | jsonb | ✓ | - |
| ai_analysis | unknown | jsonb | ✓ | Temporary storage for AI analysis results during processing |
| error_message | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| processed_at | string | timestamp with time zone | ✓ | - |

---

### 191. `document_references`

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
| identifier | string | text | ✗ | - |
| document_type_id | string | uuid | ✗ | - |
| title | string | text | ✗ | - |
| file_path | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| vector_doc_ids | array | text[] | ✓ | - |
| organization_id | string | uuid | ✗ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 192. `document_routing_history`

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
| workflow_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `document_routing_workflows.id`.<fk table='document_routing_workflows' column='id'/> |
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| version_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_document_versions.id`.<fk table='a_00900_doccontrol_document_versions' column='id'/> |
| action_type | string | character varying | ✗ | - |
| action_description | string | text | ✓ | - |
| actor_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| actor_role | string | character varying | ✓ | - |
| old_status | string | character varying | ✓ | - |
| new_status | string | character varying | ✓ | - |
| step_name | string | character varying | ✓ | - |
| action_metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 193. `document_routing_templates`

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
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| template_name | string | character varying | ✗ | - |
| template_description | string | text | ✓ | - |
| document_type | string | character varying | ✓ | - |
| organization_id | integer | bigint | ✓ | - |
| creator_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| is_active | boolean | boolean | ✓ | - |
| is_default | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 194. `document_routing_workflows`

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
| id | integer | bigint | ✗ | Note:
This is a Primary Key.<pk/> |
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| version_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `a_00900_doccontrol_document_versions.id`.<fk table='a_00900_doccontrol_document_versions' column='id'/> |
| template_id | integer | bigint | ✓ | Note:
This is a Foreign Key to `document_routing_templates.id`.<fk table='document_routing_templates' column='id'/> |
| workflow_name | string | character varying | ✓ | - |
| workflow_status | string | character varying | ✓ | - |
| current_step_order | integer | integer | ✓ | - |
| initiated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| deadline | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 195. `document_sections`

**Description:** Stores detailed section content within hierarchical document structures

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
| structure_id | string | uuid | ✗ | Note:
This is a Foreign Key to `template_document_structures.id`.<fk table='template_document_structures' column='id'/> |
| section_path | string | text | ✗ | - |
| level_name | string | text | ✗ | - |
| level_number | string | text | ✗ | - |
| title | string | text | ✓ | - |
| content | unknown | jsonb | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| parent_section_id | string | uuid | ✓ | Note:
This is a Foreign Key to `document_sections.id`.<fk table='document_sections' column='id'/> |
| sort_order | integer | integer | ✓ | - |
| is_required | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 196. `document_stores`

**Description:** Logical grouping for documents to be managed and upserted via Flowise

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
| name | string | text | ✗ | Unique name for the document store |
| description | string | text | ✓ | Human-readable description of the store purpose |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| metadata | unknown | jsonb | ✓ | Additional configuration and metadata for the store |
| is_active | boolean | boolean | ✓ | Whether this store is currently active for new documents |
| flowise_id | string | character varying | ✓ | - |
| discipline_code | string | character varying | ✓ | - |
| security_level | string | character varying | ✓ | - |
| access_roles | unknown | jsonb | ✓ | - |
| store_type | string | character varying | ✓ | - |
| doc_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 197. `document_type_relationships`

**Description:** Defines relationships between document types (e.g., scope_of_work can be part of purchase_order)

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
| child_type | string | text | ✗ | - |
| parent_type | string | text | ✗ | - |
| relationship_type | string | text | ✗ | - |
| is_common | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 198. `document_types`

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
| name | string | text | ✗ | - |
| code | string | text | ✗ | - |
| discipline_code | string | text | ✗ | - |
| category | string | text | ✗ | - |
| description | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 199. `document_types_by_discipline`

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
| discipline_code | string | character varying | ✗ | - |
| discipline_name | string | character varying | ✗ | - |
| document_type | string | character varying | ✗ | - |
| document_type_code | string | character varying | ✗ | - |
| numbering_pattern | string | text | ✗ | - |
| numbering_explanation | string | text | ✗ | - |
| organization_id | string | character varying | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| auto_increment_start | integer | integer | ✓ | - |
| auto_increment_current | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| company_id | string | uuid | ✓ | Note:
This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> |
| supported_file_types | array | text[] | ✓ | Array of allowed file extensions for this document type (e.g., ["pdf", "docx"]) |
| template_categories | array | text[] | ✓ | Array of available template categories for this discipline (e.g., ["scope_of_work", "method_statement"]) |
| notification_templates | unknown | jsonb | ✓ | JSON configuration for email/SMS notification templates used in workflows |
| workflow_rules | unknown | jsonb | ✓ | JSON configuration for assignment and approval workflows (auto-evaluation, clarification requirements, etc.) |
| ui_labels | unknown | jsonb | ✓ | JSON configuration for user interface help text and labels |
| validation_rules | unknown | jsonb | ✓ | JSON configuration for file validation rules (max size, required fields, etc.) |

---

### 200. `document_variation_sections`

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
| variation_id | string | uuid | ✗ | Note:
This is a Foreign Key to `document_variations.id`.<fk table='document_variations' column='id'/> |
| section_code | string | character varying | ✗ | - |
| section_name | string | character varying | ✗ | - |
| section_type | string | character varying | ✗ | - |
| display_order | integer | integer | ✗ | - |
| required | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 201. `document_variations`

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
| discipline_code | string | character varying | ✗ | - |
| contract_type | string | character varying | ✓ | - |
| template_variation | string | character varying | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 202. `document_versions`

**Description:** Tracks all versions of documents for version control system

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
| document_id | string | uuid | ✗ | Reference to the parent document

Note:
This is a Foreign Key to `a_00900_doccontrol_documents.id`.<fk table='a_00900_doccontrol_documents' column='id'/> |
| version_number | string | text | ✗ | Semantic version number (e.g., 1.0.0, 1.2.3) |
| previous_version_id | string | uuid | ✓ | Reference to the previous version for rollback/compare

Note:
This is a Foreign Key to `document_versions.id`.<fk table='document_versions' column='id'/> |
| author_id | string | uuid | ✓ | User who created this version

Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| author_name | string | text | ✓ | Name of the author (cached for display) |
| version_notes | string | text | ✓ | Mandatory notes explaining changes in this version |
| change_summary | string | text | ✓ | Auto-generated or user-provided summary of changes |
| status | string | text | ✓ | Version status: draft, review, approved, archived, superseded |
| file_path | string | text | ✓ | Storage path for this version of the document |
| file_hash | string | text | ✓ | Content hash for integrity verification |
| file_size | integer | bigint | ✓ | Size of the document file in bytes |
| content_type | string | text | ✓ | MIME type of the document |
| metadata | unknown | jsonb | ✓ | Additional version-specific metadata |
| created_at | string | timestamp with time zone | ✓ | Timestamp when this version was created |
| updated_at | string | timestamp with time zone | ✓ | Timestamp when this version was last updated |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 203. `dropdown_options`

**Description:** Modal-specific dropdown options

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
| modal_id | string | character varying | ✗ | - |
| type | string | character varying | ✗ | - |
| value | string | text | ✗ | - |
| company_id | integer | integer | ✓ | - |
| contractor_id | integer | integer | ✓ | - |
| field_label | string | character varying | ✓ | - |
| project | string | character varying | ✓ | - |
| modal_name | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| type_contract | string | character varying | ✓ | - |
| language | string | character varying | ✓ | - |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |

---

### 204. `email_access_logs`

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
| email_send_id | string | uuid | ✗ | Note:
This is a Foreign Key to `email_sends.id`.<fk table='email_sends' column='id'/> |
| doc_id | string | text | ✗ | - |
| actor_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| accessed_at | string | timestamp with time zone | ✗ | - |
| ip | string | text | ✓ | - |
| user_agent | string | text | ✓ | - |

---

### 205. `email_ai_processing_queue`

**Description:** Queue for AI processing tasks on emails with user and organization-based access control

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
| email_id | string | uuid | ✗ | Note:
This is a Foreign Key to `emails.id`.<fk table='emails' column='id'/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| processing_type | string | character varying | ✗ | - |
| priority | integer | integer | ✓ | - |
| status | string | character varying | ✓ | - |
| result | unknown | jsonb | ✓ | - |
| confidence_score | number | numeric | ✓ | - |
| attempts | integer | integer | ✓ | - |
| max_attempts | integer | integer | ✓ | - |
| started_at | string | timestamp with time zone | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| error_message | string | text | ✓ | - |
| last_error_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Organization context for email processing (for shared access)

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 206. `email_attachments`

**Description:** Stores email attachment metadata and references to Supabase storage

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
| email_id | string | uuid | ✗ | Note:
This is a Foreign Key to `emails.id`.<fk table='emails' column='id'/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| filename | string | character varying | ✗ | - |
| content_type | string | character varying | ✓ | - |
| file_size | integer | bigint | ✓ | - |
| attachment_id | string | character varying | ✓ | - |
| storage_path | string | text | ✓ | - |
| storage_bucket | string | character varying | ✓ | - |
| is_inline | boolean | boolean | ✓ | - |
| content_id | string | character varying | ✓ | - |
| is_safe | boolean | boolean | ✓ | - |
| virus_scan_result | string | character varying | ✓ | - |
| virus_scan_at | string | timestamp with time zone | ✓ | - |
| download_count | integer | integer | ✓ | - |
| last_downloaded_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 207. `email_content_storage`

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
| email_id | string | uuid | ✗ | Note:
This is a Foreign Key to `emails.id`.<fk table='emails' column='id'/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| content_type | string | character varying | ✗ | - |
| original_size | integer | bigint | ✗ | - |
| compressed_size | integer | bigint | ✓ | - |
| compression_type | string | character varying | ✓ | - |
| storage_bucket | string | character varying | ✗ | - |
| storage_path | string | text | ✗ | - |
| encoding | string | character varying | ✓ | - |
| language | string | character varying | ✓ | - |
| access_count | integer | integer | ✓ | - |
| last_accessed_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 208. `email_drafts`

**Description:** Draft emails that haven't been sent yet

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
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| account_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_email_accounts.id`.<fk table='user_email_accounts' column='id'/> |
| to_emails | array | text[] | ✗ | - |
| cc_emails | array | text[] | ✓ | - |
| bcc_emails | array | text[] | ✓ | - |
| subject | string | text | ✗ | - |
| body_text | string | text | ✓ | - |
| body_html | string | text | ✓ | - |
| is_reply | boolean | boolean | ✓ | - |
| is_forward | boolean | boolean | ✓ | - |
| original_email_id | string | uuid | ✓ | Note:
This is a Foreign Key to `emails.id`.<fk table='emails' column='id'/> |
| priority | string | character varying | ✓ | - |
| scheduled_send_at | string | timestamp with time zone | ✓ | - |
| is_scheduled | boolean | boolean | ✓ | - |
| auto_saved_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 209. `email_notification_queue`

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
| approval_instance_id | string | uuid | ✓ | Note:
This is a Foreign Key to `governance_approval_instances.id`.<fk table='governance_approval_instances' column='id'/> |
| user_id | string | text | ✓ | - |
| email_type | string | text | ✗ | - |
| email_subject | string | text | ✓ | - |
| email_body | string | text | ✓ | - |
| send_after | string | timestamp with time zone | ✓ | - |
| sent_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 210. `email_notifications`

**Description:** Stores email notifications sent to users about workflow events

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
| subject | string | character varying | ✗ | - |
| body | string | text | ✗ | - |
| email_type | string | character varying | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| sent | boolean | boolean | ✓ | - |
| sent_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 211. `email_providers`

**Description:** Supported email providers (Gmail, Outlook, IMAP, etc.)

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
| display_name | string | character varying | ✗ | - |
| provider_type | string | character varying | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| configuration | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 212. `email_search_history`

**Description:** User search history for analytics and quick access

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
| search_query | string | text | ✗ | - |
| search_type | string | character varying | ✓ | - |
| search_filters | unknown | jsonb | ✓ | - |
| results_count | integer | integer | ✓ | - |
| execution_time_ms | integer | integer | ✓ | - |
| ai_interpretation | string | text | ✓ | - |
| ai_confidence | number | numeric | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 213. `email_send_attachments`

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
| email_send_id | string | uuid | ✗ | Note:
This is a Foreign Key to `email_sends.id`.<fk table='email_sends' column='id'/> |
| doc_id | string | text | ✗ | - |
| version_id | string | text | ✓ | - |
| file_key | string | text | ✓ | - |
| delivery_mode | string | text | ✗ | - |
| signed_url | string | text | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |
| size_bytes | integer | bigint | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |

---

### 214. `email_sends`

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
| actor_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| recipients_json | unknown | jsonb | ✗ | - |
| lists_json | unknown | jsonb | ✗ | - |
| template_id | string | text | ✓ | - |
| subject | string | text | ✗ | - |
| mode | string | text | ✗ | - |
| sent_at | string | timestamp with time zone | ✓ | - |
| provider_message_id | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |

---

### 215. `email_signatures`

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
| user_id | string | uuid | ✗ | - |
| content | string | text | ✗ | - |
| is_default | boolean | boolean | ✓ | - |
| type | string | text | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 216. `email_sync_log`

**Description:** Logs of email synchronization operations

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
| account_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_email_accounts.id`.<fk table='user_email_accounts' column='id'/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| sync_type | string | character varying | ✗ | - |
| sync_status | string | character varying | ✗ | - |
| emails_fetched | integer | integer | ✓ | - |
| emails_processed | integer | integer | ✓ | - |
| emails_failed | integer | integer | ✓ | - |
| new_emails | integer | integer | ✓ | - |
| updated_emails | integer | integer | ✓ | - |
| started_at | string | timestamp with time zone | ✗ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| duration_seconds | integer | integer | ✓ | - |
| error_message | string | text | ✓ | - |
| error_details | unknown | jsonb | ✓ | - |
| provider_response | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 217. `email_templates`

**Description:** Email templates for quick composition

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
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| category | string | character varying | ✓ | - |
| subject_template | string | text | ✓ | - |
| body_template | string | text | ✓ | - |
| variables | unknown | jsonb | ✓ | - |
| usage_count | integer | integer | ✓ | - |
| last_used_at | string | timestamp with time zone | ✓ | - |
| is_public | boolean | boolean | ✓ | - |
| is_system_template | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 218. `email_threads`

**Description:** Groups related emails into conversation threads

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
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✗ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| thread_id | string | character varying | ✗ | - |
| subject | string | text | ✗ | - |
| participants | array | text[] | ✓ | - |
| message_count | integer | integer | ✓ | - |
| unread_count | integer | integer | ✓ | - |
| has_attachments | boolean | boolean | ✓ | - |
| priority | string | character varying | ✓ | - |
| labels | array | text[] | ✓ | - |
| last_activity_at | string | timestamp with time zone | ✓ | - |
| is_archived | boolean | boolean | ✓ | - |
| is_deleted | boolean | boolean | ✓ | - |
| ai_summary | string | text | ✓ | - |
| ai_sentiment | string | character varying | ✓ | - |
| ai_priority_score | number | numeric | ✓ | - |
| ai_action_items | array | text[] | ✓ | - |
| ai_processed_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 219. `email_vector`

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
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| embedding | string | extensions.vector | ✗ | - |
| metadata | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |

---

### 220. `emails`

**Description:** Main table storing all email messages with full content and metadata

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

**Columns:** 44

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| user_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| account_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_email_accounts.id`.<fk table='user_email_accounts' column='id'/> |
| thread_id | string | uuid | ✓ | Note:
This is a Foreign Key to `email_threads.id`.<fk table='email_threads' column='id'/> |
| message_id | string | character varying | ✓ | - |
| provider_thread_id | string | uuid | ✓ | - |
| subject | string | text | ✗ | - |
| sender_email | string | character varying | ✗ | - |
| sender_name | string | character varying | ✓ | - |
| recipient_email | string | character varying | ✗ | - |
| recipient_name | string | character varying | ✓ | - |
| cc_emails | array | text[] | ✓ | - |
| bcc_emails | array | text[] | ✓ | - |
| reply_to_email | string | character varying | ✓ | - |
| body_text | string | text | ✓ | - |
| body_html | string | text | ✓ | - |
| snippet | string | text | ✓ | - |
| sent_date | string | timestamp with time zone | ✗ | - |
| received_date | string | timestamp with time zone | ✓ | - |
| is_read | boolean | boolean | ✓ | - |
| is_flagged | boolean | boolean | ✓ | - |
| is_important | boolean | boolean | ✓ | - |
| is_draft | boolean | boolean | ✓ | - |
| is_sent | boolean | boolean | ✓ | - |
| is_archived | boolean | boolean | ✓ | - |
| is_deleted | boolean | boolean | ✓ | - |
| is_spam | boolean | boolean | ✓ | - |
| has_attachments | boolean | boolean | ✓ | - |
| attachment_count | integer | integer | ✓ | - |
| priority | string | character varying | ✓ | - |
| labels | array | text[] | ✓ | - |
| ai_summary | string | text | ✓ | - |
| ai_sentiment | string | character varying | ✓ | - |
| ai_priority_score | number | numeric | ✓ | - |
| ai_action_items | array | text[] | ✓ | - |
| ai_entities | unknown | jsonb | ✓ | - |
| ai_processed_at | string | timestamp with time zone | ✓ | - |
| provider_data | unknown | jsonb | ✓ | - |
| search_vector | string | tsvector | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| sender_email_normalized | string | public.citext | ✓ | - |
| recipient_email_normalized | string | public.citext | ✓ | - |
| resolution_debug | unknown | jsonb | ✓ | - |

---

### 221. `equipment_documentation`

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
| equipment_id | string | uuid | ✗ | Note:
This is a Foreign Key to `operations_equipment.id`.<fk table='operations_equipment' column='id'/> |
| storage_service | string | public.storage_service_type | ✗ | - |
| storage_url | string | text | ✗ | - |
| document_id | string | character varying | ✗ | - |
| sections | unknown | jsonb | ✗ | - |
| compliance_standards | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 222. `error_implementations`

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
| error_tracking_id | string | uuid | ✗ | Note:
This is a Foreign Key to `error_trackings.id`.<fk table='error_trackings' column='id'/> |
| implementation_type | string | character varying | ✗ | - |
| status | string | character varying | ✗ | - |
| priority | string | character varying | ✓ | - |
| code_example | string | text | ✓ | - |
| technical_notes | string | text | ✓ | - |
| developer_assigned | string | character varying | ✓ | - |
| qa_validation_status | string | character varying | ✓ | - |
| deployment_status | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 223. `error_metrics`

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
| error_tracking_id | string | uuid | ✗ | Note:
This is a Foreign Key to `error_trackings.id`.<fk table='error_trackings' column='id'/> |
| metric_type | string | character varying | ✗ | - |
| value | number | numeric | ✗ | - |
| unit | string | character varying | ✓ | - |
| measured_at | string | timestamp with time zone | ✓ | - |
| measurement_context | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 224. `error_trackings`

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
| error_id | string | character varying | ✗ | - |
| title | string | character varying | ✗ | - |
| category | string | character varying | ✗ | - |
| severity | string | character varying | ✗ | - |
| status | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| root_cause | string | text | ✓ | - |
| solution | string | text | ✓ | - |
| impact_assessment | string | text | ✓ | - |
| error_pattern | string | character varying | ✓ | - |
| affected_system | string | character varying | ✓ | - |
| resolution_timestamp | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| resolved_at | string | timestamp with time zone | ✓ | - |
| fingerprint | string | text | ✓ | Hash of error signature for deduplication and similarity detection |
| batch_id | string | uuid | ✓ | Groups related errors that occurred in the same batch/request |

---

### 225. `esignature_audit`

**Description:** Complete audit trail for all e-signatures

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
| approval_step_id | string | uuid | ✓ | Note:
This is a Foreign Key to `approval_steps.id`.<fk table='approval_steps' column='id'/> |
| approval_instance_id | string | uuid | ✓ | Note:
This is a Foreign Key to `approval_instances.id`.<fk table='approval_instances' column='id'/> |
| signer_user_id | string | uuid | ✓ | - |
| signature_method | string | character varying | ✗ | - |
| signature_data | unknown | jsonb | ✗ | Encrypted signature data for compliance and verification |
| signature_hash | string | character varying | ✓ | - |
| ip_address | string | inet | ✓ | - |
| user_agent | string | text | ✓ | - |
| location_data | unknown | jsonb | ✓ | - |
| signed_at | string | timestamp with time zone | ✓ | - |
| document_hash | string | character varying | ✗ | - |
| document_version | string | character varying | ✓ | - |
| certificate_data | unknown | jsonb | ✓ | - |
| is_valid | boolean | boolean | ✓ | - |
| invalidated_at | string | timestamp with time zone | ✓ | - |
| invalidation_reason | string | text | ✓ | - |

---

### 226. `evaluation_packages`

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
| package_context | string | character varying | ✗ | - |
| context_reference_id | string | character varying | ✓ | - |
| package_name | string | character varying | ✗ | - |
| package_description | string | text | ✓ | - |
| party_email | string | character varying | ✗ | - |
| party_name | string | character varying | ✓ | - |
| party_org_name | string | character varying | ✓ | - |
| party_type | string | character varying | ✓ | - |
| party_id | string | uuid | ✓ | Optional UUID reference to external party. May reference contractors table, user_management, or other party tables. Not a foreign key to allow flexibility. The party_email field is the primary identifier. |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| overall_status | string | character varying | ✓ | - |
| discipline_scores | unknown | jsonb | ✓ | - |
| final_weighted_score | number | numeric | ✓ | - |
| final_weighted_percentage | number | numeric | ✓ | - |
| scoring_calculation | unknown | jsonb | ✓ | - |
| final_decision | string | character varying | ✓ | - |
| final_decision_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| final_decision_at | string | timestamp with time zone | ✓ | - |
| final_decision_comments | string | text | ✓ | - |
| context_metadata | unknown | jsonb | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| due_date | string | date | ✓ | - |
| completed_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |

---

### 227. `external_api_configurations`

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
| api_name | string | text | ✗ | - |
| api_type | string | text | ✗ | - |
| endpoint_url | string | text | ✗ | - |
| api_key | string | text | ✗ | - |
| organization_id | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| description | string | text | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 228. `external_party_document_instances`

**Description:** Standardized External Party Documents - HTML content in html_content TEXT, schema in content_schema JSONB

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

**Columns:** 58

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| document_context | string | character varying | ✗ | - |
| context_reference_id | string | character varying | ✓ | - |
| source_table | string | character varying | ✗ | - |
| source_template_id | string | uuid | ✗ | - |
| template_snapshot | unknown | jsonb | ✗ | - |
| discipline_code | string | character varying | ✗ | - |
| discipline_owner_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| document_name | string | character varying | ✗ | - |
| document_description | string | text | ✓ | - |
| document_type | string | character varying | ✓ | - |
| assigned_to_party_id | string | uuid | ✓ | Optional UUID reference to external party. May reference contractors table, user_management, or other party tables. Not a foreign key to allow flexibility. The assigned_to_party_email field is the primary identifier. |
| assigned_to_party_email | string | character varying | ✗ | - |
| assigned_to_party_name | string | character varying | ✓ | - |
| assigned_to_party_org_name | string | character varying | ✓ | - |
| assigned_to_party_type | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| reviewed_before_issue_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| reviewed_before_issue_at | string | timestamp with time zone | ✓ | - |
| pre_issue_review_notes | string | text | ✓ | - |
| issued_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| issued_at | string | timestamp with time zone | ✓ | - |
| due_date | string | date | ✓ | - |
| assignment_instructions | string | text | ✓ | - |
| html_content | string | text | ✗ | - |
| form_schema | unknown | jsonb | ✓ | DEPRECATED: Use content_schema. Remove post-migration. |
| party_responses | unknown | jsonb | ✓ | - |
| response_metadata | unknown | jsonb | ✓ | - |
| started_at | string | timestamp with time zone | ✓ | - |
| last_saved_at | string | timestamp with time zone | ✓ | - |
| submitted_at | string | timestamp with time zone | ✓ | - |
| reviewed_after_submission_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| reviewed_after_submission_at | string | timestamp with time zone | ✓ | - |
| post_submission_review_notes | string | text | ✓ | - |
| review_decision | string | character varying | ✓ | - |
| discipline_score | integer | integer | ✓ | - |
| discipline_max_score | integer | integer | ✓ | - |
| discipline_score_percentage | number | numeric | ✓ | - |
| score_breakdown | unknown | jsonb | ✓ | - |
| scoring_comments | string | text | ✓ | - |
| scored_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| scored_at | string | timestamp with time zone | ✓ | - |
| revision_count | integer | integer | ✓ | - |
| revision_history | unknown | jsonb | ✓ | - |
| status | string | character varying | ✓ | - |
| access_token | string | character varying | ✓ | - |
| access_expires_at | string | timestamp with time zone | ✓ | - |
| access_revoked | boolean | boolean | ✓ | - |
| evaluation_package_id | string | uuid | ✓ | - |
| evaluation_package_name | string | character varying | ✓ | - |
| context_metadata | unknown | jsonb | ✓ | - |
| version | string | character varying | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| content_schema | unknown | jsonb | ✓ | - |

---

### 229. `field_attribute_compliance`

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
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| field_name | string | character varying | ✓ | - |
| attribute_type | string | character varying | ✓ | - |
| ai_action_taken | string | character varying | ✓ | - |
| confidence_score | number | numeric | ✓ | - |
| user_override | boolean | boolean | ✓ | - |
| enforcement_timestamp | string | timestamp without time zone | ✓ | - |
| workflow_execution_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 230. `financial_records`

**Description:** Financial records management table for invoices, payments, expenses, contracts, budgets, and assets

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
| type | string | character varying | ✗ | Record type: invoice, payment, expense, contract, budget, asset |
| reference | string | character varying | ✗ | Unique reference number for the financial record |
| description | string | text | ✗ | - |
| amount | number | numeric | ✗ | - |
| currency | string | character varying | ✓ | - |
| date | string | date | ✗ | - |
| due_date | string | date | ✓ | - |
| status | string | character varying | ✓ | Status: pending, approved, paid, overdue, cancelled |
| vendor | string | character varying | ✓ | - |
| project | string | character varying | ✓ | - |
| category | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| active | boolean | boolean | ✓ | - |
| notes | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 231. `flowise_documents`

**Description:** Local tracking of individual documents and loaders within Flowise document stores

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
| document_store_id | string | uuid | ✗ | Reference to the document store containing this document

Note:
This is a Foreign Key to `document_stores.id`.<fk table='document_stores' column='id'/> |
| flowise_loader_id | string | text | ✗ | Flowise loader ID that processed this document |
| flowise_file_id | string | text | ✓ | Flowise file ID (if available) |
| document_name | string | text | ✗ | Display name for the document |
| original_filename | string | text | ✓ | Original filename when uploaded |
| file_size | integer | bigint | ✓ | File size in bytes |
| mime_type | string | text | ✓ | MIME type of the document |
| loader_name | string | text | ✓ | Human-readable name of the loader |
| loader_type | string | text | ✓ | Type of loader (pdfFile, textFile, etc.) |
| splitter_name | string | text | ✓ | Text splitter used for chunking |
| total_chunks | integer | integer | ✓ | Number of chunks created from this document |
| total_characters | integer | integer | ✓ | Total character count in the document |
| status | string | text | ✓ | Processing status in Flowise |
| uploaded_at | string | timestamp with time zone | ✓ | When the document was uploaded to Flowise |
| processed_at | string | timestamp with time zone | ✓ | When the document was processed/embedded |
| loader_config | unknown | jsonb | ✓ | Flowise loader configuration |
| document_metadata | unknown | jsonb | ✓ | Document metadata from Flowise |
| splitter_config | unknown | jsonb | ✓ | Text splitter configuration |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| last_synced_at | string | timestamp with time zone | ✓ | Last time this record was synced from Flowise |

---

### 232. `flowise_documents_with_stores`

**Description:** View combining Flowise documents with their document store information

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
| id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| document_store_id | string | uuid | ✓ | Note:
This is a Foreign Key to `document_stores.id`.<fk table='document_stores' column='id'/> |
| flowise_loader_id | string | text | ✓ | - |
| flowise_file_id | string | text | ✓ | - |
| document_name | string | text | ✓ | - |
| original_filename | string | text | ✓ | - |
| file_size | integer | bigint | ✓ | - |
| mime_type | string | text | ✓ | - |
| loader_name | string | text | ✓ | - |
| loader_type | string | text | ✓ | - |
| splitter_name | string | text | ✓ | - |
| total_chunks | integer | integer | ✓ | - |
| total_characters | integer | integer | ✓ | - |
| status | string | text | ✓ | - |
| uploaded_at | string | timestamp with time zone | ✓ | - |
| processed_at | string | timestamp with time zone | ✓ | - |
| loader_config | unknown | jsonb | ✓ | - |
| document_metadata | unknown | jsonb | ✓ | - |
| splitter_config | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| last_synced_at | string | timestamp with time zone | ✓ | - |
| store_name | string | text | ✓ | - |
| store_description | string | text | ✓ | - |
| store_metadata | unknown | jsonb | ✓ | - |

---

### 233. `flowise_record_manager`

**Description:** Record Manager table for Flowise Document Store to track document chunks and prevent duplicates

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
| uuid | string | uuid | ✗ | Primary key UUID

Note:
This is a Primary Key.<pk/> |
| key | string | text | ✗ | Unique identifier for the document chunk (typically hash of content + metadata) |
| group_id | string | text | ✓ | Group identifier for related documents (e.g., document store ID or page prefix) |
| updated_at | string | timestamp with time zone | ✓ | Timestamp when the record was last updated |
| created_at | string | timestamp with time zone | ✓ | Timestamp when the record was created |
| metadata | unknown | jsonb | ✓ | Additional metadata about the document chunk |

---

### 234. `form_completions`

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
| title | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| template_type | string | character varying | ✓ | - |
| status | string | character varying | ✗ | - |
| priority | string | character varying | ✓ | - |
| project_id | string | uuid | ✓ | - |
| project_name | string | character varying | ✓ | - |
| assigned_to | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| completed_date | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| reference_number | string | character varying | ✓ | - |
| tags | array | text[] | ✓ | - |
| form_data | unknown | jsonb | ✓ | - |
| comments | string | text | ✓ | - |

---

### 235. `form_instances`

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
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `governance_document_templates.id`.<fk table='governance_document_templates' column='id'/> |
| organization_name | string | text | ✓ | - |
| instance_name | string | text | ✗ | - |
| instance_slug | string | text | ✓ | - |
| source_file_name | string | text | ✗ | - |
| source_file_type | string | text | ✓ | - |
| source_file_size | integer | integer | ✓ | - |
| processed_data | unknown | jsonb | ✓ | - |
| submission_data | unknown | jsonb | ✓ | - |
| html_form | string | text | ✓ | - |
| json_form | unknown | jsonb | ✓ | - |
| processing_status | string | text | ✓ | - |
| version | integer | integer | ✓ | - |
| is_submitted | boolean | boolean | ✓ | - |
| submitted_by | string | text | ✓ | - |
| submitted_at | string | timestamp with time zone | ✓ | - |
| created_by | string | text | ✓ | - |
| updated_by | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| deleted_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 236. `form_templates`

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
| template_name | string | text | ✗ | - |
| html_content | string | text | ✓ | - |
| json_schema | unknown | jsonb | ✓ | - |
| processing_status | string | text | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_id | string | uuid | ✓ | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| discipline_name | string | text | ✓ | - |
| created_by | string | text | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| form_metadata | unknown | jsonb | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 237. `form_templates_audit`

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
| form_template_id | string | uuid | ✓ | - |
| action | string | text | ✗ | - |
| old_data | unknown | jsonb | ✓ | - |
| new_data | unknown | jsonb | ✓ | - |
| changed_by | string | text | ✓ | - |
| changed_at | string | timestamp with time zone | ✓ | - |
| user_role | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| is_dev_mode | boolean | boolean | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 238. `fuel_lubricants`

**Description:** ✅ MASTER GUIDE COMPLIANT: Organization-isolated fuel/lubricants management
with creator ownership, audit trails, and approval workflow patterns.
Reference: procurement_templates table standard.

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

**Columns:** 55

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| product_code | string | character varying | ✓ | - |
| category | string | character varying | ✗ | - |
| subtype | string | character varying | ✓ | - |
| supplier_id | integer | integer | ✓ | Note:
This is a Foreign Key to `suppliers.id`.<fk table='suppliers' column='id'/> |
| supplier_name | string | character varying | ✓ | - |
| supplier_contact | string | character varying | ✓ | - |
| supplier_email | string | character varying | ✓ | - |
| viscosity | string | character varying | ✓ | - |
| viscosity_class | string | character varying | ✓ | - |
| grade | string | character varying | ✓ | - |
| specification_standard | string | character varying | ✓ | - |
| specifications | unknown | jsonb | ✓ | JSON object containing detailed technical specifications |
| current_stock_quantity | number | numeric | ✓ | - |
| minimum_stock_level | number | numeric | ✓ | - |
| maximum_stock_level | number | numeric | ✓ | - |
| unit_of_measure | string | character varying | ✓ | - |
| reorder_quantity | number | numeric | ✓ | - |
| quality_status | string | character varying | ✓ | - |
| compliance_certificate | string | character varying | ✓ | - |
| batch_number | string | character varying | ✓ | - |
| expiry_date | string | date | ✓ | - |
| production_date | string | date | ✓ | - |
| purchase_price | number | numeric | ✓ | - |
| selling_price | number | numeric | ✓ | - |
| purchase_date | string | date | ✓ | - |
| purchase_order_number | string | character varying | ✓ | - |
| invoice_number | string | character varying | ✓ | - |
| consumption_rate | number | numeric | ✓ | - |
| last_used_date | string | date | ✓ | - |
| total_consumed | number | numeric | ✓ | - |
| approval_status | string | character varying | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approval_date | string | timestamp with time zone | ✓ | - |
| rejection_reason | string | text | ✓ | - |
| equipment_assigned | unknown | jsonb | ✓ | JSON array of equipment IDs compatible with this fuel/lubricant |
| project_assigned | string | character varying | ✓ | - |
| storage_location | string | character varying | ✓ | - |
| storage_temperature | string | character varying | ✓ | - |
| storage_conditions | string | text | ✓ | - |
| scheduled_changes | unknown | jsonb | ✓ | JSON object with change schedules and reminders |
| last_change_date | string | date | ✓ | - |
| change_frequency_days | integer | integer | ✓ | - |
| hazard_classification | string | character varying | ✓ | - |
| sds_url | string | character varying | ✓ | - |
| environmental_impact | string | character varying | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| active | boolean | boolean | ✓ | - |
| archived | boolean | boolean | ✓ | - |
| critical_item | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 239. `governance_approval_instances`

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
| matrix_id | string | uuid | ✓ | Note:
This is a Foreign Key to `governance_approval_matrices.id`.<fk table='governance_approval_matrices' column='id'/> |
| document_id | string | uuid | ✓ | - |
| document_title | string | text | ✗ | - |
| document_number | string | text | ✓ | - |
| department_code | string | text | ✗ | - |
| requester_id | string | text | ✓ | - |
| requester_name | string | text | ✗ | - |
| current_level | integer | integer | ✓ | - |
| status | string | text | ✓ | - |
| started_at | string | timestamp with time zone | ✓ | - |
| deadline_at | string | timestamp with time zone | ✓ | - |
| escalated_at | string | timestamp with time zone | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| approved_by | string | text | ✓ | - |
| rejection_reason | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| document_version_major | integer | integer | ✓ | - |
| document_version_minor | integer | integer | ✓ | - |
| document_version_revision | string | text | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| created_by | string | uuid | ✓ | - |

---

### 240. `governance_approval_matrices`

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
| organization_id | string | text | ✓ | - |
| department_code | string | text | ✗ | - |
| document_type | string | text | ✗ | - |
| approval_levels | unknown | jsonb | ✗ | - |
| auto_approval_threshold | number | numeric | ✓ | - |
| deadline_days | integer | integer | ✓ | - |
| escalation_rules | unknown | jsonb | ✓ | - |
| email_templates | unknown | jsonb | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |

---

### 241. `governance_approval_steps`

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
| approval_instance_id | string | uuid | ✗ | Note:
This is a Foreign Key to `governance_approval_instances.id`.<fk table='governance_approval_instances' column='id'/> |
| step_number | integer | integer | ✗ | - |
| approver_role | string | text | ✗ | - |
| approver_user_id | string | text | ✓ | - |
| approver_name | string | text | ✓ | - |
| status | string | text | ✓ | - |
| action_taken | string | text | ✓ | - |
| action_timestamp | string | timestamp with time zone | ✓ | - |
| notified_at | string | timestamp with time zone | ✓ | - |
| reminder_sent_at | string | timestamp with time zone | ✓ | - |
| comments | string | text | ✓ | - |
| attachment_urls | array | text[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| created_by | string | uuid | ✓ | - |

---

### 242. `governance_document_templates`

**Description:** Standardized Governance Form Templates - HTML content in html_content TEXT, schema in content_schema JSONB

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

**Columns:** 29

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| organization_name | string | text | ✓ | - |
| discipline_id | string | uuid | ✓ | Note:
This is a Foreign Key to `disciplines.id`.<fk table='disciplines' column='id'/> |
| discipline_name | string | text | ✓ | - |
| template_name | string | text | ✗ | - |
| template_slug | string | text | ✓ | - |
| html_content | string | text | ✓ | - |
| json_schema | unknown | jsonb | ✓ | DEPRECATED: Use content_schema. Remove post-migration. |
| form_metadata | unknown | jsonb | ✓ | - |
| source_file_name | string | text | ✓ | - |
| source_file_type | string | text | ✓ | - |
| extracted_fields_count | integer | integer | ✓ | - |
| extraction_method | string | text | ✓ | - |
| processing_status | string | text | ✓ | - |
| version | integer | integer | ✓ | - |
| parent_template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `governance_document_templates.id`.<fk table='governance_document_templates' column='id'/> |
| is_default | boolean | boolean | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | text | ✓ | - |
| updated_by | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| deleted_at | string | timestamp with time zone | ✓ | - |
| content_schema | unknown | jsonb | ✓ | - |
| processing_method | string | text | ✓ | Method used to process the document (e.g., structured_excel_parsing, ai_generated) |
| document_type | string | text | ✓ | Document type selected during upload (e.g., PO, Contract, SOW) |
| document_type_label | string | text | ✓ | Human-readable label for the document type |
| source_governance_template_id | string | uuid | ✓ | - |

---

### 243. `governance_document_templates_backup_20251121`

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

**Columns:** 29

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| organization_name | string | text | ✓ | - |
| discipline_id | string | uuid | ✓ | - |
| discipline_name | string | text | ✓ | - |
| template_name | string | text | ✓ | - |
| template_slug | string | text | ✓ | - |
| html_content | string | text | ✓ | - |
| json_schema | unknown | jsonb | ✓ | - |
| form_metadata | unknown | jsonb | ✓ | - |
| source_file_name | string | text | ✓ | - |
| source_file_type | string | text | ✓ | - |
| extracted_fields_count | integer | integer | ✓ | - |
| extraction_method | string | text | ✓ | - |
| processing_status | string | text | ✓ | - |
| version | integer | integer | ✓ | - |
| parent_template_id | string | uuid | ✓ | - |
| is_default | boolean | boolean | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | text | ✓ | - |
| updated_by | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| deleted_at | string | timestamp with time zone | ✓ | - |
| content_schema | unknown | jsonb | ✓ | - |
| processing_method | string | text | ✓ | - |
| document_type | string | text | ✓ | - |
| document_type_label | string | text | ✓ | - |
| source_governance_template_id | string | uuid | ✓ | - |

---

### 244. `governance_document_templates-old`

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
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| category | string | character varying | ✗ | - |
| template_type | string | character varying | ✓ | - |
| fields | unknown | jsonb | ✓ | - |
| settings | unknown | jsonb | ✓ | - |
| content | string | text | ✓ | - |
| status | string | character varying | ✓ | - |
| version | integer | integer | ✓ | - |
| usage_count | integer | integer | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organizations | unknown | jsonb | ✓ | - |
| disciplines | unknown | jsonb | ✓ | - |
| sectors | unknown | jsonb | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |

---

### 245. `governance_template_usage`

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
This is a Foreign Key to `governance_document_templates-old.id`.<fk table='governance_document_templates-old' column='id'/> |
| user_id | string | uuid | ✓ | - |
| action | string | character varying | ✗ | - |
| metadata | unknown | jsonb | ✓ | - |
| used_at | string | timestamp with time zone | ✓ | - |

---

### 246. `hitl_performance_metrics`

**Description:** Performance metrics and analytics for HITL task resolutions

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
| task_id | string | uuid | ✓ | Reference to the resolved HITL task

Note:
This is a Foreign Key to `tasks.id`.<fk table='tasks' column='id'/> |
| resolver_id | string | uuid | ✓ | User who resolved the HITL task |
| discipline | string | text | ✓ | - |
| intervention_type | string | text | ✓ | - |
| decision | string | text | ✓ | - |
| ai_confidence_before | number | numeric | ✓ | - |
| human_confidence_after | number | numeric | ✓ | - |
| decision_alignment | boolean | boolean | ✓ | Whether human decision aligned with AI recommendation |
| time_to_resolution_minutes | integer | integer | ✓ | Time taken to resolve the task in minutes |
| quality_rating | integer | integer | ✓ | Human-rated quality of the resolution (1-5) |
| complexity_level | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 247. `imported_emails_with_placeholder_users`

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
| email_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| subject | string | text | ✓ | - |
| sender_email | string | character varying | ✓ | - |
| recipient_email | string | character varying | ✓ | - |
| sent_date | string | timestamp with time zone | ✓ | - |
| user_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| user_email | string | text | ✓ | - |
| user_active | boolean | boolean | ✓ | - |
| is_placeholder_user | boolean | boolean | ✓ | - |

---

### 248. `inspection_items`

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
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| inspection_id | string | character varying | ✗ | Note:
This is a Foreign Key to `inspections.inspection_id`.<fk table='inspections' column='inspection_id'/> |
| item_id | string | character varying | ✗ | - |
| item_type | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| location | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| priority | string | character varying | ✓ | - |
| assigned_to | string | character varying | ✓ | - |
| due_date | string | date | ✓ | - |
| completed_date | string | date | ✓ | - |
| notes | string | text | ✓ | - |
| media_urls | unknown | jsonb | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 249. `inspection_media`

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
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| media_id | string | character varying | ✗ | - |
| inspection_id | string | character varying | ✓ | - |
| inspection_item_id | string | character varying | ✓ | - |
| defect_id | string | character varying | ✓ | - |
| file_name | string | character varying | ✗ | - |
| file_type | string | character varying | ✗ | - |
| file_size | integer | integer | ✓ | - |
| file_url | string | text | ✗ | - |
| storage_path | string | text | ✓ | - |
| description | string | text | ✓ | - |
| tags | unknown | jsonb | ✓ | - |
| uploaded_by | string | character varying | ✓ | - |
| upload_date | string | timestamp without time zone | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 250. `inspections`

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
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| inspection_id | string | character varying | ✗ | - |
| project_id | string | character varying | ✗ | - |
| inspection_type | string | character varying | ✗ | - |
| scheduled_date | string | date | ✗ | - |
| completed_date | string | date | ✓ | - |
| inspector_id | string | character varying | ✓ | - |
| facility | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| priority | string | character varying | ✓ | - |
| notes | string | text | ✓ | - |
| findings_count | integer | integer | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| updated_at | string | timestamp without time zone | ✓ | - |
| created_by | string | character varying | ✓ | - |
| updated_by | string | character varying | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 251. `integration_sources`

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
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| source_id | string | character varying | ✗ | - |
| name | string | character varying | ✗ | - |
| description | string | text | ✓ | - |
| base_url | string | character varying | ✓ | - |
| api_key_encrypted | string | text | ✓ | - |
| username_encrypted | string | text | ✓ | - |
| password_encrypted | string | text | ✓ | - |
| integration_type | string | character varying | ✗ | - |
| status | string | character varying | ✓ | - |
| config | unknown | jsonb | ✓ | - |
| last_sync_at | string | timestamp with time zone | ✓ | - |
| last_successful_sync_at | string | timestamp with time zone | ✓ | - |
| last_error | string | text | ✓ | - |
| sync_interval_minutes | integer | integer | ✓ | - |
| rate_limit_per_minute | integer | integer | ✓ | - |
| timeout_seconds | integer | integer | ✓ | - |
| retry_attempts | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 252. `integration_sync_history`

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
| integration_source_id | string | uuid | ✓ | Note:
This is a Foreign Key to `integration_sources.id`.<fk table='integration_sources' column='id'/> |
| sync_type | string | character varying | ✓ | - |
| status | string | character varying | ✗ | - |
| records_processed | integer | integer | ✓ | - |
| records_created | integer | integer | ✓ | - |
| records_updated | integer | integer | ✓ | - |
| records_failed | integer | integer | ✓ | - |
| start_time | string | timestamp with time zone | ✗ | - |
| end_time | string | timestamp with time zone | ✓ | - |
| duration_seconds | integer | integer | ✓ | - |
| error_message | string | text | ✓ | - |
| sync_metadata | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 253. `internal_notifications`

**Description:** Internal notification system to avoid email dependency

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
| user_id | string | uuid | ✓ | - |
| type | string | character varying | ✗ | - |
| category | string | character varying | ✓ | - |
| title | string | character varying | ✗ | - |
| message | string | text | ✗ | - |
| approval_instance_id | string | uuid | ✓ | Note:
This is a Foreign Key to `approval_instances.id`.<fk table='approval_instances' column='id'/> |
| approval_step_id | string | uuid | ✓ | Note:
This is a Foreign Key to `approval_steps.id`.<fk table='approval_steps' column='id'/> |
| priority | string | character varying | ✓ | - |
| is_read | boolean | boolean | ✓ | - |
| read_at | string | timestamp with time zone | ✓ | - |
| action_required | boolean | boolean | ✓ | - |
| action_url | string | character varying | ✓ | Direct link to the approval action page |
| created_at | string | timestamp with time zone | ✓ | - |
| expires_at | string | timestamp with time zone | ✓ | - |

---

### 254. `job_descriptions`

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
| title | string | text | ✗ | - |
| location | string | text | ✓ | - |
| employment_type | string | text | ✓ | - |
| salary_range_min | number | numeric | ✓ | - |
| salary_range_max | number | numeric | ✓ | - |
| job_description | string | text | ✓ | - |
| requirements | string | text | ✓ | - |
| responsibilities | string | text | ✓ | - |
| benefits | string | text | ✓ | - |
| application_deadline | string | date | ✓ | - |
| contact_person | string | text | ✓ | - |
| status | string | text | ✓ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| discipline | string | text | ✓ | Discipline or division (formerly department) |

---

### 255. `legal_reviews`

**Description:** Legal reviews and compliance checks for contracts and documents

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
| review_type | string | character varying | ✓ | - |
| document_type | string | character varying | ✓ | - |
| urgency | string | character varying | ✓ | - |
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

### 256. `limits_of_authority`

**Description:** Defines organizational limits of authority for document approvals

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
| organization_id | string | uuid | ✗ | Organization this limit applies to

Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |
| department_code | string | character varying | ✓ | Department code (optional - null means applies to all) |
| document_type | string | character varying | ✗ | Type of document (procurement_order, work_order, etc.) |
| min_amount | number | numeric | ✓ | Minimum amount threshold (inclusive) |
| max_amount | number | numeric | ✓ | Maximum amount threshold (exclusive) |
| required_approvals | unknown | jsonb | ✗ | JSON array of required approval roles |
| conditions | unknown | jsonb | ✓ | Additional conditions for approval routing |
| is_active | boolean | boolean | ✓ | - |
| created_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| updated_by | string | uuid | ✓ | Note:
This is a Foreign Key to `user_profiles.user_id`.<fk table='user_profiles' column='user_id'/> |

---

### 257. `llm_configurations`

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
| id | string | character varying | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| provider | string | character varying | ✗ | - |
| model | string | character varying | ✗ | - |
| api_key | string | character varying | ✓ | - |
| status | string | character varying | ✗ | - |
| usage_count | integer | integer | ✓ | - |
| last_used | string | timestamp without time zone | ✓ | - |
| created_at | string | timestamp without time zone | ✗ | - |
| updated_at | string | timestamp without time zone | ✗ | - |
| created_by | string | character varying | ✓ | - |
| updated_by | string | character varying | ✓ | - |
| purposes | array | text[] | ✓ | - |

---

### 258. `llm_document_type_mappings`

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
| llm_configuration_id | string | character varying | ✓ | Note:
This is a Foreign Key to `llm_configurations.id`.<fk table='llm_configurations' column='id'/> |
| document_type | string | character varying | ✗ | - |
| analysis_type | string | character varying | ✗ | - |
| created_at | string | timestamp without time zone | ✗ | - |
| updated_at | string | timestamp without time zone | ✗ | - |
| file_format | string | character varying | ✓ | - |
| default_format | boolean | boolean | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 259. `llm_functions`

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
| name | string | text | ✗ | - |
| description | string | text | ✓ | - |
| function_type | string | public.llm_function_type | ✗ | - |
| model_name | string | text | ✗ | - |
| api_config | unknown | jsonb | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✗ | - |
| updated_at | string | timestamp with time zone | ✗ | - |
| created_by | string | uuid | ✓ | - |

---

### 260. `logistics_alerts`

**Description:** System-generated alerts and notifications

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
| alert_type | string | character varying | ✗ | - |
| severity | string | character varying | ✗ | - |
| shipment_id | string | uuid | ✓ | Note:
This is a Foreign Key to `logistics_shipments.id`.<fk table='logistics_shipments' column='id'/> |
| vessel_id | string | uuid | ✓ | Note:
This is a Foreign Key to `vessels.id`.<fk table='vessels' column='id'/> |
| container_id | string | uuid | ✓ | Note:
This is a Foreign Key to `containers.id`.<fk table='containers' column='id'/> |
| alert_title | string | character varying | ✗ | - |
| alert_description | string | text | ✓ | - |
| alert_timestamp | string | timestamp with time zone | ✓ | - |
| status | string | character varying | ✓ | - |
| acknowledged_at | string | timestamp with time zone | ✓ | - |
| acknowledged_by | string | uuid | ✓ | - |
| resolved_at | string | timestamp with time zone | ✓ | - |
| resolved_by | string | uuid | ✓ | - |
| action_required | boolean | boolean | ✓ | - |
| action_description | string | text | ✓ | - |
| due_date | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| company_id | string | uuid | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 261. `logistics_approval_steps`

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
| workflow_id | string | uuid | ✓ | Note:
This is a Foreign Key to `logistics_approval_workflows.id`.<fk table='logistics_approval_workflows' column='id'/> |
| step_number | integer | integer | ✗ | - |
| step_type | string | text | ✗ | - |
| assigned_to | string | uuid | ✓ | - |
| status | string | text | ✓ | - |
| decision | string | text | ✓ | - |
| comments | string | text | ✓ | - |
| decision_at | string | timestamp with time zone | ✓ | - |
| time_spent_minutes | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |

---

### 262. `logistics_approval_workflows`

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
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `logistics_documents.id`.<fk table='logistics_documents' column='id'/> |
| workflow_type | string | text | ✗ | - |
| current_step | string | text | ✗ | - |
| status | string | text | ✓ | - |
| priority | string | text | ✓ | - |
| assigned_to | string | uuid | ✓ | - |
| assigned_at | string | timestamp with time zone | ✓ | - |
| due_date | string | timestamp with time zone | ✓ | - |
| escalation_level | integer | integer | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 263. `logistics_context_data`

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
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| procurement_order_id | string | uuid | ✓ | - |
| orderid | string | uuid | ✓ | - |
| ordernumber | string | text | ✓ | - |
| orderdate | string | timestamp with time zone | ✓ | - |
| exporterdetails | unknown | jsonb | ✓ | - |
| importerdetails | unknown | jsonb | ✓ | - |
| cargodescription | string | text | ✓ | - |
| hscode | string | text | ✓ | - |
| quantity | number | numeric | ✓ | - |
| unit | string | text | ✓ | - |
| value | number | numeric | ✓ | - |
| currency | string | text | ✓ | - |
| weight | number | numeric | ✓ | - |
| deliveryterms | string | text | ✓ | - |
| transportmode | string | text | ✓ | - |
| deliveryaddress | unknown | jsonb | ✓ | - |
| lastupdated | string | timestamp with time zone | ✓ | - |
| source | string | text | ✓ | - |
| exportdeclarationrequired | boolean | boolean | ✓ | - |

---

### 264. `logistics_coordination_monitor`

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
| task_id | string | uuid | ✓ | Note:
This is a Primary Key.<pk/> |
| title | string | character varying | ✓ | - |
| task_status | string | character varying | ✓ | - |
| priority | string | character varying | ✓ | - |
| assigned_to_discipline | string | text | ✓ | - |
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| procurement_description | string | text | ✓ | - |
| documents_generated | integer | bigint | ✓ | - |
| last_document_generated | string | timestamp with time zone | ✓ | - |
| total_messages | integer | bigint | ✓ | - |
| last_message_date | string | timestamp with time zone | ✓ | - |

---

### 265. `logistics_document_versions`

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
| document_id | string | uuid | ✓ | Note:
This is a Foreign Key to `logistics_documents.id`.<fk table='logistics_documents' column='id'/> |
| version_number | integer | integer | ✗ | - |
| content | unknown | jsonb | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| generated_by_ai | boolean | boolean | ✓ | - |
| ai_model | string | text | ✓ | - |
| ai_confidence | number | numeric | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |

---

### 266. `logistics_documents`

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
| procurement_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| document_type | string | text | ✗ | - |
| direction | string | text | ✗ | - |
| content | string | text | ✗ | - |
| metadata | unknown | jsonb | ✓ | - |
| status | string | text | ✓ | - |
| shared_with | string | text | ✓ | - |
| shared_at | string | timestamp with time zone | ✓ | - |
| generated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 267. `logistics_shipments`

**Description:** High-level shipment records

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

**Columns:** 36

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| shipment_number | string | character varying | ✗ | - |
| shipment_name | string | character varying | ✓ | - |
| shipment_type | string | character varying | ✓ | - |
| shipper_name | string | character varying | ✓ | - |
| shipper_address | string | text | ✓ | - |
| consignee_name | string | character varying | ✓ | - |
| consignee_address | string | text | ✓ | - |
| freight_forwarder | string | character varying | ✓ | - |
| origin_port | string | character varying | ✓ | - |
| destination_port | string | character varying | ✓ | - |
| transit_ports | array | text[] | ✓ | - |
| booking_date | string | date | ✓ | - |
| planned_departure_date | string | date | ✓ | - |
| actual_departure_date | string | date | ✓ | - |
| planned_arrival_date | string | date | ✓ | - |
| actual_arrival_date | string | date | ✓ | - |
| total_value | number | numeric | ✓ | - |
| currency | string | character varying | ✓ | - |
| incoterms | string | character varying | ✓ | - |
| payment_terms | string | character varying | ✓ | - |
| shipment_status | string | character varying | ✓ | - |
| priority_level | string | character varying | ✓ | - |
| documents_complete | boolean | boolean | ✓ | - |
| customs_cleared | boolean | boolean | ✓ | - |
| insurance_reference | string | character varying | ✓ | - |
| notes | string | text | ✓ | - |
| special_instructions | string | text | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| created_by | string | uuid | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| company_id | string | uuid | ✓ | - |
| organisation_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 268. `maintenance_assets`

**Description:** Equipment and plant assets for maintenance tracking

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
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| name | string | character varying | ✗ | - |
| type | string | character varying | ✗ | - |
| manufacturer | string | character varying | ✓ | - |
| model | string | character varying | ✓ | - |
| serial_number | string | character varying | ✓ | - |
| year | integer | integer | ✓ | - |
| location | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| description | string | text | ✓ | - |
| purchase_date | string | date | ✓ | - |
| purchase_cost | number | numeric | ✓ | - |
| warranty_expiry | string | date | ✓ | - |
| last_maintenance | string | date | ✓ | - |
| next_due | string | date | ✓ | - |
| user_id | string | uuid | ✓ | - |
| project_id | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 269. `maintenance_history`

**Description:** Historical record of completed maintenance

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
| asset_id | string | uuid | ✓ | Note:
This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> |
| work_order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `maintenance_work_orders.id`.<fk table='maintenance_work_orders' column='id'/> |
| schedule_id | string | uuid | ✓ | Note:
This is a Foreign Key to `maintenance_schedules.id`.<fk table='maintenance_schedules' column='id'/> |
| maintenance_type | string | character varying | ✗ | - |
| description | string | text | ✗ | - |
| performed_by | string | uuid | ✓ | - |
| performed_by_name | string | character varying | ✓ | - |
| performed_date | string | date | ✗ | - |
| hours_spent | number | numeric | ✓ | - |
| cost | number | numeric | ✓ | - |
| parts_used | string | text | ✓ | - |
| notes | string | text | ✓ | - |
| project_id | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 270. `maintenance_schedules`

**Description:** Scheduled maintenance for assets

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
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| asset_id | string | uuid | ✓ | Note:
This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> |
| asset_name | string | character varying | ✗ | - |
| maintenance_type | string | character varying | ✗ | - |
| frequency | integer | integer | ✗ | - |
| frequency_unit | string | character varying | ✓ | - |
| description | string | text | ✗ | - |
| last_completed | string | date | ✓ | - |
| next_due | string | date | ✓ | - |
| status | string | character varying | ✓ | - |
| assigned_to | string | uuid | ✓ | - |
| assigned_to_name | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | - |
| estimated_hours | number | numeric | ✓ | - |
| cost_per_service | number | numeric | ✓ | - |
| instructions | string | text | ✓ | - |
| project_id | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 271. `maintenance_work_orders`

**Description:** Work orders for maintenance tasks

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
| asset_id | string | uuid | ✓ | Note:
This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> |
| asset_name | string | character varying | ✗ | - |
| type | string | character varying | ✗ | - |
| priority | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| title | string | character varying | ✗ | - |
| description | string | text | ✗ | - |
| assigned_to | string | uuid | ✓ | - |
| assigned_to_name | string | character varying | ✓ | - |
| created_by | string | uuid | ✓ | - |
| due_date | string | date | ✓ | - |
| start_date | string | date | ✓ | - |
| completion_date | string | date | ✓ | - |
| estimated_hours | number | numeric | ✓ | - |
| actual_hours | number | numeric | ✓ | - |
| cost | number | numeric | ✓ | - |
| parts_used | string | text | ✓ | - |
| notes | string | text | ✓ | - |
| project_id | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |

---

### 272. `master_engineering_templates`

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

**Columns:** 28

| Column Name | Data Type | Format | Nullable | Description |
|-------------|-----------|--------|----------|-------------|
| id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| template_name | string | character varying | ✗ | - |
| template_description | string | text | ✓ | - |
| discipline | string | character varying | ✗ | - |
| template_category | string | character varying | ✗ | - |
| template_type | string | character varying | ✗ | - |
| risk_level | string | character varying | ✓ | - |
| status | string | character varying | ✓ | - |
| html_content | string | text | ✓ | - |
| json_content | unknown | jsonb | ✓ | - |
| file_attachments | unknown | jsonb | ✓ | - |
| tags | array | text[] | ✓ | - |
| version | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| is_latest | boolean | boolean | ✓ | - |
| project_id | string | uuid | ✓ | Note:
This is a Foreign Key to `projects.id`.<fk table='projects' column='id'/> |
| approval_required | boolean | boolean | ✓ | - |
| approved_by | string | uuid | ✓ | - |
| approved_at | string | timestamp with time zone | ✓ | - |
| published_to_procurement_at | string | timestamp with time zone | ✓ | - |
| dcs_document_id | string | character varying | ✓ | - |
| dcs_version | string | character varying | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| company_id | string | uuid | ✗ | - |
| created_by | string | uuid | ✓ | - |
| updated_by | string | uuid | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 273. `master_templates`

**Description:** Approved organizational template standards for procurement documents

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
| template_name | string | character varying | ✗ | - |
| template_type | string | character varying | ✗ | - |
| procurement_category | string | character varying | ✗ | - |
| category_code | string | character varying | ✓ | - |
| status | string | character varying | ✗ | - |
| content | unknown | jsonb | ✓ | - |
| approval_workflow | unknown | jsonb | ✓ | - |
| version | integer | integer | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| tags | array | text[] | ✓ | - |
| language_support | array | character varying[] | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 274. `match_all_documents`

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
| source_table | string | text | ✓ | - |
| id | string | text | ✓ | - |
| content | string | text | ✓ | - |
| similarity | number | double precision | ✓ | - |

---

### 275. `materials`

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
| name | string | text | ✗ | - |
| type | string | text | ✗ | - |
| specifications | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 276. `migration_rename_log`

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
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| old_table_name | string | text | ✓ | - |
| new_table_name | string | text | ✓ | - |
| rename_status | string | text | ✓ | - |
| error_message | string | text | ✓ | - |
| renamed_at | string | timestamp without time zone | ✓ | - |

---

### 277. `migration_validation_results`

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
| id | integer | integer | ✗ | Note:
This is a Primary Key.<pk/> |
| check_name | string | text | ✓ | - |
| check_type | string | text | ✓ | - |
| status | string | text | ✓ | - |
| details | string | text | ✓ | - |
| checked_at | string | timestamp without time zone | ✓ | - |

---

### 278. `modal_configurations`

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
| id | string | uuid | ✗ | Unique identifier for the modal configuration

Note:
This is a Primary Key.<pk/> |
| modal_key | string | text | ✓ | Unique, human-readable key used for registration and triggering (e.g., "RiskAssessmentModal") |
| display_name | string | text | ✓ | User-friendly name shown in the UI (e.g., "Risk Assessment") |
| component_path | string | text | ✓ | The dynamic import path for the React component file (e.g., "@pages/2400-safety/components/modals/2400-RiskAssessmentModal.js") |
| description | string | text | ✓ | Optional text describing the modal's purpose |
| target_page_prefix | string | text | ✓ | The 4-digit page prefix the modal is primarily associated with (e.g., "2400") |
| chatbot_id | string | text | ✓ | The Flowise/Agent ID associated with this modal (nullable) |
| integration_type | string | text | ✗ | Type of integration, if any (e.g., "Flowise", "n8n", "None") |
| interaction_style | string | text | ✗ | Interaction style for integration modals (e.g., "Input Form", "No Input Form", "None") |
| is_legacy | boolean | boolean | ✗ | Flag to indicate if this configuration represents a legacy (non-React) modal |
| created_at | string | timestamp with time zone | ✗ | Timestamp of when the record was created |
| updated_at | string | timestamp with time zone | ✗ | Timestamp of when the record was last updated |
| target_state | string | text | ✓ | The state group the modal button belongs to (e.g., "Workspace", "Upsert", "Agent", nullable) |
| sector | string | text | ✓ | - |
| sector_id | string | uuid | ✓ | Note:
This is a Foreign Key to `sectors.sector_id`.<fk table='sectors' column='sector_id'/> |
| created_by | string | uuid | ✓ | Reference to the contributor who created this modal configuration |
| updated_by | string | uuid | ✓ | Reference to the contributor who last updated this modal configuration |
| is_active | boolean | boolean | ✓ | - |
| is_deleted | boolean | boolean | ✓ | - |
| sort_order | integer | integer | ✓ | - |
| tags | array | text[] | ✓ | - |
| metadata | unknown | jsonb | ✓ | - |
| modal_type | string | text | ✓ | - |
| page_name | string | text | ✓ | - |
| page_prefix | string | text | ✓ | - |

---

### 279. `monthly_documents_created`

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
| month_year | string | timestamp with time zone | ✓ | - |
| documents_created | integer | bigint | ✓ | - |

---

### 280. `multi_source_tenders`

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
| tender_id | string | uuid | ✓ | Note:
This is a Foreign Key to `tenders.id`.<fk table='tenders' column='id'/> |
| source_id | string | uuid | ✓ | Note:
This is a Foreign Key to `integration_sources.id`.<fk table='integration_sources' column='id'/> |
| external_id | string | character varying | ✗ | - |
| source_system | string | character varying | ✗ | - |
| source_data | unknown | jsonb | ✗ | - |
| transformed_data | unknown | jsonb | ✓ | - |
| data_quality_score | number | numeric | ✓ | - |
| conflict_resolution | string | character varying | ✓ | - |
| last_conflict_at | string | timestamp with time zone | ✓ | - |
| conflict_notes | string | text | ✓ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 281. `notifications`

**Description:** User notifications for tender opportunities and system alerts

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
| user_id | string | character varying | ✗ | - |
| type | string | character varying | ✓ | - |
| title | string | character varying | ✓ | - |
| message | string | text | ✓ | - |
| data | unknown | jsonb | ✓ | Additional structured data for notifications (e.g., tender details, monitor info) |
| is_read | boolean | boolean | ✓ | - |
| read_at | string | timestamp with time zone | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---

### 282. `numbering_config`

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
| organization_id | string | uuid | ✗ | Note:
This is a Primary Key.<pk/> |
| config | unknown | jsonb | ✗ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 283. `numbering_methodologies`

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
| description | string | text | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| pattern_template | string | text | ✗ | - |
| is_default | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 284. `numbering_patterns`

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
| description | string | text | ✓ | - |
| organization_id | string | uuid | ✗ | - |
| pattern | string | text | ✗ | - |
| is_active | boolean | boolean | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |

---

### 285. `operations_equipment`

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
| name | string | text | ✗ | - |
| type | string | text | ✗ | - |
| specifications | unknown | jsonb | ✓ | - |
| created_at | string | timestamp with time zone | ✓ | - |
| updated_at | string | timestamp with time zone | ✓ | - |
| organization_id | string | uuid | ✓ | - |
| user_id | string | uuid | ✓ | - |

---

### 286. `order_derived_template_usage`

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
| template_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_templates.id`.<fk table='procurement_templates' column='id'/> |
| order_id | string | uuid | ✓ | Note:
This is a Foreign Key to `procurement_orders.id`.<fk table='procurement_orders' column='id'/> |
| user_id | string | uuid | ✓ | Note:
This is a Foreign Key to `user_management.user_id`.<fk table='user_management' column='user_id'/> |
| action_type | string | character varying | ✓ | - |
| time_saved_minutes | integer | integer | ✓ | - |
| fields_modified | unknown | jsonb | ✓ | - |
| created_at | string | timestamp without time zone | ✓ | - |
| organization_id | string | uuid | ✓ | Note:
This is a Foreign Key to `organizations.id`.<fk table='organizations' column='id'/> |

---


**📝 Generated**: 2026-03-12T03:45:30.579Z
**📊 Tables Documented**: 143
**🏗️ System**: Construct AI Database Schema - Part 2
