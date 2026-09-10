import io
import tempfile
from contextlib import redirect_stderr, redirect_stdout
import unittest
from pathlib import Path
from unittest.mock import patch

import fixtures


SCRIPT = (
    "This is smevals studio. Every eval on the shelf is a folder of tasks and "
    "graders."
)


class NarrationDriftRegression(unittest.TestCase):
    def drift(self, expected_exit: int, heard: str) -> None:
        missing = fixtures.missing_executables("uv")
        if missing:
            self.skipTest(
                f"required executable(s) not on PATH: {', '.join(missing)}"
            )
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            script_path = work / "script.txt"
            heard_path = work / "heard.txt"
            script_path.write_text(SCRIPT, encoding="utf-8")
            heard_path.write_text(heard, encoding="utf-8")
            result = fixtures.run_tool(
                "narrate",
                ["--drift-check", str(script_path), str(heard_path)],
                cwd=work,
            )
            self.assertEqual(
                result.returncode, expected_exit, fixtures.output_text(result)
            )

    def test_mispronounced_jargon_passes(self):
        self.drift(
            0,
            "This is Mevil studio. Every Yvel on the shelf is a folder of tasks "
            "and graders.",
        )

    def test_exact_transcript_passes(self):
        self.drift(0, SCRIPT)

    def test_dropped_clause_fails(self):
        self.drift(1, "This is smevals studio.")

    def test_invented_preamble_fails(self):
        self.drift(
            1,
            "Sure, here it is, happy to help with that. This is smevals studio. "
            "Every eval on the shelf is a folder of tasks and graders.",
        )

    def test_empty_clip_fails(self):
        self.drift(1, "you")

    def test_cached_audio_requires_requested_verification(self):
        import json
        import sys
        module = fixtures.load_script("narrate")
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            output = work / "voice"
            output.mkdir()
            (output / "clip.wav").write_bytes(b"cached audio fixture")
            (output / "manifest.json").write_text(json.dumps([
                {"id": "clip", "text": "Read this sentence.", "wav": "clip.wav",
                 "duration": 1.0}
            ]), encoding="utf-8")
            scenes = work / "scenes.yaml"
            scenes.write_text(json.dumps({"scenes": [
                {"id": "clip", "narration": "Read this sentence."}
            ]}), encoding="utf-8")
            argv = ["narrate", str(scenes), str(output),
                    "--engine", "piper", "--verify", "on"]
            stdout, stderr = io.StringIO(), io.StringIO()
            with patch.object(sys, "argv", argv), \
                 patch.object(module, "openai_key", return_value=None), \
                 patch.object(module, "duration", return_value=1.0), \
                 patch.object(module, "transcribe_local", return_value=None), \
                 redirect_stdout(stdout), redirect_stderr(stderr):
                self.assertNotEqual(module.main(), 0)
            self.assertIn("clip: required verification unavailable", stderr.getvalue())
            self.assertIn("FAILED verbatim delivery: ['clip']", stderr.getvalue())

class TranscriptionProtocolRegression(unittest.TestCase):
    def test_owned_json_is_used_instead_of_library_stdout(self):
        import json
        import subprocess
        import sys
        import io
        module = fixtures.load_script("narrate")
        def child(argv, **kwargs):
            self.assertIn("--isolated", argv)
            self.assertIn("--no-project", argv)
            self.assertIn("--no-config", argv)
            self.assertEqual(argv[argv.index("--python") + 1], sys.executable)
            self.assertNotEqual(Path(kwargs["cwd"]), Path.cwd())
            Path(argv[-1]).write_text(json.dumps({"text": "Correct λ transcript"}), encoding="utf-8")
            return subprocess.CompletedProcess(argv, 0, "native library warning", "diagnostic")
        diagnostics = io.StringIO()
        with patch.object(module.subprocess, "run", side_effect=child), redirect_stderr(diagnostics):
            self.assertEqual(module.transcribe_local(Path("clip.wav")), "Correct λ transcript")
        self.assertIn("native library warning", diagnostics.getvalue())
        self.assertIn("diagnostic", diagnostics.getvalue())

    def test_failed_absent_and_malformed_child_results_are_unavailable(self):
        import subprocess
        module = fixtures.load_script("narrate")
        for payload, code in ((None, 0), ("garbage", 0), ('{"text": 7}', 0), ('{"text": ""}', 0), ('{"text": "words"}', 1)):
            with self.subTest(payload=payload, code=code):
                def child(argv, **kwargs):
                    if payload is not None and "--isolated" in argv:
                        Path(argv[-1]).write_text(payload, encoding="utf-8")
                    return subprocess.CompletedProcess(argv, code, "misleading stdout", "error")
                diagnostics = io.StringIO()
                with patch.object(module.subprocess, "run", side_effect=child), \
                     redirect_stderr(diagnostics):
                    self.assertIsNone(module.transcribe_local(Path("clip.wav")))
                self.assertIn("local ASR", diagnostics.getvalue())

    def test_fresh_and_off_then_on_clips_require_asr(self):
        import json
        import sys
        module = fixtures.load_script("narrate")
        for cached in (False, True):
            with self.subTest(cached=cached), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                scenes = root / "scenes.yaml"
                scenes.write_text(json.dumps({"scenes": [{"id": "clip", "narration": "Read this sentence."}]}), encoding="utf-8-sig")
                output = root / "voice"
                def synthesize(text, wav, voice):
                    wav.write_bytes(b"branch policy fixture")
                argv = ["narrate", str(scenes), str(output), "--engine", "piper", "--verify"]
                with patch.object(module, "openai_key", return_value=None), patch.object(module, "say_piper", side_effect=synthesize), patch.object(module, "duration", return_value=1.0), patch.object(module, "transcribe_local", return_value=None):
                    if cached:
                        with patch.object(sys, "argv", [*argv, "off"]), \
                             redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                            self.assertEqual(module.main(), 0)
                    stdout, stderr = io.StringIO(), io.StringIO()
                    with patch.object(sys, "argv", [*argv, "on"]), \
                         redirect_stdout(stdout), redirect_stderr(stderr):
                        self.assertNotEqual(module.main(), 0)
                    self.assertIn("clip: required verification unavailable", stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
