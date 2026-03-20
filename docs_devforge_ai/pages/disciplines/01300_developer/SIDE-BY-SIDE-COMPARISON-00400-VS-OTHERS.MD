# Side-by-Side Comparison: 00400 (Working) vs 01900/00425/00435

## Critical Finding

After comparing 00400 (which works correctly) with the other pages, I found that **00400 also has the same bug** in `getCurrentButtons()` - it returns `agentsButtons` in the default case. However, 00400 works because of how the conditional rendering is structured.

## Key Difference Found

### 00400 Contracts (WORKING) - Grid Rendering:
```jsx
// Line ~200-220: The ENTIRE grid container is wrapped in the conditional
{currentState && currentButtons.length > 0 && (
  <div
    className={`A-00400-button-container ${isButtonContainerVisible ? "visible" : ""}`}
    style={{...}}
  >
    {currentButtons.map((button, index) => {...})}
  </div>
)}
```

### 00435 Contracts Post-Award (BROKEN) - Grid Rendering:
Looking at the code structure, the issue is the PLACEMENT of the conditional:

```jsx
// The conditional ONLY wraps around the div, but the gridLayout calculation happens BEFORE
const gridLayout = calculateGridLayout(currentButtons.length);  // <-- This runs even when currentState is null!

return (
  ...
  {currentState && currentButtons.length > 0 && (
    <div ...>
      ...
    </div>
  )}
)
```

## The Real Bug

The problem is NOT in the conditional rendering - it's in the **timing of when buttons are returned**.

In ALL pages including 00400:
```jsx
const getCurrentButtons = () => {
  switch (currentState) {
    case "agents": return agentsButtons;
    case "upserts": return upsertButtons;
    case "workspace": return workspaceButtons;
    default: return agentsButtons;  // <-- BUG: Returns buttons even when currentState is null!
  }
};
```

But 00400 "appears" to work because:
1. `currentState` is `null` (falsy)
2. The condition `currentState && currentButtons.length > 0` evaluates to `false` 
3. Grid doesn't render

## Why 01900/00425/00435 Show Buttons on Entry

Even though I changed `default: return []`, there might be another issue. Let me check if there's **duplicate grid code** or if the **default case is still returning buttons somewhere**.

## Recommended Fix

The fix should be:
1. Change `default: return agentsButtons` to `default: return []` in ALL pages
2. Ensure the conditional check is `currentState && currentButtons.length > 0`
3. Ensure `calculateGridLayout` is NOT called when `currentButtons.length === 0`

00400 needs fixing too - it has the same bug but "works" by accident due to the conditional check.
