# Floating Toolbar Guide

## Overview

The floating toolbar is a development tool that provides easy access to editing rules, prompts, and system administration features for the procurement modal and other development workflows.

## How to Access

### Method 1: Toggle Button (Recommended)
- A **"🛠️ Dev Toolbar"** button appears in the bottom-left corner of the screen
- Click this button to toggle the floating toolbar on/off
- This method works for all users and doesn't require any special permissions

### Method 2: Developer Mode
The toolbar also appears automatically when:
- You have developer or admin role
- You're in development environment (localhost)
- You have debug mode enabled

## Toolbar Features

### Current Tab Actions
- **✏️ Edit Rules** - Edit validation rules for the current tab type
- **📝 Edit Prompt** - Edit AI prompts for the current document
- **📊 View Metrics** - View performance metrics and statistics

### System Actions
- **⚙️ Admin Panel** - Access system administration and configuration
- **💾 Export Config** - Export current system configuration
- **🧪 Test Workflow** - Run automated workflow tests

### Debug Information
- Current workflow stage
- Active agent type
- Session ID (truncated)
- Tab information

## Toolbar States

### Collapsed (Default)
- Shows only the "DEV MODE" label and toggle arrow
- Takes minimal screen space

### Expanded
- Shows all available actions and debug information
- Can be collapsed by clicking the toggle button

## Usage Examples

### Editing Rules
1. Open the procurement modal
2. Click the **🛠️ Dev Toolbar** toggle button
3. Click **✏️ Edit Rules**
4. Modify validation rules for the current tab
5. Save changes

### Viewing Metrics
1. Navigate to any procurement workflow tab
2. Toggle on the floating toolbar
3. Click **📊 View Metrics**
4. Review performance data and statistics

### Testing Workflows
1. Open the procurement modal
2. Toggle on the floating toolbar
3. Click **🧪 Test Workflow**
4. Monitor test results and pass/fail status

## Technical Details

### Files Involved
- `client/src/components/dev/DevModeToolbar.js` - Main toolbar component
- `client/src/components/dev/DevModeToolbar.css` - Toolbar styling
- `client/src/components/dev/DevToolbarToggle.jsx` - Toggle button component
- `client/src/components/dev/DevToolbarToggle.css` - Toggle button styling

### Storage
- Toolbar visibility state is stored in `localStorage.showDevToolbar`
- Can be toggled programmatically or via the UI button

### Permissions
- **All users**: Can use the toggle button to enable the toolbar
- **Developers/Admins**: Toolbar appears automatically
- **Production users**: Can still access via toggle button

## Troubleshooting

### Toolbar Not Appearing
1. Check if the toggle button is visible in bottom-left corner
2. Click the toggle button to enable the toolbar
3. If still not visible, check browser console for errors

### Toggle Button Not Visible
1. Ensure you're on a page that supports the toolbar (procurement pages)
2. Check if CSS files are loaded properly
3. Try refreshing the page

### Toolbar Actions Not Working
1. Check browser console for JavaScript errors
2. Ensure you have proper permissions for the action
3. Try toggling the toolbar off and on again

## Development Notes

### Adding New Actions
To add new actions to the toolbar:

1. Add the action button in `DevModeToolbar.js`:
```javascript
<button
  className="dev-btn new-action"
  onClick={handleNewAction}
>
  🆕 New Action
</button>
```

2. Implement the handler function:
```javascript
const handleNewAction = async () => {
  try {
    // Your action logic here
  } catch (error) {
    console.error('Failed to execute new action:', error);
  }
};
```

### Customizing Appearance
Modify the CSS in `DevModeToolbar.css` to customize:
- Colors and styling
- Position and size
- Animation effects
- Responsive behavior

### Integration with Other Systems
The toolbar integrates with:
- Modal system for rule/prompt editing
- Admin panel for system configuration
- Metrics system for performance monitoring
- Workflow testing framework

## Security Notes

- The toolbar is only available in development mode or when explicitly enabled
- All actions are logged for audit purposes
- Sensitive operations require appropriate user permissions
- The toolbar cannot be accessed in production without explicit enablement

## Support

For issues with the floating toolbar:
1. Check the browser console for error messages
2. Verify all required CSS and JavaScript files are loaded
3. Ensure proper user permissions are configured
4. Contact the development team with specific error details