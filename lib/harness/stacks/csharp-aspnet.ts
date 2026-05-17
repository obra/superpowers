import * as fs from "node:fs";
import { BaseStackHandler } from "./base";
import type { SecurityTool, DomainCheck } from "../types";

export class CSharpAspNetStack extends BaseStackHandler {
	name = "csharp-aspnet";

	detect(projectRoot: string): boolean {
		try {
			const entries = fs.readdirSync(projectRoot);
			return entries.some((f) => f.endsWith(".csproj") || f.endsWith(".sln"));
		} catch {
			return false;
		}
	}

	lintCmd(): string {
		return "dotnet format --verify-no-changes";
	}
	typecheckCmd(): string {
		return "dotnet build --no-restore";
	}
	testCmd(files?: string[]): string {
		return files
			? `dotnet test ${files.join(" ")} --no-build`
			: "dotnet test --no-build";
	}
	coverageCmd(): string {
		return 'dotnet test --collect:"XPlat Code Coverage"';
	}

	securityTools(): SecurityTool[] {
		return [
			{
				name: "dotnet-audit",
				npmPackage: "",
				cmd: "dotnet list package --vulnerable",
				outputFormat: "text",
			},
		];
	}

	domainChecks(domain: "frontend" | "backend" | "infra"): DomainCheck[] {
		if (domain === "backend") {
			return [
				{
					name: "openapi-validate",
					cmd: "dotnet swagger validate",
					threshold: undefined,
				},
			];
		}
		return [];
	}
}
