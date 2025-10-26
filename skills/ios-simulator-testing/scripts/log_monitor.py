#!/usr/bin/env python3
"""
iOS Simulator Log Monitoring and Analysis

Real-time log streaming from iOS simulators with intelligent filtering, error detection,
and token-efficient summarization. Enhanced version of app_state_capture.py's log capture.

Features:
- Real-time log streaming from booted simulators
- Smart filtering by app bundle ID, subsystem, category, severity
- Error/warning classification and deduplication
- Duration-based or continuous follow mode
- Token-efficient summaries with full logs saved to file
- Integration with test_recorder and app_state_capture

Usage Examples:
    # Monitor app logs in real-time (follow mode)
    python scripts/log_monitor.py --app com.myapp.MyApp --follow

    # Capture logs for specific duration
    python scripts/log_monitor.py --app com.myapp.MyApp --duration 30s

    # Extract errors and warnings only from last 5 minutes
    python scripts/log_monitor.py --severity error,warning --last 5m

    # Save logs to file
    python scripts/log_monitor.py --app com.myapp.MyApp --duration 1m --output logs/

    # Verbose output with full log lines
    python scripts/log_monitor.py --app com.myapp.MyApp --verbose
"""

import argparse
import json
import re
import signal
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path


class LogMonitor:
    """Monitor and analyze iOS simulator logs with intelligent filtering."""

    def __init__(
        self,
        app_bundle_id: str | None = None,
        device_udid: str | None = None,
        severity_filter: list[str] | None = None,
    ):
        """
        Initialize log monitor.

        Args:
            app_bundle_id: Filter logs by app bundle ID
            device_udid: Device UDID (uses booted if not specified)
            severity_filter: List of severities to include (error, warning, info, debug)
        """
        self.app_bundle_id = app_bundle_id
        self.device_udid = device_udid or "booted"
        self.severity_filter = severity_filter or ["error", "warning", "info", "debug"]

        # Log storage
        self.log_lines: list[str] = []
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.info_messages: list[str] = []

        # Statistics
        self.error_count = 0
        self.warning_count = 0
        self.info_count = 0
        self.debug_count = 0
        self.total_lines = 0

        # Deduplication
        self.seen_messages: set[str] = set()

        # Process control
        self.log_process: subprocess.Popen | None = None
        self.interrupted = False

    def parse_time_duration(self, duration_str: str) -> float:
        """
        Parse duration string to seconds.

        Args:
            duration_str: Duration like "30s", "5m", "1h"

        Returns:
            Duration in seconds
        """
        match = re.match(r"(\d+)([smh])", duration_str.lower())
        if not match:
            raise ValueError(
                f"Invalid duration format: {duration_str}. Use format like '30s', '5m', '1h'"
            )

        value, unit = match.groups()
        value = int(value)

        if unit == "s":
            return value
        if unit == "m":
            return value * 60
        if unit == "h":
            return value * 3600

        return 0

    def classify_log_line(self, line: str) -> str | None:
        """
        Classify log line by severity.

        Args:
            line: Log line to classify

        Returns:
            Severity level (error, warning, info, debug) or None
        """
        line_lower = line.lower()

        # Error patterns
        error_patterns = [
            r"\berror\b",
            r"\bfault\b",
            r"\bfailed\b",
            r"\bexception\b",
            r"\bcrash\b",
            r"❌",
        ]

        # Warning patterns
        warning_patterns = [r"\bwarning\b", r"\bwarn\b", r"\bdeprecated\b", r"⚠️"]

        # Info patterns
        info_patterns = [r"\binfo\b", r"\bnotice\b", r"ℹ️"]

        for pattern in error_patterns:
            if re.search(pattern, line_lower):
                return "error"

        for pattern in warning_patterns:
            if re.search(pattern, line_lower):
                return "warning"

        for pattern in info_patterns:
            if re.search(pattern, line_lower):
                return "info"

        return "debug"

    def deduplicate_message(self, line: str) -> bool:
        """
        Check if message is duplicate.

        Args:
            line: Log line

        Returns:
            True if this is a new message, False if duplicate
        """
        # Create signature by removing timestamps and process IDs
        signature = re.sub(r"\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}", "", line)
        signature = re.sub(r"\[\d+\]", "", signature)
        signature = re.sub(r"\s+", " ", signature).strip()

        if signature in self.seen_messages:
            return False

        self.seen_messages.add(signature)
        return True

    def process_log_line(self, line: str):
        """
        Process a single log line.

        Args:
            line: Log line to process
        """
        if not line.strip():
            return

        self.total_lines += 1
        self.log_lines.append(line)

        # Classify severity
        severity = self.classify_log_line(line)

        # Skip if not in filter
        if severity not in self.severity_filter:
            return

        # Deduplicate (for errors and warnings)
        if severity in ["error", "warning"] and not self.deduplicate_message(line):
            return

        # Store by severity
        if severity == "error":
            self.error_count += 1
            self.errors.append(line)
        elif severity == "warning":
            self.warning_count += 1
            self.warnings.append(line)
        elif severity == "info":
            self.info_count += 1
            if len(self.info_messages) < 20:  # Keep only recent info
                self.info_messages.append(line)
        else:  # debug
            self.debug_count += 1

    def stream_logs(
        self,
        follow: bool = False,
        duration: float | None = None,
        last_minutes: float | None = None,
    ) -> bool:
        """
        Stream logs from simulator.

        Args:
            follow: Follow mode (continuous streaming)
            duration: Capture duration in seconds
            last_minutes: Show logs from last N minutes

        Returns:
            True if successful
        """
        # Build log stream command
        cmd = ["xcrun", "simctl", "spawn", self.device_udid, "log", "stream"]

        # Add filters
        if self.app_bundle_id:
            # Filter by process name (extracted from bundle ID)
            app_name = self.app_bundle_id.split(".")[-1]
            cmd.extend(["--predicate", f'processImagePath CONTAINS "{app_name}"'])

        # Add time filter for historical logs
        if last_minutes:
            start_time = datetime.now() - timedelta(minutes=last_minutes)
            time_str = start_time.strftime("%Y-%m-%d %H:%M:%S")
            cmd.extend(["--start", time_str])

        # Setup signal handler for graceful interruption
        def signal_handler(sig, frame):
            self.interrupted = True
            if self.log_process:
                self.log_process.terminate()

        signal.signal(signal.SIGINT, signal_handler)

        try:
            # Start log streaming process
            self.log_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,  # Line buffered
            )

            # Track start time for duration
            start_time = datetime.now()

            # Process log lines
            for line in iter(self.log_process.stdout.readline, ""):
                if not line:
                    break

                # Process the line
                self.process_log_line(line.rstrip())

                # Print in follow mode
                if follow:
                    severity = self.classify_log_line(line)
                    if severity in self.severity_filter:
                        print(line.rstrip())

                # Check duration
                if duration and (datetime.now() - start_time).total_seconds() >= duration:
                    break

                # Check if interrupted
                if self.interrupted:
                    break

            # Wait for process to finish
            self.log_process.wait()
            return True

        except Exception as e:
            print(f"Error streaming logs: {e}", file=sys.stderr)
            return False

        finally:
            if self.log_process:
                self.log_process.terminate()

    def get_summary(self, verbose: bool = False) -> str:
        """
        Get log summary.

        Args:
            verbose: Include full log details

        Returns:
            Formatted summary string
        """
        lines = []

        # Header
        if self.app_bundle_id:
            lines.append(f"Logs for: {self.app_bundle_id}")
        else:
            lines.append("Logs for: All processes")

        # Statistics
        lines.append(f"Total lines: {self.total_lines}")
        lines.append(
            f"Errors: {self.error_count}, Warnings: {self.warning_count}, Info: {self.info_count}"
        )

        # Top issues
        if self.errors:
            lines.append(f"\nTop Errors ({len(self.errors)}):")
            for error in self.errors[:5]:  # Show first 5
                lines.append(f"  ❌ {error[:120]}")  # Truncate long lines

        if self.warnings:
            lines.append(f"\nTop Warnings ({len(self.warnings)}):")
            for warning in self.warnings[:5]:  # Show first 5
                lines.append(f"  ⚠️  {warning[:120]}")

        # Verbose output
        if verbose and self.log_lines:
            lines.append("\n=== Recent Log Lines ===")
            for line in self.log_lines[-50:]:  # Last 50 lines
                lines.append(line)

        return "\n".join(lines)

    def get_json_output(self) -> dict:
        """Get log results as JSON."""
        return {
            "app_bundle_id": self.app_bundle_id,
            "device_udid": self.device_udid,
            "statistics": {
                "total_lines": self.total_lines,
                "errors": self.error_count,
                "warnings": self.warning_count,
                "info": self.info_count,
                "debug": self.debug_count,
            },
            "errors": self.errors[:20],  # Limit to 20
            "warnings": self.warnings[:20],
            "sample_logs": self.log_lines[-50:],  # Last 50 lines
        }

    def save_logs(self, output_dir: str) -> str:
        """
        Save logs to file.

        Args:
            output_dir: Directory to save logs

        Returns:
            Path to saved log file
        """
        # Create output directory
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        app_name = self.app_bundle_id.split(".")[-1] if self.app_bundle_id else "simulator"
        log_file = output_path / f"{app_name}-{timestamp}.log"

        # Write all log lines
        with open(log_file, "w") as f:
            f.write("\n".join(self.log_lines))

        # Also save JSON summary
        json_file = output_path / f"{app_name}-{timestamp}-summary.json"
        with open(json_file, "w") as f:
            json.dump(self.get_json_output(), f, indent=2)

        return str(log_file)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Monitor and analyze iOS simulator logs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Monitor app in real-time
  python scripts/log_monitor.py --app com.myapp.MyApp --follow

  # Capture logs for 30 seconds
  python scripts/log_monitor.py --app com.myapp.MyApp --duration 30s

  # Show errors/warnings from last 5 minutes
  python scripts/log_monitor.py --severity error,warning --last 5m

  # Save logs to file
  python scripts/log_monitor.py --app com.myapp.MyApp --duration 1m --output logs/
        """,
    )

    # Filtering options
    parser.add_argument(
        "--app", dest="app_bundle_id", help="App bundle ID to filter logs (e.g., com.myapp.MyApp)"
    )
    parser.add_argument("--device-udid", help="Device UDID (uses booted if not specified)")
    parser.add_argument(
        "--severity", help="Comma-separated severity levels (error,warning,info,debug)"
    )

    # Time options
    time_group = parser.add_mutually_exclusive_group()
    time_group.add_argument(
        "--follow", action="store_true", help="Follow mode (continuous streaming)"
    )
    time_group.add_argument("--duration", help="Capture duration (e.g., 30s, 5m, 1h)")
    time_group.add_argument(
        "--last", dest="last_minutes", help="Show logs from last N minutes (e.g., 5m)"
    )

    # Output options
    parser.add_argument("--output", help="Save logs to directory")
    parser.add_argument("--verbose", action="store_true", help="Show detailed output")
    parser.add_argument("--json", action="store_true", help="Output as JSON")

    args = parser.parse_args()

    # Parse severity filter
    severity_filter = None
    if args.severity:
        severity_filter = [s.strip().lower() for s in args.severity.split(",")]

    # Initialize monitor
    monitor = LogMonitor(
        app_bundle_id=args.app_bundle_id,
        device_udid=args.device_udid,
        severity_filter=severity_filter,
    )

    # Parse duration
    duration = None
    if args.duration:
        duration = monitor.parse_time_duration(args.duration)

    # Parse last minutes
    last_minutes = None
    if args.last_minutes:
        last_minutes = monitor.parse_time_duration(args.last_minutes) / 60

    # Stream logs
    print("Monitoring logs...", file=sys.stderr)
    if args.app_bundle_id:
        print(f"App: {args.app_bundle_id}", file=sys.stderr)

    success = monitor.stream_logs(follow=args.follow, duration=duration, last_minutes=last_minutes)

    if not success:
        sys.exit(1)

    # Save logs if requested
    if args.output:
        log_file = monitor.save_logs(args.output)
        print(f"\nLogs saved to: {log_file}", file=sys.stderr)

    # Output results
    if not args.follow:  # Don't show summary in follow mode
        if args.json:
            print(json.dumps(monitor.get_json_output(), indent=2))
        else:
            print("\n" + monitor.get_summary(verbose=args.verbose))

    sys.exit(0)


if __name__ == "__main__":
    main()
