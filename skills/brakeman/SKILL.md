---
name: brakeman
description: Static analysis security vulnerability scanner for Ruby on Rails applications. Use when analyzing Rails code for security issues, running security audits, reviewing code for vulnerabilities, setting up security scanning in CI/CD, managing security warnings, or investigating specific vulnerability types (SQL injection, XSS, command injection, etc.). Also use when configuring Brakeman, reducing false positives, or integrating with automated workflows.
---

# Brakeman Security Scanner

## Overview

Brakeman is a static analysis tool that checks Ruby on Rails applications for security vulnerabilities without requiring a running application. It analyzes source code to detect common security issues including SQL injection, cross-site scripting (XSS), command injection, mass assignment, and many other vulnerability types.

## Installation

Verify Brakeman is installed before running scans. If not present, install using one of these methods:

```bash
# Using RubyGems (recommended)
gem install brakeman

# Using Bundler (add to Gemfile)
group :development do
  gem 'brakeman', require: false
end

# Using Docker
docker pull presidentbeef/brakeman
```

Brakeman requires Ruby 3.0.0+ to run, but can analyze code written with Ruby 2.0+ syntax. It works with Rails 2.3.x through 8.x.

## Basic Usage

### Quick Scan

Run a basic security scan from the Rails application root:

```bash
brakeman
```

From outside the Rails root:

```bash
brakeman /path/to/rails/application
```

### Output Formats

Generate reports in various formats:

```bash
# HTML report
brakeman -o report.html

# JSON report (useful for comparison and automation)
brakeman -o report.json

# Multiple output formats simultaneously
brakeman -o report.html -o report.json

# Output to console with color and file
brakeman --color -o /dev/stdout -o report.json

# Quiet mode (suppress informational messages)
brakeman -q
```

Available output formats: `text`, `html`, `tabs`, `json`, `junit`, `markdown`, `csv`, `codeclimate`, `sonar`

## Workflow Decision Tree

```
Is Brakeman already installed?
├─ No → Install using gem, bundler, or docker
└─ Yes → Continue

What is the goal?
├─ Initial security assessment → Run basic scan: `brakeman`
├─ Generate report for review → Choose format: `brakeman -o report.html`
├─ CI/CD integration → Use JSON output: `brakeman -o report.json`
├─ Too many warnings → Adjust confidence level or filter checks
├─ False positives → Use interactive ignore tool: `brakeman -I`
├─ Compare with previous scan → Use --compare flag
└─ Configuration needed → Create config/brakeman.yml
```

## Confidence Levels

Brakeman assigns confidence levels to each warning:

- **High**: Simple warning or user input very likely being used unsafely
- **Medium**: Unsafe use of variable that may or may not be user input
- **Weak**: User input indirectly used in potentially unsafe manner

Filter warnings by confidence level:

```bash
# Only high confidence warnings
brakeman -w3

# High and medium confidence warnings
brakeman -w2

# All warnings (default)
brakeman -w1
```

## Managing Warnings

### Filtering Checks

Run only specific checks:

```bash
# Run only SQL and XSS checks
brakeman -t SQL,CrossSiteScripting

# Skip specific checks
brakeman -x DefaultRoutes,Redirect

# Skip multiple checks
brakeman -x DefaultRoutes,Redirect,SQL
```

Use `brakeman --checks` to list all available check names (case-sensitive).

### Interactive Ignore Configuration

Manage false positives interactively:

```bash
brakeman -I
```

This launches an interactive tool that:
1. Presents each warning with context
2. Allows you to ignore, skip, or add notes
3. Saves configuration to `config/brakeman.ignore`

Options during interactive review:
- `i` - Add warning to ignore list
- `n` - Add warning to ignore list with note (recommended)
- `s` - Skip this warning
- `u` - Remove from ignore list
- `a` - Ignore remaining warnings
- `k` - Skip remaining warnings
- `q` - Quit without saving

Always add notes when ignoring warnings to document why they're false positives.

### Show Ignored Warnings

Temporarily view ignored warnings without affecting exit code:

```bash
brakeman --show-ignored
```

## Comparing Scans

Track security improvements or regressions by comparing scans:

```bash
# Generate baseline report
brakeman -o baseline.json

# Run new scan and compare
brakeman --compare baseline.json
```

Output shows:
- Fixed warnings (resolved since baseline)
- New warnings (introduced since baseline)

## Configuration

### Configuration Files

Store Brakeman options in YAML configuration files. Default locations (checked in order):
1. `./config/brakeman.yml`
2. `~/.brakeman/config.yml`
3. `/etc/brakeman/config.yml`

Specify a custom configuration file:

```bash
brakeman -c custom_config.yml
```

### Generate Configuration

Output current options to create a configuration file:

```bash
brakeman -C --skip-files plugins/ > config/brakeman.yml
```

Command-line options override configuration file settings.

### Example Configuration

```yaml
---
:skip_files:
  - vendor/
  - lib/legacy/
:confidence_level: 2
:output_files:
  - reports/brakeman.html
  - reports/brakeman.json
:quiet: true
```

## Performance Optimization

Speed up scans with faster mode (skips some features):

```bash
brakeman --faster
```

Equivalent to: `--skip-libs --no-branching`

**Warning**: May miss some vulnerabilities. Use only when scan speed is critical.

Skip problematic files or directories:

```bash
brakeman --skip-files file1.rb,vendor/,legacy/
```

## Advanced Options

### Safe Methods

Mark custom sanitizing methods as safe to reduce false positives:

```bash
brakeman --safe-methods sanitize_input,clean_html
```

### Exit Codes

Control exit code behavior:

```bash
# Don't exit with error on warnings
brakeman --no-exit-on-warn

# Don't exit with error on scanning errors
brakeman --no-exit-on-error

# Both
brakeman --no-exit-on-warn --no-exit-on-error
```

Default behavior: Non-zero exit code if warnings found or errors encountered.

### Debugging

Enable verbose debugging output:

```bash
brakeman -d
```

## CI/CD Integration

### GitHub Actions

Several Brakeman actions available on GitHub Marketplace. Search for "brakeman" in GitHub Actions.

### Jenkins

Brakeman plugin available for Jenkins/Hudson integration. See documentation at brakemanscanner.org/docs/jenkins/

### Guard

For continuous testing during development:

```bash
gem install guard-brakeman
```

### Generic CI Integration

```bash
#!/bin/bash
# Example CI script

# Run Brakeman and save results
brakeman -o brakeman-report.json -o brakeman-report.html --no-exit-on-warn

# Check if there are any high confidence warnings
if brakeman -w3 --quiet; then
  echo "No high confidence security warnings found"
  exit 0
else
  echo "High confidence security warnings detected!"
  exit 1
fi
```

## Warning Types Reference

Brakeman detects 30+ vulnerability types. For detailed descriptions and remediation guidance, see `references/warning_types.md`.

Common warning types include:
- SQL Injection
- Cross-Site Scripting (XSS)
- Command Injection
- Mass Assignment
- Cross-Site Request Forgery (CSRF)
- Remote Code Execution
- Path Traversal
- Unsafe Redirects
- File Access
- Authentication Issues
- SSL Verification Bypass
- Unmaintained Dependencies
- And many more...

## Command Reference

For comprehensive option reference including less common flags and detailed explanations, see `references/command_options.md`.

## Best Practices

1. **Run regularly**: Integrate into development workflow and CI/CD pipeline
2. **Start with high confidence**: Use `-w3` initially to focus on critical issues
3. **Document ignored warnings**: Always add notes explaining why warnings are ignored
4. **Compare scans**: Use `--compare` to track security posture over time
5. **Review all warnings**: Even weak warnings can indicate real vulnerabilities
6. **Keep Brakeman updated**: Security checks improve with each release
7. **Don't ignore blindly**: Investigate each warning before marking as false positive
8. **Use configuration files**: Maintain consistent scan settings across team
9. **Generate multiple formats**: HTML for review, JSON for automation
10. **Test ignored warnings periodically**: Re-review with `--show-ignored`

## Common Workflows

### Initial Security Audit

```bash
# 1. Run comprehensive scan
brakeman -o initial-audit.html -o initial-audit.json

# 2. Review high confidence warnings first
brakeman -w3 -o high-confidence.html

# 3. Interactively manage false positives
brakeman -I

# 4. Save configuration for future scans
brakeman -C > config/brakeman.yml
```

### CI/CD Security Gate

```bash
# Fail build only on high confidence warnings
brakeman -w3 --no-exit-on-error
```

### Tracking Improvements

```bash
# Baseline scan
brakeman -o baseline.json

# After fixes, compare
brakeman --compare baseline.json -o improvements.json
```

### Reducing Noise

```bash
# Focus on specific vulnerability types
brakeman -t SQL,CrossSiteScripting,CommandInjection -w2

# Or exclude noisy checks
brakeman -x DefaultRoutes,Redirect -w2
```

## Troubleshooting

**Problem**: Too many weak confidence warnings
**Solution**: Use `-w2` or `-w3` to filter by confidence level

**Problem**: Scanning is very slow
**Solution**: Use `--faster` flag or `--skip-files` to exclude large directories

**Problem**: False positives for custom sanitization
**Solution**: Use `--safe-methods` to mark methods as safe

**Problem**: Warnings about database values
**Solution**: Consider if database values truly safe; if yes, adjust with `--interprocedural` or configuration

**Problem**: Can't parse certain files
**Solution**: Use `--skip-files` to exclude problematic files

## Resources

### references/warning_types.md
Comprehensive descriptions of all 30+ vulnerability types Brakeman can detect, including examples and remediation guidance.

### references/command_options.md
Complete command-line reference with detailed explanations of all available options and flags.

### references/reducing_false_positives.md
Strategies and techniques for minimizing false positives while maintaining security coverage.
