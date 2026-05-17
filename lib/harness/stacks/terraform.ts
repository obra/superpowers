import * as fs from "node:fs";
import { BaseStackHandler } from "./base";
import type { SecurityTool, DomainCheck } from "../types";

export class TerraformStack extends BaseStackHandler {
	name = "terraform";
	detect(projectRoot: string): boolean {
		try {
			return fs.readdirSync(projectRoot).some((f) => f.endsWith(".tf"));
		} catch {
			return false;
		}
	}
	lintCmd(): string {
		return "terraform fmt -check -recursive";
	}
	typecheckCmd(): string {
		return "terraform validate";
	}
	testCmd(): string {
		return 'echo "No tests for Terraform"';
	}
	coverageCmd(): string {
		return 'echo "N/A"';
	}
	securityTools(): SecurityTool[] {
		return [
			{
				name: "checkov",
				npmPackage: "checkov",
				cmd: "checkov -d . --quiet",
				outputFormat: "json",
			},
		];
	}
	domainChecks(domain: "frontend" | "backend" | "infra"): DomainCheck[] {
		return domain === "infra"
			? [{ name: "tflint", cmd: "tflint --format=json" }]
			: [];
	}
}
