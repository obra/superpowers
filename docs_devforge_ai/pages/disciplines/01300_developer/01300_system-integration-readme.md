# ConstructAI Procurement System Integration

## Overview

This document explains how the Document Ordering Management system integrates with the Templates-Forms Management system and the agent-based procurement order generation workflow.

## System Components

### 1. Document Ordering Management (`document-ordering-management-page.js`)

**Location**: `client/src/pages/01900-procurement/components/document-ordering-management-page.js`

**Purpose**: Visual drag-and-drop interface for assembling procurement contract document variations.

**Key Features**:
- Section Library: Displays available document sections for the selected discipline
- Variation Canvas: Drag-and-drop area for building custom document variations
- Action Panel: Contains "Manage Template Types" button and order creation
- Template Type Management: Modal for CRUD operations on template types

**Integration Points**:
- Connects to `template_types` table via `/api/template-types` API
- Reads from `discipline_document_sections` table
- Creates `document_variations` records
- Feeds into procurement order generation

### 2. Templates-Forms Management (`01900-template-management-page.js`)

**Location**: `client/src/pages/01900-procurement/components/01900-template-management-page.js`

**Purpose**: Comprehensive template management interface for procurement documents.

**Key Features**:
- Template creation and editing
- HTML content management
- Template preview functionality
- Procurement-specific template types

**Integration Points**:
- Manages `procurement_templates` table
- Provides template content for document variations
- Supplies templates for order generation

### 3. Hierarchical SOW Template Selection System

**Components**:
- `CreateOrderModal.jsx`: 4-step hierarchical selection wizard (Order Type → Template Variation → SOW Template → Order Details)
- SOW Template filtering API (`/api/procurement/sow-templates`)
- Template variation options (Standard, Complex, Emergency, Compliance)
- Order type validation (PO/SO/WO)

**Integration Points**:
- Hierarchical template selection provides context for agent processing
- SOW templates filtered by both order type and template variation
- Template variation determines document complexity and approval requirements
- Agents receive enriched order data with selected template context

## Data Flow Architecture

### Template Types Management
```
template_types table
    ↓
Template Types API (/api/template-types)
    ↓
Template Type Manager Modal
    ↓
Document Ordering Management UI
```

### Document Assembly Flow
```
discipline_document_sections table
    ↓
Discipline Document Sections Service
    ↓
Section Library + Variation Canvas
    ↓
document_variations table
```

### Order Generation Flow
```
Document Variations + Procurement Templates
    ↓
Create Order Modal with Task Sequencing
    ↓
Procurement Agents (AI-powered processing)
    ↓
procurement_orders table
```

## Database Schema Relationships

```sql
-- Core tables and their relationships
template_types (
    id, organization_id, code, name, description,
    discipline_code, contract_type, is_active
)

document_variations (
    id, organization_id, discipline_code, contract_type,
    template_variation, name, document_variation_sections
)

discipline_document_sections (
    id, discipline_code, contract_type, template_variation,
    section_code, section_name, section_type, display_order
)

procurement_templates (
    id, template_name, template_description, template_type,
    template_content, html_content, organization_id
)

procurement_orders (
    id, organization_id, template_variation, task_sequence,
    order_data, status, created_at
)
```

## API Endpoints

### Template Types API
- `GET /api/template-types` - List template types
- `POST /api/template-types` - Create template type
- `PUT /api/template-types/:id` - Update template type
- `DELETE /api/template-types/:id` - Delete template type
- `PUT /api/template-types/:oldType/rename/:newType` - Rename template type

### Document Sections API
- `GET /api/discipline-document-sections` - Get sections for discipline
- `POST /api/discipline-document-sections` - Create section
- `PUT /api/discipline-document-sections/:id` - Update section
- `DELETE /api/discipline-document-sections/:id` - Delete section

### Procurement Templates API
- `GET /api/procurement-templates` - List templates
- `POST /api/procurement-templates` - Create template
- `PUT /api/procurement-templates/:id` - Update template
- `DELETE /api/procurement-templates/:id` - Delete template

### Sequence API
- `GET /api/procurement/sequence/:variation` - Get task sequence for variation

## Integration Benefits

1. **Modular Architecture**: Each system can operate independently but integrate seamlessly
2. **Template Reusability**: Templates created in Forms Management can be used in Document Ordering
3. **Agent Enhancement**: AI agents optimize order generation based on template variations
4. **Data Consistency**: Centralized template type management ensures consistency
5. **Scalability**: Service-oriented architecture allows for independent scaling

## User Workflow

1. **Template Type Setup**: Use "Manage Template Types" in Document Ordering Management
2. **Template Creation**: Create procurement templates in Templates-Forms Management
3. **Document Assembly**: Build document variations by dragging sections in Document Ordering
4. **Order Generation**: Create procurement orders from templates with AI-optimized sequencing
5. **Agent Processing**: Automated order processing and status updates

## Technical Implementation

### Frontend Integration
- Shared `TemplateTypeManager` component used by both Document Ordering and Order Creation
- Common service layer for API communication
- Consistent UI/UX across all procurement management interfaces

### Backend Integration
- Unified API gateway with consistent error handling
- Shared database schema with proper relationships
- Agent orchestration for complex order processing

### Database Integration
- Foreign key relationships maintain data integrity
- Row-level security (RLS) policies for multi-tenant support
- Indexing strategy optimized for procurement workflows

## Maintenance and Updates

- **Template Types**: Managed through the Template Type Manager modal
- **Document Sections**: Updated via the Document Ordering Management interface
- **Procurement Templates**: Maintained in the Templates-Forms Management system
- **Agent Logic**: Updated through the agent service layer

This integrated system provides a comprehensive solution for procurement document management, from template creation through automated order generation and processing.
