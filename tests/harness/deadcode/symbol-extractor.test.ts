// tests/harness/deadcode/symbol-extractor.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { extractSymbols } from '../../../lib/harness/deadcode/symbol-extractor';

const TEST_DIR = path.join(__dirname, '..', '..', '..', 'tmp-test-harness');

function setup() {
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
}

function teardown() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

describe('extractSymbols', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('extracts exported functions', () => {
    const file = path.join(TEST_DIR, 'auth.ts');
    fs.writeFileSync(file, `export function authenticate() {}\nexport async function validateToken() {}`);
    const symbols = extractSymbols(file);
    expect(symbols).toHaveLength(2);
    expect(symbols[0].name).toBe('authenticate');
    expect(symbols[0].kind).toBe('function');
  });

  test('extracts exported classes', () => {
    const file = path.join(TEST_DIR, 'service.ts');
    fs.writeFileSync(file, `export class AuthService {}`);
    const symbols = extractSymbols(file);
    expect(symbols).toHaveLength(1);
    expect(symbols[0].name).toBe('AuthService');
    expect(symbols[0].kind).toBe('class');
  });

  test('extracts arrow function exports', () => {
    const file = path.join(TEST_DIR, 'handler.ts');
    fs.writeFileSync(file, `export const handleRequest = (req, res) => {}`);
    const symbols = extractSymbols(file);
    expect(symbols.some(s => s.name === 'handleRequest')).toBe(true);
  });

  test('returns empty for non-existent file', () => {
    expect(extractSymbols('/nonexistent/file.ts')).toEqual([]);
  });
});
