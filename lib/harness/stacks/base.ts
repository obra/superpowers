import { IStackHandler, SecurityTool, DomainCheck } from '../types';

export abstract class BaseStackHandler implements IStackHandler {
  abstract name: string;
  abstract detect(projectRoot: string): boolean;
  abstract lintCmd(): string;
  abstract typecheckCmd(): string;
  abstract testCmd(files?: string[]): string;
  abstract coverageCmd(): string;
  abstract securityTools(): SecurityTool[];
  abstract domainChecks(domain: 'frontend' | 'backend' | 'infra'): DomainCheck[];
}
