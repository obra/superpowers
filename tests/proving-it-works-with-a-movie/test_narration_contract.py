import base64
import io
import json
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest.mock import patch

import fixtures


class ChatResponseContract(unittest.TestCase):
    def test_malformed_transcripts_cannot_publish_candidates_in_any_asr_mode(self):
        cases = ({}, {"transcript": None}, {"transcript": 42},
                 {"transcript": ["Two", "words"]}, {"transcript": {}},
                 {"transcript": False}, {"transcript": ""},
                 {"transcript": "   "}, {"transcript": "...!?"})
        for response in cases:
            for mode in ("off", "auto", "on"):
                with self.subTest(response=response, mode=mode), tempfile.TemporaryDirectory() as temp:
                    module = fixtures.load_script("narrate")
                    root = Path(temp)
                    scenes, output = root / "scenes.json", root / "narration"
                    scenes.write_text(json.dumps({"scenes": [{"id": "clip", "narration": "Two words"}]}))
                    sentinels = []

                    def post(*args, **kwargs):
                        sentinel = f"NOT MEDIA: response {len(sentinels) + 1}".encode()
                        sentinels.append(sentinel)
                        audio = dict(response, data=base64.b64encode(sentinel).decode())
                        return {"choices": [{"message": {"audio": audio}}]}

                    argv = ["narrate", str(scenes), str(output), "--engine", "openai-chat", "--verify", mode]
                    with patch.object(sys, "argv", argv), \
                         patch.object(module.shutil, "which", return_value="fake-ffprobe"), \
                         patch.object(module, "openai_key", return_value="fake-key"), \
                         patch.object(module, "post", post), \
                         patch.object(module, "duration", return_value=1.25), \
                         patch.object(module, "transcribe_local", side_effect=AssertionError("invalid transcript reached ASR")), \
                         redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                        try:
                            result = module.main()
                        except Exception as error:
                            result = error
                    self.assertEqual(result, 1)
                    self.assertEqual(json.loads((output / "manifest.json").read_text()), [])
                    self.assertEqual(len(sentinels), 2)
                    self.assertEqual({path.read_bytes() for path in output.glob(".clip.attempt-*.wav")}, set(sentinels))
                    self.assertFalse((output / "clip.wav").exists())

    def test_valid_chat_and_cached_reuse_obey_independent_asr_modes(self):
        for mode in ("off", "auto", "on"):
            for heard in (None, "Two words"):
                with self.subTest(mode=mode, heard=heard), tempfile.TemporaryDirectory() as temp:
                    module = fixtures.load_script("narrate")
                    root = Path(temp)
                    scenes, output = root / "scenes.json", root / "narration"
                    scenes.write_text(json.dumps({"scenes": [{"id": "clip", "narration": "Two words"}]}))
                    sentinel = b"NOT MEDIA: accepted response"
                    response = {"choices": [{"message": {"audio": {
                        "data": base64.b64encode(sentinel).decode(), "transcript": "Two words",
                    }}}]}
                    argv = ["narrate", str(scenes), str(output), "--engine", "openai-chat", "--verify", "off"]
                    with patch.object(sys, "argv", argv), \
                         patch.object(module.shutil, "which", return_value="fake-ffprobe"), \
                         patch.object(module, "openai_key", return_value="fake-key"), \
                         patch.object(module, "post", return_value=response) as post, \
                         patch.object(module, "duration", return_value=1.25), \
                         patch.object(module, "transcribe_local", return_value=heard) as asr, \
                         redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                        self.assertEqual(module.main(), 0)
                        argv[-1] = mode
                        expected = 1 if mode == "on" and heard is None else 0
                        self.assertEqual(module.main(), expected)
                    self.assertEqual(post.call_count, 1, "accepted cache must not synthesize again")
                    self.assertEqual(asr.call_count, int(mode != "off"))
                    self.assertEqual(bool(json.loads((output / "manifest.json").read_text())), expected == 0)
                    self.assertEqual((output / "clip.wav").read_bytes(), sentinel)


class NarrationPublicationContract(unittest.TestCase):
    def setUp(self):
        self.module = fixtures.load_script("narrate")
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.scenes = self.root / "scenes.yaml"
        self.output = self.root / "narration"

    def run_narrate(self, scenes, synthesize, *, verify="off", expected=0, engine="piper",
                    extra_options=(), transcript=None, asr_calls=None):
        self.scenes.write_text(json.dumps({"scenes": scenes}), encoding="utf-8")
        argv = ["narrate", str(self.scenes), str(self.output), "--engine", engine,
                "--verify", verify, *extra_options]
        stderr = io.StringIO()
        def transcribe(wav, model):
            if asr_calls is not None:
                asr_calls.append((wav, model))
            return transcript
        with patch.object(sys, "argv", argv), \
             patch.object(self.module.shutil, "which", return_value="ffprobe"), \
             patch.object(self.module, "openai_key", return_value="key" if engine.startswith("openai") else None), \
             patch.object(self.module, "say_piper", side_effect=synthesize), \
             patch.object(self.module, "say_openai_chat",
                          side_effect=lambda key, text, wav, voice: synthesize(text, wav, voice)), \
             patch.object(self.module, "duration", return_value=1.25), \
             patch.object(self.module, "transcribe_local", side_effect=transcribe), \
             redirect_stdout(io.StringIO()), redirect_stderr(stderr):
            self.assertEqual(self.module.main(), expected, stderr.getvalue())
        manifest = self.output / "manifest.json"
        return json.loads(manifest.read_text(encoding="utf-8")) if manifest.exists() else []

    def test_acceptance_is_withdrawn_before_replacing_accepted_bytes(self):
        old_wav = self.output / "first.wav"
        self.output.mkdir()
        old_wav.write_bytes(b"accepted bytes")
        synthesis = {"engine": "piper", "voice": self.module.PIPER_VOICE,
                     "model": self.module.PIPER_VOICE}
        (self.output / "manifest.json").write_text(json.dumps([{
            "id": "first", "text": "Old words", "wav": "first.wav",
            "duration": 1.0, "synthesis": synthesis,
        }]), encoding="utf-8")

        def synthesize(text, wav, voice):
            published = json.loads((self.output / "manifest.json").read_text())
            self.assertNotIn("first", [entry["id"] for entry in published])
            wav.write_bytes(b"replacement bytes")

        manifest = self.run_narrate(
            [{"id": "first", "narration": "New words"}], synthesize
        )

        self.assertEqual(manifest[0]["text"], "New words")
        self.assertEqual(old_wav.read_bytes(), b"replacement bytes")

    def test_rejected_and_exceptional_takes_are_not_accepted_on_a_rerun(self):
        attempts = []

        def synthesize(text, wav, voice):
            attempts.append((text, wav))
            wav.write_bytes(f"{text}:{len(attempts)}".encode())
            if text == "Reject this":
                return "invented words that do not match this script at all"
            if text == "Raise here":
                raise RuntimeError("synthesis interrupted")

        scenes = [{"id": "reject", "narration": "Reject this"},
                  {"id": "raise", "narration": "Raise here"}]
        def accepted(text, wav, voice):
            wav.write_bytes(b"accepted")
            return text

        self.run_narrate(scenes, accepted, engine="openai-chat")
        first = self.run_narrate(scenes, synthesize, engine="openai-chat", expected=1, extra_options=("--force",))
        attempts_after_rejection = len(attempts)
        second = self.run_narrate(scenes, synthesize, engine="openai-chat", expected=1)

        self.assertEqual(first, [])
        self.assertEqual(second, [])
        self.assertGreater(len(attempts), attempts_after_rejection)
        rejected_paths = [path for text, path in attempts if text == "Reject this"]
        self.assertEqual(len({path.name for path in rejected_paths}), len(rejected_paths))
        self.assertTrue(all(path.exists() for path in rejected_paths))
        self.assertEqual(len({path.read_bytes() for path in rejected_paths}), len(rejected_paths))

    def test_duration_failure_leaves_only_prior_accepted_scenes_published(self):
        scenes = [{"id": "accepted", "narration": "Accepted words"},
                  {"id": "broken", "narration": "Broken words"}]

        def synthesize(text, wav, voice):
            wav.write_bytes(text.encode())

        self.scenes.write_text(json.dumps({"scenes": scenes}), encoding="utf-8")
        argv = ["narrate", str(self.scenes), str(self.output), "--engine", "piper",
                "--verify", "off"]
        durations = iter((1.0, RuntimeError("ffprobe failed")))
        with patch.object(sys, "argv", argv), \
             patch.object(self.module.shutil, "which", return_value="ffprobe"), \
             patch.object(self.module, "openai_key", return_value=None), \
             patch.object(self.module, "say_piper", side_effect=synthesize), \
             patch.object(self.module, "duration", side_effect=durations), \
             redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            self.assertEqual(self.module.main(), 1)

        manifest = json.loads((self.output / "manifest.json").read_text())
        self.assertEqual([entry["id"] for entry in manifest], ["accepted"])

    def test_duration_failures_keep_distinct_attempt_bytes_across_reruns(self):
        scenes = [{"id": "clip", "narration": "Measure this clip"}]

        def synthesize(text, wav, voice):
            wav.write_bytes(f"attempt {len(list(self.output.glob('.clip.attempt-*.wav'))) + 1}".encode())

        for expected_attempts in (1, 2):
            self.scenes.write_text(json.dumps({"scenes": scenes}), encoding="utf-8")
            argv = ["narrate", str(self.scenes), str(self.output), "--engine", "piper", "--verify", "off"]
            with patch.object(sys, "argv", argv), \
                 patch.object(self.module.shutil, "which", return_value="ffprobe"), \
                 patch.object(self.module, "openai_key", return_value=None), \
                 patch.object(self.module, "say_piper", side_effect=synthesize), \
                 patch.object(self.module, "duration", side_effect=RuntimeError("ffprobe failed")), \
                 redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                self.assertEqual(self.module.main(), 1)
            attempts = sorted(self.output.glob(".clip.attempt-*.wav"))
            self.assertEqual(len(attempts), expected_attempts)
            self.assertEqual(len({path.read_bytes() for path in attempts}), expected_attempts)
            self.assertFalse((self.output / "clip.wav").exists())

    def test_two_accepted_scenes_are_published_together(self):
        def synthesize(text, wav, voice):
            wav.write_bytes(text.encode())

        manifest = self.run_narrate([
            {"id": "first", "narration": "First accepted scene"},
            {"id": "second", "narration": "Second accepted scene"},
        ], synthesize)
        self.assertEqual([entry["id"] for entry in manifest], ["first", "second"])

    def test_strict_unavailable_verification_withdraws_cached_acceptance(self):
        def synthesize(text, wav, voice):
            wav.write_bytes(b"accepted")

        self.run_narrate([{"id": "clip", "narration": "Read these words"}], synthesize)
        manifest = self.run_narrate(
            [{"id": "clip", "narration": "Read these words"}], synthesize,
            verify="on", expected=1,
        )
        self.assertEqual(manifest, [])

    def test_unsupported_asr_comparison_obeys_auto_on_and_off_modes(self):
        def synthesize(text, wav, voice):
            wav.write_bytes(b"clip")

        scenes = [{"id": "clip", "narration": "\u77ed\u6587"}]
        for mode, expected in (("auto", 0), ("on", 1), ("off", 0)):
            with self.subTest(mode=mode):
                asr_calls = []
                manifest = self.run_narrate(scenes, synthesize, verify=mode,
                                             expected=expected, transcript="\u77ed\u6587",
                                             asr_calls=asr_calls)
                self.assertEqual(bool(manifest), expected == 0)
                self.assertEqual(bool(asr_calls), mode != "off")

    def test_missing_ffprobe_stops_before_synthesis(self):
        self.scenes.write_text(json.dumps({"scenes": [{"id": "clip", "narration": "Words"}]}),
                              encoding="utf-8")
        with patch.object(sys, "argv", ["narrate", str(self.scenes), str(self.output)]), \
             patch.object(self.module.shutil, "which", return_value=None), \
             patch.object(self.module, "say_piper", side_effect=AssertionError("synthesized")), \
             redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit):
                self.module.main()

    def test_fresh_unsupported_chat_transcript_is_rejected_before_synthesis(self):
        called = []

        def synthesize(*args):
            called.append(args)

        manifest = self.run_narrate(
            [{"id": "clip", "narration": "\U00020000\U00020001"}], synthesize,
            engine="openai-chat", expected=1,
        )
        self.assertEqual(manifest, [])
        self.assertEqual(called, [])

    def test_cached_unsupported_chat_transcript_withdraws_acceptance_without_asr(self):
        self.output.mkdir()
        (self.output / "clip.wav").write_bytes(b"cached bytes")
        synthesis = {"engine": "openai-chat", "voice": "nova",
                     "model": self.module.OPENAI_CHAT_MODEL}
        (self.output / "manifest.json").write_text(json.dumps([{
            "id": "clip", "text": "\u77ed\u6587", "wav": "clip.wav", "duration": 1.0,
            "synthesis": synthesis,
        }]), encoding="utf-8")
        self.scenes.write_text(json.dumps({"scenes": [
            {"id": "clip", "narration": "\u77ed\u6587"}
        ]}), encoding="utf-8")
        for mode in ("off", "auto"):
            with self.subTest(mode=mode):
                (self.output / "manifest.json").write_text(json.dumps([{
                    "id": "clip", "text": "\u77ed\u6587", "wav": "clip.wav", "duration": 1.0,
                    "synthesis": synthesis,
                }]), encoding="utf-8")
                argv = ["narrate", str(self.scenes), str(self.output), "--engine", "openai-chat",
                        "--verify", mode]
                with patch.object(sys, "argv", argv), \
                     patch.object(self.module.shutil, "which", return_value="ffprobe"), \
                     patch.object(self.module, "openai_key", return_value="key"), \
                     patch.object(self.module, "say_openai_chat", side_effect=AssertionError("cached")), \
                     patch.object(self.module, "transcribe_local", side_effect=AssertionError("ASR")), \
                     redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                    self.assertEqual(self.module.main(), 1)
                self.assertEqual(json.loads((self.output / "manifest.json").read_text()), [])

    def test_empty_chat_or_asr_speech_is_rejected(self):
        def empty_chat_synthesis(text, wav, voice):
            wav.write_bytes(b"audio")
            return ""

        empty_chat = self.run_narrate(
            [{"id": "clip", "narration": "Two words"}],
            empty_chat_synthesis, engine="openai-chat", expected=1,
        )
        self.assertEqual(empty_chat, [])

        def synthesize(text, wav, voice):
            wav.write_bytes(b"audio")

        self.scenes.write_text(json.dumps({"scenes": [{"id": "clip", "narration": "Two words"}]}),
                              encoding="utf-8")
        argv = ["narrate", str(self.scenes), str(self.output), "--engine", "piper", "--verify", "auto"]
        with patch.object(sys, "argv", argv), \
             patch.object(self.module.shutil, "which", return_value="ffprobe"), \
             patch.object(self.module, "openai_key", return_value=None), \
             patch.object(self.module, "say_piper", side_effect=synthesize), \
             patch.object(self.module, "transcribe_local", return_value=""), \
             patch.object(self.module, "duration", return_value=1.0), \
             redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            self.assertEqual(self.module.main(), 1)
        self.assertEqual(json.loads((self.output / "manifest.json").read_text()), [])

    def test_cached_nested_wav_keeps_its_manifest_path_after_reverification(self):
        nested = self.output / "takes" / "clip.wav"
        nested.parent.mkdir(parents=True)
        nested.write_bytes(b"accepted")
        synthesis = {"engine": "piper", "voice": self.module.PIPER_VOICE,
                     "model": self.module.PIPER_VOICE}
        (self.output / "manifest.json").write_text(json.dumps([{
            "id": "clip", "text": "Nested clip", "wav": "takes/clip.wav", "duration": 1.0,
            "synthesis": synthesis,
        }]), encoding="utf-8")
        manifest = self.run_narrate(
            [{"id": "clip", "narration": "Nested clip"}],
            lambda *args: (_ for _ in ()).throw(AssertionError("cached")), verify="on",
            transcript="Nested clip",
        )
        self.assertEqual(manifest[0]["wav"], "takes/clip.wav")

    def test_cached_strict_verification_withdraws_before_interrupt(self):
        def synthesize(text, wav, voice):
            wav.write_bytes(b"accepted")

        self.run_narrate([{"id": "clip", "narration": "Interrupt safely"}], synthesize)
        self.scenes.write_text(json.dumps({"scenes": [{"id": "clip", "narration": "Interrupt safely"}]}),
                              encoding="utf-8")
        argv = ["narrate", str(self.scenes), str(self.output), "--engine", "piper", "--verify", "on"]
        with patch.object(sys, "argv", argv), \
             patch.object(self.module.shutil, "which", return_value="ffprobe"), \
             patch.object(self.module, "openai_key", return_value=None), \
             patch.object(self.module, "say_piper", side_effect=AssertionError("cached")), \
             patch.object(self.module, "transcribe_local", side_effect=KeyboardInterrupt), \
             redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            with self.assertRaises(KeyboardInterrupt):
                self.module.main()
        self.assertEqual(json.loads((self.output / "manifest.json").read_text()), [])


class NarrationComparisonContract(unittest.TestCase):
    def setUp(self):
        self.module = fixtures.load_script("narrate")

    def test_comparison_marks_scripts_requiring_segmentation_or_no_words_unavailable(self):
        for script, heard in (
            ("你好世界", "こんにちは世界"),
            ("短文", "短文"),
            ("mixed 日本語 words", "mixed 日本語 words"),
            ("\U00020000\U00020001", "\U00020002\U00020003"),
            ("*** !!!", "*** !!!"),
        ):
            with self.subTest(script=script):
                self.assertIsNone(self.module.structural_drift(script, heard))

    def test_comparison_accepts_multiline_accented_latin_and_spaced_cyrillic(self):
        for script, heard in (
            ("Caf\u00e9\nna\u00efve", "CAF\u00c9 na\u00efve"),
            ("\u041f\u0440\u0438\u0432\u0435\u0442 \u043c\u0438\u0440", "\u043f\u0440\u0438\u0432\u0435\u0442 \u043c\u0438\u0440"),
            ("\uc548\ub155 \uc138\uacc4", "\uc548\ub155 \uc138\uacc4"),
        ):
            with self.subTest(script=script):
                self.assertEqual(self.module.structural_drift(script, heard), (0.0, 0))

    def test_drift_check_reports_unavailable_comparison_as_nonzero(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            script = root / "script.txt"
            heard = root / "heard.txt"
            script.write_text("\u77ed\u6587", encoding="utf-8")
            heard.write_text("\u77ed\u6587", encoding="utf-8")
            output = io.StringIO()
            with patch.object(sys, "argv", ["narrate", "--drift-check", str(script), str(heard)]), \
                 redirect_stdout(output):
                self.assertEqual(self.module.main(), 1)
            self.assertIn("comparison unavailable", output.getvalue())


class AssemblyNarrationContract(unittest.TestCase):
    def setUp(self):
        self.module = fixtures.load_script("assemble")
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.scenes = self.root / "scenes.yaml"
        self.narration = self.root / "narration"
        self.narration.mkdir()

    def assemble(self, scenes, *, manifest=None, run_side_effect=None):
        self.scenes.write_text(json.dumps({"scenes": scenes}), encoding="utf-8")
        if manifest is not None:
            (self.narration / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
        calls = []

        def run(command, **kwargs):
            calls.append(command)
            if run_side_effect is not None:
                return run_side_effect(command)
            return subprocess.CompletedProcess(command, 0, "1.0", "")

        argv = ["assemble", str(self.scenes), str(self.root / "out.mp4"),
                "--narration", str(self.narration), "--work", str(self.root / "work")]
        with patch.object(sys, "argv", argv), \
             patch.object(self.module.shutil, "which", return_value="tool"), \
             patch.object(self.module, "find_browser", return_value=None), \
             patch.object(self.module, "run", side_effect=run), \
             redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            return self.module.main(), calls

    def test_required_narration_contract_fails_before_encoding(self):
        with self.assertRaises(SystemExit):
            self.assemble([{"id": "spoken", "kind": "image", "src": "still.png",
                            "narration": "Expected words"}],
                          run_side_effect=lambda command: (_ for _ in ()).throw(
                              AssertionError("encoding started")
                          ))

    def test_missing_entry_wav_or_matching_text_fails_before_encoding(self):
        (self.root / "still.png").write_bytes(b"image sentinel")
        cases = (
            ([], "missing entry"),
            ([{"id": "spoken", "text": "Expected words", "wav": "missing.wav"}], "missing WAV"),
            ([{"id": "spoken", "text": "Changed words", "wav": "accepted.wav"}], "changed text"),
        )
        for manifest, label in cases:
            with self.subTest(label=label):
                (self.narration / "manifest.json").unlink(missing_ok=True)
                with self.assertRaises(SystemExit):
                    self.assemble([{"id": "spoken", "kind": "image", "src": "still.png",
                                    "narration": "Expected words"}], manifest=manifest,
                                  run_side_effect=lambda command: (_ for _ in ()).throw(
                                      AssertionError("encoding started")
                                  ))

    def test_manifest_wav_name_is_authoritative_and_removed_narration_ignores_leftover_wav(self):
        selected = self.narration / "accepted-name.wav"
        selected.write_bytes(b"accepted")
        leftover = self.narration / "silent.wav"
        leftover.write_bytes(b"leftover")
        (self.root / "still.png").write_bytes(b"image sentinel")
        manifest = [{"id": "spoken", "text": "Expected words",
                     "wav": selected.name, "duration": 1.0, "synthesis": {}}]
        status, calls = self.assemble([
            {"id": "spoken", "kind": "image", "src": "still.png", "narration": "Expected  words"},
            {"id": "silent", "kind": "image", "src": "still.png"},
        ], manifest=manifest)
        self.assertEqual(status, 0)
        encoded = [call for call in calls if call and call[0] == "ffmpeg"]
        self.assertTrue(any(str(selected) in call for call in encoded))
        self.assertFalse(any(str(leftover) in call for call in encoded))
        offsets = json.loads((self.root / "work" / "offsets.json").read_text())
        self.assertEqual(set(offsets), {"spoken"})

    def test_2560x1080_movie_uses_source_audio_and_silent_source_gets_anullsrc(self):
        source = self.root / "wide-2560x1080.mp4"
        source.write_bytes(b"source")
        status, calls = self.assemble(
            [{"id": "movie", "kind": "movie", "src": source.name,
              "narration": "Ignore this", "height": 800}],
            run_side_effect=lambda command: subprocess.CompletedProcess(
                command, 0,
                json.dumps({"streams": [{"codec_type": "video", "width": 2560,
                                           "height": 1080}]}), ""
            ) if "-show_streams" in command else subprocess.CompletedProcess(command, 0, "1.0", ""),
        )
        self.assertEqual(status, 0)
        movie_encode = next(call for call in calls if call and call[0] == "ffmpeg")
        self.assertIn("anullsrc=r=44100:cl=stereo", movie_encode)
        self.assertIn("0:v:0", movie_encode)
        self.assertIn("1:a:0", movie_encode)
        self.assertIn("scale=1920:800:force_original_aspect_ratio=decrease",
                      movie_encode[movie_encode.index("-vf") + 1])
        offsets = json.loads((self.root / "work" / "offsets.json").read_text())
        self.assertEqual(offsets, {})

    def test_movie_with_audio_maps_its_source_audio(self):
        source = self.root / "source-with-audio.mp4"
        source.write_bytes(b"source")
        status, calls = self.assemble(
            [{"id": "movie", "kind": "movie", "src": source.name}],
            run_side_effect=lambda command: subprocess.CompletedProcess(
                command, 0,
                json.dumps({"streams": [{"codec_type": "video"}, {"codec_type": "audio"}]}), ""
            ) if "-show_streams" in command else subprocess.CompletedProcess(command, 0, "1.0", ""),
        )
        self.assertEqual(status, 0)
        movie_encode = next(call for call in calls if call and call[0] == "ffmpeg")
        self.assertNotIn("anullsrc=r=44100:cl=stereo", movie_encode)
        self.assertEqual(movie_encode[movie_encode.index("-map") + 1], "0:v:0")
        self.assertEqual(movie_encode[movie_encode.index("-map", movie_encode.index("-map") + 1) + 1], "0:a:0")

    def test_movie_geometry_fits_width_and_requested_inner_height_before_padding(self):
        self.assertEqual(self.module.movie_geometry(1920, 1080, 800), {
            "scale": (1920, 800),
            "pad": (1920, 1080),
        })


class PercentPathContract(unittest.TestCase):
    def test_sequence_pattern_escapes_only_directory_percents(self):
        module = fixtures.load_script("media_paths")
        pattern = module.sequence_pattern(Path("folder%name") / "frames", "frame-%08d.png")
        self.assertEqual(pattern, "folder%%name/frames/frame-%08d.png")

    def test_checker_sampling_escapes_only_output_directory_percents(self):
        module = fixtures.load_script("check-movie")
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory) / "proof%take"
            work.mkdir()
            command = []

            def run(argv, **kwargs):
                command.extend(argv)
                return subprocess.CompletedProcess(argv, 0, "", "")

            with patch.object(module.subprocess, "run", side_effect=run), redirect_stdout(io.StringIO()):
                with self.assertRaises(SystemExit):
                    module.sample_picture(Path("movie.mp4"), work)
            output = command[-1]
            self.assertIn("proof%%take", output)
            self.assertTrue(output.endswith("s%05d.png"))


if __name__ == "__main__":
    unittest.main()
