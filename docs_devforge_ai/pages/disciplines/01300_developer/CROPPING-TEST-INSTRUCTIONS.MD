# Image Cropping Test Instructions

## What Was Changed
✅ System now automatically crops images to remove:
- **Bottom 15%**: Title blocks with company logos, project info
- **Top 2%**: Header text and stamps  
- **Left/Right 3%**: Side stamps and branding
- **Result**: Only pure drawing content sent to OpenAI

## Test Steps

### 1. Hard Refresh Browser
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### 2. Upload Your Floor Plan
1. Navigate to **Contracts Post-Award** page
2. Click **"Workspace"** button
3. Upload: `ZA019-BP-00-XX-DR-AR-010001-C-01_GROUND FLOOR PLAN-1.pdf`
4. Click **"Analyze Drawing"**

### 3. Watch the Analysis Result

## What You'll See

### ✅ SUCCESS (Cropping Worked)
**Analysis will contain:**
- Specific room identifications from YOUR drawing
- Actual dimensions from YOUR floor plan
- Door and window details from YOUR content
- Technical specifications from YOUR drawing
- 2000+ character detailed analysis

**Look for phrases like:**
- "The floor plan shows..."
- "Room dimensions are..."
- "There are X doors and Y windows..."
- Specific measurements and details

### ❌ STILL BLOCKED (Need to Switch to Claude)
**Analysis will contain:**
- Generic architectural guidance
- "Hybrid Analysis (Vision API blocked)" header
- Standard best practices (not your drawing)
- No specific details from your image

**Look for phrases like:**
- "This hybrid analysis is provided when..."
- "Floor plans typically include..."
- "Building codes require..."
- Generic recommendations

## Quick Check

**Open your browser's developer console (F12) and look at the chatbot response:**

**If you see:**
- Specific details about YOUR drawing → **Cropping worked! ✅**
- Generic architectural advice → **Still blocked, need Claude ❌**

## What to Report Back

After testing, tell me:

1. **Did the analysis mention specific details from your drawing?**
   - YES → Cropping worked
   - NO → Need to switch to Claude

2. **Did you see "Hybrid Analysis (Vision API blocked)" in the response?**
   - YES → Still blocked
   - NO → Cropping worked

3. **Analysis length:**
   - Long (2000+ chars) with specifics → Success
   - Medium with generic advice → Still blocked

## If Cropping Didn't Work

No problem! We'll switch to **Claude Vision** which:
- Has less restrictive content policies
- Better handles professional/commercial content
- Will analyze your architectural drawings properly

Just let me know the test results and I'll implement Claude integration.

---

**Server Running:** Port 3060 (PID: 43853)
**Status:** Image cropping active and ready for testing
