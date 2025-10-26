"""
Validator for PowerPoint presentation XML files against XSD schemas.
"""

import re

from .base import BaseSchemaValidator


class PPTXSchemaValidator(BaseSchemaValidator):
    """Validator for PowerPoint presentation XML files against XSD schemas."""

    # PowerPoint presentation namespace
    PRESENTATIONML_NAMESPACE = (
        "http://schemas.openxmlformats.org/presentationml/2006/main"
    )

    # PowerPoint-specific element to relationship type mappings
    ELEMENT_RELATIONSHIP_TYPES = {
        "sldid": "slide",
        "sldmasterid": "slidemaster",
        "notesmasterid": "notesmaster",
        "sldlayoutid": "slidelayout",
        "themeid": "theme",
        "tablestyleid": "tablestyles",
    }

    def validate(self):
        """Run all validation checks and return True if all pass."""
        # Test 0: XML well-formedness
        if not self.validate_xml():
            return False

        # Test 1: Namespace declarations
        all_valid = True
        if not self.validate_namespaces():
            all_valid = False

        # Test 2: Unique IDs
        if not self.validate_unique_ids():
            all_valid = False

        # Test 3: UUID ID validation
        if not self.validate_uuid_ids():
            all_valid = False

        # Test 4: Relationship and file reference validation
        if not self.validate_file_references():
            all_valid = False

        # Test 5: Slide layout ID validation
        if not self.validate_slide_layout_ids():
            all_valid = False

        # Test 6: Content type declarations
        if not self.validate_content_types():
            all_valid = False

        # Test 7: XSD schema validation
        if not self.validate_against_xsd():
            all_valid = False

        # Test 8: Notes slide reference validation
        if not self.validate_notes_slide_references():
            all_valid = False

        # Test 9: Relationship ID reference validation
        if not self.validate_all_relationship_ids():
            all_valid = False

        # Test 10: Duplicate slide layout references validation
        if not self.validate_no_duplicate_slide_layouts():
            all_valid = False

        return all_valid

    def validate_uuid_ids(self):
        """Validate that ID attributes that look like UUIDs contain only hex values."""
        import lxml.etree

        errors = []
        # UUID pattern: 8-4-4-4-12 hex digits with optional braces/hyphens
        uuid_pattern = re.compile(
            r"^[\{\(]?[0-9A-Fa-f]{8}-?[0-9A-Fa-f]{4}-?[0-9A-Fa-f]{4}-?[0-9A-Fa-f]{4}-?[0-9A-Fa-f]{12}[\}\)]?$"
        )

        for xml_file in self.xml_files:
            try:
                root = lxml.etree.parse(str(xml_file)).getroot()

                # Check all elements for ID attributes
                for elem in root.iter():
                    for attr, value in elem.attrib.items():
                        # Check if this is an ID attribute
                        attr_name = attr.split("}")[-1].lower()
                        if attr_name == "id" or attr_name.endswith("id"):
                            # Check if value looks like a UUID (has the right length and pattern structure)
                            if self._looks_like_uuid(value):
                                # Validate that it contains only hex characters in the right positions
                                if not uuid_pattern.match(value):
                                    errors.append(
                                        f"  {xml_file.relative_to(self.unpacked_dir)}: "
                                        f"Line {elem.sourceline}: ID '{value}' appears to be a UUID but contains invalid hex characters"
                                    )

            except (lxml.etree.XMLSyntaxError, Exception) as e:
                errors.append(
                    f"  {xml_file.relative_to(self.unpacked_dir)}: Error: {e}"
                )

        if errors:
            print(f"FAILED - Found {len(errors)} UUID ID validation errors:")
            for error in errors:
                print(error)
            return False
        else:
            if self.verbose:
                print("PASSED - All UUID-like IDs contain valid hex values")
            return True

    def _looks_like_uuid(self, value):
        """Check if a value has the general structure of a UUID."""
        # Remove common UUID delimiters
        clean_value = value.strip("{}()").replace("-", "")
        # Check if it's 32 hex-like characters (could include invalid hex chars)
        return len(clean_value) == 32 and all(c.isalnum() for c in clean_value)

    def validate_slide_layout_ids(self):
        """Validate that sldLayoutId elements in slide masters reference valid slide layouts."""
        import lxml.etree

        errors = []

        # Find all slide master files
        slide_masters = list(self.unpacked_dir.glob("ppt/slideMasters/*.xml"))

        if not slide_masters:
            if self.verbose:
                print("PASSED - No slide masters found")
            return True

        for slide_master in slide_masters:
            try:
                # Parse the slide master file
                root = lxml.etree.parse(str(slide_master)).getroot()

                # Find the corresponding _rels file for this slide master
                rels_file = slide_master.parent / "_rels" / f"{slide_master.name}.rels"

                if not rels_file.exists():
                    errors.append(
                        f"  {slide_master.relative_to(self.unpacked_dir)}: "
                        f"Missing relationships file: {rels_file.relative_to(self.unpacked_dir)}"
                    )
                    continue

                # Parse the relationships file
                rels_root = lxml.etree.parse(str(rels_file)).getroot()

                # Build a set of valid relationship IDs that point to slide layouts
                valid_layout_rids = set()
                for rel in rels_root.findall(
                    f".//{{{self.PACKAGE_RELATIONSHIPS_NAMESPACE}}}Relationship"
                ):
                    rel_type = rel.get("Type", "")
                    if "slideLayout" in rel_type:
                        valid_layout_rids.add(rel.get("Id"))

                # Find all sldLayoutId elements in the slide master
                for sld_layout_id in root.findall(
                    f".//{{{self.PRESENTATIONML_NAMESPACE}}}sldLayoutId"
                ):
                    r_id = sld_layout_id.get(
                        f"{{{self.OFFICE_RELATIONSHIPS_NAMESPACE}}}id"
                    )
                    layout_id = sld_layout_id.get("id")

                    if r_id and r_id not in valid_layout_rids:
                        errors.append(
                            f"  {slide_master.relative_to(self.unpacked_dir)}: "
                            f"Line {sld_layout_id.sourceline}: sldLayoutId with id='{layout_id}' "
                            f"references r:id='{r_id}' which is not found in slide layout relationships"
                        )

            except (lxml.etree.XMLSyntaxError, Exception) as e:
                errors.append(
                    f"  {slide_master.relative_to(self.unpacked_dir)}: Error: {e}"
                )

        if errors:
            print(f"FAILED - Found {len(errors)} slide layout ID validation errors:")
            for error in errors:
                print(error)
            print(
                "Remove invalid references or add missing slide layouts to the relationships file."
            )
            return False
        else:
            if self.verbose:
                print("PASSED - All slide layout IDs reference valid slide layouts")
            return True

    def validate_no_duplicate_slide_layouts(self):
        """Validate that each slide has exactly one slideLayout reference."""
        import lxml.etree

        errors = []
        slide_rels_files = list(self.unpacked_dir.glob("ppt/slides/_rels/*.xml.rels"))

        for rels_file in slide_rels_files:
            try:
                root = lxml.etree.parse(str(rels_file)).getroot()

                # Find all slideLayout relationships
                layout_rels = [
                    rel
                    for rel in root.findall(
                        f".//{{{self.PACKAGE_RELATIONSHIPS_NAMESPACE}}}Relationship"
                    )
                    if "slideLayout" in rel.get("Type", "")
                ]

                if len(layout_rels) > 1:
                    errors.append(
                        f"  {rels_file.relative_to(self.unpacked_dir)}: has {len(layout_rels)} slideLayout references"
                    )

            except Exception as e:
                errors.append(
                    f"  {rels_file.relative_to(self.unpacked_dir)}: Error: {e}"
                )

        if errors:
            print("FAILED - Found slides with duplicate slideLayout references:")
            for error in errors:
                print(error)
            return False
        else:
            if self.verbose:
                print("PASSED - All slides have exactly one slideLayout reference")
            return True

    def validate_notes_slide_references(self):
        """Validate that each notesSlide file is referenced by only one slide."""
        import lxml.etree

        errors = []
        notes_slide_references = {}  # Track which slides reference each notesSlide

        # Find all slide relationship files
        slide_rels_files = list(self.unpacked_dir.glob("ppt/slides/_rels/*.xml.rels"))

        if not slide_rels_files:
            if self.verbose:
                print("PASSED - No slide relationship files found")
            return True

        for rels_file in slide_rels_files:
            try:
                # Parse the relationships file
                root = lxml.etree.parse(str(rels_file)).getroot()

                # Find all notesSlide relationships
                for rel in root.findall(
                    f".//{{{self.PACKAGE_RELATIONSHIPS_NAMESPACE}}}Relationship"
                ):
                    rel_type = rel.get("Type", "")
                    if "notesSlide" in rel_type:
                        target = rel.get("Target", "")
                        if target:
                            # Normalize the target path to handle relative paths
                            normalized_target = target.replace("../", "")

                            # Track which slide references this notesSlide
                            slide_name = rels_file.stem.replace(
                                ".xml", ""
                            )  # e.g., "slide1"

                            if normalized_target not in notes_slide_references:
                                notes_slide_references[normalized_target] = []
                            notes_slide_references[normalized_target].append(
                                (slide_name, rels_file)
                            )

            except (lxml.etree.XMLSyntaxError, Exception) as e:
                errors.append(
                    f"  {rels_file.relative_to(self.unpacked_dir)}: Error: {e}"
                )

        # Check for duplicate references
        for target, references in notes_slide_references.items():
            if len(references) > 1:
                slide_names = [ref[0] for ref in references]
                errors.append(
                    f"  Notes slide '{target}' is referenced by multiple slides: {', '.join(slide_names)}"
                )
                for slide_name, rels_file in references:
                    errors.append(f"    - {rels_file.relative_to(self.unpacked_dir)}")

        if errors:
            print(
                f"FAILED - Found {len([e for e in errors if not e.startswith('    ')])} notes slide reference validation errors:"
            )
            for error in errors:
                print(error)
            print("Each slide may optionally have its own slide file.")
            return False
        else:
            if self.verbose:
                print("PASSED - All notes slide references are unique")
            return True


if __name__ == "__main__":
    raise RuntimeError("This module should not be run directly.")
