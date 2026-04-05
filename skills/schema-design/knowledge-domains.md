# Knowledge Domains — schema-design

<EXTREMELY-IMPORTANT>
Load this file at the start of the LOGICAL_MODEL stage. These knowledge domains inform your recommendations through LOGICAL_MODEL, PHYSICAL_MODEL, UX_DENORMALIZATION, and PARITY_CHECK. Do not load this file at INIT — it is not needed until modeling begins.
</EXTREMELY-IMPORTANT>

---

## 1. Dataverse Column Types

| Category | Types | When to use |
|---|---|---|
| **Text** | Single line of text, Multiple lines of text, Rich text, Email, URL, Ticker symbol, Phone | Single line for most text. Rich text only when formatting is needed. Use format-specific types (Email, URL, Phone) for validation. |
| **Number** | Whole number, Decimal, Float, Currency | Whole number for integers and picklist-backing values. Currency for money (respects org currency settings). Avoid Float unless scientific data. |
| **Date/Time** | Date only, Date and time | Date only for birthdays, deadlines. Date and time for events, timestamps. Choose behavior carefully: User Local, Date Only, Time Zone Independent. |
| **Choice** | Choice (local), Choices (multi-select), Yes/No | Choice for single-select enumerations. Choices for multi-select (limited query support). Yes/No for boolean flags. |
| **Lookup** | Lookup, Customer, Regarding | Lookup for standard FK relationships. Customer for polymorphic Account/Contact. Regarding for Activity-type tables. |
| **Calculated** | Calculated, Rollup, Formula | Calculated for same-record derivations. Rollup for child-aggregate values. Formula for real-time cross-record calculations (newer, limited type support). |
| **File/Image** | File, Image | File for attachments (up to 128MB). Image for entity record images. |
| **Other** | Autonumber, Unique identifier | Autonumber for human-readable sequences. GUID is auto-created as primary key. |

---

## 2. Dataverse Table Types

| Type | When to use | Key characteristics |
|---|---|---|
| **Standard** | Default for most business entities | Full CRUD, security, audit, workflows |
| **Activity** | Entities representing interactions (emails, calls, tasks, appointments) | Inherits from Activity entity. Appears in timeline. Has activity parties (From, To, CC). |
| **Virtual** | External data surfaced without import | No local storage. OData provider connects to external source. Read-only or read-write depending on provider. Limited query support. |
| **Elastic** | High-volume, high-throughput scenarios | Cosmos DB backing. Partitioning support. No relational joins. |

---

## 3. Relationship Behavior Reference

| Behavior | Assign | Delete | Share | Reparent | Use when |
|---|---|---|---|---|---|
| **Parental** | Cascade | Cascade | Cascade | Cascade | Parent owns child lifecycle. Deleting parent deletes all children. |
| **Referential** | None | Restrict | None | None | Related but independent. Cannot delete parent while children reference it. |
| **Referential, Restrict Delete** | None | Restrict | None | None | Same as Referential — explicit about delete restriction. |
| **Custom** | [configurable] | [configurable] | [configurable] | [configurable] | When standard behaviors don't fit. Document rationale. |
| **None (Remove Link)** | None | Remove Link | None | None | Deleting parent nullifies lookup on children. Children become orphans. Use sparingly. |

---

## 4. Naming Convention Rules

These rules apply unless the developer overrides with project-specific conventions during LOGICAL_MODEL:

1. **Publisher prefix is mandatory** on all custom tables and columns
2. **Logical names are lowercase** with no spaces — underscores separate words
3. **Display names are Title Case** with spaces
4. **Singular nouns for table names** (Project, not Projects)
5. **No abbreviations** unless universally understood (ID, URL, etc.)
6. **Lookup columns end with `id`** in logical name (`sdfx_projectid`)
7. **Boolean columns start with `is` or `has`** (`sdfx_isactive`, `sdfx_haschildren`)
8. **Choice columns named for the concept**, not "status" generically (`sdfx_approvalstatus`, not `sdfx_status2`)
9. **Avoid reserved words:** Name, Type, Status, State, Owner are used by system columns — prefix custom columns to avoid collision

---

## 5. Known Anti-Patterns

| Anti-pattern | Why it's a problem | Mitigation |
|---|---|---|
| Wide tables (100+ columns) | Performance degradation, difficult form design, maintenance burden | Split into related tables or use JSON columns for rarely-used attributes |
| Deep cascade chains (5+ levels) | Cascade operations can timeout; difficult to reason about side effects | Flatten hierarchy or use referential relationships for distant relations |
| Overuse of N:N without attributes | If the relationship needs attributes (e.g., role, date), native N:N won't support it | Use a custom intersection table with 1:N from both sides |
| Global option sets for local concepts | Changes affect all entities using the option set; version control complexity | Use local choices unless the values genuinely must be shared |
| Missing alternate keys on integration entities | Upsert operations require alternate keys; without them, integrations must maintain GUID mappings | Define alternate keys on natural business identifiers |
| Calculated columns for cross-entity logic | Calculated columns only reference same-record fields; cross-entity requires rollup or plugin | Use rollup columns or plugin-maintained fields for cross-entity calculations |

---

## 6. Parity Check Reference

### System Tables to Check Against

Before creating custom tables, verify the concept isn't already covered by platform tables:

**Dataverse system tables:**
Contact, Account, Team, Business Unit, Currency, Transaction Currency, Note (Annotation), Connection, Queue, Queue Item, Activity, Email, Phone Call, Task, Appointment, Letter, Fax

**Common Dynamics 365 tables (if D365 is in use):**
Lead, Opportunity, Case (Incident), Quote, Order, Invoice, Product, Price List, Price List Item, Campaign, Marketing List, Service, Resource, Booking

**Project Operations tables (if PO is in use):**
Project, Project Task, Resource, Resource Requirement, Booking, Time Entry, Expense, Expense Category, Journal, Journal Line

### Platform Patterns to Check Against

| Pattern | When to use instead of custom | Key characteristic |
|---|---|---|
| **Activity pattern** | Entity represents interactions with timeline support (emails, calls, meetings, custom activities) | Inherits Activity entity, appears in timeline, has To/From/CC parties |
| **Connection pattern** | Flexible many-to-many relationships that don't warrant a formal N:N | Connection roles define relationship types; no custom intersection table needed |
| **Queue pattern** | Work items that need routing, assignment, and processing order | Queue membership, routing rules, SLA support |
| **Note/Annotation pattern** | Comments, attachments, or supplementary information on records | Timeline integration, file attachment support, shared across entity types |
| **Business Process Flow pattern** | Guided workflows with stage gates and required fields per stage | Visual progress tracking, stage-based field requirements, branching logic |

### Anti-Pattern Severity Classification

When reporting parity check findings, classify severity as:

- **HIGH:** Custom table directly duplicates a system table with the same purpose (e.g., custom Contact table when standard Contact exists)
- **MEDIUM:** Schema misses a platform pattern that would provide significant built-in functionality (e.g., custom task tracking without Activity pattern consideration)
- **LOW:** Minor optimization opportunity (e.g., could use Connection pattern instead of simple N:N, but current approach works)
