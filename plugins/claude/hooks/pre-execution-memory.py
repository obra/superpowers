#!/usr/bin/env python3
"""ACE Pre-Execution Memory Hook — 在工具调用前注入相关记忆.

由于 Claude Code 没有 PreToolUse 事件，这个 hook 通过以下方式工作:
1. PostToolUse (Bash) 检测到即将执行 workflow/node/device 操作
2. 立即加载相关 memories 并返回系统消息
3. 下一个 Claude turn 会看到 memory 上下文

这是一个"近实时"的 pre-execution 注入 —— 在命令执行后的瞬间，但在 Claude
规划下一步之前注入记忆。
"""
import json
import os
import re
import sys
from pathlib import Path

# Add project root to path for imports
ACE_ROOT = os.environ.get("CLAUDE_PROJECT_DIR", "")
if ACE_ROOT:
    sys.path.insert(0, ACE_ROOT)

# Import shared config
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _ace_config import log_hook_error

# Patterns that trigger memory injection
WORKFLOW_PATTERNS = [
    r"workflow[_\s]?(run|execute|start)",
    r"ace.*workflow.*run",
    r"python.*workflow.*execute",
]

NODE_PATTERNS = [
    r"node[_\s]?build",
    r"ace.*node.*create",
    r"build[_\s]?node",
]

DEVICE_PATTERNS = [
    r"device[_\s]?(call|exec|operate)",
    r"ace.*device",
    r"simulator.*run",
]


def _extract_workflow_id(command: str) -> str | None:
    """Extract workflow ID from command."""
    # Match: workflow_run workflow_id, workflow run workflow_id, etc.
    patterns = [
        r"workflow[_\s]?run[_\s]+([\w_-]+)",
        r"workflow[_\s]?execute[_\s]+([\w_-]+)",
        r"ace[_\s]+workflow[_\s]+run[_\s]+([\w_-]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, command, re.IGNORECASE)
        if match:
            return match.group(1)
    return None


def _extract_device_id(command: str) -> str | None:
    """Extract device ID from command."""
    # Match common device patterns
    patterns = [
        r"device[_\s]+(?:id)?[_\s:]+([\w/_-]+)",  # device id: xxx or device: xxx
        r"device[_\s]+call[_\s]+([\w/_-]+)",  # device_call xxx
        r"--device[_\s]+([\w/_-]+)",  # --device xxx
        r"-d[_\s]+([\w/_-]+)",  # -d xxx
    ]
    for pattern in patterns:
        match = re.search(pattern, command, re.IGNORECASE)
        if match:
            return match.group(1)
    return None


def _extract_node_info(command: str) -> tuple[str | None, str | None]:
    """Extract node ID and device from command."""
    node_id = None
    device_id = None

    # Node ID patterns
    node_patterns = [
        r"node[_\s]?build[_\s]+([\w_-]+)",
        r"build[_\s]?node[_\s]+([\w_-]+)",
        r"--node[_\s]+([\w_-]+)",
    ]
    for pattern in node_patterns:
        match = re.search(pattern, command, re.IGNORECASE)
        if match:
            node_id = match.group(1)
            break

    # Device pattern
    device_match = re.search(r"--device[_\s]+([\w/_-]+)", command, re.IGNORECASE)
    if device_match:
        device_id = device_match.group(1)

    return node_id, device_id


def _load_memories_for_workflow(workflow_id: str) -> dict:
    """Load memories and insights for a workflow."""
    try:
        from src.core.memory.manager import MemoryManager
        from src.core.memory.insight_loader import InsightLoader

        manager = MemoryManager()
        insights = InsightLoader()

        # Get workflow memories
        workflow_memories = manager.list("workflow", workflow_id)
        # Get workflow insights (from markdown)
        workflow_insights = insights.load_for_entity(workflow_id)

        # Try to get device from workflow definition
        device_id = None
        try:
            store_dir = Path.home() / ".ace" / "store"
            workflow_file = store_dir / "workflows" / f"{workflow_id}.json"
            if workflow_file.exists():
                wf_data = json.loads(workflow_file.read_text())
                device_id = wf_data.get("device")
        except Exception:
            pass

        device_memories = []
        device_insights = []
        if device_id:
            device_memories = manager.list("device", device_id)
            device_insights = insights.load_for_entity(device_id)

        all_memories = workflow_memories + workflow_insights + device_memories + device_insights

        # Format warnings
        warnings = []
        for m in all_memories:
            if m.type.value == "pitfall":
                warning = f"⚠️ {m.title}"
                if m.symptoms:
                    warning += f" (症状: {', '.join(m.symptoms[:2])})"
                warnings.append(warning)

        return {
            "workflow_id": workflow_id,
            "device_id": device_id,
            "memory_count": len(all_memories),
            "insight_count": len(workflow_insights) + len(device_insights),
            "pitfall_count": len([m for m in all_memories if m.type.value == "pitfall"]),
            "warnings": warnings,
        }
    except Exception as e:
        return {"error": str(e)}


def _load_memories_for_device(device_id: str, operation: str = "") -> dict:
    """Load memories and insights for a device."""
    try:
        from src.core.memory.manager import MemoryManager
        from src.core.memory.insight_loader import InsightLoader

        manager = MemoryManager()
        insights = InsightLoader()

        memories = manager.list("device", device_id)
        insight_memories = insights.load_for_entity(device_id)

        all_memories = memories + insight_memories

        # Filter by operation context if provided
        if operation:
            all_memories = [m for m in all_memories if operation.lower() in str(m.tags).lower()]

        warnings = []
        for m in all_memories:
            if m.type.value == "pitfall":
                warning = f"⚠️ {m.title}"
                if m.solution:
                    warning += f" | 解决: {m.solution[0][:50]}"
                warnings.append(warning)

        return {
            "device_id": device_id,
            "operation": operation,
            "memory_count": len(all_memories),
            "insight_count": len(insight_memories),
            "pitfall_count": len([m for m in all_memories if m.type.value == "pitfall"]),
            "warnings": warnings,
        }
    except Exception as e:
        return {"error": str(e)}


def _load_memories_for_node(device_id: str | None, node_id: str | None) -> dict:
    """Load memories and insights for node building."""
    try:
        from src.core.memory.manager import MemoryManager
        from src.core.memory.insight_loader import InsightLoader

        manager = MemoryManager()
        insights = InsightLoader()

        device_memories = []
        device_insights = []
        if device_id:
            device_memories = manager.list("device", device_id)
            device_insights = insights.load_for_entity(device_id)

        node_memories = []
        node_insights = []
        if node_id:
            node_memories = manager.list("node", node_id)
            node_insights = insights.load_for_entity(node_id)

        all_memories = device_memories + device_insights + node_memories + node_insights

        warnings = []
        for m in all_memories:
            if m.type.value == "pitfall":
                warning = f"⚠️ {m.title}"
                if m.symptoms:
                    warning += f" (症状: {', '.join(m.symptoms[:2])})"
                warnings.append(warning)

        return {
            "device_id": device_id,
            "node_id": node_id,
            "memory_count": len(all_memories),
            "insight_count": len(device_insights) + len(node_insights),
            "pitfall_count": len([m for m in all_memories if m.type.value == "pitfall"]),
            "warnings": warnings,
        }
    except Exception as e:
        return {"error": str(e)}


def should_inject_memory(command: str) -> tuple[bool, str, dict]:
    """Check if we should inject memory for this command.

    Returns: (should_inject, entity_type, context)
    """
    cmd_lower = command.lower()

    # Check workflow patterns
    for pattern in WORKFLOW_PATTERNS:
        if re.search(pattern, cmd_lower):
            workflow_id = _extract_workflow_id(command)
            if workflow_id:
                return True, "workflow", {"workflow_id": workflow_id}

    # Check node patterns
    for pattern in NODE_PATTERNS:
        if re.search(pattern, cmd_lower):
            node_id, device_id = _extract_node_info(command)
            return True, "node", {"node_id": node_id, "device_id": device_id}

    # Check device patterns
    for pattern in DEVICE_PATTERNS:
        if re.search(pattern, cmd_lower):
            device_id = _extract_device_id(command)
            if device_id:
                return True, "device", {"device_id": device_id}

    return False, "", {}


def format_memory_message(entity_type: str, context: dict, memory_data: dict) -> str:
    """Format memory data into a message for Claude."""
    warnings = memory_data.get("warnings", [])
    memory_count = memory_data.get("memory_count", 0)
    insight_count = memory_data.get("insight_count", 0)

    if not warnings and memory_count == 0:
        return ""  # No memories to show

    lines = [f"[ACE] Pre-execution Memory Check for {entity_type}"]

    if entity_type == "workflow":
        lines.append(f"Workflow: {context.get('workflow_id')}")
        if memory_data.get("device_id"):
            lines.append(f"Device: {memory_data['device_id']}")
    elif entity_type == "node":
        if context.get("device_id"):
            lines.append(f"Device: {context['device_id']}")
        if context.get("node_id"):
            lines.append(f"Node: {context['node_id']}")
    elif entity_type == "device":
        lines.append(f"Device: {context.get('device_id')}")

    # Show counts
    count_parts = [f"{memory_count} sources"]
    if insight_count > 0:
        count_parts.append(f"{insight_count} from insights")
    lines.append(f"Loaded: {', '.join(count_parts)}")

    if warnings:
        lines.append("\n⚠️ 历史问题警告:")
        for w in warnings[:5]:  # Limit to 5 warnings
            lines.append(f"  • {w}")

    return "\n".join(lines)


def main():
    """Main entry point - reads PostToolUse data from stdin."""
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})
    tool_result = data.get("tool_result", {})

    # Only process successful Bash commands
    if tool_name != "Bash":
        sys.exit(0)

    command = tool_input.get("command", "")
    exit_code = tool_result.get("exit_code", -1)

    # Only process successful commands (exit 0)
    if exit_code != 0:
        sys.exit(0)

    # Check if this command triggers memory injection
    should_inject, entity_type, context = should_inject_memory(command)

    if not should_inject:
        sys.exit(0)

    # Load memories based on entity type
    if entity_type == "workflow":
        memory_data = _load_memories_for_workflow(context.get("workflow_id", ""))
    elif entity_type == "node":
        memory_data = _load_memories_for_node(
            context.get("device_id"), context.get("node_id")
        )
    elif entity_type == "device":
        memory_data = _load_memories_for_device(context.get("device_id", ""))
    else:
        sys.exit(0)

    # Format and output message
    message = format_memory_message(entity_type, context, memory_data)

    if message:
        print(json.dumps({"systemMessage": message}))

    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log_hook_error("pre-execution-memory", e)
        sys.exit(0)
