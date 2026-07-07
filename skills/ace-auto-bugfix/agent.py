"""ACE Auto Bugfix agent.

Polls a Feishu Bitable for bug records marked for auto-fix, generates code
patches using Claude, runs tests, and requests human review via Feishu.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

logger = logging.getLogger("ace_auto_bugfix")

FIELD_AUTO_FIX = "自动修复"
FIELD_FIX_STATUS = "修复状态"
FIELD_SUMMARY = "代码变更摘要"
FIELD_CHANGED_FILES = "变更文件"
FIELD_BRANCH_LINK = "分支或PR链接"
FIELD_REVIEW_RESULT = "审核结果"
FIELD_FIX_TIME = "修复完成时间"
FIELD_FAILURE_REASON = "失败原因"

STATUS_PENDING = "待修复"
STATUS_FIXING = "修复中"
STATUS_PENDING_REVIEW = "待审核"
STATUS_CONFIRMED = "已确认"
STATUS_REJECTED = "已拒绝"
STATUS_FAILED = "修复失败"


@dataclass
class BitableConfig:
    base_token: str
    table_id: str
    view_id: str


@dataclass
class AceConfig:
    repo_path: Path
    test_command: list[str]


@dataclass
class Config:
    bitable: BitableConfig
    ace: AceConfig
    poll_interval: int = 60
    log_level: str = "INFO"


def load_config(path: str | Path) -> Config:
    with open(path, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)
    bitable = BitableConfig(
        base_token=raw["bitable"]["base_token"],
        table_id=raw["bitable"]["table_id"],
        view_id=raw["bitable"]["view_id"],
    )
    ace_raw = raw.get("ace", {})
    ace = AceConfig(
        repo_path=Path(ace_raw.get("repo_path", "/data/codes/ace")),
        test_command=ace_raw.get("test_command", ["make", "test-core"]),
    )
    return Config(
        bitable=bitable,
        ace=ace,
        poll_interval=raw.get("poll_interval", 60),
        log_level=raw.get("log_level", "INFO"),
    )


def _run_lark_cli(args: list[str]) -> dict[str, Any]:
    cmd = ["lark-cli", "base"] + args + ["--as", "user"]
    logger.debug("Running: %s", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        logger.error("lark-cli failed: %s", result.stderr)
        raise RuntimeError(f"lark-cli failed: {result.stderr}")
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        logger.error("Could not parse lark-cli output: %s", result.stdout[:500])
        raise RuntimeError("Invalid JSON from lark-cli") from exc


def list_records(config: BitableConfig) -> list[dict[str, Any]]:
    resp = _run_lark_cli(
        [
            "+record-list",
            "--base-token",
            config.base_token,
            "--table-id",
            config.table_id,
            "--view-id",
            config.view_id,
            "--limit",
            "200",
            "--format",
            "json",
        ]
    )
    data = resp.get("data", {})
    fields = data.get("fields", [])
    records: list[dict[str, Any]] = []
    for record_id, row in zip(data.get("record_id_list", []), data.get("data", [])):
        record = {"record_id": record_id, "fields": dict(zip(fields, row))}
        records.append(record)
    return records


def update_record(
    config: BitableConfig,
    record_id: str,
    fields: dict[str, Any],
) -> None:
    _run_lark_cli(
        [
            "+record-upsert",
            "--base-token",
            config.base_token,
            "--table-id",
            config.table_id,
            "--record-id",
            record_id,
            "--json",
            json.dumps(fields, ensure_ascii=False),
        ]
    )


def extract_text_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return ", ".join(str(v) for v in value)
    if isinstance(value, dict):
        return str(value.get("text", value.get("name", "")))
    return str(value)


def extract_checkbox(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ("true", "1", "yes", "是")
    return bool(value)


def extract_select(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list) and value:
        return extract_select(value[0])
    if isinstance(value, dict):
        return str(value.get("text", value.get("name", "")))
    return ""


def user_open_id(record: dict[str, Any]) -> str | None:
    reporter = record.get("fields", {}).get("上报人")
    if isinstance(reporter, list) and reporter:
        return reporter[0].get("id")
    if isinstance(reporter, dict):
        return reporter.get("id")
    return None


async def send_review_message(
    reporter_open_id: str,
    record: dict[str, Any],
    summary: str,
    changed_files: list[str],
    bitable_url: str,
) -> None:
    title = "ACE Bug 修复待审核"
    description = extract_text_value(record["fields"].get("问题描述", ""))
    lines = [
        f"问题：{description}",
        f"变更摘要：{summary}",
        f"变更文件：{', '.join(changed_files)}",
        f"请打开 Bitable 记录并更新「审核结果」为「通过」或「拒绝」：{bitable_url}",
    ]
    payload = {
        "msg_type": "post",
        "content": {
            "post": {
                "zh_cn": {
                    "title": title,
                    "content": [[{"tag": "text", "text": line}] for line in lines],
                }
            }
        },
    }
    cmd = [
        "lark-cli",
        "im",
        "+messages-send",
        "--user-id",
        reporter_open_id,
        "--content",
        json.dumps(payload, ensure_ascii=False),
        "--msg-type",
        "post",
        "--as",
        "user",
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        logger.error("Failed to send Feishu message: %s", stderr.decode())
    else:
        logger.info("Sent review message to %s", reporter_open_id)


def create_worktree(repo_path: Path, record_id: str) -> Path:
    branch_name = f"auto-bugfix/{record_id[:8]}"
    worktree_path = repo_path / ".worktrees" / branch_name
    worktree_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["git", "-C", str(repo_path), "worktree", "add", "-b", branch_name, str(worktree_path)],
        check=False,
    )
    if not worktree_path.exists():
        worktree_path.mkdir(parents=True, exist_ok=True)
    return worktree_path


def remove_worktree(repo_path: Path, worktree_path: Path) -> None:
    subprocess.run(
        ["git", "-C", str(repo_path), "worktree", "remove", "-f", str(worktree_path)],
        check=False,
    )


def gather_context(record: dict[str, Any]) -> str:
    fields = record.get("fields", {})
    parts = [
        f"问题描述：{extract_text_value(fields.get('问题描述', ''))}",
        f"类型：{extract_select(fields.get('类型', ''))}",
        f"环境：{extract_select(fields.get('环境', ''))}",
        f"重要程度：{extract_select(fields.get('重要程度(P0优先)', ''))}",
        f"修复难度：{extract_select(fields.get('修复难度(L1 最难)', ''))}",
        f"复现路径：{extract_text_value(fields.get('复现路径', ''))}",
    ]
    return "\n".join(parts)


def find_relevant_files(repo_path: Path, context: str) -> list[str]:
    # Simple heuristic: search for unique words from context in Python file names.
    words = set(re.findall(r"[A-Za-z_][A-Za-z0-9_]*", context))
    words = {w for w in words if len(w) > 3}
    matches: dict[str, int] = {}
    for py_file in repo_path.rglob("*.py"):
        rel = str(py_file.relative_to(repo_path))
        score = sum(1 for w in words if w.lower() in rel.lower())
        if score:
            matches[rel] = score
    return sorted(matches, key=matches.get, reverse=True)[:10]  # type: ignore[arg-type]


def read_file_snippets(repo_path: Path, rel_paths: list[str]) -> str:
    snippets = []
    for rel in rel_paths:
        path = repo_path / rel
        if not path.exists():
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except Exception:
            continue
        snippets.append(f"--- {rel} ---\n{content[:4000]}")
    return "\n\n".join(snippets)


def build_patch_prompt(context: str, snippets: str) -> str:
    return (
        "You are an expert software engineer working on the ACE project. "
        "A bug was reported with the following details:\n\n"
        f"{context}\n\n"
        "Here are relevant source files:\n\n"
        f"{snippets}\n\n"
        "Please produce a minimal, correct patch that fixes the bug. "
        "Return ONLY a JSON object with this shape:\n"
        '{"summary": "short description of the fix", '
        '"changed_files": ["relative/path/to/file.py"], '
        '"diff": "unified diff text"}\n'
        "Do not include any explanation outside the JSON."
    )


def call_claude_for_patch(prompt: str) -> dict[str, Any]:
    # Prefer using the local `claude` CLI if available; otherwise fall back to
    # environment-configured API.
    claude_cmd = os.environ.get("ACE_CLAUDE_CMD", "claude")
    try:
        proc = subprocess.run(
            [claude_cmd, "--output-format", "text", "-p", prompt],
            capture_output=True,
            text=True,
            timeout=300,
            check=False,
        )
    except FileNotFoundError as exc:
        raise RuntimeError("claude CLI not found; set ACE_CLAUDE_CMD") from exc
    if proc.returncode != 0:
        raise RuntimeError(f"claude CLI failed: {proc.stderr}")
    # Try to extract the JSON block from the output.
    text = proc.stdout.strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise RuntimeError("No JSON object found in claude output")
    return json.loads(match.group())


def apply_patch(worktree_path: Path, diff_text: str) -> None:
    proc = subprocess.run(
        ["git", "-C", str(worktree_path), "apply", "--check"],
        input=diff_text,
        text=True,
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"Patch does not apply: {proc.stderr}")
    subprocess.run(
        ["git", "-C", str(worktree_path), "apply"],
        input=diff_text,
        text=True,
        check=True,
    )


def run_tests(worktree_path: Path, test_command: list[str]) -> tuple[bool, str]:
    proc = subprocess.run(
        test_command,
        cwd=str(worktree_path),
        capture_output=True,
        text=True,
        timeout=600,
        check=False,
    )
    ok = proc.returncode == 0
    output = proc.stdout + "\n" + proc.stderr
    return ok, output


def commit_patch(worktree_path: Path, summary: str) -> str:
    subprocess.run(
        ["git", "-C", str(worktree_path), "add", "-A"],
        check=True,
    )
    subprocess.run(
        ["git", "-C", str(worktree_path), "commit", "-m", summary],
        check=True,
    )
    result = subprocess.run(
        ["git", "-C", str(worktree_path), "rev-parse", "--short", "HEAD"],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


async def process_record(
    config: Config,
    record: dict[str, Any],
    bitable_url: str,
) -> None:
    record_id = record.get("record_id", record.get("_record_id", ""))
    fields = record.get("fields", {})

    if not extract_checkbox(fields.get(FIELD_AUTO_FIX)):
        return
    status = extract_select(fields.get(FIELD_FIX_STATUS))
    if status != STATUS_PENDING:
        return

    logger.info("Processing record %s", record_id)
    update_record(
        config.bitable,
        record_id,
        {FIELD_FIX_STATUS: STATUS_FIXING},
    )

    worktree_path: Path | None = None
    try:
        context = gather_context(record)
        relevant_files = find_relevant_files(config.ace.repo_path, context)
        snippets = read_file_snippets(config.ace.repo_path, relevant_files)
        prompt = build_patch_prompt(context, snippets)
        patch = call_claude_for_patch(prompt)

        summary = patch["summary"]
        changed_files = patch["changed_files"]
        diff_text = patch["diff"]

        worktree_path = create_worktree(config.ace.repo_path, record_id)
        apply_patch(worktree_path, diff_text)
        tests_ok, test_output = run_tests(worktree_path, config.ace.test_command)

        if not tests_ok:
            raise RuntimeError(f"Tests failed:\n{test_output[:2000]}")

        commit_hash = commit_patch(worktree_path, summary)
        branch_link = f"{bitable_url} (commit: {commit_hash} in {worktree_path})"
        fix_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        update_record(
            config.bitable,
            record_id,
            {
                FIELD_FIX_STATUS: STATUS_PENDING_REVIEW,
                FIELD_SUMMARY: summary,
                FIELD_CHANGED_FILES: ", ".join(changed_files),
                FIELD_BRANCH_LINK: branch_link,
                FIELD_FIX_TIME: fix_time,
                FIELD_FAILURE_REASON: "",
            },
        )

        reporter_id = user_open_id(record)
        if reporter_id:
            await send_review_message(
                reporter_id,
                record,
                summary,
                changed_files,
                bitable_url,
            )
        else:
            logger.warning("No reporter found for record %s", record_id)

    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to fix record %s", record_id)
        update_record(
            config.bitable,
            record_id,
            {
                FIELD_FIX_STATUS: STATUS_FAILED,
                FIELD_FAILURE_REASON: str(exc)[:2000],
            },
        )
    finally:
        if worktree_path:
            remove_worktree(config.ace.repo_path, worktree_path)


async def poll_review_results(config: Config) -> None:
    records = list_records(config.bitable)
    for record in records:
        fields = record.get("fields", {})
        status = extract_select(fields.get(FIELD_FIX_STATUS))
        if status != STATUS_PENDING_REVIEW:
            continue
        review = extract_select(fields.get(FIELD_REVIEW_RESULT))
        record_id = record.get("record_id", record.get("_record_id", ""))
        if review == "通过":
            update_record(
                config.bitable,
                record_id,
                {FIELD_FIX_STATUS: STATUS_CONFIRMED},
            )
            logger.info("Record %s confirmed", record_id)
        elif review == "拒绝":
            update_record(
                config.bitable,
                record_id,
                {FIELD_FIX_STATUS: STATUS_REJECTED},
            )
            logger.info("Record %s rejected", record_id)


async def main_loop(config: Config, bitable_url: str) -> None:
    while True:
        logger.info("Polling Bitable...")
        records = list_records(config.bitable)
        for record in records:
            try:
                await process_record(config, record, bitable_url)
            except Exception:
                logger.exception("Error processing record")
        try:
            await poll_review_results(config)
        except Exception:
            logger.exception("Error polling review results")
        logger.info("Sleeping %d seconds...", config.poll_interval)
        await asyncio.sleep(config.poll_interval)


def build_bitable_url(base_token: str, table_id: str, view_id: str) -> str:
    return (
        f"https://dptechnology.feishu.cn/base/{base_token}?table={table_id}&view={view_id}"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="ACE auto bugfix agent")
    parser.add_argument("--config", required=True, help="Path to YAML config file")
    args = parser.parse_args()

    config = load_config(args.config)
    logging.basicConfig(
        level=getattr(logging, config.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    bitable_url = build_bitable_url(
        config.bitable.base_token,
        config.bitable.table_id,
        config.bitable.view_id,
    )

    try:
        asyncio.run(main_loop(config, bitable_url))
    except KeyboardInterrupt:
        logger.info("Stopped by user")
    return 0


if __name__ == "__main__":
    sys.exit(main())
