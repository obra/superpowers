# 🤗 HuggingFace Model Integration

This guide covers the integration of external HuggingFace models into the ConstructAI system, with specific support for `alistairtennant/deep-agents` and `alistairtennant/construct-training-data`.

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Install Python dependencies (if not already installed)
pip install transformers torch huggingface-hub

# Set HuggingFace authentication token
export HF_TOKEN=your_huggingface_token
export HUGGINGFACE_TOKEN=your_huggingface_token

# Start the server
cd server
npm start
```

### 2. Test Integration

```bash
# Run integration tests
node test_hf_integration.js
```

### 3. Use Your Models

```javascript
// Load and use deep-agents model
fetch('/api/hf-models/deep-agents/task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        agentType: 'safety_inspector',
        task: 'Inspect concrete pouring operation for hazards',
        context: { site: 'Building A', workers: 5 }
    })
});

// Generate training examples
fetch('/api/hf-models/construct-training/generate-example', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        category: 'safety',
        difficulty: 'hard'
    })
});
```

## 📚 API Reference

### Core Endpoints

#### Load Model
```http
POST /api/hf-models/load/:modelId
```
Load a HuggingFace model into memory.

#### Generate Response
```http
POST /api/hf-models/generate/:modelId
Content-Type: application/json

{
    "prompt": "Your prompt here",
    "maxNewTokens": 512,
    "temperature": 0.7,
    "doSample": true
}
```

#### Get Model Info
```http
GET /api/hf-models/info/:modelId
```

#### List Loaded Models
```http
GET /api/hf-models/loaded
```

### Specialized Endpoints

#### Deep Agents Tasks
```http
POST /api/hf-models/deep-agents/task
Content-Type: application/json

{
    "agentType": "safety_inspector",
    "task": "Inspect this construction activity",
    "context": { "site": "Building A", "workers": 5 }
}
```

**Available Agent Types:**
- `construction_planner` - Planning and coordination
- `safety_inspector` - Safety hazard identification
- `cost_estimator` - Cost analysis and estimation
- `quality_controller` - Quality control and inspection
- `project_manager` - Project management and oversight

#### Training Data Actions
```http
POST /api/hf-models/construct-training/:action
```

**Actions:**
- `generate-example` - Generate training examples
- `validate-example` - Validate training content
- `generate-curriculum` - Create training curricula

## 🔧 Configuration

### Environment Variables

```bash
# HuggingFace Authentication
HF_TOKEN=your_token_here
HUGGINGFACE_TOKEN=your_token_here

# Model Settings (optional)
HF_MODEL_CACHE_DIR=./cache/hf_models
HF_DEFAULT_MODEL=alistairtennant/deep-agents
```

### Model-Specific Configuration

#### alistairtennant/deep-agents
- **Purpose**: Multi-agent construction domain assistant
- **Optimal Settings**:
  - Temperature: 0.3-0.7 (task-dependent)
  - Max tokens: 800-1500
  - Use auth: Required for private model

#### alistairtennant/construct-training-data
- **Purpose**: Training content generation and validation
- **Optimal Settings**:
  - Temperature: 0.6-0.8 (creative generation)
  - Max tokens: 1500-2000
  - Use auth: Required for private model

## 🧪 Testing Examples

### Test Server Health
```bash
curl http://localhost:3060/health
```

### Test Model Compatibility
```bash
curl -X POST http://localhost:3060/api/hf-models/test-compatibility/alistairtennant%2Fdeep-agents
```

### Load and Use Model
```bash
# Load model
curl -X POST http://localhost:3060/api/hf-models/load/alistairtennant%2Fdeep-agents \
  -H "Content-Type: application/json" \
  -d '{"useAuth": true}'

# Generate response
curl -X POST http://localhost:3060/api/hf-models/generate/alistairtennant%2Fdeep-agents \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "You are a construction safety expert. Identify hazards in: Workers using ladders without fall protection.",
    "maxNewTokens": 300,
    "temperature": 0.7
  }'
```

### Run Agent Task
```bash
curl -X POST http://localhost:3060/api/hf-models/deep-agents/task \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "safety_inspector",
    "task": "Inspect concrete pouring operation",
    "context": {
      "site": "Building A",
      "workers": 5,
      "equipment": ["concrete truck", "vibrators"]
    }
  }'
```

## 🔍 Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Check token is set
echo $HF_TOKEN

# Test token validity
curl -H "Authorization: Bearer $HF_TOKEN" \
  https://huggingface.co/api/whoami
```

#### Model Loading Failures
```bash
# Check model exists
curl https://huggingface.co/alistairtennant/deep-agents

# Check disk space
df -h

# Check GPU memory (if using GPU)
nvidia-smi
```

#### Import Errors
```bash
# Install missing dependencies
pip install transformers torch huggingface-hub accelerate

# Check Python version compatibility
python --version  # Should be 3.8+
```

### Debug Mode
```javascript
// Enable debug logging
process.env.DEBUG = 'hf:*';

// Check loaded models
fetch('/api/hf-models/loaded')
  .then(r => r.json())
  .then(console.log);
```

## 📊 Performance Optimization

### Memory Management
```python
# Use 8-bit quantization for lower memory usage
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    load_in_8bit=True,  # Reduces memory by ~50%
    device_map="auto"
)
```

### Batch Processing
```javascript
// Process multiple requests efficiently
const batchRequests = prompts.map(prompt =>
    fetch('/api/hf-models/generate/model-id', {
        method: 'POST',
        body: JSON.stringify({ prompt, maxNewTokens: 200 })
    })
);

const responses = await Promise.all(batchRequests);
```

### Caching Strategy
```javascript
// Implement response caching
const cache = new Map();

function getCachedResponse(key, fetcher) {
    if (cache.has(key)) {
        return cache.get(key);
    }

    const result = fetcher();
    cache.set(key, result);
    return result;
}
```

## 🔒 Security Considerations

### API Key Management
- Store tokens in environment variables only
- Never commit tokens to version control
- Rotate tokens regularly
- Use separate tokens for different environments

### Access Control
```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');
app.use('/api/hf-models', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP
}));
```

### Input Validation
```javascript
// Sanitize prompts
function sanitizePrompt(prompt) {
    // Remove potentially harmful content
    return prompt.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}
```

## 📈 Monitoring & Analytics

### Usage Tracking
```javascript
// Track model usage
app.use('/api/hf-models', (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        // Log usage metrics
        console.log(`${req.method} ${req.path} - ${duration}ms`);
    });

    next();
});
```

### Health Checks
```javascript
// Model health endpoint
app.get('/health/hf-models', async (req, res) => {
    const loadedModels = await hfService.getLoadedModels();
    const health = loadedModels.length > 0 ? 'healthy' : 'degraded';

    res.json({ status: health, loadedModels });
});
```

## 🎯 Best Practices

### Model Selection
1. **Test compatibility** before production use
2. **Monitor performance** and adjust parameters
3. **Implement fallbacks** for reliability
4. **Cache responses** for repeated queries
5. **Monitor costs** and usage limits

### Error Handling
1. **Graceful degradation** when models fail
2. **Retry logic** for transient errors
3. **Comprehensive logging** for debugging
4. **User-friendly error messages**
5. **Circuit breakers** for failing services

### Performance Tuning
1. **Batch requests** when possible
2. **Use appropriate quantization** for your hardware
3. **Implement caching** for frequent queries
4. **Monitor memory usage** and clean up unused models
5. **Load balance** across multiple model instances

## 🚀 Advanced Usage

### Custom Model Classes
```python
class CustomConstructionModel(HuggingFaceModelService):
    def __init__(self, model_id):
        super().__init__()
        self.model_id = model_id
        self.domain = "construction"

    def analyze_construction_document(self, document_text, analysis_type):
        """Specialized construction document analysis"""

        prompts = {
            'safety': f"Analyze this construction document for safety requirements: {document_text}",
            'compliance': f"Check compliance with construction regulations: {document_text}",
            'risk': f"Identify project risks in this document: {document_text}"
        }

        prompt = prompts.get(analysis_type, f"Analyze: {document_text}")

        return self.generate_response(self.model_id, prompt, {
            'max_new_tokens': 1000,
            'temperature': 0.3
        })
```

### Integration with Existing Systems
```javascript
// Integrate with chat agents
class HFEnhancedChatAgent {
    constructor(baseAgent, hfModelId) {
        this.baseAgent = baseAgent;
        this.hfModelId = hfModelId;
    }

    async processMessage(message, discipline) {
        // Try HF model first for known disciplines
        if (this.shouldUseHF(discipline)) {
            try {
                const hfResponse = await this.callHFModel(message, discipline);
                return hfResponse;
            } catch (error) {
                console.warn('HF model failed, falling back to base agent');
            }
        }

        // Fallback to original agent
        return this.baseAgent.processMessage(message);
    }

    shouldUseHF(discipline) {
        const supportedDisciplines = [
            'safety', 'construction', 'engineering', 'project_management'
        ];
        return supportedDisciplines.includes(discipline);
    }
}
```

This integration provides seamless access to your specialized HuggingFace models while maintaining the reliability and performance of your existing ConstructAI system.