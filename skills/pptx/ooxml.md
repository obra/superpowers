# Office Open XML Technical Reference for PowerPoint

**Important: Read this entire document before starting.** Critical XML schema rules and formatting requirements are covered throughout. Incorrect implementation can create invalid PPTX files that PowerPoint cannot open.

## Technical Guidelines

### Schema Compliance
- **Element ordering in `<p:txBody>`**: `<a:bodyPr>`, `<a:lstStyle>`, `<a:p>`
- **Whitespace**: Add `xml:space='preserve'` to `<a:t>` elements with leading/trailing spaces
- **Unicode**: Escape characters in ASCII content: `"` becomes `&#8220;`
- **Images**: Add to `ppt/media/`, reference in slide XML, set dimensions to fit slide bounds
- **Relationships**: Update `ppt/slides/_rels/slideN.xml.rels` for each slide's resources
- **Dirty attribute**: Add `dirty="0"` to `<a:rPr>` and `<a:endParaRPr>` elements to indicate clean state

## Presentation Structure

### Basic Slide Structure
```xml
<!-- ppt/slides/slide1.xml -->
<p:sld>
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>...</p:nvGrpSpPr>
      <p:grpSpPr>...</p:grpSpPr>
      <!-- Shapes go here -->
    </p:spTree>
  </p:cSld>
</p:sld>
```

### Text Box / Shape with Text
```xml
<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="2" name="Title"/>
    <p:cNvSpPr>
      <a:spLocks noGrp="1"/>
    </p:cNvSpPr>
    <p:nvPr>
      <p:ph type="ctrTitle"/>
    </p:nvPr>
  </p:nvSpPr>
  <p:spPr>
    <a:xfrm>
      <a:off x="838200" y="365125"/>
      <a:ext cx="7772400" cy="1470025"/>
    </a:xfrm>
  </p:spPr>
  <p:txBody>
    <a:bodyPr/>
    <a:lstStyle/>
    <a:p>
      <a:r>
        <a:t>Slide Title</a:t>
      </a:r>
    </a:p>
  </p:txBody>
</p:sp>
```

### Text Formatting
```xml
<!-- Bold -->
<a:r>
  <a:rPr b="1"/>
  <a:t>Bold Text</a:t>
</a:r>

<!-- Italic -->
<a:r>
  <a:rPr i="1"/>
  <a:t>Italic Text</a:t>
</a:r>

<!-- Underline -->
<a:r>
  <a:rPr u="sng"/>
  <a:t>Underlined</a:t>
</a:r>

<!-- Highlight -->
<a:r>
  <a:rPr>
    <a:highlight>
      <a:srgbClr val="FFFF00"/>
    </a:highlight>
  </a:rPr>
  <a:t>Highlighted Text</a:t>
</a:r>

<!-- Font and Size -->
<a:r>
  <a:rPr sz="2400" typeface="Arial">
    <a:solidFill>
      <a:srgbClr val="FF0000"/>
    </a:solidFill>
  </a:rPr>
  <a:t>Colored Arial 24pt</a:t>
</a:r>

<!-- Complete formatting example -->
<a:r>
  <a:rPr lang="en-US" sz="1400" b="1" dirty="0">
    <a:solidFill>
      <a:srgbClr val="FAFAFA"/>
    </a:solidFill>
  </a:rPr>
  <a:t>Formatted text</a:t>
</a:r>
```

### Lists
```xml
<!-- Bullet list -->
<a:p>
  <a:pPr lvl="0">
    <a:buChar char="•"/>
  </a:pPr>
  <a:r>
    <a:t>First bullet point</a:t>
  </a:r>
</a:p>

<!-- Numbered list -->
<a:p>
  <a:pPr lvl="0">
    <a:buAutoNum type="arabicPeriod"/>
  </a:pPr>
  <a:r>
    <a:t>First numbered item</a:t>
  </a:r>
</a:p>

<!-- Second level indent -->
<a:p>
  <a:pPr lvl="1">
    <a:buChar char="•"/>
  </a:pPr>
  <a:r>
    <a:t>Indented bullet</a:t>
  </a:r>
</a:p>
```

### Shapes
```xml
<!-- Rectangle -->
<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="3" name="Rectangle"/>
    <p:cNvSpPr/>
    <p:nvPr/>
  </p:nvSpPr>
  <p:spPr>
    <a:xfrm>
      <a:off x="1000000" y="1000000"/>
      <a:ext cx="3000000" cy="2000000"/>
    </a:xfrm>
    <a:prstGeom prst="rect">
      <a:avLst/>
    </a:prstGeom>
    <a:solidFill>
      <a:srgbClr val="FF0000"/>
    </a:solidFill>
    <a:ln w="25400">
      <a:solidFill>
        <a:srgbClr val="000000"/>
      </a:solidFill>
    </a:ln>
  </p:spPr>
</p:sp>

<!-- Rounded Rectangle -->
<p:sp>
  <p:spPr>
    <a:prstGeom prst="roundRect">
      <a:avLst/>
    </a:prstGeom>
  </p:spPr>
</p:sp>

<!-- Circle/Ellipse -->
<p:sp>
  <p:spPr>
    <a:prstGeom prst="ellipse">
      <a:avLst/>
    </a:prstGeom>
  </p:spPr>
</p:sp>
```

### Images
```xml
<p:pic>
  <p:nvPicPr>
    <p:cNvPr id="4" name="Picture">
      <a:hlinkClick r:id="" action="ppaction://media"/>
    </p:cNvPr>
    <p:cNvPicPr>
      <a:picLocks noChangeAspect="1"/>
    </p:cNvPicPr>
    <p:nvPr/>
  </p:nvPicPr>
  <p:blipFill>
    <a:blip r:embed="rId2"/>
    <a:stretch>
      <a:fillRect/>
    </a:stretch>
  </p:blipFill>
  <p:spPr>
    <a:xfrm>
      <a:off x="1000000" y="1000000"/>
      <a:ext cx="3000000" cy="2000000"/>
    </a:xfrm>
    <a:prstGeom prst="rect">
      <a:avLst/>
    </a:prstGeom>
  </p:spPr>
</p:pic>
```

### Tables
```xml
<p:graphicFrame>
  <p:nvGraphicFramePr>
    <p:cNvPr id="5" name="Table"/>
    <p:cNvGraphicFramePr>
      <a:graphicFrameLocks noGrp="1"/>
    </p:cNvGraphicFramePr>
    <p:nvPr/>
  </p:nvGraphicFramePr>
  <p:xfrm>
    <a:off x="1000000" y="1000000"/>
    <a:ext cx="6000000" cy="2000000"/>
  </p:xfrm>
  <a:graphic>
    <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
      <a:tbl>
        <a:tblGrid>
          <a:gridCol w="3000000"/>
          <a:gridCol w="3000000"/>
        </a:tblGrid>
        <a:tr h="500000">
          <a:tc>
            <a:txBody>
              <a:bodyPr/>
              <a:lstStyle/>
              <a:p>
                <a:r>
                  <a:t>Cell 1</a:t>
                </a:r>
              </a:p>
            </a:txBody>
          </a:tc>
          <a:tc>
            <a:txBody>
              <a:bodyPr/>
              <a:lstStyle/>
              <a:p>
                <a:r>
                  <a:t>Cell 2</a:t>
                </a:r>
              </a:p>
            </a:txBody>
          </a:tc>
        </a:tr>
      </a:tbl>
    </a:graphicData>
  </a:graphic>
</p:graphicFrame>
```

### Slide Layouts

```xml
<!-- Title Slide Layout -->
<p:sp>
  <p:nvSpPr>
    <p:nvPr>
      <p:ph type="ctrTitle"/>
    </p:nvPr>
  </p:nvSpPr>
  <!-- Title content -->
</p:sp>

<p:sp>
  <p:nvSpPr>
    <p:nvPr>
      <p:ph type="subTitle" idx="1"/>
    </p:nvPr>
  </p:nvSpPr>
  <!-- Subtitle content -->
</p:sp>

<!-- Content Slide Layout -->
<p:sp>
  <p:nvSpPr>
    <p:nvPr>
      <p:ph type="title"/>
    </p:nvPr>
  </p:nvSpPr>
  <!-- Slide title -->
</p:sp>

<p:sp>
  <p:nvSpPr>
    <p:nvPr>
      <p:ph type="body" idx="1"/>
    </p:nvPr>
  </p:nvSpPr>
  <!-- Content body -->
</p:sp>
```

## File Updates

When adding content, update these files:

**`ppt/_rels/presentation.xml.rels`:**
```xml
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
```

**`ppt/slides/_rels/slide1.xml.rels`:**
```xml
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>
```

**`[Content_Types].xml`:**
```xml
<Default Extension="png" ContentType="image/png"/>
<Default Extension="jpg" ContentType="image/jpeg"/>
<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
```

**`ppt/presentation.xml`:**
```xml
<p:sldIdLst>
  <p:sldId id="256" r:id="rId1"/>
  <p:sldId id="257" r:id="rId2"/>
</p:sldIdLst>
```

**`docProps/app.xml`:** Update slide count and statistics
```xml
<Slides>2</Slides>
<Paragraphs>10</Paragraphs>
<Words>50</Words>
```

## Slide Operations

### Adding a New Slide
When adding a slide to the end of the presentation:

1. **Create the slide file** (`ppt/slides/slideN.xml`)
2. **Update `[Content_Types].xml`**: Add Override for the new slide
3. **Update `ppt/_rels/presentation.xml.rels`**: Add relationship for the new slide
4. **Update `ppt/presentation.xml`**: Add slide ID to `<p:sldIdLst>`
5. **Create slide relationships** (`ppt/slides/_rels/slideN.xml.rels`) if needed
6. **Update `docProps/app.xml`**: Increment slide count and update statistics (if present)

### Duplicating a Slide
1. Copy the source slide XML file with a new name
2. Update all IDs in the new slide to be unique
3. Follow the "Adding a New Slide" steps above
4. **CRITICAL**: Remove or update any notes slide references in `_rels` files
5. Remove references to unused media files

### Reordering Slides
1. **Update `ppt/presentation.xml`**: Reorder `<p:sldId>` elements in `<p:sldIdLst>`
2. The order of `<p:sldId>` elements determines slide order
3. Keep slide IDs and relationship IDs unchanged

Example:
```xml
<!-- Original order -->
<p:sldIdLst>
  <p:sldId id="256" r:id="rId2"/>
  <p:sldId id="257" r:id="rId3"/>
  <p:sldId id="258" r:id="rId4"/>
</p:sldIdLst>

<!-- After moving slide 3 to position 2 -->
<p:sldIdLst>
  <p:sldId id="256" r:id="rId2"/>
  <p:sldId id="258" r:id="rId4"/>
  <p:sldId id="257" r:id="rId3"/>
</p:sldIdLst>
```

### Deleting a Slide
1. **Remove from `ppt/presentation.xml`**: Delete the `<p:sldId>` entry
2. **Remove from `ppt/_rels/presentation.xml.rels`**: Delete the relationship
3. **Remove from `[Content_Types].xml`**: Delete the Override entry
4. **Delete files**: Remove `ppt/slides/slideN.xml` and `ppt/slides/_rels/slideN.xml.rels`
5. **Update `docProps/app.xml`**: Decrement slide count and update statistics
6. **Clean up unused media**: Remove orphaned images from `ppt/media/`

Note: Don't renumber remaining slides - keep their original IDs and filenames.


## Common Errors to Avoid

- **Encodings**: Escape unicode characters in ASCII content: `"` becomes `&#8220;`
- **Images**: Add to `ppt/media/` and update relationship files
- **Lists**: Omit bullets from list headers
- **IDs**: Use valid hexadecimal values for UUIDs
- **Themes**: Check all themes in `theme` directory for colors

## Validation Checklist for Template-Based Presentations

### Before Packing, Always:
- **Clean unused resources**: Remove unreferenced media, fonts, and notes directories
- **Fix Content_Types.xml**: Declare ALL slides, layouts, and themes present in the package
- **Fix relationship IDs**: 
   - Remove font embed references if not using embedded fonts
- **Remove broken references**: Check all `_rels` files for references to deleted resources

### Common Template Duplication Pitfalls:
- Multiple slides referencing the same notes slide after duplication
- Image/media references from template slides that no longer exist
- Font embedding references when fonts aren't included
- Missing slideLayout declarations for layouts 12-25
- docProps directory may not unpack - this is optional