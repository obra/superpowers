#!/usr/bin/env node
import { runCli } from '../lib/metrics/cli.mjs';

const status = await runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: process.stdout,
  stderr: process.stderr,
});
process.exitCode = status;
