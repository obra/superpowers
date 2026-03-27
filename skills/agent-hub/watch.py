#!/usr/bin/env python3
"""Live-refresh terminal display for agent-hub token usage."""
import subprocess
import time
import sys
import os

ROUTER = os.path.join(os.path.dirname(__file__), "router.py")
INTERVAL = 30  # seconds


def get_status():
    result = subprocess.run(
        ["python3", ROUTER, "status"],
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def clear():
    os.system("clear")


def main():
    interval = int(sys.argv[1]) if len(sys.argv) > 1 else INTERVAL
    print(f"agent-hub live status — refreshing every {interval}s  (Ctrl+C to stop)\n")
    try:
        while True:
            clear()
            print(f"agent-hub live status — refreshing every {interval}s  (Ctrl+C to stop)\n")
            print(get_status())
            print(f"\nLast updated: {time.strftime('%H:%M:%S')}")
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
