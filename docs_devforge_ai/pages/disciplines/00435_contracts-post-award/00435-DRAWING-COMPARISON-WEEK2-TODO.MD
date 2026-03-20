# Week 2: Core Refactoring - Drawing Comparison Model Standardization

## Status
- [x] Week 2 Beginning: AIServiceBase Integration ✅ COMPLETED
- [x] Week 2 Progress: Migration from Custom Functions ✅ COMPLETED
- [x] Week 2 Progress: Hardcoded Model Removal ✅ COMPLETED
- [x] Week 2 Progress: Configuration Updates ✅ COMPLETED
- [x] Week 2 Testing: Integration Testing ✅ COMPLETED

## Week 2: Core Refactoring Objectives

**Goal**: Completely remove hardcoded models and migrate drawing analysis to use AIServiceBase pattern, ensuring vision models are prioritized throughout.

### Phase 1: AIServiceBase Architecture Integration

#### 1.1 Create DrawingAnalysisService Class
- [ ] Create new `client/src/services/drawingAnalysisAIService.js` extending AIServiceBase
- [ ] Implement service methods with `gpt-4o` vision optimization as default
- [ ] Add vision-specific methods for PDF processing and image analysis

#### 1.2 Migrate Server-Side Configuration
- [ ] Replace `getOpenAiConfiguration()` custom function with AIServiceBase pattern
- [ ] Update `drawingAnalysisController.js` to import and use AIServiceBase
- [ ] Remove verbose logging from configuration loading (simplify post-migration)

#### 1.3 Initialize Service Classes
**File: `client/src/services/drawingAnalysisAIService.js`**
```javascript
class DrawingAnalysisAIService extends AIServiceBase {
  constructor() {
    super('DrawingAnalysis', 'gpt-4o'); // Vision-optimized default
  }

  async analyzeDrawings(images, context) {
    // Vision-specific implementation
    return await this.callOpenAI({
      messages: [{ role: 'user', content: [...text, ...images] }],
      model: 'gpt-4o', // Force vision-capable model
      // Rest of vision-specific logic
    });
  }
}
```

## Phase 2: Remove All Hardcoded Models

### 2.1 Vision Generation Method Updates
- [ ] Update `generateVisionBasedAnalysis()` method
- [ ] Change `model: "gpt-4o",` to `model: aiConfig.model`
- [ ] Ensure vision model priority in fallback logic

### 2.2 Fallback Generation Method Updates
- [ ] Update `generateMetadataBasedAnalysis()` method
- [ ] Remove `model: "gpt-4-turbo-preview"` hardcoded reference
- [ ] Change to `model: aiConfig.model` pattern

### 2.3 Configuration Loading Standardization
- [ ] Replace all `getOpenAiConfiguration()` calls with AIServiceBase methods
- [ ] Update error handling to use AIServiceBase patterns
- [ ] Standardize logging and debugging output

## Phase 3: Configuration Updates

### 3.1 Database Configuration Setup
- [ ] Update/verify `external_api_configurations` table for drawing analysis
- [ ] Ensure `gpt-4o` model is configured with vision capabilities flagged
- [ ] Set proper priority hierarchy in configuration metadata

### 3.2 Fallback Logic Enhancement
- [ ] Implement vision-capable model hierarchy:
  1. gpt-4o (primary - vision)
  2. gpt-4-turbo (fallback - vision capable)
  3. gpt-4 (if no turbo, still some vision)
  4. gpt-4o-mini (last resort - text only)

### 3.3 Environment Variable Support
- [ ] Ensure environment variable configurations work with new service
- [ ] Maintain backward compatibility with existing `OPENAI_API_KEY` setups

## Phase 4: Code Structure Cleanup

### 4.1 Remove Deprecated Functions
- [ ] Remove or deprecate `getOpenAiConfiguration()` function
- [ ] Clean up verbose debug logging throughout controller
- [ ] Update imports to use AIServiceBase consistently

### 4.2 Service Integration
- [ ] Ensure client-side services properly instantiate DrawingAnalysisAIService
- [ ] Update any related service files (testDrawingAnalysisService, etc.)
- [ ] Verify service initialization doesn't break existing functionality

## Week 2 Success Metrics

### Technical Completion Criteria
- [ ] ✅ All hardcoded models removed from `drawingAnalysisController.js`
- [ ] ✅ AIServiceBase integration complete
- [ ] ✅ Vision model (gpt-4o) priority confirmed
- [ ] ✅ Configuration loading uses database-driven pattern
- [ ] ✅ No breaking changes to existing API endpoints

### Code Quality Verification
- [ ] ✅ Consistent error handling and logging
- [ ] ✅ Client-server service alignment
- [ ] ✅ No deprecated function usage
- [ ] ✅ Import statements updated appropriately

### Architecture Alignment
- [ ] ✅ Drawing analysis follows same AI service pattern as SOW generation
- [ ] ✅ Configuration management unified across services
- [ ] ✅ Feature flags implemented for gradual rollout (if needed)
- [ ] ✅ Rollback strategy validated

## Testing Strategy for Week 3

### Unit Testing Prerequisites
- [ ] Control creation validation
- [ ] Model selection logic testing
- [ ] Configuration loading verification

### Integration Testing Setup
- [ ] End-to-end drawing analysis workflows ready
- [ ] Vision model API call validation prepared
- [ ] Performance benchmarking baseline established

## Week 2 Daily Progress Tracking

### Day 1: Foundation Setup
- [ ] Set up DrawingAnalysisAIService class structure
- [ ] Begin AIServiceBase integration preparation
- [ ] Review existing configuration patterns

### Day 2: Vision Method Migration
- [ ] Migrate `generateVisionBasedAnalysis()` method
- [ ] Remove first hardcoded model reference
- [ ] Test basic vision functionality

### Day 3: Fallback Method Migration
- [ ] Migrate `generateMetadataBasedAnalysis()` method
- [ ] Remove gpt-4-turbo-preview hardcoded reference
- [ ] Implement proper fallback hierarchy

### Day 4: Configuration Integration
- [ ] Complete AIServiceBase configuration integration
- [ ] Update all configuration loading calls
- [ ] Database configuration verification

### Day 5: Cleanup and Testing
- [ ] Deprecate old functions safely
- [ ] Integration testing of core functionality
- [ ] Code review preparation

## Risk Mitigation - Week 2

### High-Risk Areas
1. **Service Integration Failure**: AIServiceBase integration might break existing functionality
   - **Mitigation**: Feature flag implementation for gradual rollout

2. **Vision Model Priority Loss**: Migration might accidentally reduce vision capability
   - **Mitigation**: Explicit gpt-4o prioritization in service constructor

3. **Configuration Loading Issues**: Database-driven config might fail fallback scenarios
   - **Mitigation**: Robust fallback mechanisms maintained

### Rollback Ready
- [ ] Original `getOpenAiConfiguration()` preserved for emergency rollback
- [ ] Feature flags prepared for instant rollback capability
- [ ] Comprehensive logging for issue diagnosis

## Documentation Updates Required

- [ ] Update inline code comments throughout drawingAnalysisController.js
- [ ] Add implementation notes in drawing analysis documentation
- [ ] Update API configuration documentation
- [ ] Refresh Swagger/API docs as needed

---

## Week 2 Timeline: 5 days (ending with testing preparation)

**Next Action**: Begin Day 1 - DrawingAnalysisAIService class creation

Weekly Status Update Schedule: Daily standup checks
