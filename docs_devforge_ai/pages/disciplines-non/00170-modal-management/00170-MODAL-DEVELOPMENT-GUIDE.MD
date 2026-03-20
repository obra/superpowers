# 🎯 Modal Development Guide for Contributors

## Overview

This guide provides step-by-step instructions for creating modals after using the Contributor Hub's "Create New Assignment" feature. The modal system follows a specific folder structure and integration pattern with shared chatbots.

## 📁 Required Folder Structure

All modals must follow this exact structure based on the page prefix:

```
client/src/pages/[PAGE_PREFIX]-[PAGE_NAME]/
├── [PAGE_PREFIX]-index.js                    # Main page entry point
├── components/
│   ├── [PAGE_PREFIX]-[PAGE_NAME]-page.js     # Main page component
│   ├── agents/                               # Agent components
│   │   ├── [PAGE_PREFIX]-[XX]-[agent-name]-modal.js
│   │   └── [PAGE_PREFIX]-[XX]-[agent-name].js
│   ├── chatbots/                            # Chatbot components
│   │   └── [PAGE_PREFIX]-document-langchain.js
│   └── modals/                              # Modal components
│       ├── [PAGE_PREFIX]-[XX]-[ModalName].js
│       └── shared/                          # Shared modal components
│           ├── DocumentProcessingCard.js
│           ├── FilePreview.js
│           ├── MetadataCapture.js
│           ├── ProcessingStatus.js
│           └── ValidationIndicator.js
```

**Example for Contracts Post-Award (00435):**
```
client/src/pages/00435-contracts-post-award/
├── 00435-index.js
├── components/
│   ├── 00435-contracts-post-award-page.js
│   ├── agents/
│   │   ├── 00435-03-legal-agent-modal.js
│   │   └── 00435-03-legal-agent.js
│   ├── chatbots/
│   │   └── 00435-document-langchain.js
│   └── modals/
│       ├── 00435-02-UpsertFileModal.js
│       └── shared/
```

## 🚀 Step-by-Step Modal Creation Process

### Step 1: After Creating Assignment in Contributor Hub

When you click "Create New Modal" in the Contributor Hub, the system:
- ✅ Creates a database record in `modal_configurations`
- ✅ Updates `client/src/generated/modalRegistry.js`
- ❌ **DOES NOT create the actual React component file**

### Step 2: Determine Your Modal Type and Location

Based on your assignment, determine:
- **Page Prefix**: e.g., `00435` for Contracts Post-Award
- **Modal Number**: Sequential number (01, 02, 03, etc.)
- **Modal Purpose**: Agent, Upsert, Workspace, etc.

### Step 3: Create the Modal Component File

Create your modal file at:
```
client/src/pages/[PAGE_PREFIX]-[PAGE_NAME]/components/modals/[PAGE_PREFIX]-[XX]-[ModalName].js
```

**Example:**
```
client/src/pages/00435-contracts-post-award/components/modals/00435-04-MyNewModal.js
```

### Step 4: Use the Appropriate Template

Choose the template based on your modal type:

#### For Agent Modals:
Use the [Agent Modal Template](#agent-modal-template)

#### For File Upload/Processing Modals:
Use the [File Processing Modal Template](#file-processing-modal-template)

#### For Simple Form Modals:
Use the [Simple Form Modal Template](#simple-form-modal-template)

### Step 5: Register Modal in Page Component

Add your modal trigger to the main page component:

```javascript
// In [PAGE_PREFIX]-[PAGE_NAME]-page.js
{currentState === "agents" && (
  <>
    <button
      type="button"
      className="A-[PAGE_PREFIX]-modal-trigger-button"
      onClick={() => handleOpenModal('YourModalName', { 
        modalTitle: "Your Modal Title",
        triggerPage: "[PAGE_PREFIX]-[PAGE_NAME]"
      })}
      style={{ marginTop: "10px" }}
    >
      🎯 Your Modal Button
    </button>
  </>
)}
```

### Step 6: Test Integration

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Your Page:**
   ```
   http://localhost:3001/[PAGE_PREFIX]-[PAGE_NAME]
   ```

3. **Test Modal:**
   - Click the appropriate state button (Agents, Upserts, Workspace)
   - Click your modal trigger button
   - Verify modal opens and functions correctly

### Step 7: Integrate with Shared Chatbot

Your modal should work with the shared chatbot system. The chatbot is automatically available based on the current state:

```javascript
// Chatbots are created in the main page component:
{currentState === "agents" && createAgentChatbot({
  pageId: "[PAGE_PREFIX]-[PAGE_NAME]",
  disciplineCode: "[PAGE_PREFIX]", 
  userId: "current_user"
})}
```

## 📋 Modal Templates

### Agent Modal Template

```javascript
import React, { useState } from 'react';
import Modal from '@components/modal/components/00170-Modal';
import { useModal } from '@components/modal/hooks/00170-useModal';

const YourAgentModal = ({ modalProps }) => {
  const { closeModal } = useModal();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAgentAction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/langchain/[PAGE_PREFIX]/[agent-type]', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          agentType: '[agent-type]',
          context: modalProps?.context || {},
          triggerPage: modalProps?.triggerPage
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
      console.error('Agent action error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal>
      <h2 style={{ color: "#000000", marginBottom: "20px" }}>
        🎯 {modalProps?.modalTitle || 'Agent Assistant'}
      </h2>
      
      <div className="agent-container">
        <p>Describe what this agent does and how it helps users.</p>
        
        <button 
          onClick={handleAgentAction} 
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#000000",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Processing...' : 'Execute Agent Action'}
        </button>
        
        {error && (
          <div style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            color: "#721c24"
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {result && (
          <div style={{
            marginTop: "15px",
            padding: "15px",
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "4px"
          }}>
            <h4>Results</h4>
            <div>{JSON.stringify(result, null, 2)}</div>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: "30px", textAlign: "right" }}>
        <button
          onClick={closeModal}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default YourAgentModal;
```

### File Processing Modal Template

```javascript
import React, { useState, useEffect } from 'react';
import Modal from '@components/modal/components/00170-Modal';
import { useModal } from '@components/modal/hooks/00170-useModal';
import supabaseClientModule from '@common/js/auth/00175-supabase-client.js';

const YourFileModal = ({ modalProps }) => {
  const { closeModal } = useModal();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState(null);

  // Initialize Supabase
  useEffect(() => {
    const initializeClient = async () => {
      try {
        const client = await supabaseClientModule.getSupabase();
        if (client && typeof client.from === "function") {
          setSupabaseClient(client);
        }
      } catch (error) {
        console.error('Error initializing Supabase client:', error);
      }
    };
    initializeClient();
  }, []);

  const handleFileSelection = (files) => {
    const fileArray = Array.from(files);
    setSelectedFiles(prev => [...prev, ...fileArray]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelection(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file.');
      return;
    }

    setProcessing(true);
    try {
      // Process files here
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('triggerPage', modalProps?.triggerPage || 'unknown');
        
        const response = await fetch('/api/process', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Failed to process ${file.name}`);
        }
      }
      
      alert('Files processed successfully!');
      closeModal();
    } catch (error) {
      console.error('Processing error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const dropZoneStyle = {
    border: `2px dashed ${isDragOver ? '#FF8C00' : '#ccc'}`,
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: isDragOver ? '#FFE4B5' : '#f8f9fa',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '20px'
  };

  return (
    <Modal>
      <h2 style={{ color: "#000000", marginBottom: "20px" }}>
        📄 {modalProps?.modalTitle || 'File Processing'}
      </h2>
      
      <div
        style={dropZoneStyle}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📁</div>
        <p style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 'bold' }}>
          {isDragOver ? 'Drop files here' : 'Drag & drop files or click to browse'}
        </p>
        <p style={{ margin: '0', fontSize: '0.8rem', color: '#6c757d' }}>
          Supported: PDF, DOCX, TXT, Images (Max 50MB)
        </p>
      </div>

      <input
        id="fileInput"
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelection(e.target.files)}
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
      />

      {selectedFiles.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>Selected Files ({selectedFiles.length})</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} style={{
              padding: '10px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              marginBottom: '5px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{file.name}</span>
              <button
                onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: "30px", textAlign: "right" }}>
        <button
          onClick={closeModal}
          disabled={processing}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={processing || selectedFiles.length === 0}
          style={{
            padding: "10px 20px",
            backgroundColor: "#000000",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: processing ? "not-allowed" : "pointer",
            opacity: processing ? 0.6 : 1
          }}
        >
          {processing ? 'Processing...' : 'Process Files'}
        </button>
      </div>
    </Modal>
  );
};

export default YourFileModal;
```

### Simple Form Modal Template

```javascript
import React, { useState } from 'react';
import Modal from '@components/modal/components/00170-Modal';
import { useModal } from '@components/modal/hooks/00170-useModal';

const YourFormModal = ({ modalProps }) => {
  const { closeModal } = useModal();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/your-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          triggerPage: modalProps?.triggerPage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      alert('Form submitted successfully!');
      closeModal();
    } catch (error) {
      console.error('Submit error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    fontSize: '1rem',
    marginBottom: '15px'
  };

  return (
    <Modal>
      <h2 style={{ color: "#000000", marginBottom: "20px" }}>
        📝 {modalProps?.modalTitle || 'Form Modal'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            style={inputStyle}
            placeholder="Enter title..."
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            placeholder="Enter description..."
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            style={inputStyle}
          >
            <option value="">Select category...</option>
            <option value="general">General</option>
            <option value="urgent">Urgent</option>
            <option value="review">Review</option>
          </select>
        </div>
        
        <div style={{ marginTop: "30px", textAlign: "right" }}>
          <button
            type="button"
            onClick={closeModal}
            disabled={submitting}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "10px"
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 20px",
              backgroundColor: "#000000",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1
            }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default YourFormModal;
```

## 🔧 Integration with Shared Chatbot

Your modal automatically integrates with the shared chatbot system. The chatbot provides context-aware assistance based on:

- **Current State**: Agents, Upserts, or Workspace
- **Page Context**: Discipline-specific knowledge
- **User Actions**: Modal interactions and form submissions

The chatbot is created in the main page component and is available throughout the user session.

## ✅ Testing Checklist

Before submitting your modal:

- [ ] Modal file created in correct location
- [ ] Modal follows naming convention
- [ ] Modal integrates with useModal hook
- [ ] Modal handles loading and error states
- [ ] Modal includes proper styling
- [ ] Modal button added to main page component
- [ ] Modal opens and closes correctly
- [ ] Modal submits data successfully
- [ ] Modal works with shared chatbot
- [ ] Modal follows accessibility guidelines

## 🚨 Common Issues and Solutions

### Issue: Modal doesn't open
**Solution:** Check that the modal key in the database matches the component name exactly.

### Issue: Modal registry not updated
**Solution:** Restart the development server to regenerate the modal registry.

### Issue: Styling inconsistencies
**Solution:** Use the provided theme colors and follow the existing patterns.

### Issue: Chatbot not responding
**Solution:** Ensure the modal is properly integrated with the page state system.

## 📚 Additional Resources

- [Modal Architecture Design](../0975_MODAL_ARCHITECTURE_DESIGN.md)
- [Contributor Guidelines](../../CONTRIBUTOR_GUIDELINES.md)
- [Task Assignment Guide](../../CONTRIBUTOR_TASK_ASSIGNMENT_GUIDE.md)
- [Enhanced Contributor Hub](./ENHANCED_CONTRIBUTOR_HUB_IMPROVEMENTS.md)

## 🆘 Getting Help

If you encounter issues:

1. Check the console for error messages
2. Verify file paths and naming conventions
3. Test with the provided templates first
4. Ask for help in the contributor support channels

---

**Remember:** The modal system is database-driven, but the actual React components must be created manually following these patterns. This guide bridges that gap and ensures consistent, working implementations.
