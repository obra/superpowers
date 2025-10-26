#!/usr/bin/env python3
"""
Utilities for editing OOXML documents.

This module provides XMLEditor, a tool for manipulating XML files with support for
line-number-based node finding and DOM manipulation. Each element is automatically
annotated with its original line and column position during parsing.

Example usage:
    editor = XMLEditor("document.xml")

    # Find node by line number or range
    elem = editor.get_node(tag="w:r", line_number=519)
    elem = editor.get_node(tag="w:p", line_number=range(100, 200))

    # Find node by text content
    elem = editor.get_node(tag="w:p", contains="specific text")

    # Find node by attributes
    elem = editor.get_node(tag="w:r", attrs={"w:id": "target"})

    # Combine filters
    elem = editor.get_node(tag="w:p", line_number=range(1, 50), contains="text")

    # Replace, insert, or manipulate
    new_elem = editor.replace_node(elem, "<w:r><w:t>new text</w:t></w:r>")
    editor.insert_after(new_elem, "<w:r><w:t>more</w:t></w:r>")

    # Save changes
    editor.save()
"""

import html
from pathlib import Path
from typing import Optional, Union

import defusedxml.minidom
import defusedxml.sax


class XMLEditor:
    """
    Editor for manipulating OOXML XML files with line-number-based node finding.

    This class parses XML files and tracks the original line and column position
    of each element. This enables finding nodes by their line number in the original
    file, which is useful when working with Read tool output.

    Attributes:
        xml_path: Path to the XML file being edited
        encoding: Detected encoding of the XML file ('ascii' or 'utf-8')
        dom: Parsed DOM tree with parse_position attributes on elements
    """

    def __init__(self, xml_path):
        """
        Initialize with path to XML file and parse with line number tracking.

        Args:
            xml_path: Path to XML file to edit (str or Path)

        Raises:
            ValueError: If the XML file does not exist
        """
        self.xml_path = Path(xml_path)
        if not self.xml_path.exists():
            raise ValueError(f"XML file not found: {xml_path}")

        with open(self.xml_path, "rb") as f:
            header = f.read(200).decode("utf-8", errors="ignore")
        self.encoding = "ascii" if 'encoding="ascii"' in header else "utf-8"

        parser = _create_line_tracking_parser()
        self.dom = defusedxml.minidom.parse(str(self.xml_path), parser)

    def get_node(
        self,
        tag: str,
        attrs: Optional[dict[str, str]] = None,
        line_number: Optional[Union[int, range]] = None,
        contains: Optional[str] = None,
    ):
        """
        Get a DOM element by tag and identifier.

        Finds an element by either its line number in the original file or by
        matching attribute values. Exactly one match must be found.

        Args:
            tag: The XML tag name (e.g., "w:del", "w:ins", "w:r")
            attrs: Dictionary of attribute name-value pairs to match (e.g., {"w:id": "1"})
            line_number: Line number (int) or line range (range) in original XML file (1-indexed)
            contains: Text string that must appear in any text node within the element.
                      Supports both entity notation (&#8220;) and Unicode characters (\u201c).

        Returns:
            defusedxml.minidom.Element: The matching DOM element

        Raises:
            ValueError: If node not found or multiple matches found

        Example:
            elem = editor.get_node(tag="w:r", line_number=519)
            elem = editor.get_node(tag="w:r", line_number=range(100, 200))
            elem = editor.get_node(tag="w:del", attrs={"w:id": "1"})
            elem = editor.get_node(tag="w:p", attrs={"w14:paraId": "12345678"})
            elem = editor.get_node(tag="w:commentRangeStart", attrs={"w:id": "0"})
            elem = editor.get_node(tag="w:p", contains="specific text")
            elem = editor.get_node(tag="w:t", contains="&#8220;Agreement")  # Entity notation
            elem = editor.get_node(tag="w:t", contains="\u201cAgreement")   # Unicode character
        """
        matches = []
        for elem in self.dom.getElementsByTagName(tag):
            # Check line_number filter
            if line_number is not None:
                parse_pos = getattr(elem, "parse_position", (None,))
                elem_line = parse_pos[0]

                # Handle both single line number and range
                if isinstance(line_number, range):
                    if elem_line not in line_number:
                        continue
                else:
                    if elem_line != line_number:
                        continue

            # Check attrs filter
            if attrs is not None:
                if not all(
                    elem.getAttribute(attr_name) == attr_value
                    for attr_name, attr_value in attrs.items()
                ):
                    continue

            # Check contains filter
            if contains is not None:
                elem_text = self._get_element_text(elem)
                # Normalize the search string: convert HTML entities to Unicode characters
                # This allows searching for both "&#8220;Rowan" and ""Rowan"
                normalized_contains = html.unescape(contains)
                if normalized_contains not in elem_text:
                    continue

            # If all applicable filters passed, this is a match
            matches.append(elem)

        if not matches:
            # Build descriptive error message
            filters = []
            if line_number is not None:
                line_str = (
                    f"lines {line_number.start}-{line_number.stop - 1}"
                    if isinstance(line_number, range)
                    else f"line {line_number}"
                )
                filters.append(f"at {line_str}")
            if attrs is not None:
                filters.append(f"with attributes {attrs}")
            if contains is not None:
                filters.append(f"containing '{contains}'")

            filter_desc = " ".join(filters) if filters else ""
            base_msg = f"Node not found: <{tag}> {filter_desc}".strip()

            # Add helpful hint based on filters used
            if contains:
                hint = "Text may be split across elements or use different wording."
            elif line_number:
                hint = "Line numbers may have changed if document was modified."
            elif attrs:
                hint = "Verify attribute values are correct."
            else:
                hint = "Try adding filters (attrs, line_number, or contains)."

            raise ValueError(f"{base_msg}. {hint}")
        if len(matches) > 1:
            raise ValueError(
                f"Multiple nodes found: <{tag}>. "
                f"Add more filters (attrs, line_number, or contains) to narrow the search."
            )
        return matches[0]

    def _get_element_text(self, elem):
        """
        Recursively extract all text content from an element.

        Skips text nodes that contain only whitespace (spaces, tabs, newlines),
        which typically represent XML formatting rather than document content.

        Args:
            elem: defusedxml.minidom.Element to extract text from

        Returns:
            str: Concatenated text from all non-whitespace text nodes within the element
        """
        text_parts = []
        for node in elem.childNodes:
            if node.nodeType == node.TEXT_NODE:
                # Skip whitespace-only text nodes (XML formatting)
                if node.data.strip():
                    text_parts.append(node.data)
            elif node.nodeType == node.ELEMENT_NODE:
                text_parts.append(self._get_element_text(node))
        return "".join(text_parts)

    def replace_node(self, elem, new_content):
        """
        Replace a DOM element with new XML content.

        Args:
            elem: defusedxml.minidom.Element to replace
            new_content: String containing XML to replace the node with

        Returns:
            List[defusedxml.minidom.Node]: All inserted nodes

        Example:
            new_nodes = editor.replace_node(old_elem, "<w:r><w:t>text</w:t></w:r>")
        """
        parent = elem.parentNode
        nodes = self._parse_fragment(new_content)
        for node in nodes:
            parent.insertBefore(node, elem)
        parent.removeChild(elem)
        return nodes

    def insert_after(self, elem, xml_content):
        """
        Insert XML content after a DOM element.

        Args:
            elem: defusedxml.minidom.Element to insert after
            xml_content: String containing XML to insert

        Returns:
            List[defusedxml.minidom.Node]: All inserted nodes

        Example:
            new_nodes = editor.insert_after(elem, "<w:r><w:t>text</w:t></w:r>")
        """
        parent = elem.parentNode
        next_sibling = elem.nextSibling
        nodes = self._parse_fragment(xml_content)
        for node in nodes:
            if next_sibling:
                parent.insertBefore(node, next_sibling)
            else:
                parent.appendChild(node)
        return nodes

    def insert_before(self, elem, xml_content):
        """
        Insert XML content before a DOM element.

        Args:
            elem: defusedxml.minidom.Element to insert before
            xml_content: String containing XML to insert

        Returns:
            List[defusedxml.minidom.Node]: All inserted nodes

        Example:
            new_nodes = editor.insert_before(elem, "<w:r><w:t>text</w:t></w:r>")
        """
        parent = elem.parentNode
        nodes = self._parse_fragment(xml_content)
        for node in nodes:
            parent.insertBefore(node, elem)
        return nodes

    def append_to(self, elem, xml_content):
        """
        Append XML content as a child of a DOM element.

        Args:
            elem: defusedxml.minidom.Element to append to
            xml_content: String containing XML to append

        Returns:
            List[defusedxml.minidom.Node]: All inserted nodes

        Example:
            new_nodes = editor.append_to(elem, "<w:r><w:t>text</w:t></w:r>")
        """
        nodes = self._parse_fragment(xml_content)
        for node in nodes:
            elem.appendChild(node)
        return nodes

    def get_next_rid(self):
        """Get the next available rId for relationships files."""
        max_id = 0
        for rel_elem in self.dom.getElementsByTagName("Relationship"):
            rel_id = rel_elem.getAttribute("Id")
            if rel_id.startswith("rId"):
                try:
                    max_id = max(max_id, int(rel_id[3:]))
                except ValueError:
                    pass
        return f"rId{max_id + 1}"

    def save(self):
        """
        Save the edited XML back to the file.

        Serializes the DOM tree and writes it back to the original file path,
        preserving the original encoding (ascii or utf-8).
        """
        content = self.dom.toxml(encoding=self.encoding)
        self.xml_path.write_bytes(content)

    def _parse_fragment(self, xml_content):
        """
        Parse XML fragment and return list of imported nodes.

        Args:
            xml_content: String containing XML fragment

        Returns:
            List of defusedxml.minidom.Node objects imported into this document

        Raises:
            AssertionError: If fragment contains no element nodes
        """
        # Extract namespace declarations from the root document element
        root_elem = self.dom.documentElement
        namespaces = []
        if root_elem and root_elem.attributes:
            for i in range(root_elem.attributes.length):
                attr = root_elem.attributes.item(i)
                if attr.name.startswith("xmlns"):  # type: ignore
                    namespaces.append(f'{attr.name}="{attr.value}"')  # type: ignore

        ns_decl = " ".join(namespaces)
        wrapper = f"<root {ns_decl}>{xml_content}</root>"
        fragment_doc = defusedxml.minidom.parseString(wrapper)
        nodes = [
            self.dom.importNode(child, deep=True)
            for child in fragment_doc.documentElement.childNodes  # type: ignore
        ]
        elements = [n for n in nodes if n.nodeType == n.ELEMENT_NODE]
        assert elements, "Fragment must contain at least one element"
        return nodes


def _create_line_tracking_parser():
    """
    Create a SAX parser that tracks line and column numbers for each element.

    Monkey patches the SAX content handler to store the current line and column
    position from the underlying expat parser onto each element as a parse_position
    attribute (line, column) tuple.

    Returns:
        defusedxml.sax.xmlreader.XMLReader: Configured SAX parser
    """

    def set_content_handler(dom_handler):
        def startElementNS(name, tagName, attrs):
            orig_start_cb(name, tagName, attrs)
            cur_elem = dom_handler.elementStack[-1]
            cur_elem.parse_position = (
                parser._parser.CurrentLineNumber,  # type: ignore
                parser._parser.CurrentColumnNumber,  # type: ignore
            )

        orig_start_cb = dom_handler.startElementNS
        dom_handler.startElementNS = startElementNS
        orig_set_content_handler(dom_handler)

    parser = defusedxml.sax.make_parser()
    orig_set_content_handler = parser.setContentHandler
    parser.setContentHandler = set_content_handler  # type: ignore
    return parser
