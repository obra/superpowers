import * as fs from "node:fs";
import * as path from "node:path";
import { BaseStackHandler } from "./base";
import type { SecurityTool, DomainCheck } from "../types";

export class CSharpDotNetStack extends BaseStackHandler {
	name = "csharp-dotnet";

	detect(projectRoot: string): boolean {
		try {
			const entries = fs.readdirSync(projectRoot);
			const hasProjectFile = entries.some(
				(f) => f.endsWith(".csproj") || f.endsWith(".sln"),
			);
			if (!hasProjectFile) return false;

			// Check for modern .NET patterns
			const csprojFiles = entries.filter((f) => f.endsWith(".csproj"));
			for (const csproj of csprojFiles) {
				const content = fs.readFileSync(
					path.join(projectRoot, csproj),
					"utf-8",
				);
				if (
					content.includes("Microsoft.NET.Sdk.Web") ||
					content.includes("WebApplication") ||
					content.includes("Minimal API")
				) {
					return true;
				}
			}

			// Check source files for WebApplicationBuilder pattern
			const allFiles = getAllFiles(projectRoot, [".cs"], 20);
			for (const file of allFiles) {
				try {
					const content = fs.readFileSync(file, "utf-8");
					if (
						content.includes("WebApplication.CreateBuilder") ||
						content.includes("WebApplicationBuilder")
					) {
						return true;
					}
				} catch {
					continue;
				}
			}

			// Fallback: if .csproj exists but no modern patterns, still detect
			return hasProjectFile;
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

function getAllFiles(
	dir: string,
	extensions: string[],
	maxDepth: number,
	currentDepth = 0,
): string[] {
	if (currentDepth >= maxDepth) return [];
	const results: string[] = [];
	try {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory() && !entry.name.startsWith(".")) {
				results.push(
					...getAllFiles(fullPath, extensions, maxDepth, currentDepth + 1),
				);
			} else if (
				entry.isFile() &&
				extensions.some((ext) => entry.name.endsWith(ext))
			) {
				results.push(fullPath);
			}
		}
	} catch {
		// ignore permission errors
	}
	return results;
}
