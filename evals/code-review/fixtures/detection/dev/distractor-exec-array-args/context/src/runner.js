// src/runner.js — executes a user-supplied subcommand of a fixed CLI tool.
// Inputs come from a CI workflow file, NOT from arbitrary network input,
// but reviewers often flag any exec()-shaped code as command injection.
//
// IMPORTANT: this uses child_process.execFile with an ARRAY of args. There
// is no shell interpolation. `userArg` is passed as a single argv element.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const pExecFile = promisify(execFile);

export async function runMytool(userArg) {
    // execFile, args as array → safe from shell injection.
    const { stdout } = await pExecFile('mytool', ['analyze', '--input', userArg]);
    return stdout;
}
