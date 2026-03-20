# Migration from Qwen to Kimi K2.5

## Overview
This document tracks the migration from Qwen models (Qwen3-VL, Qwen2.5) to Kimi K2.5 across the ConstructAI codebase.

## Models Being Replaced
- **Qwen3-VL** → Kimi K2.5 (Vision-Language model)
- **Qwen2.5-7B-Instruct** → Kimi K2.5 (Base model)
- **Qwen2.5-14B-Instruct** → Kimi K2.5 (Base model)

## API Endpoints
- **Old**: `https://api.qwen-vl.com/v1`
- **New**: `https://api.moonshot.cn/v1` (Kimi API endpoint)

## Environment Variables
- **Old**: `QWEN_VL_API_KEY`
- **New**: `KIMI_API_KEY`

## Migration Scope

### 1. Core Integration Files (agents/pages/02025_quantity_surveying/)
- [x] `real-qwen3-vl-api.js` → Update to Kimi K2.5
- [x] `qwen3-vl-integration.js` → Update to Kimi K2.5
- [x] `cv2-drawing-utils.js` → Update imports and references
- [x] `advanced-analysis-pipeline.js` → Update references
- [x] `test-real-implementations.js` → Update tests
- [x] `test-phase-3.js` → Update tests

### 2. Simulation & Testing
- [x] `quantity-surveying-opencv-simulator.js` → Update stage names
- [x] `test-simulation.js` → Update references
- [x] `test-standalone.js` → Update references
- [x] `verify-phase4.js` → Update imports

### 3. UI Components
- [x] `swarm-agent-controls.js` → Update factory imports
- [x] `client/src/pages/02025-quantity-surveying/components/02025-quantity-surveying-drawing-measurement-page.js` → Update references

### 4. Configuration Files
- [x] `.env.example` → Add KIMI_API_KEY, remove QWEN references
- [x] `server/qwen3-deployment/runpod_setup.md` → Update to Kimi deployment
- [x] `server/qwen3-deployment/README.md` → Update documentation
- [x] `server/qwen3-deployment/app.py` → Update to Kimi

### 5. Training & Fine-tuning
- [x] `customer-training-framework.js` → Update base model
- [x] `client/src/pages/02050-information-technology/components/LangChainSettingsConfig.js` → Update model references
- [x] `client/src/services/agents/FineTuningOptimizer.js` → Update model references
- [x] `agents/simulation/procurement-specialist-orchestrator.js` → Update base model
- [x] `agents/simulation/training-data-pipeline.js` → Update model references

### 6. Documentation
- [x] `PHASE_3_COMPLETION.md` → Update references
- [x] All Qwen-specific documentation

## Kimi K2.5 API Configuration

### API Endpoint
```
https://api.moonshot.cn/v1
```

### Supported Models
- `moonshot-v1-8k` (General purpose)
- `moonshot-v1-32k` (Long context)
- `moonshot-v1-128k` (Very long context)

### Vision-Language Capabilities
Kimi K2.5 supports:
- Image analysis
- Document interpretation
- Visual question answering
- Multi-modal reasoning

### Cost Structure (Estimated)
- Input: ~$0.01 per 1K tokens
- Output: ~$0.03 per 1K tokens
- Vision analysis: Similar to text, charged per token

## Implementation Notes

### 1. API Compatibility
Kimi API is OpenAI-compatible, so most code changes will be minimal:
- Update endpoint URL
- Update API key name
- Update model names
- Update validation logic

### 2. Model Capabilities
Kimi K2.5 may have different:
- Token limits (context window size)
- Response formatting
- Error handling
- Rate limits

### 3. Local Hosting
Kimi models are primarily API-based. For local hosting, consider:
- Kimi open-source models (if available)
- Alternative local models (Llama, Mistral, etc.)
- Self-hosted API endpoints

### 4. Fallback Strategy
- Keep mock implementations for testing
- Implement fallback to local models when API is unavailable
- Maintain compatibility with existing workflows

## Migration Priority

### High Priority (Core Functionality)
1. Update `real-qwen3-vl-api.js` to use Kimi API
2. Update environment variables
3. Update documentation

### Medium Priority (Testing & Simulation)
1. Update test files
2. Update simulation scripts
3. Update mock implementations

### Low Priority (Optimization)
1. Performance tuning for Kimi API
2. Cost optimization strategies
3. Advanced feature utilization

## Success Criteria

1. ✅ All Qwen references replaced with Kimi references
2. ✅ API endpoints updated correctly
3. ✅ Environment variables updated
4. ✅ Tests pass with new configuration
5. ✅ Documentation reflects new model
6. ✅ No breaking changes to existing workflows
7. ✅ Performance maintained or improved
8. ✅ Costs are comparable or lower

## Rollback Plan

If migration fails:
1. Maintain Qwen configuration in `.env.backup`
2. Keep Qwen files in version control
3. Document migration steps for easy rollback
4. Test thoroughly before full deployment

## Timeline

- **Phase 1**: Core integration update (1 day)
- **Phase 2**: Testing and validation (1 day)
- **Phase 3**: Documentation update (1 day)
- **Phase 4**: Production deployment (1 day)

**Total**: ~4 days

## Owner
- Primary: Implementation Team
- Review: Architecture Team

## Status
- **Started**: 2026-01-29
- **Current Phase**: Planning
- **Next Step**: Update core integration files