---
name: Notion Template Processor
description: Fills Notion database templates with data and delivers via email using Notion MCP integration
allowed-tools:
  - MCP
  - API
  - Bash
---

# Notion Template Processor

This skill enables automated template processing using Notion databases and delivery via email. It leverages the Notion MCP server for seamless integration with Notion workspaces, allowing you to fill templates with data and send the results via email.

## When to Use This Skill

Activate this skill when you need to:
- Fill out templates stored in Notion databases
- Automate document generation from structured data
- Send templated content via email
- Process client proposals, reports, or form responses
- Generate personalized communications from database records

## Capabilities

### Template Processing
- **Database Query**: Search and retrieve templates from Notion databases
- **Dynamic Filling**: Replace placeholders with data (manual input or from other sources)
- **Conditional Logic**: Show/hide sections based on data values
- **Multi-part Templates**: Handle complex documents with multiple sections

### Notion Integration (MCP)
- **Database Operations**: Query, filter, and update Notion databases
- **Page Management**: Create, read, update, and archive pages
- **Content Blocks**: Manipulate text, lists, tables, and rich content
- **Property Management**: Handle all Notion property types (text, number, date, select, etc.)

### Email Delivery
- **SMTP Integration**: Send via any SMTP server
- **Rich HTML**: Convert Notion content to formatted HTML emails
- **Attachment Support**: Include PDFs, documents, or additional files
- **Template Rendering**: Send rendered templates or raw content

### Data Sources
- **Manual Input**: Accept data directly in conversation
- **API Integration**: Pull data from external services
- **Database Lookup**: Retrieve information from other Notion databases
- **File Parsing**: Extract data from uploaded documents

## How to Use

### Basic Template Filling
```
Use the notion-template-processor skill to fill the "Client Proposal" template
in my Notion workspace with:
- Client Name: Acme Corp
- Project Scope: Website redesign
- Budget: $50,000
- Timeline: 3 months

Then email the filled template to john@acmecorp.com with subject "Acme Corp Proposal"
```

### Advanced Workflow
```
Query my Notion CRM database for clients where status = "Qualified".
For each client, fill out the "Project Proposal" template using their company
information, attach relevant case studies from Notion, and email it from my
sales account with personalized subject lines.
```

### Template Creation
```
Create a new template page in my "Templates" Notion database called "Meeting Summary"
with placeholders for:
- Meeting Date
- Attendees
- Key Decisions
- Action Items
- Next Steps

Save it for future use with the notion-template-processor skill.
```

## Template Format

### Required Template Structure
Each template page in Notion must have:

**Required Properties:**
- `template_id`: Unique identifier for the template
- `template_type`: Type of template (proposal, report, email, etc.)
- `status`: Must be "Published" to be available

**Content Structure:**
- Use `{{placeholder_name}}` syntax for dynamic content
- Include sections marked with `{% if condition %}` for conditional logic
- Use standard Notion blocks (paragraphs, headings, lists, tables)

### Example Template Content:
```
# Project Proposal - {{client_name}}

## Client Information
- **Company**: {{client_name}}
- **Contact**: {{contact_email}}
- **Budget**: {{budget}}

## Project Overview
{{project_description}}

{% if has_attachments %}
## Attachments
{{attachments_list}}
{% endif %}

## Next Steps
{{next_steps}}
```

## Input Format

### Template Selection
- **By Name**: "Use the 'Client Proposal' template"
- **By Database**: "From my 'Templates' database, use template_id 'proposal-001'"
- **By Page URL**: "Use the template at https://notion.so/page/..."

### Data Input Methods
- **Structured**: Key-value pairs (Name: Value)
- **JSON**: Complete data objects
- **YAML**: For complex hierarchical data
- **From Database**: Reference other Notion databases

### Email Configuration
- **Recipient**: Single email or list
- **Subject**: Template with placeholders
- **Sender**: Authenticated account
- **Attachments**: File references or generated content

## Output Format

### Success Response
```
✅ Template filled successfully!
📧 Email sent to john@company.com
🔗 Link to generated page: https://notion.so/generated-page-id
📎 Attachments: proposal.pdf, case-study.pdf
```

### Error Handling
```
❌ Template not found: "Client Proposal"
💡 Try: "List available templates in my workspace"

❌ Missing required data: client_name
💡 Required fields: client_name, budget, timeline
```

## Email Integration

### Supported Methods
- **SMTP**: Direct server connection
- **API Services**: SendGrid, Mailgun, Amazon SES
- **OAuth**: Gmail, Outlook integration

### Email Templates
Convert Notion content to:
- **Plain Text**: Simple text emails
- **HTML**: Rich formatted emails
- **Markdown**: GitHub-style formatting
- **PDF**: Attached document generation

### Delivery Options
- **Immediate**: Send right after filling
- **Scheduled**: Queue for later delivery
- **Batch**: Send multiple emails in sequence
- **Conditional**: Send only with certain data values

## Integration with Other Skills

This skill composes well with:
- **Database skills**: For data source integration
- **Document skills**: For attachment generation
- **API skills**: For external data fetching
- **Formatting skills**: For content preprocessing

## Example Workflows

### Sales Proposal Automation
1. Lead qualified in CRM database
2. Pull client data from Notion
3. Fill proposal template
4. Attach case studies from Notion
5. Email personalized proposal

### Report Generation
1. Query project metrics from database
2. Fill monthly report template
3. Convert to PDF format
4. Email to stakeholders with charts

### Client Onboarding
1. New client form submitted
2. Fill welcome template
3. Attach company documents
4. Send personalized onboarding email

## Security & Permissions

### Notion Access
- **Workspace Access**: Requires integration token with read/write permissions
- **Database Access**: Specific database-level permissions
- **Page Permissions**: Respects Notion's sharing settings

### Email Security
- **SMTP Encryption**: TLS/SSL support
- **API Security**: Secure token storage
- **Privacy**: No data logging or retention
- **Consent**: Only send emails with user approval

## Best Practices

### Template Design
- Use clear placeholder naming convention
- Include validation rules in templates
- Test templates with sample data first
- Version control template changes

### Workflow Planning
- Test complete end-to-end process before production use
- Set up error handling for missing templates/data
- Monitor email delivery success rates
- Keep templates updated with current needs

### Performance
- Cache frequently used templates
- Batch process multiple emails when possible
- Use database indexes for template queries
- Monitor API rate limits

## Limitations

### Notion MCP Constraints
- Requires active Notion integration token
- Limited by Notion API rate limits
- Some advanced formatting may not translate perfectly

### Email Constraints
- SMTP server limitations (daily/hourly limits)
- Attachment size restrictions
- Recipient authentication requirements

### Template Constraints
- Complex conditional logic limited by MCP capabilities
- Rich media rendering depends on export options
- Real-time collaboration features not supported

## Troubleshooting

### Template Not Found
```bash
# Check available templates
curl -X POST https://notion-api-endpoint/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "template"}'
```

### Email Delivery Issues
- Verify SMTP server configuration
- Check sender authentication
- Review spam filters for content
- Confirm recipient validity

### Permission Errors
- Refresh Notion integration token
- Verify database sharing permissions
- Check workspace access levels

## Getting Started

1. **Setup Notion Integration**
   - Create integration at https://developers.notion.com
   - Generate API token
   - Share target databases with integration

2. **Create Template Database**
   - Create Notion database for templates
   - Add required properties (template_id, status, etc.)
   - Populate with template pages

3. **Configure Email Settings**
   - Choose delivery method (SMTP/API/OAuth)
   - Store credentials securely
   - Test connection with sample email

4. **Test the Skill**
   ```
   Hey Claude, use the notion-template-processor to fill a test template
   and send it to my email address for verification.
   ```

This skill provides a complete solution for template processing and automated email delivery using Notion's powerful database and content management capabilities.
