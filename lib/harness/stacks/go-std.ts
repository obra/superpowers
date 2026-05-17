import * as fs from 'fs';
import * as path from 'path';
import { BaseStackHandler } from './base';
import { SecurityTool, DomainCheck } from '../types';

export class GoStdStack extends BaseStackHandler {
  name = 'go-std';
  detect(projectRoot: string): boolean {
    return fs.existsSync(path.join(projectRoot, 'go.mod'));
  }
  lintCmd(): string { return 'gofmt -l .'; }
  typecheckCmd(): string { return 'go build ./...'; }
  testCmd(): string { return 'go test ./...'; }
  coverageCmd(): string { return 'go test -coverprofile=coverage.out && go tool cover -func=coverage.out'; }
  securityTools(): SecurityTool[] {
    return [{ name: 'gosec', npmPackage: 'gosec', cmd: 'gosec -fmt=json ./...', outputFormat: 'json' }];
  }
  domainChecks(domain: 'frontend' | 'backend' | 'infra'): DomainCheck[] {
    return domain === 'backend' ? [{ name: 'go-vet', cmd: 'go vet ./...' }] : [];
  }
}
