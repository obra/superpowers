# Office Open XML Technical Reference

**Important: Read this entire document before starting.** This document covers:
- [Technical Guidelines](#technical-guidelines) - Schema compliance rules and validation requirements
- [Document Content Patterns](#document-content-patterns) - XML patterns for headings, lists, tables, formatting, etc.
- [Document Library (Python)](#document-library-python) - Recommended approach for OOXML manipulation with automatic infrastructure setup
- [Tracked Changes (Redlining)](#tracked-changes-redlining) - XML patterns for implementing tracked changes

## Technical Guidelines

### Schema Compliance
- **Element ordering in `<w:pPr>`**: `<w:pStyle>`, `<w:numPr>`, `<w:spacing>`, `<w:ind>`, `<w:jc>`
- **Whitespace**: Add `xml:space='preserve'` to `<w:t>` elements with leading/trailing spaces
- **Unicode**: Escape characters in ASCII content: `"` becomes `&#8220;`
  - **Character encoding reference**: Curly quotes `""` become `&#8220;&#8221;`, apostrophe `'` becomes `&#8217;`, em-dash `—` becomes `&#8212;`
- **Tracked changes**: Use `<w:del>` and `<w:ins>` tags with `w:author="Claude"` outside `<w:r>` elements
  - **Critical**: `<w:ins>` closes with `</w:ins>`, `<w:del>` closes with `</w:del>` - never mix
  - **RSIDs must be 8-digit hex**: Use values like `00AB1234` (only 0-9, A-F characters)
  - **trackRevisions placement**: Add `<w:trackRevisions/>` after `<w:proofState>` in settings.xml
- **Images**: Add to `word/media/`, reference in `document.xml`, set dimensions to prevent overflow

## Document Content Patterns

### Basic Structure
```xml
<w:p>
  <w:r><w:t>Text content</w:t></w:r>
</w:p>
```

### Headings and Styles
```xml
<w:p>
  <w:pPr>
    <w:pStyle w:val="Title"/>
    <w:jc w:val="center"/>
  </w:pPr>
  <w:r><w:t>Document Title</w:t></w:r>
</w:p>

<w:p>
  <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
  <w:r><w:t>Section Heading</w:t></w:r>
</w:p>
```

### Text Formatting
```xml
<!-- Bold -->
<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t>Bold</w:t></w:r>
<!-- Italic -->
<w:r><w:rPr><w:i/><w:iCs/></w:rPr><w:t>Italic</w:t></w:r>
<!-- Underline -->
<w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>Underlined</w:t></w:r>
<!-- Highlight -->
<w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>Highlighted</w:t></w:r>
```

### Lists
```xml
<!-- Numbered list -->
<w:p>
  <w:pPr>
    <w:pStyle w:val="ListParagraph"/>
    <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
    <w:spacing w:before="240"/>
  </w:pPr>
  <w:r><w:t>First item</w:t></w:r>
</w:p>

<!-- Restart numbered list at 1 - use different numId -->
<w:p>
  <w:pPr>
    <w:pStyle w:val="ListParagraph"/>
    <w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr>
    <w:spacing w:before="240"/>
  </w:pPr>
  <w:r><w:t>New list item 1</w:t></w:r>
</w:p>

<!-- Bullet list (level 2) -->
<w:p>
  <w:pPr>
    <w:pStyle w:val="ListParagraph"/>
    <w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr>
    <w:spacing w:before="240"/>
    <w:ind w:left="900"/>
  </w:pPr>
  <w:r><w:t>Bullet item</w:t></w:r>
</w:p>
```

### Tables
```xml
<w:tbl>
  <w:tblPr>
    <w:tblStyle w:val="TableGrid"/>
    <w:tblW w:w="0" w:type="auto"/>
  </w:tblPr>
  <w:tblGrid>
    <w:gridCol w:w="4675"/><w:gridCol w:w="4675"/>
  </w:tblGrid>
  <w:tr>
    <w:tc>
      <w:tcPr><w:tcW w:w="4675" w:type="dxa"/></w:tcPr>
      <w:p><w:r><w:t>Cell 1</w:t></w:r></w:p>
    </w:tc>
    <w:tc>
      <w:tcPr><w:tcW w:w="4675" w:type="dxa"/></w:tcPr>
      <w:p><w:r><w:t>Cell 2</w:t></w:r></w:p>
    </w:tc>
  </w:tr>
</w:tbl>
```

### Layout
```xml
<!-- Page break before new section (common pattern) -->
<w:p>
  <w:r>
    <w:br w:type="page"/>
  </w:r>
</w:p>
<w:p>
  <w:pPr>
    <w:pStyle w:val="Heading1"/>
  </w:pPr>
  <w:r>
    <w:t>New Section Title</w:t>
  </w:r>
</w:p>

<!-- Centered paragraph -->
<w:p>
  <w:pPr>
    <w:spacing w:before="240" w:after="0"/>
    <w:jc w:val="center"/>
  </w:pPr>
  <w:r><w:t>Centered text</w:t></w:r>
</w:p>

<!-- Font change - paragraph level (applies to all runs) -->
<w:p>
  <w:pPr>
    <w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/></w:rPr>
  </w:pPr>
  <w:r><w:t>Monospace text</w:t></w:r>
</w:p>

<!-- Font change - run level (specific to this text) -->
<w:p>
  <w:r>
    <w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/></w:rPr>
    <w:t>This text is Courier New</w:t>
  </w:r>
  <w:r><w:t> and this text uses default font</w:t></w:r>
</w:p>
```

## File Updates

When adding content, update these files:

**`word/_rels/document.xml.rels`:**
```xml
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
```

**`[Content_Types].xml`:**
```xml
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
```

### Images
**CRITICAL**: Calculate dimensions to prevent page overflow and maintain aspect ratio.

```xml
<!-- Minimal required structure -->
<w:p>
  <w:r>
    <w:drawing>
      <wp:inline>
        <wp:extent cx="2743200" cy="1828800"/>
        <wp:docPr id="1" name="Picture 1"/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr>
                <pic:cNvPr id="0" name="image1.png"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="rId5"/>
                <!-- Add for stretch fill with aspect ratio preservation -->
                <a:stretch>
                  <a:fillRect/>
                </a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm>
                  <a:ext cx="2743200" cy="1828800"/>
                </a:xfrm>
                <a:prstGeom prst="rect"/>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>
```

### Links (Hyperlinks)

**IMPORTANT**: All hyperlinks (both internal and external) require the Hyperlink style to be defined in styles.xml. Without this style, links will look like regular text instead of blue underlined clickable links.

**External Links:**
```xml
<!-- In document.xml -->
<w:hyperlink r:id="rId5">
  <w:r>
    <w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr>
    <w:t>Link Text</w:t>
  </w:r>
</w:hyperlink>

<!-- In word/_rels/document.xml.rels -->
<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" 
              Target="https://www.example.com/" TargetMode="External"/>
```

**Internal Links:**

```xml
<!-- Link to bookmark -->
<w:hyperlink w:anchor="myBookmark">
  <w:r>
    <w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr>
    <w:t>Link Text</w:t>
  </w:r>
</w:hyperlink>

<!-- Bookmark target -->
<w:bookmarkStart w:id="0" w:name="myBookmark"/>
<w:r><w:t>Target content</w:t></w:r>
<w:bookmarkEnd w:id="0"/>
```

**Hyperlink Style (required in styles.xml):**
```xml
<w:style w:type="character" w:styleId="Hyperlink">
  <w:name w:val="Hyperlink"/>
  <w:basedOn w:val="DefaultParagraphFont"/>
  <w:uiPriority w:val="99"/>
  <w:unhideWhenUsed/>
  <w:rPr>
    <w:color w:val="467886" w:themeColor="hyperlink"/>
    <w:u w:val="single"/>
  </w:rPr>
</w:style>
```

## Document Library (Python)

Use the Document class from `scripts/document.py` for all tracked changes and comments. It automatically handles infrastructure setup (people.xml, RSIDs, settings.xml, comment files, relationships, content types). Only use direct XML manipulation for complex scenarios not supported by the library.

**Working with Unicode and Entities:**
- **Searching**: Both entity notation and Unicode characters work - `contains="&#8220;Company"` and `contains="\u201cCompany"` find the same text
- **Replacing**: Use either entities (`&#8220;`) or Unicode (`\u201c`) - both work and will be converted appropriately based on the file's encoding (ascii → entities, utf-8 → Unicode)

### Initialization

**Find the docx skill root** (directory containing `scripts/` and `ooxml/`):
```bash
# Search for document.py to locate the skill root
# Note: /mnt/skills is used here as an example; check your context for the actual location
find /mnt/skills -name "document.py" -path "*/docx/scripts/*" 2>/dev/null | head -1
# Example output: /mnt/skills/docx/scripts/document.py
# Skill root is: /mnt/skills/docx
```

**Run your script with PYTHONPATH** set to the docx skill root:
```bash
PYTHONPATH=/mnt/skills/docx python your_script.py
```

**In your script**, import from the skill root:
```python
from scripts.document import Document, DocxXMLEditor

# Basic initialization (automatically creates temp copy and sets up infrastructure)
doc = Document('unpacked')

# Customize author and initials
doc = Document('unpacked', author="John Doe", initials="JD")

# Enable track revisions mode
doc = Document('unpacked', track_revisions=True)

# Specify custom RSID (auto-generated if not provided)
doc = Document('unpacked', rsid="07DC5ECB")
```

### Creating Tracked Changes

**CRITICAL**: Only mark text that actually changes. Keep ALL unchanged text outside `<w:del>`/`<w:ins>` tags. Marking unchanged text makes edits unprofessional and harder to review.

**Attribute Handling**: The Document class auto-injects attributes (w:id, w:date, w:rsidR, w:rsidDel, w16du:dateUtc, xml:space) into new elements. When preserving unchanged text from the original document, copy the original `<w:r>` element with its existing attributes to maintain document integrity.

**Method Selection Guide**:
- **Adding your own changes to regular text**: Use `replace_node()` with `<w:del>`/`<w:ins>` tags, or `suggest_deletion()` for removing entire `<w:r>` or `<w:p>` elements
- **Partially modifying another author's tracked change**: Use `replace_node()` to nest your changes inside their `<w:ins>`/`<w:del>`
- **Completely rejecting another author's insertion**: Use `revert_insertion()` on the `<w:ins>` element (NOT `suggest_deletion()`)
- **Completely rejecting another author's deletion**: Use `revert_deletion()` on the `<w:del>` element to restore deleted content using tracked changes

```python
# Minimal edit - change one word: "The report is monthly" → "The report is quarterly"
# Original: <w:r w:rsidR="00AB12CD"><w:rPr><w:rFonts w:ascii="Calibri"/></w:rPr><w:t>The report is monthly</w:t></w:r>
node = doc["word/document.xml"].get_node(tag="w:r", contains="The report is monthly")
rpr = tags[0].toxml() if (tags := node.getElementsByTagName("w:rPr")) else ""
replacement = f'<w:r w:rsidR="00AB12CD">{rpr}<w:t>The report is </w:t></w:r><w:del><w:r>{rpr}<w:delText>monthly</w:delText></w:r></w:del><w:ins><w:r>{rpr}<w:t>quarterly</w:t></w:r></w:ins>'
doc["word/document.xml"].replace_node(node, replacement)

# Minimal edit - change number: "within 30 days" → "within 45 days"
# Original: <w:r w:rsidR="00XYZ789"><w:rPr><w:rFonts w:ascii="Calibri"/></w:rPr><w:t>within 30 days</w:t></w:r>
node = doc["word/document.xml"].get_node(tag="w:r", contains="within 30 days")
rpr = tags[0].toxml() if (tags := node.getElementsByTagName("w:rPr")) else ""
replacement = f'<w:r w:rsidR="00XYZ789">{rpr}<w:t>within </w:t></w:r><w:del><w:r>{rpr}<w:delText>30</w:delText></w:r></w:del><w:ins><w:r>{rpr}<w:t>45</w:t></w:r></w:ins><w:r w:rsidR="00XYZ789">{rpr}<w:t> days</w:t></w:r>'
doc["word/document.xml"].replace_node(node, replacement)

# Complete replacement - preserve formatting even when replacing all text
node = doc["word/document.xml"].get_node(tag="w:r", contains="apple")
rpr = tags[0].toxml() if (tags := node.getElementsByTagName("w:rPr")) else ""
replacement = f'<w:del><w:r>{rpr}<w:delText>apple</w:delText></w:r></w:del><w:ins><w:r>{rpr}<w:t>banana orange</w:t></w:r></w:ins>'
doc["word/document.xml"].replace_node(node, replacement)

# Insert new content (no attributes needed - auto-injected)
node = doc["word/document.xml"].get_node(tag="w:r", contains="existing text")
doc["word/document.xml"].insert_after(node, '<w:ins><w:r><w:t>new text</w:t></w:r></w:ins>')

# Partially delete another author's insertion
# Original: <w:ins w:author="Jane Smith" w:date="..."><w:r><w:t>quarterly financial report</w:t></w:r></w:ins>
# Goal: Delete only "financial" to make it "quarterly report"
node = doc["word/document.xml"].get_node(tag="w:ins", attrs={"w:id": "5"})
# IMPORTANT: Preserve w:author="Jane Smith" on the outer <w:ins> to maintain authorship
replacement = '''<w:ins w:author="Jane Smith" w:date="2025-01-15T10:00:00Z">
  <w:r><w:t>quarterly </w:t></w:r>
  <w:del><w:r><w:delText>financial </w:delText></w:r></w:del>
  <w:r><w:t>report</w:t></w:r>
</w:ins>'''
doc["word/document.xml"].replace_node(node, replacement)

# Change part of another author's insertion
# Original: <w:ins w:author="Jane Smith"><w:r><w:t>in silence, safe and sound</w:t></w:r></w:ins>
# Goal: Change "safe and sound" to "soft and unbound"
node = doc["word/document.xml"].get_node(tag="w:ins", attrs={"w:id": "8"})
replacement = f'''<w:ins w:author="Jane Smith" w:date="2025-01-15T10:00:00Z">
  <w:r><w:t>in silence, </w:t></w:r>
</w:ins>
<w:ins>
  <w:r><w:t>soft and unbound</w:t></w:r>
</w:ins>
<w:ins w:author="Jane Smith" w:date="2025-01-15T10:00:00Z">
  <w:del><w:r><w:delText>safe and sound</w:delText></w:r></w:del>
</w:ins>'''
doc["word/document.xml"].replace_node(node, replacement)

# Delete entire run (use only when deleting all content; use replace_node for partial deletions)
node = doc["word/document.xml"].get_node(tag="w:r", contains="text to delete")
doc["word/document.xml"].suggest_deletion(node)

# Delete entire paragraph (in-place, handles both regular and numbered list paragraphs)
para = doc["word/document.xml"].get_node(tag="w:p", contains="paragraph to delete")
doc["word/document.xml"].suggest_deletion(para)

# Add new numbered list item
target_para = doc["word/document.xml"].get_node(tag="w:p", contains="existing list item")
pPr = tags[0].toxml() if (tags := target_para.getElementsByTagName("w:pPr")) else ""
new_item = f'<w:p>{pPr}<w:r><w:t>New item</w:t></w:r></w:p>'
tracked_para = DocxXMLEditor.suggest_paragraph(new_item)
doc["word/document.xml"].insert_after(target_para, tracked_para)
# Optional: add spacing paragraph before content for better visual separation
# spacing = DocxXMLEditor.suggest_paragraph('<w:p><w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr></w:p>')
# doc["word/document.xml"].insert_after(target_para, spacing + tracked_para)
```

### Adding Comments

```python
# Add comment spanning two existing tracked changes
# Note: w:id is auto-generated. Only search by w:id if you know it from XML inspection
start_node = doc["word/document.xml"].get_node(tag="w:del", attrs={"w:id": "1"})
end_node = doc["word/document.xml"].get_node(tag="w:ins", attrs={"w:id": "2"})
doc.add_comment(start=start_node, end=end_node, text="Explanation of this change")

# Add comment on a paragraph
para = doc["word/document.xml"].get_node(tag="w:p", contains="paragraph text")
doc.add_comment(start=para, end=para, text="Comment on this paragraph")

# Add comment on newly created tracked change
# First create the tracked change
node = doc["word/document.xml"].get_node(tag="w:r", contains="old")
new_nodes = doc["word/document.xml"].replace_node(
    node,
    '<w:del><w:r><w:delText>old</w:delText></w:r></w:del><w:ins><w:r><w:t>new</w:t></w:r></w:ins>'
)
# Then add comment on the newly created elements
# new_nodes[0] is the <w:del>, new_nodes[1] is the <w:ins>
doc.add_comment(start=new_nodes[0], end=new_nodes[1], text="Changed old to new per requirements")

# Reply to existing comment
doc.reply_to_comment(parent_comment_id=0, text="I agree with this change")
```

### Rejecting Tracked Changes

**IMPORTANT**: Use `revert_insertion()` to reject insertions and `revert_deletion()` to restore deletions using tracked changes. Use `suggest_deletion()` only for regular unmarked content.

```python
# Reject insertion (wraps it in deletion)
# Use this when another author inserted text that you want to delete
ins = doc["word/document.xml"].get_node(tag="w:ins", attrs={"w:id": "5"})
nodes = doc["word/document.xml"].revert_insertion(ins)  # Returns [ins]

# Reject deletion (creates insertion to restore deleted content)
# Use this when another author deleted text that you want to restore
del_elem = doc["word/document.xml"].get_node(tag="w:del", attrs={"w:id": "3"})
nodes = doc["word/document.xml"].revert_deletion(del_elem)  # Returns [del_elem, new_ins]

# Reject all insertions in a paragraph
para = doc["word/document.xml"].get_node(tag="w:p", contains="paragraph text")
nodes = doc["word/document.xml"].revert_insertion(para)  # Returns [para]

# Reject all deletions in a paragraph
para = doc["word/document.xml"].get_node(tag="w:p", contains="paragraph text")
nodes = doc["word/document.xml"].revert_deletion(para)  # Returns [para]
```

### Inserting Images

**CRITICAL**: The Document class works with a temporary copy at `doc.unpacked_path`. Always copy images to this temp directory, not the original unpacked folder.

```python
from PIL import Image
import shutil, os

# Initialize document first
doc = Document('unpacked')

# Copy image and calculate full-width dimensions with aspect ratio
media_dir = os.path.join(doc.unpacked_path, 'word/media')
os.makedirs(media_dir, exist_ok=True)
shutil.copy('image.png', os.path.join(media_dir, 'image1.png'))
img = Image.open(os.path.join(media_dir, 'image1.png'))
width_emus = int(6.5 * 914400)  # 6.5" usable width, 914400 EMUs/inch
height_emus = int(width_emus * img.size[1] / img.size[0])

# Add relationship and content type
rels_editor = doc['word/_rels/document.xml.rels']
next_rid = rels_editor.get_next_rid()
rels_editor.append_to(rels_editor.dom.documentElement,
    f'<Relationship Id="{next_rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>')
doc['[Content_Types].xml'].append_to(doc['[Content_Types].xml'].dom.documentElement,
    '<Default Extension="png" ContentType="image/png"/>')

# Insert image
node = doc["word/document.xml"].get_node(tag="w:p", line_number=100)
doc["word/document.xml"].insert_after(node, f'''<w:p>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="{width_emus}" cy="{height_emus}"/>
        <wp:docPr id="1" name="Picture 1"/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr><pic:cNvPr id="1" name="image1.png"/><pic:cNvPicPr/></pic:nvPicPr>
              <pic:blipFill><a:blip r:embed="{next_rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
              <pic:spPr><a:xfrm><a:ext cx="{width_emus}" cy="{height_emus}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>''')
```

### Getting Nodes

```python
# By text content
node = doc["word/document.xml"].get_node(tag="w:p", contains="specific text")

# By line range
para = doc["word/document.xml"].get_node(tag="w:p", line_number=range(100, 150))

# By attributes
node = doc["word/document.xml"].get_node(tag="w:del", attrs={"w:id": "1"})

# By exact line number (must be line number where tag opens)
para = doc["word/document.xml"].get_node(tag="w:p", line_number=42)

# Combine filters
node = doc["word/document.xml"].get_node(tag="w:r", line_number=range(40, 60), contains="text")

# Disambiguate when text appears multiple times - add line_number range
node = doc["word/document.xml"].get_node(tag="w:r", contains="Section", line_number=range(2400, 2500))
```

### Saving

```python
# Save with automatic validation (copies back to original directory)
doc.save()  # Validates by default, raises error if validation fails

# Save to different location
doc.save('modified-unpacked')

# Skip validation (debugging only - needing this in production indicates XML issues)
doc.save(validate=False)
```

### Direct DOM Manipulation

For complex scenarios not covered by the library:

```python
# Access any XML file
editor = doc["word/document.xml"]
editor = doc["word/comments.xml"]

# Direct DOM access (defusedxml.minidom.Document)
node = doc["word/document.xml"].get_node(tag="w:p", line_number=5)
parent = node.parentNode
parent.removeChild(node)
parent.appendChild(node)  # Move to end

# General document manipulation (without tracked changes)
old_node = doc["word/document.xml"].get_node(tag="w:p", contains="original text")
doc["word/document.xml"].replace_node(old_node, "<w:p><w:r><w:t>replacement text</w:t></w:r></w:p>")

# Multiple insertions - use return value to maintain order
node = doc["word/document.xml"].get_node(tag="w:r", line_number=100)
nodes = doc["word/document.xml"].insert_after(node, "<w:r><w:t>A</w:t></w:r>")
nodes = doc["word/document.xml"].insert_after(nodes[-1], "<w:r><w:t>B</w:t></w:r>")
nodes = doc["word/document.xml"].insert_after(nodes[-1], "<w:r><w:t>C</w:t></w:r>")
# Results in: original_node, A, B, C
```

## Tracked Changes (Redlining)

**Use the Document class above for all tracked changes.** The patterns below are for reference when constructing replacement XML strings.

### Validation Rules
The validator checks that the document text matches the original after reverting Claude's changes. This means:
- **NEVER modify text inside another author's `<w:ins>` or `<w:del>` tags**
- **ALWAYS use nested deletions** to remove another author's insertions
- **Every edit must be properly tracked** with `<w:ins>` or `<w:del>` tags

### Tracked Change Patterns

**CRITICAL RULES**:
1. Never modify the content inside another author's tracked changes. Always use nested deletions.
2. **XML Structure**: Always place `<w:del>` and `<w:ins>` at paragraph level containing complete `<w:r>` elements. Never nest inside `<w:r>` elements - this creates invalid XML that breaks document processing.

**Text Insertion:**
```xml
<w:ins w:id="1" w:author="Claude" w:date="2025-07-30T23:05:00Z" w16du:dateUtc="2025-07-31T06:05:00Z">
  <w:r w:rsidR="00792858">
    <w:t>inserted text</w:t>
  </w:r>
</w:ins>
```

**Text Deletion:**
```xml
<w:del w:id="2" w:author="Claude" w:date="2025-07-30T23:05:00Z" w16du:dateUtc="2025-07-31T06:05:00Z">
  <w:r w:rsidDel="00792858">
    <w:delText>deleted text</w:delText>
  </w:r>
</w:del>
```

**Deleting Another Author's Insertion (MUST use nested structure):**
```xml
<!-- Nest deletion inside the original insertion -->
<w:ins w:author="Jane Smith" w:id="16">
  <w:del w:author="Claude" w:id="40">
    <w:r><w:delText>monthly</w:delText></w:r>
  </w:del>
</w:ins>
<w:ins w:author="Claude" w:id="41">
  <w:r><w:t>weekly</w:t></w:r>
</w:ins>
```

**Restoring Another Author's Deletion:**
```xml
<!-- Leave their deletion unchanged, add new insertion after it -->
<w:del w:author="Jane Smith" w:id="50">
  <w:r><w:delText>within 30 days</w:delText></w:r>
</w:del>
<w:ins w:author="Claude" w:id="51">
  <w:r><w:t>within 30 days</w:t></w:r>
</w:ins>
```