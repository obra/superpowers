import io
import json
import sys
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
    def drift(self, expected_exit: int, heard: str, script: str = SCRIPT) -> None:
        missing = fixtures.missing_executables("uv")
        if missing:
            self.skipTest(
                f"required executable(s) not on PATH: {', '.join(missing)}"
            )
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            script_path = work / "script.txt"
            heard_path = work / "heard.txt"
            script_path.write_text(script, encoding="utf-8")
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

    def test_inserted_runs_fail_even_when_total_length_is_close(self):
        words = [f"word{i}" for i in range(50)]
        for position in (0, 25, 50):
            with self.subTest(position=position):
                heard = words[:position] + "Before we begin please listen".split() + words[position:]
                self.drift(1, " ".join(heard), " ".join(words))

    def test_expanded_replacement_counts_the_added_words(self):
        words = [f"word{i}" for i in range(50)]
        heard = words[:25] + "Before we begin please listen".split() + words[26:]
        self.drift(1, " ".join(heard), " ".join(words))

    def test_short_insertions_keep_the_existing_tolerance(self):
        words = [f"word{i}" for i in range(50)]
        self.drift(0, "Please listen closely " + " ".join(words), " ".join(words))

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
                 "duration": 1.0, "synthesis": {"engine": "piper",
                 "voice": module.PIPER_VOICE, "model": module.PIPER_VOICE}}
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
                 patch.object(module, "say_piper", side_effect=AssertionError("expected cached clip")), \
                 patch.object(module, "transcribe_local", return_value=None), \
                 redirect_stdout(stdout), redirect_stderr(stderr):
                self.assertNotEqual(module.main(), 0)
            self.assertIn("clip: required verification unavailable", stderr.getvalue())
            self.assertIn("FAILED verbatim delivery: ['clip']", stderr.getvalue())
            self.assertEqual(
                json.loads((output / "manifest.json").read_text(encoding="utf-8")),
                [],
            )
            self.assertEqual((output / "clip.wav").read_bytes(), b"cached audio fixture")

    def test_rejected_chat_audio_is_never_cached_but_accepted_audio_is(self):
        import json
        import sys
        module = fixtures.load_script("narrate")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            scenes = root / "scenes.yaml"
            scenes.write_text(json.dumps({"scenes": [
                {"id": "accepted", "narration": "Read this sentence exactly."},
                {"id": "rejected", "narration": "Keep this evidence out of the manifest."},
            ]}), encoding="utf-8")
            output = root / "voice"
            calls = []

            def synthesize(key, text, wav, voice):
                calls.append(text)
                wav.write_bytes(f"render {len(calls)}".encode())
                if text.startswith("Keep"):
                    return "Unrelated invented preamble with entirely different words here."
                return text

            argv = ["narrate", str(scenes), str(output), "--engine", "openai-chat",
                    "--verify", "off"]
            rejected_renders = []
            with patch.object(sys, "argv", argv), \
                 patch.object(module, "openai_key", return_value="test-key"), \
                 patch.object(module, "say_openai_chat", side_effect=synthesize), \
                 patch.object(module, "duration", return_value=1.0):
                for _ in range(2):
                    with redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                        self.assertEqual(module.main(), 1)
                    manifest = json.loads(
                        (output / "manifest.json").read_text(encoding="utf-8")
                    )
                    self.assertEqual([entry["id"] for entry in manifest], ["accepted"])
                    rejected_renders.append((output / "rejected.wav").read_bytes())

            self.assertEqual(calls.count("Read this sentence exactly."), 1)
            self.assertEqual(calls.count("Keep this evidence out of the manifest."), 4)
            self.assertNotEqual(rejected_renders[0], rejected_renders[1])

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


class NarrationCacheRegression(unittest.TestCase):
    def setUp(self):
        self.module = fixtures.load_script("narrate")
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.scenes = self.root / "scenes.yaml"
        self.text = "Read this sentence exactly."
        self.write_scenes(self.text)
        self.output = self.root / "voice"
        self.renders = []

        def synthesize(*args):
            text, wav, voice = args[-3:]
            self.renders.append((text, voice))
            wav.write_bytes(f"render {len(self.renders)}".encode())
            return text

        for name, options in (
            ("openai_key", {"return_value": "test-key"}),
            ("duration", {"return_value": 1.0}),
            ("transcribe_local", {"return_value": None}),
            ("say_piper", {"side_effect": synthesize}),
            ("say_openai", {"side_effect": synthesize}),
            ("say_openai_chat", {"side_effect": synthesize}),
        ):
            mocked = patch.object(self.module, name, **options)
            mocked.start()
            self.addCleanup(mocked.stop)

    def write_scenes(self, text):
        self.scenes.write_text(json.dumps({"scenes": [
            {"id": "clip", "narration": text}
        ]}), encoding="utf-8")

    def narrate(self, *options, verify="off", expected_exit=0):
        argv = ["narrate", str(self.scenes), str(self.output),
                "--verify", verify, *options]
        stdout, stderr = io.StringIO(), io.StringIO()
        with patch.object(sys, "argv", argv), \
             redirect_stdout(stdout), redirect_stderr(stderr):
            self.assertEqual(self.module.main(), expected_exit, stderr.getvalue())
        return json.loads((self.output / "manifest.json").read_text(encoding="utf-8"))

    def test_engine_and_voice_changes_rerender(self):
        for index, options in enumerate((
            ("--engine", "piper", "--voice", "voice-a"),
            ("--engine", "piper", "--voice", "voice-b"),
            ("--engine", "openai", "--voice", "voice-b"),
            ("--engine", "openai-chat", "--voice", "voice-b"),
        ), 1):
            with self.subTest(options=options):
                self.narrate(*options)
                self.assertEqual(len(self.renders), index)
                self.assertEqual((self.output / "clip.wav").read_bytes(),
                                 f"render {index}".encode())

    def test_cloud_model_changes_rerender(self):
        for engine, constant in (("openai", "OPENAI_TTS_MODEL"),
                                 ("openai-chat", "OPENAI_CHAT_MODEL")):
            with self.subTest(engine=engine):
                self.narrate("--engine", engine)
                count = len(self.renders)
                with patch.object(self.module, constant, "another-model"):
                    self.narrate("--engine", engine)
                self.assertEqual(len(self.renders), count + 1)

    def test_implicit_and_explicit_defaults_share_cache(self):
        for engine, voice in (("piper", self.module.PIPER_VOICE),
                              ("openai", "nova"), ("openai-chat", "nova")):
            with self.subTest(engine=engine):
                self.narrate("--engine", engine)
                count = len(self.renders)
                self.narrate("--engine", engine, "--voice", voice)
                self.assertEqual(len(self.renders), count)
        self.narrate("--engine", "openai")
        count = len(self.renders)
        self.narrate()
        self.assertEqual(len(self.renders), count)
        with patch.object(self.module, "openai_key", return_value=None):
            self.narrate()
        self.assertEqual(len(self.renders), count + 1)

    def test_cache_without_synthesis_settings_rerenders(self):
        manifest = self.narrate()
        manifest[0].pop("synthesis", None)
        (self.output / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
        self.narrate()
        self.assertEqual(len(self.renders), 2)

    def test_changed_text_force_and_missing_wav_rerender(self):
        self.narrate()
        self.write_scenes("Read a different sentence exactly.")
        manifest = self.narrate()
        self.assertEqual(manifest[0]["text"], "Read a different sentence exactly.")
        self.assertEqual(len(self.renders), 2)
        self.narrate("--force")
        self.assertEqual(len(self.renders), 3)
        (self.output / "clip.wav").unlink()
        self.narrate()
        self.assertEqual(len(self.renders), 4)

    def test_cached_clip_is_reverified_with_requested_asr_model(self):
        self.narrate()
        with patch.object(self.module, "transcribe_local", return_value=self.text) as asr:
            self.narrate("--asr-model", "small.en", verify="on")
        asr.assert_called_once_with(self.output / "clip.wav", "small.en")
        self.assertEqual(len(self.renders), 1)

    def test_unavailable_asr_respects_each_verification_mode(self):
        for engine in ("piper", "openai", "openai-chat"):
            for mode in ("auto", "on", "off"):
                with self.subTest(engine=engine, mode=mode):
                    self.module.transcribe_local.reset_mock()
                    manifest = self.narrate("--engine", engine, verify=mode,
                                            expected_exit=1 if mode == "on" else 0)
                    self.assertEqual(bool(manifest), mode != "on")
                    self.assertEqual(self.module.transcribe_local.call_count,
                                     int(mode == "on" or (mode == "auto" and engine != "openai")))


if __name__ == "__main__":
    unittest.main()
