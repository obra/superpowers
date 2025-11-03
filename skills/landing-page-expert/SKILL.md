---
name: landing-page-expert
description: Use when creating any marketing copy - autonomously selects optimal frameworks from 11 experts (Hormozi, Brunson, Ralston, etc.) and generates professional copy for landing pages, emails, social posts, and more
---

# Landing Page Expert - Autonomous Copywriting System

## Overview

This skill combines methodologies from 11 world-class marketing experts into an intelligent system that automatically selects the perfect framework combination for any copywriting task.

**The system works autonomously** - you describe what you need, and it handles framework selection, copy generation, and optimization automatically.

## Integrated Expert Frameworks

1. **Caleb Ralston** - Brand Journey, Waterfall Method, Depth-First Strategy
2. **Alex Hormozi** - Value Equation, Grand Slam Offers, Offer Stacking
3. **Russell Brunson** - Story Selling, Perfect Webinar, Epiphany Bridge
4. **Donald Miller (StoryBrand)** - 7-Part Framework, Clarity First
5. **Dan Kennedy** - PAS Formula, Direct Response Marketing
6. **Gary Vaynerchuk** - Document Don't Create, Jab Jab Right Hook
7. **Simon Sinek** - Start With Why, Golden Circle
8. **Seth Godin** - Purple Cow, Permission Marketing, Tribes
9. **Rory Sutherland** - Behavioral Economics, Psychological Value
10. **Chris Do** - Value-Based Pricing, Consultative Sales
11. **Chris Voss** - Tactical Empathy, Calibrated Questions

## What This Skill Generates

- **Landing Pages** - Full conversion-optimized pages
- **Email Sequences** - 3-7 email nurture campaigns
- **Social Media Posts** - Platform-optimized content (LinkedIn, Instagram, Twitter, TikTok, etc.)
- **UGC Video Scripts** - For Arcads, HeyGen, etc.
- **Blog Posts** - Authority-building long-form content
- **VSL Scripts** - Video sales letters
- **Webinar Scripts** - Russell Brunson's Perfect Webinar format
- **Sales Pages** - High-converting offer pages
- **Ad Copy** - Paid advertising copy

## How It Works (Autonomous Operation)

### Step 1: Automatic Context Analysis
When you make a request, the system automatically extracts:
- Business type and industry
- Target audience and awareness level
- Format needed (landing page, email, social post, etc.)
- Goal (awareness, consideration, conversion)
- Price point and offer complexity
- Unique value proposition

### Step 2: Intelligent Framework Selection
Using decision trees in `SELECTION-ENGINE.md`, the system:
- Matches your context to proven framework combinations
- Selects 1-3 optimal frameworks
- Considers format-specific requirements
- Applies platform optimization rules

### Step 3: Copy Generation
The system:
- Generates professional copy using selected frameworks
- Optimizes for platform/format
- Includes conversion elements
- Provides brief framework explanation

### Step 4: Optional Refinement
You can request:
- A/B test variations
- Tone adjustments
- Length modifications
- Different framework combinations

## Usage Examples

### Simple Request:
```
"Write a LinkedIn post for my coaching business"
```
System automatically: Analyzes → Selects Ralston + Sinek → Generates

### Detailed Request:
```
"Create a landing page for MTL Craft Cocktails:
- $1,200 corporate mixology workshops
- Target: HR managers at tech companies
- Unique value: Hosts enjoy their event instead of bartending"
```
System automatically: Analyzes → Selects StoryBrand + Hormozi + Ralston → Generates

### Complex Campaign:
```
"Build a launch campaign:
- Landing page
- 5-email sequence
- 10 social posts across LinkedIn and Instagram"
```
System automatically: Analyzes → Selects optimal frameworks per format → Generates entire campaign

## Key Files in This Skill

- **SELECTION-ENGINE.md** - Autonomous decision logic for framework selection
- **framework-combinations.md** - Proven framework mixing strategies
- **copy-templates.md** - Real-world examples and templates
- **frameworks/caleb-ralston.md** - Complete Caleb Ralston methodology
- **frameworks/alex-hormozi.md** - Complete Alex Hormozi methodology
- **frameworks/russell-brunson.md** - Complete Russell Brunson methodology
- **frameworks/additional-experts.md** - Remaining 8 expert methodologies

## What Makes This Different

**Traditional copywriting tools:**
- Give you templates to fill in
- Make you choose frameworks
- Require marketing knowledge
- Generic, one-size-fits-all approach

**This autonomous system:**
- Analyzes your specific situation automatically
- Selects optimal frameworks intelligently
- Generates professional copy instantly
- Adapts to any business, any format
- Explains why it works

## Instructions for Claude

When a user requests copywriting:

1. **Extract Context Automatically** (never ask unless critical info missing)
   - Business type and offer
   - Target audience
   - Format needed
   - Goal/objective
   - Price point (if relevant)

2. **Consult SELECTION-ENGINE.md**
   - Match context to decision trees
   - Select 1-3 optimal frameworks
   - Identify any platform-specific requirements

3. **Generate Copy**
   - Apply selected frameworks
   - Optimize for format/platform
   - Include conversion elements
   - Maintain authentic voice

4. **Provide Brief Explanation**
   - Which frameworks were used
   - Why they fit this situation
   - Key principles applied

5. **Offer Refinement Options**
   - A/B test variations
   - Tone adjustments
   - Alternative framework combinations

## Never Ask These Questions

The system should automatically determine:
- Which framework to use (that's what SELECTION-ENGINE.md is for)
- How to structure copy (frameworks provide structure)
- What tone to use (infer from business context)
- Length (match format standards)

Only ask clarifying questions if:
- Business/offer is unclear
- Target audience is ambiguous
- Format is unspecified

## Success Metrics

This skill is working correctly when:
- Framework selection happens automatically
- Copy is generated in single response
- Framework choice is briefly explained
- Output matches requested format
- User can immediately use the copy

## Related Skills

- **copywriting-interview-mode** - For in-depth discovery when context is unclear
- **content-research-writer** - For research-heavy content creation

## Platform Compatibility

This skill works across:
- Claude Web Chat
- Claude Desktop (via MCP)
- Claude Code (command-line)
- API integrations (with skill loader)

See `PLATFORM-ARCHITECTURE.md` and `QUICK-START.md` for deployment details.
