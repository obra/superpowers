#!/usr/bin/env ruby
# frozen_string_literal: true

require "etc"
require "fileutils"
require "json"
require "open3"
require "psych"
require "time"

ROOT = File.expand_path("../..", __dir__)
CORPUS_PATH = File.join(__dir__, "corpus.yaml")
RUNS_DIR = File.join(__dir__, "runs")
ARTIFACT_ROOT = File.join(RUNS_DIR, "artifacts", "2026-05-11-full-baseline")
RESULTS_PATH = File.join(ARTIFACT_ROOT, "results.jsonl")
SUMMARY_PATH = File.join(ARTIFACT_ROOT, "summary.json")

CLAUDE_BIN = ENV.fetch("CLAUDE_BIN", "claude")
CODEX_BIN = ENV.fetch("CODEX_BIN", "codex")
TIMEOUT_SECONDS = Integer(ENV.fetch("SKILL_TRIGGER_TIMEOUT", "240"))
MAX_WORKERS = Integer(ENV.fetch("SKILL_TRIGGER_MAX_WORKERS", "4"))
CLAUDE_BARE = ENV.fetch("SKILL_TRIGGER_CLAUDE_BARE", "false") == "true"
CLAUDE_PLUGIN_DIR = ENV.fetch("SKILL_TRIGGER_CLAUDE_PLUGIN_DIR", "")
ROUTE_ONLY = ENV.fetch("SKILL_TRIGGER_ROUTE_ONLY", "false") == "true"
SKILL_LINK_DIR = ENV.fetch("SKILL_TRIGGER_SKILLS_DIR", File.expand_path("~/.agents/skills"))

ROUTE_ONLY_INSTRUCTION = "Evaluation mode: Do not use tools. Do not inspect the repository. Do not execute the request. Only output the first routing response, including the skill-style opening and at most one brief clarifying question."

HOSTS = {
  "claude" => lambda do |prompt, startup_text|
    effective_startup = startup_text.to_s.dup
    effective_startup << "\n\n#{ROUTE_ONLY_INSTRUCTION}" if ROUTE_ONLY

    command = [CLAUDE_BIN, "-p", prompt]
    command += ["--append-system-prompt", effective_startup] unless effective_startup.empty?
    command << "--bare" if CLAUDE_BARE
    command += ["--plugin-dir", CLAUDE_PLUGIN_DIR] unless CLAUDE_PLUGIN_DIR.empty?
    command += ["--tools", ""] if ROUTE_ONLY
    command + ["--permission-mode", "bypassPermissions"]
  end,
  "codex" => lambda do |prompt, startup_text|
    effective_prompt =
      if startup_text && !startup_text.empty?
        "#{startup_text}\n\nUser request:\n#{prompt}"
      else
        prompt
      end

    effective_prompt =
      if ROUTE_ONLY
        "#{effective_prompt}\n\n#{ROUTE_ONLY_INSTRUCTION}"
      else
        effective_prompt
      end

    [CODEX_BIN, "exec", effective_prompt]
  end
}.freeze

def slug(text)
  text.gsub(/[^a-z0-9]+/i, "-").gsub(/\A-+|-+\z/, "").downcase
end

def ensure_skill_symlink
  skills_dir = SKILL_LINK_DIR
  target = File.join(skills_dir, "horspowers")
  source_root = File.join(ROOT, "skills")
  FileUtils.mkdir_p(skills_dir)
  FileUtils.rm_rf(target) if File.exist?(target) || File.symlink?(target)
  FileUtils.mkdir_p(target)

  Dir.children(source_root).sort.each do |entry|
    source = File.join(source_root, entry)
    next unless File.directory?(source)
    next unless File.exist?(File.join(source, "SKILL.md"))

    FileUtils.ln_s(source, File.join(target, entry))
  end
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

def startup_profiles_by_host
  @startup_profiles_by_host ||= begin
    run_metadata = Psych.load_file(File.join(RUNS_DIR, "baseline-template.yaml"), permitted_classes: [Date])
    hosts = run_metadata.fetch("hosts")
    hosts.each_with_object({}) do |(host, meta), acc|
      profile_path = meta["startup_profile"]
      acc[host] =
        if profile_path && !profile_path.empty?
          File.read(File.join(ROOT, profile_path))
        else
          nil
        end
    end
  rescue Psych::Exception
    {}
  end
end

def main
  ensure_skill_symlink
  FileUtils.mkdir_p(ARTIFACT_ROOT)

  corpus = Psych.load_file(CORPUS_PATH, permitted_classes: [Date])
  summary = {
    "started_at" => Time.now.iso8601,
    "cwd" => ROOT,
    "timeout_seconds" => TIMEOUT_SECONDS,
    "max_workers" => MAX_WORKERS,
    "claude_bin" => CLAUDE_BIN,
    "codex_bin" => CODEX_BIN,
    "sample_count" => corpus.size,
    "host_runs" => {}
  }

  HOSTS.each_key do |host|
    summary["host_runs"][host] = {
      "completed" => 0,
      "exit_0" => 0,
      "timed_out" => 0,
      "stream_disconnected" => 0,
      "reconnecting" => 0
    }
  end

  jobs = []
  corpus.each_with_index do |sample, index|
    HOSTS.each do |host, build_command|
      prompt = sample.fetch("user_message")
      sample_dir = File.join(ARTIFACT_ROOT, format("%02d-%s", index + 1, slug(sample.fetch("id"))))
      FileUtils.mkdir_p(sample_dir)
      startup_text = startup_profiles_by_host[host]
      jobs << {
        "sample" => sample,
        "host" => host,
        "command" => build_command.call(prompt, startup_text),
        "sample_dir" => sample_dir,
        "startup_profile_loaded" => !startup_text.to_s.empty?
      }
    end
  end

  results_mutex = Mutex.new
  jobs_mutex = Mutex.new
  results_file = File.open(RESULTS_PATH, "w")

  workers = Array.new(MAX_WORKERS) do
    Thread.new do
      loop do
        job = nil
        jobs_mutex.synchronize { job = jobs.shift }
        break unless job

        sample = job.fetch("sample")
        host = job.fetch("host")
        command = job.fetch("command")
        sample_dir = job.fetch("sample_dir")
        startup_profile_loaded = job.fetch("startup_profile_loaded")

        run = run_with_capture(command, cwd: ROOT, timeout_seconds: TIMEOUT_SECONDS)

        stdout_path = File.join(sample_dir, "#{host}.stdout.txt")
        stderr_path = File.join(sample_dir, "#{host}.stderr.txt")
        meta_path = File.join(sample_dir, "#{host}.meta.json")

        File.write(stdout_path, run[:stdout])
        File.write(stderr_path, run[:stderr])

        flags = stability_flags("#{run[:stdout]}\n#{run[:stderr]}")
        meta = {
          "sample_id" => sample.fetch("id"),
          "host" => host,
          "expected_skill" => sample.fetch("expected_skill"),
          "secondary_ok_skills" => sample.fetch("secondary_ok_skills"),
          "should_trigger" => sample.fetch("should_trigger"),
          "startup_profile_loaded" => startup_profile_loaded,
          "command" => command,
          "exit_code" => run[:exit_code],
          "success" => run[:success],
          "timed_out" => run[:timed_out],
          "stability_flags" => flags,
          "stdout_path" => stdout_path,
          "stderr_path" => stderr_path,
          "ran_at" => Time.now.iso8601
        }
        File.write(meta_path, JSON.pretty_generate(meta))

        results_mutex.synchronize do
          results_file.puts(JSON.generate(meta))
          results_file.flush

          host_summary = summary["host_runs"][host]
          host_summary["completed"] += 1
          host_summary["exit_0"] += 1 if run[:exit_code] == 0
          host_summary["timed_out"] += 1 if run[:timed_out]
          host_summary["stream_disconnected"] += 1 if flags.include?("stream_disconnected")
          host_summary["reconnecting"] += 1 if flags.include?("reconnecting")
        end

        puts "[#{host}] #{sample.fetch("id")} exit=#{run[:exit_code]} timeout=#{run[:timed_out]} flags=#{flags.join(",")}"
      end
    end
  end

  workers.each(&:join)
  results_file.close
  summary["finished_at"] = Time.now.iso8601
  File.write(SUMMARY_PATH, JSON.pretty_generate(summary))

  puts
  puts "Artifacts: #{ARTIFACT_ROOT}"
  puts "Summary:   #{SUMMARY_PATH}"
end

main if __FILE__ == $PROGRAM_NAME
