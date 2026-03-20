# UNIFIED CHATBOT DEFINITION
## Based on 01900-Procurement TenderChatbot Pattern

### **Reference Implementation: 01900-procurement/components/01900-tender-chatbot.js**

## 🤖 **What is a "Unified Chatbot"?**

A **Unified Chatbot** is a complete, professional-grade AI assistant component that provides:

### **Core Characteristics (Based on TenderChatbot Pattern):**

#### 1. **Complete React Component Architecture**
```javascript
// Must be a full React functional component with hooks
const TenderChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([/* initial messages */]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // useEffect for lifecycle management
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
};
```

#### 2. **Professional UI Components**
- **Toggle Button**: Fixed position floating button (bottom-right)
- **Chat Window**: Modal-style interface with proper styling
- **Message Interface**: User/bot message bubbles with timestamps
- **Input Field**: Text input with send button and keyboard handling
- **Header**: Branded header with close button

#### 3. **Interactive Features**
- **State Management**: Complete open/close state, message history, typing indicators
- **Message Handling**: sendMessage function, message generation, conversation flow
- **Keyboard Support**: Enter key submission, focus management
- **Error Handling**: Try-catch blocks, error messages, graceful degradation

#### 4. **Domain-Specific Intelligence**
- **Contextual Responses**: Knowledge base relevant to the page's domain
- **Pattern Recognition**: Keywords and intent matching
- **Helpful Guidance**: Step-by-step instructions for page functionality
- **Default Responses**: Fallback messages for unrecognized queries

#### 5. **Professional Styling**
- **Consistent Design**: Matches page theme and branding
- **Animations**: Smooth transitions, hover effects, typing indicators
- **Responsive Layout**: Proper sizing and positioning
- **Visual Feedback**: Button states, loading indicators, hover effects

#### 6. **Error Boundaries & Reliability**
```javascript
const TenderChatbotWithErrorBoundary = (props) => (
  <ChatbotErrorBoundary
    chatbotType="tender"
    disciplineCode="01900"
    userId={props.userId || 'unknown'}
    pageId="01900-procurement"
    fallbackMessage={<div>Chatbot unavailable</div>}
  >
    <TenderChatbot {...props} />
  </ChatbotErrorBoundary>
);
```

## 📋 **Unified Chatbot Checklist**

**For a page to have a "Unified Chatbot", it must contain:**

- [ ] **Complete React component** with useState, useEffect hooks
- [ ] **Toggle button** (floating, fixed position)
- [ ] **Modal chat window** with proper styling
- [ ] **Message interface** (user/bot bubbles with timestamps)
- [ ] **Input handling** (text input, send button, keyboard support)
- [ ] **Domain-specific knowledge** (responses relevant to page function)
- [ ] **Error boundaries** (error handling and fallback UI)
- [ ] **Professional styling** (animations, hover effects, consistent design)
- [ ] **State management** (open/close, message history, typing indicators)
- [ ] **Integration** (proper component export and usage)

## 🎯 **Reference Pattern Examples**

### **File Structure:**
```
pages/
└── 01900-procurement/
    ├── 01900-index.js (page integration)
    └── components/
        └── 01900-tender-chatbot.js (unified chatbot component)
```

### **Component Integration:**
```javascript
// In page component
import TenderChatbotWithErrorBoundary from './components/01900-tender-chatbot.js';

// In page render
return (
  <div>
    {/* Page content */}
    <TenderChatbotWithErrorBoundary userId={userId} />
  </div>
);
```

### **Key Implementation Details:**
- **Component Name**: Follows pattern `[PAGE_ID]-[domain]-chatbot.js`
- **State Variables**: isOpen, messages, inputMessage, isTyping
- **Functions**: handleSendMessage, generateBotResponse, scrollToBottom
- **Styling**: Inline styles with theme consistency
- **Error Handling**: Try-catch blocks and ChatbotErrorBoundary wrapper

## 🔍 **Verification Criteria**

**To verify if a page has a Unified Chatbot:**

1. **Check for chatbot component file** in `components/` directory
2. **Verify React implementation** with hooks (useState, useEffect)
3. **Confirm UI components** (toggle button, chat window, input)
4. **Validate domain knowledge** (page-specific responses)
5. **Check error handling** (error boundaries, try-catch)
6. **Verify integration** (component is imported and used in page)

## 📊 **Status: 01900-Procurement as Gold Standard**

**The 01900-procurement TenderChatbot represents the IDEAL unified chatbot implementation:**

- ✅ **Complete implementation** - All required features present
- ✅ **Professional quality** - Production-ready code
- ✅ **Domain expertise** - Tender management knowledge
- ✅ **User experience** - Intuitive interface and interactions
- ✅ **Error resilience** - Proper error handling and boundaries
- ✅ **Code quality** - Well-structured, documented, maintainable

**This should be the template for all other page chatbot implementations.**

---

*Definition established: 22/12/2025, 3:48:01 pm*  
*Reference: 01900-procurement TenderChatbot component analysis*
