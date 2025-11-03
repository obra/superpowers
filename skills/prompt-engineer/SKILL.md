---
name: prompt-engineer
description: Use when creating prompts for AI platforms (Veo3, Midjourney, DALL-E, Flux, Stable Diffusion, Claude, ChatGPT, Gemini) or improving existing prompts for better results - provides platform-specific techniques, parameters, and best practices for video generation, image creation, and text-based AI tasks
---

# Prompt Engineer

## Overview

Expert prompt engineering knowledge for major AI platforms. Apply proven techniques and platform-specific best practices to create high-quality prompts for video generation (Veo3), image creation (Midjourney, DALL-E, Flux, Stable Diffusion), and conversational AI (Claude, ChatGPT, Gemini).

## When to Use

**Use this skill when:**
- Creating prompts for video generation (Veo3)
- Writing image generation prompts (Midjourney, DALL-E, Flux, Stable Diffusion)
- Optimizing prompts for Claude, ChatGPT, or Gemini
- Results are generic, unclear, or missing key elements
- Need platform-specific parameters or syntax
- Improving existing prompts for better output

**Don't use for:**
- Basic text generation without specific platform requirements
- Simple questions that don't need optimization

## Video Generation: Veo3 (Google)

### Optimal Prompt Structure
```
[Shot Composition] + [Subject] + [Action] + [Setting] + [Aesthetics]
```

**Components:**
1. **Shot Composition**: Camera angle, position, movement, transitions
   - "Dutch angle tracking shot", "Crane shot descending", "Handheld POV"

2. **Subject**: Detailed character description
   - Physical appearance, clothing, distinctive features

3. **Action**: Subject-object interaction, physics, gestures
   - Use "emotion chaining" for expressions: "smiling, then frowning, then laughing"
   - Choreograph gestures: "waving hand, then pointing forward"

4. **Setting**: Environmental backdrop, atmosphere
   - Time of day, weather, location specifics

5. **Aesthetics**: Visual style, lighting, mood
   - Film stock: "shot on 35mm Kodak Vision3 film", "grainy 16mm look"
   - Lighting: "golden hour", "harsh shadows", "soft diffused light"

### Best Practices
- Be direct and specific for better results
- Chain emotions/gestures with "then" for sequences
- Allow emotional interpretation for natural performances (vague can work for emotion)
- Veo3 generates synchronized dialogue, sound effects, and music in one pass

**Example:**
```
Low-angle tracking shot of a confident woman in a red coat walking through
a bustling Tokyo street at night, neon signs reflecting in puddles. She
glances back with concern, then continues forward. Shot on 35mm Kodak
Vision3, cinematic lighting with bokeh background, golden hour glow.
```

## Image Generation

### Midjourney (V7 - 2025)

**Core Structure:**
```
[Main Subject] + [Artistic Style] + [Context: Lighting/Colors/Background] + [Parameters]
```

**Essential Parameters:**
- `--ar <width>:<height>` - Aspect ratio (default 1:1)
  - Common: `--ar 16:9`, `--ar 9:16`, `--ar 3:2`
- `--s <0-1000>` - Stylization (default 100)
  - Lower = prompt-accurate, Higher = artistic
- `--chaos <0-100>` - Diversity of outputs
  - Low = consistent, High = unpredictable/unique
- `--seed <number>` - Consistent style across generations

**Advanced Techniques:**
- **Multi-prompts with weights**: `red car::2 blue sky::1` (emphasizes red car 2x)
- **Image references**: Upload image URL to influence style/composition
- **Commands**:
  - `/blend` - Merge 2-5 images without text
  - `/describe` - Reverse-engineer prompts from images

**Best Practices:**
- Short, simple prompts work best
- Describe what you WANT (not what you don't)
- Use `--no <item>` to exclude elements

**Example:**
```
Majestic lion with flowing golden mane in savanna grassland, dramatic sunset
lighting, hyper-realistic, 8K detail, warm amber tones --ar 16:9 --s 150 --chaos 20
```

### DALL-E 3 (OpenAI)

**Core Principles:**
- **Be specific and detailed**: Include setting, objects, colors, mood, elements
- **Use positive prompts**: Focus on what you want (not what to exclude)
- **Balance specificity with creativity**: Too vague = generic, too detailed = constrained

**Key Techniques:**
- **Describe mood**: Include actions, expressions, environments
- **Describe aesthetic**: Watercolor, sculpture, digital art, impressionism, photorealistic
- **Describe framing**: Dramatic, wide-angle, close-up, bird's-eye view
- **Prompt stacking**: Multiple requirements simultaneously
  - "Create an image that is: 1) watercolor style, 2) forest scene, 3) mystical mood"

**Best Practices:**
- Iterative refinement - first prompt rarely perfect
- ChatGPT integration helps refine prompts naturally
- Context is critical - more detail = better output

**Example:**
```
Close-up portrait of an elderly craftsman working on intricate wood carving,
dust particles floating in warm workshop lighting, weathered hands with
visible tool marks, shelves of finished work in soft-focus background,
photorealistic style with emphasis on texture and detail, golden afternoon light
```

### Stable Diffusion & Flux.1

**Stable Diffusion Structure:**
```
[Subject] + [Descriptive Keywords] + [Modifiers] + [Negative Prompt]
```

**Keyword Weighting:**
- Syntax: `(keyword: 1.5)` = 150% weight
- Range: 0.4 to 1.6 optimal
- Example: `(detailed face: 1.4), (golden hair: 1.2), eyes`

**Modifiers:**
- Quality: "detailed", "intricate", "8k", "hyperrealistic", "masterpiece"
- Lighting: "cinematic lighting", "volumetric", "rim lighting", "god rays"
- Style: "oil painting", "concept art", "photography", "digital art"

**Negative Prompts (SD):**
```
Negative: blurry, distorted, asymmetrical, low quality, artifacts, watermark
```

**Flux.1 Differences (2025):**
- **Natural language**: Speak conversationally, more descriptive
- **No negative prompts needed**: Describe what you want instead
- **No weight syntax support**: Use "with emphasis on X" or "with focus on Y"
- **Longer prompts supported**: Up to ~500 tokens
- **Left-to-right priority**: Keywords at start have higher priority

**Stable Diffusion Example:**
```
Portrait of cyberpunk hacker in neon-lit room, (detailed face: 1.4),
(holographic screens: 1.2), purple and blue lighting, intricate tech implants,
8k, hyperrealistic, cinematic composition
Negative: blurry, distorted, low quality, extra fingers, bad anatomy
```

**Flux.1 Example:**
```
A detailed portrait of a cyberpunk hacker sitting in a dimly lit room filled
with glowing holographic screens displaying code, with emphasis on the intricate
facial cybernetic implants reflecting neon purple and blue light, ultra-detailed
realistic rendering with cinematic composition and atmospheric volumetric lighting
```

## Text-Based AI

### Claude (Anthropic 4.x - 2025)

**Core Techniques:**

1. **XML Tags for Structure** (Claude-specific strength)
```xml
<task>
Analyze the following code for security vulnerabilities
</task>

<code>
[Your code here]
</code>

<requirements>
- Focus on SQL injection risks
- Check authentication logic
- Identify data exposure issues
</requirements>
```

2. **Clear Role Setting**
   - Use system parameter for role definition
   - Task-specific instructions in user turn

3. **Chain of Thought**
   - Add "Think step by step" to complex queries
   - Enable extended thinking for multi-step reasoning

4. **Provide Examples**
   - Show input-output pairs for nuanced tasks
   - Demonstrates pattern better than description

5. **Be Specific and Explicit**
   - Clear, unambiguous instructions
   - State desired output format

**Best Practices:**
- Test and iterate prompts
- Use Anthropic's prompt generator for production templates
- Leverage context awareness (Claude 4.5 tracks remaining context)

**Example:**
```xml
<role>You are an expert code reviewer specializing in Python security</role>

<task>
Review the following authentication function for vulnerabilities.
Think step by step through potential security issues.
</task>

<code>
def login(username, password):
    query = f"SELECT * FROM users WHERE name='{username}' AND pass='{password}'"
    return db.execute(query)
</code>

<output_format>
1. List each vulnerability found
2. Explain the risk
3. Provide secure code alternative
</output_format>
```

### ChatGPT / GPT-4 (OpenAI - 2025)

**Core Techniques:**

1. **Use Delimiters**
   - Triple quotes, triple backticks, XML tags, angle brackets
   - Prevents prompt injection, clarifies structure

2. **Few-Shot Learning**
   - Provide 2-5 examples of desired output
   - Model adapts to pattern

3. **Provide Grounding Data**
   - Include context/data for reliable answers
   - Critical for factual, up-to-date information

4. **Break Down Complex Tasks**
   - Split into manageable subtasks
   - Sequential processing improves accuracy

5. **Memory Features**
   - GPT-4o maintains persistent memory
   - Best for onboarding custom GPTs

**Model-Specific:**
- GPT-4o: Short structured prompts with hashtags, numbered lists
- Use consistent delimiters throughout

**Best Practices:**
- Clear structure beats clever wording
- Most failures come from ambiguity, not model limits
- Be clear, specific, provide context

**Example:**
```
Task: Extract key information from customer support transcripts

Instructions:
1. Read the transcript below
2. Identify: customer issue, resolution status, sentiment
3. Format as JSON with keys: issue, status, sentiment, priority

###TRANSCRIPT###
[Transcript content here]
###END###

Expected output format:
{
  "issue": "brief description",
  "status": "resolved|pending|escalated",
  "sentiment": "positive|neutral|negative",
  "priority": "low|medium|high"
}
```

### Google Gemini (2025)

**PTCF Framework** (Best Practice):
```
Persona + Task + Context + Format
```

**Components:**
1. **Persona**: Define Gemini's role
   - "You are a financial analyst evaluating quarterly earnings"

2. **Task**: What needs to be done
   - "Summarize", "analyze", "create", "compare"

3. **Context**: Background information
   - Relevant data, constraints, goals

4. **Format**: Desired output structure
   - Table, bullet points, JSON, paragraph

**2025 Features:**
- **Long context**: 1M token window (99% retrieval accuracy on structured data)
- **URL context**: Reads external web sources during API calls
- **Structured outputs**: `responseSchema` for strict JSON formatting

**Best Practices:**
- Natural conversational language (speak to a person)
- Be specific yet concise
- Iterate with follow-up prompts
- Average 21 words for simple prompts (varies by complexity)
- Break complex problems into multiple requests

**Example:**
```
Persona: You are an experienced technical writer creating API documentation.

Task: Write a comprehensive overview section for a REST API that manages
user authentication.

Context: The API supports OAuth 2.0, JWT tokens, and has endpoints for
login, logout, token refresh, and password reset. Target audience is
backend developers with 2-5 years experience.

Format: Start with a brief 2-3 sentence summary, followed by a bulleted
list of key features, then a "Quick Start" section with a code example
in Python.
```

## Common Mistakes Across Platforms

| Mistake | Fix |
|---------|-----|
| Too vague: "make an image of a cat" | Be specific: "tabby cat sitting on windowsill, morning sunlight, watercolor style" |
| Negative descriptions (what NOT to include) | Positive descriptions (what to include) OR use platform-specific negative prompt syntax |
| Over-complicating with too many details | Balance: enough detail to guide, not constrain creativity |
| Ignoring platform-specific parameters | Learn and use parameters (--ar, --s, weights, XML tags) |
| Not iterating | First prompt rarely perfect - refine based on output |
| Forgetting context/grounding data | Provide relevant background for text AI tasks |
| Using same technique across platforms | Each platform has unique strengths - adapt accordingly |

## Quick Reference

### Choose Your Platform
| Use Case | Recommended Platform | Key Strength |
|----------|---------------------|--------------|
| Video with synchronized audio | Veo3 | Dialogue + sound + music in one pass |
| Artistic image, iterate style | Midjourney V7 | /describe and /blend commands |
| Natural language image prompts | DALL-E 3 | ChatGPT integration, iterative refinement |
| Technical control, specific weights | Stable Diffusion | Precise keyword weighting |
| Detailed scenes, natural prompts | Flux.1 | Long prompts, no negative needed |
| Structured text outputs, XML | Claude 4.x | XML tags, long context, thinking |
| Factual with grounding data | ChatGPT/GPT-4 | Few-shot learning, delimiters |
| Long-context document analysis | Gemini 2.5 Pro | 1M token window, 99% retrieval |

## Real-World Impact

Well-engineered prompts reduce iterations by 60-80%, saving time and API costs. Platform-specific techniques (XML for Claude, weights for SD, PTCF for Gemini) consistently outperform generic prompts. The difference between "create a video" and a properly structured Veo3 prompt with all 5 components can be 10+ iterations versus getting it right on attempt 1-2.
