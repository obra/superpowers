# Standardized Metadata and Document Strategy

This document outlines the standardized metadata criteria and a documented strategy for preparing, ingesting, and querying documents within the RAG system. Adhering to this strategy ensures consistency, reliability, and maintainability of the document control system.

## I. Metadata Criteria Document / Strategy

This document should be a living guide for anyone involved in preparing, ingesting, or querying project documents.

### Key Sections:

#### Core Metadata Fields (Universal):

*   **discipline:** (Text) The primary discipline or project phase.
    *   *Example Value:* "contracts post-award", "design", "tendering", "site execution".
    *   *Purpose:* Broad categorization.
*   **document_type_primary:** (Text) The main classification of the document.
    *   *Example Values:* "correspondence", "contract_agreement", "scope_of_work", "variation_instruction", "technical_specification", "drawing", "test_report", "meeting_minutes", "daily_report_log", "photographic_record".
    *   *Purpose:* Key for filtering document sets for specific agent tasks. Use a controlled vocabulary.
*   **document_type_secondary:** (Text, Optional) A more granular classification if needed.
    *   *Example Values (if document_type_primary is "correspondence"):* "letter_to_engineer", "letter_from_engineer", "email_internal", "rfi_response".
    *   *Example Values (if document_type_primary is "test_report"):* "concrete_cube_results", "soil_compaction_tests", "ndt_report".
    *   *Purpose:* Finer-grained filtering when primary type is too broad.
*   **reference_id:** (Text, Critical for specific items) The unique official reference number/ID of the document.
    *   *Example Values:* "UIC/DHBEP/E002", "BB/DHBEP/C002", "VI-003", "CCTR-DHBEP-Phase1", "DWG-STR-BD-105 Rev C".
    *   *Purpose:* Direct lookup of specific, known documents. Strive for consistency in format (e.g., always include "Rev C" if it's part of the ID).
*   **title_subject:** (Text) The official title or subject line of the document.
    *   *Example Value (for a letter):* "RE: Durban Highway Bridge Expansion Project – Claim for Under-Measurement of Concrete Works (IPC No. 5)"
    *   *Example Value (for a drawing):* "Deck Profiles - Sheet 1 of 3"
    *   *Purpose:* Semantic search, human readability.
*   **date_issued:** (Date, YYYY-MM-DD format) The official issue date of the document.
    *   *Example Value:* "2023-11-16"
    *   *Purpose:* Temporal filtering, sorting, context.
*   **source_filename:** (Text) The original filename of the ingested document.
    *   *Example Value:* "Letter_Engineer_to_Contractor_UIC_DHBEP_E002.pdf"
    *   *Purpose:* Traceability, debugging.
*   **project_name_code:** (Text, If managing multiple projects)
    *   *Example Value:* "DHBEP"
    *   *Purpose:* Multi-project data segregation.
*   **tags_keywords:** (Array of Text, Optional) Free-form tags or keywords relevant to the document's content beyond the title.
    *   *Example Values:* ["concrete", "measurement_dispute", "ipc5", "foundation_piles", "delay_claim"]
    *   *Purpose:* Enhance semantic search, ad-hoc querying.

## Discipline/Department Specific Metadata Examples

This section provides examples of document types and specific metadata fields commonly associated with different project disciplines or departments, derived from the application's accordion structure and sorted alphabetically. The `discipline` core metadata field should be used to assign the primary discipline (e.g., "Contracts", "Design", "Construction Management").

### Administration
*(Corresponds to accordion item: 0102-administration)*
*   *(Add relevant document types and fields, e.g., Office Memo, Travel Request, Meeting Minutes)*

### Commercial
*(Corresponds to accordion item: 0200-commercial)*
*   *(Add relevant document types and fields, e.g., Bid Comparison, Cost Report, Commercial Proposal)*

### Construction Management
*(Corresponds to accordion item: 0300-construction)*
*   **Document Type: Daily Report Log (`document_type_primary`: "daily_report_log")**
    *   *(Add relevant fields like weather, manpower, equipment, progress notes)*
*   **Document Type: Meeting Minutes (`document_type_primary`: "meeting_minutes")**
    *   *(Add relevant fields like meeting date, attendees, action items)*
*   **Document Type: Photographic Record (`document_type_primary`: "photographic_record")**
    *   *(Add relevant fields like location, date taken, description)*
*   **Document Type: Site Instruction (`document_type_primary`: "site_instruction")**
    *   *(Add relevant fields)*

### Contracts (Pre-award / Post-award)
*(Corresponds to accordion items: 0400-contracts, 0425-contracts-pre-award, 0435-contracts-post-award)*
*   **Document Type: Variation Instruction / Change Order (`document_type_primary`: "variation_instruction")**
    *   `variation_status:` (Text) e.g., "issued", "approved", "rejected", "pending_valuation", "implemented"
    *   `variation_value_estimated:` (Number, Optional)
    *   `variation_value_agreed:` (Number, Optional)
*   **Document Type: Correspondence (`document_type_primary`: "correspondence")**
    *   `sender_organization:` (Text) e.g., "BridgeBuilders Inc."
    *   `recipient_organization:` (Text) e.g., "Urban Infrastructure Consultants"
    *   `author_name:` (Text, Optional)
    *   `status:` (Text, Optional, e.g., "draft", "sent", "received", "responded")
    *   *Note:* Consider using `document_type_secondary` for types like "letter_to_engineer", "rfi_response", "tender_query", "claim_notice".
*   **Document Type: Contract Agreement (`document_type_primary`: "contract_agreement")**
    *   *(Add relevant fields like contract value, parties, effective date)*
*   **Document Type: Scope of Work (`document_type_primary`: "scope_of_work")**
    *   *(Add relevant fields)*
*   **Document Type: Tender Document (`document_type_primary`: "tender_document")**
    *   *(Add relevant fields)*

### Design / Engineering
*(Corresponds to accordion items: 0800-design and its subsections 0825-architectural, 0835-chemical-engineering, 0850-civil-engineering, 0860-electrical-engineering, 0870-mechanical-engineering)*
*   **Document Type: Drawing (`document_type_primary`: "drawing")**
    *   `drawing_revision:` (Text) e.g., "A", "B", "C", "01"
    *   `drawing_sheet_number:` (Text) e.g., "S-101", "1 of 3"
    *   `drawing_discipline_code:` (Text) e.g., "STR" (Structural), "ARC" (Architectural), "MEC" (Mechanical), "CIV" (Civil), "ELE" (Electrical), "CHE" (Chemical)
*   **Document Type: Technical Specification (`document_type_primary`: "technical_specification")**
    *   *(Add relevant fields like specification code, revision)*
*   **Document Type: Calculation Sheet (`document_type_primary`: "calculation_sheet")**
    *   *(Add relevant fields)*
*   **Document Type: Design Report (`document_type_primary`: "design_report")**
    *   *(Add relevant fields)*

### Developer
*(Corresponds to accordion item: 0872-developer)*
*   *(Add relevant document types and fields, e.g., Code Snippet, API Documentation, Test Script)*
*   *(See also 'Sales' subsection below)*

### Document Control
*(Corresponds to accordion item: 0900-document-control)*
*   **Document Type: Document Transmittal (`document_type_primary`: "document_transmittal")**
    *   *(Add relevant fields like transmittal number, date, recipient, list of documents)*
*   **Document Type: Document Register (`document_type_primary`: "document_register")**
    *   *(Add relevant fields)*

### Ethics
*(Corresponds to accordion item: 1100-ethics)*
*   *(Add relevant document types and fields, e.g., Code of Conduct, Declaration of Interest)*

### Finance
*(Corresponds to accordion item: 1200-finance)*
*   **Document Type: Invoice (`document_type_primary`: "invoice")**
    *   *(Add relevant fields like invoice number, vendor, amount, due date, payment status)*
*   **Document Type: Payment Certificate (`document_type_primary`: "payment_certificate")**
    *   *(Add relevant fields like certificate number, period, certified amount)*
*   **Document Type: Budget Report (`document_type_primary`: "budget_report")**
    *   *(Add relevant fields)*

### Governance
*(Corresponds to accordion item: 1300-governance)*
*   *(Add relevant document types and fields, e.g., Board Resolution, Policy Document)*

### Health, Safety, Environment (HSE)
*(Corresponds to accordion items: 1400-health, 2400-safety, 1000-environmental)*
*   **Document Type: Incident Report (`document_type_primary`: "incident_report")**
    *   *(Add relevant fields like incident date, type, severity, description, actions)*
*   **Document Type: Safety Meeting Minutes (`document_type_primary`: "safety_meeting_minutes")**
    *   *(Add relevant fields)*
*   **Document Type: Environmental Permit (`document_type_primary`: "environmental_permit")**
    *   *(Add relevant fields)*
*   **Document Type: Risk Assessment (`document_type_primary`: "risk_assessment")**
    *   *(Add relevant fields)*
*   **Document Type: Method Statement (`document_type_primary`: "method_statement")**
    *   *(Add relevant fields)*

### Human Resources
*(Corresponds to accordion item: 1500-human-resources)*
*   **Document Type: Employee Contract (`document_type_primary`: "employee_contract")**
    *   *(Add relevant fields)*
*   **Document Type: Timesheet (`document_type_primary`: "timesheet")**
    *   *(Add relevant fields)*
*   **Document Type: Leave Application (`document_type_primary`: "leave_application")**
    *   *(Add relevant fields)*

### Information Technology
*(Corresponds to accordion item: 2050-information-technology)*
*   *(Add relevant document types and fields, e.g., System Documentation, User Guide, Change Request, IT Support Ticket)*

### Landscaping
*(Corresponds to accordion item: 3000-landscaping)*
*   *(Add relevant document types and fields, e.g., Planting Schedule, Maintenance Report)*

### Legal
*(Corresponds to accordion item: 1750-legal)*
*   *(Add relevant document types and fields, e.g., Legal Opinion, Court Document, NDA, Lease Agreement)*

### Local Content
*(Corresponds to accordion item: 1600-local-content)*
*   *(Add relevant document types and fields, e.g., Local Content Plan, Supplier Report)*

### Logistics
*(Corresponds to accordion item: 1700-logistics)*
*   **Document Type: Delivery Note (`document_type_primary`: "delivery_note")**
    *   *(Add relevant fields like delivery date, supplier, items received)*
*   **Document Type: Shipping Manifest (`document_type_primary`: "shipping_manifest")**
    *   *(Add relevant fields)*
*   **Document Type: Customs Declaration (`document_type_primary`: "customs_declaration")**
    *   *(Add relevant fields)*

### Operations
*(Corresponds to accordion item: 1800-operations)*
*   *(Add relevant document types and fields, e.g., Operational Procedure, Maintenance Log, Shift Handover)*

### Procurement
*(Corresponds to accordion item: 1900-procurement)*
*   **Document Type: Purchase Order (`document_type_primary`: "purchase_order")**
    *   *(Add relevant fields like PO number, vendor, items, value)*
*   **Document Type: Material Requisition (`document_type_primary`: "material_requisition")**
    *   *(Add relevant fields)*
*   **Document Type: Request for Quotation (RFQ) (`document_type_primary`: "request_for_quotation")**
    *   *(Add relevant fields)*

### Project Controls
*(Corresponds to accordion items: 2000-project-controls, 2025-quantity-surveying, 2035-scheduling)*
*   **Document Type: Project Schedule (`document_type_primary`: "project_schedule")**
    *   *(Add relevant fields like baseline date, revision, format)*
*   **Document Type: Progress Report (`document_type_primary`: "progress_report")**
    *   *(Add relevant fields like reporting period, key metrics)*
*   **Document Type: Bill of Quantities (BoQ) (`document_type_primary`: "bill_of_quantities")**
    *   *(Add relevant fields)*

### Public Relations
*(Corresponds to accordion item: 2100-public-relations)*
*   *(Add relevant document types and fields, e.g., Press Release, Media Kit, Social Media Post)*

### Quality Assurance / Quality Control (QA/QC)
*(Corresponds to accordion items: 2200-quality-assurance, 2250-quality-control, 2075-inspection)*
*   **Document Type: Test Report (`document_type_primary`: "test_report")**
    *   `test_type:` (Text) e.g., (could be `document_type_secondary` too) "concrete_cube_strength", "compaction", "ndt_report"
    *   `test_result_summary:` (Text) e.g., "pass", "fail", "conditional_pass"
    *   `sample_id:` (Text, if applicable)
    *   *Note:* Consider using `document_type_secondary` for specific test types like "concrete_cube_results", "soil_compaction_tests".
*   **Document Type: Inspection Report (`document_type_primary`: "inspection_report")**
    *   *(Add relevant fields like inspection date, location, inspector, findings, status)*
*   **Document Type: Non-Conformance Report (NCR) (`document_type_primary`: "non_conformance_report")**
    *   *(Add relevant fields)*
*   **Document Type: Quality Plan (`document_type_primary`: "quality_plan")**
    *   *(Add relevant fields)*

### Sales
*(Corresponds to accordion item: 0872-sales subsection)*
*   *(Add relevant document types and fields, e.g., Sales Proposal, Customer Agreement, CRM Record)*

### Security
*(Corresponds to accordion item: 2500-security)*
*   *(Add relevant document types and fields, e.g., Security Plan, Access Log, Incident Report)*

## Email Specific Metadata

Emails often span multiple disciplines and are handled slightly differently due to automated ingestion.

*   **Document Type: Email (`document_type_primary`: "email")**
    *   `sender_email:` (Text) The email address of the sender.
    *   `recipient_to:` (Array of Text) List of email addresses in the 'To' field.
    *   `recipient_cc:` (Array of Text, Optional) List of email addresses in the 'Cc' field.
    *   `date_received:` (DateTime, ISO 8601 format e.g., "YYYY-MM-DDTHH:MM:SSZ") The date and time the email was received. Using ISO 8601 allows for precise temporal filtering.
    *   `email_message_id:` (Text) The unique Message-ID header from the email, crucial for deduplication and threading.
    *   `has_attachments:` (Boolean) Indicates if the email has attachments.
    *   `attachment_filenames:` (Array of Text, Optional) List of filenames of attachments associated with the email.
    *   `auto_classification_primary:` (Text, Optional) Primary category assigned by an automated classification process during ingestion (e.g., "Query", "Instruction", "Notification", "Report", "Meeting").
    *   `auto_classification_secondary:` (Text, Optional) Secondary, more specific category assigned by automation (e.g., "Contract", "Invoice", "Safety", "Schedule", "Personnel").
    *   `auto_extracted_keywords:` (Array of Text, Optional) Keywords automatically extracted from the email body/subject by an NLP process during ingestion.
    *   *Note on Automation:* Fields like `sender_email`, `recipient_to`, `recipient_cc`, `date_received`, `email_message_id`, `has_attachments`, and `attachment_filenames` are typically extracted directly from email headers/structure. Fields prefixed with `auto_` are intended to be populated by automated classification/NLP tools during the ingestion pipeline triggered by incoming emails.

## Naming Conventions and Formatting

*   Specify case sensitivity (recommend lowercase for keys and controlled vocabulary values).
*   Date format (YYYY-MM-DD).
*   Rules for constructing `reference_id` if not always explicit in the document.

#### Ingestion Process Guidelines:

*   Who is responsible for ensuring metadata accuracy during ingestion?
*   Tools/scripts used for metadata extraction and assignment.

## II. How This Metadata Strategy Informs Custom JS Functions and Searches

Once you have this clear metadata strategy, your Custom JS Functions and agent prompts become much more robust and easier to write.

### Example: seqCustomFunction_0 ("prepare-variation-rpc-filter")

With Metadata Strategy:

You know that all formal Variation Instructions will have `metadata.document_type_primary = "variation_instruction"`.
You know the unique ID will be in `metadata.reference_id`.

The JavaScript becomes:

```javascript
const vars = arguments[0];
let analysisSummary = null;
if (vars && vars.analysis_summary_from_state) {
    analysisSummary = vars.analysis_summary_from_state;
}

let rpcFilterClauses = [
    \`filter("metadata->>discipline", "eq", "contracts post-award")\`, // Assuming this is a constant
    \`filter("metadata->>document_type_primary", "eq", "variation_instruction")\` // From your defined vocabulary
];

if (analysisSummary && typeof analysisSummary === 'string') {
    const variationSectionMatch = analysisSummary.match(/For Variation\/Change Retrieval:([\s\S]*?)(?=\n\n\s*(?:-|\*\*)|$)/i);
    if (variationSectionMatch && variationSectionMatch[1]) {
        const variationPointerSection = variationSectionMatch[1];
        const refIdMatch = variationPointerSection.match(/Extracted Identifier:\s*["']?([^"'\n]+?)["']?/im);
        if (refIdMatch && refIdMatch[1]) {
            const extractedRefId = refIdMatch[1].trim();
            if (extractedRefId.toUpperCase() !== 'N/A' && extractedRefId !== '') {
                rpcFilterClauses.push(\`filter("metadata->>reference_id", "eq", "${extractedRefId}")\`); // Using your defined field
            }
        }
    }
}
// ... (rest of RPC string formatting) ...
// Assuming finalRpcFilterString is constructed correctly elsewhere
return { "dynamic_variation_rpc_filter_string": finalRpcFilterString };
```

### Example: seqCustomFunction_1 ("prepare-tech-doc-rpc-filter")

With Metadata Strategy:

You define that technical documents can be: `document_type_primary: "technical_specification", "drawing", "test_report"`.
And for your concrete cube tests, `document_type_secondary: "concrete_cube_results"`.

The JavaScript:

```javascript
// ...
const technicalDocPrimaryTypes = ["technical_specification", "drawing", "test_report"];
// Create a string like ('type1','type2','type3')
const primaryTypesTupleString = \`("\${technicalDocPrimaryTypes.join('","')}")\`;

let rpcFilterClauses = [
    \`filter("metadata->>discipline", "eq", "contracts post-award")\`,
    \`filter("metadata->>document_type_primary", "in", \${primaryTypesTupleString})\`
];

// Optional: If analysisSummary specifically points to a "Concrete Cube Test Register"
// you might add an OR condition or a more specific filter if the agent needs ONLY that.
// For now, this generic filter gets all defined technical document types.
// The agent (seqAgent_3) will use semantic search on the 'Semantic Query Text'
// (e.g., "Concrete Cube Test Register (Ref: CCTR-DHBEP-Phase1) for widened deck sections")
// to pinpoint the exact document within this filtered set.

// If analysisSummary had a very specific extracted ID for a tech doc, e.g., "CCTR-DHBEP-Phase1",
// and you wanted to *only* get that, you could add:
// rpcFilterClauses.push(\`filter("metadata->>reference_id", "eq", "CCTR-DHBEP-Phase1")\`);
// But this depends on how seqAgent_0 provides pointers and how seqAgent_3 is expected to work (one doc vs. many).
// The current JS provided in previous answer handles one specific ID if found in analysis_summary.

// ... (rest of RPC string formatting) ...
// Assuming finalRpcFilterString is constructed correctly elsewhere
return { "dynamic_tech_doc_rpc_filter_string": finalRpcFilterString };
```

## Benefits of This Approach:

*   **Consistency:** All documents are tagged the same way.
*   **Reliability:** Filters become more precise because they target known, standardized metadata fields and values.
*   **Maintainability:** If you need to change how you categorize documents, you update the Metadata Strategy Document and then can systematically update your JS functions and agent prompts.
*   **Scalability:** Easier to add new document types or metadata fields in a structured manner.
*   **Clearer Agent Prompts:** You can instruct agents like "Search for documents where `document_type_primary` is `variation_instruction` and `reference_id` is {X}".
*   **Improved Debugging:** When a retrieval fails, you can consult your metadata strategy and the actual metadata of your documents to pinpoint the mismatch.

## Action Items:

1.  **Draft your Metadata Criteria Document:** (This document).
2.  **Review/Update Your Ingested Data:**
    *   Check if your existing documents in `a_00435_contracts_post_vector` align with this new strategy. You may need to re-process or update metadata for existing documents. This is a crucial step. For example, the "CCTR-DHBEP-Phase1" needs to have its `document_type_primary` (or `_secondary`) set to something your "prepare-tech-doc-rpc-filter" function will include.
3.  **Update Custom JS Functions:**
    *   Modify `seqCustomFunction_0` and `seqCustomFunction_1` (and any new ones) to use the standardized metadata field names (e.g., `metadata->>document_type_primary`, `metadata->>reference_id`) and values from your controlled vocabulary.
4.  **Update Supabase Node Static Filters (if any remaining):**
    *   For `supabase_0` (contracts-assistant's retriever): Its static filter `{"discipline":"contracts post-award","document":"contract"}` might become `{"discipline":"contracts post-award","document_type_primary":"contract_agreement"}` or `{"discipline":"contracts post-award","document_type_primary":"scope_of_work"}` (or it might query for both if the contract-retriever tool is meant to search both). This depends on what `seqAgent_0` is actually trying to retrieve with its tool.
    *   For `supabase_1` (correspondence-assistant's retriever): The static filter `{"discipline":"contracts post-award","document":"correspondence"}` would become `{"discipline":"contracts post-award","document_type_primary":"correspondence"}`. This is likely fine.
5.  **Update Agent Prompts:**
    *   Where agents are instructed to look for or identify document types, use the standardized `document_type_primary` values.

This upfront work on a metadata strategy will save a lot of pain down the line and make your RAG system much more robust and predictable.
