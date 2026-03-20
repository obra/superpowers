# Discipline Positioning Fixes Task List

## Objective
Fix logout button and chatbot positioning on 47 EPCM discipline pages to match EPCM requirements.

## EPCM Requirements
- **Logout Button:** `bottom: "20px", left: "20px", zIndex: 300` (icon-only, no text)
- **Chatbot:** `bottom: "20px", right: "20px", zIndex: 250`
- **Symmetric Positioning:** Both 20px from bottom, logout on left, chatbot on right

## Pages to Fix (47 Total)

### ✅ COMPLETED PAGES (13/47)
1. Architectural (00825) - ✅ Fixed
2. Chemical Engineering (00835) - ✅ Fixed  
3. Board of Directors (00880) - ✅ Fixed
4. Civil Engineering (00850) - ✅ Already fixed
5. Construction (00300) - ✅ Fixed
6. Contracts (00400) - ✅ Fixed
7. Contracts Pre Award (00425) - ✅ Fixed
8. Contracts Post Award (00435) - ✅ Fixed
9. Design (00800) - ✅ Fixed
10. Developer (00872) - ✅ Fixed
11. Director Construction (00882) - ✅ Fixed
12. Director Contracts (00883) - ✅ Fixed
13. Director Engineering (00884) - ✅ Fixed

### 🔄 IN PROGRESS (0/34)
14. Director Finance (00889) - ⚠️ Needs fixing
15. Director HSE (00885) - ⚠️ Needs fixing
16. Director Logistics (00886) - ⚠️ Needs fixing
17. Director Procurement (00888) - ⚠️ Needs fixing
18. Director Project (00895) - ✅ Already fixed
19. Director Projects (00890) - ⚠️ Needs fixing
20. Directors (00876) - ⚠️ Needs fixing
21. Electrical Engineering (00860) - ⚠️ Needs fixing
22. Environmental (01000) - ⚠️ Needs fixing
23. Ethics (01100) - ⚠️ Needs fixing
24. Finance (01200) - ✅ Already fixed
25. Geotechnical Engineering (00855) - ⚠️ Needs fixing
26. Governance (01300) - ⚠️ Needs fixing
27. Health (01400) - ⚠️ Needs fixing
28. Human Resources (01500) - ⚠️ Needs fixing
29. Inspection (02075) - ⚠️ Needs fixing
30. Landscaping (03000) - ⚠️ Needs fixing
31. Legal (01750) - ⚠️ Needs fixing
32. Local Content (01600) - ⚠️ Needs fixing
33. Logistics (01700) - ⚠️ Needs fixing
34. Mechanical Engineering (00870) - ⚠️ Needs fixing
35. Operations (01800) - ⚠️ Needs fixing
36. Other Parties (01850) - ⚠️ Needs fixing
37. Process Engineering (00871) - ⚠️ Needs fixing
38. Procurement (01900) - ⚠️ Needs fixing
39. Project Controls (02000) - ⚠️ Needs fixing
40. Public Relations (02100) - ⚠️ Needs fixing
41. Quality Assurance (02200) - ⚠️ Needs fixing
42. Quality Control (02250) - ⚠️ Needs fixing
43. Quantity Surveying (02025) - ⚠️ Needs fixing
44. Safety (02400) - ⚠️ Needs fixing
45. Scheduling (02035) - ⚠️ Needs fixing
46. Security (02500) - ⚠️ Needs fixing
47. Sundry (00877) - ⚠️ Needs fixing

## Implementation Pattern

### Logout Button (EPCM Requirements)
```jsx
<button
  id="logout-button"
  onClick={handleLogout}
  className="A-XXXXX-logout-button epcm-logout-aligned"
  style={{
    position: "fixed",
    bottom: "20px",
    left: "20px",
    zIndex: 300,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    border: "2px solid #FF8C00",
    borderRadius: "8px",
    color: "white",
    padding: "8px 12px",
    cursor: "pointer"
  }}
>
  <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
  {/* NO TEXT - Icon only */}
</button>
```

### Chatbot (EPCM Requirements)
```jsx
<div
  className="A-XXXXX-chatbot-container epcm-chatbot-aligned"
  style={{
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 250,
    maxWidth: "400px",
    maxHeight: "60vh"
  }}
>
  <ChatbotBase
    pageId="XXXXX"
    disciplineCode="DISCIPLINE_NAME"
    userId={window.currentUser?.id || "demo-user"}
    chatType="document"
    title="Discipline Assistant"
    welcomeTitle="Discipline Command Center"
    welcomeMessage="I can help you with discipline processes and requirements."
    exampleQueries={[
      "What processes do I need to follow?",
      "How do I prepare documentation?",
      "What approval requirements apply?",
      "How do I manage this workflow?",
    ]}
    theme={{
      primary: "#FF8C00",
      secondary: "#FFA500",
      background: "#FFF8F0",
      border: "#FFE8CC",
    }}
    enableCitations={true}
    enableDocumentCount={true}
    enableConversationHistory={true}
  />
</div>
```

## Fixes Required Per Page

### 1. Remove top-positioned logout buttons
- Find any logout buttons positioned with `top: "10px"`
- Remove inline styles or replace with EPCM positioning
- Remove any text (only icon should remain)

### 2. Fix chatbot positioning
- Ensure chatbot is at `bottom: "20px", right: "20px"`
- Set `zIndex: 250`
- Maintain `maxWidth: "400px"` and `maxHeight: "60vh"`

### 3. Add proper EPCM class names
- `A-XXXXX-logout-button` (where XXXXX is the page code)
- `A-XXXXX-chatbot-container`
- Add `epcm-logout-aligned` and `epcm-chatbot-aligned` classes

### 4. Remove duplicate implementations
- Some pages may have both top and bottom positioned buttons
- Remove the incorrect positioning
- Ensure only one logout button exists per page

## Testing Checklist
- [ ] Verify logout button appears at bottom-left
- [ ] Verify chatbot appears at bottom-right
- [ ] Both buttons are 20px from bottom edge
- [ ] Logout is above chatbot (zIndex: 300 > 250)
- [ ] No text appears next to logout icon
- [ ] Page is responsive on mobile
- [ ] Other page functionality still works

## Batch Processing Strategy
- Group pages by similar implementation patterns
- Apply fixes systematically
- Verify each page after changes
- Create backup of original files if needed