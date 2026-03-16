# Brakeman Command Options Reference

Complete reference for all Brakeman command-line options.

## Output Options

### `-o, --output FILE`
Specify output file for the report.

```bash
brakeman -o report.html
brakeman -o report.json
```

Multiple output files can be specified:
```bash
brakeman -o report.html -o report.json -o report.csv
```

### `-f, --format FORMAT`
Specify output format explicitly.

**Formats**:
- `text` - Plain text (default for stdout)
- `html` - HTML report with interactive features
- `json` - JSON format for programmatic processing
- `tabs` - Tab-separated values
- `csv` - Comma-separated values
- `markdown` - Markdown format
- `junit` - JUnit XML format for CI tools
- `codeclimate` - Code Climate format
- `sonar` - SonarQube format

```bash
brakeman -f json -o report.json
brakeman -f html -o report.html
```

### `-q, --quiet`
Suppress informational messages. Only show warnings and the final report.

```bash
brakeman -q
```

**Note**: Informational messages go to stderr, reports go to stdout.

### `--color`
Enable color output in terminal.

```bash
brakeman --color
brakeman --color -o /dev/stdout -o report.json
```

## Scan Control Options

### `-p, --path PATH`
Specify the application path to scan. Default is current directory.

```bash
brakeman -p /path/to/rails/app
brakeman --path ../my-app
```

### `-A, --run-all-checks`
Run all checks. Normally, disabled checks are not run.

### `-t, --test CHECK1,CHECK2,...`
Run only specified checks.

```bash
brakeman -t SQL,CrossSiteScripting
brakeman --test CommandInjection,MassAssignment,Authentication
```

Use `brakeman --checks` to see all available check names.

### `-x, --except CHECK1,CHECK2,...`
Skip specified checks.

```bash
brakeman -x DefaultRoutes,Redirect
brakeman --except Render,LinkTo
```

### `--faster`
Faster but less thorough scan. Equivalent to `--skip-libs --no-branching`.

```bash
brakeman --faster
```

**Warning**: May miss some vulnerabilities.

### `--skip-libs`
Skip processing of library files.

### `--skip-files FILE1,PATH2,...`
Skip specified files or directories.

```bash
brakeman --skip-files vendor/,tmp/,lib/legacy/
brakeman --skip-files config/initializers/legacy.rb,app/models/old_model.rb
```

## Confidence Level Options

### `-w, --confidence-level LEVEL`
Set minimum confidence level for reporting warnings.

- `1` - Low and above (all warnings, default)
- `2` - Medium and above
- `3` - High only

```bash
brakeman -w3  # High confidence only
brakeman -w2  # Medium and high
brakeman -w1  # All warnings
```

## Comparison Options

### `--compare FILE`
Compare current scan with a previous JSON report.

```bash
brakeman --compare old_report.json
```

Output shows:
- Fixed warnings (resolved issues)
- New warnings (new issues introduced)

### `--compare-branch BRANCH`
Compare current branch with specified branch using Git.

```bash
brakeman --compare-branch main
brakeman --compare-branch v1.0.0
```

### `--compare-base`
Automatically compare with base branch (useful in CI).

## Configuration Options

### `-c, --config-file FILE`
Specify configuration file to use.

```bash
brakeman -c config/brakeman_strict.yml
brakeman --config-file ~/.brakeman/custom.yml
```

Default locations checked:
1. `./config/brakeman.yml`
2. `~/.brakeman/config.yml`
3. `/etc/brakeman/config.yml`

### `-C, --print-config`
Output currently set options in YAML format.

```bash
brakeman -C
brakeman -C --skip-files vendor/ > config/brakeman.yml
```

## Ignore Options

### `-i, --ignore-config FILE`
Specify ignore configuration file.

```bash
brakeman -i config/brakeman.ignore
brakeman --ignore-config .brakeman.ignore
```

Default: `config/brakeman.ignore`

### `-I, --interactive-ignore`
Interactively manage ignored warnings.

```bash
brakeman -I
```

Launches interactive mode to:
- Review all warnings
- Add or remove warnings from ignore list
- Add notes explaining why warnings are ignored
- Save configuration

### `--ignore-model-output`
Consider model attributes XSS-safe.

### `--ignore-protected`
Consider models with `attr_protected` safe from mass assignment.

### `--show-ignored`
Show warnings that are currently ignored.

```bash
brakeman --show-ignored
```

Useful for periodic review of ignored items.

## Exit Code Options

### `--no-exit-on-warn`
Don't return non-zero exit code when warnings are found.

```bash
brakeman --no-exit-on-warn
```

### `--no-exit-on-error`
Don't return non-zero exit code on scanning errors.

```bash
brakeman --no-exit-on-error
```

Combine both:
```bash
brakeman --no-exit-on-warn --no-exit-on-error
```

### `--exit-on-error`
Return non-zero exit code on any error (opposite of --no-exit-on-error).

## Rails Version Options

### `-r, --rails3`
Force Rails 3 mode.

### `--rails4`
Force Rails 4 mode.

### `--rails5`
Force Rails 5 mode.

### `--rails6`
Force Rails 6 mode.

### `--rails7`
Force Rails 7 mode.

Usually auto-detected, but can be forced for edge cases.

## Advanced Scanning Options

### `--interprocedural`
Enable interprocedural analysis. More thorough but slower.

### `--no-branching`
Disable flow sensitivity in conditions. Faster but less accurate.

### `--branch-limit LIMIT`
Limit branches analyzed in a single method (default: 5).

```bash
brakeman --branch-limit 10
```

### `--parser-timeout SECONDS`
Set timeout for parsing each file (default: 10 seconds).

```bash
brakeman --parser-timeout 30
```

## False Positive Reduction Options

### `--safe-methods METHOD1,METHOD2,...`
Mark specified methods as safe for output.

```bash
brakeman --safe-methods sanitize_input,clean_content
```

Useful for custom sanitization methods.

### `--url-safe-methods METHOD1,METHOD2,...`
Mark methods as safe for URLs in `link_to`.

### `--report-direct`
Report calls to potentially unsafe methods even without user input.

### `--absolute-paths`
Output absolute file paths in reports.

## Report Content Options

### `-s, --summary`
Only output summary, no warning details.

```bash
brakeman -s
```

### `--no-summary`
Suppress summary in output.

### `--table-width WIDTH`
Set width of table output (default: terminal width).

```bash
brakeman --table-width 120
```

### `--no-pager`
Don't use pager for output (automatically disabled if output is not a TTY).

### `--[no-]progress`
Show/hide progress bar during scan.

### `--[no-]highlights`
Enable/disable syntax highlighting in reports (HTML/terminal).

## Information Options

### `-h, --help`
Display help message.

```bash
brakeman -h
brakeman --help
```

### `-v, --version`
Display Brakeman version.

```bash
brakeman -v
```

### `--checks`
List all available checks.

```bash
brakeman --checks
```

Output includes check names (case-sensitive) for use with `-t` and `-x` options.

### `-d, --debug`
Enable debug output.

```bash
brakeman -d
```

Provides verbose information about scanning process.

## Reporting Options

### `--message-limit LENGTH`
Limit message length in reports.

```bash
brakeman --message-limit 100
```

### `--report-routes`
Include report of all routes in output.

### `--[no-]github-repo REPO`
Add GitHub repository link to HTML reports.

```bash
brakeman --github-repo owner/repo
```

Links warnings to specific files on GitHub.

## Common Option Combinations

### Initial Security Audit
```bash
brakeman -o audit.html -o audit.json --report-routes
```

### CI/CD Security Gate (High Confidence Only)
```bash
brakeman -w3 -f json -o results.json --no-exit-on-error
```

### Quick Focused Scan
```bash
brakeman --faster -t SQL,CrossSiteScripting,CommandInjection -w2 -q
```

### Comprehensive Scan with Comparison
```bash
brakeman -o new.json --compare old.json --show-ignored
```

### Debug Slow Scans
```bash
brakeman -d --no-branching --skip-libs
```

### Interactive False Positive Management
```bash
brakeman -I --color
```

### Generate Configuration Template
```bash
brakeman -C -w2 --skip-files vendor/,node_modules/ > config/brakeman.yml
```

## Configuration File Format

Configuration files use YAML format:

```yaml
---
# Confidence level (1-3)
:confidence_level: 2

# Output format
:output_format: json

# Output files
:output_files:
  - brakeman-report.html
  - brakeman-report.json

# Minimum confidence level
:min_confidence: 2

# Run only specific checks
:run_checks:
  - SQL
  - CrossSiteScripting
  - CommandInjection

# Skip specific checks
:skip_checks:
  - Redirect
  - DefaultRoutes

# Skip files/directories
:skip_files:
  - vendor/
  - node_modules/
  - lib/legacy/

# Ignore config location
:ignore_file: config/brakeman.ignore

# Safe methods
:safe_methods:
  - sanitize_input
  - clean_html

# Exit codes
:exit_on_warn: false
:exit_on_error: false

# Scanning options
:interprocedural: true
:branch_limit: 10
:parser_timeout: 15

# Output options
:quiet: true
:print_report: true
:summary_only: false

# Report options
:report_routes: true
:github_repo: myorg/myrepo

# Advanced options
:ignore_model_output: false
:ignore_protected: false
:message_limit: 200
:parallel_checks: true
:relative_paths: true
:report_progress: true
```

## Environment Variables

### `BRAKEMAN_SKIP_LIBS`
Skip library files (same as `--skip-libs`).

```bash
export BRAKEMAN_SKIP_LIBS=1
brakeman
```

### `BRAKEMAN_DEBUG`
Enable debug mode (same as `-d`).

```bash
export BRAKEMAN_DEBUG=1
brakeman
```

## Exit Codes

- `0` - No warnings found, scan completed successfully
- Non-zero - Warnings found or errors encountered

Control with `--no-exit-on-warn` and `--no-exit-on-error` options.

## Performance Tips

1. **Use `--faster` for quick feedback loops**
   ```bash
   brakeman --faster
   ```

2. **Skip unnecessary directories**
   ```bash
   brakeman --skip-files vendor/,node_modules/,tmp/
   ```

3. **Run specific checks only**
   ```bash
   brakeman -t SQL,CrossSiteScripting -w2
   ```

4. **Disable branching for large codebases**
   ```bash
   brakeman --no-branching
   ```

5. **Skip library analysis**
   ```bash
   brakeman --skip-libs
   ```

6. **Increase parser timeout for complex files**
   ```bash
   brakeman --parser-timeout 30
   ```

## Integration Examples

### GitHub Actions
```yaml
name: Brakeman Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Brakeman scan
        run: |
          gem install brakeman
          brakeman -w2 -o brakeman-results.html -o brakeman-results.json
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: brakeman-report
          path: brakeman-results.*
```

### GitLab CI
```yaml
brakeman:
  stage: test
  script:
    - gem install brakeman
    - brakeman -w2 -o brakeman-report.html -o brakeman-report.json
  artifacts:
    paths:
      - brakeman-report.*
    expire_in: 1 week
```

### Jenkins Pipeline
```groovy
stage('Security Scan') {
  steps {
    sh 'gem install brakeman'
    sh 'brakeman -w2 -o brakeman-report.html -o brakeman-report.json'
    publishHTML([
      reportDir: '.',
      reportFiles: 'brakeman-report.html',
      reportName: 'Brakeman Security Report'
    ])
  }
}
```

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running Brakeman security scan..."
brakeman -w3 -q --no-exit-on-warn

exit 0
```

## Troubleshooting

### Scan Timeout Issues
```bash
# Increase parser timeout
brakeman --parser-timeout 60

# Or skip problematic files
brakeman --skip-files lib/problematic_file.rb
```

### Memory Issues
```bash
# Reduce memory usage
brakeman --skip-libs --no-branching --faster
```

### Slow Scans
```bash
# Profile to find slow checks
brakeman -d 2>&1 | grep "Check time"

# Then skip slow checks if appropriate
brakeman -x SlowCheck1,SlowCheck2
```

### False Positive Overload
```bash
# Start with high confidence only
brakeman -w3

# Mark safe methods
brakeman --safe-methods my_sanitize,my_escape

# Use interactive ignore
brakeman -I
```
