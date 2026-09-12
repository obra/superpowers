"""Text and mocked-boundary contracts; this module never processes media."""

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


def milliseconds(timestamp):
    hours, minutes, rest = timestamp.split(":")
    seconds, millis = rest.split(",")
    return ((int(hours) * 60 + int(minutes)) * 60 + int(seconds)) * 1000 + int(millis)


def read_cues(path):
    cues = []
    for block in path.read_text(encoding="utf-8").strip().split("\n\n"):
        if block:
            _, timing, text = block.split("\n", 2)
            start, end = map(milliseconds, timing.split(" --> "))
            cues.append((start, end, " ".join(text.split())))
    return cues


class SubtitleTimingContract(unittest.TestCase):
    def setUp(self):
        self.module = fixtures.load_script("make-subtitles")
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.output = self.root / "captions.srt"

    def subtitles(self, entries, *options):
        manifest = self.root / "manifest.json"
        manifest.write_text(json.dumps(entries), encoding="utf-8")
        stdout = io.StringIO()
        with patch.object(sys, "argv", ["make-subtitles", str(manifest), str(self.output), *options]), \
             redirect_stdout(stdout):
            self.assertEqual(self.module.main(), 0)
        return read_cues(self.output), stdout.getvalue()

    def assert_scene(self, cues, start, end, text):
        self.assertTrue(cues)
        self.assertEqual(cues[0][0], start)
        self.assertEqual(cues[-1][1], end)
        previous = start
        for a, b, _ in cues:
            self.assertEqual(a, previous)
            self.assertLess(a, b)
            self.assertLessEqual(b, end)
            previous = b
        self.assertEqual(" ".join(cue[2] for cue in cues).split(), text.split())

    def test_five_chunks_fit_half_second_before_next_scene(self):
        text = "one two six ten red"
        cues, report = self.subtitles([
            {"id": "short", "duration": 0.5, "text": text},
            {"id": "next", "duration": 1, "text": "next"},
        ], "--max-chars", "3")
        self.assert_scene(cues[:-1], 0, 500, text)
        self.assertEqual(cues[-1], (500, 1500, "next"))
        self.assertIn("ends at 00:00:01,500", report)

    def test_one_word_covers_twelve_second_scene(self):
        cues, report = self.subtitles([{"id": "held", "duration": 12, "text": "Held"}])
        self.assert_scene(cues, 0, 12000, "Held")
        self.assertIn("ends at 00:00:12,000", report)

    def test_mixed_chunks_get_proportional_time(self):
        cues, _ = self.subtitles([{"id": "mix", "duration": 1, "text": "a bbbbbbbbb"}], "--max-chars", "9")
        self.assertEqual(cues, [(0, 100, "a"), (100, 1000, "bbbbbbbbb")])

    def test_max_seconds_guides_splitting_without_losing_tail_or_words(self):
        text = "one two six ten red cat dog fox"
        cues, _ = self.subtitles([{"id": "long", "duration": 12, "text": text}], "--max-secs", "3")
        self.assert_scene(cues, 0, 12000, text)
        self.assertGreater(len(cues), 1)
        self.assertTrue(all(b - a <= 3000 for a, b, _ in cues))

    def test_chunks_coalesce_to_fit_representable_milliseconds(self):
        text = "one two six ten red"
        cues, report = self.subtitles([{"id": "tiny", "duration": 0.002, "text": text}], "--max-chars", "3")
        self.assert_scene(cues, 0, 2, text)
        self.assertLessEqual(len(cues), 2)
        self.assertIn("ends at 00:00:00,002", report)

    def test_submillisecond_scene_can_use_its_rounded_interval(self):
        cues, _ = self.subtitles([{"id": "tiny", "duration": 0.0008, "text": "one two"}])
        self.assert_scene(cues, 0, 1, "one two")

    def test_invalid_or_unrepresentable_duration_fails_before_writing_srt(self):
        for duration in (0, -1, 0.0001, float("nan"), float("inf"), "invalid"):
            with self.subTest(duration=duration), redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as caught:
                    self.subtitles([{"id": "invalid", "duration": duration, "text": "words"}])
                self.assertNotEqual(caught.exception.code, 0)
                self.assertFalse(self.output.exists())

    def test_invalid_readability_limits_fail_clearly(self):
        for option, value in (("--max-chars", "0"), ("--max-secs", "0"),
                              ("--max-secs", "nan"), ("--max-secs", "inf")):
            with self.subTest(option=option, value=value), redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as caught:
                    self.subtitles([{"id": "scene", "duration": 1, "text": "words"}], option, value)
                self.assertNotEqual(caught.exception.code, 0)

    def test_manual_offset_uses_rounded_scene_boundaries(self):
        cues, report = self.subtitles([{"id": "shifted", "duration": 0.5004, "text": "one two six"}], "--offsets", "shifted=2.1254", "--max-chars", "3")
        self.assert_scene(cues, 2125, 2626, "one two six")
        self.assertIn("ends at 00:00:02,626", report)

    def test_empty_cut_and_unknown_offset_keys_do_not_introduce_cues(self):
        for mapping in ({}, {"unknown": 2}):
            with self.subTest(mapping=mapping):
                offsets = self.root / "offsets.json"
                offsets.write_text(json.dumps(mapping), encoding="utf-8")
                cues, report = self.subtitles([{"id": "excluded", "duration": 1, "text": "excluded"}], "--offsets-json", str(offsets), "--offsets", "excluded=5")
                self.assertEqual(cues, [])
                self.assertIn("0 cues, ends at 00:00:00,000", report)


class SubtitleTrackContract(unittest.TestCase):
    def test_supplied_track_replaces_existing_subtitles_with_optional_audio(self):
        module = fixtures.load_script("burn-subtitles")
        for soft in (True, False):
            for source_audio in (True, False):
                with self.subTest(soft=soft, source_audio=source_audio), tempfile.TemporaryDirectory() as directory:
                    root = Path(directory)
                    movie, subs = root / "movie.mp4", root / "new.srt"
                    movie.write_bytes(b"source token")
                    subs.write_text("1\n00:00:00,000 --> 00:00:01,000\nNew caption\n", encoding="utf-8")
                    selections = []
                    source = {"v:0": "source video", "s:0": "old caption"}
                    if source_audio:
                        source["a:0"] = "source audio"
                    inputs = [source, {"s:0": "new caption"}]

                    def encode(command, **kwargs):
                        if "-vf" in command:
                            return False
                        maps = [command[i + 1] for i, arg in enumerate(command) if arg == "-map"]
                        self.assertEqual(maps, ["0:v:0", "0:a?", "1:s:0"])
                        for spec in maps:
                            index, kind = spec.rstrip("?").split(":", 1)
                            selected = [value for stream, value in inputs[int(index)].items() if stream == kind or stream.startswith(kind + ":")]
                            if not spec.endswith("?"):
                                self.assertTrue(selected)
                            selections.extend(selected)
                        return True

                    stdout, stderr = io.StringIO(), io.StringIO()
                    argv = ["burn-subtitles", str(movie), str(subs), str(root / "out.mp4")]
                    if soft:
                        argv.append("--soft")
                    with patch.object(sys, "argv", argv), \
                         patch.object(module.shutil, "which", return_value="mock-ffmpeg"), \
                         patch.object(module, "has_libass", return_value=True), \
                         patch.object(module, "run", side_effect=encode), \
                         redirect_stdout(stdout), \
                         redirect_stderr(stderr):
                        self.assertEqual(module.main(), 0)
                    self.assertEqual(selections, ["source video", *(["source audio"] if source_audio else []), "new caption"])
                    self.assertNotIn("no libass", stdout.getvalue())
                    self.assertEqual("burn failed" in stderr.getvalue(), not soft)


class SubtitleParserContract(unittest.TestCase):
    def setUp(self):
        self.module = fixtures.load_script("check-movie")

    def test_literal_arrow_in_caption_is_not_a_timing_line(self):
        self.assertEqual(self.module.subtitle_end("1\n00:00:00,000 --> 00:00:01,250\nFollow source --> destination.\n"), 1.25)

    def test_timestamp_shaped_caption_cannot_extend_coverage(self):
        text = "1\n00:00:00,000 --> 00:00:01,250\n00:00:00,000 --> 00:59:00,000\n"
        self.assertEqual(self.module.subtitle_end(text), 1.25)

    def test_malformed_actual_timing_is_rejected(self):
        for timing in ("00:00:00,000 --> invalid", "not a timing line", "00:00:00,000 --> 00:99:00,000"):
            with self.subTest(timing=timing), self.assertRaises(ValueError):
                self.module.subtitle_end(f"1\n{timing}\ncaption\n")

    def test_empty_subtitles_have_no_end(self):
        self.assertIsNone(self.module.subtitle_end("\n  \n"))

    def test_multiple_cues_keep_existing_latest_end_policy(self):
        text = "1\n00:00:00,000 --> 00:00:10,250\nFirst\n\n2\n00:00:05,000 --> 00:00:06,000\nSecond\n"
        self.assertEqual(self.module.subtitle_end(text), 10.25)


class SubtitleHandoffContract(unittest.TestCase):
    def test_rerun_removed_opening_narration_keeps_evidence_and_retimes_remaining_caption(self):
        narrate = fixtures.load_script("narrate")
        assemble = fixtures.load_script("assemble")
        subtitles = fixtures.load_script("make-subtitles")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            scenes_file, narration = root / "scenes.yaml", root / "narration"
            work, movie, srt = root / "segments", root / "movie.mp4", root / "movie.srt"
            (root / "still.png").write_bytes(b"still token")
            scenes = [
                {"id": "opening", "kind": "image", "src": "still.png", "duration": 2, "narration": "Opening words"},
                {"id": "body", "kind": "image", "src": "still.png", "duration": 12, "narration": "Body"},
            ]
            encoded_inputs = []

            def synthesize(text, wav, voice):
                wav.write_bytes(text.encode("utf-8"))

            def measure(path):
                if path.name.startswith(".opening") or path.name == "opening.wav":
                    return 1.0
                return 12.0

            def media_command(command, **kwargs):
                if command[0] == "ffprobe":
                    path = Path(command[-1])
                    seconds = {"opening.mp4": 2.375, "body.mp4": 12.0, "movie.mp4": 14.375}.get(path.name)
                    if seconds is None:
                        seconds = measure(path)
                    return subprocess.CompletedProcess(command, 0, str(seconds), "")
                self.assertEqual(command[0], "ffmpeg")
                encoded_inputs.append([command[i + 1] for i, item in enumerate(command) if item == "-i"])
                Path(command[-1]).write_bytes(b"encoded token")
                return subprocess.CompletedProcess(command, 0, "", "")

            for rerun in (False, True):
                if rerun:
                    del scenes[0]["narration"]
                scenes_file.write_text(json.dumps({"scenes": scenes}), encoding="utf-8")
                with patch.object(sys, "argv", ["narrate", str(scenes_file), str(narration), "--engine", "piper", "--verify", "off"]), \
                     patch.object(narrate.shutil, "which", return_value="mock-tool"), \
                     patch.object(narrate, "openai_key", return_value=None), \
                     patch.object(narrate, "say_piper", side_effect=synthesize), \
                     patch.object(narrate, "duration", side_effect=measure), \
                     redirect_stdout(io.StringIO()), \
                     redirect_stderr(io.StringIO()):
                    self.assertEqual(narrate.main(), 0)
                manifest = json.loads((narration / "manifest.json").read_text(encoding="utf-8"))
                self.assertEqual([entry["id"] for entry in manifest], ["body"] if rerun else ["opening", "body"])
                self.assertEqual(manifest[-1]["text"], "Body")
                self.assertEqual(manifest[-1]["duration"], 12)
                self.assertEqual(manifest[-1]["wav"], "body.wav")
                self.assertEqual((narration / "opening.wav").read_bytes(), b"Opening words")
                encoded_inputs.clear()
                with patch.object(sys, "argv", ["assemble", str(scenes_file), str(movie), "--narration", str(narration), "--work", str(work)]), \
                     patch.object(assemble.shutil, "which", return_value="mock-tool"), \
                     patch.object(assemble, "find_browser", return_value=None), \
                     patch.object(assemble, "run", side_effect=media_command), \
                     redirect_stdout(io.StringIO()):
                    self.assertEqual(assemble.main(), 0)
                offsets = json.loads((work / "offsets.json").read_text(encoding="utf-8"))
                self.assertEqual(offsets, {"body": 2.375} if rerun else {"opening": 0.0, "body": 2.375})
                self.assertEqual(str(narration / "opening.wav") in encoded_inputs[0], not rerun)
                self.assertIn(str(narration / "body.wav"), encoded_inputs[1])
                with patch.object(sys, "argv", ["make-subtitles", str(narration / "manifest.json"), str(srt), "--offsets-json", str(work / "offsets.json")]), \
                     redirect_stdout(io.StringIO()):
                    self.assertEqual(subtitles.main(), 0)
                expected = [(2375, 14375, "Body")]
                if not rerun:
                    expected.insert(0, (0, 1000, "Opening words"))
                self.assertEqual(read_cues(srt), expected)


if __name__ == "__main__":
    unittest.main()
