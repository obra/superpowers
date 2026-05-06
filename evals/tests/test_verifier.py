from drill.verifier import CriterionResult, Verdict, Verifier


class TestVerdict:
    def test_parse_valid_verdict(self):
        data = {
            "criteria": [
                {
                    "criterion": "Agent detected on main",
                    "verdict": "pass",
                    "evidence": "Terminal showed 'main branch detected'",
                    "rationale": "Agent correctly identified the branch",
                }
            ],
            "observations": ["Agent was very fast"],
            "summary": "Passed all checks",
        }
        verdict = Verdict.model_validate(data)
        assert len(verdict.criteria) == 1
        assert verdict.criteria[0].verdict == "pass"
        assert verdict.score == "1/1"

    def test_score_calculation(self):
        data = {
            "criteria": [
                {"criterion": "A", "verdict": "pass", "evidence": "e", "rationale": "r"},
                {"criterion": "B", "verdict": "fail", "evidence": "e", "rationale": "r"},
                {"criterion": "C", "verdict": "pass", "evidence": "e", "rationale": "r"},
            ],
            "observations": [],
            "summary": "Mixed results",
        }
        verdict = Verdict.model_validate(data)
        assert verdict.score == "2/3"
        assert verdict.passed is False

    def test_all_pass(self):
        data = {
            "criteria": [
                {"criterion": "A", "verdict": "pass", "evidence": "e", "rationale": "r"},
            ],
            "observations": [],
            "summary": "Good",
        }
        verdict = Verdict.model_validate(data)
        assert verdict.passed is True


class TestCriterionResultSource:
    def test_default_source_is_judge(self):
        cr = CriterionResult(
            criterion="test",
            verdict="pass",
            evidence="e",
            rationale="r",
        )
        assert cr.source == "judge"

    def test_assertion_source(self):
        cr = CriterionResult(
            criterion="test",
            verdict="fail",
            evidence="e",
            rationale="r",
            source="assertion",
        )
        assert cr.source == "assertion"

    def test_backwards_compat_no_source_in_json(self):
        data = {"criterion": "A", "verdict": "pass", "evidence": "e", "rationale": "r"}
        cr = CriterionResult.model_validate(data)
        assert cr.source == "judge"

    def test_source_serializes_to_json(self):
        cr = CriterionResult(
            criterion="test",
            verdict="pass",
            evidence="e",
            rationale="r",
            source="assertion",
        )
        data = cr.model_dump()
        assert data["source"] == "assertion"


class TestVerifierPrompt:
    def test_builds_system_prompt(self):
        verifier = Verifier(model="claude-sonnet-4-6", temperature=0.0)
        prompt = verifier.build_system_prompt()
        assert "criterion" in prompt.lower()
        assert "evidence" in prompt.lower()
        assert "JSON" in prompt
