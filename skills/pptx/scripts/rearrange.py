#!/usr/bin/env python3
"""
Rearrange PowerPoint slides based on a sequence of indices.

Usage:
    python rearrange.py template.pptx output.pptx 0,34,34,50,52

This will create output.pptx using slides from template.pptx in the specified order.
Slides can be repeated (e.g., 34 appears twice).
"""

import argparse
import shutil
import sys
from copy import deepcopy
from pathlib import Path

import six
from pptx import Presentation


def main():
    parser = argparse.ArgumentParser(
        description="Rearrange PowerPoint slides based on a sequence of indices.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python rearrange.py template.pptx output.pptx 0,34,34,50,52
    Creates output.pptx using slides 0, 34 (twice), 50, and 52 from template.pptx

  python rearrange.py template.pptx output.pptx 5,3,1,2,4
    Creates output.pptx with slides reordered as specified

Note: Slide indices are 0-based (first slide is 0, second is 1, etc.)
        """,
    )

    parser.add_argument("template", help="Path to template PPTX file")
    parser.add_argument("output", help="Path for output PPTX file")
    parser.add_argument(
        "sequence", help="Comma-separated sequence of slide indices (0-based)"
    )

    args = parser.parse_args()

    # Parse the slide sequence
    try:
        slide_sequence = [int(x.strip()) for x in args.sequence.split(",")]
    except ValueError:
        print(
            "Error: Invalid sequence format. Use comma-separated integers (e.g., 0,34,34,50,52)"
        )
        sys.exit(1)

    # Check template exists
    template_path = Path(args.template)
    if not template_path.exists():
        print(f"Error: Template file not found: {args.template}")
        sys.exit(1)

    # Create output directory if needed
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        rearrange_presentation(template_path, output_path, slide_sequence)
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error processing presentation: {e}")
        sys.exit(1)


def duplicate_slide(pres, index):
    """Duplicate a slide in the presentation."""
    source = pres.slides[index]

    # Use source's layout to preserve formatting
    new_slide = pres.slides.add_slide(source.slide_layout)

    # Collect all image and media relationships from the source slide
    image_rels = {}
    for rel_id, rel in six.iteritems(source.part.rels):
        if "image" in rel.reltype or "media" in rel.reltype:
            image_rels[rel_id] = rel

    # CRITICAL: Clear placeholder shapes to avoid duplicates
    for shape in new_slide.shapes:
        sp = shape.element
        sp.getparent().remove(sp)

    # Copy all shapes from source
    for shape in source.shapes:
        el = shape.element
        new_el = deepcopy(el)
        new_slide.shapes._spTree.insert_element_before(new_el, "p:extLst")

        # Handle picture shapes - need to update the blip reference
        # Look for all blip elements (they can be in pic or other contexts)
        # Using the element's own xpath method without namespaces argument
        blips = new_el.xpath(".//a:blip[@r:embed]")
        for blip in blips:
            old_rId = blip.get(
                "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"
            )
            if old_rId in image_rels:
                # Create a new relationship in the destination slide for this image
                old_rel = image_rels[old_rId]
                # get_or_add returns the rId directly, or adds and returns new rId
                new_rId = new_slide.part.rels.get_or_add(
                    old_rel.reltype, old_rel._target
                )
                # Update the blip's embed reference to use the new relationship ID
                blip.set(
                    "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed",
                    new_rId,
                )

    # Copy any additional image/media relationships that might be referenced elsewhere
    for rel_id, rel in image_rels.items():
        try:
            new_slide.part.rels.get_or_add(rel.reltype, rel._target)
        except Exception:
            pass  # Relationship might already exist

    return new_slide


def delete_slide(pres, index):
    """Delete a slide from the presentation."""
    rId = pres.slides._sldIdLst[index].rId
    pres.part.drop_rel(rId)
    del pres.slides._sldIdLst[index]


def reorder_slides(pres, slide_index, target_index):
    """Move a slide from one position to another."""
    slides = pres.slides._sldIdLst

    # Remove slide element from current position
    slide_element = slides[slide_index]
    slides.remove(slide_element)

    # Insert at target position
    slides.insert(target_index, slide_element)


def rearrange_presentation(template_path, output_path, slide_sequence):
    """
    Create a new presentation with slides from template in specified order.

    Args:
        template_path: Path to template PPTX file
        output_path: Path for output PPTX file
        slide_sequence: List of slide indices (0-based) to include
    """
    # Copy template to preserve dimensions and theme
    if template_path != output_path:
        shutil.copy2(template_path, output_path)
        prs = Presentation(output_path)
    else:
        prs = Presentation(template_path)

    total_slides = len(prs.slides)

    # Validate indices
    for idx in slide_sequence:
        if idx < 0 or idx >= total_slides:
            raise ValueError(f"Slide index {idx} out of range (0-{total_slides - 1})")

    # Track original slides and their duplicates
    slide_map = []  # List of actual slide indices for final presentation
    duplicated = {}  # Track duplicates: original_idx -> [duplicate_indices]

    # Step 1: DUPLICATE repeated slides
    print(f"Processing {len(slide_sequence)} slides from template...")
    for i, template_idx in enumerate(slide_sequence):
        if template_idx in duplicated and duplicated[template_idx]:
            # Already duplicated this slide, use the duplicate
            slide_map.append(duplicated[template_idx].pop(0))
            print(f"  [{i}] Using duplicate of slide {template_idx}")
        elif slide_sequence.count(template_idx) > 1 and template_idx not in duplicated:
            # First occurrence of a repeated slide - create duplicates
            slide_map.append(template_idx)
            duplicates = []
            count = slide_sequence.count(template_idx) - 1
            print(
                f"  [{i}] Using original slide {template_idx}, creating {count} duplicate(s)"
            )
            for _ in range(count):
                duplicate_slide(prs, template_idx)
                duplicates.append(len(prs.slides) - 1)
            duplicated[template_idx] = duplicates
        else:
            # Unique slide or first occurrence already handled, use original
            slide_map.append(template_idx)
            print(f"  [{i}] Using original slide {template_idx}")

    # Step 2: DELETE unwanted slides (work backwards)
    slides_to_keep = set(slide_map)
    print(f"\nDeleting {len(prs.slides) - len(slides_to_keep)} unused slides...")
    for i in range(len(prs.slides) - 1, -1, -1):
        if i not in slides_to_keep:
            delete_slide(prs, i)
            # Update slide_map indices after deletion
            slide_map = [idx - 1 if idx > i else idx for idx in slide_map]

    # Step 3: REORDER to final sequence
    print(f"Reordering {len(slide_map)} slides to final sequence...")
    for target_pos in range(len(slide_map)):
        # Find which slide should be at target_pos
        current_pos = slide_map[target_pos]
        if current_pos != target_pos:
            reorder_slides(prs, current_pos, target_pos)
            # Update slide_map: the move shifts other slides
            for i in range(len(slide_map)):
                if slide_map[i] > current_pos and slide_map[i] <= target_pos:
                    slide_map[i] -= 1
                elif slide_map[i] < current_pos and slide_map[i] >= target_pos:
                    slide_map[i] += 1
            slide_map[target_pos] = target_pos

    # Save the presentation
    prs.save(output_path)
    print(f"\nSaved rearranged presentation to: {output_path}")
    print(f"Final presentation has {len(prs.slides)} slides")


if __name__ == "__main__":
    main()
