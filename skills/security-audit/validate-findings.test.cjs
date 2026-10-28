const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const schema = require("./report-schema.json");
const {
  LIMITS,
  collect,
  collectSchemaErrors,
  validateDocument,
} = require("./validate-findings.cjs");

const validatorPath = path.join(__dirname, "validate-findings.cjs");
const CLI_TIMEOUT_MS = 5000;
const HOSTILE_CLI_TIMEOUT_MS = 15000;
const HAS_SAFE_INPUT_OPEN = Number.isInteger(fs.constants.O_NOFOLLOW) &&
  fs.constants.O_NOFOLLOW !== 0 &&
  Number.isInteger(fs.constants.O_NONBLOCK) &&
  fs.constants.O_NONBLOCK !== 0;
const TERMINAL_CONTROL_PAYLOAD = "\u001b\u0007\u0085\u202e\u034f\ufe0f";
const TERMINAL_CONTROL_BYTES = [
  Buffer.from([0x1b]),
  Buffer.from([0x07]),
  Buffer.from("\u0085"),
  Buffer.from("\u202e"),
  Buffer.from("\u034f"),
  Buffer.from("\ufe0f"),
];

function source(kind = "entrypoint", file = "src/handler.c", line = 10) {
  return { kind, file, line, scope: "handle", description: "Attacker data reaches the operation." };
}

function evidence(file = "src/handler.c", line = 10) {
  return { file, line, description: "The source performs the operation without the required check." };
}

function confirmed() {
  return {
    verdict: "confirmed",
    fingerprint: "src-handler-missing-check",
    title: "Missing ownership check",
    description: "An attacker can reach an operation without the intended ownership check.",
    root_cause: "handle omits the ownership check before changing the object.",
    intended_behavior: "Only the object's owner can change it.",
    trace: [source("entrypoint"), source("propagation", "src/model.c", 20), source("sink", "src/store.c", 30)],
    evidence: [evidence()],
    conditions: [],
    execution: {
      attacker_perspective: "An unprivileged remote user with their own account.",
      payloads: ["An object identifier owned by another user."],
      instructions: ["Submit the identifier through the public operation."],
      observed_result: "The other user's object changes.",
    },
    remediation: { strategy: "Check ownership before the state change." },
    severity: {
      likelihood: { score: "medium", reason: "The operation is directly reachable." },
      impact: { score: "medium", reason: "The attacker changes one protected object." },
      overall_severity: "medium",
    },
    confidence: { score: "high", reason: "The source path and result were reproduced." },
  };
}

function needsValidation() {
  return {
    verdict: "needs_validation",
    fingerprint: "src-parser-size-hypothesis",
    title: "Unchecked parsed size",
    description: "A parsed size may reach an allocation without a limit.",
    claimed_root_cause: "parse_size may pass an unbounded value to allocate.",
    trace: [source()],
    evidence: [evidence()],
    blockers: ["The generated parser source is absent from this checkout."],
    validation_plan: {
      local: "Generate the parser and submit the smallest input that exceeds the documented limit.",
      deployment: "In an approved test deployment, confirm the request reaches the generated parser and record the bounded observable result.",
    },
  };
}

function rejected() {
  return {
    verdict: "rejected",
    fingerprint: "src-router-auth-bypass",
    title: "Authorization bypass in router",
    description: "The candidate claimed a route bypassed authorization.",
    claimed_root_cause: "dispatch was claimed to skip the authorization wrapper.",
    trace: [source("sink")],
    evidence: [evidence()],
    reason: "All routes pass through the authorization wrapper before dispatch.",
  };
}

function errorsFor(value) {
  return validateDocument(value, schema);
}

function runCli(contents, options = {}) {
  const { nodeArgs = [], timeout = CLI_TIMEOUT_MS } = options;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "validate-findings-"));
  const findingsPath = path.join(directory, "findings.json");
  try {
    fs.writeFileSync(findingsPath, contents);
    return spawnSync(process.execPath, [...nodeArgs, validatorPath, findingsPath], {
      encoding: "utf8",
      timeout,
    });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function cliOutput(result) {
  return `${result.stdout}${result.stderr}`;
}

function assertNoInjectedControlBytes(output) {
  const bytes = Buffer.isBuffer(output) ? output : Buffer.from(output, "utf8");
  for (const marker of TERMINAL_CONTROL_BYTES) {
    assert.equal(bytes.indexOf(marker), -1, `found raw control bytes ${marker.toString("hex")}`);
  }
}

function producerShapedFindings() {
  const demonstrated = confirmed();
  demonstrated.conditions = [{
    kind: "authentication_level",
    description: "The attacker needs a normal account.",
  }];
  demonstrated.execution.payloads = ["", " \t\r\n", "\u0000\u001f\u007f", "\u034f", "\ufe0f", "\ud800", "\udc00", "[{,}]\\\""];
  demonstrated.remediation.code_changes = [{
    file_name: "src/handler.c",
    fixed_code: "",
  }];

  const blocked = needsValidation();
  delete blocked.validation_plan.deployment;

  return [demonstrated, blocked, rejected()];
}

function rejectMutation(factory, mutate) {
  const value = factory();
  mutate(value);
  assert.notEqual(errorsFor([value]).length, 0);
}

test("schema is an actual top-level array with exactly three branches", () => {
  assert.equal(schema.type, "array");
  assert.equal(schema.items.oneOf.length, 3);
  assert.deepEqual(schema.items.oneOf.map((branch) => branch.properties.verdict.const), [
    "confirmed", "needs_validation", "rejected",
  ]);
  const confirmedSchema = schema.items.oneOf[0].properties;
  assert.equal(confirmedSchema.title.visibleContent, true);
  assert.equal(confirmedSchema.execution.properties.payloads.items.minLength, undefined);
  assert.equal(confirmedSchema.execution.properties.payloads.items.visibleContent, undefined);
  assert.equal(confirmedSchema.remediation.properties.code_changes.items.properties.fixed_code.minLength, undefined);
});

test("accepts a producer-shaped findings document through the CLI", () => {
  const result = runCli(JSON.stringify(producerShapedFindings()));
  assert.equal(result.status, 0, cliOutput(result));
  assert.match(result.stdout, /PASS: 3 findings valid/);
});

test("accepts empty output and each complete branch", () => {
  assert.deepEqual(errorsFor([]), []);
  assert.deepEqual(errorsFor([confirmed(), needsValidation(), rejected()]), []);
  const localOnly = needsValidation();
  delete localOnly.validation_plan.deployment;
  assert.deepEqual(errorsFor([localOnly]), []);
  const deploymentOnly = needsValidation();
  delete deploymentOnly.validation_plan.local;
  assert.deepEqual(errorsFor([deploymentOnly]), []);
});

test("allows a one-line finding trace", () => {
  const finding = confirmed();
  finding.trace = [source("entrypoint")];
  assert.deepEqual(errorsFor([finding]), []);
});

test("rejects empty required content", () => {
  const cases = [
    [confirmed, (finding) => { finding.title = ""; }],
    [confirmed, (finding) => { finding.title = "   "; }],
    [confirmed, (finding) => { finding.evidence = []; }],
    [confirmed, (finding) => { finding.execution.payloads = []; }],
    [confirmed, (finding) => { finding.execution.instructions = []; }],
    [confirmed, (finding) => { finding.execution.observed_result = ""; }],
    [confirmed, (finding) => { finding.remediation.strategy = ""; }],
    [needsValidation, (finding) => { finding.blockers = []; }],
    [needsValidation, (finding) => { finding.validation_plan = {}; }],
    [needsValidation, (finding) => { finding.validation_plan = { local: " " }; }],
    [rejected, (finding) => { finding.claimed_root_cause = ""; }],
  ];
  for (const [factory, mutate] of cases) rejectMutation(factory, mutate);
});

test("preserves exact payload and replacement-code strings", () => {
  const finding = confirmed();
  const payloads = ["", " \t\r\n", "\u0000\u001f\u007f", "\u034f", "\ufe0f", "\ud800", "\udc00"];
  const fixedCode = "\u0000 \t\r\n\u001f\u007f\u034f\ufe0f\ud800x\udc00";
  finding.execution.payloads = payloads.slice();
  finding.remediation.code_changes = [{ file_name: "src/handler.c", fixed_code: fixedCode }];

  assert.deepEqual(errorsFor([finding]), []);
  assert.deepEqual(finding.execution.payloads, payloads);
  assert.equal(finding.remediation.code_changes[0].fixed_code, fixedCode);
});

test("rejects invalid scalars and whitespace, control, format, or default-ignorable prose", () => {
  for (const invisible of ["\u0000\t\r\n\u001f\u007f\u200b", "\u034f", "\ufe0f", "\ud800", "\udc00", "visible\ud800"]) {
    const cases = [
      [confirmed, (finding) => { finding.title = invisible; }],
      [confirmed, (finding) => { finding.trace[0].scope = invisible; }],
      [confirmed, (finding) => { finding.evidence[0].description = invisible; }],
      [confirmed, (finding) => { finding.execution.instructions = [invisible]; }],
      [confirmed, (finding) => { finding.remediation.strategy = invisible; }],
      [confirmed, (finding) => { finding.severity.impact.reason = invisible; }],
      [confirmed, (finding) => { finding.confidence.reason = invisible; }],
      [needsValidation, (finding) => { finding.blockers = [invisible]; }],
      [needsValidation, (finding) => { finding.validation_plan = { local: invisible }; }],
      [rejected, (finding) => { finding.reason = invisible; }],
    ];
    for (const [factory, mutate] of cases) rejectMutation(factory, mutate);
  }
});

test("quotes input-derived controls in direct validation values and paths", () => {
  const finding = confirmed();
  finding.trace[0].kind = `invalid-${TERMINAL_CONTROL_PAYLOAD}`;
  finding.execution[`extra-${TERMINAL_CONTROL_PAYLOAD}`] = "value";

  const cyclic = {};
  cyclic[`path-${TERMINAL_CONTROL_PAYLOAD}`] = cyclic;
  const output = [
    ...errorsFor([finding]),
    ...collect(cyclic, { type: "object" }, "$input"),
  ].join("\n");

  for (const escaped of ["\\u001b", "\\u0007", "\\u0085", "\\u202e", "\\u034f", "\\ufe0f"]) {
    assert(output.includes(escaped), `missing escaped diagnostic ${escaped}`);
  }
  assertNoInjectedControlBytes(output);
});

test("rejects line zero", () => {
  rejectMutation(confirmed, (finding) => { finding.trace[0].line = 0; });
  rejectMutation(rejected, (finding) => { finding.evidence[0].line = 0; });
});

test("does not treat inherited or Object-prototype properties as schema properties", () => {
  rejectMutation(confirmed, (finding) => { finding.constructor = "not allowed"; });
  const inherited = Object.create({ verdict: "confirmed" });
  assert(errorsFor([inherited]).some((error) => error.includes("exactly one")));
  assert(collect(Object.create({ constructor: "inherited" }), {
    type: "object",
    properties: { constructor: { type: "string" } },
    required: ["constructor"],
    additionalProperties: false,
  }).some((error) => error.includes("missing required")));
});

test("oneOf requires exactly one passing branch", () => {
  assert(collect("value", { oneOf: [{ type: "string" }, { minLength: 1 }] }, "$test")
    .some((error) => error.includes("matched 2")));
  assert(collect(7, { oneOf: [{ type: "string" }, { minimum: 10 }] }, "$test")
    .some((error) => error.includes("matched 0")));
});

test("rejects duplicate fingerprints and unique array entries", () => {
  const first = confirmed();
  const second = rejected();
  second.fingerprint = first.fingerprint;
  assert(errorsFor([first, second]).some((error) => error.includes("duplicate of")));
  rejectMutation(needsValidation, (finding) => { finding.blockers = [finding.blockers[0], finding.blockers[0]]; });
});

test("uses canonical Set uniqueness for structured entries at the array limit", () => {
  const entries = Array.from({ length: LIMITS.arrayItems }, (_, id) => ({ id, label: String(id) }));
  assert.deepEqual(collect(entries, { type: "array", uniqueItems: true }), []);

  const duplicate = entries.slice(0, -1);
  duplicate.push({ label: "0", id: 0 });
  assert(collect(duplicate, { type: "array", uniqueItems: true })
    .some((error) => error.includes(`duplicate at index ${LIMITS.arrayItems - 1}`)));
});

test("bounds canonical uniqueness keys and Set storage", () => {
  const oversizedKey = "x".repeat(LIMITS.canonicalKeyBytes + 1);
  assert(collect([oversizedKey], { type: "array", uniqueItems: true })
    .some((error) => error.includes("canonical key exceeds")));

  const itemLength = Math.floor(LIMITS.uniqueSetBytes / 6);
  const largeUniqueItems = Array.from({ length: 6 }, (_, index) => `${index}${"x".repeat(itemLength)}`);
  assert(collect(largeUniqueItems, { type: "array", uniqueItems: true })
    .some((error) => error.includes("canonical uniqueness set exceeds")));
});

test("requires findings to be sorted by fingerprint", () => {
  const first = confirmed();
  const second = rejected();
  assert(errorsFor([second, first]).some((error) => error.includes("sorted lexicographically")));
});

test("rejects severity above demonstrated impact", () => {
  rejectMutation(confirmed, (finding) => {
    finding.severity.overall_severity = "high";
    finding.severity.impact.score = "medium";
  });
});

test("rejects unsafe source paths", () => {
  const badPaths = [
    "/etc/passwd",
    "../src/file.c",
    "src/../file.c",
    "src//file.c",
    "C:\\src\\file.c",
    "src/file:name.c",
    "src/file\nname.c",
    "src/file\u0001name.c",
    "src/file\u0085name.c",
    "src/file\u2028name.c",
    "src/file\u202ename.c",
    "src/file\u2066name.c",
    "src/file\u200dname.c",
    "src/file\u034fname.c",
    "src/file\ufe0fname.c",
    "src/file\ud800name.c",
    "src/file\udc00name.c",
    "CON",
    "src/con.txt",
    "src/PRN",
    "src/AUX.c",
    "src/NUL",
    "src/COM1.log",
    "src/lpt9",
    "src/CONIN$",
    "src/CONOUT$.txt",
    "src/CLOCK$.txt",
    "src/COM\u00b9.log",
    "src/LPT\u00b2.log",
    "src /file.c",
    "src./file.c",
    "src/file.c ",
    "src/file.c.",
  ];
  for (const badPath of badPaths) {
    rejectMutation(confirmed, (finding) => { finding.trace[0].file = badPath; });
  }
  rejectMutation(rejected, (finding) => { finding.evidence[0].file = "NUL.txt"; });
  rejectMutation(confirmed, (finding) => {
    finding.remediation.code_changes = [{ file_name: "src/file:name.c", fixed_code: "replacement" }];
  });
});

test("accepts legitimate Unicode source paths and prose", () => {
  const finding = confirmed();
  finding.title = "Finding \ud83d\ude00 cafe\u0301";
  finding.trace[0].file = "src/日本語/cafe\u0301-\ud83d\ude00.ts";
  finding.evidence[0].file = "src/mañana/файл.ts";
  finding.remediation.code_changes = [{
    file_name: "src/修正/éxito.ts",
    fixed_code: "replacement",
  }];
  assert.deepEqual(errorsFor([finding]), []);
});

test("CLI rejects input above the byte limit without an exception trace", () => {
  const result = runCli(Buffer.alloc(LIMITS.inputBytes + 1, 0x20));
  const output = cliOutput(result);
  assert.equal(result.status, 1, output);
  assert.match(output, new RegExp(`input exceeds ${LIMITS.inputBytes} byte limit`));
  assert.doesNotMatch(output, /RangeError|Maximum call stack|heap out of memory/i);
});

test("CLI rejects invalid UTF-8 without replacement or an exception trace", () => {
  const findings = producerShapedFindings();
  findings[0].execution.payloads = ["INVALID_UTF8"];
  const encoded = Buffer.from(JSON.stringify(findings));
  const marker = Buffer.from("INVALID_UTF8");
  const markerOffset = encoded.indexOf(marker);
  assert.notEqual(markerOffset, -1);
  const malformed = Buffer.concat([
    encoded.subarray(0, markerOffset),
    Buffer.from([0x80]),
    encoded.subarray(markerOffset + marker.length),
  ]);

  const result = runCli(malformed);
  const output = cliOutput(result);
  assert.equal(result.status, 1, output);
  assert.match(output, /input is not valid UTF-8/);
  assert.doesNotMatch(output, /TypeError|stack|at validate-findings/i);
});

test("quotes input-derived controls in CLI validation errors", { skip: !HAS_SAFE_INPUT_OPEN }, () => {
  const finding = confirmed();
  finding.trace[0].kind = `invalid-${TERMINAL_CONTROL_PAYLOAD}`;
  finding.execution[`extra-${TERMINAL_CONTROL_PAYLOAD}`] = "value";
  const result = runCli(JSON.stringify([finding]));

  assert.equal(result.status, 1, cliOutput(result));
  assert.match(result.stderr, /\$\[0\]\.trace\[0\]\.kind/);
  assert.match(result.stderr, /\\u001b/);
  assert.match(result.stderr, /\\u202e/);
  assertNoInjectedControlBytes(result.stderr);
});

test("returns a generic syntax error without parser-supplied controls", { skip: !HAS_SAFE_INPUT_OPEN }, () => {
  const malformed = Buffer.concat([
    Buffer.from("["),
    Buffer.from(TERMINAL_CONTROL_PAYLOAD),
    Buffer.from("]"),
  ]);
  const result = runCli(malformed);

  assert.equal(result.status, 1, cliOutput(result));
  assert.equal(result.stderr, "Failed to parse findings JSON: invalid JSON syntax\n");
  assertNoInjectedControlBytes(result.stderr);
});

test("does not reflect controls from a failed CLI input path", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "validate-findings-path-"));
  const missingPath = path.join(directory, `missing-${TERMINAL_CONTROL_PAYLOAD}.json`);
  try {
    const result = spawnSync(process.execPath, [validatorPath, missingPath], {
      encoding: "utf8",
      timeout: CLI_TIMEOUT_MS,
    });
    assert.equal(result.status, 1, cliOutput(result));
    assert.match(result.stderr, /Failed to read findings JSON:/);
    assertNoInjectedControlBytes(result.stderr);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI rejects lone-surrogate prose without changing payload semantics", () => {
  const findings = producerShapedFindings();
  findings[0].title = "\ud800";
  const result = runCli(JSON.stringify(findings));
  const output = cliOutput(result);
  assert.equal(result.status, 1, output);
  assert.match(output, /must contain only valid Unicode scalar values/);
  assert.doesNotMatch(output, /stack|at validate-findings/i);
});

test("CLI rejects Unicode format controls in source paths", () => {
  const findings = producerShapedFindings();
  findings[0].trace[0].file = "src/file\u202ename.c";
  const result = runCli(JSON.stringify(findings));
  const output = cliOutput(result);
  assert.equal(result.status, 1, output);
  assert.match(output, /must be a safe repository-relative source path/);
  assert.doesNotMatch(output, /stack|at validate-findings/i);
});

test("CLI rejects a FIFO without blocking", { skip: process.platform === "win32" || !HAS_SAFE_INPUT_OPEN }, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "validate-findings-fifo-"));
  const fifoPath = path.join(directory, "findings.json");
  try {
    const created = spawnSync("mkfifo", [fifoPath], { encoding: "utf8", timeout: CLI_TIMEOUT_MS });
    assert.equal(created.status, 0, cliOutput(created));

    const result = spawnSync(process.execPath, [validatorPath, fifoPath], {
      encoding: "utf8",
      timeout: CLI_TIMEOUT_MS,
    });
    const output = cliOutput(result);
    assert.notEqual(result.error && result.error.code, "ETIMEDOUT", output);
    assert.equal(result.status, 1, output);
    assert.match(output, /input must be a regular file/);
    assert.doesNotMatch(output, /stack|at validate-findings/i);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI rejects a symlink without following it", { skip: process.platform === "win32" || !HAS_SAFE_INPUT_OPEN }, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "validate-findings-symlink-"));
  const targetPath = path.join(directory, "target.json");
  const symlinkPath = path.join(directory, "findings.json");
  try {
    fs.writeFileSync(targetPath, JSON.stringify(producerShapedFindings()));
    fs.symlinkSync(targetPath, symlinkPath);
    const result = spawnSync(process.execPath, [validatorPath, symlinkPath], {
      encoding: "utf8",
      timeout: CLI_TIMEOUT_MS,
    });
    const output = cliOutput(result);
    assert.notEqual(result.error && result.error.code, "ETIMEDOUT", output);
    assert.equal(result.status, 1, output);
    assert.match(output, /input must not be a symlink/);
    assert.doesNotMatch(output, /stack|at validate-findings/i);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI rejects input above the nesting-depth limit without an exception trace", () => {
  const levels = LIMITS.nestingDepth + 1;
  const result = runCli(`${"[".repeat(levels)}0${"]".repeat(levels)}`);
  const output = cliOutput(result);
  assert.equal(result.status, 1, output);
  assert.match(output, new RegExp(`${LIMITS.nestingDepth} level nesting depth limit`));
  assert.doesNotMatch(output, /RangeError|Maximum call stack|heap out of memory/i);
});

test("CLI rejects an oversized array without an exception trace", () => {
  const result = runCli(JSON.stringify(Array(LIMITS.arrayItems + 1).fill(null)));
  const output = cliOutput(result);
  assert.equal(result.status, 1, output);
  assert.match(output, new RegExp(`${LIMITS.arrayItems} item array limit`));
  assert.doesNotMatch(output, /RangeError|Maximum call stack|heap out of memory/i);
});

test("checks pattern and branch invariants", () => {
  rejectMutation(rejected, (finding) => { finding.fingerprint = "not stable"; });
  rejectMutation(needsValidation, (finding) => {
    finding.severity = { impact: { score: "low" }, overall_severity: "low" };
  });
});

test("rejects unsupported and malformed schema keywords", () => {
  assert(collectSchemaErrors({ type: "string", format: "uuid" }).some((error) => error.includes("format")));
  assert(collectSchemaErrors({ type: "string", pattern: "[" }).some((error) => error.includes("regular expression")));
  assert(collectSchemaErrors({ type: "string", visibleContent: "yes" }).some((error) => error.includes("expected boolean")));
  assert(collectSchemaErrors({ type: "array", visibleContent: true }).some((error) => error.includes("requires type")));
  assert.notEqual(validateDocument([], { type: "array", maxItems: 1 }).length, 0);
});

test("caps malformed 1000-finding validation output", () => {
  assert.equal(errorsFor(Array.from({ length: LIMITS.arrayItems }, () => null)).length, LIMITS.validationErrors);
  if (!HAS_SAFE_INPUT_OPEN) return;

  const result = runCli(JSON.stringify(Array.from({ length: LIMITS.arrayItems }, () => null)));
  const output = cliOutput(result);
  assert.notEqual(result.error && result.error.code, "ETIMEDOUT", output);
  assert.equal(result.status, 1, output);
  assert.match(output, /output capped at 100/);
  assert(output.length < 20000, `unexpected output length ${output.length}`);
  assert.doesNotMatch(output, /RangeError|Maximum call stack|stack|at validate-findings/i);
});

test("caps amplified in-limit findings output under a constrained Node heap", { skip: !HAS_SAFE_INPUT_OPEN }, () => {
  const findings = Array.from({ length: 750 }, () => ({
    verdict: "confirmed",
    trace: Array.from({ length: LIMITS.arrayItems }, () => 0),
    evidence: Array.from({ length: LIMITS.arrayItems }, () => 0),
  }));
  const contents = JSON.stringify(findings);
  assert(contents.length > 3 * 1000 * 1000, `hostile input too small: ${contents.length}`);
  assert(contents.length <= LIMITS.inputBytes, `hostile input over limit: ${contents.length}`);

  const result = runCli(contents, {
    nodeArgs: ["--max-old-space-size=64"],
    timeout: HOSTILE_CLI_TIMEOUT_MS,
  });
  const output = cliOutput(result);
  assert.notEqual(result.error && result.error.code, "ETIMEDOUT", output);
  assert.equal(result.status, 1, output);
  assert.match(output, /output capped at 100/);
  assert(output.length < 20000, `unexpected output length ${output.length}`);
  assert.doesNotMatch(output, /heap out of memory|allocation failed|RangeError|Maximum call stack/i);
});

test("keeps shared helpers aligned with the coverage-ledger validator", () => {
  const findingsModule = require("./validate-findings.cjs");
  const ledgerModule = require("./validate-coverage-ledger.cjs");

  for (const name of [
    "VISIBLE_CONTENT",
    "PATH_FORBIDDEN_CHARACTER",
    "WINDOWS_RESERVED_COMPONENT",
    "UNSAFE_DIAGNOSTIC_CHARACTER",
  ]) {
    assert.equal(findingsModule[name].source, ledgerModule[name].source, `${name} source`);
    assert.equal(findingsModule[name].flags, ledgerModule[name].flags, `${name} flags`);
  }

  const sharedLimitKeys = Object.keys(findingsModule.LIMITS)
    .filter((key) => Object.prototype.hasOwnProperty.call(ledgerModule.LIMITS, key))
    .sort();
  assert.deepEqual(sharedLimitKeys, ["inputBytes", "nestingDepth", "validationErrors"]);
  for (const key of sharedLimitKeys) {
    assert.equal(findingsModule.LIMITS[key], ledgerModule.LIMITS[key], `LIMITS.${key}`);
  }

  const pathCorpus = [
    "src/handler.js",
    "src/caf\u00e9/handler.js",
    "src/\u65e5\u672c\u8a9e/\u0444\u0430\u0439\u043b.ts",
    "src/cloc\u212a$.txt",
    "src/CLOCK$.txt",
    "src/con.txt",
    "CON",
    "src/COM\u00b9.log",
    "src/lpt\u00b3",
    "/etc/passwd",
    "../src/file.c",
    "src/../file.c",
    "src//file.c",
    "src\\file.c",
    "src/file:name.c",
    "~home/file.c",
    "C:/file.c",
    "src/file.c ",
    "src/file.c.",
    "src/file\u202ename.c",
    "src/file\u200b.js",
    "src/file\u034f.js",
    "src/file\ufe0f.js",
    "src/file\ud800name.c",
    "src/file\udc00name.c",
  ];
  for (const value of pathCorpus) {
    assert.equal(
      findingsModule.isSafeRelativeSourcePath(value),
      ledgerModule.isSafeRelativePath(value),
      `path verdict diverges for ${JSON.stringify(value)}`,
    );
  }
  assert.equal(findingsModule.isSafeRelativeSourcePath("src/cloc\u212a$.txt"), false);
  assert.equal(ledgerModule.isSafeRelativePath("src/cloc\u212a$.txt"), false);

  const proseCorpus = [
    "Valid prose.",
    "caf\u00e9",
    "",
    " \t\r\n",
    "\u200b",
    "\u034f",
    "\ufe0f",
    "\ud800",
    "\udc00",
    "visible\ud800",
  ];
  for (const value of proseCorpus) {
    assert.equal(
      findingsModule.hasVisibleProse(value),
      ledgerModule.hasVisibleProse(value),
      `prose verdict diverges for ${JSON.stringify(value)}`,
    );
  }
});
