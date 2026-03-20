# Phase 2B: External Party Evaluation UI Implementation Plan

## Overview
Transform the existing contractor vetting UI into a generic external party evaluation system that supports all evaluation contexts while maintaining multi-discipline access patterns.

## Current State Analysis
- **Location**: Currently in Safety (02400) as `/contractor-vetting`
- **Components**: Single-discipline, contractor-focused HSSE evaluation
- **Access Points**: 8 discipline pages currently import ContractorVettingPageComponent
- **Database**: Uses old contractor-specific tables vs. new generic `external_party_*` tables

## Target State Architecture

### 1. Central Entry Point
```
/other-parties/external-party-evaluation
├── Context Selection (Contractor Vetting, Tender Evaluation, etc.)
├── Evaluation Package Management
├── Discipline Status Dashboard
└── Coordinator Aggregation View
```

### 2. Context-Aware UI Components
```
/context=contractor_vetting
├── Evaluation tabs based on context requirements
├── Template selection from appropriate discipline sources
├── Access token generation for external parties
└── Document status tracking
```

### 3. Multi-Discipline Integration
```
Each discipline page (02400, 01200, 00435, etc.) →
  Links to /other-parties/external-party-evaluation?context=X&discipline=Y
  RLS policies ensure proper isolation
  Discipline-specific scoring interfaces
```

## Implementation Phases

### Phase 2B.1: Core Infrastructure (Current Session)
- [ ] Rename components from ContractorVetting to ExternalPartyEvaluation
- [ ] Move component location from Safety to Other Parties
- [ ] Update routing and navigation
- [ ] Add context selection UI
- [ ] Basic API integration with ExternalPartyEvaluationService

### Phase 2B.2: Evaluation Package Management
- [ ] Create evaluation package creator/editor UI
- [ ] Multi-discipline document grouping interface
- [ ] Package status tracking dashboard
- [ ] Package metadata management

### Phase 2B.3: Context-Specific Workflows
- [ ] Contractor Vetting: Safety-focused tabs and templates
- [ ] Tender Evaluation: Technical/financial evaluation split
- [ ] RFQ Evaluation: Commercial/product specification focus
- [ ] Template integration across all discipline sources

### Phase 2B.4: Scoring and Aggregation
- [ ] Discipline-specific scoring modals
- [ ] Coordinator weighted scoring dashboard
- [ ] Final decision workflow (Approved/Rejected/Awarded)
- [ ] Score aggregation and calculation display

### Phase 2B.5: Multi-Discipline Integration
- [ ] Update all discipline page imports to new system
- [ ] Context parameter passing from discipline pages
- [ ] Discipline-specific UI variations
- [ ] Access control validation

## Implementation Order

1. **Start**: Core component rename/move (maintain existing functionality)
2. **API Integration**: Connect to ExternalPartyEvaluationService
3. **Context Layer**: Add context selection and routing
4. **Package Management**: Create evaluation package UI
5. **Workflow Enhancement**: External party access, document issuance
6. **Scoring System**: Discipline scoring → Coordinator aggregation
7. **Multi-Discipline**: Update all discipline access points

## Team Coordination Requirements

### Backend Dependencies
- ✅ ExternalPartyEvaluationService (Complete - Phase 2A)
- ✅ external_party_* database tables (Complete)
- ✅ API routes under /api/external-party/* (Complete)

### Frontend Dependencies
- Current contractor vetting components (available)
- Accordion/navigation system integration
- Modal system compatibility
- UI theming consistency

## Success Criteria

### Must Support:
1. **All 7 evaluation contexts** (contractor_vetting, tender_evaluation, etc.)
2. **Multi-discipline access** from 8+ discipline pages
3. **External party secure access** via token-based authentication
4. **Evaluation package management** for cross-discipline evaluation
5. **RLS-based security** ensuring proper discipline isolation
6. **Template integration** from multiple discipline sources

### Maintains Existing Capabilities:
1. HSSE evaluation workflow (as contractor_vetting context)
2. Discipline-specific access patterns
3. Safety department primary access
4. Document upload and analysis
5. AI-powered agent assistance

## Migration Strategy

### Zero-Downtime Approach:
1. **Create new system** alongside existing
2. **Test thoroughly** with current workflow patterns
3. **Gradual rollout** discipline by discipline
4. **Fallback maintained** during transition period

### Component Reuse Strategy:
1. **Keep HSSE evaluation core** as contractor_vetting context
2. **Extend with context layer** rather than replace
3. **Progressive enhancement** - add capabilities incrementally
4. **Backwards compatibility** maintained via context mapping

## Risk Mitigation

### Technical Risks:
- **Complexity**: Managing multiple contexts in single UI vs. separate interfaces
- **Performance**: Multiple template sources and RLS policy overhead
- **State Management**: Complex state across contexts and packages

### Operational Risks:
- **Training**: Users accustomed to existing contractor vetting interface
- **Transition**: Potential confusion during rollout period
- **Feature Parity**: Ensuring all capabilities maintained across contexts

### Mitigation Strategies:
1. **Incremental rollout** with user feedback
2. **Context-specific documentation** and training
3. **A/B testing** where possible during development
4. **Rollback capability** maintained
