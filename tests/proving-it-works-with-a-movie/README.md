# Portable movie regressions

Run an implemented suite from the repository root:

```sh
uv run --script tests/proving-it-works-with-a-movie/run-tests.py --suite assembly
uv run --script tests/proving-it-works-with-a-movie/run-tests.py --suite checker
uv run --script tests/proving-it-works-with-a-movie/run-tests.py --suite narration
uv run --script tests/proving-it-works-with-a-movie/run-tests.py --suite all
```

By default, unavailable external capabilities are reported as skips. Add
`--require-capabilities` when the selected environment is required to provide
them; any skip then makes the run fail. Only `shells` and `routes` are reserved
for later tasks and currently fail explicitly instead of reporting empty success.

The assembly sine wave is only a synthetic timing fixture. The narration drift
inputs exercise text comparison only. Neither is speech/ASR acceptance.

## Imported assertion equivalence

| Bash suite | Imported assertion | Python test |
| --- | --- | --- |
| `test-assemble.sh` | `assemble runs` | `AssemblyRegression.test_narration_padding_and_offsets` |
| `test-assemble.sh` | `segment = max(narration, visuals)` (8s +/- 0.4s) | `AssemblyRegression.test_narration_padding_and_offsets` |
| `test-assemble.sh` | `offsets.json places the narrated scene` (2s +/- 0.3s) | `AssemblyRegression.test_narration_padding_and_offsets` |
| `test-assemble.sh` | `cues start at the scene's real offset, not zero` (first cue start equals the measured body offset within 1ms) | `AssemblyRegression.test_narration_padding_and_offsets` |
| `test-check-movie.sh` | `front-loaded action is rejected` | `CheckerRegression.test_front_loaded_action_is_rejected` |
| `test-check-movie.sh` | `paced + subtitles is accepted` | `CheckerRegression.test_paced_with_subtitles_is_accepted` |
| `test-check-movie.sh` | `narrated without subtitles rejected` | `CheckerRegression.test_narrated_without_subtitles_is_rejected` |
| `test-check-movie.sh` | `subtitles that stop early rejected` | `CheckerRegression.test_subtitles_that_stop_early_are_rejected` |
| `test-check-movie.sh` | `subtitle check is opt-outable` | `CheckerRegression.test_subtitle_check_is_opt_outable` |
| `test-check-movie.sh` | `a still with audio is rejected` | `CheckerRegression.test_still_with_audio_is_rejected` |
| `test-check-movie.sh` | `missing narration is rejected` | `CheckerRegression.test_missing_narration_is_rejected` |
| `test-check-movie.sh` | `silent movie passes when unnarrated` | `CheckerRegression.test_silent_movie_passes_when_unnarrated` |
| `test-check-movie.sh` | `a contact sheet is always written` | `CheckerRegression.test_contact_sheet_is_always_written` |
| `test-narrate.sh` | `mispronounced jargon passes` | `NarrationDriftRegression.test_mispronounced_jargon_passes` |
| `test-narrate.sh` | `exact transcript passes` | `NarrationDriftRegression.test_exact_transcript_passes` |
| `test-narrate.sh` | `a dropped clause fails` | `NarrationDriftRegression.test_dropped_clause_fails` |
| `test-narrate.sh` | `an invented preamble fails` | `NarrationDriftRegression.test_invented_preamble_fails` |
| `test-narrate.sh` | `an empty clip fails` | `NarrationDriftRegression.test_empty_clip_fails` |

The portable subtitle assertion intentionally strengthens the Bash suite's
whole-file regex: it parses the first cue start and compares it with the actual
assembly offset at SRT's millisecond precision.

### Final native Windows workflow fixture

With native uv, Python 3.12+, FFmpeg/ffprobe (libass), Chrome or Edge, and ttyd
prepared, run from each invoking shell and record that same shell. Record
its version/PID before invoking uv; `--shell` alone is not invocation evidence.

```text
uv run --script tests/proving-it-works-with-a-movie/run-windows-acceptance.py --work "PATH/movie O'Brien λ & [take]" --shell powershell51 --phase prepare
```

Repeat with `powershell7` or `gitbash` in a separate work directory. The
fixture clicks a real local browser counter through CDP, captures its states,
and prepares BOM-bearing UTF-8/CRLF scenes with a card, image, frames, and a
stereo source-tone movie. Use the native recording-a-terminal.md recipe with
`fixtures/terminal_app.py`, keeping its command alive across two separate
control calls/takes. Keep the second take running through `q`, the command's
successful result, and a readable completion hold.

```text
uv run --script tests/proving-it-works-with-a-movie/run-windows-acceptance.py --work "PATH/movie O'Brien λ & [take]" --shell powershell51 --phase finish --take-one "PATH/session/take-one" --take-two "PATH/session/take-two"
```

Pass exported frame directories, not `samples/`. `finish` runs all five
public tools, fresh local narration and a new-output cached-model repeat,
then checks each final audio interval against its narration or known source
tone. Tool stdout/stderr, arguments/statuses, source hashes, the contact
sheet, and rendered-audio results go under `work/evidence`. Inspect actual
pixels, hard captions, timing, and sound before declaring acceptance. The
source tone is a labeled non-speech fixture, not TTS evidence.

Use the native quoting/path recipes in the skill, remove cloud keys only
from the test process, and exclude `llm` from its PATH. Retain final media
outside disposable SDD scratch; do not commit large generated artifacts.
