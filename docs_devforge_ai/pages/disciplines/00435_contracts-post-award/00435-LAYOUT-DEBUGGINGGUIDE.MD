2 # 00435 Contracts Post-Award Layout Debugging Guide

## Overview
This guide explains how to use the verbose logging system added to diagnose the layout issue where modal-trigger buttons shift to the right after render on page 00435.

## Enabling Verbose Logging

### Method 1: Browser Console (Recommended)
1. Open your browser's developer tools (F12 or right-click → Inspect)
2. Go to the Console tab
3. Enter the following command:
```javascript
window.VERBOSE_LAYOUT_LOGGING = true;
```
4. Refresh the page to start capturing logs

### Method 2: Permanent Enable (Development Only)
Add this to the top of the page component or in a global script:
```javascript
window.VERBOSE_LAYOUT_LOGGING = true;
```

## Log Structure and Filtering

### Log Format
All verbose layout logs are prefixed with `[VERBOSE_LAYOUT]` and include:
- **Phase**: When the log was captured (PAGE_MOUNT, WINDOW_RESIZE, etc.)
- **Timestamp**: ISO timestamp of when the log was captured
- **Viewport Information**: Browser window dimensions and device pixel ratio
- **Element Information** (when applicable):
  - Bounding rectangle coordinates
  - Computed styles (position, transform, margins, etc.)

### Filtering Logs in Browser Console

#### 1. Basic Filtering
To see only layout logs:
```
[VERBOSE_LAYOUT]
```

#### 2. Filter by Phase
To see only mount-related logs:
```
[VERBOSE_LAYOUT][PAGE_MOUNT]
```

To see only resize-related logs:
```
[VERBOSE_LAYOUT][WINDOW_RESIZE]
```

#### 3. Filter by Specific Element
To see logs for the center-stack element:
```
center-stack
```

To see logs for modal-row elements:
```
modal-row
```

## Key Elements to Monitor

### 1. Center Stack Container
- **Element ID**: `center-stack` (class-based)
- **Key Properties to Watch**:
  - `position`: Should be `fixed` or use CSS grid
  - `transform`: Look for unexpected transforms that could cause shifts
  - `left`/`right`: Check for conflicting positioning
  - `margin`: Watch for margin changes that could affect centering

### 2. Modal Row Container
- **Element Class**: `modal-row`
- **Key Properties to Watch**:
  - `display`: Should maintain proper flex/grid behavior
  - `justify-content`: Should be `center` for horizontal centering
  - `transform`: Look for layout shifts
  - `width`: Check for unexpected width changes

### 3. Individual Buttons
- **Element Class**: `stable-pill`
- **Key Properties to Watch**:
  - `margin`: Individual button margins
  - `transform`: Any button-specific transforms
  - `position`: Should not have conflicting positioning

## Common Issues to Look For

### 1. Transform-Based Centering Issues
Logs showing:
```json
"transform": "translateX(-50%)"
```
This indicates the problematic transform-based centering approach.

### 2. Margin/Padding Changes
Look for logs where margin values change between PAGE_MOUNT and subsequent events:
```json
"marginLeft": "auto",
"marginRight": "auto"
```
vs
```json
"marginLeft": "0px",
"marginRight": "some_value"
```

### 3. Position Property Conflicts
Watch for changes in position properties:
```json
"position": "fixed"
```
to
```json
"position": "relative"
```

## Diagnostic Workflow

### Step 1: Initial Mount Analysis
1. Enable verbose logging
2. Refresh the page
3. Filter console for: `[VERBOSE_LAYOUT][PAGE_MOUNT]`
4. Look for initial positioning of all elements

### Step 2: Post-Render Analysis
1. Wait for page to fully load
2. Filter console for recent logs (last few seconds)
3. Look for any unexpected style changes

### Step 3: Resize Testing
1. Resize browser window
2. Filter console for: `[VERBOSE_LAYOUT][WINDOW_RESIZE]`
3. Verify elements maintain proper centering

### Step 4: State Change Testing
1. Click different state buttons (Agents, Upserts, Workspace)
2. Watch for layout shifts in the modal-row elements
3. Filter by `modal-row` to see specific changes

## Example Log Analysis

### Healthy Centering Log:
```json
[VERBOSE_LAYOUT][PAGE_MOUNT] {
  "phase": "PAGE_MOUNT",
  "elementId": "center-stack",
  "element": {
    "computedStyle": {
      "position": "fixed",
      "display": "grid",
      "justifyContent": "center",
      "transform": "none"
    }
  }
}
```

### Problematic Transform Log:
```json
[VERBOSE_LAYOUT][PAGE_MOUNT] {
  "phase": "PAGE_MOUNT", 
  "elementId": "center-stack",
  "element": {
    "computedStyle": {
      "position": "fixed",
      "left": "50%",
      "transform": "translateX(-50%)"
    }
  }
}
```

## Disabling Verbose Logging

To disable logging:
```javascript
window.VERBOSE_LAYOUT_LOGGING = false;
```

## Troubleshooting: If No Logs Appear

### 1. Verify Page is Loading Correctly
- Navigate to: http://localhost:3001/contracts-post-award
- Check browser console for any JavaScript errors
- Look for these test messages:
  ```
  [TEST] 00435 page component mounted - verbose logging system active
  [TEST] To enable layout logging: window.VERBOSE_LAYOUT_LOGGING = true;
  ```

### 2. Manual Logging Test
In browser console, run:
```javascript
// Enable verbose logging
window.VERBOSE_LAYOUT_LOGGING = true;

// Test immediate log
console.log('[VERBOSE_LAYOUT][MANUAL_TEST] Manual test successful!');

// Test the logging function
if (typeof logLayoutInfo !== 'undefined') {
    logLayoutInfo('MANUAL_TEST', 'center-stack');
} else {
    console.log('[VERBOSE_LAYOUT][MANUAL_TEST] logLayoutInfo function not available in global scope');
}
```

### 3. Check for Build Issues
- Look for webpack compilation errors in the terminal
- Verify the file was updated: `client/src/pages/00435-contracts-post-award/components/00435-contracts-post-award-page.js`
- Check that the development server is running: `curl -I http://localhost:3001`

### 4. Force Page Reload
- Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache if needed
- Check Network tab to ensure page assets are loading

## Additional Debugging Tips

### 1. Use Browser DevTools Elements Panel
- Right-click on the shifted buttons → "Inspect"
- Watch the Styles panel for dynamic changes
- Use the Layout tab to see box model changes

### 2. Force Repaint Testing
In console:
```javascript
document.body.style.transform = 'translateZ(0)';
```
This can help identify rendering issues.

### 3. Check for CSS Animation/Transition Effects
Look for:
- `transition` properties that might cause delayed shifts
- `animation` properties that could affect positioning
- `will-change` properties that might trigger GPU acceleration

### 4. Monitor React Re-renders
The existing debug messages will show:
```
[ContractsPostAwardPage][debug] probe: overlay flash confirm for upserts
```
This indicates when state changes occur that might trigger layout recalculations.

## Quick Verification Script

You can run this in the browser console to quickly verify the system:

```javascript
// Quick layout logging verification
(function() {
    console.log('=== Layout Logging Verification ===');
    
    // Enable logging
    window.VERBOSE_LAYOUT_LOGGING = true;
    console.log('✓ Verbose logging enabled');
    
    // Test basic functionality
    console.log('[VERBOSE_LAYOUT][VERIFICATION] System verification test');
    
    // Check for page elements
    const centerStack = document.querySelector('.center-stack');
    const modalRow = document.querySelector('.modal-row');
    
    if (centerStack) {
        console.log('✓ Center-stack element found');
        const rect = centerStack.getBoundingClientRect();
        console.log('[VERBOSE_LAYOUT][VERIFICATION] Center-stack position:', {
            x: rect.x, y: rect.y, width: rect.width, height: rect.height
        });
    } else {
        console.log('⚠ Center-stack element not found');
    }
    
    if (modalRow) {
        console.log('✓ Modal-row element found');
    } else {
        console.log('⚠ Modal-row element not found');
    }
    
    console.log('=== Verification Complete ===');
})();
```
