#!/bin/sh

set -u

if [ "$#" -ne 0 ]; then
  echo "usage: tests/lint-cross-harness.sh" >&2
  exit 2
fi

if [ ! -d skills ]; then
  echo "lint-cross-harness: missing skills/ directory" >&2
  exit 2
fi

if ! find skills -name '*.md' -print | grep -E -q .; then
  echo "Lint complete: 0 violations."
  exit 0
fi

EXCEPTIONS_FILE="$(dirname "$0")/lint-cross-harness.exceptions"

find skills -name '*.md' -exec awk -v exceptions_file="$EXCEPTIONS_FILE" '
  BEGIN {
    split("Claude Code\nCursor\nOpenCode\nCodex CLI\nCodex App\nGemini CLI\nGitHub Copilot CLI\nFactory Droid", harness, "\n")
    split("ExitPlanMode\nTodoWrite\nWebFetch\nTask tool\nSkill tool", tool, "\n")
    section_re = "claude code|cursor|opencode|codex|codex cli|codex app|gemini cli|github copilot cli|github copilot|copilot cli|copilot|factory droid"
    # Load internal exceptions from sidecar file. Format: path:line[:reason]
    # Comment lines start with #. Empty lines ignored. Loaded once at startup.
    if (exceptions_file != "" && (getline _line < exceptions_file) > 0) {
      do {
        if (_line !~ /^[ \t]*#/ && _line !~ /^[ \t]*$/) {
          _colon1 = index(_line, ":")
          if (_colon1 > 0) {
            _path = substr(_line, 1, _colon1 - 1)
            _rest = substr(_line, _colon1 + 1)
            _colon2 = index(_rest, ":")
            _line_no = (_colon2 > 0) ? substr(_rest, 1, _colon2 - 1) + 0 : _rest + 0
            exception_set[_path ":" _line_no] = 1
          }
        }
      } while ((getline _line < exceptions_file) > 0)
      close(exceptions_file)
    }
  }

  function trim(s) { sub(/^[ \t\r\n]+/, "", s); sub(/[ \t\r\n]+$/, "", s); return s }
  function hit_file() { if (!file_hit[file]) { file_hit[file] = 1; hit_files++ } }
  function report(class, line_no, token) {
    if (allowed(token, line_no)) return
    printf "VIOLATION [%s] %s:%d\n    %s\n", class, file, line_no, trim(line[line_no])
    violations++; hit_file()
  }
  function allow_error(line_no) {
    printf "ALLOWLIST ERROR %s:%d: invalid allowlist syntax or missing non-empty reason=\n", file, line_no
    violations++; hit_file()
  }

  function reset_file(    i) {
    for (i in line) delete line[i]
    for (i in blank) delete blank[i]
    for (i in runtime) delete runtime[i]
    for (i in allow_line) delete allow_line[i]
    for (i in allow_token) delete allow_token[i]
    file = FILENAME
    ref_tools = (file ~ /\/references\/[A-Za-z0-9_-]+-tools\.md$/)
    allow_count = runtime_depth = line_count = 0
  }

  function finish_file(    i) {
    if (file == "") return
    for (i = 1; i <= line_count; i++) scan_line(i)
  }

  function heading_depth(s, h) { h = s; sub(/[ \t].*$/, "", h); return length(h) }
  function heading_text(s, t) { t = s; sub(/^#+[ \t]*/, "", t); sub(/[ \t]*#+[ \t]*$/, "", t); return trim(t) }
  function runtime_heading(t, lower) {
    lower = tolower(t)
    return lower ~ ("^(in|for)[ \t]+(" section_re ")([ \t:,-]|$)") || lower ~ ("^(" section_re "):")
  }

  # Inline per-runtime marker: a line that begins with **In <harness>:**,
  # **For <harness>:**, or **<harness>:** (bold prose). The whole line is
  # treated as runtime-specific. Used heavily in using-superpowers SKILL.md.
  function runtime_inline(text, lower) {
    if (text !~ /^[ \t]*\*\*/) return 0
    lower = tolower(text)
    return lower ~ ("^[ \t]*\\*\\*(in|for)[ \t]+(" section_re ")([ \t:,-]|\\*\\*)") || \
           lower ~ ("^[ \t]*\\*\\*(" section_re ")[ \t]*:\\*\\*")
  }

  function read_allow(n, text, token) {
    if (text !~ /^[ \t]*<!--[ \t]*lint-cross-harness:/) return
    if (text !~ /^[ \t]*<!--[ \t]*lint-cross-harness:[ \t]*allow[ \t]+"[^"]+"[ \t]+reason="[^"]+"[ \t]*-->[ \t]*$/) {
      allow_error(n); return
    }
    token = text
    sub(/^.*allow[ \t]+"/, "", token)
    sub(/"[ \t]+reason=.*$/, "", token)
    allow_count++
    allow_line[allow_count] = n
    allow_token[allow_count] = token
  }

  function allow_end(i, n) {
    for (n = allow_line[i] + 1; n <= line_count; n++) if (blank[n]) return n - 1
    return line_count
  }

  function allowed(token, n, i) {
    for (i = 1; i <= allow_count; i++)
      if (allow_token[i] == token && n > allow_line[i] && n <= allow_end(i)) return 1
    return 0
  }

  function scan_re(class, n, regex, token_regex, text, start, len, raw, token) {
    text = line[n]
    while (match(text, regex)) {
      start = RSTART
      len = RLENGTH
      raw = substr(text, start, len)
      token = raw
      if (match(raw, token_regex)) token = substr(raw, RSTART, RLENGTH)
      report(class, n, token)
      text = substr(text, start + len)
    }
  }

  function multi_agent_line(text, i, count, seen) {
    # Allow lines that mention two or more distinct harness families. Casual
    # cross-runtime references like "~/.claude/skills for Claude Code,
    # ~/.agents/skills/ for Codex" are intentional and should not flag.
    # Detection uses a broader family list than the strict bare-harness ban
    # list so suffix-less mentions ("Codex", "Gemini") still count toward
    # the 2-agents rule.
    count = 0
    delete seen
    # Detect by family. Each family is matched by a regex covering the
    # canonical name and common suffix variants. Word boundaries via
    # whitespace/punctuation keep "Codex" from matching "Codexual" etc.
    if (text ~ /(^|[^A-Za-z])Claude([^A-Za-z]|$)/)         { if (!("claude" in seen))   { seen["claude"]=1;   count++ } }
    if (text ~ /(^|[^A-Za-z])Codex([^A-Za-z]|$)/)          { if (!("codex" in seen))    { seen["codex"]=1;    count++ } }
    if (text ~ /(^|[^A-Za-z])Cursor([^A-Za-z]|$)/)         { if (!("cursor" in seen))   { seen["cursor"]=1;   count++ } }
    if (text ~ /(^|[^A-Za-z])OpenCode([^A-Za-z]|$)/)       { if (!("opencode" in seen)) { seen["opencode"]=1; count++ } }
    if (text ~ /(^|[^A-Za-z])Gemini([^A-Za-z]|$)/)         { if (!("gemini" in seen))   { seen["gemini"]=1;   count++ } }
    if (text ~ /(^|[^A-Za-z])Copilot([^A-Za-z]|$)/)        { if (!("copilot" in seen))  { seen["copilot"]=1;  count++ } }
    if (text ~ /(^|[^A-Za-z])Factory Droid([^A-Za-z]|$)/)  { if (!("droid" in seen))    { seen["droid"]=1;    count++ } }
    if (text ~ /(^|[^A-Za-z])Aider([^A-Za-z]|$)/)          { if (!("aider" in seen))    { seen["aider"]=1;    count++ } }
    if (text ~ /(^|[^A-Za-z])Cline([^A-Za-z]|$)/)          { if (!("cline" in seen))    { seen["cline"]=1;    count++ } }
    if (text ~ /(^|[^A-Za-z])Windsurf([^A-Za-z]|$)/)       { if (!("windsurf" in seen)) { seen["windsurf"]=1; count++ } }
    if (text ~ /(^|[^A-Za-z])Hermes([^A-Za-z]|$)/)         { if (!("hermes" in seen))   { seen["hermes"]=1;   count++ } }
    if (text ~ /(^|[^A-Za-z])Hyperagent([^A-Za-z]|$)/)     { if (!("hyper" in seen))    { seen["hyper"]=1;    count++ } }
    if (text ~ /(^|[^A-Za-z])Antigravity([^A-Za-z]|$)/)    { if (!("antigrav" in seen)) { seen["antigrav"]=1; count++ } }
    if (text ~ /(^|[^A-Za-z])Kiro([^A-Za-z]|$)/)           { if (!("kiro" in seen))     { seen["kiro"]=1;     count++ } }
    if (text ~ /(^|[^A-Za-z])Qwen([^A-Za-z]|$)/)           { if (!("qwen" in seen))     { seen["qwen"]=1;     count++ } }
    if (text ~ /(^|[^A-Za-z])Kimi([^A-Za-z]|$)/)           { if (!("kimi" in seen))     { seen["kimi"]=1;     count++ } }
    return (count >= 2)
  }

  function in_exceptions(file_path, line_no, normalized) {
    # Strip any "./" prefix so the sidecar list matches what skills/<dir>/<file>:N
    # would report.
    normalized = file_path
    sub(/^\.\//, "", normalized)
    return ((normalized ":" line_no) in exception_set)
  }

  function scan_line(n, i, in_runtime_context) {
    if (line[n] ~ /^[ \t]*<!--[ \t]*lint-cross-harness:/) return

    # Skip lines covered by the sidecar exceptions file (path:line). These
    # are maintained internally so the lint can carry its own list without
    # polluting skill content with inline allowlist comments.
    if (in_exceptions(file, n)) return

    # Skip lines that mention two or more distinct harness names. Per
    # maintainer guidance (#1603 review): casual mentions are fine when at
    # least two agents are named together, which is the marker for
    # intentional cross-runtime prose.
    if (multi_agent_line(line[n])) return

    # Line is in a runtime context if the heading hierarchy puts it inside a
    # per-runtime section block, OR if the line itself starts with an inline
    # bold-prose runtime marker (for example **In Claude Code:** ...), OR if
    # the file is a references/<runtime>-tools.md doc whose entire purpose
    # is describing one runtime tooling.
    in_runtime_context = (runtime[n] || runtime_inline(line[n]) || ref_tools)

    if (!in_runtime_context)
      for (i = 1; i in harness; i++)
        if (index(line[n], harness[i]) > 0) report("bare-harness-name", n, harness[i])

    # Model identifiers are always banned. They date the content and break on
    # release. No runtime-context exemption.
    scan_re("model-id", n, "(^|[^[:alnum:]_])claude-(opus|sonnet|haiku)-[0-9]+(-[0-9]+)*([^[:alnum:]_]|$)", "claude-(opus|sonnet|haiku)-[0-9]+(-[0-9]+)*")
    scan_re("model-id", n, "(^|[^[:alnum:]_])gpt-[0-9]+(\\.[0-9]+)?([^[:alnum:]_]|$)", "gpt-[0-9]+(\\.[0-9]+)?")
    scan_re("model-id", n, "(^|[^[:alnum:]_])gemini-[0-9]+(\\.[0-9]+)?-(pro|flash|ultra)([^[:alnum:]_]|$)", "gemini-[0-9]+(\\.[0-9]+)?-(pro|flash|ultra)")
    scan_re("model-id", n, "(^|[^[:alnum:]_])o[0-9](-mini|-preview)?([^[:alnum:]_]|$)", "o[0-9](-mini|-preview)?")

    if (!in_runtime_context) {
      for (i = 1; i in tool; i++)
        if (index(line[n], tool[i]) > 0) report("runtime-tool", n, tool[i])
      scan_re("runtime-tool", n, "mcp__[A-Za-z_]+__[A-Za-z_]+", "mcp__[A-Za-z_]+__[A-Za-z_]+")
    }

    # Hardcoded /Users/<name>/ paths are always banned regardless of runtime
    # context (PR #1122 cleaned existing instances; lint prevents regression).
    scan_re("hardcoded-path", n, "/Users/[A-Za-z][A-Za-z0-9_-]+/", "/Users/[A-Za-z][A-Za-z0-9_-]+/")
  }

  FNR == 1 { finish_file(); reset_file() }

  {
    line[FNR] = $0
    blank[FNR] = ($0 ~ /^[ \t]*$/)
    read_allow(FNR, $0)
    if ($0 ~ /^#+[ \t]+/) {
      depth = heading_depth($0)
      if (runtime_depth && depth <= runtime_depth) runtime_depth = 0
      if (runtime_heading(heading_text($0))) runtime_depth = depth
    }
    runtime[FNR] = (runtime_depth > 0)
    line_count = FNR
  }

  END {
    finish_file()
    if (violations) {
      printf "Lint complete: %d violations in %d files.\n", violations, hit_files
      exit 1
    }
    print "Lint complete: 0 violations."
  }
' {} +
