import * as fs from "node:fs";
import * as path from "node:path";
import { BaseStackHandler } from "./base";
import type { SecurityTool, DomainCheck } from "../types";

export class ReactNextJsStack extends BaseStackHandler {
	name = "react-nextjs";

	detect(projectRoot: string): boolean {
		try {
			const pkg = JSON.parse(
				fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8"),
			);
			const deps = { ...pkg.dependencies, ...pkg.devDependencies };
			return "next" in deps && "react" in deps;
		} catch {
			return false;
		}
	}

	lintCmd(): string {
		return "npx eslint . --format stylish";
	}
	typecheckCmd(): string {
		return "npx tsc --noEmit";
	}
	testCmd(files?: string[]): string {
		return files ? `npx jest ${files.join(" ")}` : "npx jest";
	}
	coverageCmd(): string {
		return "npx jest --coverage --coverageReporters=text-summary";
	}

	securityTools(): SecurityTool[] {
		return [
			{
				name: "semgrep",
				npmPackage: "semgrep",
				cmd: "npx semgrep --config=auto --json .",
				outputFormat: "json",
			},
			{
				name: "npmAudit",
				npmPackage: "",
				cmd: "npm audit --json",
				outputFormat: "json",
			},
		];
	}

	domainChecks(domain: "frontend" | "backend" | "infra"): DomainCheck[] {
		if (domain === "frontend") {
			return [{ name: "lighthouse", cmd: "npx lhci autorun", threshold: 90 }];
		}
		return [];
	}
}
