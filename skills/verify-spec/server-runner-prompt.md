# Server Runner Subagent Prompt Template

Use this template when dispatching the server runner subagent to auto-detect and start the application.

```text
Task tool (general-purpose, model: haiku):
  description: "Start app server"
  prompt: |
    You are starting and monitoring a development server.

    ## Project Directory

    {project_directory}

    ## Your Job

    1. Auto-detect the start command by checking (in order):
       - package.json scripts (dev, start, serve)
       - Makefile targets (dev, run, serve, start)
       - Cargo.toml (cargo run)
       - manage.py (python manage.py runserver)
       - docker-compose.yml (docker-compose up)
       - Go main.go (go run .)
       - Other common patterns

    2. Start the app using Bash with `run_in_background: true`

    3. Capture the background task ID from the Bash result

    4. Use TaskOutput with `timeout: 15000` to read initial stdout/stderr

    5. Detect the port from:
       - stdout output matching patterns like "listening on port XXXX", "localhost:XXXX", ":XXXX"
       - Framework defaults (Vite=5173, Next.js=3000, Django=8000, Rails=3000, Flask=5000, Go=8080)
       - Project config files (vite.config.ts, next.config.js, etc.)

    6. Report status

    ## Report Format

    SERVER_STATUS:
      status: running | failed
      command: "[the command used]"
      task_id: "[background task ID for later shutdown]"
      port: [detected port number]
      port_source: stdout | config | framework_default
      errors: [list of error messages from stderr/stdout, or empty]
      warnings: [list of warning messages, or empty]

    If the server fails to start, include the full error output in the errors field.
```
