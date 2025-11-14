---
name: technical-seo-local-business
description: Use when optimizing local business websites for search engines and AI systems, managing technical performance, site architecture, and structured data - focuses on crawling, indexing, mobile performance, and schema markup to improve local search rankings (36% of ranking factors)
---

# Technical SEO for Local Business

## Overview

**Core principle:** The Technical SEO Specialist ensures websites are perfectly structured, fast, and easily digestible by search engine crawlers and AI systems, focusing on On-Page Signals (36% of local ranking importance).

This role is the foundation anchor - while content is the sail and social signals are the current, technical structure (mobile-friendliness, speed, and schema) is the robust hull ensuring the business stays afloat and is deemed seaworthy by search engines.

## When to Use

Use this skill when:
- Managing technical performance for local business websites
- Implementing structured data (Schema, KML) for local search
- Optimizing crawling, indexing, and site architecture
- Ensuring mobile-first performance and page speed
- Setting up NAP (Name, Address, Phone) consistency
- Troubleshooting local search visibility issues

## Key Terminology

- **NAP:** Name, Address, Phone - must be consistent across all online properties
- **GBP:** Google Business Profile (formerly Google My Business)
- **SAPs:** Service Area Pages - location-specific pages on your website
- **SABs:** Service Area Businesses - businesses that serve customers at their location (plumbers, landscapers)
- **Schema/JSON-LD:** Structured data format that helps search engines understand your business
- **KML:** Keyhole Markup Language - XML format for geographic data
- **Core Web Vitals:** Google's metrics for page experience (LCP, FID, CLS)
- **Crawl Budget:** Resources Google allocates to crawling your site
- **Rich Snippets:** Enhanced search results with additional information (ratings, hours, etc.)

## Implementation Phases

### Phase 1: Crawling, Indexing, and Foundation

**Goal:** Ensure search engine bots can efficiently access, understand, and index all relevant pages.

**1. Sitemap and Robots.txt Management**
- Create and submit accurate XML sitemap to Google Search Console
- Automate sitemap updates using Search Console Sitemap API
- **Verify robots.txt configuration:**
  1. Access your robots.txt at `yoursite.com/robots.txt`
  2. Check it doesn't contain `Disallow: /` (blocks everything)
  3. Verify service/location pages aren't blocked (e.g., `/services/`, `/locations/`)
  4. Use Google Search Console → Settings → robots.txt Tester to test specific URLs
  5. Ensure sitemap reference exists: `Sitemap: https://yoursite.com/sitemap.xml`
- Ensure KML file is referenced in sitemap and allowed in robots.txt

**2. Technical Integrity and Data Consistency**
- **NAP Consistency Audit:** Ensure Name, Address, Phone consistency across:
  - Website
  - Google Business Profile (GBP)
  - Schema markup
  - Online directories (citations)
  - Even minor differences ("St." vs "Street") confuse search engines
- **Canonicalization:** Employ URL best practices for near-duplicate content
- **HTTPS Security:** Verify HTTPS implementation (ranking factor)

### Phase 2: Performance and Mobile Optimization

**Goal:** Deliver fast, mobile-friendly experiences that satisfy both users and Google's ranking algorithms.

**Mobile-First Requirements:**
- Verify Mobile-First Design using Google Mobile-Friendly Test
- Target: < 3 seconds load time (50%+ visitors leave if slower)
- Monitor Core Web Vitals: LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift)

**Page Speed Optimization Process:**
1. Run Google PageSpeed Insights to identify bottlenecks
2. Prioritize fixes by impact:
   - **Images:** Convert to WebP format, compress with tools like TinyPNG or Squoosh
   - **Caching:** Enable browser caching, implement server-side caching
   - **JavaScript:** Minify and defer non-critical JS, remove unused code
   - **CSS:** Inline critical CSS, defer non-critical stylesheets
   - **CDN:** Use Cloudflare or similar to serve static assets faster
3. Implement lazy loading for images: `<img loading="lazy">`
4. Use responsive images with srcset for different screen sizes
5. Re-test and measure improvement

**Image Optimization Specifics:**
- Convert to WebP format (30-40% smaller than JPG/PNG)
- Compress images: Aim for <200KB for hero images, <100KB for content images
- Use descriptive file names: `atlanta-kitchen-renovation.jpg`
- Add descriptive alt text for accessibility and SEO
- Implement lazy loading for below-fold images

### Phase 3: Site Architecture and Location Signaling

**Goal:** Control how authority flows and reinforce geographic signals.

**URL Structure:**
- Use SEO-friendly URLs (short, descriptive, keyword-rich)
- Multi-location: Use subfolders (`example.com/locations/austin`)
- Implement robust internal linking strategy to spread page authority

**Location Page Crawlability:**
- Ensure Service Area Pages (SAPs) aren't hidden behind uncrawlable widgets
- Create alternate linked paths (dedicated HTML sitemap)

**Map Integration:**
- Embed interactive Google Map on Contact/About pages
- Copy embed code from Google Maps listing (Share → Embed a map)

### Phase 4: Advanced Structured Data (Schema and KML)

**Goal:** Communicate business identity and location directly to search engines and AI systems.

**LocalBusiness Schema Implementation:**

**Format:** JSON-LD (Google's preferred format)
**Placement:** `<head>` section of homepage, contact page, or location pages

**Choosing the Right @type:**
- Don't use generic `LocalBusiness` - use the most specific subtype available
- Common types: `Restaurant`, `Dentist`, `Plumber`, `Electrician`, `Attorney`, `RealEstateAgent`, `AutoRepair`, `HairSalon`, `FitnessCenter`
- Find your type: Visit schema.org/LocalBusiness and browse subtypes
- When in doubt: Check competitors' schema or use the closest match

**Required Properties:**
- `@context`: "https://schema.org"
- `@type`: (use specific sub-type: Restaurant, Dentist, Plumber, etc.)
- `name`: Business name (must match NAP exactly)
- `address`: Full PostalAddress object

**Recommended Properties:**
- `geo`: GeoCoordinates with latitude/longitude (5+ decimal places - get from Google Maps)
- `openingHoursSpecification`: Business hours with dayOfWeek, opens, closes
- `telephone`: With country and area code format (e.g., "+1-512-555-0100")
- `url`: Website URL
- `image`: Business logo or photo URL
- `priceRange`: e.g., "$$" or "$$$"
- `aggregateRating` or `review`: If you display reviews on your site

**Example Structure:**
```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Example Restaurant",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main Street",
    "addressLocality": "Austin",
    "addressRegion": "TX",
    "postalCode": "78701"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 30.26715,
    "longitude": -97.74306
  },
  "telephone": "+1-512-555-0100",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "11:00",
      "closes": "22:00"
    }
  ]
}
```

**KML (Keyhole Markup Language) File Optimization:**

**Purpose:** Reinforces geographic relevance and strengthens Google Maps SEO signals.

**When to Use KML:**
- Service Area Businesses (SABs) that cover specific geographic zones
- Multi-location businesses wanting to define coverage areas
- Businesses wanting to enhance local map presence

**Creating a KML File:**

**Option 1: Google My Maps (Easiest for beginners)**
1. Go to Google My Maps (mymaps.google.com)
2. Create a new map
3. Draw your service area using the polygon tool or add markers
4. Click Menu → Export to KML/KMZ
5. Download the KML file

**Option 2: Manual XML Creation**
- See `kml-example.kml` in this directory for a complete working example
- KML structure: `<kml>` → `<Document>` → `<Placemark>` → `<Polygon>` or `<Point>`
- Coordinates format: longitude,latitude,altitude (note: longitude FIRST)
- Get coordinates from Google Maps (right-click location → coordinates)

**Key Elements:**
- **Point:** Single business location (use for storefronts)
- **Polygon:** Service area coverage (use for SABs like plumbers, landscapers)
- **Coordinates:** Must be at least 5 decimal places for precision

**Integration Steps:**
1. Create KML file and upload to your web server (e.g., `/business.kml`)
2. Add header reference in your HTML `<head>`:
```html
<link rel="alternate"
      type="application/vnd.google-earth.kml+xml"
      href="https://example.com/business.kml" />
```
3. Reference in sitemap.xml
4. Verify file is accessible (not blocked by robots.txt)
5. Validate using KML validator tools

### Phase 5: Technical Validation and Monitoring

**Goal:** Continuous monitoring to catch errors and adapt to AI search changes.

**Validation Process:**
1. Validate structured data using Google's Rich Results Test
2. Deploy updated pages
3. Use URL Inspection tool in Search Console to verify indexing
4. Ensure strong foundation for AI search visibility
5. Optimize Bing Places for Business (powers ChatGPT local results)

**Troubleshooting:**
- Review structured data general guidelines for spam/syntax issues
- Allow time for re-crawling and re-indexing (several days)
- Monitor traffic drops and rich results failures

## Quick Reference: Priority Tasks

| Priority | Task | Impact |
|----------|------|--------|
| Critical | NAP consistency audit | Trust & rankings |
| Critical | Mobile-first design & speed | User experience & rankings |
| Critical | LocalBusiness schema (JSON-LD) | Rich snippets & AI visibility |
| High | XML sitemap submission | Indexing efficiency |
| High | HTTPS implementation | Security & trust |
| High | Internal linking strategy | Authority distribution |
| Medium | KML file creation | Geographic relevance |
| Medium | Google Maps embedding | Local signals |
| Ongoing | Monthly speed monitoring | Performance maintenance |
| Ongoing | Schema validation | Data accuracy |

## Common Mistakes

**NAP Inconsistency**
- What goes wrong: Using "St." in one place and "Street" in another confuses search engines
- Fix: Audit all instances (website, GBP, schema, citations) and standardize exact format

**Ignoring Mobile Performance**
- What goes wrong: Desktop-optimized sites rank poorly due to mobile-first indexing
- Fix: Design mobile-first, test on actual mobile devices, monitor Core Web Vitals

**Schema Syntax Errors**
- What goes wrong: Invalid JSON-LD prevents rich snippets from appearing
- Fix: Always validate with Rich Results Test before deployment

**Blocking Important Pages**
- What goes wrong: Robots.txt accidentally blocks service/location pages from crawling
- Fix: Test specific URLs using Google Search Console → Settings → robots.txt Tester to verify they're not blocked

**Missing Geographic Coordinates**
- What goes wrong: Insufficient precision in lat/long reduces local relevance
- Fix: Use 5+ decimal places for coordinates in schema and KML

**Slow Page Speed**
- What goes wrong: Sites > 3 seconds lose 50%+ visitors and rank lower
- Fix: Optimize images, enable caching, use CDN, schedule monthly reviews

**Service Area Pages Behind Widgets**
- What goes wrong: Uncrawlable store locators hide important location pages
- Fix: Create alternate linked paths via HTML sitemap

## Technical Stack Integration

**Essential Tools:**
- Google Search Console (sitemap submission, URL inspection)
- Google Rich Results Test (schema validation)
- Google PageSpeed Insights (performance monitoring)
- Bing Places for Business (AI search optimization)

**Monthly Review Checklist:**
- [ ] Page speed and mobile functionality
  - Run Google PageSpeed Insights for key pages
  - Check Core Web Vitals in Search Console
  - Test on real mobile devices
  - Target: All pages < 3 seconds load time
- [ ] Schema markup validation
  - Use Rich Results Test on homepage and location pages
  - Verify no errors or warnings
  - Check that rich snippets appear in search results
- [ ] NAP consistency across all properties
  - Audit website footer, contact page, and location pages
  - Verify GBP information matches exactly
  - Check top 3-5 citation sources (Yelp, Yellow Pages, etc.)
- [ ] Sitemap accuracy and submission status
  - Verify sitemap.xml is current and accessible
  - Check Google Search Console for sitemap errors
  - Ensure all important pages are included
- [ ] Robots.txt configuration
  - Review for accidental blocks
  - Test critical URLs with robots.txt Tester
- [ ] Internal linking integrity
  - Check for broken links using tools like Screaming Frog
  - Verify location pages are properly linked
- [ ] HTTPS certificate validity
  - Check certificate expiration date
  - Verify all pages load via HTTPS (no mixed content warnings)

## Real-World Impact

**By Implementation:**
- Phase 1 (Foundation): Improved indexing, cleaner crawl budget
- Phase 2 (Performance): Reduced bounce rates, better user experience
- Phase 3 (Architecture): Better authority distribution, enhanced local signals
- Phase 4 (Structured Data): Rich snippets, AI Overview inclusion, enhanced SERP presence
- Phase 5 (Monitoring): Early issue detection, continuous optimization

**Without Technical SEO:**
Even with excellent content and strong social signals, poor technical foundation causes:
- Slow or incomplete indexing
- Poor mobile rankings
- Missing rich snippets
- Reduced AI search visibility
- Lost local search opportunities

The technical foundation is non-negotiable for local search success.
