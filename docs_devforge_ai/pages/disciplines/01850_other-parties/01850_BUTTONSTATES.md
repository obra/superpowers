# 01900 Procurement Button States Documentation

## Overview

This document details the button states and interactions for the 01900 Procurement page chatbot integration, following the same patterns established in 00435 Contracts Post-Award.

## Button State Architecture

### 1. Chatbot Toggle Button States

#### Default State (Collapsed)
- **Appearance**: Orange circular button with chat icon 💬
- **Position**: Fixed bottom-right corner of viewport
- **Z-index**: 6000
- **Hover Effect**: Scale transform and enhanced shadow
- **Click Action**: Expands chat window

#### Active State (Expanded)
- **Appearance**: Same button, but chat window visible
- **Position**: Same fixed position
- **Z-index**: 6000 (button), 6001 (window)
- **Click Action**: Closes chat window

### 2. Chat Window Control Buttons

#### Clear Conversation Button
- **Icon**: 🗑️ Trash can icon
- **State**: Always enabled
- **Hover**: Background color change
- **Action**: Resets chat history and shows welcome message

#### Close Window Button
- **Icon**: ✕ Close icon
- **State**: Always enabled
- **Hover**: Background color change
- **Action**: Collapses chat window

### 3. Input Area Buttons

#### Send Message Button
- **Icon**: ↵ Enter arrow
- **State**: Enabled when input has text, disabled when empty
- **Hover**: Color and scale transformation
- **Disabled State**: Reduced opacity and no hover effect
- **Action**: Sends message to agent and triggers processing

## CSS Implementation

### Base Button Styles
```css
.document-chat-toggle-button {
  position: fixed;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF6B35, #FF8C42);
  color: white;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.35);
  transition: all 0.3s ease;
  z-index: 6000;
  bottom: 20px;
  right: 20px;
}

.document-chat-toggle-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
}

.document-chat-toggle-button:active {
  transform: scale(0.95);
}
```

### Control Buttons
```css
.chat-controls .clear-button,
.chat-controls .close-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  color: white;
  width: 32px;
  height: 32px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.chat-controls .clear-button:hover,
.chat-controls .close-button:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

### Send Button
```css
.send-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #FF6B35, #FF8C42);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff5a25, #ff7b32);
  transform: scale(1.05);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

## JavaScript State Management

### Button State Tracking
```javascript
class ProcurementChatbot {
  constructor() {
    this.state = {
      isChatOpen: false,
      isProcessing: false,
      hasInput: false,
      messages: []
    };
  }

  updateButtonStates() {
    // Update send button disabled state
    const sendButton = document.querySelector('.send-button');
    if (sendButton) {
      sendButton.disabled = this.state.isProcessing || !this.state.hasInput;
    }

    // Update toggle button appearance
    const toggleButton = document.querySelector('.document-chat-toggle-button');
    if (toggleButton) {
      toggleButton.style.background = this.state.isChatOpen 
        ? 'linear-gradient(135deg, #28a745, #20c997)' // Green when open
        : 'linear-gradient(135deg, #FF6B35, #FF8C42)'; // Orange when closed
    }
  }
}
```

## Agent Interaction States

### Processing State
- **Send Button**: Disabled with loading spinner
- **Input Area**: Disabled during processing
- **Chat Window**: Shows typing indicators
- **Toggle Button**: Maintains current state

### Error State
- **Send Button**: Re-enabled after error display
- **Input Area**: Re-enabled for retry
- **Chat Window**: Shows error message with retry option
- **Toggle Button**: Remains functional

### Success State
- **Send Button**: Re-enabled for next message
- **Input Area**: Cleared and ready for new input
- **Chat Window**: Shows complete response
- **Toggle Button**: Remains functional

## Responsive Design States

### Desktop (>768px)
- **Toggle Button**: 44px diameter, fixed position
- **Chat Window**: 80vw width, 75vh height
- **Control Buttons**: 32px square
- **Send Button**: 40px diameter

### Mobile (≤768px)
- **Toggle Button**: 30px diameter
- **Chat Window**: 95vw width, 85vh height
- **Control Buttons**: 28px square
- **Send Button**: 36px diameter

## Accessibility States

### Focus States
- **Keyboard Navigation**: All buttons accessible via tab
- **Focus Ring**: Visible outline on focus
- **ARIA Labels**: Descriptive labels for screen readers
- **Color Contrast**: WCAG compliant color ratios

### Reduced Motion
- **Transitions**: Disabled when `prefers-reduced-motion` is set
- **Animations**: Simplified or removed for accessibility
- **State Changes**: Immediate without animation

## Event Handling

### Click Events
```javascript
// Toggle button click handler
document.querySelector('.document-chat-toggle-button').addEventListener('click', () => {
  this.state.isChatOpen = !this.state.isChatOpen;
  this.updateButtonStates();
  this.toggleChatWindow();
});

// Send button click handler
document.querySelector('.send-button').addEventListener('click', () => {
  if (!this.state.isProcessing && this.state.hasInput) {
    this.sendMessage();
  }
});
```

### Keyboard Events
```javascript
// Enter key in input area
input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!this.state.isProcessing && this.state.hasInput) {
      this.sendMessage();
    }
  }
});
```

## State Persistence

### Local Storage
- **Chat History**: Persisted between page reloads
- **Button Preferences**: User's preferred chat window size
- **Agent Settings**: Last used agent configuration

### Session States
- **Processing State**: Reset on page reload
- **Input State**: Cleared on successful send
- **Error States**: Cleared after display

## Troubleshooting Common Issues

### Button Not Responding
1. **Check**: Event listeners properly attached
2. **Verify**: CSS z-index not being overridden
3. **Confirm**: Button not disabled by state logic

### Hover Effects Not Working
1. **Check**: CSS transitions properly defined
2. **Verify**: No conflicting CSS rules
3. **Confirm**: JavaScript not preventing default behavior

### State Synchronization Issues
1. **Check**: State updates called after DOM changes
2. **Verify**: Button state updates triggered correctly
3. **Confirm**: No race conditions in async operations

## Testing Checklist

### ✅ Visual States
- Default button appearance correct
- Hover states properly implemented
- Active/click states functional
- Disabled states visually distinct

### ✅ Functional States
- Click events properly handled
- Keyboard navigation working
- State transitions smooth
- Error states recoverable

### ✅ Responsive States
- Mobile breakpoint styling correct
- Touch target sizes adequate
- Orientation changes handled
- Zoom level compatibility

### ✅ Accessibility States
- Focus management correct
- ARIA attributes present
- Color contrast compliant
- Reduced motion supported

## Related Documentation

1. [Agent Chatbot Implementation Summary](./1300_01900_AGENT-CHATBOT-IMPLEMENTATION-SUMMARY.md)
2. [Complete LangChain Implementation](./1300_01900_LANGCHAIN_CHATBOT_COMPLETE_IMPLEMENTATION.md)
3. [Master Implementation Guide](./1300_01900_MASTER_GUIDE.md)
4. [00435 Button States](./1300_00435_BUTTON_STATES.md)

## Conclusion

The 01900 Procurement button states follow established patterns from 00435 while maintaining procurement-specific styling and functionality. All buttons are properly state-managed, accessible, and responsive across devices.
