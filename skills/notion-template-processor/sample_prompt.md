# Sample Prompts for Notion Template Processor

## Quick Start
"Hey Claude—I just added the "notion-template-processor" skill. Can you help me set up automated template filling and email delivery?"

## Specific Use Cases

### Basic Template Filling & Email
"Use the notion-template-processor skill to fill the 'Client Proposal' template with:
- Client Name: Acme Corporation
- Project Scope: Website redesign
- Budget: $50,000
- Timeline: 3 months
Then email the filled template to john@acmecorp.com with subject 'Acme Corp Proposal'"

### Template Setup & Creation
"Using the notion-template-processor skill, create a new template page in my 'Templates' database called 'Meeting Summary' with placeholders for:
- Meeting Date
- Attendees
- Key Decisions
- Action Items
- Next Steps"

### Advanced Workflow
"Query my Notion CRM database for clients where status = 'Qualified'. For each client, fill out the 'Project Proposal' template using their company information from the database, attach relevant case studies from Notion, and email it from my sales account with personalized subject lines."

### Batch Processing
"Find all templates in my Notion 'Templates' database and show me their required fields. Then process the 'Monthly Report' template with data from the past month's metrics and email to stakeholders@example.com"

## Tips for Best Results
- Always specify template name or database ID
- Include all required placeholder data
- Use clear project/client names for page titles
- Mention specific subject lines for emails
- Specify conditional flags when templates have optional sections
- Save templates in dedicated databases for easy discovery

## Email Configuration Tips
- Set SMTP credentials in environment variables
- Use HTML templates for rich formatting
- Include clear subject lines with placeholders
- Test email delivery with sample templates first
- Consider BCC for record-keeping

## Template Design Best Practices
- Use `{{placeholder_name}}` syntax for dynamic content
- Add `{% if condition %}` logic for optional sections
- Create databases named "Templates" for organization
- Include clear instructions in template descriptions
- Use consistent naming conventions for placeholders
