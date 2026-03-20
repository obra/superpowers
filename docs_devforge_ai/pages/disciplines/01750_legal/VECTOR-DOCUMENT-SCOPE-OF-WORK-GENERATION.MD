## 7. Magic Wand AI Generation System

### Location and Implementation
**Primary File**: `client/src/pages/01900-procurement/components/modals/01900-ScopeOfWorkModal.js` (line ~1755)
**AI Service**: `client/src/services/scopeOfWorkGenerationService.js`

### How the Magic Wand Works
1. **Button Component**: Bootstrap button with Wand2 icon from Lucide React library
2. **Trigger Mechanism**: Calls `onGenerate` function passing AI context to generation service
3. **Template Processing**: Uses `_buildGenerationPrompt()` method to construct category-specific prompts
4. **AI Integration**: Supports OpenAI GPT-4o-mini (default) and Anthropic Claude models
5. **Content Processing**: Parses AI response into structured SOW sections

### Template Structure Overview
The AI prompt template dynamically adapts based on:
- **User input**: Title, description, category, requirements
- **Category context**: Best practices and industry standards
- **Compliance requirements**: Regional regulations and standards
- **Additional context**: Reference documents, URLs, project specifications

### Enhanced Workflow (Updated)

1. User opens procurement dashboard
2. Navigates to "Scope Management" section
3. Creates new entry via floating action button
4. Selects country context from dropdown (ZA/GN/SA)
5. Selects category from hierarchical options
6. Completes AI-assisted form:
   - Baseline content entry with country-specific templates
   - Enhanced Description workflow:
     1. 🚀 **Activate "Magic Wand" button** (AI-powered generation)
     2. Review AI-generated comprehensive content
     3. Apply selected enhancements or regenerate
     - Magic wand analyzes category context and generates industry-specific content
     - Includes category-appropriate deliverables, contractual terms, and compliance requirements
     - Provides structured sections with industry best practices
7. Final validation with enhanced regional compliance
8. Submits for approval (triggers PostgreSQL hooks)

### Magic Wand Template Categories

The AI generation system uses different templates based on procurement categories:

#### **Industrial Equipment (Category B)**
- **AI Focus**: Certifications, maintenance, safety specifications
- **Template Includes**: Equipment specs, certifications, safety ratings, maintenance procedures
- **Contractual Emphasis**: Performance warranties, training requirements, spare parts agreements

#### **Industrial Supplies & Lubricants (Category C06)**
- **AI Focus**: Product grades, quality certifications, storage conditions
- **Template Includes**: Product specifications, quantity forecasting, delivery schedules
- **Special Features**: Lubricant-specific requirements, maintenance intervals, training procedures

#### **Engineering & Professional Services (Categories J, K, L, M)**
- **AI Focus**: Qualifications, certifications, regulatory compliance
- **Template Includes**: Professional accreditations, performance clauses, quality standards
- **Contractual Emphasis**: Liability clauses, escalation procedures, change management

#### **Energy, Fuel & Fluid Systems (Category A)**
- **AI Focus**: Safety considerations, environmental compliance
- **Template Includes**: Emergency procedures, safety certifications, environmental standards
- **Regulatory Focus**: Energy efficiency, emissions compliance, safety ratings

#### **Real Estate & Facility Management (Category E)**
- **AI Focus**: Occupancy regulations, environmental compliance
- **Template Includes**: Transfer procedures, insurance coverage, building standards
- **Contractual Emphasis**: Property rights, access agreements, lease considerations

#### **Construction Materials (Categories G, H, D)**
- **AI Focus**: Material standards, inspection requirements
- **Template Includes**: Safety ratings, certification procedures, warranty terms
- **Technical Emphasis**: Design specifications, quality control, safety integration

### AI Template Customization

**Template Methods** (in `scopeOfWorkGenerationService.js`):
- `_getCategorySpecificGuidelines()` - Category-specific content guidelines
- `_getCategoryDeliverables()` - Deliverables based on procurement type
- `_getCategoryContractualConsiderations()` - Contract terms and conditions
- `_getTechnicalRequirementsFormatted()` - Technical specifications
- `_getIndustryBestPracticesFormatted()` - Industry best practice integration

### SOW Prompt System Analysis

Based on comprehensive code analysis, the magic wand button **does not use Supabase prompts from a prompts table**. Instead:

#### **🎯 Magic Wand Uses Code-Built Prompts**
The magic wand generates its prompts dynamically using code-defined templates rather than database-stored prompts:

1. **Template Location**: `client/src/services/scopeOfWorkGenerationService.js`
   - Method: `_buildGenerationPrompt()` (constructs prompts programmatically)
   - Methods: `_getCategorySpecificGuidelines()`, `_getCategoryDeliverables()`, etc.

2. **Dynamic Template Construction**:
   - Templates are generated at runtime based on user input and category selection
   - Category-specific content from: `_getCategorySpecificGuidelines()`
   - Industry standards from: `_getCategoryBestPracticesFormatted()`
   - Content adapted based on category codes (A, B, C, E, J, K, L, M, etc.)

3. **No Database Dependency**:
   - Prompts are not pulled from `prompts` table
   - No SQL queries for prompt retrieval in magic wand flow
   - Templates built programmatically using JavaScript methods

#### **Provider Configuration**
- **Default**: OpenAI GPT-4o-mini
- **Alternative**: Anthropic Claude (requires configuration)
- **Fallback**: Error handling with user-friendly messages
- **Token Limits**: 4K tokens for generation, automatic content splitting if needed

#### **Database `prompts` Table Usage**
The Supabase `prompts` table exists but is used for **different purposes**:
- `contracts_correspondence_agent` - Email/agent communication prompts
- `contracts_drawing_comparison_default` - Drawing analysis prompts
- **No SOW-related prompts** in the prompts table for magic wand functionality

### Enhanced Context Integration
Magic wand considers:
- **User-provided documents**: Automatic content analysis
- **Reference URLs**: Integration of external specifications
- **Project requirements**: Custom business context and constraints
- **Compliance framework**: Regional and industry-specific regulations
- **Historical data**: Previous similar project outcomes and lessons learned
