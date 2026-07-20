"""Behavioral documentation contracts for the user-facing traceback workflow."""

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
SKILL = REPO_ROOT / "skills/ace-traceback/SKILL.md"
COMMAND = REPO_ROOT / "commands/traceback.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_public_entrypoint_is_unified_for_all_runtimes() -> None:
    skill = _read(SKILL)
    command = _read(COMMAND)

    assert "# /ace-traceback" in command
    assert "## Usage\n\n```\n/ace-traceback\n```" in command
    assert "Claude Code、Cursor 和 Codex App Local 统一由用户调用 `/ace-traceback`" in command
    assert "The user explicitly runs `/ace-traceback` in Claude Code, Cursor, or Codex App Local." in skill
    assert "/ace:traceback" not in skill
    assert "/ace:traceback" not in command


def test_skill_orders_preview_confirmation_and_pinned_upload() -> None:
    skill = _read(SKILL)

    preview = skill.index("3. **Preview the bundle**")
    confirm = skill.index("4. **Confirm upload**")
    upload = skill.index("5. **Upload**")
    assert preview < confirm < upload
    assert 'Ask for explicit confirmation: "确认上传这份脱敏报告？"' in skill

    assert "ace traceback --cursor-current --dry-run --json" in skill
    assert (
        "ace traceback --cursor-current --expected-session-id "
        "<shell-quoted-preview-session-id> --yes --json"
    ) in skill
    assert "ace traceback --codex-current --dry-run --json" in skill
    assert (
        "ace traceback --codex-current --expected-session-id "
        "<shell-quoted-preview-session-id> --yes --json"
    ) in skill
    assert (
        "Verify the upload `session_id`, `source`, and, when present, `runtime` "
        "match the preview."
    ) in skill
    assert (
        "Run a new preview, show the new preview to the user, and obtain a new "
        "explicit confirmation"
    ) in skill


def test_skill_fails_closed_and_forbids_codex_fallbacks() -> None:
    skill = _read(SKILL)

    assert "If the current local session cannot be obtained and verified, **stop** and do not fall back." in skill
    assert "Do **not** use `--last`, `--session`, scan `$CODEX_HOME`" in skill
    assert "pick the newest file" in skill
    assert "do **not** fall back" in skill


def test_skill_forbids_cursor_fallbacks() -> None:
    skill = _read(SKILL)

    assert (
        "Do **not** use `--last`, `--session`, scan transcript directories, "
        "or pick the newest file."
    ) in skill
    assert (
        "Do **not** fall back to `--last`, scan for the latest transcript, "
        "or auto-guess a session."
    ) in skill


def test_command_describes_full_codex_app_local_safety_flow() -> None:
    command = _read(COMMAND)

    assert "内部使用 `--codex-current`" in command
    assert "无需用户手动运行 `ace traceback`" in command
    assert "无法获得并验证当前本地会话时停止且不得回退" in command
    assert "展示预览，取得明确确认" in command
    assert "session id / source / runtime" in command
    assert "若当前会话变化，重新预览并重新确认" in command
    assert "不得使用 `--last`、扫描 transcript 或回退到最近会话" in command


def test_docs_omit_other_codex_forms_and_platform_limitations() -> None:
    skill = _read(SKILL)
    command = _read(COMMAND)

    for document in (skill, command):
        for excluded in (
            "Codex CLI",
            "Cloud Agent",
            "实验性",
            "待验收",
            "POSIX",
            "O_NOFOLLOW",
            "O_DIRECTORY",
            "dir_fd",
            "Windows Git Bash",
        ):
            assert excluded not in document
