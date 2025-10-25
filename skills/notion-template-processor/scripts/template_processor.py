#!/usr/bin/env python3
"""
Template Processor
==================

Handles template filling, placeholder replacement, and conditional logic processing.
"""

import re
import json
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

from .notion_client import (
    NotionClient, NotionTemplate, NotionPage,
    fill_template_content, parse_template_placeholders,
    validate_template_data
)

@dataclass
class TemplateField:
    """Represents a template field with metadata."""
    name: str
    required: bool
    default_value: Optional[str] = None
    validation_pattern: Optional[str] = None
    display_name: Optional[str] = None

@dataclass
class FillRequest:
    """Represents a template filling request."""
    template_name: str
    data: Dict[str, Any]
    page_title: Optional[str] = None
    target_database: Optional[str] = None
    conditional_flags: Optional[Dict[str, bool]] = None

@dataclass
class FillResult:
    """Result of a template filling operation."""
    success: bool
    page: Optional[NotionPage] = None
    validation_errors: Optional[List[str]] = None
    missing_fields: Optional[List[str]] = None
    warnings: Optional[List[str]] = None

class TemplateProcessor:
    """Processes template filling requests with validation and conditional logic."""

    def __init__(self):
        """Initialize with Notion MCP client."""
        self.notion_client = NotionClient()
        self.templates_cache = {}  # Cache for frequently used templates

    def process_fill_request(self, request: FillRequest) -> FillResult:
        """
        Process a complete template filling request.

        Args:
            request: FillRequest object with template name and data

        Returns:
            FillResult indicating success/failure and results
        """
        print(f"🔄 Processing template fill request: {request.template_name}")

        try:
            # Step 1: Find the template
            template = self.notion_client.get_template_by_name(request.template_name)
            if not template:
                return FillResult(
                    success=False,
                    validation_errors=[f"Template '{request.template_name}' not found"]
                )

            # Step 2: Get template content
            template_content = self.notion_client.get_template_content(template)

            # Step 3: Validate data
            validation = validate_template_data(template_content, request.data)
            if not validation['valid']:
                return FillResult(
                    success=False,
                    missing_fields=validation['missing'],
                    warnings=[f"Extra fields provided: {validation['extra']}"]
                )

            # Step 4: Apply conditional logic if specified
            processed_content = self.apply_conditional_logic(
                template_content, request.conditional_flags or {}
            )

            # Step 5: Fill template with data
            filled_content = self.fill_template_blocks(processed_content, request.data)

            # Step 6: Generate page title
            page_title = request.page_title
            if not page_title:
                page_title = self.generate_page_title(template, request.data)

            # Step 7: Create filled page in Notion
            filled_page = self.notion_client.create_filled_page(
                template, request.data, page_title, request.target_database
            )

            print("✅ Template processing completed successfully")
            return FillResult(success=True, page=filled_page)

        except Exception as e:
            print(f"❌ Template processing failed: {e}")
            return FillResult(
                success=False,
                validation_errors=[f"Processing error: {str(e)}"]
            )

    def apply_conditional_logic(self, template_content: Dict[str, Any],
                               flags: Dict[str, bool]) -> Dict[str, Any]:
        """
        Apply conditional logic to template content.

        Args:
            template_content: Template content dictionary
            flags: Dictionary of boolean flags for conditional logic

        Returns:
            Processed content with conditionals applied
        """
        processed_blocks = []

        for block in template_content.get('blocks', []):
            content = block.get('content', '')

            # Check for {% if condition %} logic
            if_content = self.extract_conditional_block(content, flags)
            if if_content is not None:
                # Conditional block found and condition met
                if if_content.strip():  # Only add non-empty content
                    processed_blocks.append({
                        'type': block['type'],
                        'content': if_content
                    })
            else:
                # Regular block or condition not met - skip
                processed_blocks.append(block)

        return {
            'blocks': processed_blocks,
            'metadata': template_content.get('metadata', {})
        }

    def extract_conditional_block(self, content: str, flags: Dict[str, bool]) -> Optional[str]:
        """
        Extract content from conditional blocks.

        Args:
            content: Content string that may contain conditional logic
            flags: Dictionary of boolean flags

        Returns:
            Processed content if condition met, None if condition not met or invalid
        """
        # Look for {% if variable %}content{% endif %} patterns
        conditional_pattern = r'\{%\s*if\s+(\w+)\s*%\}([^%]*)\{%\s*endif\s*%\}'

        match = re.search(conditional_pattern, content)
        if match:
            variable_name, block_content = match.groups()
            condition_value = flags.get(variable_name, False)

            if condition_value:
                # Remove the conditional wrapper and return the content
                cleaned_content = re.sub(conditional_pattern, r'\2', content)
                return cleaned_content
            else:
                # Condition not met, return None to skip this block
                return None

        # No conditional logic found
        return content

    def fill_template_blocks(self, template_content: Dict[str, Any],
                           data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fill all template blocks with provided data.

        Args:
            template_content: Template content with placeholder blocks
            data: Dictionary of replacement data

        Returns:
            Content with placeholders replaced
        """
        filled_blocks = []

        for block in template_content.get('blocks', []):
            content = block.get('content', '')

            # Fill placeholders in content
            filled_content = fill_template_content(content, data)

            filled_blocks.append({
                'type': block['type'],
                'content': filled_content
            })

        return {
            'blocks': filled_blocks,
            'metadata': template_content.get('metadata', {})
        }

    def generate_page_title(self, template: NotionTemplate, data: Dict[str, Any]) -> str:
        """
        Generate a meaningful page title from template and data.

        Args:
            template: Source template
            data: Filling data

        Returns:
            Generated page title
        """
        # Try to use a logical title pattern
        if 'client_name' in data and 'project' in template.name.lower():
            return f"{template.name} - {data['client_name']}"

        if 'title' in data:
            return data['title']

        # Fallback to template name with timestamp/data
        import datetime
        today = datetime.date.today().strftime("%Y-%m-%d")
        return f"{template.name} - {today}"

    def validate_data_types(self, template_content: Dict[str, Any],
                          data: Dict[str, Any]) -> List[str]:
        """
        Validate data types against expected template requirements.

        Args:
            template_content: Template content with type hints
            data: Provided data dictionary

        Returns:
            List of validation error messages
        """
        errors = []

        # Basic validation - could be enhanced with type hints in template
        required_placeholders = set()
        for block in template_content.get('blocks', []):
            content = block.get('content', '')
            placeholders = parse_template_placeholders(content)
            required_placeholders.update(placeholders)

        for placeholder in required_placeholders:
            if placeholder not in data:
                errors.append(f"Missing required field: {placeholder}")
            elif data[placeholder] is None or str(data[placeholder]).strip() == '':
                errors.append(f"Empty required field: {placeholder}")

        return errors

    def extract_template_schema(self, template_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract schema information from template content.

        Args:
            template_content: Template content to analyze

        Returns:
            Schema dictionary with field requirements and types
        """
        schema = {
            'required_fields': parse_template_placeholders(
                ' '.join(block.get('content', '') for block in template_content.get('blocks', []))
            ),
            'conditional_fields': [],
            'validation_rules': {}
        }

        # Scan for conditional fields
        for block in template_content.get('blocks', []):
            content = block.get('content', '')
            if re.search(r'\{%\s*if\s+\w+\s*%\}', content):
                # Extract conditional variables
                conditionals = re.findall(r'\{%\s*if\s+(\w+)\s*%\}', content)
                schema['conditional_fields'].extend(conditionals)

        # Remove duplicates
        schema['conditional_fields'] = list(set(schema['conditional_fields']))

        return schema

    def create_sample_data(self, template_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate sample data for testing template filling.

        Args:
            template_content: Template content to generate sample for

        Returns:
            Dictionary with sample field values
        """
        import random

        sample_data = {}

        placeholders = parse_template_placeholders(
            ' '.join(block.get('content', '') for block in template_content.get('blocks', []))
        )

        sample_values = {
            'client_name': ['Acme Corp', 'TechStart Inc', 'Global Solutions LLC'][random.randrange(3)],
            'contact_email': ['john@company.com', 'sarah@business.org', 'mike@startup.io'][random.randrange(3)],
            'budget': ['$25,000', '$50,000', '$100,000'][random.randrange(3)],
            'project_description': 'Website redesign and modernization project',
            'timeline': '3 months',
            'project_scope': 'Complete digital transformation including branding and development',
            'title': 'Sample Document Title',
            'date': '2025-01-15',
            'company_address': '123 Business St, City, State 12345',
            'phone': '(555) 123-4567'
        }

        for placeholder in placeholders:
            if placeholder in sample_values:
                sample_data[placeholder] = sample_values[placeholder]
            else:
                # Generate generic sample for unknown placeholders
                sample_data[placeholder] = f"Sample {placeholder.replace('_', ' ').title()}"

        return sample_data

    def export_filled_template(self, fill_result: FillResult,
                             format_type: str = 'html') -> Optional[str]:
        """
        Export a filled template in requested format.

        Args:
            fill_result: Result from template filling
            format_type: Export format ('html', 'markdown', 'pdf')

        Returns:
            Exported content string or None if failed
        """
        if not fill_result.success or not fill_result.page:
            return None

        if format_type.lower() == 'html':
            return self.notion_client.export_page_as_html(fill_result.page)
        elif format_type.lower() == 'markdown':
            return self.notion_client.export_page_as_markdown(fill_result.page)
        else:
            print(f"⚠️ Unsupported export format: {format_type}")
            return None

    def close(self):
        """Clean up resources."""
        self.notion_client.close()
        self.templates_cache.clear()


def process_template_request(template_name: str, data: Dict[str, Any], **kwargs) -> FillResult:
    """
    Convenience function for processing template requests.

    Args:
        template_name: Name of template to use
        data: Dictionary of field data
        **kwargs: Additional options (page_title, target_database, conditional_flags)

    Returns:
        FillResult object
    """
    request = FillRequest(
        template_name=template_name,
        data=data,
        page_title=kwargs.get('page_title'),
        target_database=kwargs.get('target_database'),
        conditional_flags=kwargs.get('conditional_flags', {})
    )

    processor = TemplateProcessor()
    try:
        result = processor.process_fill_request(request)
        return result
    finally:
        processor.close()


if __name__ == "__main__":
    # Example usage and testing
    print("🧪 Testing Template Processor...")

    # Sample request
    request = FillRequest(
        template_name="Client Proposal",
        data={
            "client_name": "TechCorp Inc",
            "contact_email": "jane@techcorp.com",
            "budget": "$75,000",
            "project_description": "Mobile app development for Q1 2025"
        },
        page_title="Custom Proposal Title"
    )

    processor = TemplateProcessor()
    try:
        result = processor.process_fill_request(request)

        if result.success and result.page:
            print("✅ Template processed successfully!")
            print(f"📄 Page created: {result.page.title}")
            print(f"🔗 URL: {result.page.url}")

            # Export as HTML
            html_content = processor.export_filled_template(result, 'html')
            if html_content:
                print(f"📤 Exported HTML ({len(html_content)} chars)")
            else:
                print("⚠️ HTML export failed")
        else:
            print("❌ Template processing failed:")
            if result.validation_errors:
                print(f"Errors: {result.validation_errors}")
            if result.missing_fields:
                print(f"Missing: {result.missing_fields}")

    finally:
        processor.close()

    print("🏁 Test completed!")
