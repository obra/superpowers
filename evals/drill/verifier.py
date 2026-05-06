"""Verifier LLM: evaluates agent session against criteria."""

from __future__ import annotations

from pathlib import Path

import anthropic
from pydantic import BaseModel


class CriterionResult(BaseModel):
    criterion: str
    verdict: str
    evidence: str
    rationale: str
    source: str = "judge"


class Verdict(BaseModel):
    criteria: list[CriterionResult]
    observations: list[str]
    summary: str

    @property
    def score(self) -> str:
        passed = sum(1 for c in self.criteria if c.verdict == "pass")
        return f"{passed}/{len(self.criteria)}"

    @property
    def passed(self) -> bool:
        return all(c.verdict == "pass" for c in self.criteria)


class Verifier:
    MAX_RETRIES = 3

    def __init__(self, model: str = "claude-sonnet-4-6", temperature: float = 0.0) -> None:
        self.model = model
        self.temperature = temperature
        self._client: anthropic.Anthropic = anthropic.Anthropic()

    def build_system_prompt(self) -> str:
        template_path = Path(__file__).parent.parent / "prompts" / "verifier.md"
        return template_path.read_text()

    def verify(
        self,
        session_log: str,
        filesystem_json: str,
        tool_calls_jsonl: str,
        criteria: list[str],
    ) -> Verdict:
        system = self.build_system_prompt()
        user_content = (
            "## Terminal Session Log\n\n"
            f"```\n{session_log}\n```\n\n"
            "## Filesystem State\n\n"
            f"```json\n{filesystem_json}\n```\n\n"
            "## Tool Call Log\n\n"
            f"```jsonl\n{tool_calls_jsonl}\n```\n\n"
            "## Criteria to Evaluate\n\n" + "\n".join(f"- {c}" for c in criteria)
        )
        for attempt in range(self.MAX_RETRIES):
            response = self._client.messages.create(
                model=self.model,
                max_tokens=4096,
                temperature=self.temperature,
                system=system,
                messages=[{"role": "user", "content": user_content}],
            )
            text = response.content[0].text  # ty: ignore[unresolved-attribute]
            json_str = _extract_json(text)
            try:
                return Verdict.model_validate_json(json_str)
            except Exception:
                if attempt == self.MAX_RETRIES - 1:
                    raise
                continue
        raise RuntimeError("Verifier failed to return valid JSON")


def _extract_json(text: str) -> str:
    if "```json" in text:
        start = text.index("```json") + 7
        end = text.index("```", start)
        return text[start:end].strip()
    if "```" in text:
        start = text.index("```") + 3
        end = text.index("```", start)
        return text[start:end].strip()
    start = text.index("{")
    end = text.rindex("}") + 1
    return text[start:end]
