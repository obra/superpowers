// lib/harness/deadcode/import-graph.ts

import * as fs from "node:fs";
import * as path from "node:path";

export interface ImportEdge {
	from: string;
	to: string;
	importedSymbols: string[];
}

export function buildImportGraph(
	projectRoot: string,
	fileExtensions: string[] = [".ts", ".tsx", ".js"],
): ImportEdge[] {
	const edges: ImportEdge[] = [];
	const importRegex =
		/(?:import\s+(?:.*?\s+from\s+)?['"](.+?)['"]|require\(['"](.+?)['"]\))/g;

	function scanDir(dir: string) {
		if (!fs.existsSync(dir)) return;
		try {
			const entries = fs.readdirSync(dir, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);
				if (
					entry.isDirectory() &&
					!["node_modules", ".git", ".next", "dist", "build"].includes(
						entry.name,
					)
				) {
					scanDir(fullPath);
				} else if (fileExtensions.some((ext) => entry.name.endsWith(ext))) {
					try {
						const content = fs.readFileSync(fullPath, "utf-8");
						let match;
						while ((match = importRegex.exec(content)) !== null) {
							const importPath = match[1] || match[2];
							if (importPath.startsWith(".")) {
								const resolved = resolveImport(
									fullPath,
									importPath,
									projectRoot,
									fileExtensions,
								);
								if (resolved) {
									edges.push({
										from: fullPath,
										to: resolved,
										importedSymbols: [],
									});
								}
							}
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
	return edges;
}

function resolveImport(
	fromFile: string,
	importPath: string,
	projectRoot: string,
	extensions: string[],
): string | null {
	const fromDir = path.dirname(fromFile);
	const candidate = path.resolve(fromDir, importPath);

	if (fs.existsSync(candidate)) return candidate;

	for (const ext of extensions) {
		if (fs.existsSync(candidate + ext)) return candidate + ext;
		if (fs.existsSync(candidate + "/index" + ext))
			return candidate + "/index" + ext;
	}

	return null;
}

export function getImporters(filePath: string, edges: ImportEdge[]): string[] {
	return edges.filter((e) => e.to === filePath).map((e) => e.from);
}
