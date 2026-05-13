#!/usr/bin/env ruby
# frozen_string_literal: true

require "fileutils"
require "json"
require "open3"
require "psych"
require "time"

ROOT = File.expand_path("../../..", __dir__)
CORPUS_PATH = File.join(ROOT, "tests", "skill-trigger", "corpus.yaml")
STARTUP_PATH = File.join(ROOT, "tests", "skill-trigger", "claude", "startup-v1.md")
OUT_ROOT = ENV.fetch("CLAUDE_SINGLE_OUT_ROOT", File.join(ENV.fetch("TMPDIR", "/tmp"), "claude-startup-singles"))
CLAUDE_BIN = ENV.fetch("CLAUDE_BIN", "claude")
TIMEOUT_SECONDS = Integer(ENV.fetch("SKILL_TRIGGER_TIMEOUT", "120"))
CASE_IDS = ENV.fetch("SKILL_TRIGGER_ONLY_CASE_IDS", "").split(",").map(&:strip).reject(&:empty?)

def load_yaml(path)
  content = File.read(path)
  Psych.safe_load(content, permitted_classes: [Date], aliases: true)
rescue ArgumentError
  Psych.safe_load(content, [Date], [], true)
end

def slug(text)
  text.gsub(/[^a-z0-9]+/i, "-").gsub(/\A-+|-+\z/, "").downcase
end

def ensure_skill_symlink
  skills_dir = File.expand_path("~/.agents/skills")
  target = File.join(skills_dir, "horspowers")
  FileUtils.mkdir_p(skills_dir)
  FileUtils.rm_rf(target)
  FileUtils.ln_s(File.join(ROOT, "skills"), target)
end

def run_with_capture(command, cwd:, timeout_seconds:)
  stdout = +""
  stderr = +""
  status = nil
  timed_out = false

  Open3.popen3(*command, chdir: cwd) do |stdin, out, err, wait_thr|
    stdin.close
    out_thread = Thread.new { out.read }
    err_thread = Thread.new { err.read }

    if wait_thr.join(timeout_seconds)
      status = wait_thr.value
    else
      timed_out = true
      Process.kill("TERM", wait_thr.pid) rescue nil
      if !wait_thr.join(5)
        Process.kill("KILL", wait_thr.pid) rescue nil
        wait_thr.join
      end
      status = wait_thr.value
    end

    stdout = out_thread.value
    stderr = err_thread.value
  end

  {
    stdout: stdout,
    stderr: stderr,
    exit_code: status&.exitstatus,
    success: status&.success? && !timed_out,
    timed_out: timed_out
  }
end

def stability_flags(text)
  flags = []
  flags << "stream_disconnected" if text.include?("stream disconnected")
  flags << "reconnecting" if text.include?("Reconnecting")
  flags << "startup_remote_sync_failed" if text.include?("startup remote plugin sync failed")
  flags << "featured_plugin_sync_failed" if text.include?("failed to warm featured plugin ids cache")
  flags
end

def main
  raise "SKILL_TRIGGER_ONLY_CASE_IDS is required" if CASE_IDS.empty?

  ensure_skill_symlink
  corpus = load_yaml(CORPUS_PATH)
  startup_text = File.read(STARTUP_PATH)
  out_dir = File.join(OUT_ROOT, Time.now.strftime("%Y%m%d-%H%M%S"))
  FileUtils.mkdir_p(out_dir)

  summary = []

  CASE_IDS.each_with_index do |case_id, index|
    sample = corpus.find { |row| row.fetch("id") == case_id }
    raise "Unknown case id: #{case_id}" unless sample

    sample_dir = File.join(out_dir, format("%02d-%s", index + 1, slug(case_id)))
    FileUtils.mkdir_p(sample_dir)

    command = [
      CLAUDE_BIN,
      "-p",
      sample.fetch("user_message"),
      "--append-system-prompt",
      startup_text,
      "--permission-mode",
      "bypassPermissions"
    ]

    run = run_with_capture(command, cwd: ROOT, timeout_seconds: TIMEOUT_SECONDS)
    stdout_path = File.join(sample_dir, "claude.stdout.txt")
    stderr_path = File.join(sample_dir, "claude.stderr.txt")
    File.write(stdout_path, run[:stdout])
    File.write(stderr_path, run[:stderr])

    row = {
      "sample_id" => case_id,
      "expected_skill" => sample.fetch("expected_skill"),
      "secondary_ok_skills" => sample.fetch("secondary_ok_skills"),
      "user_message" => sample.fetch("user_message"),
      "exit_code" => run[:exit_code],
      "success" => run[:success],
      "timed_out" => run[:timed_out],
      "stdout_bytes" => run[:stdout].bytesize,
      "stderr_bytes" => run[:stderr].bytesize,
      "stability_flags" => stability_flags("#{run[:stdout]}\n#{run[:stderr]}"),
      "stdout_path" => stdout_path,
      "stderr_path" => stderr_path
    }

    File.write(File.join(sample_dir, "meta.json"), JSON.pretty_generate(row))
    summary << row
  end

  summary_path = File.join(out_dir, "summary.json")
  File.write(summary_path, JSON.pretty_generate(summary))
  puts JSON.pretty_generate({
    "out_dir" => out_dir,
    "summary_path" => summary_path,
    "cases" => CASE_IDS
  })
end

main if __FILE__ == $PROGRAM_NAME
