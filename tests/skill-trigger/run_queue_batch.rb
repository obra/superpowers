#!/usr/bin/env ruby
# frozen_string_literal: true

require "fileutils"
require "json"
require "open3"
require "psych"
require "set"
require "date"
require "time"

ROOT = File.expand_path("../..", __dir__)
CORPUS_PATH = File.join(__dir__, "corpus.yaml")
RUN_PATH = File.join(__dir__, "runs", "2026-05-11-baseline-v1.yaml")
ARTIFACT_ROOT = File.join(__dir__, "runs", "artifacts", "2026-05-11-queue-batches")

CLAUDE_BIN = ENV.fetch("CLAUDE_BIN", "claude")
CODEX_BIN = ENV.fetch("CODEX_BIN", "codex")
TIMEOUT_SECONDS = Integer(ENV.fetch("SKILL_TRIGGER_TIMEOUT", "300"))
BATCH_SIZE = Integer(ENV.fetch("SKILL_TRIGGER_BATCH_SIZE", "2"))
MAX_BATCH_LOOPS = Integer(ENV.fetch("SKILL_TRIGGER_BATCH_LOOPS", "1"))
SELECTED_HOSTS = ENV.fetch("SKILL_TRIGGER_HOSTS", "claude,codex").split(",").map(&:strip).reject(&:empty?)
ONLY_CASE_IDS = ENV.fetch("SKILL_TRIGGER_ONLY_CASE_IDS", "").split(",").map(&:strip).reject(&:empty?)
RERUN_COMPLETED = ENV.fetch("SKILL_TRIGGER_RERUN_COMPLETED", "false") == "true"
CLAUDE_BARE = ENV.fetch("SKILL_TRIGGER_CLAUDE_BARE", "false") == "true"
CLAUDE_PLUGIN_DIR = ENV.fetch("SKILL_TRIGGER_CLAUDE_PLUGIN_DIR", "")

HOSTS = {
  "claude" => lambda do |prompt, startup_text|
    command = [CLAUDE_BIN, "-p", prompt]
    command += ["--append-system-prompt", startup_text] if startup_text && !startup_text.empty?
    command << "--bare" if CLAUDE_BARE
    command += ["--plugin-dir", CLAUDE_PLUGIN_DIR] unless CLAUDE_PLUGIN_DIR.empty?
    command + ["--permission-mode", "bypassPermissions"]
  end,
  "codex" => lambda do |prompt, startup_text|
    effective_prompt =
      if startup_text && !startup_text.empty?
        "#{startup_text}\n\nUser request:\n#{prompt}"
      else
        prompt
      end

    [CODEX_BIN, "exec", effective_prompt]
  end
}.freeze

def selected_hosts
  unknown = SELECTED_HOSTS - HOSTS.keys
  raise "Unknown host(s): #{unknown.join(', ')}" unless unknown.empty?

  SELECTED_HOSTS
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

def load_yaml_file(path)
  content = File.read(path)
  Psych.safe_load(content, permitted_classes: [Date], aliases: true)
rescue ArgumentError
  Psych.safe_load(content, [Date], [], true)
end

def startup_profiles_by_host
  @startup_profiles_by_host ||= begin
    run_data = load_yaml_file(RUN_PATH)
    hosts = run_data.fetch("hosts")
    hosts.each_with_object({}) do |(host, meta), acc|
      profile_path = meta["startup_profile"]
      acc[host] =
        if profile_path && !profile_path.empty?
          File.read(File.join(ROOT, profile_path))
        else
          nil
        end
    end
  end
end

def completed_ids_from_run(run_path)
  return [] if RERUN_COMPLETED

  data = load_yaml_file(run_path)
  data.fetch("results").map do |result|
    hosts = selected_hosts
    next unless hosts.all? { |host| !result.dig(host, "notes").to_s.include?("Fill with observed") }

    result.fetch("prompt_id")
  end.compact
end

def completed_ids
  completed_ids_from_run(RUN_PATH)
end

def select_pending_batch(corpus, completed_id_set)
  if ONLY_CASE_IDS.any?
    wanted = corpus.select do |sample|
      ONLY_CASE_IDS.include?(sample.fetch("id")) && !completed_id_set.include?(sample.fetch("id"))
    end
    missing = ONLY_CASE_IDS - wanted.map { |sample| sample.fetch("id") }
    unknown = missing.reject { |sample_id| completed_id_set.include?(sample_id) }
    raise "Unknown case id(s): #{unknown.join(', ')}" unless unknown.empty?

    return wanted.first(BATCH_SIZE)
  end

  pending = corpus.reject { |sample| completed_id_set.include?(sample.fetch("id")) }
  pending.first(BATCH_SIZE)
end

def main
  ensure_skill_symlink
  FileUtils.mkdir_p(ARTIFACT_ROOT)

  corpus = load_yaml_file(CORPUS_PATH)
  completed_id_set = completed_ids.to_set
  completed_batches = []

  MAX_BATCH_LOOPS.times do
    batch = select_pending_batch(corpus, completed_id_set)

    break if batch.empty?

    batch_label = batch.map { |sample| sample.fetch("id") }.join("__")
    batch_dir = File.join(ARTIFACT_ROOT, "#{Time.now.strftime("%Y%m%d-%H%M%S")}-#{slug(batch_label)}")
    FileUtils.mkdir_p(batch_dir)

    summary = {
      "started_at" => Time.now.iso8601,
      "timeout_seconds" => TIMEOUT_SECONDS,
      "batch_size" => batch.size,
      "hosts" => selected_hosts,
      "cases" => batch.map { |sample| sample.fetch("id") },
      "results" => []
    }

    batch.each_with_index do |sample, index|
      sample_dir = File.join(batch_dir, format("%02d-%s", index + 1, slug(sample.fetch("id"))))
      FileUtils.mkdir_p(sample_dir)

      selected_hosts.each do |host|
        build_command = HOSTS.fetch(host)
        startup_text = startup_profiles_by_host[host]
        run = run_with_capture(build_command.call(sample.fetch("user_message"), startup_text), cwd: ROOT, timeout_seconds: TIMEOUT_SECONDS)
        stdout_path = File.join(sample_dir, "#{host}.stdout.txt")
        stderr_path = File.join(sample_dir, "#{host}.stderr.txt")

        File.write(stdout_path, run[:stdout])
        File.write(stderr_path, run[:stderr])

        summary["results"] << {
          "sample_id" => sample.fetch("id"),
          "host" => host,
          "expected_skill" => sample.fetch("expected_skill"),
          "secondary_ok_skills" => sample.fetch("secondary_ok_skills"),
          "startup_profile_loaded" => !startup_text.to_s.empty?,
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

    completed_batches << {
      "artifact_batch_dir" => batch_dir,
      "finished_cases" => batch.map { |sample| sample.fetch("id") },
      "summary_path" => summary_path
    }

    batch.each do |sample|
      completed_id_set.add(sample.fetch("id"))
    end
  end

  if completed_batches.empty?
    puts JSON.pretty_generate({
      status: "done",
      message: "No pending cases left in queue.",
      completed_case_count: completed_ids.size
    })
    return
  end

  puts JSON.pretty_generate({
    status: "ok",
    run_file: RUN_PATH,
    batch_loops_requested: MAX_BATCH_LOOPS,
    batch_loops_completed: completed_batches.size,
    batches: completed_batches,
    finished_cases: completed_batches.flat_map { |batch_info| batch_info.fetch("finished_cases") }
  })
end

main if __FILE__ == $PROGRAM_NAME
