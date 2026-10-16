# Visual Companion

## Channel Routing and Modality Selection

- Evaluate each playback summary or requirement inquiry independently to select the rendering channel based on whether spatial visualization clarifies the target decision beyond textual description.
- Route inquiries and playback summaries involving visual structures to the browser display server across 5 visual domains:
  + UI mockups ➔ Wireframes, screen layouts, navigation structures, and component designs
  + Architecture diagrams ➔ System components, data flow pipelines, and relationship maps
  + Side-by-side visual comparisons ➔ Comparative layouts, color schemes, and design directions
  + Design polish ➔ Visual hierarchy, spatial proportions, and surface styling parameters
  + Spatial relationships ➔ State machines, multi-step flowcharts, and entity relationship diagrams
- Route conceptual, scope, and trade-off inquiries to the terminal channel across 5 textual or tabular domains:
  + Requirement and scope definitions ➔ Feature boundaries, domain definitions, and acceptance criteria
  + Conceptual option selections ➔ Candidate approaches differentiated through verbal specifications
  + Trade-off evaluations ➔ Pros-and-cons lists and tabular parameter comparisons
  + Technical architecture decisions ➔ API contracts, data models, and algorithmic selections
  + Verbal clarifications ➔ Inquiries resolved through descriptive text statements
- Select the rendering channel based on the modality of the required user judgment rather than the subject topic:
  + Conceptual UI specification (`"What kind of wizard do you want?"`) ➔ Terminal text inquiry
  + Visual UI layout evaluation (`"Which of these wizard layouts feels right?"`) ➔ Browser mockup comparison

## Server Initialization and Platform Execution

- Initialize the visual companion server exclusively after user acceptance of the visual companion offer by executing the startup script with the project root path and browser auto-open flag: `bash scripts/start-server.sh --project-dir /path/to/project --open`.
- Pass the project root directory via `--project-dir` to persist generated mockups under `<project>/.superpowers/brainstorm/` across server restarts (distinct from ephemeral `/tmp` storage allocated when `--project-dir` is omitted), and instruct the user to append `.superpowers/` to `.gitignore` when absent from version control exclusions.
- Extract and retain 3 session state attributes from the startup JSON payload (`{"type":"server-started","port":52341,"url":"http://localhost:52341/?key=ab12…","screen_dir":"/path/to/project/.superpowers/brainstorm/12345-1706000000/content","state_dir":"/path/to/project/.superpowers/brainstorm/12345-1706000000/state"}`) emitted to `stdout` or persisted at `$STATE_DIR/server-info`:
  + `screen_dir` ➔ Directory monitored by the server to render the most recently modified HTML file
  + `state_dir` ➔ Directory containing runtime lifecycle markers (`$STATE_DIR/server-info`, `$STATE_DIR/server-stopped`) and the user interaction stream (`$STATE_DIR/events`)
  + `url` ➔ Complete authenticated endpoint including the mandatory `?key=…` query string that gates HTTP and WebSocket connections prior to session cookie persistence for subsequent page reloads and `/files/*` asset requests
- Adapt the server invocation command to the process lifecycle management of the active execution environment:
  + Claude Code on POSIX ➔ Execute `bash scripts/start-server.sh --project-dir /path/to/project --open` in default self-backgrounding mode
  + Claude Code on Windows ➔ Execute `bash scripts/start-server.sh --project-dir /path/to/project --open` with `run_in_background: true` on the Bash tool call to sustain the auto-selected foreground process across turns, and read `$STATE_DIR/server-info` on the subsequent turn
  + Codex ➔ Execute `bash scripts/start-server.sh --project-dir /path/to/project --open` using built-in `CODEX_CI` detection to switch automatically to foreground execution
  + Gemini CLI ➔ Execute `bash scripts/start-server.sh --project-dir /path/to/project --open --foreground` with `is_background: true` on the shell tool call
  + Copilot CLI and process-reaping harnesses ➔ Execute `bash scripts/start-server.sh --project-dir /path/to/project --open --foreground` via the host platform's background execution mechanism (invoking Git Bash's `bash.exe` from PowerShell on Windows)
  + Remote or containerized environments ➔ Bind all network interfaces and specify the external display hostname via `bash scripts/start-server.sh --project-dir /path/to/project --host 0.0.0.0 --url-host localhost`

## Iterative Rendering and Interaction Synchronization

- Verify server liveness prior to referencing the session URL or writing a screen file by confirming the presence of `$STATE_DIR/server-info` and the absence of `$STATE_DIR/server-stopped`.
- Restart a terminated server (including sessions auto-exited after 4 hours of inactivity or the custom interval defined via `--idle-timeout-minutes`) by invoking `bash scripts/start-server.sh` with the identical `--project-dir` so the server rebinds the original port and reconnects the open browser tab automatically.
- Write each visual screen to `screen_dir` using the dedicated file-creation tool (isolated from terminal-streaming `cat` or heredoc shell commands) with a unique semantic filename (`platform.html`, `visual-style.html`, `layout.html`) and append sequential version suffixes (`layout-v2.html`, `layout-v3.html`) for iterative revisions so the server serves the newest file by modification timestamp.
- Conclude each visual turn by transmitting 3 mandatory elements in the terminal response:
  + Authenticated session URL ➔ Complete `url` string including the `?key=…` query parameter on every visual turn as a fallback for headless or remote environments
  + Screen content summary ➔ Concise declarative summary of the rendered visual options (e.g., `"Showing 3 layout options for the homepage"`)
  + User action prompt ➔ Direct invitation to inspect the browser tab and reply in the terminal (`"Take a look and let me know what you think. Click to select an option if you'd like."`)
- Synthesize user feedback on the subsequent turn by reading the auto-cleared JSON Lines event stream at `$STATE_DIR/events` (e.g., `{"type":"click","choice":"a","text":"Option A - Simple Layout","timestamp":1706000101}`) when present, treating the terminal message as primary feedback while analyzing the click sequence (identifying the final `choice` event as the settled selection and intermediate clicks as hesitation indicators), or relying exclusively on the terminal text when `$STATE_DIR/events` is absent.
- Write a versioned screen file to iterate on the active visual step when user feedback modifies the current layout, advancing to the subsequent inquiry exclusively after the current step is validated.
- Push a waiting screen file (`waiting.html`, `waiting-2.html`) to `screen_dir` upon transitioning from a resolved visual step to a terminal-only inquiry to replace stale browser options:
  + Waiting screen fragment ➔ `<div style="display:flex;align-items:center;justify-content:center;min-height:60vh"><p class="subtitle">Continuing in terminal...</p></div>`
- Terminate the visual companion server upon completing the brainstorming workflow by executing `bash scripts/stop-server.sh $SESSION_DIR`, retaining persistent mockup files in `<project>/.superpowers/brainstorm/` while purging temporary `/tmp` session directories.

## Content Fragment Authoring and CSS Component Contract

- Author each screen file by default as an inner HTML content fragment isolated from `<!DOCTYPE`, `<html`, `<style>`, and `<script>` wrapper tags so `scripts/frame-template.html` and `scripts/helper.js` automatically inject the page header, CSS theme, connection status indicator, and interactive selection handlers, reserving full HTML document declarations (starting with `<!DOCTYPE` or `<html`) exclusively for screens requiring complete page override.
- Calibrate visual mockup composition across 5 structural design parameters:
  + Fidelity alignment ➔ Match rendering detail to the inquiry scope using wireframe primitives for structural layout questions and polished styling for visual hierarchy or theme questions
  + Explicit evaluation framing ➔ State the specific evaluation criteria inside the page header via `h2` and `.subtitle` elements (e.g., `"Which layout feels more professional?"`)
  + Option cardinality ➔ Constrain each comparison screen to a range of 2 to 4 selectable options
  + Representative asset grounding ➔ Populate content-sensitive layouts such as photography portfolios with domain-representative imagery (e.g., Unsplash URLs) where abstract placeholders obscure layout evaluation
  + Structural focus ➔ Prioritize spatial hierarchy and component arrangement over decorative pixel-level detail
- Construct interactive visual layouts using the pre-configured CSS classes and client-side selection handler (`onclick="toggleSelect(this)"`) provided by `scripts/frame-template.html` and `scripts/helper.js`:
  + Typography and section containers ➔ `h2` (page title), `h3` (section heading), `.subtitle` (secondary lead text below title), `.section` (content block with bottom margin), and `.label` (small uppercase label text)
  + Single-select and multi-select option lists ➔ `<div class="options">` (or `<div class="options" data-multiselect>` for multi-option toggling) wrapping `<div class="option" data-choice="a" onclick="toggleSelect(this)"><div class="letter">A</div><div class="content"><h3>Title</h3><p>Description</p></div></div>`
  + Visual design cards ➔ `<div class="cards"><div class="card" data-choice="design1" onclick="toggleSelect(this)"><div class="card-image"><!-- mockup content --></div><div class="card-body"><h3>Name</h3><p>Description</p></div></div></div>`
  + Mockup frame and side-by-side split view ➔ `<div class="mockup"><div class="mockup-header">Preview: Dashboard Layout</div><div class="mockup-body"><!-- mockup HTML --></div></div>` wrapped within `<div class="split">` for side-by-side comparison
  + Pros and cons comparison block ➔ `<div class="pros-cons"><div class="pros"><h4>Pros</h4><ul><li>Benefit</li></ul></div><div class="cons"><h4>Cons</h4><ul><li>Drawback</li></ul></div></div>`
  + Wireframe building blocks ➔ `<div class="mock-nav">Logo | Home | About | Contact</div>`, `<div style="display: flex;"><div class="mock-sidebar">Navigation</div><div class="mock-content">Main content area</div></div>`, `<button class="mock-button">Action Button</button>`, `<input class="mock-input" placeholder="Input field">`, and `<div class="placeholder">Placeholder area</div>`

- Resolve operational conflicts in the visual companion workflow in descending order of precedence: User terminal text response > Recorded browser click stream (`$STATE_DIR/events`) > Server liveness verification and complete `?key=…` URL transmission > Default content fragment wrapping over full HTML document override.
