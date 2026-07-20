"""Behavioral documentation contracts for the user-facing traceback workflow."""

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
SKILL = REPO_ROOT / "skills/ace-traceback/SKILL.md"
COMMAND = REPO_ROOT / "commands/traceback.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_codex_traceback_scope_and_entrypoint_contract() -> None:
    skill = _read(SKILL)
    command = _read(COMMAND)

    assert "In Codex App Local, the user explicitly runs `/ace-traceback`." in skill
    assert "在 Codex App Local 中由用户调用 `/ace-traceback`" in command
    assert "Codex CLI (required path)" not in skill
    assert "Codex CLI 使用" not in command


def test_skill_orders_preview_confirmation_and_pinned_upload() -> None:
    skill = _read(SKILL)

    preview = skill.index("3. **Preview the bundle**")
    confirm = skill.index("4. **Confirm upload**")
    upload = skill.index("5. **Upload**")
    assert preview < confirm < upload
    assert 'Ask for explicit confirmation: "确认上传这份脱敏报告？"' in skill

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


def test_skill_stops_cloud_and_forbids_codex_fallbacks() -> None:
    skill = _read(SKILL)

    assert (
        "**Codex Cloud Agent:** stop before preview and explain that it is not "
        "supported."
    ) in skill
    assert "Do **not** use `--last`, `--session`, scan `$CODEX_HOME`" in skill
    assert "pick the newest file" in skill
    assert "do **not** fall back" in skill


def test_command_describes_full_codex_app_local_safety_flow() -> None:
    command = _read(COMMAND)

    assert "内部使用 `--codex-current`" in command
    assert "无需用户手动运行 `ace traceback`" in command
    assert "在预览前停止" in command
    assert "展示预览，取得明确确认" in command
    assert "session id / source / runtime" in command
    assert "若当前会话变化，重新预览并重新确认" in command
    assert "不得使用 `--last`、扫描 transcript 或回退到最近会话" in command


def test_codex_app_local_docs_are_explicitly_experimental() -> None:
    skill = _read(SKILL)
    command = _read(COMMAND)

    for document in (skill, command):
        assert "实验性" in document
        assert "契约测试通过" in document
        assert "真实 Codex App Local 环境待验收" in document
        assert "Codex Cloud Agent" in document


def test_skill_requires_posix_file_apis_for_codex_app_local() -> None:
    skill = _read(SKILL)

    assert "POSIX file APIs" in skill
    assert "`O_NOFOLLOW`, `O_DIRECTORY`, and `dir_fd`" in skill
    assert "Windows Git Bash" in skill
    assert "stop" in skill
