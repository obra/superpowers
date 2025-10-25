---
name: brand-application
description: Use when applying consistent corporate branding to documents - colors, fonts, layouts, messaging, and visual identity based on brand guidelines. Works with any company's brand by loading their style guide.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Brand Application

Apply consistent corporate branding and styling to all generated documents, ensuring professional and cohesive visual identity across all communications.

**Core principle:** Systematic brand consistency through documented guidelines and automated application.

## When to Use

- Creating branded documents (proposals, reports, presentations)
- Ensuring brand consistency across team outputs
- Applying corporate style guides
- Generating marketing materials
- Standardizing visual identity
- Onboarding new team members to brand standards

## Overview

This skill provides a framework for applying brand guidelines to any document type. It's designed to work with YOUR brand by loading your specific style guide.

**No hardcoded brands** - completely customizable to any company's identity.

## Setup: Create Your Brand Guide

Create a brand guide file that this skill will reference:

**brand-guide.md** (or .json/.yaml):

```markdown
# [Your Company Name] Brand Guide

## Company Identity

**Company Name**: Your Company Name
**Tagline**: Your Tagline
**Industry**: Your Industry
**Brand Voice**: [Professional | Friendly | Technical | Creative | etc.]

## Visual Standards

### Color Palette

**Primary Colors:**
- **Brand Blue**: #0066CC (RGB: 0, 102, 204)
  - Use: Headers, primary buttons, key highlights
- **Brand Gray**: #333333 (RGB: 51, 51, 51)
  - Use: Body text, secondary elements

**Secondary Colors:**
- **Success Green**: #28A745
- **Warning Orange**: #FF9800
- **Error Red**: #DC3545

**Neutral Colors:**
- **White**: #FFFFFF
- **Light Gray**: #F5F5F5
- **Dark Gray**: #666666

### Typography

**Headings:**
- Font: Helvetica Neue Bold
- Sizes: H1 (32pt), H2 (24pt), H3 (18pt)
- Color: Brand Blue or Brand Gray
- Letter spacing: Normal

**Body Text:**
- Font: Helvetica Neue Regular
- Size: 12pt
- Line height: 1.5
- Color: Brand Gray

**Special Text:**
- Quotes: Italic, 14pt
- Code: Monospace, Light Gray background
- Links: Brand Blue, underlined

### Logo Usage

**Primary Logo:**
- File: `assets/logo-primary.png`
- Min size: 100px width
- Clear space: Minimum 20px on all sides
- Backgrounds: White, Light Gray only

**Secondary Logo:**
- File: `assets/logo-secondary.png`
- Use on dark backgrounds
- White/inverted version

**Favicon:**
- File: `assets/favicon.png`
- 32x32px, transparent background

### Spacing & Layout

**Margins:**
- Document: 1 inch (72pt) all sides
- Sections: 24pt between sections
- Paragraphs: 12pt between paragraphs

**Grid System:**
- 12-column grid
- Gutter: 20px
- Container: Max 1200px width

## Messaging & Voice

### Brand Voice Attributes

**Professional**: Clear, authoritative, credible
**Approachable**: Warm, helpful, conversational
**Innovative**: Forward-thinking, solution-oriented

### Tone Guidelines

**Do:**
- Use active voice
- Be direct and concise
- Lead with benefits
- Speak to the reader's needs
- Use industry terminology appropriately

**Don't:**
- Use jargon unnecessarily
- Make unsubstantiated claims
- Use overly casual language
- Employ clichés or buzzwords
- Use all caps or excessive punctuation

### Key Messages

**Value Propositions:**
1. [Your key differentiator]
2. [Your unique strength]
3. [Your customer benefit]

**Taglines & Slogans:**
- Primary: "[Your main tagline]"
- Secondary: "[Alternative tagline]"

## Document Templates

### Email Signature
```
[Name]
[Title]
Your Company Name
[email] | [phone]
www.yourcompany.com
```

### Proposal Header
```
[Your Company Logo]
PROPOSAL FOR [CLIENT NAME]
[Date]
[Your Company Tagline]
```

### Report Cover
```
[Large Logo]
[Document Title in Brand Blue, 32pt]
[Subtitle in Brand Gray, 18pt]
[Date]
[Author/Department]
```
```

## How to Use This Skill

### Step 1: Load Your Brand Guide

Place your brand guide in the project:
```
project/
  brand-guide.md          # Your brand guidelines
  assets/
    logo-primary.png
    logo-secondary.png
```

### Step 2: Reference Guidelines

When using this skill, specify:
```
Apply brand guidelines from brand-guide.md to this document.
```

### Step 3: Automated Application

The skill will:
1. Read your brand guide
2. Extract visual standards (colors, fonts, spacing)
3. Apply to document structure
4. Validate consistency
5. Flag any guideline violations

## Brand Application Process

### For Markdown Documents

```markdown
# Proposal for Client Name

<!-- Brand Application: -->
<!-- Header: Brand Blue (#0066CC), Helvetica Neue Bold, 32pt -->
<!-- Clear space: 24pt below header -->

## Executive Summary

<!-- Brand Application: -->
<!-- H2: Brand Gray (#333333), Helvetica Neue Bold, 24pt -->
<!-- Spacing: 12pt above, 12pt below -->

Your content here with proper spacing and typography.

**Key Points:**
<!-- Brand Application: -->
<!-- Bold text: Helvetica Neue Bold -->
<!-- List items: 12pt spacing between items -->

- Benefit 1
- Benefit 2
- Benefit 3
```

### For HTML Documents

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Brand Application - Your Company Name */

    /* Colors */
    :root {
      --brand-blue: #0066CC;
      --brand-gray: #333333;
      --text-color: #333333;
      --bg-color: #FFFFFF;
    }

    /* Typography */
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      color: var(--text-color);
    }

    h1 {
      font-size: 32pt;
      color: var(--brand-blue);
      font-weight: bold;
      margin-bottom: 24pt;
    }

    h2 {
      font-size: 24pt;
      color: var(--brand-gray);
      font-weight: bold;
      margin: 12pt 0;
    }

    /* Layout */
    .container {
      max-width: 1200px;
      margin: 72pt;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Your content -->
  </div>
</body>
</html>
```

### For PDF Documents (via ReportLab)

```python
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor

# Load brand colors from guide
BRAND_BLUE = HexColor('#0066CC')
BRAND_GRAY = HexColor('#333333')

# Create custom styles based on brand guide
styles = getSampleStyleSheet()

# H1 - Based on brand guide
h1_style = ParagraphStyle(
    'CustomH1',
    parent=styles['Heading1'],
    fontSize=32,
    textColor=BRAND_BLUE,
    fontName='Helvetica-Bold',
    spaceAfter=24
)

# Body - Based on brand guide
body_style = ParagraphStyle(
    'CustomBody',
    parent=styles['Normal'],
    fontSize=12,
    textColor=BRAND_GRAY,
    fontName='Helvetica',
    leading=18  # 1.5 line height
)

# Build document
doc = SimpleDocTemplate("branded-doc.pdf", pagesize=letter)
story = []

# Add branded content
story.append(Paragraph("Your Heading", h1_style))
story.append(Spacer(1, 0.5*inch))
story.append(Paragraph("Your content here.", body_style))

doc.build(story)
```

## Brand Validation Checklist

Before finalizing any document, verify:

**Visual Standards:**
- [ ] Correct brand colors used
- [ ] Approved fonts applied
- [ ] Logo properly sized and positioned
- [ ] Adequate whitespace/margins
- [ ] Consistent spacing throughout

**Typography:**
- [ ] Heading hierarchy correct
- [ ] Text sizes per guidelines
- [ ] Line height appropriate
- [ ] Font weights consistent

**Messaging:**
- [ ] Brand voice maintained
- [ ] Tone appropriate for audience
- [ ] Key messages included
- [ ] No prohibited terms used
- [ ] Proper grammar and spelling

**Layout:**
- [ ] Grid system followed
- [ ] Visual balance achieved
- [ ] Content hierarchy clear
- [ ] Responsive (if web)

## Common Brand Applications

### Business Proposal

```markdown
[Logo: Top left, primary version]

# PROPOSAL FOR [CLIENT NAME]
[Date]

---

## Executive Summary
[Brand Blue header, 24pt]

[Your value proposition in brand voice]

## Our Solution
[Consistent header styling]

[Solution details with proper spacing]

## Investment
[Clear pricing structure]

---

[Company Name]
[Tagline]
[Contact Information]
```

### Email Template

```html
<div style="font-family: Helvetica Neue, Arial, sans-serif; color: #333333;">
  <img src="logo-primary.png" alt="Company Logo" style="width: 150px; margin-bottom: 20px;">

  <h2 style="color: #0066CC; font-size: 24px; margin-bottom: 16px;">
    [Subject Line]
  </h2>

  <p style="font-size: 12px; line-height: 1.5;">
    [Your message content]
  </p>

  <hr style="border: none; border-top: 1px solid #F5F5F5; margin: 24px 0;">

  <p style="font-size: 11px; color: #666666;">
    [Name] | [Title]<br>
    [Company Name]<br>
    [Email] | [Phone]
  </p>
</div>
```

### Social Media Post

```
Visual: [Brand Blue background]
Text: [White Helvetica Neue Bold]
Logo: [Secondary/white version, bottom right]

[Your message: Max 2-3 lines]
[Tagline]
[Call to action]
```

## Advanced Features

### Brand Asset Library

Organize brand assets systematically:

```
brand-assets/
  colors/
    primary-palette.json
    secondary-palette.json
  typography/
    fonts/
      HelveticaNeue-Bold.ttf
      HelveticaNeue-Regular.ttf
    type-scale.json
  logos/
    primary/
      logo.png
      logo.svg
      logo@2x.png
    secondary/
      logo-white.png
      logo-white.svg
  templates/
    email-template.html
    proposal-template.md
    presentation-template.pptx
  guidelines/
    brand-guide.md
    usage-examples.md
```

### Automated Brand Checking

Validate documents against brand guidelines:

```python
def validate_brand_compliance(document_path, brand_guide_path):
    """Check document for brand guideline compliance."""

    issues = []

    # Check colors
    colors_used = extract_colors(document_path)
    approved_colors = load_brand_colors(brand_guide_path)

    for color in colors_used:
        if color not in approved_colors:
            issues.append(f"Unapproved color used: {color}")

    # Check fonts
    fonts_used = extract_fonts(document_path)
    approved_fonts = load_brand_fonts(brand_guide_path)

    for font in fonts_used:
        if font not in approved_fonts:
            issues.append(f"Unapproved font used: {font}")

    # Check logo usage
    if has_logo(document_path):
        logo_size = get_logo_size(document_path)
        min_size = load_min_logo_size(brand_guide_path)

        if logo_size < min_size:
            issues.append(f"Logo too small: {logo_size}px (min: {min_size}px)")

    return issues
```

### Multi-Brand Support

Support multiple brands in one system:

```
brands/
  company-a/
    brand-guide.md
    assets/
  company-b/
    brand-guide.md
    assets/
```

Usage:
```
Apply brand-a guidelines to this document.
Apply brand-b guidelines to that document.
```

## Integration with Other Skills

**Works well with:**
- **content-research-writer** - Apply branding to written content
- **pdf-processor** - Brand PDF documents
- **email-intelligence** - Brand email responses
- **brainstorming** - Ensure branded design concepts

## Quick Reference

| Document Type | Key Elements | Files Needed |
|---------------|--------------|--------------|
| Proposal | Header, colors, fonts, spacing | brand-guide.md, logo |
| Email | Signature, colors, template | email-template.html |
| Presentation | Slide master, colors, fonts | template.pptx |
| Website | CSS, colors, typography | style-guide.css |
| Social Media | Visual templates, hashtags | social-templates/ |

## Example: Complete Document Branding

**Input:** Generic proposal document

**Process:**
1. Load brand-guide.md
2. Extract color palette, typography, spacing rules
3. Apply brand header with logo
4. Format all headings per typography rules
5. Set colors according to palette
6. Apply proper spacing (margins, paragraphs, sections)
7. Add branded footer with contact info
8. Validate against guidelines

**Output:** Fully branded proposal matching company identity

## Troubleshooting

**Missing brand assets:**
- Check file paths in brand guide
- Verify asset files exist
- Use placeholders if assets unavailable

**Conflicting styles:**
- Brand guide takes precedence
- Document any exceptions
- Consult brand manager for edge cases

**Color accuracy:**
- Use hex codes from brand guide
- Test on different displays
- Ensure sufficient contrast (accessibility)

## Best Practices

**Consistency:**
- Always reference the brand guide
- Don't deviate without approval
- Apply rules uniformly across documents

**Accessibility:**
- Ensure color contrast meets WCAG standards
- Use readable font sizes (minimum 12pt)
- Provide alt text for logos/images

**Maintenance:**
- Keep brand guide updated
- Version control brand assets
- Document any custom applications

**Quality:**
- Review before finalizing
- Use validation checklist
- Get stakeholder approval for major pieces

---

*This skill provides a framework for brand application. Create your own brand-guide.md to customize it for your company's visual identity and messaging standards.*

## Getting Started

1. **Create your brand guide** using the template above
2. **Gather brand assets** (logos, fonts, colors)
3. **Organize in project** structure
4. **Test with sample** document
5. **Refine and iterate** based on results
6. **Document exceptions** and edge cases
7. **Share with team** for consistent usage

**Template starter:** See `templates/brand-guide-template.md` for a complete starting point.
