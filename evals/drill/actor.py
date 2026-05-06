"""Actor LLM: simulates a user driving an agent session."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import anthropic
from jinja2 import Template

ACTOR_TOOL: dict[str, Any] = {
    "name": "terminal_action",
    "description": "Send an action to the terminal session.",
    "input_schema": {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["type", "done", "stuck", "key"],
                "description": "The action to take.",
            },
            "text": {
                "type": "string",
                "description": "Text to type (only for 'type' action).",
            },
            "key": {
                "type": "string",
                "description": "Special key to send (only for 'key' action, e.g., 'ctrl-c').",
            },
        },
        "required": ["action"],
    },
}


@dataclass
class ActorAction:
    action: str
    text: str | None = None
    key: str | None = None

    @classmethod
    def from_tool_result(cls, data: dict[str, Any]) -> ActorAction:
        return cls(action=data["action"], text=data.get("text"), key=data.get("key"))


class Actor:
    def __init__(self, model: str = "claude-sonnet-4-6", temperature: float = 0.7) -> None:
        self.model = model
        self.temperature = temperature
        self.captures: list[str] = []
        self._system_prompt: str = ""
        self._client: anthropic.Anthropic = anthropic.Anthropic()

    def build_system_prompt(self, posture: str, intents: list[str]) -> str:
        template_path = Path(__file__).parent.parent / "prompts" / "actor.md"
        template = Template(template_path.read_text())
        self._system_prompt = template.render(posture=posture, intents=intents)
        return self._system_prompt

    def append_capture(self, terminal_output: str) -> None:
        self.captures.append(terminal_output)

    def build_messages(self) -> list[dict[str, str]]:
        return [{"role": "user", "content": capture} for capture in self.captures]

    def decide(self) -> ActorAction:
        response = self._client.messages.create(
            model=self.model,
            max_tokens=1024,
            temperature=self.temperature,
            system=self._system_prompt,
            tools=[ACTOR_TOOL],  # ty: ignore[invalid-argument-type]
            tool_choice={"type": "tool", "name": "terminal_action"},
            messages=self.build_messages(),  # ty: ignore[invalid-argument-type]
        )
        for block in response.content:
            if block.type == "tool_use":
                return ActorAction.from_tool_result(block.input)
        raise RuntimeError("Actor did not return a tool_use block")
