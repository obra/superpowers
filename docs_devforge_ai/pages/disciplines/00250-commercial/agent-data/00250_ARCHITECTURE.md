# Commercial Discipline Architecture

## System Design

The Commercial discipline follows a **modal-driven React architecture** with Supabase backend integration, designed for procurement and contract management workflows.

### Component Architecture

```
CommercialPageComponent (Main Container)
├── State Management (agents/upserts/workspace)
├── Modal System (correspondence, imports, permissions)
├── AccordionProvider (EPCM standard layout)
├── ChatbotBase (AI commercial assistant)
└── Navigation Container (EPCM standard)
```

### Data Flow

1. **User Interaction** → State change triggers
2. **Modal Rendering** → Dynamic button grid layout
3. **API Calls** → Supabase queries for commercial data
4. **AI Processing** → ChatbotBase for analysis/recommendations
5. **State Updates** → Real-time UI synchronization

### Integration Points

- **Supabase**: Contract data, procurement records, pricing models
- **Cross-discipline**: Engineering (specs), Finance (budgets), Legal (contracts)
- **External APIs**: Market data providers, supplier systems
- **File Systems**: Cloud import, URL import, local file upsert

## Component Diagram

```
┌─────────────────────────────────────────────────┐
│           Commercial Page Component             │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐    │
│  │     Navigation Container (EPCM)        │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │   State Buttons Row            │    │    │
│  │  │ (Agents|Upserts|Workspace)     │    │    │
│  │  └─────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │   Page Title Button            │    │    │
│  │  └─────────────────────────────────┘    │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐    │
│  │     Modal Button Container             │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │   Dynamic Grid Layout          │    │    │
│  │  │   (Responsive columns)         │    │    │
│  │  └─────────────────────────────────┘    │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐    │
│  │     Accordion Component                │    │
│  │  (EPCM Standard Layout)                │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐    │
│  │     ChatbotBase Component              │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │   Commercial AI Assistant      │    │    │
│  │  │   - Market Intelligence        │    │    │
│  │  │   - Pricing Strategies         │    │    │
│  │  │   - Contract Reviews           │    │    │
│  │  └─────────────────────────────────┘    │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐    │
│  │     Logout Button (EPCM Standard)      │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

## State Management

### State Variables
- `currentState`: Controls which button set is displayed ('agents', 'upserts', 'workspace')
- `isSettingsInitialized`: Tracks EPCM settings loading
- `isButtonContainerVisible`: Controls modal button animation

### State Transitions
```
null → agents → Modal buttons render
null → upserts → Import/upload buttons render
null → workspace → Management tools render
```

## Modal System

### Modal Types
- **CorrespondenceReplyModal**: Contract communication handling
- **UpsertCloudModal**: Cloud-based document import
- **UpsertUrlModal**: URL-based data ingestion
- **UpsertFileModal**: Local file upload processing
- **TimesheetModal**: Time tracking for commercial activities
- **WorkspaceManagementModal**: Cross-discipline workspace configuration

### Modal Triggering
```javascript
handleModalClick(modalTarget) {
  window.currentModalTriggerPage = "00250";
  openModal(modalTarget, {});
}
```

## AI Integration

### ChatbotBase Configuration
- **Page ID**: "00250"
- **Discipline Code**: "COMMERCIAL"
- **Chat Type**: "document"
- **Theme**: Orange color scheme (#FF8C00, #FFA500)
- **Features**: Citations, document count, conversation history

### AI Capabilities
- Market intelligence analysis
- Pricing strategy recommendations
- Contract review processes
- Commercial opportunity identification

## Performance Considerations

### Grid Layout Calculation
```javascript
const gridLayout = calculateGridLayout(currentButtons.length);
// Returns: { columns: N, positions: [{col, row}, ...] }
```

### Animation Timing
- Button container visibility: 100ms delay
- Smooth transitions: CSS `transition: all 0.2s ease`

## Security Architecture

### Data Protection
- Row Level Security (RLS) on all Supabase tables
- Contract confidentiality enforcement
- User permission validation before modal access

### Session Management
- EPCM standard logout positioning
- Session state cleanup on component unmount
- Secure modal trigger validation

## Deployment Model

### Environment Configuration
- **Development**: Local Supabase instance
- **Staging**: Cloud Supabase with test data
- **Production**: Production Supabase with full security

### Scaling Strategy
- Horizontal scaling for modal processing
- CDN for static assets (background images)
- Database connection pooling for concurrent users

## Error Handling

### Component Lifecycle
- Settings initialization error catching
- Grid layout validation (prevents undefined position errors)
- Modal trigger validation with console warnings

### User Feedback
- Loading states for accordion initialization
- Error logging for debugging
- Graceful degradation when features unavailable

## Future Extensibility

### Plugin Architecture
- Modal system designed for easy extension
- State management supports additional button categories
- ChatbotBase allows custom AI capabilities

### API Evolution
- Supabase schema supports additional commercial data types
- Modal configuration allows new workflow types
- Cross-discipline integration points predefined