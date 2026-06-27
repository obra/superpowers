import json
import sys
from pathlib import Path

def assert_equal(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected!r}, got {actual!r}")

def assert_present(text, needle, filename):
    if needle not in text:
        raise AssertionError(f"missing {needle!r} in {filename}")

def main():
    repo_root = Path(__file__).resolve().parents[2]
    manifest_path = repo_root / "qwen-extension.json"
    qwen_md_path = repo_root / "QWEN.md"

    if not manifest_path.exists():
        raise FileNotFoundError(f"Manifest not found at {manifest_path}")
    if not qwen_md_path.exists():
        raise FileNotFoundError(f"QWEN.md not found at {qwen_md_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    qwen_md = qwen_md_path.read_text(encoding="utf-8")

    assert_equal(manifest.get("name"), "superpowers", "plugin name")
    assert_equal(manifest.get("skills"), "./skills/", "skills path")
    assert_equal(manifest.get("contextFileName"), "QWEN.md", "contextFileName")

    # Verify QWEN.md contains the correct native @-includes to load bootstrap and mapping
    assert_present(qwen_md, "@./skills/using-superpowers/SKILL.md", qwen_md_path.name)
    assert_present(qwen_md, "@./skills/using-superpowers/references/qwen-tools.md", qwen_md_path.name)

    # Read and verify tool mappings in qwen-tools.md
    qwen_tools_path = repo_root / "skills" / "using-superpowers" / "references" / "qwen-tools.md"
    if not qwen_tools_path.exists():
        raise FileNotFoundError(f"qwen-tools.md not found at {qwen_tools_path}")
    
    qwen_tools = qwen_tools_path.read_text(encoding="utf-8")

    for token in [
        "read_file",
        "write_file",
        "edit",
        "run_shell_command",
        "grep_search",
        "glob",
        "todo_write",
        "agent",
        "skill",
        "ask_user_question",
        "list_directory",
        "read_many_files",
        "web_fetch",
    ]:
        assert_present(qwen_tools, token, qwen_tools_path.name)

    version_config = json.loads(
        (repo_root / ".version-bump.json").read_text(encoding="utf-8")
    )
    version_entries = version_config.get("files")
    if not isinstance(version_entries, list):
        raise AssertionError(".version-bump.json must contain files list")

    if not any(
        entry.get("path") == "qwen-extension.json" and entry.get("field") == "version"
        for entry in version_entries
        if isinstance(entry, dict)
    ):
        raise AssertionError(
            ".version-bump.json must update qwen-extension.json version"
        )

    print("Qwen plugin manifest, QWEN.md, and qwen-tools.md look good")

if __name__ == "__main__":
    main()
