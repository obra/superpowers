# UI Alignment Recommendations

## Core Principles
1. **Consistency** - Maintain identical interaction patterns across both interfaces
2. **Modularity** - Build reusable components with clear interfaces
3. **Extensibility** - Design components to accommodate future needs
4. **Accessibility** - Ensure WCAG 2.1 AA compliance

## Component Alignment

### Data Display
1. **Document/Email Cards**
   - Standard dimensions: 320px width
   - Common elements:
     - Title (truncated at 40 chars)
     - Status indicator (left border color)
     - Metadata row (author, date, type)
     - Action buttons (view, download, AI tools)

2. **DataGrid**
   - Column standards:
     - Title (200px, sortable)
     - Author (150px)
     - Date (120px, formatted YYYY-MM-DD)
     - Status (100px, colored badge)
     - Actions (fixed 120px)

### Navigation
1. **Accordion**
   - Standard sections:
     - Filters
     - Saved Searches
     - AI Tools
     - Bulk Operations

2. **Tabs**
   - Standard set:
     - All Items
     - My Items
     - Recent
     - Favorites

### Interaction Patterns
1. **Selection**
   - Checkbox in top-left corner of cards
   - Shift+click for range selection
   - Ctrl/Cmd+click for multi-select

2. **Bulk Actions**
   - Fixed position toolbar appears on selection
   - Common actions:
     - Download
     - Share
     - Apply AI Tools
     - Change Status

## Visual Design

### Color Scheme
| Purpose          | Document | Email    |
|------------------|----------|----------|
| Primary          | #FFA500  | #4A89DC  |
| Secondary        | #FF8C00  | #5D9CEC  |
| Success          | #28a745  | #28a745  |
| Warning          | #ffc107  | #ffc107  |
| Danger           | #dc3545  | #dc3545  |

### Typography
- Primary font: Inter
- Base size: 14px
- Headings:
  - H1: 24px
  - H2: 20px
  - H3: 16px

### Spacing
- Base unit: 8px
- Card padding: 16px
- Section margins: 24px
- Grid gutter: 16px

## Implementation Checklist

1. [ ] Migrate to shared color variables
2. [ ] Implement base typography styles
3. [ ] Create component library
4. [ ] Document design tokens
5. [ ] Establish style guide
6. [ ] Train team on new system
