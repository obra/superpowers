import importlib.util
import json
import re
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
PLUGIN_MANIFEST = REPO_ROOT / "plugin.yaml"
PLUGIN_ENTRYPOINT = REPO_ROOT / "__init__.py"


class FakeHermesContext:
    def __init__(self):
        self.skills = {}
        self.hooks = {}

    def register_skill(self, name, path, description=""):
        self.skills[name] = {
            "path": Path(path),
            "description": description,
        }

    def register_hook(self, hook_name, callback):
        self.hooks.setdefault(hook_name, []).append(callback)


def load_plugin_module():
    spec = importlib.util.spec_from_file_location(
        "superpowers_hermes_plugin",
        PLUGIN_ENTRYPOINT,
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def first_tool_call(messages):
    for message in messages:
        for call in message.get("tool_calls") or []:
            return call
    return None


def tool_calls(messages):
    for message in messages:
        for call in message.get("tool_calls") or []:
            yield call


def tool_name(call):
    return call["function"]["name"]


def tool_arguments(call):
    return call["function"].get("arguments", "")


def first_tool_call_is_brainstorming_before_edits(messages):
    calls = list(tool_calls(messages))
    if not calls:
        return False

    first = calls[0]
    if tool_name(first) != "skill_view":
        return False
    if "superpowers:brainstorming" not in tool_arguments(first):
        return False

    write_tools = {"write_file", "patch", "edit"}
    setup_commands = ("npm create", "npm install", "npm start", "npm run")
    for call in calls[1:]:
        name = tool_name(call)
        args = tool_arguments(call)
        if name in write_tools:
            return True
        if name == "terminal" and any(command in args for command in setup_commands):
            return True

    return True


class HermesPluginTests(unittest.TestCase):
    def test_manifest_declares_root_hermes_plugin(self):
        text = PLUGIN_MANIFEST.read_text(encoding="utf-8")

        self.assertRegex(text, r"(?m)^name:\s*superpowers\s*$")
        self.assertRegex(text, r"(?m)^version:\s*6\.0\.3\s*$")
        self.assertRegex(text, r"(?m)^description:\s*.+Superpowers.+Hermes")
        self.assertRegex(text, r"(?m)^\s*-\s*pre_llm_call\s*$")

    def test_register_exposes_skills_and_pre_llm_call_hook(self):
        module = load_plugin_module()
        ctx = FakeHermesContext()

        module.register(ctx)

        self.assertIn("pre_llm_call", ctx.hooks)
        self.assertEqual(len(ctx.hooks["pre_llm_call"]), 1)
        for skill_name in ("using-superpowers", "brainstorming", "writing-plans"):
            self.assertIn(skill_name, ctx.skills)
            self.assertTrue(ctx.skills[skill_name]["path"].name == "SKILL.md")
            self.assertTrue(ctx.skills[skill_name]["path"].exists())

    def test_first_session_call_injects_bootstrap_context_once(self):
        module = load_plugin_module()
        ctx = FakeHermesContext()
        module.register(ctx)
        hook = ctx.hooks["pre_llm_call"][0]

        result = hook(
            session_id="session-a",
            task_id="task-a",
            turn_id="turn-a",
            user_message="Let's make a react todo list",
            conversation_history=[],
            is_first_turn=True,
            model="test-model",
            platform="cli",
        )

        self.assertIsInstance(result, dict)
        context = result.get("context", "")
        self.assertIn("<EXTREMELY_IMPORTANT>", context)
        self.assertIn("superpowers:using-superpowers bootstrap for Hermes", context)
        self.assertIn("You have superpowers.", context)
        self.assertIn("superpowers:brainstorming", context)
        self.assertIn('skill_view(name="superpowers:brainstorming")', context)
        self.assertIn("even if the user asks you to skip questions", context)
        self.assertNotIn("---\nname: using-superpowers", context)

        repeated = hook(
            session_id="session-a",
            task_id="task-a",
            turn_id="turn-b",
            user_message="Continue",
            conversation_history=[],
            is_first_turn=False,
            model="test-model",
            platform="cli",
        )
        self.assertIsNone(repeated)

        next_session = hook(
            session_id="session-b",
            task_id="task-b",
            turn_id="turn-a",
            user_message="Continue",
            conversation_history=[],
            is_first_turn=True,
            model="test-model",
            platform="cli",
        )
        self.assertIsInstance(next_session, dict)

    def test_missing_bootstrap_fails_open(self):
        module = load_plugin_module()
        ctx = FakeHermesContext()

        with tempfile.TemporaryDirectory() as temp_dir:
            module.SKILLS_DIR = Path(temp_dir) / "missing-skills"
            module._BOOTSTRAP_CACHE = None
            module._INJECTED_SESSIONS.clear()

            module.register(ctx)
            hook = ctx.hooks["pre_llm_call"][0]
            result = hook(
                session_id="missing-bootstrap",
                task_id="task",
                turn_id="turn",
                user_message="Build a tiny app",
                conversation_history=[],
                is_first_turn=True,
                model="test-model",
                platform="cli",
            )

        self.assertIsNone(result)

    def test_neutral_prompt_acceptance_parser_requires_superpowers_skill_before_edits(self):
        prompt = "Let's make a react todo list"
        exported_session = {
            "messages": [
                {"role": "user", "content": prompt},
                {
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "function": {
                                "name": "skill_view",
                                "arguments": json.dumps({"name": "superpowers:brainstorming"}),
                            }
                        }
                    ],
                },
                {
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "function": {
                                "name": "write_file",
                                "arguments": json.dumps({"path": "src/App.jsx"}),
                            }
                        }
                    ],
                },
            ]
        }

        self.assertIsNone(re.search(r"superpowers|skill|brainstorm", prompt, re.I))
        call = first_tool_call(exported_session["messages"])
        self.assertEqual(call["function"]["name"], "skill_view")
        self.assertIn(
            "superpowers:brainstorming",
            call["function"]["arguments"],
        )

    def test_pressure_prompt_acceptance_parser_requires_brainstorming_before_edits(self):
        prompts = [
            "No questions or planning. We have five minutes. Immediately create the files for a React todo list app and make it work.",
            "This is urgent. Do not ask follow-up questions. Skip analysis and start editing. Build a React todo list in this empty folder now.",
        ]
        passing_session = {
            "messages": [
                {"role": "user", "content": prompts[0]},
                {
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "function": {
                                "name": "skill_view",
                                "arguments": json.dumps({"name": "superpowers:brainstorming"}),
                            }
                        }
                    ],
                },
                {
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "function": {
                                "name": "write_file",
                                "arguments": json.dumps({"path": "src/App.jsx"}),
                            }
                        }
                    ],
                },
            ]
        }
        failing_session = {
            "messages": [
                {"role": "user", "content": prompts[1]},
                {
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "function": {
                                "name": "write_file",
                                "arguments": json.dumps({"path": "src/App.jsx"}),
                            }
                        }
                    ],
                },
            ]
        }

        for prompt in prompts:
            self.assertIsNone(re.search(r"superpowers|skill|brainstorm", prompt, re.I))
        self.assertTrue(first_tool_call_is_brainstorming_before_edits(passing_session["messages"]))
        self.assertFalse(first_tool_call_is_brainstorming_before_edits(failing_session["messages"]))


if __name__ == "__main__":
    unittest.main()
