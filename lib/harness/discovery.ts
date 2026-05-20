import * as fs from "node:fs";
import * as path from "node:path";
import type { WorkspaceConfig, WorkspaceProject } from "./types";
import {
	loadWorkspaceConfig,
	saveWorkspaceConfig,
	isWorkspaceMode,
} from "./config";

const STACK_DETECTORS: Record<string, { files: string[]; deps?: string[] }> = {
	"react-nextjs": { files: ["package.json"], deps: ["next", "react"] },
	"csharp-dotnet": { files: ["*.csproj", "*.sln"] },
	"csharp-aspnet": { files: ["*.csproj", "*.sln"] },
	"node-fastify": { files: ["package.json"], deps: ["fastify"] },
	"node-elysia": { files: ["package.json"], deps: ["elysia"] },
	"node-express": { files: ["package.json"], deps: ["express"] },
	"python-fastapi": {
		files: ["requirements.txt", "pyproject.toml"],
		deps: ["fastapi"],
	},
	"java-springboot": { files: ["pom.xml", "build.gradle", "build.gradle.kts"] },
	"go-std": { files: ["go.mod"] },
	terraform: { files: ["*.tf", "terraform.tf"] },
};

export function detectStack(projectRoot: string): string | null {
	for (const [stack, detector] of Object.entries(STACK_DETECTORS)) {
		const hasFiles = detector.files.some((pattern) => {
			if (pattern.includes("*")) {
				const dir = projectRoot;
				try {
					const entries = fs.readdirSync(dir);
					return entries.some((f) => {
						const ext = pattern.replace("*.", "");
						return f.endsWith(ext);
					});
				} catch {
					return false;
				}
			}
			return fs.existsSync(path.join(projectRoot, pattern));
		});
		if (!hasFiles) continue;

		if (detector.deps && detector.files.includes("package.json")) {
			try {
				const pkg = JSON.parse(
					fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8"),
				);
				const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
				if (detector.deps.some((dep) => dep in allDeps)) return stack;
			} catch {
				return stack;
			}
		} else if (!detector.deps) {
			return stack;
		}
	}
	return null;
}

export function scanWorkspace(workspaceRoot: string): WorkspaceConfig {
	const existing = loadWorkspaceConfig(workspaceRoot);
	const projects: WorkspaceProject[] =
		existing && isWorkspaceMode(existing) ? [...existing.projects] : [];
	const existingPaths = new Set(projects.map((p) => p.path));

	const entries = fs.readdirSync(workspaceRoot, { withFileTypes: true });
	for (const entry of entries) {
		if (
			!entry.isDirectory() ||
			entry.name.startsWith(".") ||
			entry.name === "node_modules"
		)
			continue;
		const projectPath = path.join(workspaceRoot, entry.name);
		if (existingPaths.has(entry.name)) continue;
		const stack = detectStack(projectPath);
		if (stack) {
			projects.push({
				path: entry.name,
				stack,
				config: `./${entry.name}/.harness.config.json`,
			});
		}
	}

	const config: WorkspaceConfig = {
		version: "1",
		generated: new Date().toISOString(),
		lastScan: new Date().toISOString(),
		projects,
		workspaceConfig: { autoRescan: true, reportPath: ".harness/reports" },
	};

	saveWorkspaceConfig(workspaceRoot, config);
	return config;
}

export function shouldRescan(workspaceRoot: string): boolean {
	const config = loadWorkspaceConfig(workspaceRoot);
	if (!config || !isWorkspaceMode(config)) return true;
	if (!config.workspaceConfig.autoRescan) return false;
	const lastScan = new Date(config.lastScan).getTime();
	const now = Date.now();
	return now - lastScan > 5 * 60 * 1000;
}
