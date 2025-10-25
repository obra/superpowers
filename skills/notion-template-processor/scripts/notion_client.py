#!/usr/bin/env python3
"""
Notion MCP Integration Client
=============================

Interface with Notion MCP server for template processing and document generation.
"""

import os
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

# Note: This would typically use the actual Notion MCP SDK/Tolonews client
# For now, this is a mock implementation showing the integration pattern

@dataclass
class NotionTemplate:
    """Represents a Notion template with metadata and content."""
    template_id: str
    name: str
    database_id: str
    page_id: str
    content: Dict[str, Any]
    properties: Dict[str, Any]

@dataclass
class NotionPage:
    """Represents a filled Notion page."""
    page_id: str
    title: str
    url: str
    content_blocks: List[Dict[str, Any]]

class NotionClient:
    """Client for interacting with Notion via MCP server."""

    def __init__(self):
        """Initialize with Notion MCP configuration."""
        # In actual implementation, this would connect to the MCP server
        # For demo purposes, we'll simulate the connection
        self.connected = True
        print("✅ Connected to Notion MCP server")

    def list_templates(self, database_name: Optional[str] = None) -> List[NotionTemplate]:
        """
        List available templates from Notion databases.

        Args:
            database_name: Optional database name to search in

        Returns:
            List of available templates
        """
        print(f"🔍 Querying Notion for templates in database: {database_name or 'all'}")

        # In actual implementation, this would use:
        # result = self.mcp_client.call("API-post-database-query", {
        #     "database_id": database_id,
        #     "filter": {"property": "status", "select": {"equals": "Published"}},
        #     "filter_properties": ["template_id", "template_type"]
        # })

        # Mock result for demonstration
        mock_templates = [
            NotionTemplate(
                template_id="proposal-001",
                name="Client Proposal",
                database_id="template-db-123",
                page_id="page-456",
                content={"type": "proposal", "sections": ["intro", "scope", "pricing"]},
                properties={"status": "Published", "template_type": "proposal"}
            ),
            NotionTemplate(
                template_id="report-001",
                name="Monthly Report",
                database_id="template-db-123",
                page_id="page-789",
                content={"type": "report", "sections": ["summary", "metrics", "next_steps"]},
                properties={"status": "Published", "template_type": "report"}
            )
        ]

        print(f"✅ Found {len(mock_templates)} published templates")
        return mock_templates

    def get_template_by_name(self, name: str, database_name: Optional[str] = None) -> Optional[NotionTemplate]:
        """
        Retrieve a specific template by name.

        Args:
            name: Template name to search for
            database_name: Optional database to search in

        Returns:
            Template object if found, None otherwise
        """
        templates = self.list_templates(database_name)

        # Find exact match first, then partial match
        for template in templates:
            if template.name.lower() == name.lower():
                return template

        for template in templates:
            if name.lower() in template.name.lower():
                return template

        print(f"❌ Template not found: '{name}'")
        return None

    def get_template_content(self, template: NotionTemplate) -> Dict[str, Any]:
        """
        Retrieve the full content of a template page.

        Args:
            template: Template to retrieve content for

        Returns:
            Template content with blocks
        """
        print(f"📄 Retrieving template content for: {template.name}")

        # In actual implementation:
        # result = self.mcp_client.call("API-get-block-children", {
        #     "block_id": template.page_id
        # })

        # Mock content for demonstration
        mock_content = {
            "blocks": [
                {
                    "type": "heading_1",
                    "content": f"# {template.name} - {{client_name}}"
                },
                {
                    "type": "paragraph",
                    "content": "Project Overview: {{project_description}}"
                },
                {
                    "type": "heading_2",
                    "content": "## Client Information"
                },
                {
                    "type": "bulleted_list_item",
                    "content": "- **Company**: {{client_name}}"
                },
                {
                    "type": "bulleted_list_item",
                    "content": "- **Contact**: {{contact_email}}"
                },
                {
                    "type": "bulleted_list_item",
                    "content": "- **Budget**: {{budget}}"
                }
            ]
        }

        print(f"✅ Retrieved {len(mock_content['blocks'])} content blocks")
        return mock_content

    def create_filled_page(self, template: NotionTemplate, filled_data: Dict[str, Any],
                          page_title: str, target_database_id: Optional[str] = None) -> NotionPage:
        """
        Create a new page with filled template data.

        Args:
            template: Source template
            filled_data: Dictionary of field replacements
            page_title: Title for the new page
            target_database_id: Database to create page in (defaults to template's database)

        Returns:
            Created page object
        """
        print(f"📝 Creating filled page: '{page_title}'")

        # Get target database
        db_id = target_database_id or template.database_id

        # In actual implementation:
        # page_result = self.mcp_client.call("API-post-page", {
        #     "parent": {"database_id": db_id},
        #     "properties": {
        #         "title": [{"text": {"content": page_title}}]
        #     },
        #     "children": filled_blocks
        # })

        # Generate mock page for demonstration
        page_id = f"page-{hash(page_title + str(filled_data)) % 10000:04d}"
        page_url = f"https://notion.so/workspace/{page_id}"

        # Simulate filled blocks based on mock template
        filled_blocks = [
            {
                "type": "heading_1",
                "content": f"# {template.name} - {filled_data.get('client_name', 'Unknown Client')}"
            },
            {
                "type": "paragraph",
                "content": filled_data.get('project_description', 'Project description goes here.')
            },
            {
                "type": "heading_2",
                "content": "## Client Information"
            },
            {
                "type": "bulleted_list_item",
                "content": f"- **Company**: {filled_data.get('client_name', 'N/A')}"
            },
            {
                "type": "bulleted_list_item",
                "content": f"- **Contact**: {filled_data.get('contact_email', 'N/A')}"
            },
            {
                "type": "bulleted_list_item",
                "content": f"- **Budget**: {filled_data.get('budget', 'N/A')}"
            }
        ]

        created_page = NotionPage(
            page_id=page_id,
            title=page_title,
            url=page_url,
            content_blocks=filled_blocks
        )

        print(f"✅ Created page at: {page_url}")
        return created_page

    def export_page_as_html(self, page: NotionPage) -> str:
        """
        Export a Notion page as HTML for email delivery.

        Args:
            page: Page to export

        Returns:
            HTML formatted content
        """
        print(f"📤 Exporting page as HTML: {page.title}")

        html_parts = [
            "<!DOCTYPE html>",
            "<html><head><meta charset='utf-8'><title>{page.title}</title></head>",
            "<body>",
            f"<h1>{page.title}</h1>"
        ]

        for block in page.content_blocks:
            block_type = block.get('type', 'paragraph')
            content = block.get('content', '')

            if block_type == 'heading_1':
                html_parts.append(f"<h1>{content.replace('# ', '')}</h1>")
            elif block_type == 'heading_2':
                html_parts.append(f"<h2>{content.replace('## ', '')}</h2>")
            elif block_type == 'paragraph':
                html_parts.append(f"<p>{content}</p>")
            elif block_type == 'bulleted_list_item':
                html_parts.append(f"<li>{content.replace('- ', '')}</li>")

        html_parts.extend(["</body>", "</html>"])

        html_content = "\n".join(html_parts)
        print(f"✅ Generated HTML ({len(html_content)} characters)")
        return html_content

    def export_page_as_markdown(self, page: NotionPage) -> str:
        """
        Export a Notion page as Markdown.

        Args:
            page: Page to export

        Returns:
            Markdown formatted content
        """
        print(f"📤 Exporting page as Markdown: {page.title}")

        md_parts = [f"# {page.title}", ""]

        for block in page.content_blocks:
            content = block.get('content', '')
            md_parts.append(content)

        markdown_content = "\n\n".join(md_parts)
        print("✅ Generated Markdown")
        return markdown_content

    def close(self):
        """Close connection to Notion MCP server."""
        self.connected = False
        print("🔌 Disconnected from Notion MCP server")


# Utility functions for the skill
def parse_template_placeholders(content: str) -> List[str]:
    """
    Extract placeholder names from content.

    Args:
        content: Content string with {{placeholder}} syntax

    Returns:
        List of placeholder names found
    """
    import re
    placeholders = re.findall(r'\{\{([^}]+)\}\}', content)
    return list(set(placeholders))  # Remove duplicates


def fill_template_content(content: str, data: Dict[str, Any]) -> str:
    """
    Fill template placeholders with data.

    Args:
        content: Template content with placeholders
        data: Dictionary of replacement values

    Returns:
        Filled content
    """
    result = content
    for key, value in data.items():
        placeholder = "{{" + key + "}}"
        result = result.replace(placeholder, str(value))

    return result


def validate_template_data(template_content: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate that required template data is provided.

    Args:
        template_content: Template content to analyze
        data: Provided data dictionary

    Returns:
        Dictionary with validation results
    """
    # Extract all content as a single string for placeholder analysis
    content_blocks = template_content.get('blocks', [])
    all_content = ' '.join(block.get('content', '') for block in content_blocks)

    required_placeholders = parse_template_placeholders(all_content)
    provided_keys = set(data.keys())

    missing = [p for p in required_placeholders if p not in provided_keys]
    extra = [k for k in provided_keys if k not in required_placeholders]

    return {
        'valid': len(missing) == 0,
        'missing': missing,
        'extra': extra,
        'provided': list(provided_keys),
        'required': required_placeholders
    }


if __name__ == "__main__":
    # Example usage and testing
    client = NotionClient()

    try:
        # List templates
        templates = client.list_templates()
        print(f"Available templates: {[t.name for t in templates]}")

        # Get specific template
        template = client.get_template_by_name("Client Proposal")
        if template:
            print(f"Found template: {template.name}")

            # Get template content
            content = client.get_template_content(template)
            print(f"Template has {len(content.get('blocks', []))} blocks")

            # Example data
            sample_data = {
                "client_name": "Acme Corporation",
                "contact_email": "john@acme.com",
                "budget": "$50,000",
                "project_description": "Website redesign project for Q4 2025"
            }

            # Validate data
            validation = validate_template_data(content, sample_data)
            print(f"Data validation: {validation}")

            if validation['valid']:
                # Create filled page
                filled_page = client.create_filled_page(
                    template,
                    sample_data,
                    f"Proposal for {sample_data['client_name']}"
                )

                # Export as HTML
                html_content = client.export_page_as_html(filled_page)
                print(f"HTML preview: {html_content[:200]}...")

    finally:
        client.close()
