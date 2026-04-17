import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function parseArgs(argv) {
  const args = {
    out: null,
    rules: '',
    rulesFile: null,
    target: process.cwd()
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === '--out' && next) {
      args.out = next;
      i += 1;
    } else if (token === '--rules' && next) {
      args.rules = next;
      i += 1;
    } else if (token === '--rules-file' && next) {
      args.rulesFile = next;
      i += 1;
    } else if (token === '--target' && next) {
      args.target = next;
      i += 1;
    }
  }

  return args;
}

function tryReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function detectStack(targetDir) {
  const flags = {
    node: fs.existsSync(path.join(targetDir, 'package.json')),
    python: fs.existsSync(path.join(targetDir, 'pyproject.toml')) || fs.existsSync(path.join(targetDir, 'requirements.txt')),
    go: fs.existsSync(path.join(targetDir, 'go.mod')),
    rust: fs.existsSync(path.join(targetDir, 'Cargo.toml')),
    java: fs.existsSync(path.join(targetDir, 'pom.xml')) || fs.existsSync(path.join(targetDir, 'build.gradle')) || fs.existsSync(path.join(targetDir, 'build.gradle.kts')),
    dotnet: fs.readdirSync(targetDir).some((name) => name.endsWith('.sln') || name.endsWith('.csproj'))
  };

  const stacks = [];
  if (flags.node) stacks.push('Node.js');
  if (flags.python) stacks.push('Python');
  if (flags.go) stacks.push('Go');
  if (flags.rust) stacks.push('Rust');
  if (flags.java) stacks.push('Java');
  if (flags.dotnet) stacks.push('.NET');

  return stacks.length ? stacks : ['General'];
}

function detectTesting(targetDir, packageJson) {
  const hints = [];

  if (packageJson && packageJson.scripts && packageJson.scripts.test) {
    hints.push(`npm test (${packageJson.scripts.test})`);
  }

  const deps = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {})
  };

  if (deps.vitest) hints.push('Vitest');
  if (deps.jest) hints.push('Jest');
  if (deps.mocha) hints.push('Mocha');
  if (deps.playwright) hints.push('Playwright');
  if (deps.cypress) hints.push('Cypress');

  if (fs.existsSync(path.join(targetDir, 'pytest.ini')) || fs.existsSync(path.join(targetDir, 'conftest.py'))) {
    hints.push('Pytest');
  }

  if (fs.existsSync(path.join(targetDir, 'go.mod'))) hints.push('go test');
  if (fs.existsSync(path.join(targetDir, 'Cargo.toml'))) hints.push('cargo test');

  return hints.length ? hints : ['Define and enforce a single primary test command'];
}

function listTopLevelFolders(targetDir) {
  const ignore = new Set(['.git', '.spectral', 'node_modules', '.venv', 'venv', 'dist', 'build']);
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !ignore.has(entry.name))
    .map((entry) => entry.name)
    .slice(0, 10);
}

function normalizeRules(rulesText) {
  if (!rulesText) return [];
  return rulesText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s*/, ''))
    .slice(0, 12);
}

function buildConstitution({ projectName, stacks, tests, folders, userRules, today }) {
  const stacksText = stacks.join(', ');
  const foldersText = folders.length ? folders.join(', ') : 'No major source folders detected yet';
  const userRulesText = userRules.length
    ? userRules.map((rule) => `- ${rule}`).join('\n')
    : '- No explicit user rules provided yet; start with defaults and refine in next iteration.';

  return `# ${projectName} Constitution

## Core Principles

### I. User-Intent First
Every implementation decision must map back to explicit user intent and stated constraints. When intent is ambiguous, ask before expanding scope.

### II. Minimal, Verifiable Changes
Prefer the smallest change that solves the task. Avoid broad refactors unless required by correctness or maintainability.

### III. Test and Validation Discipline
All behavior changes must be verified with the most relevant available test command(s): ${tests.join(', ')}.

### IV. Stack-Aligned Engineering
Project conventions must align with the detected stack: ${stacksText}. Use native tooling and idiomatic patterns for the detected ecosystem.

### V. Traceable Delivery
Changes must be reproducible and reviewable: clear file-level edits, deterministic scripts, and concise verification summaries.

## Additional Constraints

Detected top-level folders: ${foldersText}

User-supplied rules:
${userRulesText}

Operational constraints:
- Preserve existing project structure and naming unless explicitly requested.
- Keep generated artifacts under .spectral for workflow state and templates.
- Prefer script-driven generation over verbose in-chat generation to reduce token usage.

## Development Workflow

1. Clarify goal and constraints.
2. Initialize or refresh .spectral workspace with deterministic scripts.
3. Draft constitution and plans using project signals and user rules.
4. Implement in small, testable increments.
5. Validate with focused checks before completion.

## Governance

- This constitution is the default operating policy for the repository.
- Amendments are allowed when requested by the user or required by technical constraints.
- Every amendment should include a short rationale and effective date.

**Version**: 1.0.0 | **Ratified**: ${today} | **Last Amended**: ${today}
`;
}

export function generateConstitution({ targetDir = process.cwd(), outPath, rulesText = '' } = {}) {
  const resolvedTarget = path.resolve(targetDir);
  const packageJson = tryReadJson(path.join(resolvedTarget, 'package.json'));
  const stacks = detectStack(resolvedTarget);
  const tests = detectTesting(resolvedTarget, packageJson);
  const folders = listTopLevelFolders(resolvedTarget);
  const userRules = normalizeRules(rulesText);
  const today = new Date().toISOString().slice(0, 10);
  const projectName = path.basename(resolvedTarget) || 'Project';

  const finalOutPath = outPath
    ? path.resolve(outPath)
    : path.join(resolvedTarget, '.spectral', 'memory', 'constitution.md');

  fs.mkdirSync(path.dirname(finalOutPath), { recursive: true });

  const content = buildConstitution({
    projectName,
    stacks,
    tests,
    folders,
    userRules,
    today
  });

  fs.writeFileSync(finalOutPath, content, 'utf8');
  return { outPath: finalOutPath, projectName, stacks, tests };
}

function cli() {
  const args = parseArgs(process.argv);
  let rulesText = args.rules || '';

  if (args.rulesFile) {
    const rulesFilePath = path.resolve(args.rulesFile);
    if (fs.existsSync(rulesFilePath)) {
      rulesText = fs.readFileSync(rulesFilePath, 'utf8');
    }
  }

  const result = generateConstitution({
    targetDir: args.target,
    outPath: args.out,
    rulesText
  });

  console.log(`Constitution generated: ${result.outPath}`);
  console.log(`Detected stack: ${result.stacks.join(', ')}`);
  console.log(`Detected test commands/frameworks: ${result.tests.join(', ')}`);
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  cli();
}
