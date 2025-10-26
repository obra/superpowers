**CRITICAL: You MUST complete these steps in order. Do not skip ahead to writing code.**

If you need to fill out a PDF form, first check to see if the PDF has fillable form fields. Run this script from this file's directory:
 `python scripts/check_fillable_fields <file.pdf>`, and depending on the result go to either the "Fillable fields" or "Non-fillable fields" and follow those instructions.

# Fillable fields
If the PDF has fillable form fields:
- Run this script from this file's directory: `python scripts/extract_form_field_info.py <input.pdf> <field_info.json>`. It will create a JSON file with a list of fields in this format:
```
[
  {
    "field_id": (unique ID for the field),
    "page": (page number, 1-based),
    "rect": ([left, bottom, right, top] bounding box in PDF coordinates, y=0 is the bottom of the page),
    "type": ("text", "checkbox", "radio_group", or "choice"),
  },
  // Checkboxes have "checked_value" and "unchecked_value" properties:
  {
    "field_id": (unique ID for the field),
    "page": (page number, 1-based),
    "type": "checkbox",
    "checked_value": (Set the field to this value to check the checkbox),
    "unchecked_value": (Set the field to this value to uncheck the checkbox),
  },
  // Radio groups have a "radio_options" list with the possible choices.
  {
    "field_id": (unique ID for the field),
    "page": (page number, 1-based),
    "type": "radio_group",
    "radio_options": [
      {
        "value": (set the field to this value to select this radio option),
        "rect": (bounding box for the radio button for this option)
      },
      // Other radio options
    ]
  },
  // Multiple choice fields have a "choice_options" list with the possible choices:
  {
    "field_id": (unique ID for the field),
    "page": (page number, 1-based),
    "type": "choice",
    "choice_options": [
      {
        "value": (set the field to this value to select this option),
        "text": (display text of the option)
      },
      // Other choice options
    ],
  }
]
```
- Convert the PDF to PNGs (one image for each page) with this script (run from this file's directory):
`python scripts/convert_pdf_to_images.py <file.pdf> <output_directory>`
Then analyze the images to determine the purpose of each form field (make sure to convert the bounding box PDF coordinates to image coordinates).
- Create a `field_values.json` file in this format with the values to be entered for each field:
```
[
  {
    "field_id": "last_name", // Must match the field_id from `extract_form_field_info.py`
    "description": "The user's last name",
    "page": 1, // Must match the "page" value in field_info.json
    "value": "Simpson"
  },
  {
    "field_id": "Checkbox12",
    "description": "Checkbox to be checked if the user is 18 or over",
    "page": 1,
    "value": "/On" // If this is a checkbox, use its "checked_value" value to check it. If it's a radio button group, use one of the "value" values in "radio_options".
  },
  // more fields
]
```
- Run the `fill_fillable_fields.py` script from this file's directory to create a filled-in PDF:
`python scripts/fill_fillable_fields.py <input pdf> <field_values.json> <output pdf>`
This script will verify that the field IDs and values you provide are valid; if it prints error messages, correct the appropriate fields and try again.

# Non-fillable fields
If the PDF doesn't have fillable form fields, you'll need to visually determine where the data should be added and create text annotations. Follow the below steps *exactly*. You MUST perform all of these steps to ensure that the the form is accurately completed. Details for each step are below.
- Convert the PDF to PNG images and determine field bounding boxes.
- Create a JSON file with field information and validation images showing the bounding boxes.
- Validate the the bounding boxes.
- Use the bounding boxes to fill in the form.

## Step 1: Visual Analysis (REQUIRED)
- Convert the PDF to PNG images. Run this script from this file's directory:
`python scripts/convert_pdf_to_images.py <file.pdf> <output_directory>`
The script will create a PNG image for each page in the PDF.
- Carefully examine each PNG image and identify all form fields and areas where the user should enter data. For each form field where the user should enter text, determine bounding boxes for both the form field label, and the area where the user should enter text. The label and entry bounding boxes MUST NOT INTERSECT; the text entry box should only include the area where data should be entered. Usually this area will be immediately to the side, above, or below its label. Entry bounding boxes must be tall and wide enough to contain their text.

These are some examples of form structures that you might see:

*Label inside box*
```
┌────────────────────────┐
│ Name:                  │
└────────────────────────┘
```
The input area should be to the right of the "Name" label and extend to the edge of the box.

*Label before line*
```
Email: _______________________
```
The input area should be above the line and include its entire width.

*Label under line*
```
_________________________
Name
```
The input area should be above the line and include the entire width of the line. This is common for signature and date fields.

*Label above line*
```
Please enter any special requests:
________________________________________________
```
The input area should extend from the bottom of the label to the line, and should include the entire width of the line.

*Checkboxes*
```
Are you a US citizen? Yes □  No □
```
For checkboxes:
- Look for small square boxes (□) - these are the actual checkboxes to target. They may be to the left or right of their labels.
- Distinguish between label text ("Yes", "No") and the clickable checkbox squares.
- The entry bounding box should cover ONLY the small square, not the text label.

### Step 2: Create fields.json and validation images (REQUIRED)
- Create a file named `fields.json` with information for the form fields and bounding boxes in this format:
```
{
  "pages": [
    {
      "page_number": 1,
      "image_width": (first page image width in pixels),
      "image_height": (first page image height in pixels),
    },
    {
      "page_number": 2,
      "image_width": (second page image width in pixels),
      "image_height": (second page image height in pixels),
    }
    // additional pages
  ],
  "form_fields": [
    // Example for a text field.
    {
      "page_number": 1,
      "description": "The user's last name should be entered here",
      // Bounding boxes are [left, top, right, bottom]. The bounding boxes for the label and text entry should not overlap.
      "field_label": "Last name",
      "label_bounding_box": [30, 125, 95, 142],
      "entry_bounding_box": [100, 125, 280, 142],
      "entry_text": {
        "text": "Johnson", // This text will be added as an annotation at the entry_bounding_box location
        "font_size": 14, // optional, defaults to 14
        "font_color": "000000", // optional, RRGGBB format, defaults to 000000 (black)
      }
    },
    // Example for a checkbox. TARGET THE SQUARE for the entry bounding box, NOT THE TEXT
    {
      "page_number": 2,
      "description": "Checkbox that should be checked if the user is over 18",
      "entry_bounding_box": [140, 525, 155, 540],  // Small box over checkbox square
      "field_label": "Yes",
      "label_bounding_box": [100, 525, 132, 540],  // Box containing "Yes" text
      // Use "X" to check a checkbox.
      "entry_text": {
        "text": "X",
      }
    }
    // additional form field entries
  ]
}
```

Create validation images by running this script from this file's directory for each page:
`python scripts/create_validation_image.py <page_number> <path_to_fields.json> <input_image_path> <output_image_path>

The validation images will have red rectangles where text should be entered, and blue rectangles covering label text.

### Step 3: Validate Bounding Boxes (REQUIRED)
#### Automated intersection check
- Verify that none of bounding boxes intersect and that the entry bounding boxes are tall enough by checking the fields.json file with the `check_bounding_boxes.py` script (run from this file's directory):
`python scripts/check_bounding_boxes.py <JSON file>`

If there are errors, reanalyze the relevant fields, adjust the bounding boxes, and iterate until there are no remaining errors. Remember: label (blue) bounding boxes should contain text labels, entry (red) boxes should not.

#### Manual image inspection
**CRITICAL: Do not proceed without visually inspecting validation images**
- Red rectangles must ONLY cover input areas
- Red rectangles MUST NOT contain any text
- Blue rectangles should contain label text
- For checkboxes:
  - Red rectangle MUST be centered on the checkbox square
  - Blue rectangle should cover the text label for the checkbox

- If any rectangles look wrong, fix fields.json, regenerate the validation images, and verify again. Repeat this process until the bounding boxes are fully accurate.


### Step 4: Add annotations to the PDF
Run this script from this file's directory to create a filled-out PDF using the information in fields.json:
`python scripts/fill_pdf_form_with_annotations.py <input_pdf_path> <path_to_fields.json> <output_pdf_path>
