#!/usr/bin/env python3
"""ACE Doctor UserPromptSubmit hook — 判定是否建议上报 traceback（非阻塞）。

注册为两条 hook（hooks.json）：
1. `detect-frustration.py --fast`（同步，毫秒级）：只做关键词/客观信号短路。
   命中时 exit 0 输出 JSON：`systemMessage` 直接显示给用户（用户能立刻看到
   ACE Doctor 在工作），`additionalContext` 告知 Claude 如何跟进。
2. `detect-frustration.py`（asyncRewake，后台）：负责 --fast 未命中时的
   LLM 语义判定。命中时 exit 2 + stderr 消息，Claude Code 把 stderr 作为
   system reminder 唤醒 Claude，Claude 以 「🩺 [ACE Doctor]」 署名向用户转述。

本 hook 不依赖 CLAUDE_PROJECT_DIR/ACE_ROOT，直接解析 ~/.ace 下的用户级状态。

判定分两层：
1. 快速关键词/客观信号短路：命中则直接触发，不再调 LLM；
2. LLM 语义判定：未命中短路时，收集客观信号打成极小上下文包交给 `claude -p`。

默认**不指定模型**（跟随用户自己的 claude 配置，避免自定义 LLM API endpoint
下硬编码模型 ID 不可用）；确有需要时可通过 ACE_TRACEBACK_JUDGE_MODEL 或
config 的 judge_model 强制指定。

值得建议的情况：工具反复失败、用户沮丧/愤怒、工作流执行失败、会话异常漫长。

成本与防打扰控制：
- 递归防护：ACE_TRACEBACK_JUDGE=1 时直接退出（judge 子进程自身不再判定）
- headless 防护：CLAUDE_CODE_ENTRYPOINT=sdk-*（claude -p / SDK）时 async 直接退出——
  headless 下 asyncRewake 不生效、exit 2 会拦截 prompt，且没有交互用户可唤醒
- 冷却：每 session 至多每 judge_cooldown_seconds（默认 120s）调一次 LLM
- 去重：按 session_id + trigger 每会话每触发器最多提示一次（--fast 与 async 共享）
- 所有 trigger 都提示过后不再调 LLM

~/.ace/config.json 可覆盖（"doctor" 段，旧 "frustration" 段向后兼容）：
  judge_model / judge_timeout / judge_cooldown_seconds / failure_threshold /
  long_session_lines / long_session_hours /
  frustration_keywords / workflow_failure_keywords
测试可用 ACE_TRACEBACK_JUDGE_CMD 指定替身命令（读 stdin 输出 verdict JSON）。
"""
from __future__ import annotations

import json
import os
import re
import shlex
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _ace_doctor import (  # noqa: E402
    JUDGED_AT_KEY,
    claude_context,
    doctor_config,
    read_session_state,
    record_session_key,
    session_failures_file,
    user_hint,
    wake_message,
    within_cooldown,
)

_VALID_TRIGGERS = {"frustration", "repeated_failures", "workflow_failure", "long_session"}

_DEFAULT_JUDGE_TIMEOUT = 15
_DEFAULT_JUDGE_COOLDOWN_SECONDS = 120

_PROMPT_MAX_CHARS = 400
_FAILURE_SAMPLE_MAX = 3
_FAILURE_SAMPLE_CHARS = 120

# 快速关键词短路：命中则直接触发，不再调 LLM。用户可通过 config 覆盖。
_DEFAULT_FRUSTRATION_KEYWORDS = [
    # 中文（短语优先，避免单字误触发）
    "崩溃",
    "抓狂",
    "烦死",
    "烦躁",
    "愤怒",
    "火大",
    "气死",
    "受够了",
    "搞不定",
    "救不了",
    "无力",
    "心累",
    "垃圾",
    "废物",
    "什么鬼",
    "搞什么",
    "怎么又",
    "又报错",
    "还是不行",
    "到底为什么",
    "算了",
    # 英文
    "wtf",
    "what the fuck",
    "fuck",
    "shit",
    "damn",
    "stuck again",
    "broken again",
    "give up",
    "gives up",
    "so frustrated",
    "so annoying",
    "not working",
]

# 工作流失败关键词：必须带失败语义。裸 "workflow"/"工作流" 在正常讨论中会误触发，
# 客观的工作流执行失败由 post-tool-trace.py（PostToolUseFailure）负责检测。
_DEFAULT_WORKFLOW_FAILURE_KEYWORDS = [
    "workflow failed",
    "workflow 失败",
    "workflow 报错",
    "工作流失败",
    "工作流报错",
    "工作流执行失败",
    "执行失败",
    "运行失败",
    "跑不通",
    "跑不起来",
]

_DEFAULT_LONG_SESSION_LINES = 1000
_DEFAULT_LONG_SESSION_HOURS = 1.0


def _get_config() -> dict[str, Any]:
    """合并默认与 user config（doctor/frustration 段）。"""
    cfg = doctor_config()
    return {
        # 默认不指定模型（None）：跟随用户 claude 配置，兼容自定义 API endpoint
        "judge_model": os.environ.get("ACE_TRACEBACK_JUDGE_MODEL") or cfg.get("judge_model"),
        "judge_timeout": cfg.get("judge_timeout", _DEFAULT_JUDGE_TIMEOUT),
        "judge_cooldown_seconds": cfg.get(
            "judge_cooldown_seconds", _DEFAULT_JUDGE_COOLDOWN_SECONDS
        ),
        "failure_threshold": cfg["failure_threshold"],
        "long_session_lines": cfg.get("long_session_lines", _DEFAULT_LONG_SESSION_LINES),
        "long_session_hours": cfg.get("long_session_hours", _DEFAULT_LONG_SESSION_HOURS),
        "frustration_keywords": cfg.get(
            "frustration_keywords", _DEFAULT_FRUSTRATION_KEYWORDS
        ),
        "workflow_failure_keywords": cfg.get(
            "workflow_failure_keywords", _DEFAULT_WORKFLOW_FAILURE_KEYWORDS
        ),
    }


def _collect_failures(session_id: str) -> tuple[int, list[str]]:
    """统计 session 失败数并取最近几条样例。

    post-tool-trace.py 写入 {entity_id: [failure_records]}；文件在 SessionEnd
    时删除，因此全部记录都属于当前 session。兼容旧的 {session_id: count} 形状。
    """
    try:
        data = json.loads(session_failures_file().read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return 0, []
    if not isinstance(data, dict):
        return 0, []

    # Legacy shapes written by older hook versions / test harnesses.
    if session_id in data:
        session_data = data[session_id]
        if isinstance(session_data, int):
            return session_data, []
        if isinstance(session_data, dict):
            return sum(v for v in session_data.values() if isinstance(v, int)), []
        if isinstance(session_data, list):
            data = {session_id: session_data}

    total = 0
    records: list[dict[str, Any]] = []
    for key, value in data.items():
        if isinstance(value, list) and not str(key).startswith("_"):
            total += len(value)
            records.extend(r for r in value if isinstance(r, dict))

    samples: list[str] = []
    for record in records[-_FAILURE_SAMPLE_MAX:]:
        cause = str(record.get("cause") or record.get("error_snippet") or "")
        command = str(record.get("command") or "")
        text = f"{command}: {cause}".strip(": ")
        if text:
            samples.append(text[:_FAILURE_SAMPLE_CHARS])
    return total, samples


def _find_transcript_path(session_id: str) -> Path | None:
    """在 ~/.claude/projects/*/<session_id>.jsonl 中查找 transcript。"""
    projects_dir = Path.home() / ".claude" / "projects"
    if not projects_dir.is_dir():
        return None
    try:
        for project_dir in projects_dir.iterdir():
            candidate = project_dir / f"{session_id}.jsonl"
            if candidate.is_file():
                return candidate
    except OSError:
        pass
    return None


def _transcript_stats(transcript_path: str | None, session_id: str) -> tuple[float, int]:
    """返回 (会话时长小时, transcript 行数)。"""
    p: Path | None = None
    if transcript_path:
        candidate = Path(transcript_path).expanduser()
        if candidate.is_file():
            p = candidate
    if p is None:
        p = _find_transcript_path(session_id)
    if p is None:
        return 0.0, 0
    try:
        mtime = p.stat().st_mtime
        age_hours = max(0.0, (datetime.now(tz=timezone.utc).timestamp() - mtime) / 3600)
    except OSError:
        return 0.0, 0
    try:
        with p.open(encoding="utf-8", errors="replace") as f:
            lines = sum(1 for _ in f)
    except OSError:
        lines = 0
    return age_hours, lines


def _keyword_shortcut(
    prompt: str,
    failure_count: int,
    line_count: int,
    age_hours: float,
    cfg: dict[str, Any],
) -> tuple[str, str] | None:
    """快速关键词/客观信号短路。返回 (trigger, reason) 或 None（继续走 LLM）。

    注意：这是**快速路径**，只覆盖显而易见的情况；
    未命中时仍由 LLM 做语义判定，避免漏掉隐含沮丧或复杂上下文。
    """
    # 客观信号短路
    if failure_count >= int(cfg["failure_threshold"]):
        return "repeated_failures", f"失败数 {failure_count} 达到阈值"
    if line_count >= int(cfg["long_session_lines"]):
        return "long_session", f"transcript {line_count} 行"
    if age_hours >= float(cfg["long_session_hours"]):
        return "long_session", f"会话时长 {age_hours:.1f}h"

    lowered = prompt.lower()
    for kw in cfg["frustration_keywords"]:
        if kw.lower() in lowered:
            return "frustration", f"关键词命中：{kw}"
    for kw in cfg["workflow_failure_keywords"]:
        if kw.lower() in lowered:
            return "workflow_failure", f"关键词命中：{kw}"

    # 强标点信号（重复感叹号/问号）
    if re.search(r"[!！]{2,}|[?？]{2,}", prompt):
        return "frustration", "重复感叹/问号"

    return None


def _emit_wake(session_id: str, trigger: str, reason: str, failure_count: int) -> None:
    """按 asyncRewake 契约输出 stderr 并 exit 2 唤醒 Claude。"""
    print(wake_message(session_id, trigger, reason, failure_count), file=sys.stderr)
    sys.exit(2)


def _emit_fast_hint(trigger: str, reason: str) -> None:
    """--fast 同步模式：systemMessage 给用户 + additionalContext 给 Claude。"""
    print(json.dumps({
        "systemMessage": user_hint(trigger, reason),
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": claude_context(trigger, reason),
        },
    }, ensure_ascii=False))
    sys.exit(0)


def _build_judge_input(
    prompt: str,
    failure_count: int,
    failure_samples: list[str],
    age_hours: float,
    line_count: int,
    failure_threshold: int,
) -> str:
    samples = "; ".join(failure_samples) if failure_samples else "无"
    return (
        "你是 ACE Doctor traceback 触发判定器。根据下列信号判断当前 Claude Code session "
        "是否值得建议用户上报日志（traceback）。\n"
        "值得建议：工具反复失败、用户明显沮丧或愤怒（含隐含表达）、工作流执行失败、"
        "会话异常漫长且进展不顺。\n"
        "不要建议：正常提问、普通开发请求、情绪平稳的常规讨论或批评。\n"
        '只输出一行 JSON，无其他文字：{"suggest":true|false,'
        '"trigger":"frustration|repeated_failures|workflow_failure|long_session|none",'
        '"reason":"不超过30字"}\n'
        "（愤怒归入 frustration；失败数达到阈值优先 repeated_failures）\n\n"
        "信号：\n"
        f"- 用户最新输入（截断）：{prompt[:_PROMPT_MAX_CHARS]}\n"
        f"- 本 session 工具失败数：{failure_count}（阈值 {failure_threshold}），"
        f"最近失败样例：{samples}\n"
        f"- 会话时长：{age_hours:.1f} 小时，transcript {line_count} 行\n"
    )


def _invoke_judge(judge_input: str, cfg: dict[str, Any]) -> dict[str, Any] | None:
    """调用小模型判定。返回 verdict dict 或 None（失败时静默）。"""
    override = os.environ.get("ACE_TRACEBACK_JUDGE_CMD")
    if override:
        cmd = shlex.split(override)
    else:
        claude_bin = shutil.which("claude") or str(Path.home() / ".local" / "bin" / "claude")
        cmd = [claude_bin, "-p"]
        if cfg["judge_model"]:
            cmd += ["--model", str(cfg["judge_model"])]

    env = os.environ.copy()
    env["ACE_TRACEBACK_JUDGE"] = "1"
    # 允许在 Claude Code 内嵌套调用，并避免 judge 子进程加载项目级 hooks
    env.pop("CLAUDECODE", None)
    env.pop("CLAUDE_CODE_ENTRYPOINT", None)
    env.pop("CLAUDE_PROJECT_DIR", None)

    try:
        proc = subprocess.run(
            cmd,
            input=judge_input,
            capture_output=True,
            text=True,
            timeout=float(cfg["judge_timeout"]),
            env=env,
            cwd=str(session_failures_file().parent),
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if proc.returncode != 0:
        return None
    return _parse_verdict(proc.stdout)


def _parse_verdict(output: str) -> dict[str, Any] | None:
    """从模型输出中提取第一个 JSON 对象。"""
    match = re.search(r"\{.*?\}", output, re.DOTALL)
    if not match:
        return None
    try:
        verdict = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
    return verdict if isinstance(verdict, dict) else None


def main() -> None:
    fast_mode = "--fast" in sys.argv[1:]

    # 递归防护：judge 子进程内不再判定
    if os.environ.get("ACE_TRACEBACK_JUDGE"):
        sys.exit(0)

    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    session_id = data.get("session_id") or ""
    prompt = (data.get("prompt") or "").strip()
    transcript_path = data.get("transcript_path") or ""
    if not session_id or not prompt:
        sys.exit(0)

    cfg = _get_config()
    session_state = read_session_state(session_id)

    # 所有 trigger 都提示过 → 不再判定
    if _VALID_TRIGGERS.issubset(session_state.keys()):
        sys.exit(0)

    failure_count, failure_samples = _collect_failures(session_id)
    age_hours, line_count = _transcript_stats(transcript_path, session_id)

    # 1) --fast（同步 hook）独占快速关键词/客观信号短路：命中直接触发，不调 LLM，
    #    systemMessage 直接展示给用户。async hook **不做**短路——两条 hook 并行启动，
    #    async 里短路会与 --fast 竞态导致双重提示（headless 下 exit 2 还会拦截 prompt）。
    if fast_mode:
        shortcut = _keyword_shortcut(prompt, failure_count, line_count, age_hours, cfg)
        if shortcut:
            trigger, reason = shortcut
            if trigger in session_state:
                sys.exit(0)
            record_session_key(session_id, JUDGED_AT_KEY)
            record_session_key(session_id, trigger)
            _emit_fast_hint(trigger, reason)
        # 未命中即静默退出，语义判定交给 async hook
        sys.exit(0)

    # 2) async：LLM 语义判定。
    # headless（claude -p / SDK，CLAUDE_CODE_ENTRYPOINT=sdk-*）下 asyncRewake 不生效，
    # hook 同步运行且 exit 2 会**拦截** prompt；且没有可唤醒的交互用户 → 直接退出。
    entrypoint = os.environ.get("CLAUDE_CODE_ENTRYPOINT", "")
    if entrypoint.startswith("sdk"):
        sys.exit(0)

    # 冷却期内不调 LLM
    if within_cooldown(session_state, int(cfg["judge_cooldown_seconds"])):
        sys.exit(0)

    judge_input = _build_judge_input(
        prompt, failure_count, failure_samples, age_hours, line_count,
        int(cfg["failure_threshold"]),
    )

    # 判定前重读状态：--fast 可能刚在毫秒级窗口内命中并记录（并行竞态）
    if within_cooldown(read_session_state(session_id), int(cfg["judge_cooldown_seconds"])):
        sys.exit(0)

    # 先记录判定时间戳：无论结果如何都进入冷却，避免连续 prompt 连续调 LLM
    record_session_key(session_id, JUDGED_AT_KEY)

    verdict = _invoke_judge(judge_input, cfg)
    if not verdict or not verdict.get("suggest"):
        sys.exit(0)

    trigger = str(verdict.get("trigger") or "")
    if trigger not in _VALID_TRIGGERS:
        sys.exit(0)
    # LLM 判定期间 --fast hook 可能已经提示过 → 重新读取去重
    if trigger in read_session_state(session_id):
        sys.exit(0)

    record_session_key(session_id, trigger)
    reason = str(verdict.get("reason") or "")[:60]

    # asyncRewake 契约：本 hook 以 async 方式后台运行，exit 2 时 stderr 会作为
    # system reminder 唤醒 Claude（stdout 不会被注入，勿用 systemMessage 协议）
    _emit_wake(session_id, trigger, reason, failure_count)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"[ACE Doctor] detect-frustration error (non-blocking): {e}", file=sys.stderr)
        sys.exit(0)
