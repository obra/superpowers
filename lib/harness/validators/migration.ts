import type { ValidationResult } from "../types";
import * as fs from "node:fs";
import * as path from "node:path";

const DESTRUCTIVE_PATTERNS = [
	/DROP\s+TABLE/i,
	/DROP\s+COLUMN/i,
	/ALTER\s+.*\s+COLUMN.*\s+(SET\s+DATA\s+TYPE|TYPE)\s+/i,
	/ALTER\s+.*\s+DROP\s+CONSTRAINT/i,
];

const SAFE_ALTERNATIVES: Record<string, string> = {
	"DROP TABLE":
		"Use soft deletes (is_deleted column) + archive migration instead",
	"DROP COLUMN":
		"Mark column as deprecated, add new column, backfill, then remove in next release",
	"ALTER COLUMN TYPE":
		"Add new column, dual-write, backfill, switch reads, remove old column",
	"DROP CONSTRAINT": "Add new constraint as NOT VALID, validate in background",
};

export async function validateMigrations(
	cwd: string,
	stack: string,
): Promise<ValidationResult> {
	const start = Date.now();
	const warnings: string[] = [];
	const errors: string[] = [];

	const migrationPatterns = [
		"**/migrations/*.sql",
		"**/Migrations/*.cs",
		"**/*.up.sql",
	];
	let migrationFiles: string[] = [];

	for (const pattern of migrationPatterns) {
		try {
			const { execSync } = require("node:child_process");
			const result = execSync(`git ls-files "${pattern}"`, { cwd })
				.toString()
				.trim();
			if (result) migrationFiles = migrationFiles.concat(result.split("\n"));
		} catch {
			/* ignore */
		}
	}

	for (const file of migrationFiles) {
		const filePath = path.join(cwd, file);
		if (!fs.existsSync(filePath)) continue;
		const content = fs.readFileSync(filePath, "utf-8");

		for (const pattern of DESTRUCTIVE_PATTERNS) {
			const match = content.match(pattern);
			if (match) {
				const key =
					Object.keys(SAFE_ALTERNATIVES).find((k) => pattern.test(k)) ||
					"destructive operation";
				warnings.push(`${file}: ${match[0]} — ${SAFE_ALTERNATIVES[key]}`);
			}
		}
	}

	return {
		passed: errors.length === 0,
		errors: errors.map((e) => ({
			file: "",
			line: 0,
			column: 0,
			message: e,
			rule: "migration",
			severity: "error" as const,
		})),
		warnings,
		duration: Date.now() - start,
	};
}
