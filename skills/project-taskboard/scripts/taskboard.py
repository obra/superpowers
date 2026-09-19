#!/usr/bin/env python3
"""Create, validate, serve, and update a local hierarchical project task board."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import URLError
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen

STATUSES = {"todo", "in_progress", "blocked", "in_review", "done", "canceled", "unknown"}
KINDS = {"phase", "module", "capability", "plan", "step", "task", "implementation_task", "work_item"}
CONCRETE_KINDS = {"task", "implementation_task"}
BOARD_LOCK = threading.RLock()
MUTABLE_FIELDS = {
    "title", "parent_id", "kind", "status", "owner", "scope_class", "description",
    "summary", "source", "next_step", "current_step", "started_at", "completed_at",
    "planned_start", "planned_end", "due_at", "stages", "labels", "agent_id", "run_id", "session_id", "worktree", "branch", "evidence", "external_id",
    "required_denominator", "criteria", "acceptance", "depends_on", "audited_at", "evidence_type",
    "platform", "spec_source", "plan_source", "scope", "blocker",
}


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def json_bytes(value) -> bytes:
    return json.dumps(value, ensure_ascii=False, indent=2).encode("utf-8")


def read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise RuntimeError(f"文件不存在：{path}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"JSON 无法解析：{path}: {exc}") from exc


def write_atomic(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + f".{os.getpid()}.tmp")
    temp.write_bytes(json_bytes(value) + b"\n")
    os.replace(temp, path)


def board_path(root: Path) -> Path:
    return root / "board.json"


def load_board(root: Path) -> dict:
    board = read_json(board_path(root))
    if not isinstance(board, dict) or not isinstance(board.get("tasks"), list):
        raise RuntimeError("board.json 必须是包含 tasks 列表的对象")
    return board


def task_map(board: dict) -> dict[str, dict]:
    tasks = board["tasks"]
    result = {}
    for task in tasks:
        if not isinstance(task, dict) or not task.get("id"):
            raise RuntimeError("每个任务必须是包含 id 的对象")
        if task["id"] in result:
            raise RuntimeError(f"任务 ID 重复：{task['id']}")
        result[task["id"]] = task
    for task in tasks:
        parent = task.get("parent_id")
        if parent not in (None, "") and parent not in result:
            raise RuntimeError(f"任务 {task['id']} 的 parent_id 不存在：{parent}")
    for task in tasks:
        seen = set()
        current = task
        while current.get("parent_id"):
            if current["id"] in seen:
                raise RuntimeError(f"任务树存在循环：{task['id']}")
            seen.add(current["id"])
            current = result[current["parent_id"]]
    return result


def validate_board(root: Path) -> dict:
    for name in ("board.json", "index.html"):
        if not (root / name).is_file():
            raise RuntimeError(f"缺少看板文件：{root / name}")
    board = load_board(root)
    mapping = task_map(board)
    unknown_statuses = sorted({str(t.get("status")) for t in mapping.values() if t.get("status") not in STATUSES})
    unknown_kinds = sorted({str(t.get("kind")) for t in mapping.values() if t.get("kind") not in KINDS})
    return {
        "project": board.get("project", root.name),
        "schema_version": board.get("schema_version", 1),
        "updated_at": board.get("updated_at"),
        "task_count": len(mapping),
        "root_count": sum(not t.get("parent_id") for t in mapping.values()),
        "concrete_count": sum(t.get("kind") in CONCRETE_KINDS for t in mapping.values()),
        "unknown_statuses": unknown_statuses,
        "unknown_kinds": unknown_kinds,
    }


def normalize_board(source, project: str) -> dict:
    if isinstance(source, list):
        tasks = source
        extra = {}
    elif isinstance(source, dict) and isinstance(source.get("tasks"), list):
        tasks = source["tasks"]
        extra = {k: v for k, v in source.items() if k != "tasks"}
    else:
        raise RuntimeError("输入文件必须是任务列表，或包含 tasks 列表的对象")
    board = dict(extra)
    board["schema_version"] = int(board.get("schema_version", 1))
    board["project"] = board.get("project") or project
    board["updated_at"] = iso_now()
    board["tasks"] = tasks
    task_map(board)
    return board


def _plan_slug(value: str) -> str:
    cleaned = re.sub(r"[^\w-]+", "-", value.strip(), flags=re.UNICODE).strip("-").lower()
    if cleaned:
        return cleaned[:64]
    return hashlib.sha1(value.encode("utf-8")).hexdigest()[:12]


def _plan_title(text: str, source_path: str) -> str:
    for line in text.splitlines():
        match = re.match(r"^#\s+(.+?)\s*$", line)
        if match:
            title = re.sub(r"\s+Implementation Plan\s*$", "", match.group(1), flags=re.IGNORECASE).strip()
            return title or Path(source_path).stem
    return Path(source_path).stem


def _plan_field(text: str, name: str) -> str | None:
    match = re.search(rf"^\*\*{re.escape(name)}:\*\*\s*(.+?)\s*$", text, flags=re.MULTILINE)
    return match.group(1).strip() if match else None


def _step_status(checked: int, total: int) -> str:
    if total and checked == total:
        return "done"
    if checked:
        return "in_progress"
    return "todo"


def _implementation_stages(status: str) -> dict:
    return {"validation": "unknown", "implementation": status, "acceptance": "unknown"}


def parse_superpowers_plan(text: str, source_path: str = "superpowers-plan.md") -> dict:
    """Convert a Superpowers implementation plan into a taskboard document.

    The plan heading is a planning node, each ``### Task N`` is an executable
    task, and each bold ``Step N`` checkbox is a non-executable child node.
    """
    title = _plan_title(text, source_path)
    source_file = Path(source_path)
    source_slug = _plan_slug(source_file.stem)
    source_hash = hashlib.sha1(str(source_file).encode("utf-8")).hexdigest()[:8]
    slug = f"{source_slug}-{source_hash}"
    plan_id = f"superpowers-plan-{slug}"
    source = str(source_path)
    lines = text.splitlines()
    task_headers = [
        (index, int(match.group(1)), match.group(2).strip())
        for index, line in enumerate(lines)
        if (match := re.match(r"^###\s+Task\s+(\d+)\s*:\s*(.+?)\s*$", line))
    ]
    tasks = [{
        "id": plan_id,
        "title": title,
        "kind": "phase",
        "status": "todo",
        "scope_class": "required",
        "source": [source],
        "plan_source": [source],
        "external_id": f"superpowers:{source}:plan",
        "summary": _plan_field(text, "Goal") or "Superpowers implementation plan",
        "created_at": iso_now(),
        "updated_at": iso_now(),
    }]
    for position, (start, number, task_title) in enumerate(task_headers):
        end = task_headers[position + 1][0] if position + 1 < len(task_headers) else len(lines)
        section = "\n".join(lines[start:end])
        steps = []
        for step_match in re.finditer(
            r"^\s*-\s+\[([ xX])\]\s+\*\*Step\s+(\d+)\s*:\s*(.+?)\*\*\s*$",
            section,
            flags=re.MULTILINE,
        ):
            steps.append({
                "number": int(step_match.group(2)),
                "title": step_match.group(3).strip(),
                "status": "done" if step_match.group(1).lower() == "x" else "todo",
            })
        checked = sum(step["status"] == "done" for step in steps)
        task_id = f"{plan_id}-task-{number}"
        tasks.append({
            "id": task_id,
            "title": task_title,
            "parent_id": plan_id,
            "kind": "implementation_task",
            "status": _step_status(checked, len(steps)),
            "scope_class": "required",
            "source": [source],
            "plan_source": [source],
            "stages": _implementation_stages(_step_status(checked, len(steps))),
            "external_id": f"superpowers:{source}:task:{number}",
            "labels": ["superpowers", "plan-task"],
            "created_at": iso_now(),
            "updated_at": iso_now(),
        })
        for step in steps:
            step_number = step["number"]
            tasks.append({
                "id": f"{task_id}-step-{step_number}",
                "title": step["title"],
                "parent_id": task_id,
                "kind": "step",
                "status": step["status"],
                "scope_class": "required",
                "source": [source],
                "plan_source": [source],
                "external_id": f"superpowers:{source}:task:{number}:step:{step_number}",
                "labels": ["superpowers", "plan-step"],
                "created_at": iso_now(),
                "updated_at": iso_now(),
            })
    board = {
        "schema_version": 1,
        "project": title,
        "source_type": "superpowers_plan",
        "sources": [source],
        "updated_at": iso_now(),
        "tasks": tasks,
    }
    task_map(board)
    return board


def discover_superpowers_plans(project_root: Path) -> list[Path]:
    plans_root = project_root.expanduser().resolve() / "docs" / "superpowers" / "plans"
    if not plans_root.is_dir():
        return []
    return sorted(path for path in plans_root.rglob("*.md") if path.is_file())


def _merge_plan_into_board(board: dict, incoming: dict, source_path: str, sync_status: bool = False) -> None:
    existing = task_map(board)
    planning_fields = {
        "title", "parent_id", "kind", "scope_class", "source", "external_id",
        "summary", "labels",
    }
    for candidate in incoming["tasks"]:
        current = existing.get(candidate["id"])
        if current is None:
            board["tasks"].append(candidate)
            continue
        for field in planning_fields:
            if field in candidate:
                current[field] = candidate[field]
        if sync_status and current.get("status") not in {"blocked", "in_review", "canceled"}:
            if current.get("status") != candidate.get("status"):
                apply_patch(current, {"status": candidate["status"]})
        current["updated_at"] = iso_now()
    board["source_type"] = "superpowers_plan"
    board["sources"] = sorted(set(board.get("sources", [])) | set(incoming.get("sources", [])) | {source_path})


def merge_superpowers_plan(root: Path, text: str, source_path: str, sync_status: bool = False) -> dict:
    """Refresh plan structure while preserving live execution fields."""
    board = load_board(root)
    incoming = parse_superpowers_plan(text, source_path)
    _merge_plan_into_board(board, incoming, source_path, sync_status=sync_status)
    board["updated_at"] = iso_now()
    task_map(board)
    write_atomic(board_path(root), board)
    return board


def build_board_from_project(project_root: Path, project: str | None = None) -> dict:
    plans = discover_superpowers_plans(project_root)
    if not plans:
        raise RuntimeError(f"未找到 Superpowers 计划：{project_root / 'docs' / 'superpowers' / 'plans'}")
    board = {
        "schema_version": 1,
        "project": project or project_root.name,
        "source_type": "superpowers_plan",
        "sources": [],
        "updated_at": iso_now(),
        "tasks": [],
    }
    for plan_path in plans:
        incoming = parse_superpowers_plan(plan_path.read_text(encoding="utf-8"), str(plan_path))
        _merge_plan_into_board(board, incoming, str(plan_path))
    task_map(board)
    return board


def sync_project_plans(root: Path, project_root: Path, project: str | None = None) -> dict:
    plans = discover_superpowers_plans(project_root)
    if not plans:
        raise RuntimeError(f"未找到 Superpowers 计划：{project_root / 'docs' / 'superpowers' / 'plans'}")
    board = load_board(root)
    for plan_path in plans:
        incoming = parse_superpowers_plan(plan_path.read_text(encoding="utf-8"), str(plan_path))
        _merge_plan_into_board(board, incoming, str(plan_path), sync_status=True)
    if project:
        board["project"] = project
    board["updated_at"] = iso_now()
    task_map(board)
    write_atomic(board_path(root), board)
    return board


def make_task(payload: dict, parent_id=None) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("任务请求体必须是 JSON 对象")
    title = str(payload.get("title", "")).strip()
    if not title:
        raise ValueError("title 不能为空")
    task = {k: payload[k] for k in MUTABLE_FIELDS if k in payload}
    task["id"] = payload.get("id") or f"task-{uuid.uuid4().hex[:10]}"
    task["title"] = title
    task["parent_id"] = parent_id if parent_id is not None else payload.get("parent_id")
    task["kind"] = task.get("kind", "task")
    task["status"] = task.get("status", "todo")
    task["created_at"] = payload.get("created_at", iso_now())
    task["updated_at"] = iso_now()
    return task


def apply_patch(task: dict, patch: dict) -> dict:
    if not isinstance(patch, dict):
        raise ValueError("更新请求体必须是 JSON 对象")
    unknown = sorted(set(patch) - MUTABLE_FIELDS)
    if unknown:
        raise ValueError("不可更新字段：" + ", ".join(unknown))
    before_status = task.get("status")
    for key, value in patch.items():
        if key == "title" and not str(value).strip():
            raise ValueError("title 不能为空")
        task[key] = value
    if task.get("status") not in STATUSES:
        raise ValueError(f"不支持的状态：{task.get('status')}")
    if task.get("kind") not in KINDS:
        raise ValueError(f"不支持的任务类型：{task.get('kind')}")
    now = iso_now()
    if task.get("status") == "in_progress" and not task.get("started_at"):
        task["started_at"] = now
    if task.get("status") == "done" and not task.get("completed_at"):
        task["completed_at"] = now
    if task.get("status") != before_status:
        history = task.setdefault("status_history", [])
        history.append({"from": before_status, "to": task.get("status"), "at": now})
    task["updated_at"] = now
    return task


class BoardStore:
    def __init__(self, root: Path):
        self.root = root
        self.path = board_path(root)
        self.lock = BOARD_LOCK

    def read(self) -> dict:
        with self.lock:
            board = load_board(self.root)
            task_map(board)
            return board

    def write(self, board: dict) -> dict:
        with self.lock:
            task_map(board)
            board["updated_at"] = iso_now()
            write_atomic(self.path, board)
            return board

    def mutate(self, callback):
        with self.lock:
            board = load_board(self.root)
            task_map(board)
            result = callback(board)
            board["updated_at"] = iso_now()
            write_atomic(self.path, board)
            return result, board


class Handler(BaseHTTPRequestHandler):
    store: BoardStore

    def _send(self, status: int, payload, content_type="application/json; charset=utf-8"):
        body = payload if isinstance(payload, bytes) else json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _error(self, status: int, message: str):
        self._send(status, {"error": message})

    def _body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length > 1024 * 1024:
            raise ValueError("请求体超过 1 MiB")
        raw = self.rfile.read(length) if length else b"{}"
        value = json.loads(raw.decode("utf-8"))
        if not isinstance(value, dict):
            raise ValueError("请求体必须是 JSON 对象")
        return value

    def do_OPTIONS(self):
        self._send(204, b"")

    def do_GET(self):
        route = urlparse(self.path).path
        try:
            if route == "/":
                html = (self.store.root / "index.html").read_bytes()
                self._send(200, html, "text/html; charset=utf-8")
                return
            board = self.store.read()
            if route in ("/api/board", "/api/progress"):
                self._send(200, {"board": board, "read_at": iso_now()})
            elif route == "/api/tasks":
                self._send(200, {"tasks": board["tasks"], "project": board.get("project"), "updated_at": board.get("updated_at")})
            elif route == "/api/health":
                summary = validate_board(self.store.root)
                self._send(200, {"ok": True, **summary})
            else:
                self._error(404, "未找到接口")
        except (RuntimeError, ValueError, json.JSONDecodeError) as exc:
            self._error(400, str(exc))

    def do_POST(self):
        route = urlparse(self.path).path
        try:
            payload = self._body()
            if route == "/api/tasks":
                def create(board):
                    task = make_task(payload)
                    mapping = task_map(board)
                    if task["id"] in mapping:
                        raise ValueError(f"任务 ID 已存在：{task['id']}")
                    if task.get("parent_id") and task["parent_id"] not in mapping:
                        raise ValueError(f"父任务不存在：{task['parent_id']}")
                    board["tasks"].append(task)
                    return task
                task, board = self.store.mutate(create)
                self._send(201, {"task": task, "board_updated_at": board["updated_at"]})
                return
            parts = [unquote(x) for x in route.split("/") if x]
            if len(parts) == 4 and parts[:2] == ["api", "tasks"] and parts[3] == "children":
                parent_id = parts[2]
                def create_child(board):
                    mapping = task_map(board)
                    if parent_id not in mapping:
                        raise ValueError(f"父任务不存在：{parent_id}")
                    task = make_task(payload, parent_id=parent_id)
                    if task["id"] in mapping:
                        raise ValueError(f"任务 ID 已存在：{task['id']}")
                    board["tasks"].append(task)
                    return task
                task, board = self.store.mutate(create_child)
                self._send(201, {"task": task, "board_updated_at": board["updated_at"]})
                return
            if len(parts) == 4 and parts[:2] == ["api", "tasks"] and parts[3] == "status":
                task_id = parts[2]
                def update_status(board):
                    mapping = task_map(board)
                    if task_id not in mapping:
                        raise ValueError(f"任务不存在：{task_id}")
                    return apply_patch(mapping[task_id], {k: payload[k] for k in ("status", "current_step") if k in payload})
                task, board = self.store.mutate(update_status)
                self._send(200, {"task": task, "board_updated_at": board["updated_at"]})
                return
            self._error(404, "未找到接口")
        except (RuntimeError, ValueError, json.JSONDecodeError) as exc:
            self._error(400, str(exc))

    def do_PUT(self):
        route = urlparse(self.path).path
        parts = [unquote(x) for x in route.split("/") if x]
        if len(parts) != 3 or parts[:2] != ["api", "tasks"]:
            self._error(404, "未找到接口")
            return
        try:
            payload = self._body()
            task_id = parts[2]
            payload["id"] = task_id
            created = False
            def upsert(board):
                nonlocal created
                mapping = task_map(board)
                if task_id in mapping:
                    return apply_patch(mapping[task_id], {k: v for k, v in payload.items() if k != "id"})
                task = make_task(payload)
                task["id"] = task_id
                if task.get("parent_id") and task["parent_id"] not in mapping:
                    raise ValueError(f"父任务不存在：{task['parent_id']}")
                board["tasks"].append(task)
                created = True
                return task
            task, board = self.store.mutate(upsert)
            self._send(201 if created else 200, {"task": task, "created": created, "board_updated_at": board["updated_at"]})
        except (RuntimeError, ValueError, json.JSONDecodeError) as exc:
            self._error(400, str(exc))

    def do_PATCH(self):
        route = urlparse(self.path).path
        parts = [unquote(x) for x in route.split("/") if x]
        if len(parts) != 3 or parts[:2] != ["api", "tasks"]:
            self._error(404, "未找到接口")
            return
        try:
            payload = self._body()
            task_id = parts[2]
            def update(board):
                mapping = task_map(board)
                if task_id not in mapping:
                    raise ValueError(f"任务不存在：{task_id}")
                if "parent_id" in payload and payload["parent_id"] not in (None, "") and payload["parent_id"] not in mapping:
                    raise ValueError(f"父任务不存在：{payload['parent_id']}")
                return apply_patch(mapping[task_id], payload)
            task, board = self.store.mutate(update)
            self._send(200, {"task": task, "board_updated_at": board["updated_at"]})
        except (RuntimeError, ValueError, json.JSONDecodeError) as exc:
            self._error(400, str(exc))

    def log_message(self, *_args):
        return


class ReusableHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True


def start_server(root: Path, host: str, port: int, project_root: Path | None = None, watch_interval: float = 5.0):
    if project_root:
        sync_project_plans(root, project_root)
    validate_board(root)
    Handler.store = BoardStore(root)
    server = ReusableHTTPServer((host, port), Handler)
    print(f"任务看板服务已启动：http://{host}:{port}/", flush=True)
    stop = threading.Event()
    watcher = None
    if project_root:
        watcher = threading.Thread(
            target=watch_project_plans,
            args=(root, project_root, watch_interval, stop),
            name="superpowers-plan-watcher",
            daemon=True,
        )
        watcher.start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        stop.set()
        if watcher:
            watcher.join(timeout=2)
        server.server_close()


def probe(url: str) -> dict | None:
    try:
        with urlopen(url.rstrip("/") + "/api/health", timeout=1.5) as response:
            return json.loads(response.read()) if response.status == 200 else None
    except (OSError, URLError, json.JSONDecodeError):
        return None


def _project_port(project_root: Path | None, default_port: int = 47832) -> int:
    if not project_root:
        return default_port
    canonical = str(project_root.expanduser().resolve())
    # 基于项目绝对路径哈希衍生端口，分布在 47832..47899 范围
    digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    offset = int(digest[:4], 16) % 68
    return 47832 + offset


def _plan_signature(project_root: Path) -> tuple:
    signature = []
    for path in discover_superpowers_plans(project_root):
        stat = path.stat()
        signature.append((str(path), stat.st_mtime_ns, stat.st_size))
    return tuple(signature)


def watch_project_plans(root: Path, project_root: Path, interval: float, stop: threading.Event) -> None:
    previous = None
    while not stop.is_set():
        try:
            current = _plan_signature(project_root)
            if current != previous:
                sync_project_plans(root, project_root)
                previous = current
        except (OSError, RuntimeError, ValueError) as exc:
            print(f"任务看板计划同步失败：{exc}", file=sys.stderr, flush=True)
        stop.wait(max(0.5, interval))


def cmd_init(args):
    root = args.root.expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)
    target = board_path(root)
    if target.exists() and not args.force:
        raise RuntimeError(f"看板已存在：{target}；如需覆盖请使用 --force")
    plan_path = getattr(args, "plan", None)
    if plan_path:
        board = parse_superpowers_plan(plan_path.read_text(encoding="utf-8"), str(plan_path.expanduser().resolve()))
        if args.project:
            board["project"] = args.project
    elif getattr(args, "project_root", None):
        board = build_board_from_project(args.project_root, args.project)
    else:
        source = read_json(args.input.expanduser()) if args.input else []
        board = normalize_board(source, args.project or root.name)
    write_atomic(target, board)
    template = Path(__file__).resolve().parent.parent / "assets" / "index.html"
    shutil.copy2(template, root / "index.html")
    print(f"已生成看板：{root / 'index.html'}")
    print(f"任务数据：{target}（{len(board['tasks'])} 个任务）")


def cmd_check(args):
    result = validate_board(args.root.expanduser().resolve())
    print(json.dumps(result, ensure_ascii=False, indent=2))


def cmd_import_plan(args):
    root = args.root.expanduser().resolve()
    validate_board(root)
    board = merge_superpowers_plan(root, args.plan.read_text(encoding="utf-8"), str(args.plan.expanduser().resolve()))
    if args.project:
        board["project"] = args.project
        board["updated_at"] = iso_now()
        write_atomic(board_path(root), board)
    print(f"已同步 Superpowers 计划：{root / 'board.json'}（{len(board['tasks'])} 个任务节点）")


def cmd_start(args):
    root = args.root.expanduser().resolve()
    if args.project_root and not board_path(root).is_file():
        cmd_init(argparse.Namespace(
            root=root,
            project=args.project,
            input=None,
            plan=None,
            project_root=args.project_root,
            force=False,
        ))
    if args.project_root:
        sync_project_plans(root, args.project_root, args.project)
    validate_board(root)
    port = args.port if args.port != 47832 or not args.project_root else _project_port(args.project_root)
    url = f"http://{args.host}:{port}"
    existing = probe(url)
    if existing:
        if existing.get("project") != (args.project or root.name):
            # 端口冲突，换用由 root 决定的独立端口
            port = _project_port(root)
            url = f"http://{args.host}:{port}"
            existing = probe(url)
    if existing:
        print(f"复用现有任务看板：{url}/")
        return
    log = (root / "taskboard-server.log").open("a", encoding="utf-8")
    process = subprocess.Popen(
        [
            sys.executable, str(Path(__file__).resolve()), "serve", "--root", str(root),
            "--host", args.host, "--port", str(port),
            *(["--project-root", str(args.project_root), "--project", args.project, "--watch-interval", str(args.watch_interval)] if args.project_root else []),
        ],
        cwd=root,
        stdin=subprocess.DEVNULL,
        stdout=log,
        stderr=log,
        start_new_session=True,
    )
    for _ in range(30):
        time.sleep(0.2)
        if probe(url):
            print(f"任务看板已就绪：{url}/（PID {process.pid}）")
            return
    raise RuntimeError(f"任务看板服务未就绪，请检查 {root / 'taskboard-server.log'}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    init = sub.add_parser("init", help="创建一个独立任务看板")
    init.add_argument("--root", type=Path, required=True)
    init.add_argument("--project")
    init_source = init.add_mutually_exclusive_group()
    init_source.add_argument("--input", type=Path, help="导入通用任务 JSON")
    init_source.add_argument("--plan", type=Path, help="导入 Superpowers implementation plan Markdown")
    init.add_argument("--project-root", type=Path, help="自动扫描项目下 docs/superpowers/plans/*.md")
    init.add_argument("--force", action="store_true")
    init.set_defaults(func=cmd_init)
    import_plan = sub.add_parser("import-plan", help="同步 Superpowers implementation plan 到已有看板")
    import_plan.add_argument("--root", type=Path, required=True)
    import_plan.add_argument("--plan", type=Path, required=True)
    import_plan.add_argument("--project")
    import_plan.set_defaults(func=cmd_import_plan)
    check = sub.add_parser("check", help="校验任务树和看板资源")
    check.add_argument("--root", type=Path, required=True)
    check.set_defaults(func=cmd_check)
    start = sub.add_parser("start", help="复用或后台启动看板服务")
    start.add_argument("--root", type=Path, required=True)
    start.add_argument("--host", default="127.0.0.1")
    start.add_argument("--port", type=int, default=47832)
    start.add_argument("--project-root", type=Path, help="自动同步项目下的 Superpowers 计划")
    start.add_argument("--project")
    start.add_argument("--watch-interval", type=float, default=5.0)
    start.set_defaults(func=cmd_start)
    serve = sub.add_parser("serve", help="前台运行看板服务")
    serve.add_argument("--root", type=Path, required=True)
    serve.add_argument("--host", default="127.0.0.1")
    serve.add_argument("--port", type=int, default=47832)
    serve.add_argument("--project-root", type=Path, help="自动同步项目下的 Superpowers 计划")
    serve.add_argument("--project")
    serve.add_argument("--watch-interval", type=float, default=5.0)
    serve.set_defaults(func=lambda a: start_server(
        a.root.expanduser().resolve(), a.host, a.port,
        a.project_root.expanduser().resolve() if a.project_root else None,
        a.watch_interval,
    ))
    args = parser.parse_args()
    try:
        args.func(args)
    except (RuntimeError, ValueError, OSError) as exc:
        print(f"任务看板失败：{exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
