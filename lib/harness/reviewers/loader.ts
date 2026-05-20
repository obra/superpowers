import * as fs from "node:fs";
import * as path from "node:path";
const REVIEWERS_DIR = path.resolve(__dirname);
const STACKS_DIR = path.join(REVIEWERS_DIR, "stacks");
const STACK_FILE_MAP: Record<string, string> = {
	"react-nextjs": "react-nextjs.md",
	"csharp-dotnet": "csharp-dotnet.md",
	"csharp-aspnet": "csharp-aspnet.md",
	"node-fastify": "node-fastify.md",
	"node-elysia": "node-elysia.md",
	"node-express": "node-express.md",
	"node-nestjs": "node-nestjs.md",
	"node-drizzle-typeorm": "node-drizzle-typeorm.md",
	"python-fastapi": "python-fastapi.md",
	"java-springboot": "java-springboot.md",
	"go-std": "go-std.md",
	terraform: "terraform.md",
};
export function loadBasePrompt(): string {
	const promptPath = path.join(REVIEWERS_DIR, "base-prompt.md");
	if (!fs.existsSync(promptPath)) {
		throw new Error(`Base reviewer prompt not found at ${promptPath}`);
	}
	return fs.readFileSync(promptPath, "utf-8");
}
export function loadStackPrompt(stack: string): string {
	const fileName = STACK_FILE_MAP[stack];
	if (!fileName) {
		return "";
	}
	const promptPath = path.join(STACKS_DIR, fileName);
	if (!fs.existsSync(promptPath)) {
		return "";
	}
	return fs.readFileSync(promptPath, "utf-8");
}
export function loadReviewerPrompt(stacks: string[]): string {
	const base = loadBasePrompt();
	const parts = [base];
	for (const stack of stacks) {
		const stackPrompt = loadStackPrompt(stack);
		if (stackPrompt) {
			parts.push(`\n---\n\n${stackPrompt}`);
		}
	}
	return parts.join("\n");
}
export function getAvailableStacks(): string[] {
	if (!fs.existsSync(STACKS_DIR)) return [];
	return fs
		.readdirSync(STACKS_DIR)
		.filter((f) => f.endsWith(".md"))
		.map((f) => f.replace(".md", ""));
}
export function resolveStacksForFiles(changedFiles: string[]): string[] {
	const stacks = new Set<string>();
	for (const file of changedFiles) {
		const ext = path.extname(file).toLowerCase();
		const basename = path.basename(file).toLowerCase();
		const isNextFrontend =
			file.includes("pages/") ||
			file.includes("app/") ||
			file.includes("components/") ||
			basename.includes("page.") ||
			basename.includes("layout.") ||
			basename.includes("component.");

		if (isNextFrontend && [".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
			stacks.add("react-nextjs");
		}

		const isNodeBackend =
			file.includes("routes/") ||
			file.includes("controllers/") ||
			file.includes("middleware/") ||
			file.includes("services/") ||
			file.includes("handlers/") ||
			file.includes("api/") ||
			file.includes("server.") ||
			file.includes("app.") ||
			basename.includes("route.") ||
			basename.includes("controller.") ||
			basename.includes("middleware.") ||
			basename.includes("server.");

		if (isNodeBackend && [".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(ext)) {
			const isNestJs =
				file.includes("modules/") ||
				file.includes("guards/") ||
				file.includes("interceptors/") ||
				file.includes("pipes/") ||
				file.includes("providers/") ||
				basename.includes("module.") ||
				basename.includes("guard.") ||
				basename.includes("interceptor.") ||
				basename.includes("pipe.") ||
				basename.includes("decorator.");

			if (isNestJs) {
				stacks.add("node-nestjs");
			} else {
				stacks.add("node-express");
			}
		}

		if ([".cs", ".csproj", ".sln"].includes(ext)) {
			stacks.add("csharp-aspnet");
		}
		// csharp-dotnet is detected via .cs/.csproj/.sln — same as csharp-aspnet
		// The discovery system handles priority; loader just needs the extension mapping
		if ([".tf", ".tfvars", ".tf.json"].includes(ext)) {
			stacks.add("terraform");
		}
		if ([".py", ".pyi"].includes(ext)) {
			stacks.add("python-fastapi");
		}
		if (
			["pom.xml", "build.gradle", "build.gradle.kts"].some((f) =>
				file.endsWith(f),
			) ||
			[".java"].includes(ext)
		) {
			stacks.add("java-springboot");
		}
		if ([".go"].includes(ext)) {
			stacks.add("go-std");
		}
		// Fastify and Elysia are detected via package.json deps in the detection phase
		// but we also check for common file patterns
		if (
			file.includes("routes/") ||
			file.includes("handlers/") ||
			file.includes("plugins/") ||
			basename.includes("app.") ||
			basename.includes("server.")
		) {
			// These could be fastify or elysia — the detection phase resolves which
			// For loader purposes, we add both and the detection system filters
		}
	}
	return Array.from(stacks);
}

export function detectOrmFromDiff(gitDiff: string): string[] {
	const orms: string[] = [];
	if (
		gitDiff.includes("drizzle-orm") ||
		gitDiff.includes("drizzle-kit") ||
		gitDiff.includes("drizzle.config") ||
		gitDiff.includes("$inferSelect") ||
		gitDiff.includes("$inferInsert") ||
		gitDiff.includes("pgTable") ||
		gitDiff.includes("sqliteTable") ||
		gitDiff.includes("mysqlTable")
	) {
		orms.push("node-drizzle-typeorm");
	}
	if (
		gitDiff.includes("typeorm") ||
		gitDiff.includes("@Entity") ||
		gitDiff.includes("@Column") ||
		gitDiff.includes("@Repository") ||
		gitDiff.includes("createQueryBuilder") ||
		gitDiff.includes("TypeOrmModule")
	) {
		if (!orms.includes("node-drizzle-typeorm")) {
			orms.push("node-drizzle-typeorm");
		}
	}
	return orms;
}

export function buildReviewerPrompt(
	changedFiles: string[],
	gitDiff: string,
	stacks?: string[],
): string {
	const resolvedStacks = stacks ?? [
		...resolveStacksForFiles(changedFiles),
		...detectOrmFromDiff(gitDiff),
	];
	const basePrompt = loadReviewerPrompt(resolvedStacks);
	const contextHeader = [
		"## Review Context",
		"",
		`**Files under review:**`,
		...changedFiles.map((f) => `- ${f}`),
		"",
		`**Active technology rules:** ${resolvedStacks.length > 0 ? resolvedStacks.join(", ") : "universal only"}`,
		"",
		"## Git Diff",
		"",
		"```diff",
		gitDiff,
		"```",
		"",
	].join("\n");
	return `${contextHeader}\n\n${basePrompt}`;
}
