import * as fs from 'fs';
import * as path from 'path';
import { BaseStackHandler } from './base';
import { SecurityTool, DomainCheck } from '../types';

export class PythonFastApiStack extends BaseStackHandler {
  name = 'python-fastapi';
  detect(projectRoot: string): boolean {
    try {
      const req = fs.readFileSync(path.join(projectRoot, 'requirements.txt'), 'utf-8');
      return req.toLowerCase().includes('fastapi');
    } catch { return false; }
  }
  lintCmd(): string { return 'black --check .'; }
  typecheckCmd(): string { return 'mypy .'; }
  testCmd(): string { return 'pytest --tb=short'; }
  coverageCmd(): string { return 'pytest --cov=. --cov-report=term-missing'; }
  securityTools(): SecurityTool[] {
    return [{ name: 'bandit', npmPackage: 'bandit', cmd: 'bandit -r . -f json', outputFormat: 'json' }];
  }
  domainChecks(domain: 'frontend' | 'backend' | 'infra'): DomainCheck[] {
    return domain === 'backend' ? [{ name: 'openapi-check', cmd: 'openapi-spec-validator openapi.json' }] : [];
  }
}
