// lib/harness/drift/semantic-diff.ts

import * as fs from "node:fs";
import * as path from "node:path";
import type { SpecRequirement } from "./spec-reader";

export interface ImplementationSummary {
	requirement: SpecRequirement;
	matchingFiles: string[];
	matchingSymbols: string[];
	keywordMatchCount: number;
	totalKeywords: number;
	matchRatio: number;
}

function searchProject(
	projectRoot: string,
	keywords: string[],
	extensions: string[] = [".ts", ".tsx", ".js"],
): { files: string[]; symbols: string[]; matchedKeywords: string[] } {
	const files: string[] = [];
	const symbols: string[] = [];
	const matchedKeywordsSet = new Set<string>();
	const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
	const classRegex = /(?:export\s+)?class\s+(\w+)/g;

	function scanDir(dir: string) {
		if (!fs.existsSync(dir)) return;
		try {
			const entries = fs.readdirSync(dir, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);
				if (
					entry.isDirectory() &&
					!["node_modules", ".git", ".next", "dist"].includes(entry.name)
				) {
					scanDir(fullPath);
				} else if (extensions.some((ext) => entry.name.endsWith(ext))) {
					try {
						const content = fs.readFileSync(fullPath, "utf-8");
						const lowerContent = content.toLowerCase();
						const matchedKw = keywords.filter((kw) =>
							lowerContent.includes(kw.toLowerCase()),
						);
						if (matchedKw.length > 0) {
							files.push(fullPath);
							matchedKw.forEach((kw) => {
								matchedKeywordsSet.add(kw);
							});
							let match;
							while ((match = funcRegex.exec(content)) !== null) {
								symbols.push(match[1]);
							}
							funcRegex.lastIndex = 0;
							while ((match = classRegex.exec(content)) !== null) {
								symbols.push(match[1]);
							}
							classRegex.lastIndex = 0;
						}
					} catch {
						/* skip */
					}
				}
			}
		} catch {
			/* skip */
		}
	}

	scanDir(projectRoot);
	return { files, symbols, matchedKeywords: Array.from(matchedKeywordsSet) };
}

export function computeSemanticDiff(
	requirements: SpecRequirement[],
	projectRoot: string,
): ImplementationSummary[] {
	return requirements.map((req) => {
		const { files, symbols, matchedKeywords } = searchProject(
			projectRoot,
			req.keywords,
		);
		const keywordCoverage =
			req.keywords.length > 0
				? matchedKeywords.length / req.keywords.length
				: 0;

		return {
			requirement: req,
			matchingFiles: files.slice(0, 5),
			matchingSymbols: [...new Set(symbols)].slice(0, 10),
			keywordMatchCount: matchedKeywords.length,
			totalKeywords: req.keywords.length,
			matchRatio: keywordCoverage,
		};
	});
}
