---
name: local-seo-analyzation
description: Use when analyzing or optimizing local search performance, working with Google Business Profile, creating location-specific content, or tracking local rankings - comprehensive guide for translating search data into actionable tasks across Relevance, Distance, and Prominence pillars
---

# Local SEO Analyzation

## Overview

The Local SEO Analyst translates complex search data into clear, prioritized, actionable tasks that drive high-intent customer acquisition. Focus on three pillars: **Relevance** (matching search intent), **Distance** (proximity to searcher), and **Prominence** (authority and trust signals).

**Timeline expectations:** Initial improvements in 3-6 months, significant gains in 6-12 months of consistent effort.

## When to Use

Use this skill when:
- Analyzing local search visibility and performance
- Optimizing Google Business Profile (GBP) for Map Pack rankings
- Creating or auditing location-specific landing pages
- Tracking local keyword rankings across service areas
- Building local authority through citations and backlinks
- Analyzing competitor local search dominance
- Reporting on local SEO KPIs and conversions

Don't use for:
- National/global SEO without geographic targeting
- Pure technical SEO without local components
- Social media marketing (unless location-based)

## Core KPIs: Focus on Conversions, Not Vanity Metrics

Track metrics that lead directly to revenue:

| KPI Category | What to Track | Why It Matters |
|--------------|---------------|----------------|
| **GBP Conversions** | Phone calls from GBP, website clicks, direction requests | Direct conversion actions |
| **Organic Traffic** | Visitors from unpaid local Google searches | High-intent discovery |
| **Lead Generation** | Form submissions, quote requests from location pages | Revenue pipeline |
| **Proximity Metrics** | Mobile clicks-to-call, direction requests | Physical location value |

## Ranking Factor Priorities

Optimization strategy differs between Local Pack (Map results) and Localized Organic results:

| Factor Category | Local Pack Impact | Localized Organic Impact | Strategic Focus |
|-----------------|-------------------|-------------------------|-----------------|
| **Google Business Profile** | 32% | 9% | Highest impact on Map visibility |
| **On-Page Signals** | 19% | 36% | Highest impact on organic ranking |
| **Link Signals** | 11% | 26% | Long-term authority building |
| **Review Signals** | 16% | 6% | Trust and Map visibility |

**Prioritization guidance:**
- Low Local Pack visibility → Focus on GBP optimization first
- Weak organic rankings → Prioritize unique, location-specific content
- Limited authority → Build strategic local backlink profile

## Phase 1: Keyword and Competitive Research

### High-Intent Keyword Research

Target queries with strong transactional intent:

**Query types to prioritize:**
1. **"Near Me" queries:** "dentists near me", "plumber nearby" (highest conversion)
2. **Long-tail/Voice search:** "Who offers air conditioner repair near me?" (use AnswerThePublic)
3. **Service + Location:** "roofing company Dallas TX" or "Austin Web Designer"
4. **Location-first:** "Dallas roofing company" (common local pattern)

**Tools:**
- Semrush Keyword Magic Tool or Ahrefs for volume validation
- Manual SERP analysis for competitor GBP keywords and "People also ask"

### Competitor Analysis Checklist

- [ ] **Category audit:** Check primary/secondary GBP categories of top 3 local competitors
- [ ] **Content gaps:** Identify service/location pages competitors have that you're missing
- [ ] **Backlink review:** Use Semrush/Ahrefs to find local link opportunities (newspapers, chambers)

## Phase 2: Data Monitoring and Analysis

### Core Platforms to Monitor

**Google Business Profile Insights:**
- Profile views, calls, direction requests, website clicks
- Review velocity and sentiment trends
- Photo views and engagement

**Google Search Console + Analytics (GA4):**
- Organic search performance and technical issues
- Traffic sources and conversion paths
- **Critical:** Use UTM codes on GBP website links to attribute leads accurately

**AI Search Visibility:**
- Manual checks for AI Overview presence
- Ensure accurate GBP data and Schema markup support AI generation

### Localized Ranking Tracking

**Map Pack ranking:**
- Use geo-grid tools (Semrush Map Rank Tracker, LocalFalcon)
- Track across multiple geographic points in service area
- Identify neighborhood-level visibility gaps

**Organic keyword positions:**
- Monitor "Service + Location" term rankings for landing pages
- Track below-the-Local-Pack organic results

### Reputation and Behavioral Signals

**Review management:**
- Track volume, recency, quality across GBP and third-party sites (Yelp, Facebook)
- Note: Reviews older than 3 months are less relevant to consumers
- Use tools like GatherUp, Semrush, or Whitespark for centralized monitoring

**Behavioral metrics:**
- Click-Through Rate (CTR) from search results
- Mobile clicks-to-call rates
- Dwell Time (time on site)
- High engagement = Google sees you as the better result

## Phase 3: Actionable Recommendations (Priority Order)

Prioritize based on ranking factor weights and current performance gaps:

### Priority 1: GBP Optimization (If Local Pack visibility is low)

**Impact:** 32% of Local Pack ranking factors

**Actions:**
- Complete all GBP fields (name, address, phone, hours, services, attributes)
- Use precise primary and secondary categories
- Upload high-quality, geo-tagged photos weekly
- Post updates regularly (offers, events, announcements)
- Respond to all reviews within 24-48 hours

### Priority 2: Location-Specific Content (If organic rankings are weak)

**Impact:** 36% of Localized Organic ranking factors

**Create unique Service Area Pages (SAPs):**
- One page per Service + City combination
- Include local details: neighborhood landmarks, local offers, area-specific testimonials
- Avoid templated content (doorway page penalty risk)*
- Feature customer stories from that specific area

*Doorway pages are low-quality pages with minimal unique content created solely to rank for specific searches. Google penalizes them because they provide poor user experience. Signs: same template with only city name changed, thin content (<300 words), no real value.

**Content requirements:**
- Unique text for each city (not spun/templated)
- Local schema markup (see Technical SEO below)
- Embedded map showing service area
- Local phone numbers or location-specific contact info

### Priority 3: Technical SEO Implementation

**LocalBusiness Schema (JSON-LD):**

Required properties:
- `@type: "LocalBusiness"` (or specific type like "Restaurant", "Plumber")
- `name`: Business name
- `address`: Full structured address
- `telephone`: Local phone number

Recommended properties:
- `geo.latitude` and `geo.longitude` (5+ decimal precision)
- `openingHours`: Structured hours
- `priceRange`: Approximate pricing ($, $$, $$$)
- `image`: Business photo URLs

**NAP Consistency Audit (Quarterly):**
- Scan all online directories for Name, Address, Phone consistency
- 100% consistency required for search engine trust
- Use citation management tools or manual spreadsheet tracking

### Priority 4: Authority Building (Long-term)

**Impact:** 26% of Localized Organic ranking factors

**Local link strategies:**
1. **Community involvement:** Sponsor local events, join Chamber of Commerce
2. **Digital PR:** Pitch newsworthy stories to local media outlets
3. **Local partnerships:** Cross-promote with complementary local businesses
4. **Local resources:** Create city guides, local industry reports
5. **Local directories:** Ensure presence in high-quality local citations

**Quality over quantity:** One link from local newspaper > ten generic directory links

## Reporting Framework

### Transparent Performance Reports

**Structure:**
1. **Executive summary:** KPI performance vs. goals (conversions focus)
2. **Ranking changes:** Map Pack and organic positions for target keywords
3. **Traffic analysis:** Organic search traffic by location page
4. **Lead volume:** Conversion tracking by source and location
5. **Reputation trends:** Review velocity, sentiment, response rates
6. **AI visibility:** Presence in AI Overviews and featured snippets
7. **Next month priorities:** Top 3-5 actionable recommendations

**Visualization:**
- Use Looker Studio or similar for clear dashboards
- Show trends over time, not just snapshots
- Highlight wins and areas needing attention

**Recommendation format:**
- What to do (specific action)
- Why (tied to ranking factors or KPIs)
- Expected impact (map visibility, organic traffic, leads)
- Who executes (content team, technical, strategy)

## Quick Reference: 90-Day Action Plan

| Phase | Week 1-4 | Week 5-8 | Week 9-12 |
|-------|----------|----------|-----------|
| **GBP** | Complete all fields, upload 20 photos | Weekly posts, review responses | Analyze insights, optimize categories |
| **Content** | Audit existing location pages | Create 4-6 new SAPs with unique content | Optimize existing pages with local schema |
| **Technical** | Implement LocalBusiness schema | NAP consistency audit and fixes | Submit updated XML sitemap |
| **Authority** | Identify 10 local link targets | Outreach to 5 partners/media | Secure 2-3 quality local links |
| **Tracking** | Set up geo-grid rank tracking | Configure GA4 goals for GBP traffic | Create monthly reporting dashboard |

## Common Mistakes

| Mistake | Why It's Bad | Fix |
|---------|--------------|-----|
| **Templated location pages** | Google flags as doorway pages, penalties possible | Write unique content per city with local details |
| **Inconsistent NAP** | Confuses search engines, hurts credibility | Quarterly audit, 100% consistency across all citations |
| **Ignoring reviews** | Negative reviews lower prominence, slow responses hurt | Respond to all reviews within 24-48 hours |
| **Generic schema** | Misses AI and rich snippet opportunities | Include geo coordinates (5+ decimals), hours, pricing |
| **Tracking rankings only** | Rankings don't equal revenue | Focus on GBP conversions, leads, and traffic |
| **One-time optimization** | Local SEO requires ongoing effort | Monthly content, weekly GBP posts, quarterly audits |
| **Skipping mobile** | 60%+ local searches on mobile | Ensure mobile-fast site, click-to-call buttons |

## Advanced: Multi-Location Strategy

For businesses with multiple physical locations:

**GBP management:**
- Unique GBP for each location (no shared profiles)
- Location-specific phone numbers and landing pages
- Individual photo sets per location

**Content architecture:**
- `/locations/` directory with subdirectory per city
- Location-specific blog posts and case studies
- City landing pages linking to neighborhood sub-pages

**Tracking:**
- Separate GA4 properties per location OR use custom dimensions to segment by location
- Location-specific UTM codes for attribution
- Compare performance across locations to identify best practices

**Scale considerations:**
- **2-5 locations:** Single GA4 property with location filtering, manual GBP management
- **6-20 locations:** Consider GBP management tools (BrightLocal, SOCi), centralized reporting
- **20+ locations:** Enterprise tools required (Rio SEO, Yext), dedicated local SEO team/agency

## Tools Reference

Comprehensive list of tools mentioned throughout this guide, organized by function:

### Keyword Research & SERP Analysis
- **Semrush Keyword Magic Tool:** Volume validation, keyword discovery, competitive analysis
- **Ahrefs:** Keyword research, backlink analysis, content gap identification
- **AnswerThePublic:** Question-based and voice search query discovery
- **Manual SERP review:** Free, essential for GBP keyword analysis and "People also ask" insights

### Rank Tracking (Geo-Grid)
- **Semrush Map Rank Tracker:** Track Map Pack rankings across multiple geographic points
- **LocalFalcon:** Detailed geo-grid tracking with heat maps and neighborhood-level insights
- **BrightLocal:** Local rank tracking plus reputation management features

### Analytics & Monitoring
- **Google Business Profile Insights:** Native GBP performance data (free, essential)
- **Google Search Console (GSC):** Organic search performance, technical issues (free, essential)
- **Google Analytics 4 (GA4):** Traffic sources, conversion paths, behavioral metrics (free, essential)
- **Looker Studio:** Dashboard creation and visualization (free)

### Review Management
- **GatherUp:** Centralized review monitoring and response management
- **Semrush Local:** Review tracking plus broader local SEO features
- **Whitespark:** Review monitoring and citation building platform
- **BrightLocal:** Includes review management alongside other local SEO tools

### Citation & NAP Management
- **Whitespark:** Citation building and NAP consistency audits
- **BrightLocal:** Automated citation tracking and management
- **Yext:** Enterprise-level citation distribution and management
- **Manual spreadsheet:** Free alternative for smaller businesses (20-30 citations)

### Multi-Location Management (6+ locations)
- **BrightLocal:** Up to ~50 locations, good feature-to-price ratio
- **SOCi:** Social + local management for franchises
- **Rio SEO:** Enterprise platform for 50+ locations
- **Yext:** Enterprise citation and listing management at scale

### Tool Selection Criteria

**Budget tiers:**
- **Free (starting out):** GBP Insights, GSC, GA4, manual SERP checks, spreadsheet NAP tracking
- **$100-300/month (growing):** Semrush OR Ahrefs (pick one), LocalFalcon, basic review tool
- **$500-1000/month (established):** Full Semrush/Ahrefs, BrightLocal or Whitespark, Looker Studio Pro
- **$2000+/month (enterprise/multi-location):** Add Yext or Rio SEO, dedicated tools team

**Selection priorities:**
1. Start with free Google tools (GBP, GSC, GA4) - essential foundation
2. Add keyword research (Semrush OR Ahrefs, not both initially)
3. Add geo-grid rank tracking (LocalFalcon most cost-effective)
4. Add review management as review volume grows
5. Add citation management when maintaining 50+ citations

## Analyst Mindset

Think of yourself as a cartographer and navigator:
- Map the local SERP terrain with tools (Semrush, LocalFalcon)
- Identify revenue-generating keyword channels vs. low-value terms
- Track every signal (reviews, links, GBP data, behavioral metrics)
- Provide precise coordinates (recommendations) to steer toward high-traffic opportunities
- Avoid competitive shoals where established players dominate

**Core principle:** Every recommendation must tie back to KPIs (conversions, leads, revenue). Vanity metrics (rankings alone, profile views) don't pay the bills.
