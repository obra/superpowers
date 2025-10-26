"""
Base validator with common validation logic for document files.
"""

import re
from pathlib import Path

import lxml.etree


class BaseSchemaValidator:
    """Base validator with common validation logic for document files."""

    # Elements whose 'id' attributes must be unique within their file
    # Format: element_name -> (attribute_name, scope)
    # scope can be 'file' (unique within file) or 'global' (unique across all files)
    UNIQUE_ID_REQUIREMENTS = {
        # Word elements
        "comment": ("id", "file"),  # Comment IDs in comments.xml
        "commentrangestart": ("id", "file"),  # Must match comment IDs
        "commentrangeend": ("id", "file"),  # Must match comment IDs
        "bookmarkstart": ("id", "file"),  # Bookmark start IDs
        "bookmarkend": ("id", "file"),  # Bookmark end IDs
        # Note: ins and del (track changes) can share IDs when part of same revision
        # PowerPoint elements
        "sldid": ("id", "file"),  # Slide IDs in presentation.xml
        "sldmasterid": ("id", "global"),  # Slide master IDs must be globally unique
        "sldlayoutid": ("id", "global"),  # Slide layout IDs must be globally unique
        "cm": ("authorid", "file"),  # Comment author IDs
        # Excel elements
        "sheet": ("sheetid", "file"),  # Sheet IDs in workbook.xml
        "definedname": ("id", "file"),  # Named range IDs
        # Drawing/Shape elements (all formats)
        "cxnsp": ("id", "file"),  # Connection shape IDs
        "sp": ("id", "file"),  # Shape IDs
        "pic": ("id", "file"),  # Picture IDs
        "grpsp": ("id", "file"),  # Group shape IDs
    }

    # Mapping of element names to expected relationship types
    # Subclasses should override this with format-specific mappings
    ELEMENT_RELATIONSHIP_TYPES = {}

    # Unified schema mappings for all Office document types
    SCHEMA_MAPPINGS = {
        # Document type specific schemas
        "word": "ISO-IEC29500-4_2016/wml.xsd",  # Word documents
        "ppt": "ISO-IEC29500-4_2016/pml.xsd",  # PowerPoint presentations
        "xl": "ISO-IEC29500-4_2016/sml.xsd",  # Excel spreadsheets
        # Common file types
        "[Content_Types].xml": "ecma/fouth-edition/opc-contentTypes.xsd",
        "app.xml": "ISO-IEC29500-4_2016/shared-documentPropertiesExtended.xsd",
        "core.xml": "ecma/fouth-edition/opc-coreProperties.xsd",
        "custom.xml": "ISO-IEC29500-4_2016/shared-documentPropertiesCustom.xsd",
        ".rels": "ecma/fouth-edition/opc-relationships.xsd",
        # Word-specific files
        "people.xml": "microsoft/wml-2012.xsd",
        "commentsIds.xml": "microsoft/wml-cid-2016.xsd",
        "commentsExtensible.xml": "microsoft/wml-cex-2018.xsd",
        "commentsExtended.xml": "microsoft/wml-2012.xsd",
        # Chart files (common across document types)
        "chart": "ISO-IEC29500-4_2016/dml-chart.xsd",
        # Theme files (common across document types)
        "theme": "ISO-IEC29500-4_2016/dml-main.xsd",
        # Drawing and media files
        "drawing": "ISO-IEC29500-4_2016/dml-main.xsd",
    }

    # Unified namespace constants
    MC_NAMESPACE = "http://schemas.openxmlformats.org/markup-compatibility/2006"
    XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace"

    # Common OOXML namespaces used across validators
    PACKAGE_RELATIONSHIPS_NAMESPACE = (
        "http://schemas.openxmlformats.org/package/2006/relationships"
    )
    OFFICE_RELATIONSHIPS_NAMESPACE = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    )
    CONTENT_TYPES_NAMESPACE = (
        "http://schemas.openxmlformats.org/package/2006/content-types"
    )

    # Folders where we should clean ignorable namespaces
    MAIN_CONTENT_FOLDERS = {"word", "ppt", "xl"}

    # All allowed OOXML namespaces (superset of all document types)
    OOXML_NAMESPACES = {
        "http://schemas.openxmlformats.org/officeDocument/2006/math",
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
        "http://schemas.openxmlformats.org/schemaLibrary/2006/main",
        "http://schemas.openxmlformats.org/drawingml/2006/main",
        "http://schemas.openxmlformats.org/drawingml/2006/chart",
        "http://schemas.openxmlformats.org/drawingml/2006/chartDrawing",
        "http://schemas.openxmlformats.org/drawingml/2006/diagram",
        "http://schemas.openxmlformats.org/drawingml/2006/picture",
        "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing",
        "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
        "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
        "http://schemas.openxmlformats.org/presentationml/2006/main",
        "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
        "http://schemas.openxmlformats.org/officeDocument/2006/sharedTypes",
        "http://www.w3.org/XML/1998/namespace",
    }

    def __init__(self, unpacked_dir, original_file, verbose=False):
        self.unpacked_dir = Path(unpacked_dir).resolve()
        self.original_file = Path(original_file)
        self.verbose = verbose

        # Set schemas directory
        self.schemas_dir = Path(__file__).parent.parent.parent / "schemas"

        # Get all XML and .rels files
        patterns = ["*.xml", "*.rels"]
        self.xml_files = [
            f for pattern in patterns for f in self.unpacked_dir.rglob(pattern)
        ]

        if not self.xml_files:
            print(f"Warning: No XML files found in {self.unpacked_dir}")

    def validate(self):
        """Run all validation checks and return True if all pass."""
        raise NotImplementedError("Subclasses must implement the validate method")

    def validate_xml(self):
        """Validate that all XML files are well-formed."""
        errors = []

        for xml_file in self.xml_files:
            try:
                # Try to parse the XML file
                lxml.etree.parse(str(xml_file))
            except lxml.etree.XMLSyntaxError as e:
                errors.append(
                    f"  {xml_file.relative_to(self.unpacked_dir)}: "
                    f"Line {e.lineno}: {e.msg}"
                )
            except Exception as e:
                errors.append(
                    f"  {xml_file.relative_to(self.unpacked_dir)}: "
                    f"Unexpected error: {str(e)}"
                )

        if errors:
            print(f"FAILED - Found {len(errors)} XML violations:")
            for error in errors:
                print(error)
            return False
        else:
            if self.verbose:
                print("PASSED - All XML files are well-formed")
            return True

    def validate_namespaces(self):
        """Validate that namespace prefixes in Ignorable attributes are declared."""
        errors = []

        for xml_file in self.xml_files:
            try:
                root = lxml.etree.parse(str(xml_file)).getroot()
                declared = set(root.nsmap.keys()) - {None}  # Exclude default namespace

                for attr_val in [
                    v for k, v in root.attrib.items() if k.endswith("Ignorable")
                ]:
                    undeclared = set(attr_val.split()) - declared
                    errors.extend(
                        f"  {xml_file.relative_to(self.unpacked_dir)}: "
                        f"Namespace '{ns}' in Ignorable but not declared"
                        for ns in undeclared
                    )
            except lxml.etree.XMLSyntaxError:
                continue

        if errors:
            print(f"FAILED - {len(errors)} namespace issues:")
            for error in errors:
                print(error)
            return False
        if self.verbose:
            print("PASSED - All namespace prefixes properly declared")
        return True

    def validate_unique_ids(self):
        """Validate that specific IDs are unique according to OOXML requirements."""
        errors = []
        global_ids = {}  # Track globally unique IDs across all files

        for xml_file in self.xml_files:
            try:
                root = lxml.etree.parse(str(xml_file)).getroot()
                file_ids = {}  # Track IDs that must be unique within this file

                # Remove all mc:AlternateContent elements from the tree
                mc_elements = root.xpath(
                    ".//mc:AlternateContent", namespaces={"mc": self.MC_NAMESPACE}
                )
                for elem in mc_elements:
                    elem.getparent().remove(elem)

                # Now check IDs in the cleaned tree
                for elem in root.iter():
                    # Get the element name without namespace
                    tag = (
                        elem.tag.split("}")[-1].lower()
                        if "}" in elem.tag
                        else elem.tag.lower()
                    )

                    # Check if this element type has ID uniqueness requirements
                    if tag in self.UNIQUE_ID_REQUIREMENTS:
                        attr_name, scope = self.UNIQUE_ID_REQUIREMENTS[tag]

                        # Look for the specified attribute
                        id_value = None
                        for attr, value in elem.attrib.items():
                            attr_local = (
                                attr.split("}")[-1].lower()
                                if "}" in attr
                                else attr.lower()
                            )
                            if attr_local == attr_name:
                                id_value = value
                                break

                        if id_value is not None:
                            if scope == "global":
                                # Check global uniqueness
                                if id_value in global_ids:
                                    prev_file, prev_line, prev_tag = global_ids[
                                        id_value
                                    ]
                                    errors.append(
                                        f"  {xml_file.relative_to(self.unpacked_dir)}: "
                                        f"Line {elem.sourceline}: Global ID '{id_value}' in <{tag}> "
                                        f"already used in {prev_file} at line {prev_line} in <{prev_tag}>"
                                    )
                                else:
                                    global_ids[id_value] = (
                                        xml_file.relative_to(self.unpacked_dir),
                                        elem.sourceline,
                                        tag,
                                    )
                            elif scope == "file":
                                # Check file-level uniqueness
                                key = (tag, attr_name)
                                if key not in file_ids:
                                    file_ids[key] = {}

                                if id_value in file_ids[key]:
                                    prev_line = file_ids[key][id_value]
                                    errors.append(
                                        f"  {xml_file.relative_to(self.unpacked_dir)}: "
                                        f"Line {elem.sourceline}: Duplicate {attr_name}='{id_value}' in <{tag}> "
                                        f"(first occurrence at line {prev_line})"
                                    )
                                else:
                                    file_ids[key][id_value] = elem.sourceline

            except (lxml.etree.XMLSyntaxError, Exception) as e:
                errors.append(
                    f"  {xml_file.relative_to(self.unpacked_dir)}: Error: {e}"
                )

        if errors:
            print(f"FAILED - Found {len(errors)} ID uniqueness violations:")
            for error in errors:
                print(error)
            return False
        else:
            if self.verbose:
                print("PASSED - All required IDs are unique")
            return True

    def validate_file_references(self):
        """
        Validate that all .rels files properly reference files and that all files are referenced.
        """
        errors = []

        # Find all .rels files
        rels_files = list(self.unpacked_dir.rglob("*.rels"))

        if not rels_files:
            if self.verbose:
                print("PASSED - No .rels files found")
            return True

        # Get all files in the unpacked directory (excluding reference files)
        all_files = []
        for file_path in self.unpacked_dir.rglob("*"):
            if (
                file_path.is_file()
                and file_path.name != "[Content_Types].xml"
                and not file_path.name.endswith(".rels")
            ):  # This file is not referenced by .rels
                all_files.append(file_path.resolve())

        # Track all files that are referenced by any .rels file
        all_referenced_files = set()

        if self.verbose:
            print(
                f"Found {len(rels_files)} .rels files and {len(all_files)} target files"
            )

        # Check each .rels file
        for rels_file in rels_files:
            try:
                # Parse relationships file
                rels_root = lxml.etree.parse(str(rels_file)).getroot()

                # Get the directory where this .rels file is located
                rels_dir = rels_file.parent

                # Find all relationships and their targets
                referenced_files = set()
                broken_refs = []

                for rel in rels_root.findall(
                    ".//ns:Relationship",
                    namespaces={"ns": self.PACKAGE_RELATIONSHIPS_NAMESPACE},
                ):
                    target = rel.get("Target")
                    if target and not target.startswith(
                        ("http", "mailto:")
                    ):  # Skip external URLs
                        # Resolve the target path relative to the .rels file location
                        if rels_file.name == ".rels":
                            # Root .rels file - targets are relative to unpacked_dir
                            target_path = self.unpacked_dir / target
                        else:
                            # Other .rels files - targets are relative to their parent's parent
                            # e.g., word/_rels/document.xml.rels -> targets relative to word/
                            base_dir = rels_dir.parent
                            target_path = base_dir / target

                        # Normalize the path and check if it exists
                        try:
                            target_path = target_path.resolve()
                            if target_path.exists() and target_path.is_file():
                                referenced_files.add(target_path)
                                all_referenced_files.add(target_path)
                            else:
                                broken_refs.append((target, rel.sourceline))
                        except (OSError, ValueError):
                            broken_refs.append((target, rel.sourceline))

                # Report broken references
                if broken_refs:
                    rel_path = rels_file.relative_to(self.unpacked_dir)
                    for broken_ref, line_num in broken_refs:
                        errors.append(
                            f"  {rel_path}: Line {line_num}: Broken reference to {broken_ref}"
                        )

            except Exception as e:
                rel_path = rels_file.relative_to(self.unpacked_dir)
                errors.append(f"  Error parsing {rel_path}: {e}")

        # Check for unreferenced files (files that exist but are not referenced anywhere)
        unreferenced_files = set(all_files) - all_referenced_files

        if unreferenced_files:
            for unref_file in sorted(unreferenced_files):
                unref_rel_path = unref_file.relative_to(self.unpacked_dir)
                errors.append(f"  Unreferenced file: {unref_rel_path}")

        if errors:
            print(f"FAILED - Found {len(errors)} relationship validation errors:")
            for error in errors:
                print(error)
            print(
                "CRITICAL: These errors will cause the document to appear corrupt. "
                + "Broken references MUST be fixed, "
                + "and unreferenced files MUST be referenced or removed."
            )
            return False
        else:
            if self.verbose:
                print(
                    "PASSED - All references are valid and all files are properly referenced"
                )
            return True

    def validate_all_relationship_ids(self):
        """
        Validate that all r:id attributes in XML files reference existing IDs
        in their corresponding .rels files, and optionally validate relationship types.
        """
        import lxml.etree

        errors = []

        # Process each XML file that might contain r:id references
        for xml_file in self.xml_files:
            # Skip .rels files themselves
            if xml_file.suffix == ".rels":
                continue

            # Determine the corresponding .rels file
            # For dir/file.xml, it's dir/_rels/file.xml.rels
            rels_dir = xml_file.parent / "_rels"
            rels_file = rels_dir / f"{xml_file.name}.rels"

            # Skip if there's no corresponding .rels file (that's okay)
            if not rels_file.exists():
                continue

            try:
                # Parse the .rels file to get valid relationship IDs and their types
                rels_root = lxml.etree.parse(str(rels_file)).getroot()
                rid_to_type = {}

                for rel in rels_root.findall(
                    f".//{{{self.PACKAGE_RELATIONSHIPS_NAMESPACE}}}Relationship"
                ):
                    rid = rel.get("Id")
                    rel_type = rel.get("Type", "")
                    if rid:
                        # Check for duplicate rIds
                        if rid in rid_to_type:
                            rels_rel_path = rels_file.relative_to(self.unpacked_dir)
                            errors.append(
                                f"  {rels_rel_path}: Line {rel.sourceline}: "
                                f"Duplicate relationship ID '{rid}' (IDs must be unique)"
                            )
                        # Extract just the type name from the full URL
                        type_name = (
                            rel_type.split("/")[-1] if "/" in rel_type else rel_type
                        )
                        rid_to_type[rid] = type_name

                # Parse the XML file to find all r:id references
                xml_root = lxml.etree.parse(str(xml_file)).getroot()

                # Find all elements with r:id attributes
                for elem in xml_root.iter():
                    # Check for r:id attribute (relationship ID)
                    rid_attr = elem.get(f"{{{self.OFFICE_RELATIONSHIPS_NAMESPACE}}}id")
                    if rid_attr:
                        xml_rel_path = xml_file.relative_to(self.unpacked_dir)
                        elem_name = (
                            elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
                        )

                        # Check if the ID exists
                        if rid_attr not in rid_to_type:
                            errors.append(
                                f"  {xml_rel_path}: Line {elem.sourceline}: "
                                f"<{elem_name}> references non-existent relationship '{rid_attr}' "
                                f"(valid IDs: {', '.join(sorted(rid_to_type.keys())[:5])}{'...' if len(rid_to_type) > 5 else ''})"
                            )
                        # Check if we have type expectations for this element
                        elif self.ELEMENT_RELATIONSHIP_TYPES:
                            expected_type = self._get_expected_relationship_type(
                                elem_name
                            )
                            if expected_type:
                                actual_type = rid_to_type[rid_attr]
                                # Check if the actual type matches or contains the expected type
                                if expected_type not in actual_type.lower():
                                    errors.append(
                                        f"  {xml_rel_path}: Line {elem.sourceline}: "
                                        f"<{elem_name}> references '{rid_attr}' which points to '{actual_type}' "
                                        f"but should point to a '{expected_type}' relationship"
                                    )

            except Exception as e:
                xml_rel_path = xml_file.relative_to(self.unpacked_dir)
                errors.append(f"  Error processing {xml_rel_path}: {e}")

        if errors:
            print(f"FAILED - Found {len(errors)} relationship ID reference errors:")
            for error in errors:
                print(error)
            print("\nThese ID mismatches will cause the document to appear corrupt!")
            return False
        else:
            if self.verbose:
                print("PASSED - All relationship ID references are valid")
            return True

    def _get_expected_relationship_type(self, element_name):
        """
        Get the expected relationship type for an element.
        First checks the explicit mapping, then tries pattern detection.
        """
        # Normalize element name to lowercase
        elem_lower = element_name.lower()

        # Check explicit mapping first
        if elem_lower in self.ELEMENT_RELATIONSHIP_TYPES:
            return self.ELEMENT_RELATIONSHIP_TYPES[elem_lower]

        # Try pattern detection for common patterns
        # Pattern 1: Elements ending in "Id" often expect a relationship of the prefix type
        if elem_lower.endswith("id") and len(elem_lower) > 2:
            # e.g., "sldId" -> "sld", "sldMasterId" -> "sldMaster"
            prefix = elem_lower[:-2]  # Remove "id"
            # Check if this might be a compound like "sldMasterId"
            if prefix.endswith("master"):
                return prefix.lower()
            elif prefix.endswith("layout"):
                return prefix.lower()
            else:
                # Simple case like "sldId" -> "slide"
                # Common transformations
                if prefix == "sld":
                    return "slide"
                return prefix.lower()

        # Pattern 2: Elements ending in "Reference" expect a relationship of the prefix type
        if elem_lower.endswith("reference") and len(elem_lower) > 9:
            prefix = elem_lower[:-9]  # Remove "reference"
            return prefix.lower()

        return None

    def validate_content_types(self):
        """Validate that all content files are properly declared in [Content_Types].xml."""
        errors = []

        # Find [Content_Types].xml file
        content_types_file = self.unpacked_dir / "[Content_Types].xml"
        if not content_types_file.exists():
            print("FAILED - [Content_Types].xml file not found")
            return False

        try:
            # Parse and get all declared parts and extensions
            root = lxml.etree.parse(str(content_types_file)).getroot()
            declared_parts = set()
            declared_extensions = set()

            # Get Override declarations (specific files)
            for override in root.findall(
                f".//{{{self.CONTENT_TYPES_NAMESPACE}}}Override"
            ):
                part_name = override.get("PartName")
                if part_name is not None:
                    declared_parts.add(part_name.lstrip("/"))

            # Get Default declarations (by extension)
            for default in root.findall(
                f".//{{{self.CONTENT_TYPES_NAMESPACE}}}Default"
            ):
                extension = default.get("Extension")
                if extension is not None:
                    declared_extensions.add(extension.lower())

            # Root elements that require content type declaration
            declarable_roots = {
                "sld",
                "sldLayout",
                "sldMaster",
                "presentation",  # PowerPoint
                "document",  # Word
                "workbook",
                "worksheet",  # Excel
                "theme",  # Common
            }

            # Common media file extensions that should be declared
            media_extensions = {
                "png": "image/png",
                "jpg": "image/jpeg",
                "jpeg": "image/jpeg",
                "gif": "image/gif",
                "bmp": "image/bmp",
                "tiff": "image/tiff",
                "wmf": "image/x-wmf",
                "emf": "image/x-emf",
            }

            # Get all files in the unpacked directory
            all_files = list(self.unpacked_dir.rglob("*"))
            all_files = [f for f in all_files if f.is_file()]

            # Check all XML files for Override declarations
            for xml_file in self.xml_files:
                path_str = str(xml_file.relative_to(self.unpacked_dir)).replace(
                    "\\", "/"
                )

                # Skip non-content files
                if any(
                    skip in path_str
                    for skip in [".rels", "[Content_Types]", "docProps/", "_rels/"]
                ):
                    continue

                try:
                    root_tag = lxml.etree.parse(str(xml_file)).getroot().tag
                    root_name = root_tag.split("}")[-1] if "}" in root_tag else root_tag

                    if root_name in declarable_roots and path_str not in declared_parts:
                        errors.append(
                            f"  {path_str}: File with <{root_name}> root not declared in [Content_Types].xml"
                        )

                except Exception:
                    continue  # Skip unparseable files

            # Check all non-XML files for Default extension declarations
            for file_path in all_files:
                # Skip XML files and metadata files (already checked above)
                if file_path.suffix.lower() in {".xml", ".rels"}:
                    continue
                if file_path.name == "[Content_Types].xml":
                    continue
                if "_rels" in file_path.parts or "docProps" in file_path.parts:
                    continue

                extension = file_path.suffix.lstrip(".").lower()
                if extension and extension not in declared_extensions:
                    # Check if it's a known media extension that should be declared
                    if extension in media_extensions:
                        relative_path = file_path.relative_to(self.unpacked_dir)
                        errors.append(
                            f'  {relative_path}: File with extension \'{extension}\' not declared in [Content_Types].xml - should add: <Default Extension="{extension}" ContentType="{media_extensions[extension]}"/>'
                        )

        except Exception as e:
            errors.append(f"  Error parsing [Content_Types].xml: {e}")

        if errors:
            print(f"FAILED - Found {len(errors)} content type declaration errors:")
            for error in errors:
                print(error)
            return False
        else:
            if self.verbose:
                print(
                    "PASSED - All content files are properly declared in [Content_Types].xml"
                )
            return True

    def validate_file_against_xsd(self, xml_file, verbose=False):
        """Validate a single XML file against XSD schema, comparing with original.

        Args:
            xml_file: Path to XML file to validate
            verbose: Enable verbose output

        Returns:
            tuple: (is_valid, new_errors_set) where is_valid is True/False/None (skipped)
        """
        # Resolve both paths to handle symlinks
        xml_file = Path(xml_file).resolve()
        unpacked_dir = self.unpacked_dir.resolve()

        # Validate current file
        is_valid, current_errors = self._validate_single_file_xsd(
            xml_file, unpacked_dir
        )

        if is_valid is None:
            return None, set()  # Skipped
        elif is_valid:
            return True, set()  # Valid, no errors

        # Get errors from original file for this specific file
        original_errors = self._get_original_file_errors(xml_file)

        # Compare with original (both are guaranteed to be sets here)
        assert current_errors is not None
        new_errors = current_errors - original_errors

        if new_errors:
            if verbose:
                relative_path = xml_file.relative_to(unpacked_dir)
                print(f"FAILED - {relative_path}: {len(new_errors)} new error(s)")
                for error in list(new_errors)[:3]:
                    truncated = error[:250] + "..." if len(error) > 250 else error
                    print(f"  - {truncated}")
            return False, new_errors
        else:
            # All errors existed in original
            if verbose:
                print(
                    f"PASSED - No new errors (original had {len(current_errors)} errors)"
                )
            return True, set()

    def validate_against_xsd(self):
        """Validate XML files against XSD schemas, showing only new errors compared to original."""
        new_errors = []
        original_error_count = 0
        valid_count = 0
        skipped_count = 0

        for xml_file in self.xml_files:
            relative_path = str(xml_file.relative_to(self.unpacked_dir))
            is_valid, new_file_errors = self.validate_file_against_xsd(
                xml_file, verbose=False
            )

            if is_valid is None:
                skipped_count += 1
                continue
            elif is_valid and not new_file_errors:
                valid_count += 1
                continue
            elif is_valid:
                # Had errors but all existed in original
                original_error_count += 1
                valid_count += 1
                continue

            # Has new errors
            new_errors.append(f"  {relative_path}: {len(new_file_errors)} new error(s)")
            for error in list(new_file_errors)[:3]:  # Show first 3 errors
                new_errors.append(
                    f"    - {error[:250]}..." if len(error) > 250 else f"    - {error}"
                )

        # Print summary
        if self.verbose:
            print(f"Validated {len(self.xml_files)} files:")
            print(f"  - Valid: {valid_count}")
            print(f"  - Skipped (no schema): {skipped_count}")
            if original_error_count:
                print(f"  - With original errors (ignored): {original_error_count}")
            print(
                f"  - With NEW errors: {len(new_errors) > 0 and len([e for e in new_errors if not e.startswith('    ')]) or 0}"
            )

        if new_errors:
            print("\nFAILED - Found NEW validation errors:")
            for error in new_errors:
                print(error)
            return False
        else:
            if self.verbose:
                print("\nPASSED - No new XSD validation errors introduced")
            return True

    def _get_schema_path(self, xml_file):
        """Determine the appropriate schema path for an XML file."""
        # Check exact filename match
        if xml_file.name in self.SCHEMA_MAPPINGS:
            return self.schemas_dir / self.SCHEMA_MAPPINGS[xml_file.name]

        # Check .rels files
        if xml_file.suffix == ".rels":
            return self.schemas_dir / self.SCHEMA_MAPPINGS[".rels"]

        # Check chart files
        if "charts/" in str(xml_file) and xml_file.name.startswith("chart"):
            return self.schemas_dir / self.SCHEMA_MAPPINGS["chart"]

        # Check theme files
        if "theme/" in str(xml_file) and xml_file.name.startswith("theme"):
            return self.schemas_dir / self.SCHEMA_MAPPINGS["theme"]

        # Check if file is in a main content folder and use appropriate schema
        if xml_file.parent.name in self.MAIN_CONTENT_FOLDERS:
            return self.schemas_dir / self.SCHEMA_MAPPINGS[xml_file.parent.name]

        return None

    def _clean_ignorable_namespaces(self, xml_doc):
        """Remove attributes and elements not in allowed namespaces."""
        # Create a clean copy
        xml_string = lxml.etree.tostring(xml_doc, encoding="unicode")
        xml_copy = lxml.etree.fromstring(xml_string)

        # Remove attributes not in allowed namespaces
        for elem in xml_copy.iter():
            attrs_to_remove = []

            for attr in elem.attrib:
                # Check if attribute is from a namespace other than allowed ones
                if "{" in attr:
                    ns = attr.split("}")[0][1:]
                    if ns not in self.OOXML_NAMESPACES:
                        attrs_to_remove.append(attr)

            # Remove collected attributes
            for attr in attrs_to_remove:
                del elem.attrib[attr]

        # Remove elements not in allowed namespaces
        self._remove_ignorable_elements(xml_copy)

        return lxml.etree.ElementTree(xml_copy)

    def _remove_ignorable_elements(self, root):
        """Recursively remove all elements not in allowed namespaces."""
        elements_to_remove = []

        # Find elements to remove
        for elem in list(root):
            # Skip non-element nodes (comments, processing instructions, etc.)
            if not hasattr(elem, "tag") or callable(elem.tag):
                continue

            tag_str = str(elem.tag)
            if tag_str.startswith("{"):
                ns = tag_str.split("}")[0][1:]
                if ns not in self.OOXML_NAMESPACES:
                    elements_to_remove.append(elem)
                    continue

            # Recursively clean child elements
            self._remove_ignorable_elements(elem)

        # Remove collected elements
        for elem in elements_to_remove:
            root.remove(elem)

    def _preprocess_for_mc_ignorable(self, xml_doc):
        """Preprocess XML to handle mc:Ignorable attribute properly."""
        # Remove mc:Ignorable attributes before validation
        root = xml_doc.getroot()

        # Remove mc:Ignorable attribute from root
        if f"{{{self.MC_NAMESPACE}}}Ignorable" in root.attrib:
            del root.attrib[f"{{{self.MC_NAMESPACE}}}Ignorable"]

        return xml_doc

    def _validate_single_file_xsd(self, xml_file, base_path):
        """Validate a single XML file against XSD schema. Returns (is_valid, errors_set)."""
        schema_path = self._get_schema_path(xml_file)
        if not schema_path:
            return None, None  # Skip file

        try:
            # Load schema
            with open(schema_path, "rb") as xsd_file:
                parser = lxml.etree.XMLParser()
                xsd_doc = lxml.etree.parse(
                    xsd_file, parser=parser, base_url=str(schema_path)
                )
                schema = lxml.etree.XMLSchema(xsd_doc)

            # Load and preprocess XML
            with open(xml_file, "r") as f:
                xml_doc = lxml.etree.parse(f)

            xml_doc, _ = self._remove_template_tags_from_text_nodes(xml_doc)
            xml_doc = self._preprocess_for_mc_ignorable(xml_doc)

            # Clean ignorable namespaces if needed
            relative_path = xml_file.relative_to(base_path)
            if (
                relative_path.parts
                and relative_path.parts[0] in self.MAIN_CONTENT_FOLDERS
            ):
                xml_doc = self._clean_ignorable_namespaces(xml_doc)

            # Validate
            if schema.validate(xml_doc):
                return True, set()
            else:
                errors = set()
                for error in schema.error_log:
                    # Store normalized error message (without line numbers for comparison)
                    errors.add(error.message)
                return False, errors

        except Exception as e:
            return False, {str(e)}

    def _get_original_file_errors(self, xml_file):
        """Get XSD validation errors from a single file in the original document.

        Args:
            xml_file: Path to the XML file in unpacked_dir to check

        Returns:
            set: Set of error messages from the original file
        """
        import tempfile
        import zipfile

        # Resolve both paths to handle symlinks (e.g., /var vs /private/var on macOS)
        xml_file = Path(xml_file).resolve()
        unpacked_dir = self.unpacked_dir.resolve()
        relative_path = xml_file.relative_to(unpacked_dir)

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)

            # Extract original file
            with zipfile.ZipFile(self.original_file, "r") as zip_ref:
                zip_ref.extractall(temp_path)

            # Find corresponding file in original
            original_xml_file = temp_path / relative_path

            if not original_xml_file.exists():
                # File didn't exist in original, so no original errors
                return set()

            # Validate the specific file in original
            is_valid, errors = self._validate_single_file_xsd(
                original_xml_file, temp_path
            )
            return errors if errors else set()

    def _remove_template_tags_from_text_nodes(self, xml_doc):
        """Remove template tags from XML text nodes and collect warnings.

        Template tags follow the pattern {{ ... }} and are used as placeholders
        for content replacement. They should be removed from text content before
        XSD validation while preserving XML structure.

        Returns:
            tuple: (cleaned_xml_doc, warnings_list)
        """
        warnings = []
        template_pattern = re.compile(r"\{\{[^}]*\}\}")

        # Create a copy of the document to avoid modifying the original
        xml_string = lxml.etree.tostring(xml_doc, encoding="unicode")
        xml_copy = lxml.etree.fromstring(xml_string)

        def process_text_content(text, content_type):
            if not text:
                return text
            matches = list(template_pattern.finditer(text))
            if matches:
                for match in matches:
                    warnings.append(
                        f"Found template tag in {content_type}: {match.group()}"
                    )
                return template_pattern.sub("", text)
            return text

        # Process all text nodes in the document
        for elem in xml_copy.iter():
            # Skip processing if this is a w:t element
            if not hasattr(elem, "tag") or callable(elem.tag):
                continue
            tag_str = str(elem.tag)
            if tag_str.endswith("}t") or tag_str == "t":
                continue

            elem.text = process_text_content(elem.text, "text content")
            elem.tail = process_text_content(elem.tail, "tail content")

        return lxml.etree.ElementTree(xml_copy), warnings


if __name__ == "__main__":
    raise RuntimeError("This module should not be run directly.")
