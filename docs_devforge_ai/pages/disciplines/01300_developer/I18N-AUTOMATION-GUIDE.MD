# I18N Translation Automation Guide

## Overview

This guide provides a comprehensive system for automating I18N (Internationalization) translation management using intelligent agents. The system includes audit capabilities, automatic translation updates, and continuous monitoring.

## Components

### 1. Multi-Agent I18N Audit System (`multi_agent_i18n_audit.cjs`)
**Purpose**: Comprehensive audit of all language files to identify missing translations.

**Features**:
- Scans all page directories for translation requirements
- Compares existing translation files across languages
- Identifies missing translation files and keys
- Generates detailed reports (JSON and human-readable)

**Usage**:
```bash
node multi_agent_i18n_audit.cjs
```

**Output**:
- `i18n_audit_report.json` - Structured audit results
- `i18n_audit_report_human.md` - Readable audit report

### 2. Automated I18N Translation Agent (`auto_i18n_translation_agent.cjs`)
**Purpose**: Automatically monitors and updates translation files when source code changes.

**Key Features**:
- Monitors React components, HTML, and JavaScript files
- Extracts translation keys using multiple patterns (i18next.t, t(), data-i18n, etc.)
- Automatically adds new keys to translation files
- Supports watch mode for continuous monitoring
- Git hook integration for pre-commit validation

**Usage Examples**:

```bash
# Update all translations automatically
node auto_i18n_translation_agent.cjs --update-all

# Update specific language only
node auto_i18n_translation_agent.cjs --update-lang=ar

# Validate translation consistency
node auto_i18n_translation_agent.cjs --validate

# Watch mode for continuous monitoring
node auto_i18n_translation_agent.cjs --watch

# Install git hooks
node auto_i18n_translation_agent.cjs --install-hooks

# Generate status report
node auto_i18n_translation_agent.cjs --report

# Show help
node auto_i18n_translation_agent.cjs --help
```

## Configuration

### Supported Languages
- `en` - English (base language)
- `ar` - Arabic
- `pt` - Portuguese
- `es` - Spanish
- `fr` - French
- `zu` - Zulu
- `xh` - Xhosa
- `sw` - Swahili
- `de` - German

### Source Directories Monitored
- `client/src` - Main application source
- `client/public` - Public assets
- `client/components` - Component library

### Translation Patterns Detected
- `i18next.t('key')` - i18next function calls
- `t('key')` - Shortened translation function
- `${t('key')}` - Template literal usage
- `data-i18n="key"` - HTML data attributes
- `data-i18n-key="key"` - Alternative data attributes

## Workflow Automation

### 1. Initial Setup
```bash
# Install git hooks for automatic validation
node auto_i18n_translation_agent.cjs --install-hooks

# Run initial audit
node multi_agent_i18n_audit.cjs
```

### 2. Development Workflow
```bash
# Start watch mode in background during development
node auto_i18n_translation_agent.cjs --watch &

# Make code changes with translation keys
# Agent automatically detects and adds new keys
```

### 3. Pre-commit Validation
The git pre-commit hook automatically validates translations before allowing commits.

### 4. Manual Updates
```bash
# Update all languages when needed
node auto_i18n_translation_agent.cjs --update-all

# Update specific language for review
node auto_i18n_translation_agent.cjs --update-lang=fr
```

## Translation Key Patterns

### Page-specific Keys
Format: `{page-number}-{page-name}.{component}.{key}`
Example: `01300-governance.title`, `01300-governance.subtitle`

### Component Keys
Format: `{component}.{key}`
Example: `accordion.title`, `form.submit`

### Namespace Organization
- **Page namespaces**: `{page-number}-{page-name}` (e.g., `01300-governance`)
- **Component namespaces**: `accordion`, `chatbot`, `form-validation`
- **Common namespace**: `common` (default)

## File Structure

```
client/public/locales/
├── en/
│   ├── common.json
│   ├── accordion.json
│   ├── 01300-governance.json
│   └── ...
├── ar/
│   ├── common.json
│   ├── accordion.json
│   ├── 01300-governance.json
│   └── ...
└── ... (other languages)
```

## Agent Capabilities

### Translation Detection
- Scans source files for translation function calls
- Identifies new keys not present in translation files
- Supports multiple translation libraries and patterns

### Automatic Updates
- Adds missing keys with placeholder text
- Generates appropriate namespaces
- Maintains file structure consistency

### Validation
- Checks translation completeness across languages
- Identifies missing translations
- Reports consistency issues

### Git Integration
- Pre-commit hooks prevent commits with translation issues
- Validates translation completeness before merge

## Best Practices

### 1. Key Naming
- Use descriptive, hierarchical keys
- Follow page-specific naming conventions
- Use dot notation for hierarchical organization

### 2. Placeholder Text
- Agent generates readable placeholders
- Non-English languages get prefixed placeholders indicating translation needed
- Review and replace placeholders with actual translations

### 3. File Organization
- Keep related translations in appropriate namespaces
- Use consistent naming across languages
- Maintain alphabetical ordering in JSON files

### 4. Development Workflow
- Run translation agent in watch mode during development
- Commit translation changes with related code changes
- Use pre-commit hooks to ensure consistency

## Troubleshooting

### Common Issues

**Agent not detecting keys:**
- Check that translation patterns are correct
- Verify source directories are properly configured
- Ensure files are not excluded by patterns

**Git hook not working:**
- Verify `.git/hooks` directory exists
- Check hook file permissions (should be executable)
- Run `node auto_i18n_translation_agent.cjs --install-hooks` again

**Translation files not updating:**
- Check write permissions on locales directory
- Verify JSON syntax in existing files
- Run agent with verbose output

### Debug Commands
```bash
# Generate detailed report
node auto_i18n_translation_agent.cjs --report

# Validate current state
node auto_i18n_translation_agent.cjs --validate

# Check specific language
node auto_i18n_translation_agent.cjs --update-lang=en
```

## Integration with Development Workflow

### CI/CD Integration
Add to your CI pipeline:
```yaml
# In .github/workflows/ci.yml
- name: Validate Translations
  run: node auto_i18n_translation_agent.cjs --validate
```

### Development Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "i18n:audit": "node multi_agent_i18n_audit.cjs",
    "i18n:update": "node auto_i18n_translation_agent.cjs --update-all",
    "i18n:watch": "node auto_i18n_translation_agent.cjs --watch",
    "i18n:validate": "node auto_i18n_translation_agent.cjs --validate"
  }
}
```

## Future Enhancements

### Planned Features
- Integration with translation services (Google Translate, DeepL)
- Machine learning-based translation suggestions
- Context-aware key extraction
- Translation memory integration
- Multi-format export (XLIFF, PO files)

### Custom Extensions
The agent system is modular and can be extended for:
- Custom translation patterns
- Specialized validation rules
- Integration with specific translation workflows
- Custom reporting formats

## Support

For issues or questions about the I18N automation system:
1. Check the audit reports for specific error details
2. Review the generated update reports for recommendations
3. Run validation commands to identify specific issues
4. Check the troubleshooting section above

## Maintenance

### Regular Tasks
- Review placeholder text and replace with proper translations
- Clean up unused translation keys
- Update supported languages as needed
- Monitor agent performance and logs

### Updates
- Keep agent scripts updated with new features
- Review and update translation patterns as needed
- Monitor for new file types or frameworks requiring support