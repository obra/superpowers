#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../../.. && pwd)"
FIXTURE_DIR="$ROOT/tests/skill-trigger/fixtures/execution-lane"
OUT_ROOT="${TMPDIR:-/tmp}/claude-execution-lane"
CLAUDE_BARE="${SKILL_TRIGGER_CLAUDE_BARE:-false}"
CLAUDE_PLUGIN_DIR="${SKILL_TRIGGER_CLAUDE_PLUGIN_DIR:-}"
mkdir -p "$OUT_ROOT"

ruby <<'RUBY'
require 'psych'
require 'json'
require 'open3'
require 'fileutils'

root = File.expand_path('/Users/zego/Zego/horspowers/.worktrees/codex-skill-compat')
fixture = File.join(root, 'tests/skill-trigger/fixtures/execution-lane')
corpus_path = File.join(root, 'tests/skill-trigger/corpus-execution-lane.yaml')
startup_path = File.join(root, 'tests/skill-trigger/claude/startup-v1.md')
content = File.read(corpus_path)
corpus = begin
  Psych.safe_load(content, aliases: true)
rescue ArgumentError
  Psych.safe_load(content, [], [], true)
end
startup_text = File.read(startup_path)
claude_bare = ENV.fetch('SKILL_TRIGGER_CLAUDE_BARE', 'false') == 'true'
claude_plugin_dir = ENV.fetch('SKILL_TRIGGER_CLAUDE_PLUGIN_DIR', '')

out_root = File.join(ENV.fetch('TMPDIR', '/tmp'), 'claude-execution-lane', Time.now.strftime('%Y%m%d-%H%M%S'))
FileUtils.mkdir_p(out_root)
summary = []

corpus.each_with_index do |row, idx|
  sample_dir = File.join(out_root, format('%02d-%s', idx + 1, row.fetch('id').gsub(/[^a-zA-Z0-9]+/, '-').downcase))
  FileUtils.mkdir_p(sample_dir)
  cmd = ['claude', '-p', row.fetch('user_message')]
  cmd += ['--append-system-prompt', startup_text] unless startup_text.empty?
  cmd << '--bare' if claude_bare
  cmd += ['--plugin-dir', claude_plugin_dir] unless claude_plugin_dir.empty?
  cmd += ['--permission-mode', 'bypassPermissions']
  stdout = +''
  stderr = +''
  status = nil
  timed_out = false

  Open3.popen3(*cmd, chdir: fixture) do |stdin, out, err, wait_thr|
    stdin.close
    out_thread = Thread.new { out.read }
    err_thread = Thread.new { err.read }
    if wait_thr.join(120)
      status = wait_thr.value
    else
      timed_out = true
      Process.kill('TERM', wait_thr.pid) rescue nil
      wait_thr.join(5) || (Process.kill('KILL', wait_thr.pid) rescue nil)
      wait_thr.join
      status = wait_thr.value
    end
    stdout = out_thread.value
    stderr = err_thread.value
  end

  stdout_path = File.join(sample_dir, 'claude.stdout.txt')
  stderr_path = File.join(sample_dir, 'claude.stderr.txt')
  File.write(stdout_path, stdout)
  File.write(stderr_path, stderr)

  summary << {
    id: row.fetch('id'),
    expected_skill: row.fetch('expected_skill'),
    exit_code: status&.exitstatus,
    timed_out: timed_out,
    stdout_bytes: stdout.bytesize,
    stderr_bytes: stderr.bytesize,
    stdout_path: stdout_path,
    stderr_path: stderr_path
  }
end

summary_path = File.join(out_root, 'summary.json')
File.write(summary_path, JSON.pretty_generate(summary))
puts out_root
RUBY
