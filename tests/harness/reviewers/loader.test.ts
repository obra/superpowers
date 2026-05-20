import * as fs from "fs";
import * as path from "path";
import {
	loadBasePrompt,
	loadStackPrompt,
	loadReviewerPrompt,
	getAvailableStacks,
	resolveStacksForFiles,
	detectOrmFromDiff,
	buildReviewerPrompt,
} from "../../../lib/harness/reviewers/loader";

const REVIEWERS_DIR = path.resolve(
	__dirname,
	"..",
	"..",
	"..",
	"lib",
	"harness",
	"reviewers",
);
const STACKS_DIR = path.join(REVIEWERS_DIR, "stacks");

describe("loadBasePrompt", () => {
	test("loads the base prompt successfully", () => {
		const prompt = loadBasePrompt();
		expect(prompt).toContain("Senior Code Reviewer");
		expect(prompt).toContain("Universal Engineering Checklist");
	});
});

describe("loadStackPrompt", () => {
	test("loads react-nextjs stack prompt", () => {
		const prompt = loadStackPrompt("react-nextjs");
		expect(prompt).toContain("React/Next.js");
	});

	test("loads csharp-aspnet stack prompt", () => {
		const prompt = loadStackPrompt("csharp-aspnet");
		expect(prompt).toContain("C#/ASP.NET");
	});

	test("loads terraform stack prompt", () => {
		const prompt = loadStackPrompt("terraform");
		expect(prompt).toContain("Terraform");
	});

	test("loads node-express stack prompt", () => {
		const prompt = loadStackPrompt("node-express");
		expect(prompt).toContain("Node.js");
	});

	test("loads node-nestjs stack prompt", () => {
		const prompt = loadStackPrompt("node-nestjs");
		expect(prompt).toContain("NestJS");
	});

	test("loads node-drizzle-typeorm stack prompt", () => {
		const prompt = loadStackPrompt("node-drizzle-typeorm");
		const hasDrizzle = prompt.includes("Drizzle");
		const hasTypeOrm = prompt.includes("TypeORM");
		expect(hasDrizzle || hasTypeOrm).toBe(true);
	});

	test("returns empty string for unknown stack", () => {
		const prompt = loadStackPrompt("unknown-stack");
		expect(prompt).toBe("");
	});
});

describe("loadReviewerPrompt", () => {
	test("combines base prompt with stack prompts", () => {
		const prompt = loadReviewerPrompt(["react-nextjs"]);
		expect(prompt).toContain("Senior Code Reviewer");
		expect(prompt).toContain("React/Next.js");
	});

	test("combines multiple stack prompts", () => {
		const prompt = loadReviewerPrompt(["react-nextjs", "terraform"]);
		expect(prompt).toContain("Senior Code Reviewer");
		expect(prompt).toContain("React/Next.js");
		expect(prompt).toContain("Terraform");
	});

	test("returns base prompt when no stacks provided", () => {
		const prompt = loadReviewerPrompt([]);
		expect(prompt).toContain("Senior Code Reviewer");
	});
});

describe("getAvailableStacks", () => {
	test("returns list of available stacks", () => {
		const stacks = getAvailableStacks();
		expect(stacks).toContain("react-nextjs");
		expect(stacks).toContain("csharp-aspnet");
		expect(stacks).toContain("terraform");
		expect(stacks).toContain("node-express");
		expect(stacks).toContain("node-nestjs");
		expect(stacks).toContain("node-drizzle-typeorm");
	});
});

describe("resolveStacksForFiles", () => {
	test("detects react-nextjs from frontend file paths", () => {
		const stacks = resolveStacksForFiles(["app/page.tsx"]);
		expect(stacks).toContain("react-nextjs");
	});

	test("detects react-nextjs from components path", () => {
		const stacks = resolveStacksForFiles(["components/Button.tsx"]);
		expect(stacks).toContain("react-nextjs");
	});

	test("detects react-nextjs from page file", () => {
		const stacks = resolveStacksForFiles(["src/pages/index.tsx"]);
		expect(stacks).toContain("react-nextjs");
	});

	test("detects node-express from routes path", () => {
		const stacks = resolveStacksForFiles(["routes/api.ts"]);
		expect(stacks).toContain("node-express");
	});

	test("detects node-express from controllers path", () => {
		const stacks = resolveStacksForFiles(["controllers/user.controller.ts"]);
		expect(stacks).toContain("node-express");
	});

	test("detects node-nestjs from modules path with controller basename", () => {
		const stacks = resolveStacksForFiles([
			"modules/auth/auth.controller.ts",
		]);
		expect(stacks).toContain("node-nestjs");
	});

	test("detects node-nestjs from services path with module basename", () => {
		const stacks = resolveStacksForFiles([
			"services/auth/auth.module.ts",
		]);
		expect(stacks).toContain("node-nestjs");
	});

	test("detects csharp-aspnet from .cs files", () => {
		const stacks = resolveStacksForFiles(["Controllers/HomeController.cs"]);
		expect(stacks).toContain("csharp-aspnet");
	});

	test("detects terraform from .tf files", () => {
		const stacks = resolveStacksForFiles(["main.tf"]);
		expect(stacks).toContain("terraform");
	});

	test("detects python-fastapi from .py files", () => {
		const stacks = resolveStacksForFiles(["app/main.py"]);
		expect(stacks).toContain("python-fastapi");
	});

	test("detects go-std from .go files", () => {
		const stacks = resolveStacksForFiles(["cmd/server/main.go"]);
		expect(stacks).toContain("go-std");
	});

	test("returns empty for non-matching files", () => {
		const stacks = resolveStacksForFiles(["README.md", "package.json"]);
		expect(stacks).toHaveLength(0);
	});

	test("detects multiple stacks from mixed files", () => {
		const stacks = resolveStacksForFiles([
			"app/page.tsx",
			"routes/api.ts",
			"main.tf",
		]);
		expect(stacks).toContain("react-nextjs");
		expect(stacks).toContain("node-express");
		expect(stacks).toContain("terraform");
	});
});

describe("detectOrmFromDiff", () => {
	test("detects drizzle from diff", () => {
		const diff = `+import { pgTable } from 'drizzle-orm/pg-core';`;
		const orms = detectOrmFromDiff(diff);
		expect(orms).toContain("node-drizzle-typeorm");
	});

	test("detects drizzle from $inferSelect", () => {
		const diff = `+type User = typeof users.$inferSelect;`;
		const orms = detectOrmFromDiff(diff);
		expect(orms).toContain("node-drizzle-typeorm");
	});

	test("detects typeorm from diff", () => {
		const diff = `+import { Entity, Column } from 'typeorm';`;
		const orms = detectOrmFromDiff(diff);
		expect(orms).toContain("node-drizzle-typeorm");
	});

	test("detects typeorm from @Entity decorator", () => {
		const diff = `+@Entity()\n+export class User {}`;
		const orms = detectOrmFromDiff(diff);
		expect(orms).toContain("node-drizzle-typeorm");
	});

	test("returns empty for diff without ORM references", () => {
		const diff = `+console.log('hello');`;
		const orms = detectOrmFromDiff(diff);
		expect(orms).toHaveLength(0);
	});
});

describe("buildReviewerPrompt", () => {
	test("builds prompt with changed files and diff", () => {
		const prompt = buildReviewerPrompt(
			["src/auth.ts"],
			"+export function auth() {}",
		);
		expect(prompt).toContain("Files under review");
		expect(prompt).toContain("src/auth.ts");
		expect(prompt).toContain("Git Diff");
		expect(prompt).toContain("+export function auth() {}");
	});

	test("includes active technology rules in header", () => {
		const prompt = buildReviewerPrompt(
			["app/page.tsx"],
			"+export default function Page() {}",
		);
		expect(prompt).toContain("Active technology rules");
		expect(prompt).toContain("react-nextjs");
	});

	test("uses provided stacks instead of auto-detection", () => {
		const prompt = buildReviewerPrompt(
			["random/file.txt"],
			"+some code",
			["terraform"],
		);
		expect(prompt).toContain("terraform");
	});
});
