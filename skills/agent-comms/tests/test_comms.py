"""Tests for comms.py — run from skill directory via: pytest tests/ -v"""
import json
import subprocess
import sys
from pathlib import Path
from typing import List

import pytest

COMMS = Path(__file__).parent.parent / "comms.py"


def run(args: List[str], cwd: Path) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(COMMS)] + args,
        capture_output=True, text=True, cwd=cwd
    )


def read_json(cwd: Path, filename: str):
    return json.loads((cwd / ".agent-comms" / filename).read_text())


def test_skeleton_exists():
    assert COMMS.exists(), f"comms.py not found at {COMMS}"


# ── Task 2: register / deregister / heartbeat / stale cleanup ─────────────────

def test_register_creates_registry(tmp_path):
    r = run(["register", "agent-1", "fixing auth headers"], cwd=tmp_path)
    assert r.returncode == 0
    registry = read_json(tmp_path, "registry.json")
    assert "agent-1" in registry
    assert registry["agent-1"]["task"] == "fixing auth headers"


def test_register_bootstraps_comms_dir(tmp_path):
    run(["register", "agent-1", "task"], cwd=tmp_path)
    assert (tmp_path / ".agent-comms").is_dir()
    assert (tmp_path / ".agent-comms" / "registry.json").exists()
    assert (tmp_path / ".agent-comms" / "announcements.json").exists()
    assert (tmp_path / ".agent-comms" / "messages.json").exists()


def test_register_adds_to_gitignore(tmp_path):
    run(["register", "agent-1", "task"], cwd=tmp_path)
    gitignore = (tmp_path / ".gitignore").read_text()
    assert ".agent-comms/" in gitignore


def test_register_appends_to_existing_gitignore(tmp_path):
    (tmp_path / ".gitignore").write_text("node_modules/\n")
    run(["register", "agent-1", "task"], cwd=tmp_path)
    gitignore = (tmp_path / ".gitignore").read_text()
    assert "node_modules/" in gitignore
    assert ".agent-comms/" in gitignore


def test_deregister_removes_agent(tmp_path):
    run(["register", "agent-1", "task"], cwd=tmp_path)
    r = run(["deregister", "agent-1"], cwd=tmp_path)
    assert r.returncode == 0
    registry = read_json(tmp_path, "registry.json")
    assert "agent-1" not in registry


def test_heartbeat_updates_last_seen(tmp_path):
    run(["register", "agent-1", "task"], cwd=tmp_path)
    import time; time.sleep(0.05)
    r = run(["heartbeat", "agent-1"], cwd=tmp_path)
    assert r.returncode == 0
    registry = read_json(tmp_path, "registry.json")
    assert "last_seen" in registry["agent-1"]


def test_stale_agent_removed_on_register(tmp_path):
    run(["register", "agent-fresh", "task"], cwd=tmp_path)
    registry = read_json(tmp_path, "registry.json")
    registry["agent-stale"] = {
        "task": "old task",
        "started_at": "2020-01-01T00:00:00Z",
        "last_seen": 0.0,
    }
    (tmp_path / ".agent-comms" / "registry.json").write_text(json.dumps(registry))
    run(["register", "agent-new", "new task"], cwd=tmp_path)
    registry2 = read_json(tmp_path, "registry.json")
    assert "agent-stale" not in registry2
    assert "agent-fresh" in registry2
    assert "agent-new" in registry2


# ── Task 3: announce / check-conflicts ───────────────────────────────────────

def test_announce_writes_files(tmp_path):
    run(["register", "agent-1", "task"], cwd=tmp_path)
    r = run([
        "announce", "agent-1",
        "src/foo.ts|refactor auth",
        "src/bar.ts|add logging",
    ], cwd=tmp_path)
    assert r.returncode == 0
    ann = read_json(tmp_path, "announcements.json")
    assert "agent-1" in ann
    assert "src/foo.ts" in ann["agent-1"]["files"]
    assert ann["agent-1"]["files"]["src/foo.ts"] == "refactor auth"


def test_check_conflicts_clear(tmp_path):
    run(["register", "agent-1", "task-1"], cwd=tmp_path)
    run(["register", "agent-2", "task-2"], cwd=tmp_path)
    run(["announce", "agent-1", "src/foo.ts|edit foo"], cwd=tmp_path)
    run(["announce", "agent-2", "src/bar.ts|edit bar"], cwd=tmp_path)
    r = run(["check-conflicts", "agent-1"], cwd=tmp_path)
    assert r.returncode == 0
    assert "CLEAR" in r.stdout


def test_check_conflicts_detected(tmp_path):
    run(["register", "agent-1", "task-1"], cwd=tmp_path)
    run(["register", "agent-2", "task-2"], cwd=tmp_path)
    run(["announce", "agent-1", "src/shared.ts|edit shared"], cwd=tmp_path)
    run(["announce", "agent-2", "src/shared.ts|also edit shared"], cwd=tmp_path)
    r = run(["check-conflicts", "agent-2"], cwd=tmp_path)
    assert r.returncode == 0
    assert "CONFLICT" in r.stdout
    assert "agent-1" in r.stdout
    assert "src/shared.ts" in r.stdout


def test_announce_pipe_split_on_first_pipe_only(tmp_path):
    run(["register", "agent-1", "task"], cwd=tmp_path)
    run(["announce", "agent-1", "src/foo.ts|reason with | pipe in it"], cwd=tmp_path)
    ann = read_json(tmp_path, "announcements.json")
    assert ann["agent-1"]["files"]["src/foo.ts"] == "reason with | pipe in it"


# ── Task 4: send / read-messages ─────────────────────────────────────────────

def test_send_message(tmp_path):
    run(["register", "agent-1", "t1"], cwd=tmp_path)
    run(["register", "agent-2", "t2"], cwd=tmp_path)
    r = run(["send", "agent-1", "agent-2", "CONFLICT on foo.ts — can you go after me?"], cwd=tmp_path)
    assert r.returncode == 0
    messages = read_json(tmp_path, "messages.json")
    assert len(messages) == 1
    assert messages[0]["from"] == "agent-1"
    assert messages[0]["to"] == "agent-2"
    assert "CONFLICT" in messages[0]["message"]
    assert messages[0]["read"] is False


def test_read_messages_marks_as_read(tmp_path):
    run(["register", "agent-1", "t1"], cwd=tmp_path)
    run(["register", "agent-2", "t2"], cwd=tmp_path)
    run(["send", "agent-1", "agent-2", "hello"], cwd=tmp_path)
    r = run(["read-messages", "agent-2"], cwd=tmp_path)
    assert r.returncode == 0
    assert "agent-1" in r.stdout
    assert "hello" in r.stdout
    messages = read_json(tmp_path, "messages.json")
    assert messages[0]["read"] is True


def test_read_messages_no_messages(tmp_path):
    run(["register", "agent-1", "t1"], cwd=tmp_path)
    r = run(["read-messages", "agent-1"], cwd=tmp_path)
    assert r.returncode == 0
    assert "No new messages" in r.stdout


def test_read_messages_only_own(tmp_path):
    run(["register", "agent-1", "t1"], cwd=tmp_path)
    run(["register", "agent-2", "t2"], cwd=tmp_path)
    run(["register", "agent-3", "t3"], cwd=tmp_path)
    run(["send", "agent-1", "agent-2", "for agent-2 only"], cwd=tmp_path)
    r = run(["read-messages", "agent-3"], cwd=tmp_path)
    assert "No new messages" in r.stdout


# ── Task 5: status / done / full lifecycle ───────────────────────────────────

def test_status_shows_active_agents(tmp_path):
    run(["register", "agent-1", "task-one"], cwd=tmp_path)
    run(["register", "agent-2", "task-two"], cwd=tmp_path)
    run(["announce", "agent-1", "src/foo.ts|edit foo"], cwd=tmp_path)
    r = run(["status"], cwd=tmp_path)
    assert r.returncode == 0
    assert "agent-1" in r.stdout
    assert "agent-2" in r.stdout
    assert "task-one" in r.stdout
    assert "src/foo.ts" in r.stdout


def test_done_removes_agent_and_broadcasts(tmp_path):
    run(["register", "agent-1", "t1"], cwd=tmp_path)
    run(["register", "agent-2", "t2"], cwd=tmp_path)
    run(["announce", "agent-1", "src/foo.ts|edit"], cwd=tmp_path)
    r = run(["done", "agent-1", "src/foo.ts", "src/bar.ts"], cwd=tmp_path)
    assert r.returncode == 0
    registry = read_json(tmp_path, "registry.json")
    assert "agent-1" not in registry
    announcements = read_json(tmp_path, "announcements.json")
    assert "agent-1" not in announcements
    messages = read_json(tmp_path, "messages.json")
    broadcasts = [m for m in messages if m["to"] == "agent-2"]
    assert len(broadcasts) == 1
    assert "src/foo.ts" in broadcasts[0]["message"]


def test_full_lifecycle(tmp_path):
    """Smoke: full lifecycle — register, announce, conflict, send, read, done."""
    run(["register", "agent-a", "build feature X"], cwd=tmp_path)
    run(["register", "agent-b", "fix bug Y"], cwd=tmp_path)
    run(["announce", "agent-a", "src/shared.ts|add feature"], cwd=tmp_path)
    run(["announce", "agent-b", "src/shared.ts|fix bug"], cwd=tmp_path)
    r_conflict = run(["check-conflicts", "agent-b"], cwd=tmp_path)
    assert "CONFLICT" in r_conflict.stdout
    run(["send", "agent-b", "agent-a",
         "CONFLICT on src/shared.ts — I need to fix line 42. Can I go after you?"],
        cwd=tmp_path)
    r_msg = run(["read-messages", "agent-a"], cwd=tmp_path)
    assert "line 42" in r_msg.stdout
    run(["send", "agent-a", "agent-b", "Done in 3 edits. Wait for my DONE broadcast."],
        cwd=tmp_path)
    run(["done", "agent-a", "src/shared.ts"], cwd=tmp_path)
    r_final = run(["read-messages", "agent-b"], cwd=tmp_path)
    assert "src/shared.ts" in r_final.stdout
