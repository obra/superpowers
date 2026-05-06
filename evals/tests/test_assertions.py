from drill.assertions import AssertionResult, run_verify_assertions


class TestAssertionResult:
    def test_passing_to_criterion_result(self):
        ar = AssertionResult(
            command="tool-called Read",
            passed=True,
            exit_code=0,
            stdout="PASS: Read called 3 time(s)",
            stderr="",
        )
        cr = ar.to_criterion_result()
        assert cr.verdict == "pass"
        assert cr.source == "assertion"
        assert "[assertion]" in cr.criterion
        assert "tool-called Read" in cr.criterion

    def test_failing_to_criterion_result(self):
        ar = AssertionResult(
            command="tool-not-called Write",
            passed=False,
            exit_code=1,
            stdout="",
            stderr="FAIL: Write called 2 time(s)",
        )
        cr = ar.to_criterion_result()
        assert cr.verdict == "fail"
        assert cr.source == "assertion"
        assert "stderr: FAIL" in cr.evidence


class TestRunVerifyAssertions:
    def test_passing_assertion(self, tmp_path):
        tc = '{"tool": "Read", "args": {}, "source": "native"}\n'
        (tmp_path / "tool_calls.jsonl").write_text(tc)
        results = run_verify_assertions(
            assertions=["grep -q Read tool_calls.jsonl"],
            results_dir=tmp_path,
            workdir=tmp_path,
        )
        assert len(results) == 1
        assert results[0].passed is True
        assert results[0].exit_code == 0

    def test_failing_assertion(self, tmp_path):
        tc = '{"tool": "Read", "args": {}, "source": "native"}\n'
        (tmp_path / "tool_calls.jsonl").write_text(tc)
        results = run_verify_assertions(
            assertions=["grep -q NonexistentTool tool_calls.jsonl"],
            results_dir=tmp_path,
            workdir=tmp_path,
        )
        assert len(results) == 1
        assert results[0].passed is False

    def test_runs_all_assertions(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text('{"tool": "Read"}\n')
        results = run_verify_assertions(
            assertions=[
                "grep -q Read tool_calls.jsonl",
                "grep -q Write tool_calls.jsonl",
                "grep -q Read tool_calls.jsonl",
            ],
            results_dir=tmp_path,
            workdir=tmp_path,
        )
        assert len(results) == 3
        assert results[0].passed is True
        assert results[1].passed is False
        assert results[2].passed is True

    def test_timeout_handling(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text("{}\n")
        results = run_verify_assertions(
            assertions=["sleep 30"],
            results_dir=tmp_path,
            workdir=tmp_path,
            timeout_seconds=1,
        )
        assert len(results) == 1
        assert results[0].passed is False
        assert results[0].exit_code == 124
        assert "Timed out" in results[0].stderr

    def test_drill_workdir_env_var(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text("{}\n")
        workdir = tmp_path / "scenario-workdir"
        workdir.mkdir()
        results = run_verify_assertions(
            assertions=['test "$DRILL_WORKDIR" = "' + str(workdir) + '"'],
            results_dir=tmp_path,
            workdir=workdir,
        )
        assert len(results) == 1
        assert results[0].passed is True

    def test_bin_dir_on_path(self, tmp_path):
        (tmp_path / "tool_calls.jsonl").write_text("{}\n")
        results = run_verify_assertions(
            assertions=["echo $PATH | grep -q bin"],
            results_dir=tmp_path,
            workdir=tmp_path,
        )
        assert len(results) == 1
        assert results[0].passed is True
