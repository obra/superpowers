#!/bin/bash
# Sets up a scratch repo with deliberate CI failures to exercise the skills.

set -euo pipefail

SCRATCH=/tmp/superpowers-integration-test
rm -rf "$SCRATCH"
mkdir -p "$SCRATCH"
cd "$SCRATCH"

git init -q
git checkout -q -b main

# Minimal Node project with lint, typecheck, test gates.
cat > package.json <<'EOF'
{
  "name": "scratch",
  "version": "0.0.0",
  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "node --test"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts"]
}
EOF

mkdir -p src .github/workflows
cat > .github/workflows/ci.yml <<'EOF'
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
EOF

cat > src/index.ts <<'EOF'
export function add(a: number, b: number): number {
  return a + b;
}
EOF

cat > src/index.test.ts <<'EOF'
import { test } from 'node:test';
import assert from 'node:assert';
import { add } from './index.ts';

test('add', () => {
  assert.strictEqual(add(2, 3), 5);
});
EOF

git add .
git commit -q -m "Initial scratch project"

echo "Scratch repo ready at $SCRATCH"
echo "Open an agent session there and follow expected-outcomes.md"
