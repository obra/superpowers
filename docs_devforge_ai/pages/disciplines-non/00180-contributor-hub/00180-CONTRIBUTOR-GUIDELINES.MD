# 📝 Contributor Guidelines

## Code Contribution Standards

### File Structure
- All files must follow the 5-digit prefix naming convention (e.g., `00000-filename.js`)
- CSS files should be colocated with their components
- Test files should mirror the main file structure with `.test.js` suffix

### Coding Style
- Use 2-space indentation
- Follow JavaScript Standard Style
- Use descriptive variable names
- Include JSDoc comments for all functions
- Keep functions small and focused (max 30 lines)

## Branching Strategy

### Naming Convention
Branches should follow this pattern:
```
[agentType]-[taskId]
```
Example: `00435-legal-123`

### Commit Messages
- Use present tense ("Add feature" not "Added feature")
- Keep first line under 50 characters
- Include detailed description after blank line if needed
- Reference issue numbers when applicable

## Task Workflow

1. **Create branch** using the Contributor Hub
2. **Implement changes** following guidelines
3. **Run tests** before committing
4. **Create pull request** with:
   - Description of changes
   - Screenshots if UI changes
   - Testing instructions
5. **Get approval** from project maintainer
6. **Merge to main** using squash merge

## Quality Standards

✅ All new code must have tests  
✅ Documentation must be updated  
✅ No console.log statements in production code  
✅ Follow accessibility guidelines  
✅ Performance impact must be considered  

## Modal Development

### Creating Modals After Hub Assignment

When you create a modal assignment via the Contributor Hub:
- ✅ Database records are created automatically
- ✅ Modal registry is updated
- ❌ **React component files are NOT created automatically**

You must manually create the component files following these resources:

#### Quick Start
- **[Modal Quick Reference](docs/1300_00180_MODAL_QUICK_REFERENCE.md)** - Get started in 5 minutes
- **[Modal Development Guide](docs/1300_00180_MODAL_DEVELOPMENT_GUIDE.md)** - Complete templates and patterns
- **[Modal Workflow Guide](docs/1300_00180_MODAL_WORKFLOW_GUIDE.md)** - Step-by-step process

#### Key Requirements
- Follow exact folder structure: `client/src/pages/[PREFIX]-[PAGE]/components/modals/`
- Use naming convention: `[PREFIX]-[XX]-[ModalName].js`
- Integrate with shared chatbot system
- Add modal trigger button to main page component
- Test thoroughly before submission

#### Modal Types
- **Agent Modals**: AI-powered analysis and assistance
- **File Processing Modals**: Document uploads and processing  
- **Form Modals**: Data entry and configuration

## Available Resources

- `validate-contributor-structure.sh` - Validates file structure
- `test-all.sh` - Runs all test suites
- `fix-syntax-errors.sh` - Automatically fixes common issues
- **Modal Development Guides** - Complete modal creation documentation

## Getting Help

For assistance, use:
- `#contributor-support` Slack channel
- GitHub Discussions
- Weekly office hours (Wednesdays 2-4pm)
- **Modal Development Guides** - Comprehensive documentation and troubleshooting
