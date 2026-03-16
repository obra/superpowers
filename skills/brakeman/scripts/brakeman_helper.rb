#!/usr/bin/env ruby
# frozen_string_literal: true

# Brakeman Workflow Helper
# Provides common Brakeman scanning workflows with best practices

require 'optparse'
require 'json'
require 'fileutils'

class BrakemanHelper
  WORKFLOWS = {
    'initial-audit' => 'Run comprehensive initial security audit',
    'quick-check' => 'Quick scan with high confidence warnings only',
    'ci-check' => 'CI/CD-friendly check with JSON output',
    'compare' => 'Compare with previous scan results',
    'interactive' => 'Interactive false positive management',
    'report-only' => 'Generate reports without failing',
    'all-warnings' => 'Comprehensive scan of all warnings'
  }.freeze

  def initialize
    @options = {
      workflow: nil,
      app_path: '.',
      output_dir: 'tmp/brakeman',
      baseline_file: nil,
      confidence: 2
    }
  end

  def run(args)
    parse_options(args)
    
    unless @options[:workflow]
      puts "Error: Workflow required"
      puts "\nAvailable workflows:"
      WORKFLOWS.each { |name, desc| puts "  #{name.ljust(20)} - #{desc}" }
      exit 1
    end

    setup_output_directory
    
    case @options[:workflow]
    when 'initial-audit'
      run_initial_audit
    when 'quick-check'
      run_quick_check
    when 'ci-check'
      run_ci_check
    when 'compare'
      run_compare
    when 'interactive'
      run_interactive
    when 'report-only'
      run_report_only
    when 'all-warnings'
      run_all_warnings
    else
      puts "Unknown workflow: #{@options[:workflow]}"
      exit 1
    end
  end

  private

  def parse_options(args)
    OptionParser.new do |opts|
      opts.banner = "Usage: brakeman_helper.rb [options]"
      
      opts.on('-w', '--workflow WORKFLOW', 'Workflow to run (required)') do |w|
        @options[:workflow] = w
      end
      
      opts.on('-p', '--path PATH', 'Rails application path (default: .)') do |p|
        @options[:app_path] = p
      end
      
      opts.on('-o', '--output-dir DIR', 'Output directory (default: tmp/brakeman)') do |d|
        @options[:output_dir] = d
      end
      
      opts.on('-b', '--baseline FILE', 'Baseline JSON file for comparison') do |b|
        @options[:baseline_file] = b
      end
      
      opts.on('-c', '--confidence LEVEL', Integer, 'Confidence level 1-3 (default: 2)') do |c|
        @options[:confidence] = c
      end
      
      opts.on('-h', '--help', 'Show this help message') do
        puts opts
        puts "\nAvailable workflows:"
        WORKFLOWS.each { |name, desc| puts "  #{name.ljust(20)} - #{desc}" }
        exit
      end
    end.parse!(args)
  end

  def setup_output_directory
    FileUtils.mkdir_p(@options[:output_dir])
  end

  def run_initial_audit
    puts "=" * 80
    puts "INITIAL SECURITY AUDIT"
    puts "=" * 80
    puts "Running comprehensive scan with multiple output formats..."
    puts
    
    timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
    html_file = File.join(@options[:output_dir], "audit_#{timestamp}.html")
    json_file = File.join(@options[:output_dir], "audit_#{timestamp}.json")
    
    cmd = [
      'brakeman',
      '-p', @options[:app_path],
      '-o', html_file,
      '-o', json_file,
      '--report-routes',
      '--color'
    ].join(' ')
    
    puts "Command: #{cmd}"
    puts
    
    system(cmd)
    status = $?.exitstatus
    
    puts
    puts "=" * 80
    puts "AUDIT COMPLETE"
    puts "=" * 80
    puts "HTML Report: #{html_file}"
    puts "JSON Report: #{json_file}"
    puts
    puts "Next steps:"
    puts "1. Review HTML report in browser"
    puts "2. Run: brakeman_helper.rb -w interactive -p #{@options[:app_path]}"
    puts "3. Fix high confidence warnings"
    puts
    
    exit status
  end

  def run_quick_check
    puts "Running quick security check (high confidence only)..."
    
    cmd = [
      'brakeman',
      '-p', @options[:app_path],
      '-w3',
      '-q',
      '--color'
    ].join(' ')
    
    puts "Command: #{cmd}"
    puts
    
    system(cmd)
    exit $?.exitstatus
  end

  def run_ci_check
    puts "Running CI/CD security check..."
    
    json_file = File.join(@options[:output_dir], 'ci_results.json')
    
    cmd = [
      'brakeman',
      '-p', @options[:app_path],
      "-w#{@options[:confidence]}",
      '-o', json_file,
      '-f', 'json',
      '-q',
      '--no-exit-on-error'
    ].join(' ')
    
    puts "Command: #{cmd}"
    puts
    
    system(cmd)
    status = $?.exitstatus
    
    # Parse and summarize results
    if File.exist?(json_file)
      results = JSON.parse(File.read(json_file))
      warnings = results['warnings'] || []
      
      puts
      puts "=" * 80
      puts "CI SECURITY CHECK RESULTS"
      puts "=" * 80
      puts "Warnings: #{warnings.length}"
      puts "Output: #{json_file}"
      puts
      
      if warnings.any?
        puts "Warning breakdown:"
        warning_types = warnings.group_by { |w| w['warning_type'] }
        warning_types.each do |type, warns|
          puts "  #{type}: #{warns.length}"
        end
      end
    end
    
    exit status
  end

  def run_compare
    unless @options[:baseline_file]
      puts "Error: Baseline file required for comparison"
      puts "Usage: brakeman_helper.rb -w compare -b baseline.json"
      exit 1
    end
    
    unless File.exist?(@options[:baseline_file])
      puts "Error: Baseline file not found: #{@options[:baseline_file]}"
      exit 1
    end
    
    puts "Comparing with baseline: #{@options[:baseline_file]}"
    
    cmd = [
      'brakeman',
      '-p', @options[:app_path],
      '--compare', @options[:baseline_file],
      '--color'
    ].join(' ')
    
    puts "Command: #{cmd}"
    puts
    
    system(cmd)
    exit $?.exitstatus
  end

  def run_interactive
    puts "Starting interactive false positive management..."
    puts
    puts "Commands during interactive mode:"
    puts "  i - Add to ignore list"
    puts "  n - Add to ignore list with note (recommended)"
    puts "  s - Skip this warning"
    puts "  u - Remove from ignore list"
    puts "  q - Quit"
    puts
    
    cmd = [
      'brakeman',
      '-p', @options[:app_path],
      '-I',
      '--color'
    ].join(' ')
    
    system(cmd)
    exit $?.exitstatus
  end

  def run_report_only
    puts "Generating security reports without exit code failure..."
    
    timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
    html_file = File.join(@options[:output_dir], "report_#{timestamp}.html")
    json_file = File.join(@options[:output_dir], "report_#{timestamp}.json")
    
    cmd = [
      'brakeman',
      '-p', @options[:app_path],
      "-w#{@options[:confidence]}",
      '-o', html_file,
      '-o', json_file,
      '--no-exit-on-warn',
      '--no-exit-on-error',
      '--color'
    ].join(' ')
    
    puts "Command: #{cmd}"
    puts
    
    system(cmd)
    
    puts
    puts "Reports generated:"
    puts "  HTML: #{html_file}"
    puts "  JSON: #{json_file}"
    
    exit 0
  end

  def run_all_warnings
    puts "Running comprehensive scan of all warnings..."
    
    timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
    html_file = File.join(@options[:output_dir], "comprehensive_#{timestamp}.html")
    json_file = File.join(@options[:output_dir], "comprehensive_#{timestamp}.json")
    
    cmd = [
      'brakeman',
      '-p', @options[:app_path],
      '-w1',  # All confidence levels
      '-o', html_file,
      '-o', json_file,
      '--show-ignored',
      '--color'
    ].join(' ')
    
    puts "Command: #{cmd}"
    puts
    
    system(cmd)
    status = $?.exitstatus
    
    puts
    puts "Comprehensive scan complete:"
    puts "  HTML: #{html_file}"
    puts "  JSON: #{json_file}"
    
    exit status
  end
end

# Run if called directly
if __FILE__ == $PROGRAM_NAME
  helper = BrakemanHelper.new
  helper.run(ARGV)
end
