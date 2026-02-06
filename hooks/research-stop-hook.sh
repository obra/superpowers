#!/usr/bin/env bash

# Research Stop Hook
# Prevents session exit when research hasn't met target source count
# Reports resource usage on completion

set -euo pipefail

# Fail-open if jq is not available
command -v jq >/dev/null 2>&1 || { exit 0; }

# Read hook input from stdin
HOOK_INPUT=$(cat)

# Find active research state files
find_active_research() {
    local research_dir="research"

    if [[ ! -d "$research_dir" ]]; then
        return 1
    fi

    # Find state.json files where phase is not DONE
    for state_file in "$research_dir"/*/state.json; do
        if [[ -f "$state_file" ]]; then
            local phase
            phase=$(jq -r '.phase // "DONE"' "$state_file" 2>/dev/null || echo "DONE")
            if [[ "$phase" != "DONE" ]]; then
                echo "$state_file"
                return 0
            fi
        fi
    done

    return 1
}

# Count unique sources from findings.json
count_sources() {
    local findings_file="$1"

    if [[ ! -f "$findings_file" ]]; then
        echo "0"
        return
    fi

    # Count unique sourceUrl values across all findings
    jq -r '[.[].findings[]?.sourceUrl // empty] | unique | length' "$findings_file" 2>/dev/null || echo "0"
}

# Calculate duration from startTime
calculate_duration() {
    local start_time="$1"

    if [[ -z "$start_time" || "$start_time" == "null" ]]; then
        echo "unknown"
        return
    fi

    local start_epoch end_epoch duration_secs

    # Try to parse ISO timestamp
    if command -v gdate &>/dev/null; then
        # macOS with coreutils
        start_epoch=$(gdate -d "$start_time" +%s 2>/dev/null || echo "0")
    else
        # Linux
        start_epoch=$(date -d "$start_time" +%s 2>/dev/null || echo "0")
    fi

    end_epoch=$(date +%s)

    if [[ "$start_epoch" == "0" ]]; then
        echo "unknown"
        return
    fi

    duration_secs=$((end_epoch - start_epoch))

    if [[ $duration_secs -lt 60 ]]; then
        echo "${duration_secs}s"
    elif [[ $duration_secs -lt 3600 ]]; then
        local mins=$((duration_secs / 60))
        local secs=$((duration_secs % 60))
        echo "${mins}m ${secs}s"
    else
        local hours=$((duration_secs / 3600))
        local mins=$(((duration_secs % 3600) / 60))
        echo "${hours}h ${mins}m"
    fi
}

# Generate resource usage report
generate_report() {
    local state_file="$1"
    local findings_file="$2"
    local status="$3"  # "complete" or "cancelled" or "blocked"

    local research_dir
    research_dir=$(dirname "$state_file")

    # Read state values
    local topic target_sources sources_gathered total_searches
    local subagent_calls iteration start_time findings_count

    topic=$(jq -r '.topic // "Unknown"' "$state_file")
    target_sources=$(jq -r '.targetSources // 0' "$state_file")
    sources_gathered=$(jq -r '.sourcesGathered // 0' "$state_file")
    total_searches=$(jq -r '.totalSearches // 0' "$state_file")
    subagent_calls=$(jq -r '.subagentCalls // 0' "$state_file")
    iteration=$(jq -r '.iteration // 0' "$state_file")
    start_time=$(jq -r '.startTime // null' "$state_file")
    findings_count=$(jq -r '.findingsCount // 0' "$state_file")

    # Calculate actual sources if not tracked in state
    if [[ "$sources_gathered" == "0" && -f "$findings_file" ]]; then
        sources_gathered=$(count_sources "$findings_file")
    fi

    local duration
    duration=$(calculate_duration "$start_time")

    local percentage=0
    if [[ "$target_sources" -gt 0 ]]; then
        percentage=$((sources_gathered * 100 / target_sources))
    fi

    case "$status" in
        complete)
            cat <<EOF

Research complete: "${topic}"

Resources used:
  Searches:     ${total_searches}
  Sources:      ${sources_gathered}/${target_sources} target
  Subagents:    ${subagent_calls}
  Iterations:   ${iteration}
  Duration:     ${duration}
  Findings:     ${findings_count}

Report: ${research_dir}/report.md
EOF
            ;;
        cancelled)
            cat <<EOF

Research cancelled: "${topic}"

Progress:
  Searches:     ${total_searches}
  Sources:      ${sources_gathered}/${target_sources} target (${percentage}%)
  Subagents:    ${subagent_calls}
  Iterations:   ${iteration}
  Duration:     ${duration}
  Findings:     ${findings_count}

Partial data saved in: ${research_dir}/
EOF
            ;;
        blocked)
            cat <<EOF

Research in progress: "${topic}"

Current progress:
  Sources:      ${sources_gathered}/${target_sources} target (${percentage}%)
  Searches:     ${total_searches}
  Iterations:   ${iteration}

Need $((target_sources - sources_gathered)) more sources before completion.
EOF
            ;;
    esac
}

# shellcheck source=../lib/escape-json.sh
source "$(cd "$(dirname "$0")" && pwd)/../lib/escape-json.sh"

# Main logic
main() {
    # Check for active research
    local state_file
    if ! state_file=$(find_active_research); then
        # No active research - allow exit
        exit 0
    fi

    local research_dir findings_file
    research_dir=$(dirname "$state_file")
    findings_file="${research_dir}/findings.json"

    # Check if research was cancelled (phase set to CANCELLED)
    local current_phase
    current_phase=$(jq -r '.phase // ""' "$state_file" 2>/dev/null || echo "")
    if [[ "$current_phase" == "CANCELLED" ]]; then
        # Generate cancellation report and allow exit
        local report
        report=$(generate_report "$state_file" "$findings_file" "cancelled")
        echo "$report"
        exit 0
    fi

    # Read target and current sources
    local target_sources sources_gathered
    target_sources=$(jq -r '.targetSources // 0' "$state_file")
    sources_gathered=$(jq -r '.sourcesGathered // 0' "$state_file")

    # If target is 0, no enforcement needed
    if [[ "$target_sources" -eq 0 ]]; then
        exit 0
    fi

    # Calculate actual sources if not tracked
    if [[ "$sources_gathered" -eq 0 && -f "$findings_file" ]]; then
        sources_gathered=$(count_sources "$findings_file")
    fi

    # Check if target met
    if [[ "$sources_gathered" -ge "$target_sources" ]]; then
        # Target met - check if phase is DONE
        local phase
        phase=$(jq -r '.phase // ""' "$state_file")

        if [[ "$phase" == "DONE" ]]; then
            # Generate completion report and allow exit
            local report
            report=$(generate_report "$state_file" "$findings_file" "complete")
            echo "$report"
            exit 0
        fi

        # Target met but not marked DONE yet - allow exit
        exit 0
    fi

    # Target NOT met - block exit
    local block_message
    block_message=$(generate_report "$state_file" "$findings_file" "blocked")

    local escaped_message
    escaped_message=$(escape_for_json "$block_message")

    # Read the original prompt/topic for continuation
    local topic
    topic=$(jq -r '.topic // "Continue research"' "$state_file")

    local continue_prompt="Continue researching: ${topic}. You have not yet gathered enough sources. Check state.json for current progress and continue the RESEARCH phase."
    local escaped_prompt
    escaped_prompt=$(escape_for_json "$continue_prompt")

    # Output JSON to block and continue
    cat <<EOF
{
    "decision": "block",
    "reason": "${escaped_prompt}",
    "systemMessage": "${escaped_message}"
}
EOF

    exit 0
}

main "$@"
