# Quantity Surveying OpenCV Agents - User Guide

## 📚 **Overview**

This guide provides comprehensive instructions for using the Quantity Surveying OpenCV Agents system to analyze construction drawings and extract quantities automatically.

## 🎯 **Getting Started**

### **Prerequisites**
- Access to ConstructAI platform
- Quantity Surveying module enabled
- Supported drawing formats: PDF, PNG, JPG, DWG
- Minimum recommended resolution: 1920x1080

### **System Access**
1. Log in to ConstructAI platform
2. Navigate to **02025 - Quantity Surveying** page
3. Verify your user permissions include drawing analysis access

## 📤 **Uploading Drawings**

### **Step 1: Select Drawings**
```
1. Click "Upload Drawing" button
2. Select one or multiple drawing files
3. Supported formats:
   - PDF (vector or raster)
   - PNG/JPG (high resolution preferred)
   - DWG (AutoCAD format)
4. Maximum file size: 50MB per drawing
5. Recommended: 300 DPI or higher
```

### **Step 2: Drawing Validation**
The system automatically validates:
- ✅ File format compatibility
- ✅ Resolution quality
- ✅ Drawing completeness
- ✅ Metadata extraction

**Validation Results:**
- 🟢 **Green**: Ready for processing
- 🟡 **Yellow**: Warning - may affect accuracy
- 🔴 **Red**: Error - requires correction

### **Step 3: Metadata Review**
Review and confirm:
- Drawing title
- Project information
- Scale detection
- Drawing type (floor plan, elevation, etc.)

## 🤖 **AI Model: Kimi K2.5 Multimodal Vision**

> **Updated February 2026** — The drawing analysis engine now uses **Kimi K2.5** (Moonshot AI, `moonshot-v1-8k`) as the primary vision-language model, replacing the previous Qwen VL model.

### **What Kimi K2.5 Provides**
| Capability | Detail |
|---|---|
| **Model** | Kimi K2.5 (`moonshot-v1-8k`) |
| **Provider** | Moonshot AI |
| **Vision** | Multimodal — reads drawings, annotations, symbols |
| **Language** | Extracts and interprets dimension text, legends, notes |
| **Accuracy** | Improved confidence scores on complex architectural drawings |
| **Fallback** | OpenCV + Tesseract OCR for pre-processing and symbol detection |

### **How It Works in the Pipeline**
```
Drawing Upload → OpenCV Pre-processing → Kimi K2.5 Analysis → Quantity Extraction → Review
```
- **OpenCV**: Detects edges, contours, and structural elements
- **Tesseract OCR**: Extracts raw text from annotations
- **Kimi K2.5**: Interprets context, resolves ambiguities, calculates quantities

---

## 🔄 **Analysis Process**

### **Automated Analysis Workflow**

```
Upload → Validation → Detection → Extraction → Calculation → Review
  ↓         ↓           ↓           ↓            ↓            ↓
Files   Quality     Objects    Measurements  Quantities   Results
        Check       Detection   Extraction    Calculation  Dashboard
```

### **Real-time Progress Tracking**
Monitor analysis progress through:
1. **Progress Bar**: Overall completion percentage
2. **Stage Indicators**: Current processing stage
3. **Live Updates**: Streaming results as they're processed
4. **Estimated Time**: Completion time estimate

### **Analysis Stages**

#### **Stage 1: Object Detection (20-30 seconds)**
- Identifies walls, doors, windows, fixtures
- Detects measurement annotations
- Recognizes symbols and legends

#### **Stage 2: Measurement Extraction (15-25 seconds)**
- Extracts dimensions from annotations
- Calculates scale factors
- Validates measurement consistency

#### **Stage 3: Quantity Calculation (10-20 seconds)**
- Computes areas, volumes, lengths
- Aggregates quantities by category
- Applies unit conversions

#### **Stage 4: Quality Validation (5-10 seconds)**
- Verifies calculation accuracy
- Checks for anomalies
- Generates confidence scores

## 📊 **Understanding Results**

### **Results Dashboard**

#### **Summary View**
```
┌─────────────────────────────────────────┐
│ Drawing: Floor Plan Level 1             │
│ Status: ✅ Analysis Complete            │
│ Confidence: 94%                         │
│ Processing Time: 1m 23s                 │
├─────────────────────────────────────────┤
│ Total Floor Area: 2,450 m²             │
│ Wall Length: 285 m                      │
│ Doors: 24 units                         │
│ Windows: 36 units                       │
└─────────────────────────────────────────┘
```

#### **Detailed Breakdown**
- **By Category**: Quantities grouped by trade
- **By Location**: Room-by-room breakdown
- **By Element**: Individual component details
- **By Material**: Material-specific quantities

### **Confidence Scores**

| Score | Meaning | Action Required |
|-------|---------|----------------|
| **90-100%** | 🟢 High Confidence | Accept results |
| **75-89%** | 🟡 Medium Confidence | Review recommended |
| **60-74%** | 🟠 Low Confidence | Manual verification required |
| **Below 60%** | 🔴 Very Low | Re-analyze or manual input |

### **Interactive Results**

#### **Visual Overlay**
- Hover over quantities to highlight source areas
- Click elements to view detailed measurements
- Toggle different detection layers (walls, openings, fixtures)

#### **Export Options**
```
Available Formats:
✅ Excel (.xlsx) - Detailed quantity schedule
✅ CSV (.csv) - Raw data export
✅ PDF Report - Professional formatted report
✅ BQ Format - Bill of Quantities format
✅ JSON - API integration format
```

## 🔍 **Reviewing & Editing Results**

### **Manual Review Process**

#### **1. Visual Verification**
- Compare detected objects with original drawing
- Verify measurements against annotations
- Check for missed or incorrect detections

#### **2. Edit Quantities**
```
To edit a quantity:
1. Click on the quantity value
2. Enter corrected value
3. Add note explaining correction
4. Save changes
```

#### **3. Add Missing Items**
```
To add missed items:
1. Click "Add Item" button
2. Select category and type
3. Enter quantity and measurements
4. Mark as "Manual Entry"
5. Save
```

#### **4. Flag Issues**
```
If you find systematic issues:
1. Click "Report Issue" button
2. Select issue type
3. Provide description
4. Attach screenshot if helpful
5. Submit for review
```

## 🎓 **Best Practices**

### **Drawing Preparation**
✅ **DO:**
- Use high-resolution scans (300 DPI minimum)
- Ensure drawings are clear and legible
- Include complete annotations and dimensions
- Provide scale information
- Use standard drawing conventions

❌ **DON'T:**
- Upload blurry or low-quality images
- Use hand-sketched drawings without clear dimensions
- Mix multiple drawings in one file
- Omit scale or dimension annotations

### **Accuracy Optimization**

#### **For Best Results:**
1. **Clean Drawings**: Remove unnecessary markups
2. **Clear Annotations**: Ensure dimensions are readable
3. **Consistent Scale**: Use standard architectural scales
4. **Complete Information**: Include all necessary details
5. **Standard Formats**: Use industry-standard drawing formats

#### **When to Use Manual Input:**
- Conceptual sketches
- Heavily marked-up drawings
- Non-standard drawing formats
- Complex 3D representations
- Custom or unique elements

## 🔧 **Common Workflows**

### **Workflow 1: Quick Estimate**
```
Purpose: Fast preliminary quantity takeoff
Time: 2-5 minutes per drawing

Steps:
1. Upload drawing
2. Quick validation
3. Accept automated results
4. Export to Excel
5. Share with stakeholders
```

### **Workflow 2: Detailed Analysis**
```
Purpose: Accurate final quantities
Time: 10-15 minutes per drawing

Steps:
1. Upload high-quality drawing
2. Thorough validation
3. Review all detected items
4. Manual verification of key quantities
5. Edit as needed
6. Generate detailed report
7. Archive with project documentation
```

### **Workflow 3: Batch Processing**
```
Purpose: Multiple drawings for large projects
Time: Variable based on drawing count

Steps:
1. Prepare all drawings
2. Upload in batches (5-10 at a time)
3. Monitor batch progress
4. Review results sequentially
5. Consolidate quantities
6. Generate master schedule
```

## 📱 **Tips & Tricks**

### **Keyboard Shortcuts**
- `Ctrl+U` - Upload new drawing
- `Ctrl+R` - Refresh results
- `Ctrl+E` - Export results
- `Ctrl+S` - Save edits
- `Ctrl+Z` - Undo last change
- `Ctrl+F` - Find/search items

### **Quick Actions**
- **Double-click** item: Edit quantity
- **Right-click** item: Context menu
- **Drag**: Select multiple items
- **Hover**: Preview details

### **Efficiency Tips**
1. Use **batch upload** for multiple drawings
2. Create **templates** for similar projects
3. Use **favorites** for frequently used categories
4. Set up **default units** in preferences
5. Enable **auto-save** for work in progress

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Issue: Low Confidence Scores**
**Solution:**
- Check drawing quality and resolution
- Verify scale is detected correctly
- Ensure annotations are clear
- Try re-uploading with better scan

#### **Issue: Missing Detections**
**Solution:**
- Check if elements are clearly visible
- Verify drawing layers are enabled
- Try adjusting detection sensitivity
- Add missing items manually

#### **Issue: Incorrect Measurements**
**Solution:**
- Verify scale factor is correct
- Check unit settings
- Review dimension annotations
- Manually correct affected items

#### **Issue: Slow Processing**
**Solution:**
- Check file size (compress if > 20MB)
- Reduce image resolution if excessive
- Process drawings in smaller batches
- Avoid peak usage times

## 📞 **Support & Resources**

### **Getting Help**
- **In-app Chat**: Click help icon (bottom right)
- **Email Support**: support@constructai.com
- **Phone**: +27 (0)12 345 6789
- **Documentation**: docs.constructai.com/quantity-surveying

### **Training Resources**
- Video tutorials: Available in Help Center
- Interactive training modules: In-platform training
- Live webinars: Monthly training sessions
- User community: forum.constructai.com

### **Feedback**
We value your feedback! Report issues or suggest improvements:
- In-app: Click "Feedback" button
- Email: feedback@constructai.com
- Feature requests: ideas.constructai.com

---

**User Guide Version**: 1.0  
**Last Updated**: 28 January 2026  
**System Version**: Phase 6 Production Release  
**Next Update**: Phase 7 Release
