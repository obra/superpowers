# Schema Documentation

**Database Schema Documentation for Construct AI**

This directory contains documentation, reports, and code related to the database schema structure and organization.

---

## 📁 Directory Structure

```
docs/schema/
├── README.md                           # This file
│
├── code/                               # Schema extraction code
│   ├── DATABASE_SCHEMA_MASTER_GUIDE.md
│   ├── README_RLS_EXTRACTION.md
│   ├── SETUP_TEAM_SCHEMA_REGENERATION.md
│   ├── extract_rls_policies.sql
│   ├── extract-buttons-modals.js
│   ├── extract-chatbots.js
│   ├── extract-deep-agents.js
│   ├── extract-pages.js
│   ├── extract-schema-openapi.js
│   ├── format_rls_policies.js
│   └── startup-schema-regeneration.js
│
├── docs/                               # Additional documentation
│   └── schema/
│       └── reports/
│           └── 0300_DATABASE_SCHEMA_MASTER_GUIDE.md
│
└── reports/                            # Generated schema reports
    ├── index-buttons-modals.md
    ├── index-chatbots.md
    ├── index-deep-agents.md
    ├── index-discipline-pages.md
    ├── index-non-discipline-pages.md
    ├── index-pages.md
    ├── index-policies.md
    ├── index-table.md
    ├── current-full-schema.md
    ├── current-full-schema.sql
    ├── openapi-spec.json
    ├── schema-part-01.md through schema-part-04.md
    └── 00400-contracts-analysis/
        └── ...
```

---

## 🚀 Quick Start

### Finding Schema Information

1. **Full Schema**: See `reports/current-full-schema.md` or `.sql`
2. **Table Indexes**: Check `reports/index-*.md` files
3. **Component Reports**: Browse `reports/` for specific areas
4. **Extraction Code**: See `code/` for schema extraction tools

### Key Reports

| Report | Purpose |
|--------|---------|
| `current-full-schema.md` | Complete database schema |
| `index-pages.md` | Page-related tables |
| `index-discipline-pages.md` | Discipline page tables |
| `index-buttons-modals.md` | Button and modal tables |
| `index-chatbots.md` | Chatbot-related tables |
| `index-policies.md` | RLS policy index |

---

## 📋 Report Categories

### Index Reports (`reports/index-*.md`)
Organized indexes of database components:
- **index-pages.md**: All page-related tables
- **index-discipline-pages.md**: EPCM discipline pages
- **index-non-discipline-pages.md**: Non-discipline pages
- **index-buttons-modals.md**: Button and modal configurations
- **index-chatbots.md**: Chatbot implementations
- **index-deep-agents.md**: Deep agent tables
- **index-policies.md**: RLS policies

### Schema Parts (`reports/schema-part-*.md`)
Chunked schema documentation for easier navigation:
- Part 1: Core tables
- Part 2: Page tables
- Part 3: Agent tables
- Part 4: Configuration tables

### Full Schema (`reports/current-full-schema.*`)
- **.md**: Markdown formatted schema
- **.sql**: Raw SQL schema dump

---

## 🔧 Extraction Tools (`code/`)

### JavaScript Extractors
- `extract-buttons-modals.js` - Extract button/modal schema
- `extract-chatbots.js` - Extract chatbot schema
- `extract-deep-agents.js` - Extract deep agent schema
- `extract-pages.js` - Extract page schema
- `extract-schema-openapi.js` - Generate OpenAPI spec

### SQL Tools
- `extract_rls_policies.sql` - Extract RLS policies
- `startup-schema-regeneration.js` - Regenerate schema docs

### Usage
```bash
# Extract schema components
node code/extract-pages.js
node code/extract-buttons-modals.js

# Regenerate all schema docs
node code/startup-schema-regeneration.js
```

---

## 📊 Schema Organization

### Core Schemas (`/schemas/`)
The actual schema files are in `/schemas/`:
- `enterprise/` - Core enterprise tables
- `discipline/` - Discipline-specific schemas
- `components/` - UI component schemas
- `maintenance/` - Maintenance scripts

See `/schemas/README.md` for details.

---

## 🔗 Related Folders

- **/schemas/** - Actual SQL schema files
- **/database/** - Database migrations and scripts
- **/docs/standards/0003_DATABASE_NAMING_STANDARDS.md** - Naming standards

---

## 🆘 Support

For schema questions:
1. Check `reports/current-full-schema.md`
2. Browse relevant index report
3. Run extraction tools if needed
4. Review `/schemas/README.md`

---

**Last Updated**: 2026-02-09
**Maintainer**: Construct AI Development Team
