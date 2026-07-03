#!/usr/bin/env python3
"""Auto-test hook - 检测 ~/.ace/store/ 变动并自动运行相关测试

触发时机：PostToolUse (Edit/Write/Bash)
功能：当 node/device/workflow 被修改后，自动运行对应的测试
"""

import json
import os
import subprocess
import sys
from pathlib import Path


def get_store_dir():
    """获取 ACE store 目录"""
    return Path.home() / ".ace" / "store"


def detect_changed_entities(tool_name: str, result: dict) -> list:
    """从 tool 结果中检测修改的 entity

    Returns:
        List of (entity_type, entity_id) tuples
    """
    store_dir = get_store_dir()
    changed = set()

    # 获取修改的文件路径
    file_paths = []

    if tool_name in ("Edit", "Write"):
        # 从 result 中提取 file_path
        if "file_path" in result:
            file_paths.append(result["file_path"])
    elif tool_name == "Bash":
        # Bash 命令可能修改文件，通过 stdout/stderr 很难确定
        # 这里可以检查常见的修改命令，但暂时跳过
        pass

    for path_str in file_paths:
        path = Path(path_str).resolve()

        # 检查是否在 store 目录下
        try:
            rel_path = path.relative_to(store_dir)
        except ValueError:
            continue

        # 解析路径结构
        parts = rel_path.parts
        if len(parts) < 2:
            continue

        entity_type = parts[0]  # nodes, devices, workflows
        entity_id = None

        if entity_type == "nodes":
            # ~/.ace/store/nodes/{*|builtin}/{node_id}/...
            if len(parts) >= 3:
                entity_id = parts[2]
        elif entity_type == "devices":
            # ~/.ace/store/devices/{device_id}/...
            entity_id = parts[1]
        elif entity_type == "workflows":
            # ~/.ace/store/workflows/{workflow_id}/... 或 {workflow_id}.json
            wf_part = parts[1]
            if wf_part.endswith(".json"):
                entity_id = wf_part[:-5]  # 去掉 .json
            else:
                entity_id = wf_part

        if entity_id:
            # 标准化 entity_type
            if entity_type == "workflows":
                entity_type = "workflow"
            elif entity_type == "nodes":
                entity_type = "node"
            elif entity_type == "devices":
                entity_type = "device"

            changed.add((entity_type, entity_id))

    return list(changed)


def run_tests(entity_type: str, entity_id: str):
    """运行指定 entity 的测试"""
    # 使用 --no-deps 避免递归问题
    cmd = ["ace", "test", "run", entity_id, "--type", entity_type]

    # 设置环境变量防止递归
    env = os.environ.copy()
    env["ACE_AUTO_TEST_RUNNING"] = "1"

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
            env=env
        )
        return result.returncode == 0, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return False, "Test timeout"
    except FileNotFoundError:
        # ace 命令可能不存在
        return False, "ace command not found"
    except Exception as e:
        return False, str(e)


def main():
    # 防止递归：如果已经在运行测试中，跳过
    if os.environ.get("ACE_AUTO_TEST_RUNNING") == "1":
        return

    # 读取 stdin 的 JSON 数据
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        return

    tool_name = data.get("tool_name")
    result = data.get("result", {})

    # 只处理成功的修改操作
    if isinstance(result, dict) and not result.get("success", True):
        return

    # 检测修改的 entities
    changed_entities = detect_changed_entities(tool_name, result)

    if not changed_entities:
        return

    # 去重并运行测试
    seen = set()
    for entity_type, entity_id in changed_entities:
        key = (entity_type, entity_id)
        if key in seen:
            continue
        seen.add(key)

        # 检查是否有测试
        store_dir = get_store_dir()
        test_dir = None

        if entity_type == "node":
            for sub in ["atomic", "auto", "composite", "builtin"]:
                td = store_dir / "nodes" / sub / entity_id / "tests"
                if td.exists():
                    test_dir = td
                    break
        elif entity_type == "device":
            td = store_dir / "devices" / entity_id / "tests"
            if td.exists():
                test_dir = td
            else:
                # 检查 simulator 子目录
                td = store_dir / "devices" / entity_id / "simulator" / "tests"
                if td.exists():
                    test_dir = td
        elif entity_type == "workflow":
            td = store_dir / "workflows" / entity_id / "tests"
            if td.exists():
                test_dir = td

        if not test_dir:
            print(f"[auto-test] {entity_type}/{entity_id}: No tests found", file=sys.stderr)
            continue

        print(f"[auto-test] Running tests for {entity_type}: {entity_id} ...", file=sys.stderr)
        success, output = run_tests(entity_type, entity_id)

        if success:
            print(f"[auto-test] ✓ {entity_type}/{entity_id} passed", file=sys.stderr)
        else:
            print(f"[auto-test] ✗ {entity_type}/{entity_id} failed:", file=sys.stderr)
            print(output, file=sys.stderr)


if __name__ == "__main__":
    main()
