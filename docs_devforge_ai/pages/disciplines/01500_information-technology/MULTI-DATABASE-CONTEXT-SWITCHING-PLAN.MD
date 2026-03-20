# Multi-Database Context Switching Plan

## Overview

This document outlines the implementation plan for enabling single-user, single-database context switching in the organization collaboration system. Based on the clarification that each user works with only one Supabase project at a time, this approach significantly simplifies the architecture while maintaining all required functionality.

## Key Principles

- **Single User = Single Database Context**: Each user maintains one active database connection at any time
- **Context-Based Switching**: Database context switches based on accordion section navigation
- **Seamless User Experience**: Smooth transitions between different database contexts
- **Performance Optimized**: Efficient resource usage with single connection management

## Implementation Architecture

### 1. Database Context Management

#### User Session Enhancement
- Extend user session management to include active database context
- Store current database configuration (URL, keys) in session
- Maintain context persistence across page navigation

#### Dynamic Supabase Client
- Single Supabase client instance with dynamic configuration
- Context switching through client reconfiguration
- Efficient connection management and cleanup

### 2. Accordion Context Integration

#### Section-Based Routing
- Map accordion sections to database contexts
- Automatic context detection when sections are accessed
- Visual indicators showing active database context

#### Context Switching Logic
- Smooth transitions between database contexts
- Data loading optimization for context switches
- Error handling for database connectivity issues

### 3. Agent Context Awareness

#### Context-Aware Execution
- Agents automatically use current database context
- Proper result handling across different database contexts
- Error recovery for agent operations

## Implementation Phases

### Phase 1: Database Context Management (2-3 hours)

**Tasks:**
1. Enhance user session management to include database context
2. Create collaboration-aware context switching mechanism
3. Implement single Supabase client with dynamic configuration
4. Add context persistence across page navigation

**Deliverables:**
- `DatabaseContextManager.js` - Core context management
- Single Supabase client with dynamic reconfiguration
- Context switching based on collaboration state

### Phase 2: Accordion Context Integration (3-4 hours)

**Tasks:**
1. Modify accordion component to detect collaboration context
2. Implement section-based database routing logic
3. Add visual context indicators in UI
4. Create smooth context switching experience

**Deliverables:**
- Context-aware accordion component
- Section-to-database mapping system
- UI context visualization with database indicators

### Phase 3: Agent Context Awareness (2-3 hours)

**Tasks:**
1. Update agent system to use current database context
2. Implement context-aware agent execution
3. Add agent result handling for different databases

**Deliverables:**
- Context-aware agents with automatic database routing
- Proper result aggregation and error handling

### Phase 4: Backend Integration (2-3 hours)

**Tasks:**
1. Extend APIs to return database connection info for collaborations
2. Update collaboration data with database context information
3. Add validation for context switching operations

**Deliverables:**
- Enhanced collaboration APIs with database context data
- Database connection information management
- Security validation for context switching

## Risk Assessment

### Eliminated Risks (No Longer Applicable)
✅ **Authentication Complexity** - Single session per user eliminates multi-auth challenges
✅ **Multiple Simultaneous Connections** - Only one connection at a time
✅ **Real-time Synchronization Issues** - Single connection handles subscriptions
✅ **Resource Management Overhead** - Dramatically reduced complexity

### Remaining Key Challenges

#### 1. Smooth Context Switching
- **Challenge**: Ensuring seamless database transitions without user disruption
- **Mitigation**: Pre-loading strategies and connection caching
- **Priority**: Medium

#### 2. Session Persistence
- **Challenge**: Maintaining user state across context switches
- **Mitigation**: Comprehensive state management and backup
- **Priority**: High

#### 3. Error Handling
- **Challenge**: Graceful degradation when database contexts change
- **Mitigation**: Robust error handling with clear user feedback
- **Priority**: High

#### 4. Performance Optimization
- **Challenge**: Minimizing switching overhead and connection latency
- **Mitigation**: Connection pooling and intelligent caching
- **Priority**: Medium

## Technical Implementation Details

### Database Schema Extensions

```sql
-- Extend organizations table with Supabase connection details
ALTER TABLE organizations 
ADD COLUMN supabase_url TEXT,
ADD COLUMN supabase_anon_key TEXT,
ADD COLUMN supabase_service_key TEXT;

-- Update collaboration table with context information
ALTER TABLE organization_collaborations
ADD COLUMN primary_org_supabase_config JSONB,
ADD COLUMN context_mapping JSONB;
```

### Context Management Flow

1. **User Authentication**: User logs in to their primary organization
2. **Context Initialization**: System loads user's default database context
3. **Collaboration Detection**: System checks for active collaborations
4. **Context Switching**: When accessing shared sections, switch to collaboration database
5. **Operation Execution**: All database operations use current context
6. **Context Restoration**: Return to original database when exiting collaboration sections

### Section-to-Database Mapping

```javascript
const sectionDatabaseMap = {
  // User's own sections
  '00100': 'user_org_db',     // Home section
  '00300': 'user_org_db',     // Construction section
  
  // Shared collaboration sections  
  'shared_00800': 'epcm_db',  // Shared Design section
  'shared_00876': 'epcm_db'   // Shared Directors section
};
```

## User Experience Considerations

### Visual Context Indicators
- Database context displayed in header/navigation
- Section-level indicators showing database source
- Loading states during context switching

### Performance Optimization
- Connection caching to minimize reconnection overhead
- Pre-loading strategies for anticipated context switches
- Efficient data caching per database context

### Error Handling
- Clear error messages for database connectivity issues
- Automatic retry mechanisms for transient failures
- Graceful degradation to offline mode when needed

## Timeline and Milestones

### Day 1: Foundation (4-6 hours)
- Database schema extensions
- Context management core implementation
- Basic accordion integration

### Day 2: Integration (4-6 hours)
- Full accordion context awareness
- Agent system integration
- Backend API extensions

### Day 3: Refinement (3-4 hours)
- Performance optimization
- Error handling and testing
- Documentation and deployment preparation

## Success Criteria

✅ Users can seamlessly navigate between their own and shared database contexts
✅ Agents automatically use the correct database based on current context
✅ Performance impact is minimal (sub-100ms context switching)
✅ Error handling is robust with clear user feedback
✅ System maintains full backward compatibility
✅ No authentication conflicts or session issues

## Rollback Strategy

If implementation encounters critical issues:
1. Revert to single-database mode with feature flags
2. Maintain existing collaboration UI but disable database switching
3. Provide clear user communication about temporary limitations
4. Implement gradual rollout with select user groups

This simplified approach provides all required functionality while maintaining system stability and performance.
