export interface ValidationResult {
	passed: boolean;
	errors: ParsedError[];
	warnings: string[];
	duration: number;
}

export interface ParsedError {
	file: string;
	line: number;
	column: number;
	message: string;
	rule: string;
	severity: "error" | "warning";
}

export interface SecurityTool {
	name: string;
	npmPackage: string;
	cmd: string;
	outputFormat: "json" | "text";
}

export interface DomainCheck {
	name: string;
	cmd: string;
	threshold?: number;
}

export interface IStackHandler {
	name: string;
	detect(projectRoot: string): boolean;
	lintCmd(): string;
	typecheckCmd(): string;
	testCmd(files?: string[]): string;
	coverageCmd(): string;
	securityTools(): SecurityTool[];
	domainChecks(domain: "frontend" | "backend" | "infra"): DomainCheck[];
}

export interface HarnessConfig {
	coverageMin: number;
	securityScan: {
		enabled: boolean;
		tools: Record<string, boolean>;
	};
	domainSpecific: Record<
		string,
		{ enabled: boolean; budget?: Record<string, number> }
	>;
	timeout: { verifyLocal: number; verifyAll: number };
	failOn: {
		lint: "error" | "warning";
		coverage: "error" | "warning";
		security: "error" | "warning";
	};
}

export interface WorkspaceProject {
	path: string;
	stack: string;
	config?: string;
}

export interface WorkspaceConfig {
	version: string;
	generated: string;
	lastScan: string;
	projects: WorkspaceProject[];
	workspaceConfig: {
		autoRescan: boolean;
		reportPath: string;
	};
}

export interface ProjectConfig {
	version: string;
	generated: string;
	projectRoot: string;
	stack: string;
	config: string;
}

export interface VerifyReport {
	feature: string;
	mode: "verify-local" | "verify-all" | "verify-security";
	timestamp: string;
	duration: number;
	summary: {
		lint: { errors: number; warnings: number; details: string };
		typecheck: { passed: boolean; files: number };
		tests: { passed: number; total: number; framework: string };
		coverage: { percentage: number; target: number; filesBelow: number };
		patterns?: { violations: number; blocked: number; warned: number };
	};
	issues: {
		file: string;
		line: number;
		message: string;
		specRequirement?: string;
		suggestion: string;
	}[];
	recommendations: string[];
}
