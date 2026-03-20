# 01900 Procurement Input Agent Workflow Procedure

> Procedure for the AI-powered procurement order creation workflow

## Overview

The Procurement Input Agent guides users through creating a procurement order using a conversational interface. It leverages the hierarchical `procurement_categories` table to provide structured selection of procurement items.

---

## Database Schema

### Table: `procurement_categories`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `parent_id` | UUID | Reference to parent category (null for Level 1) |
| `hierarchy_level` | INT | 1 = Group, 2 = Category, 3 = Item |
| `code` | TEXT | Category code (e.g., "A", "C06", "C0601") |
| `name` | TEXT | English name |
| `name_fr` | TEXT | French name |
| `requires_sow` | BOOLEAN | Whether item requires Scope of Work |
| `requires_cdc` | BOOLEAN | Whether item requires CDC compliance |
| `display_order` | INT | Sort order |
| `is_active` | BOOLEAN | Active status |

### Hierarchy Structure

```
Level 1 (Group)     Level 2 (Category)           Level 3 (Item)
─────────────────────────────────────────────────────────────────
A - Energy          A00 - Water                  A0001 - Industrial water
                    A01 - Electricity             A0101 - National electricity
                    A03 - Fuel oil               A0301 - Fuels
                                                 A0302 - Domestic fuel
                    ...
C - Industrial      C00 - Handling accessories   C0001 - Forklift buckets
supplies            C04 - Industrial supplies    C0401 - Hand tools
                    C06 - Lubricants             C0601 - Engine oils
                                                 C0602 - Hydraulic oils
                    ...
```

---

## Document Categories

The procurement workflow integrates with the unified template management system. When creating procurement orders, users can select from the following document categories:

### Document Category Selection
| Category | Description | Use in Procurement |
|----------|-------------|-------------------|
| 📋 **Form** | Interactive questionnaires and data collection | Order forms, request forms |
| 📄 **Template** | Reusable document templates and frameworks | SOW templates, Cover sheets |
| 📎 **Appendix** | Supporting documentation | Technical specs, compliance docs |
| 📅 **Schedule** | Timeline and milestone documentation | Delivery schedules |
| 🔧 **Specification** | Technical and functional requirements | Equipment specs, requirements |

### Template Types for Procurement

| Template Type | Description | Example Usage |
|---------------|-------------|---------------|
| `scope_of_work` | Scope of Work document | Generated SOW for complex items |
| `procurement` | Procurement order forms | Standard procurement templates |
| `cover_sheet` | Cover sheet for submissions | Order cover pages |

### Complexity Levels (Auto-determined from Items)

| Complexity | Criteria | Appendices Required |
|-----------|----------|-------------------|
| **Simple** | Value < R50,000, <3 items | A, C |
| **Standard** | Value R50k-R500k, 3-10 items | A, B, C, E |
| **Complex** | Value > R500k, >10 items | A, B, C, D, E, F |
| **Emergency** | Urgent/ASAP timeline | A, B, C |
| **Compliance** | Regulated items (requires_sow) | A, B, C, F |

---

## Workflow Stages

### Stage 1: Select GROUP (Level 1)

**Prompt:** "What GROUP would you like to start with?"

**Options:** 12 main procurement groups:
1. Energy and Fluid
2. Industrial equipment*
3. Industrial supplies and consumables
4. Overheads
5. Real Estate
6. Computing and Telecoms
7. Logistics and packaging
8. Raw materials and semi-products
9. Services to sites
10. Intellectual services
11. Industrial services/subcontracting
12. Production subcontracting

**User Action:** Select by number (1-12) or name

**Transition:** On selection → Show Level 2 categories for selected Group

---

### Stage 2: Select CATEGORY (Level 2)

**Prompt:** "Now please select a CATEGORY:"

**Options:** Subcategories for the selected Group (varies by group)

Example for "Industrial supplies and consumables":
1. Handling accessories
2. Processing consumables excluding refractories
3. Industrial laboratory equipment and consumables
4. Medical equipments and supplies
5. Industrial supplies
6. Industrial gas
7. Lubricants
8. Chemical products
9. Refractory products and insulators

**User Action:** Select by number (1-9) or name

**Transition:** On selection → Show Level 3 items for selected Category

---

### Stage 3: Select ITEMS (Level 3) OR Add Custom Items

**IMPORTANT:** This stage handles two distinct scenarios based on whether the selected category has predefined items in the database.

---

#### Database Hierarchy Explanation

The `procurement_categories` table has a self-referential structure:

```
Level 1 (Group)     Level 2 (Category)           Level 3 (Item)
─────────────────────────────────────────────────────────────────
A - Energy          A00 - Water                  A0001 - Industrial water
(Parent)            (parent_id = A's id)         (parent_id = A00's id)
```

- **Level 1 (Group)**: 12 main procurement groups (e.g., "Industrial Equipment")
- **Level 2 (Category)**: Subcategories under each group (e.g., "Lubricants")
- **Level 3 (Item)**: Specific items under categories (e.g., "Engine Oils")

**Key Point**: Not ALL Level 2 categories have Level 3 children. Some categories only have Level 1 and Level 2.

---

#### Case A: Categories WITH Level 3 Items (Predefined Items Exist)

**When does this apply?**
- When the selected Level 2 category has child records with `hierarchy_level = 3`
- Database query returns items for this category

**Technical Implementation:**
```javascript
const items = categories.filter(
  cat => cat.hierarchy_level === 3 && cat.parent_id === categoryId
);
```

**Example - "Lubricants" (C06) Category:**
```
Database query: WHERE hierarchy_level = 3 AND parent_id = 'C06-uuid'
Returns:
- C0601: Engine Oils
- C0602: Hydraulic Oils  
- C0603: Gear Oils
- C0604: Compressor Oils
- C0605: Grease & Lubricants
```

**Interface Display:**
```
Selected: Lubricants

Now please select ITEMS:

1. Engine Oils
2. Hydraulic Oils
3. Gear Oils
4. Compressor Oils
5. Grease & Lubricants
...

(Type number or name to add items, or "back" to choose a different category)
```

**User Actions:**
- **Select by number:** Enter "1" to add "Engine Oils"
- **Select by name:** Enter "hydraulic" to add "Hydraulic Oils"
- **Select multiple:** Enter "1, 2, 3" to add multiple items at once
- **"back"**: Return to category selection

**After Selection - Item Added Response:**
```
✅ Added: Engine Oils

Current Items:
1. Engine Oils

Would you like to add more items? 
(Type another number/name, or "done" to finish)
```

---

#### Case B: Categories WITHOUT Level 3 Items (No Predefined Items)

**When does this apply?**
- When the selected Level 2 category has NO child records with `hierarchy_level = 3`
- Database query returns empty array
- OR the category itself IS a Level 1 (Group) that was selected directly

**Categories that typically have NO Level 3 items:**
| Category | Reason |
|----------|--------|
| Real Estate | Too many property types to define (offices, warehouses, land, etc.) |
| Services to Sites | Service requirements are project-specific and unique |
| Intellectual Services | Consulting, legal, engineering services vary by engagement |
| Computing & Telecoms | Hardware + Services combination, items vary wildly |
| Overheads | Generic administrative items, not specific products |

**Technical Implementation:**
```javascript
const items = categories.filter(
  cat => cat.hierarchy_level === 3 && cat.parent_id === categoryId
);

if (items.length === 0) {
  // Show custom entry interface
}
```

**Interface Display:**
```
Selected: Real Estate

┌─────────────────────────────────────────┐
│ ℹ️ No predefined items for this       │
│    category in our database.           │
│                                         │
│ Our database has categories but not     │
│ specific items for Real Estate.        │
└─────────────────────────────────────────┘

Please describe what you need:

(Type your requirements or enter details for this procurement)
```

**Example User Inputs for Real Estate:**
- "Office space rental - 500 sqm in Sandton, Johannesburg"
- "Warehouse lease - 2000 sqm in Durban port area"
- "Land rental for construction equipment storage"

**Example User Inputs for Services:**
- "Legal consultation for contract review - estimated 20 hours"
- "IT consulting for network infrastructure setup"
- "Engineering inspection services for structural assessment"

**What Happens (Technical):**
1. User enters free text description
2. Item stored with flag: `custom_item: true`
3. Original category preserved: `categoryId`, `categoryName`
4. Custom description stored: `custom_description: "user input"`
5. System flags for manual processing: `requires_review: true`

**Database Entry:**
```javascript
{
  id: "uuid",
  categoryId: "real-estate-uuid",
  categoryName: "Real Estate",
  custom_item: true,
  custom_description: "Office space rental - 500 sqm in Sandton",
  requires_review: true,
  quantity: 1
}
```

**User Actions:**
- **Free text:** Enter detailed item description
- **"back"**: Return to category selection

---

#### Flow Decision Tree

```
User selects Category (Level 2)
         │
         ▼
┌─────────────────────┐
│ Query database for  │
│ Level 3 items      │
└─────────────────────┘
         │
    ┌────┴────┐
    ▼           ▼
Items found   No items
    │           │
    ▼           ▼
Case A        Case B
(Predefined) (Custom)
```

---

### Stage 3B: Upload/Attach Detailed Items

After selecting items (or entering custom items), user can attach detailed specifications:

**Prompt:**
```
You have selected X item(s).

Would you like to upload specifications, drawings, or detailed requirements for these items?
(Attach files or enter details, or type "skip" to continue)
```

**User Actions:**
- **Upload files:** Attach PDF, DOC, images
- **Enter details:** Type specifications
- **"skip"**: Continue without attachments

---

### Stage 4: Additional Information (Required)

After items are confirmed, the agent prompts for:

#### 4a. Estimated Value Interface

**Prompt:**
```
Great! You have selected X item(s).

Now let's gather some additional information:

📊 Step 1 of 4: Estimated Value

What is the estimated value for this procurement?
(Enter amount, e.g., "50000 ZAR" or "1000 USD")
```

**User Input:** Numeric value with optional currency

#### 4b. Delivery Location & Country

**Prompt:**
```
📍 Step 2 of 4: Delivery Location

Where should this order be delivered?

1. Delivery Country: (Select from list)
   - South Africa (ZA)
   - Guinea (GN)
   - Other...

2. Delivery Address: (Enter full address)

3. Required Delivery Date: (Enter date)
```

**Important for CDC:** If delivery country is **Guinea (GN)**, additional CDC data collection is triggered in Stage 4e.

#### 4c. Requirements/Notes Interface

**Prompt:**
```
📝 Step 3 of 4: Requirements

Are there any specific requirements or notes for this order?
(Type your requirements or enter "none" if no special requirements)
```

**Note:** Procurement Type is AUTO-GENERATED based on selected category:
- Group A (Energy) → Materials
- Group B (Industrial Equipment) → Equipment
- Group C (Industrial Supplies) → Materials
- Group J (Services to Sites) → Services
- Group K (Intellectual Services) → Services

#### 4d. Timeline/Urgency Interface

**Prompt:**
```
⏰ Step 4 of 4: Timeline

When do you need this procurement?
1. Immediate / ASAP
2. This week
3. This month
4. Standard (2-4 weeks)
5. Long-term

(Enter number or type the urgency)
```

#### 4e. CDC Data Collection (Conditional - Guinea Only)

**Trigger:** Delivery country = Guinea (GN)

**Prompt:**
```
🌍 GUINEA CDC REQUIREMENTS DETECTED

This order will be delivered to Guinea and requires CDC 
(Déclaration en Détail en Douane) customs declaration.

Please provide the following information for customs clearance:

📋 IMPORTER DETAILS (Required for CDC)
─────────────────────────────────────
1. Importer Name: (Company name in Guinea)
2. NIF (Tax ID): (Numéro d'Identification Fiscale)
3. Importer Address: (Full address in Guinea)
4. Importer Phone: (Guinea phone number)

📦 ITEM DETAILS (Required for CDC)
─────────────────────────────────────
For each item, please provide:
- HS Code (8-10 digits for Guinea)
- Country of Origin (e.g., CN, ZA, US)
- Gross Weight (kg)
- Net Weight (kg)

Would you like to:
1. Enter CDC details now
2. Skip for now (CDC data required before shipping)
3. Upload CDC documentation

Note: CDC details can be completed later but are required 
before goods can be shipped to Guinea.
```

**CDC Data Fields to Collect:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `importer_name` | VARCHAR(255) | Yes | Company name in Guinea |
| `importer_nif` | VARCHAR(20) | Yes | Guinea tax ID |
| `importer_address_guinea` | TEXT | Yes | Full address in Guinea |
| `importer_phone_guinea` | VARCHAR(20) | Yes | Guinea phone number |
| `hs_code_guinea` | VARCHAR(10) | Per item | 8-10 digit HS code |
| `country_of_origin` | VARCHAR(2) | Per item | ISO country code |
| `gross_weight` | DECIMAL(10,2) | Per item | Weight in kg |
| `net_weight` | DECIMAL(10,2) | Per item | Weight in kg |

**DDI Threshold Check:**
- If order value > 12,000,000 GNF (~USD 1,250), DDI is required
- System auto-calculates GNF value from order currency
- DDI reference field displayed if threshold exceeded

---

### Stage 5: SOW Requirements Check (CDC handled later)

If ANY selected item has `requires_sow = true`, this stage appears:

**Interface Display (SOW Required):**
```
⚠️ SOW REQUIREMENT DETECTED

The following items require a Scope of Work (SOW) document:

1. Engine Oils - Requires SOW
2. Hydraulic Oils - Requires SOW

Would you like to:
1. Generate SOW now
2. Upload existing SOW
3. Skip (manual SOW later)
```

**Interface Display (CDC Required - Handled in Logistics Phase):**
```
ℹ️ CDC COMPLIANCE NOTE

The following items require CDC (Customs) compliance:

1. [Item Name] - Requires CDC

Note: CDC/customs details will be collected in the LOGISTICS phase 
of the procurement workflow (next step after order creation).

You can proceed with creating the order now.
```

**Note on CDC:**
> CDC (Customs/Duty Compliance) details are handled in the **LOGISTICS PHASE** of the procurement workflow, not during order creation. This includes:
> - Country of origin
> - HS Codes
> - Import licenses
> - Customs documentation
> - Duty calculations

This is handled in a separate logistics workflow after the procurement order is approved.

---

### Stage 6: Template/Form Selection

Before finalizing, users can select which template/form to use for this procurement order.

**Interface Display:**
```
📄 TEMPLATE SELECTION

Based on your order details:
- Type: [Equipment/Services/Materials]
- Complexity: [Simple/Standard/Complex]
- SOW Required: [Yes/No]

Please select a template for this order:

1. 📋 Standard Procurement Form
   - Basic order form with standard fields
   - Suitable for: Simple orders

2. 📄 SOW Template (Scope of Work)
   - Detailed SOW document
   - Required for: Items requiring SOW

3. 📎 Cover Sheet Template
   - Professional cover page
   - Optional for: All orders

4. 🔧 Technical Specification Template
   - Detailed technical requirements
   - Required for: Equipment orders

Would you like to:
1. Select a template
2. Skip template (use default)
3. Create custom template
```

**Template Selection Options:**
- **Procurement Form** (type: `procurement`) - Standard order form
- **SOW Template** (type: `scope_of_work`) - For items requiring SOW
- **Cover Sheet** (type: `cover_sheet`) - Professional cover page
- **Technical Spec** (type: `specification`) - For equipment

**Template Sources:**
- Loaded from `templates` table
- Filtered by `type` and `discipline`
- Prioritized by complexity match

---

### Stage 7: Review & Confirm

**Interface Display:**
```
✅ Timeline set: this month
✅ Template: Standard Procurement Form

═══════════════════════════════
📋 ORDER SUMMARY
═══════════════════════════════

📦 Group: [Group Name]
📁 Category: [Category Name]
🛒 Items: X item(s)
   1. [Item 1]
   2. [Item 2]

📎 Attachments: [X files attached or "None"]
📄 Template: [Selected Template Name]

💰 Estimated Value: ZAR 50,000
📋 Type: [Auto-generated: Equipment/Services/Materials]
📝 Requirements: [Notes or "None"]
⏰ Timeline: [Timeline]

⚠️ Special Requirements:
   - SOW Required: [Yes/No]
   - CDC Required: [Yes/No]

═══════════════════════════════

Would you like to proceed with creating this procurement order?
(Enter "yes" to confirm or "no" to cancel)
```

---

### Extended Workflow: SOW Generation (if required)

If user selects "Generate SOW" in Stage 5:

**Prompt:**
```
📝 SOW GENERATION

Based on your selection:
- Category: [Category Name]
- Items: [List]
- Value: [Amount]
- Timeline: [Timeline]

I will now generate a Scope of Work document.

[Generation in progress...]

✅ SOW Generated Successfully!

Would you like to:
1. Review SOW
2. Edit SOW
3. Proceed with order
```

---

> **Note:** CDC (Customs/Duty Compliance) workflow is handled in the **LOGISTICS PHASE** of procurement, not during order creation. See separate logistics documentation for CDC processing.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/procurement/agent/start-session` | POST | Initialize new session |
| `/api/procurement/agent/message` | POST | Send message to agent |
| `/api/procurement/agent/end-session` | POST | End session |
| `/api/procurement/agent/session/:id` | GET | Get session state |
| `/api/procurement/agent/health` | GET | Health check |

---

## Session Data Structure

```javascript
{
  id: "uuid",
  userId: "user-id",
  orderType: "default",
  state: "idle|active|extracting|validating|complete|abandoned",
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp",
  messages: [
    { role: "user", content: "...", timestamp: "..." },
    { role: "agent", content: "...", timestamp: "..." }
  ],
  extractedData: {
    group: "Group name",
    groupId: "UUID",
    groupCode: "A",
    category: "Category name",
    categoryId: "UUID",
    categoryCode: "C06",
    items: [
      { 
        id: "UUID", 
        name: "Engine oils", 
        code: "C0601", 
        quantity: 1, 
        requires_sow: true,
        // CDC fields (for Guinea deliveries)
        hs_code_guinea: "27101981",
        country_of_origin: "ZA",
        gross_weight: 150.00,
        net_weight: 145.00
      }
    ],
    estimated_value: { value: 50000, currency: "ZAR", confidence: 0.8 },
    procurement_type: { value: "equipment", confidence: 0.85 },
    timeline: { urgency: "high", timeframe: "immediate" },
    requirements: "Free text notes",
    // Delivery location fields
    delivery_country: "GN",
    delivery_address: "123 Rue du Commerce, Conakry, Guinea",
    required_delivery_date: "2026-03-15",
    // CDC Importer fields (for Guinea deliveries)
    cdc_data: {
      importer_name: "Company SARL",
      importer_nif: "123456789A",
      importer_address_guinea: "123 Rue du Commerce, Conakry",
      importer_phone_guinea: "+224 123 456 789",
      ddi_required: true,
      ddi_reference: null,  // To be obtained
      order_value_gnf: 75000000
    }
  },
  stage: "initial|category|items|delivery|cdc|complete"
}
```

---

## Error Handling

| Error | Handling |
|-------|----------|
| Session not found | Throw error with session ID |
| Category fetch fails | Fallback to basic query without filters |
| Invalid stage transition | Reset to initial stage |
| No items selected | Prompt: "Please select at least one item" |
| Invalid numeric input | Prompt for valid number |

---

## Related Files

- **Service:** `server/src/services/procurementAgentSessionService.js`
- **Routes:** `server/src/routes/procurement-agent-session-routes.js`
- **Frontend Hook:** `client/src/pages/01900-procurement/hooks/useProcurementAgentSession.js`
- **Knowledge Base:** `deep-agents/ai_it_knowledge/disciplines/01900-procurement.md`

---

## Last Updated

- 2026-02-16
