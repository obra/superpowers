# 🚀 Modal Development Quick Reference

## TL;DR - Get Started Fast

### 1. After Creating Assignment in Contributor Hub
```bash
# The system creates database records but NOT the React component
# You need to create the actual file manually
```

### 2. Create Your Modal File
```bash
# Location pattern:
client/src/pages/[PAGE_PREFIX]-[PAGE_NAME]/components/modals/[PAGE_PREFIX]-[XX]-[ModalName].js

# Example:
client/src/pages/00435-contracts-post-award/components/modals/00435-04-MyModal.js
```

### 3. Use This Basic Template
```javascript
import React, { useState } from 'react';
import Modal from '@components/modal/components/00170-Modal';
import { useModal } from '@components/modal/hooks/00170-useModal';

const YourModalName = ({ modalProps }) => {
  const { closeModal } = useModal();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Your logic here
      alert('Success!');
      closeModal();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal>
      <h2 style={{ color: "#000000", marginBottom: "20px" }}>
        🎯 {modalProps?.modalTitle || 'Your Modal'}
      </h2>
      
      {/* Your content here */}
      
      <div style={{ marginTop: "30px", textAlign: "right" }}>
        <button onClick={closeModal} style={{ marginRight: "10px" }}>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </div>
    </Modal>
  );
};

export default YourModalName;
```

### 4. Add Button to Page Component
```javascript
// In [PAGE_PREFIX]-[PAGE_NAME]-page.js
{currentState === "agents" && (
  <>
    <button
      onClick={() => handleOpenModal('YourModalName', { 
        modalTitle: "Your Modal Title",
        triggerPage: "[PAGE_PREFIX]-[PAGE_NAME]"
      })}
    >
      🎯 Your Button
    </button>
  </>
)}
```

### 5. Test It
```bash
npm run dev
# Navigate to http://localhost:3001/[PAGE_PREFIX]-[PAGE_NAME]
# Click state button → Click your modal button
```

## 📁 Common File Locations

| Page | Prefix | Modal Location |
|------|--------|----------------|
| Contracts Post-Award | 00435 | `client/src/pages/00435-contracts-post-award/components/modals/` |
| Quality Control | 02250 | `client/src/pages/02250-quality-control/components/modals/` |
| Information Technology | 02050 | `client/src/pages/02050-information-technology/components/modals/` |
| Logistics | 01700 | `client/src/pages/01700-logistics/components/modals/` |
| Security | 02500 | `client/src/pages/02500-security/components/modals/` |

## 🎨 Standard Button Styles

```javascript
const buttonStyle = {
  padding: "10px 20px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold"
};

const primaryButton = {
  ...buttonStyle,
  backgroundColor: "#000000",
  color: "#ffffff"
};

const secondaryButton = {
  ...buttonStyle,
  backgroundColor: "#6c757d",
  color: "#ffffff"
};
```

## 🔧 Common Imports

```javascript
// Essential imports for most modals
import React, { useState, useEffect } from 'react';
import Modal from '@components/modal/components/00170-Modal';
import { useModal } from '@components/modal/hooks/00170-useModal';

// For file processing modals
import supabaseClientModule from '@common/js/auth/00175-supabase-client.js';

// For form validation
import { validateDocumentUpload } from '@common/js/utils/validate_document_uploads.js';

// For organization config
import organizationConfig from '@common/js/config/00200-organization-config.js';
```

## 🚨 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Modal doesn't open | Check modal name matches database record exactly |
| Button doesn't appear | Verify you added it to the correct state section |
| Console errors | Check all imports are correct |
| Styling looks wrong | Use the standard theme colors and button styles |
| Chatbot not working | Restart dev server, check discipline code |

## 📋 State Sections

```javascript
// Agent modals go here
{currentState === "agents" && (
  <button>Agent Button</button>
)}

// File upload modals go here  
{currentState === "upserts" && (
  <button>Upload Button</button>
)}

// Workspace modals go here
{currentState === "workspace" && (
  <button>Workspace Button</button>
)}
```

## 🎯 Modal Types & Templates

| Type | Use Case | Template |
|------|----------|----------|
| **Agent** | AI analysis, processing | [Agent Template](./MODAL_DEVELOPMENT_GUIDE.md#agent-modal-template) |
| **File Processing** | Upload, document processing | [File Template](./MODAL_DEVELOPMENT_GUIDE.md#file-processing-modal-template) |
| **Form** | Data entry, configuration | [Form Template](./MODAL_DEVELOPMENT_GUIDE.md#simple-form-modal-template) |

## 🔗 Shared Chatbot Integration

The chatbot automatically works with your modal - no extra setup needed!

```javascript
// Chatbot provides context-aware help based on:
// - Current state (agents/upserts/workspace)
// - Page discipline (contracts, quality, etc.)
// - Modal interactions
```

## ✅ Testing Checklist

- [ ] Modal opens and closes
- [ ] All buttons work
- [ ] Form validation works
- [ ] Error handling works
- [ ] Loading states show
- [ ] Styling is consistent
- [ ] No console errors

## 📚 Full Documentation

- **Complete Guide**: [Modal Development Guide](./MODAL_DEVELOPMENT_GUIDE.md)
- **Step-by-Step**: [Modal Workflow Guide](./MODAL_WORKFLOW_GUIDE.md)
- **Architecture**: [Modal Architecture Design](../0975_MODAL_ARCHITECTURE_DESIGN.md)

---

**Need Help?** Check the full guides above or ask in contributor support channels!
