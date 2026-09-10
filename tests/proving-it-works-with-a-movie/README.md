# Portable movie regressions

Run a suite from the repository root:

```sh
uv run --script tests/proving-it-works-with-a-movie/run-tests.py --suite assembly
uv run --script tests/proving-it-works-with-a-movie/run-tests.py --suite checker
uv run --script tests/proving-it-works-with-a-movie/run-tests.py --suite narration
uv run --script tests/proving-it-works-with-a-movie/run-tests.py --suite all
```

By default, unavailable external capabilities are reported as skips. Add
`--require-capabilities` when the selected environment is required to provide
them; any skip then makes the run fail.

The assembly sine wave is only a synthetic timing fixture. The narration drift
inputs exercise text comparison only. Neither is speech/ASR acceptance.

The `processes` and `terminal` suites need native Windows with ttyd and Chrome
or Edge available; elsewhere they skip. Set `MOVIE_TEST_SHELL` to
`powershell51`, `powershell7`, or `gitbash` to choose the recorded shell, and
`MOVIE_TEST_SHELL_EXE` and `MOVIE_TEST_TTYD` to name those executables when
they are not on PATH.
