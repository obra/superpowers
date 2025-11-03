# Autonomous Framework Selection Engine

## Purpose

This file contains the decision logic that enables Claude to automatically select the optimal framework combination for any copywriting request **without asking the user**.

## Core Principle

**Extract context → Match to decision trees → Select frameworks → Generate copy**

Never ask "Which framework would you like?" - that's what this engine determines automatically.

## Context Extraction Rules

### Automatic Detection Patterns

From any user request, extract:

1. **Business Type**
   - Keywords: coaching, consulting, SaaS, e-commerce, service business, B2B, B2C
   - If unclear: Infer from description

2. **Format Needed**
   - Keywords: landing page, email, post, Instagram, LinkedIn, Twitter, video script, ad
   - Default: If unspecified and describing offer → landing page

3. **Price Point**
   - $0-$50: Low-ticket
   - $50-$500: Mid-ticket
   - $500-$2,000: Premium
   - $2,000+: High-ticket
   - If unspecified: Infer from business type

4. **Target Audience Awareness**
   - Cold (unaware): Needs education
   - Warm (problem-aware): Needs solution
   - Hot (solution-aware): Needs offer

5. **Primary Goal**
   - Awareness: Make them know you exist
   - Consideration: Make them understand value
   - Conversion: Make them buy/book/sign up

## Framework Selection Decision Trees

### Decision Tree 1: By Business Type

**Coaching/Consulting/High-Ticket Services ($2,000+)**
- Primary: Caleb Ralston (depth, trust, authority)
- Secondary: Donald Miller (clarity)
- Tertiary: Chris Voss (tactical empathy)
- **Why:** High-ticket requires trust-building and depth

**SaaS/Tech Products**
- Primary: Donald Miller (clarity above all)
- Secondary: Alex Hormozi (value equation)
- Tertiary: Russell Brunson (demo to close)
- **Why:** Complex products need simple explanations

**E-commerce/Physical Products**
- Primary: Alex Hormozi (value stacking)
- Secondary: Russell Brunson (story-driven desire)
- Tertiary: Dan Kennedy (urgency and scarcity)
- **Why:** Must overcome price resistance quickly

**B2B Services**
- Primary: Donald Miller (executive clarity)
- Secondary: Simon Sinek (why-driven)
- Tertiary: Rory Sutherland (psychological reframing)
- **Why:** Decision-makers need ROI clarity

**Creative Services/Agencies**
- Primary: Chris Do (value-based positioning)
- Secondary: Caleb Ralston (depth and expertise)
- Tertiary: Seth Godin (remarkable positioning)
- **Why:** Must demonstrate unique value

**Low-Ticket Digital Products ($0-$100)**
- Primary: Russell Brunson (quick desire building)
- Secondary: Dan Kennedy (direct response)
- Tertiary: Gary Vaynerchuk (social proof)
- **Why:** Volume play, need fast conversions

### Decision Tree 2: By Content Format

**Landing Pages**
- Framework mix: StoryBrand (structure) + Hormozi (offer) + One expert for personality
- **Structure:** Clear hero section, problem/solution, value stack, CTA
- **Length:** 1,500-3,000 words for high-ticket, 800-1,500 for low-ticket

**Email Sequences**
- Day 1: Caleb Ralston or Sinek (build connection, establish why)
- Day 2-3: StoryBrand or Brunson (tell story, show transformation)
- Day 4-5: Hormozi (stack value, overcome objections)
- Day 6-7: Kennedy + Voss (urgency + final objection handling)

**LinkedIn Posts (Authority Building)**
- Primary: Caleb Ralston (depth-first, thoughtful)
- Secondary: Seth Godin (thought-provoking)
- Format: 150-300 words, starts with hook, ends with insight

**Instagram Posts/Stories**
- Primary: Gary Vaynerchuk (document, authentic)
- Secondary: Russell Brunson (micro-story)
- Format: Visual-first, 50-150 words, casual tone

**Twitter/X Threads**
- Primary: Caleb Ralston (waterfall method)
- Secondary: Gary Vaynerchuk (value bombs)
- Format: Hook tweet → 5-10 value tweets → CTA

**Video Sales Letters (VSL)**
- Primary: Russell Brunson (perfect webinar structure)
- Secondary: Alex Hormozi (value equation)
- Structure: Origin story → Content → Pitch

**Blog Posts (SEO/Authority)**
- Primary: Seth Godin (remarkable insights)
- Secondary: Caleb Ralston (depth)
- Length: 1,500-2,500 words, educational

**Paid Ads (FB/Google)**
- Primary: Dan Kennedy (direct response)
- Secondary: Hormozi (attention-grabbing value)
- Format: Hook in 3 seconds, clear CTA

### Decision Tree 3: By Customer Journey Stage

**Awareness Stage (Cold Audience)**
- Primary: Gary Vaynerchuk or Seth Godin (jab, give value)
- Secondary: Caleb Ralston (demonstrate depth)
- Goal: Make them know you exist and care
- **No selling - just value and positioning**

**Consideration Stage (Warm Audience)**
- Primary: Donald Miller (clarify the solution)
- Secondary: Russell Brunson (show transformation)
- Goal: Make them understand you're the solution
- **Soft pitch, heavy on value demonstration**

**Decision Stage (Hot Audience)**
- Primary: Alex Hormozi (stack value, overcome objections)
- Secondary: Dan Kennedy (urgency, direct response)
- Tertiary: Chris Voss (handle final objections)
- Goal: Make them take action now
- **Direct offer, clear CTA, remove friction**

### Decision Tree 4: By Price Point

**Low-Ticket ($0-$100)**
- Speed matters: Kennedy + Brunson + GaryVee
- Quick decision required
- Volume play
- Emphasize: Impulse, testimonials, guarantee

**Mid-Ticket ($100-$500)**
- Balance speed and trust: StoryBrand + Hormozi + Ralston
- Some consideration time
- Need clear value demonstration
- Emphasize: ROI, comparisons, case studies

**Premium ($500-$2,000)**
- Trust building: Ralston + StoryBrand + Hormozi
- Considered purchase
- Need authority positioning
- Emphasize: Transformation, expertise, results

**High-Ticket ($2,000+)**
- Deep trust required: Ralston + Voss + Do
- Long sales cycle
- Need relationship building
- Emphasize: Partnership, depth, understanding

## Proven Framework Combinations

### The "Trust Stack" (High-Ticket Services)
- Caleb Ralston: Establish depth and authority
- Chris Voss: Show you understand their situation
- Chris Do: Position value over price
- **Use for:** Coaching, consulting, agency services

### The "Clarity Stack" (Complex Products)
- Donald Miller: Make it simple
- Alex Hormozi: Show undeniable value
- Russell Brunson: Demo the transformation
- **Use for:** SaaS, software, technical products

### The "Volume Stack" (Low-Ticket Digital)
- Russell Brunson: Quick desire building
- Dan Kennedy: Urgency and scarcity
- Gary Vaynerchuk: Social proof
- **Use for:** Courses, ebooks, low-ticket offers

### The "Authority Stack" (Personal Brands)
- Caleb Ralston: Depth-first content
- Seth Godin: Remarkable insights
- Simon Sinek: Why-driven messaging
- **Use for:** Thought leaders, experts, creators

### The "E-commerce Stack"
- Alex Hormozi: Value stacking
- Dan Kennedy: Urgency tactics
- Russell Brunson: Story-driven desire
- **Use for:** Physical products, drop shipping

## Selection Algorithm

```
1. EXTRACT CONTEXT
   ├─ Business type
   ├─ Format
   ├─ Price point
   ├─ Audience temperature
   └─ Primary goal

2. CONSULT DECISION TREES
   ├─ Match business type → Get primary framework
   ├─ Match format → Get structure requirements
   ├─ Match journey stage → Get messaging approach
   └─ Match price point → Get emphasis elements

3. SELECT 1-3 FRAMEWORKS
   ├─ Primary (drives core message)
   ├─ Secondary (provides structure or support)
   └─ Tertiary (adds personality or handles objections)

4. GENERATE COPY
   ├─ Apply frameworks in order
   ├─ Optimize for format
   ├─ Include all required elements
   └─ Maintain authentic voice

5. EXPLAIN BRIEFLY
   ├─ Which frameworks used
   ├─ Why they fit (1 sentence each)
   └─ Offer variations if requested
```

## Critical Rules

### Always Automatic
- Never ask which framework to use
- Never present framework options for user to choose
- Never say "Would you like me to use X framework?"

### Exception (Only Ask If):
- Business/offer is completely unclear
- Target audience is ambiguous beyond inference
- Multiple conflicting goals are stated

### Default Behaviors
- **If price unknown:** Infer from business type
- **If audience unknown:** Assume warm (problem-aware)
- **If tone unclear:** Match business type (formal for B2B, casual for B2C)
- **If length unspecified:** Match format standards

## Platform-Specific Optimization

### LinkedIn
- Professional tone
- Thought leadership angle
- 150-300 words
- Hook → Insight → Application

### Instagram
- Visual-first
- Casual, authentic tone
- 50-150 words
- Story-driven

### Twitter/X
- Concise, punchy
- Thread format for depth
- Hook in first tweet
- Value in middle tweets
- CTA in final tweet

### Landing Pages
- Clear hero section
- Problem → Solution → Value → Social Proof → CTA
- Length varies by price point
- Multiple CTAs

### Email
- Subject line = Curiosity + Benefit
- Body = Story or Value
- Single CTA
- Conversational tone

## Quality Checks

Before delivering copy, verify:
- [ ] Frameworks selected match context
- [ ] Copy follows format requirements
- [ ] All conversion elements present (if conversion goal)
- [ ] Tone matches business type
- [ ] Length appropriate for format
- [ ] CTA clear and specific
- [ ] Brief framework explanation included

## Evolution Protocol

This selection engine improves over time by:
1. Observing which combinations user prefers
2. Testing new combinations for edge cases
3. Adding new frameworks as they're proven
4. Refining decision trees based on outcomes

The engine is designed to be **deterministic but adaptive** - same inputs yield same outputs, but the logic improves with use.
