#!/usr/bin/env ruby
# frozen_string_literal: true

require "fileutils"
require "json"
require "open3"
require "psych"
require "time"

ROOT = File.expand_path("../..", __dir__)
CORPUS_PATH = File.join(__dir__, "corpus.yaml")
RUN_PATH = File.join(__dir__, "runs", "2026-05-11-baseline-v1.yaml")
ARTIFACT_ROOT = File.join(__dir__, "runs", "artifacts", "2026-05-11-queue-batches")

CLAUDE_BIN = ENV.fetch("CLAUDE_BIN", "claude")
CODEX_BIN = ENV.fetch("CODEX_BIN", "codex")
TIMEOUT_SECONDS = Integer(ENV.fetch("SKILL_TRIGGER_TIMEOUT", "300"))
BATCH_SIZE = Integer(ENV.fetch("SKILL_TRIGGER_BATCH_SIZE", "2"))

HOSTS = {
  "claude" => lambda do |prompt|
    [CLAUDE_BIN, "-p", prompt, "--permission-mode", "bypassPermissions"]
  end,
  "codex" => lambda do |prompt|
    [CODEX_BIN, "exec", prompt]
  end
}.freeze

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

def completed_ids_from_run(run_path)
  data = Psych.load_file(run_path)
  data.fetch("results").map do |result|
    hosts = %w[claude codex]
    next unless hosts.all? { |host| !result.dig(host, "notes").to_s.include?("Fill with observed") }

    result.fetch("prompt_id")
  end.compact
end

def completed_ids
  completed_ids_from_run(RUN_PATH)
end

def main
  ensure_skill_symlink
  FileUtils.mkdir_p(ARTIFACT_ROOT)

  corpus = Psych.load_file(CORPUS_PATH)
  pending = corpus.reject { |sample| completed_ids.include?(sample.fetch("id")) }
  batch = pending.first(BATCH_SIZE)

  if batch.empty?
    puts JSON.pretty_generate({
      status: "done",
      message: "No pending cases left in queue.",
      completed_case_count: completed_ids.size
    })
    return
  end

  batch_label = batch.map { |sample| sample.fetch("id") }.join("__")
  batch_dir = File.join(ARTIFACT_ROOT, "#{Time.now.strftime("%Y%m%d-%H%M%S")}-#{slug(batch_label)}")
  FileUtils.mkdir_p(batch_dir)

  summary = {
    "started_at" => Time.now.iso8601,
    "timeout_seconds" => TIMEOUT_SECONDS,
    "batch_size" => batch.size,
    "cases" => batch.map { |sample| sample.fetch("id") },
    "results" => []
  }

  batch.each_with_index do |sample, index|
    sample_dir = File.join(batch_dir, format("%02d-%s", index + 1, slug(sample.fetch("id"))))
    FileUtils.mkdir_p(sample_dir)

    HOSTS.each do |host, build_command|
      run = run_with_capture(build_command.call(sample.fetch("user_message")), cwd: ROOT, timeout_seconds: TIMEOUT_SECONDS)
      stdout_path = File.join(sample_dir, "#{host}.stdout.txt")
      stderr_path = File.join(sample_dir, "#{host}.stderr.txt")

      File.write(stdout_path, run[:stdout])
      File.write(stderr_path, run[:stderr])

      summary["results"] << {
        "sample_id" => sample.fetch("id"),
        "host" => host,
        "expected_skill" => sample.fetch("expected_skill"),
        "secondary_ok_skills" => sample.fetch("secondary_ok_skills"),
        "stdout_path" => stdout_path,
        "stderr_path" => stderr_path,
        "exit_code" => run[:exit_code],
        "success" => run[:success],
        "timed_out" => run[:timed_out],
        "stability_flags" => stability_flags("#{run[:stdout]}\n#{run[:stderr]}")
      }
    end
  end

  summary["finished_at"] = Time.now.iso8601
  summary_path = File.join(batch_dir, "summary.json")
  File.write(summary_path, JSON.pretty_generate(summary))

  puts JSON.pretty_generate({
    status: "ok",
    run_file: RUN_PATH,
    artifact_batch_dir: batch_dir,
    finished_cases: batch.map { |sample| sample.fetch("id") },
    summary_path: summary_path
  })
end

main if __FILE__ == $PROGRAM_NAME
