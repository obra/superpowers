#!/usr/bin/env ruby
# frozen_string_literal: true

# assert_skill_trigger.rb — Focused failing test for skill-trigger routing
#
# Runs a single corpus prompt through Claude with the startup profile,
# then asserts the expected skill was triggered in the output.
#
# Usage:
#   SKILL_TRIGGER_ONLY_CASE_IDS=document_management_strong_001 \
#     ruby tests/skill-trigger/scripts/assert_skill_trigger.rb
#
# Currently RED for most document-management, code-review, and debug prompts
# because Claude routes to direct filesystem/analysis answers instead of
# invoking the Skill tool. Once skill descriptions or startup guidance are
# improved, these assertions should turn GREEN.

require "date"
require "fileutils"
require "json"
require "open3"
require "psych"

ROOT = File.expand_path("../../..", __dir__)
CORPUS_PATH = File.join(ROOT, "tests", "skill-trigger", "corpus.yaml")
STARTUP_PATH = File.join(ROOT, "tests", "skill-trigger", "claude", "startup-v1.md")
CLAUDE_BIN = ENV.fetch("CLAUDE_BIN", "claude")
TIMEOUT_SECONDS = Integer(ENV.fetch("SKILL_TRIGGER_TIMEOUT", "120"))
SKILL_LINK_DIR = ENV.fetch("SKILL_TRIGGER_SKILLS_DIR", File.expand_path("~/.agents/skills"))
CASE_IDS = ENV.fetch("SKILL_TRIGGER_ONLY_CASE_IDS", "").split(",").map(&:strip).reject(&:empty?)

def load_yaml(path)
  content = File.read(path)
  Psych.safe_load(content, permitted_classes: [Date], aliases: true)
rescue ArgumentError
  Psych.safe_load(content, [Date], [], true)
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

# Detect whether Claude's output contains evidence that a specific skill was triggered.
#
# Detection signals (ordered by reliability):
#   1. "horspowers:<skill>" — full prefixed skill reference in Skill tool invocation
#   2. Skill name alongside "Skill" tool reference
#   3. Chinese announcement: "使用.*技能" with skill Chinese name
#   4. English announcement: "using/invoking <skill>" with skill name OR aliases
#   5. Skill name appears in any context with Skill tool nearby
def skill_triggered?(output, skill_name)
  text = output.downcase
  skill_lower = skill_name.downcase
  all_names = all_skill_names(skill_name)

  # Full prefixed reference (most reliable)
  if text.include?("horspowers:#{skill_lower}")
    return true
  end

  # Skill tool invocation with the skill name
  if text.include?("skill") && all_names.any? { |n| text.include?(n.downcase) }
    return true
  end

  # Chinese announcement pattern: "正在使用 <cn-name> 技能" or "使用 <cn-name> 技能"
  cn_names = chinese_skill_names(skill_name)
  cn_names.each do |cn|
    cn_lower = cn.downcase
    if text.match?(/使用.*#{cn_lower}.*技能|#{cn_lower}.*技能/)
      return true
    end
  end

  # English announcement: "using <skill>" or "invoking <skill>"
  # Match against skill name AND common aliases (e.g. "tdd" for test-driven-development)
  all_names.each do |name|
    name_lower = name.downcase
    if text.match?(/(using|invoking|invoked|invoke)\s+#{name_lower}/)
      return true
    end
  end

  false
end

CN_SKILL_MAP = {
  "document-management" => ["文档管理"],
  "test-driven-development" => ["测试驱动开发", "tdd"],
  "systematic-debugging" => ["系统调试", "系统排查"],
  "requesting-code-review" => ["代码审查"],
  "brainstorming" => [],
  "writing-plans" => ["编写计划", "写计划"],
  "executing-plans" => ["执行计划"],
  "subagent-driven-development" => ["子代理驱动开发", "子代理开发"]
}.freeze

def chinese_skill_names(skill_name)
  CN_SKILL_MAP.fetch(skill_name, [])
end

def all_skill_names(skill_name)
  cn = chinese_skill_names(skill_name)
  aliases = {
    "test-driven-development" => ["tdd"],
    "document-management" => ["doc management", "文档系统"],
    "requesting-code-review" => ["code review", "代码review"]
  }.fetch(skill_name, [])
  [skill_name] + cn + aliases
end

def main
  raise "SKILL_TRIGGER_ONLY_CASE_IDS is required" if CASE_IDS.empty?

  ensure_skill_symlink
  corpus = load_yaml(CORPUS_PATH)
  startup_text = File.read(STARTUP_PATH)

  results = []
  all_green = true

  CASE_IDS.each do |case_id|
    sample = corpus.find { |row| row.fetch("id") == case_id }
    raise "Unknown case id: #{case_id}" unless sample

    expected = sample.fetch("expected_skill")
    secondary = sample.fetch("secondary_ok_skills")
    prompt = sample.fetch("user_message")

    command = [
      CLAUDE_BIN,
      "-p",
      prompt,
      "--append-system-prompt",
      startup_text,
      "--permission-mode",
      "bypassPermissions"
    ]

    run = run_with_capture(command, cwd: ROOT, timeout_seconds: TIMEOUT_SECONDS)

    triggered = skill_triggered?(run[:stdout], expected)
    secondary_triggered = secondary.any? { |s| skill_triggered?(run[:stdout], s) }

    outcome = if triggered
                "exact"
              elsif secondary_triggered
                "acceptable"
              elsif run[:timed_out]
                "timeout"
              else
                "miss"
              end

    is_green = triggered || secondary_triggered
    all_green = false unless is_green

    result = {
      case_id: case_id,
      expected_skill: expected,
      secondary_ok_skills: secondary,
      outcome: outcome,
      triggered: triggered,
      secondary_triggered: secondary_triggered,
      timed_out: run[:timed_out],
      exit_code: run[:exit_code],
      stdout_bytes: run[:stdout].bytesize,
      stderr_bytes: run[:stderr].bytesize
    }
    results << result

    tag = is_green ? "GREEN" : "RED"
    puts "#{tag}: #{case_id} — expected #{expected}, got #{outcome}"
    if run[:timed_out]
      puts "  (timed out after #{TIMEOUT_SECONDS}s)"
    elsif !is_green
      puts "  stdout preview:"
      puts run[:stdout][0..300].gsub(/\n/, "\n  ")
    end
  end

  puts "---"
  puts "Summary: #{results.size} cases, #{results.count { |r| r[:outcome] == "exact" }} exact, #{results.count { |r| r[:outcome] == "acceptable" }} acceptable, #{results.count { |r| r[:outcome] == "miss" }} miss, #{results.count { |r| r[:outcome] == "timeout" }} timeout"
  puts all_green ? "ALL GREEN" : "RED — at least one assertion failed"

  exit(all_green ? 0 : 1)
end

main if __FILE__ == $PROGRAM_NAME
